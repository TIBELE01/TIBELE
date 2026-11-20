/**
 * Accès aux données du forum (squelette : sujets uniquement).
 * Contenu en texte brut : aucun HTML n'est interprété (échappement à l'affichage).
 */
import { prisma } from '../config/prisma.js';
import { PAGINATION } from '../constants/pagination.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';
import type { Prisma } from '../generated/prisma/client.js';
import { toSkipTake } from '../utils/pagination.js';
import type { CreateTopicInput } from '../validators/forum.validator.js';

// L'auteur n'expose que son nom complet (jamais email ni identifiant).
const topicSummarySelect = {
  id: true,
  title: true,
  replyCount: true,
  createdAt: true,
  author: { select: { fullName: true } },
  pathology: { select: { id: true, title: true, slug: true } },
} satisfies Prisma.ForumTopicSelect;

const topicDetailSelect = {
  ...topicSummarySelect,
  content: true,
} satisfies Prisma.ForumTopicSelect;

/** Sujets, du plus récent au plus ancien, 10 par page. */
export async function listTopics(page: number) {
  const { skip, take } = toSkipTake(page, PAGINATION.FORUM_PAGE_SIZE);
  const [items, total] = await Promise.all([
    prisma.forumTopic.findMany({
      select: topicSummarySelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip,
      take,
    }),
    prisma.forumTopic.count(),
  ]);
  return { items, total };
}

export async function getTopic(id: string) {
  const topic = await prisma.forumTopic.findUnique({ where: { id }, select: topicDetailSelect });
  if (!topic) throw new NotFoundError('Sujet introuvable');
  return topic;
}

export async function createTopic(authorId: string, input: CreateTopicInput) {
  if (input.pathologyId) {
    const exists = await prisma.pathology.findUnique({
      where: { id: input.pathologyId },
      select: { id: true },
    });
    if (!exists) throw new BadRequestError('La pathologie associée n’existe pas');
  }

  return prisma.forumTopic.create({
    data: {
      title: input.title,
      content: input.content,
      authorId,
      pathologyId: input.pathologyId ?? null,
    },
    select: topicDetailSelect,
  });
}
