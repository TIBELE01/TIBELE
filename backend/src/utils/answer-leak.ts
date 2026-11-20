/**
 * Garde-fou contre la fuite des bonnes réponses.
 *
 * Parcourt récursivement une charge utile destinée au client AVANT correction
 * et lève une erreur (-> 500 journalisée, rien n'est envoyé) si elle contient
 * une clé trahissant une correction (`isCorrect`, `correct*`, `answer*`,
 * `explanation`). C'est une seconde barrière : la première est la liste
 * blanche de champs construite explicitement par `toPublicQuestion`.
 *
 * Seules les CLÉS sont inspectées (pas les valeurs) : un libellé d'option
 * qui contient le mot « correct » reste autorisé.
 */
const FORBIDDEN_KEY = /^(iscorrect|correct.*|answer.*|solution.*|explanation)$/i;

export function assertNoAnswerLeak(payload: unknown, path = 'payload'): void {
  if (Array.isArray(payload)) {
    payload.forEach((item, index) => assertNoAnswerLeak(item, `${path}[${index}]`));
    return;
  }
  if (typeof payload === 'object' && payload !== null) {
    for (const [key, value] of Object.entries(payload)) {
      if (FORBIDDEN_KEY.test(key)) {
        throw new Error(`Fuite de réponse bloquée : clé « ${key} » interdite (${path})`);
      }
      assertNoAnswerLeak(value, `${path}.${key}`);
    }
  }
}
