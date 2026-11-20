/** Gestion des pathologies (administrateur) : création, modification, suppression. */
import { prisma } from '../../config/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';
import { slugify } from '../../utils/slug.js';
import type {
  CreatePathologyInput,
  UpdatePathologyInput,
} from '../../validators/admin/pathology.validator.js';
import { pathologyDetailSelect, toPathologyDetail } from '../pathologies.service.js';

/** Premier slug libre : `base`, puis `base-2`, `base-3`… */
async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || 'pathologie';
  const existing = await prisma.pathology.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  const taken = new Set(existing.map((row) => row.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

const MAX_SLUG_ATTEMPTS = 3;

export async function createPathology(input: CreatePathologyInput) {
  // Deux créations simultanées du même titre peuvent viser le même slug :
  // la contrainte d'unicité tranche, on réessaie avec le slug suivant.
  for (let attempt = 1; ; attempt++) {
    const slug = await generateUniqueSlug(input.title);
    try {
      const row = await prisma.pathology.create({
        data: { ...input, slug },
        select: pathologyDetailSelect,
      });
      return toPathologyDetail(row);
    } catch (err) {
      const isSlugConflict =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
      if (!isSlugConflict || attempt >= MAX_SLUG_ATTEMPTS) throw err;
    }
  }
}

/**
 * Le slug n'est PAS régénéré quand le titre change : les URL, favoris et le
 * cache hors ligne de la PWA restent valides. (P2025 -> 404 via errorHandler.)
 */
export async function updatePathology(id: string, input: UpdatePathologyInput) {
  const row = await prisma.pathology.update({
    where: { id },
    data: input,
    select: pathologyDetailSelect,
  });
  return toPathologyDetail(row);
}

/** Supprime la fiche, ses questions et les tentatives associées (cascade). */
export async function deletePathology(id: string): Promise<void> {
  await prisma.pathology.delete({ where: { id } });
}
