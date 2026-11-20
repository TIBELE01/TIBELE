/**
 * Validation des fiches pathologies (écriture, administrateur).
 * Tout est du texte brut : aucune balise HTML n'est interprétée à l'affichage.
 */
import { z } from 'zod';
import { plainText } from '../common.validator.js';

// Forme commune, SANS valeur par défaut : indispensable pour que PATCH
// (champs facultatifs) ne remette pas à zéro les champs non envoyés.
const shape = {
  title: plainText(2, 200),
  shortDescription: plainText(1, 500),
  definition: plainText(1, 20_000),
  exams: z.array(plainText(1, 500)).max(50),
  referenceDiagnosis: plainText(1, 20_000),
  onSiteTreatment: plainText(1, 20_000),
  dischargePrescription: plainText(1, 20_000),
  prevention: plainText(1, 20_000),
  references: z.array(plainText(1, 1000)).max(100),
  /** Uniquement http(s) : refuse `javascript:`, `data:`, etc. */
  imageUrl: z.url({ protocol: /^https?$/ }).max(2048),
};

/** POST /api/admin/pathologies */
export const createPathologyBody = z.object({
  ...shape,
  exams: shape.exams.default([]),
  references: shape.references.default([]),
  imageUrl: shape.imageUrl.nullish().transform((value) => value ?? null),
});
export type CreatePathologyInput = z.output<typeof createPathologyBody>;

/** PATCH /api/admin/pathologies/:id — modification partielle (`imageUrl: null` retire l'image). */
export const updatePathologyBody = z
  .object({ ...shape, imageUrl: shape.imageUrl.nullable() })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Aucun champ à modifier');
export type UpdatePathologyInput = z.output<typeof updatePathologyBody>;
