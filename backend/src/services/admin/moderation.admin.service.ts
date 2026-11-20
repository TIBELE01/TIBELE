/** Modération du forum (administrateur) : suppression de n'importe quel sujet ou message. */
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../errors/index.js';

/** Supprime le sujet ; ses messages disparaissent en cascade. */
export async function deleteTopic(id: string): Promise<void> {
  await prisma.forumTopic.delete({ where: { id } }); // P2025 -> 404
}

/** Supprime un message et maintient le compteur de réponses du sujet. */
export async function deletePost(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const post = await tx.forumPost.findUnique({ where: { id }, select: { topicId: true } });
    if (!post) throw new NotFoundError('Message introuvable');

    await tx.forumPost.delete({ where: { id } });
    // `replyCount > 0` : le compteur ne devient jamais négatif (contrainte CHECK en base).
    await tx.forumTopic.updateMany({
      where: { id: post.topicId, replyCount: { gt: 0 } },
      data: { replyCount: { decrement: 1 } },
    });
  });
}
