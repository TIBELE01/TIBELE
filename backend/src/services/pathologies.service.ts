/**
 * Accès aux données des pathologies (lecture publique).
 */
import { prisma } from '../config/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { NotFoundError } from '../errors/index.js';
import { escapeLike } from '../utils/sql.js';
import { toSkipTake } from '../utils/pagination.js';

/** Résumé affiché dans les listes et résultats de recherche. */
export interface PathologySummary {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  imageUrl: string | null;
}

// `search_vector` (colonne générée) n'est jamais renvoyé : on sélectionne explicitement.
const summarySelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  imageUrl: true,
} satisfies Prisma.PathologySelect;

const detailSelect = {
  ...summarySelect,
  definition: true,
  exams: true,
  referenceDiagnosis: true,
  onSiteTreatment: true,
  dischargePrescription: true,
  prevention: true,
  references: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { questions: true } },
} satisfies Prisma.PathologySelect;

export interface ListParams {
  page: number;
  limit: number;
  q?: string | undefined;
}

export async function listPathologies(
  params: ListParams,
): Promise<{ items: PathologySummary[]; total: number }> {
  const { skip, take } = toSkipTake(params.page, params.limit);

  if (!params.q) {
    const [items, total] = await Promise.all([
      prisma.pathology.findMany({
        select: summarySelect,
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      prisma.pathology.count(),
    ]);
    return { items, total };
  }
  return searchPathologies(params.q, skip, take);
}

/**
 * Recherche : full-text français sans accents (colonne `search_vector`, index GIN)
 * OU correspondance partielle sur le titre (ILIKE, servi par l'index trigramme).
 * Tri par pertinence, puis par ordre alphabétique. Requêtes paramétrées via `Prisma.sql`.
 */
async function searchPathologies(q: string, skip: number, take: number) {
  const tsQuery = Prisma.sql`websearch_to_tsquery('public.french_unaccent'::regconfig, ${q}::text)`;
  const like = `%${escapeLike(q)}%`;
  const where = Prisma.sql`search_vector @@ ${tsQuery} OR title ILIKE ${like}`;

  const [items, counts] = await Promise.all([
    prisma.$queryRaw<PathologySummary[]>(Prisma.sql`
      SELECT id, title, slug, short_description AS "shortDescription", image_url AS "imageUrl"
      FROM public.pathologies
      WHERE ${where}
      ORDER BY ts_rank(search_vector, ${tsQuery}) DESC, title ASC, id ASC
      LIMIT ${take} OFFSET ${skip}`),
    prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`SELECT count(*)::int AS total FROM public.pathologies WHERE ${where}`,
    ),
  ]);
  return { items, total: counts[0]?.total ?? 0 };
}

export async function getPathologyBySlug(slug: string) {
  const row = await prisma.pathology.findUnique({ where: { slug }, select: detailSelect });
  if (!row) throw new NotFoundError('Pathologie introuvable');

  const { _count, ...pathology } = row;
  return { ...pathology, questionsCount: _count.questions };
}
