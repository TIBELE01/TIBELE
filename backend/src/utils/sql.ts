/**
 * Échappe les caractères spéciaux d'un motif LIKE / ILIKE (`%`, `_` et `\`),
 * pour qu'une saisie utilisateur soit cherchée littéralement.
 * À utiliser avec un paramètre lié (`Prisma.sql`), jamais en concaténation.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
