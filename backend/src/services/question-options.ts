/**
 * Lecture sécurisée des options d'une question et projection publique.
 *
 * ⚠️ SÉCURITÉ : `toPublicOptions` est le SEUL chemin par lequel les options
 * d'une question quittent le serveur avant la correction. Elle reconstruit
 * chaque option champ par champ (liste blanche : `text` uniquement) ; on ne
 * propage jamais un objet d'option brut vers une réponse HTTP.
 */
import { z } from 'zod';

export type StoredOption = { text: string; isCorrect: boolean };
export type PublicOption = { text: string };

const storedOptionsSchema = z.array(z.object({ text: z.string(), isCorrect: z.boolean() }));

/** Valide le JSON lu en base. Des options corrompues sont un bug serveur (500), pas une erreur client. */
export function parseStoredOptions(json: unknown): StoredOption[] {
  const parsed = storedOptionsSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Options de question corrompues en base de données');
  }
  return parsed.data;
}

/** Options sans aucune indication de correction. */
export function toPublicOptions(options: readonly StoredOption[]): PublicOption[] {
  return options.map((option) => ({ text: option.text }));
}
