/** Formats des données de démonstration (validés avec les schémas Zod de l'API). */
export interface SeedQuestion {
  text: string;
  type: 'QCM' | 'QCD';
  options: { text: string; isCorrect: boolean }[];
  explanation: string;
}

export interface SeedPathology {
  title: string;
  shortDescription: string;
  definition: string;
  exams: string[];
  referenceDiagnosis: string;
  onSiteTreatment: string;
  dischargePrescription: string;
  prevention: string;
  references: string[];
  imageUrl?: string | null;
  questions: SeedQuestion[];
}

export interface SeedAuthor {
  /** Identifiant fixe : permet de relancer le seed sans doublon. */
  id: string;
  fullName: string;
}

export interface SeedTopic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  /** Titre de la pathologie associée (facultatif). */
  pathologyTitle?: string;
  /** Ancienneté du sujet, en jours. */
  daysAgo: number;
  replies: { authorId: string; content: string }[];
}
