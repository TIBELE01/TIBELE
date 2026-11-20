/**
 * Données de démonstration : pathologies, questions QCM/QCD et sujets de forum.
 *
 * Usage : `npm run db:seed` (après application des migrations).
 *
 * - IDEMPOTENT : peut être relancé sans créer de doublons, et n'écrase jamais
 *   ce qui a été modifié depuis (une pathologie existante — repérée par son
 *   slug — est laissée intacte, avec ses questions).
 * - Toutes les données sont validées avec les schémas Zod de l'API avant
 *   insertion : le seed ne peut pas produire de données que l'API refuserait.
 * - Refuse de s'exécuter en production, sauf si SEED_ALLOW_PRODUCTION=true.
 * - Les auteurs du forum sont des profils fictifs (pas de comptes de connexion).
 *
 * ⚠️ Contenu médical de démonstration : à faire relire par un professionnel de
 * santé et à aligner sur les protocoles nationaux avant toute mise en ligne.
 */
import { disconnectPrisma, prisma } from '../../src/config/prisma.js';
import { env } from '../../src/config/env.js';
import { slugify } from '../../src/utils/slug.js';
import { createPathologyBody } from '../../src/validators/admin/pathology.validator.js';
import { questionBody } from '../../src/validators/question.validator.js';
import { demoAuthors, demoTopics, seedPathologies } from './data/index.js';

const DAY_MS = 24 * 60 * 60 * 1000;

async function seedPathologiesAndQuestions(): Promise<Map<string, string>> {
  const idsByTitle = new Map<string, string>();

  for (const entry of seedPathologies) {
    const { questions, ...fiche } = entry;
    const pathology = createPathologyBody.parse(fiche);
    const slug = slugify(pathology.title);

    const existing = await prisma.pathology.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      idsByTitle.set(pathology.title, existing.id);
      console.info(`  = ${pathology.title} : déjà présente, ignorée`);
      continue;
    }

    // Dates de création décalées pour garder l'ordre des questions.
    const start = Date.now();
    const parsedQuestions = questions.map((question, index) => ({
      ...questionBody.parse(question),
      createdAt: new Date(start + index * 1000),
    }));

    const created = await prisma.pathology.create({
      data: { ...pathology, slug, questions: { create: parsedQuestions } },
      select: { id: true },
    });
    idsByTitle.set(pathology.title, created.id);
    console.info(`  + ${pathology.title} : ${parsedQuestions.length} questions`);
  }
  return idsByTitle;
}

async function seedForum(pathologyIds: Map<string, string>): Promise<void> {
  for (const author of demoAuthors) {
    await prisma.profile.upsert({
      where: { id: author.id },
      update: {},
      create: { id: author.id, fullName: author.fullName, role: 'USER' },
    });
  }

  for (const topic of demoTopics) {
    if (topic.pathologyTitle && !pathologyIds.has(topic.pathologyTitle)) {
      throw new Error(`Pathologie inconnue pour le sujet « ${topic.title} »`);
    }
    const createdAt = new Date(Date.now() - topic.daysAgo * DAY_MS);
    const alreadyThere = (await prisma.forumTopic.count({ where: { id: topic.id } })) > 0;

    await prisma.forumTopic.upsert({
      where: { id: topic.id },
      update: {},
      create: {
        id: topic.id,
        title: topic.title,
        content: topic.content,
        authorId: topic.authorId,
        pathologyId: topic.pathologyTitle ? (pathologyIds.get(topic.pathologyTitle) ?? null) : null,
        replyCount: topic.replies.length,
        createdAt,
        posts: {
          create: topic.replies.map((reply, index) => ({
            authorId: reply.authorId,
            content: reply.content,
            createdAt: new Date(createdAt.getTime() + (index + 1) * 60 * 60 * 1000),
          })),
        },
      },
      select: { id: true },
    });
    console.info(`  ${alreadyThere ? '=' : '+'} sujet : ${topic.title}`);
  }
}

async function main(): Promise<void> {
  if (env.isProduction && process.env['SEED_ALLOW_PRODUCTION'] !== 'true') {
    throw new Error(
      'Seed refusé en production (données de démonstration). Définir SEED_ALLOW_PRODUCTION=true pour forcer.',
    );
  }

  console.info('[seed] pathologies et questions');
  const pathologyIds = await seedPathologiesAndQuestions();
  console.info('[seed] forum');
  await seedForum(pathologyIds);
  console.info('[seed] terminé');
}

main()
  .catch((err: unknown) => {
    console.error('[seed] échec :', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
