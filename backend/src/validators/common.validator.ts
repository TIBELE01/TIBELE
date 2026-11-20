import { z } from 'zod';
import { PAGINATION } from '../constants/pagination.js';

/**
 * Texte brut saisi par un utilisateur : espaces de bord retirés, longueur bornée,
 * caractère nul interdit (PostgreSQL le refuse dans un champ texte).
 */
export const plainText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !value.includes('\u0000'), 'Caractère nul interdit');

/** Numéro de page (query string) : entier >= 1, 1 par défaut. */
export const pageSchema = z.coerce.number().int().min(1).max(PAGINATION.MAX_PAGE).default(1);

/** Texte brut facultatif : chaîne vide ou absente => `null`. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((value) => !value.includes('\u0000'), 'Caractère nul interdit')
    .nullish()
    .transform((value) => value || null);

/** Paramètre de route `:id` : UUID. */
export const idParams = z.object({ id: z.uuid() });
