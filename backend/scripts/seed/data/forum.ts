import type { SeedAuthor, SeedTopic } from './types.js';

/**
 * Profils de démonstration (fictifs). Ils sont créés directement dans
 * `profiles` : ce ne sont PAS des comptes de connexion (aucune entrée dans
 * auth.users, aucun mot de passe).
 */
export const demoAuthors: SeedAuthor[] = [
  { id: 'd0000000-0000-4000-8000-000000000001', fullName: 'Dr Aya Kouassi (démo)' },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    fullName: 'Mariam Traoré, étudiante en médecine (démo)',
  },
  { id: 'd0000000-0000-4000-8000-000000000003', fullName: 'Ibrahim Koné, infirmier (démo)' },
];

const [medecin, etudiante, infirmier] = demoAuthors as [SeedAuthor, SeedAuthor, SeedAuthor];

export const demoTopics: SeedTopic[] = [
  {
    id: 'f0000000-0000-4000-8000-000000000001',
    title: 'Bienvenue sur TIBELE : présentez-vous !',
    content:
      'Bienvenue sur le forum de TIBELE. Cet espace est dédié aux échanges pédagogiques entre étudiants, infirmiers et médecins. Rappel : les discussions ont un but éducatif et ne remplacent jamais un avis médical. Présentez-vous en quelques lignes !',
    authorId: medecin.id,
    daysAgo: 14,
    replies: [
      {
        authorId: etudiante.id,
        content:
          'Bonjour à tous, je suis en 4e année de médecine à Abidjan. Ravie de pouvoir réviser avec les fiches et les quiz.',
      },
    ],
  },
  {
    id: 'f0000000-0000-4000-8000-000000000002',
    title: 'Comment retenir les critères de gravité du paludisme ?',
    content:
      'Je prépare mon examen de maladies infectieuses et je confonds souvent les critères de gravité du paludisme. Auriez-vous une méthode ou un moyen mnémotechnique pour les retenir ?',
    authorId: etudiante.id,
    pathologyTitle: 'Paludisme',
    daysAgo: 9,
    replies: [
      {
        authorId: medecin.id,
        content:
          'Regroupez-les par système : neurologique (coma, convulsions, prostration), respiratoire, circulatoire (choc), métabolique (hypoglycémie), hématologique (anémie sévère, saignements), rénal et hépatique. Puis faites le quiz de la fiche pour vous tester.',
      },
      {
        authorId: infirmier.id,
        content:
          'Sur le terrain, je retiens surtout : un enfant qui ne tient plus assis, qui convulse ou qui respire mal doit être référé sans attendre.',
      },
    ],
  },
  {
    id: 'f0000000-0000-4000-8000-000000000003',
    title: 'Quel brassard choisir pour mesurer la tension d’un patient obèse ?',
    content:
      'En consultation, j’ai souvent des patients avec un bras de grande circonférence. Un brassard standard donne-t-il des valeurs fiables ? Comment choisir la bonne taille ?',
    authorId: infirmier.id,
    pathologyTitle: 'Hypertension artérielle',
    daysAgo: 6,
    replies: [
      {
        authorId: medecin.id,
        content:
          'Un brassard trop petit surestime la tension. Il faut mesurer la circonférence du bras et choisir un brassard adapté : la poche gonflable doit couvrir environ 80 % du tour de bras. En l’absence de brassard large, mieux vaut le signaler que d’utiliser un brassard standard.',
      },
    ],
  },
  {
    id: 'f0000000-0000-4000-8000-000000000004',
    title: 'Expliquer la préparation des SRO aux mamans',
    content:
      'Comment expliquez-vous simplement la préparation et l’administration des SRO aux mamans, surtout quand elles ont peu de temps en consultation ? Des astuces à partager ?',
    authorId: infirmier.id,
    pathologyTitle: 'Gastro-entérite aiguë',
    daysAgo: 3,
    replies: [
      {
        authorId: medecin.id,
        content:
          'Je montre le sachet, le litre d’eau potable et je fais préparer la solution devant la maman. Je rappelle : petites gorgées, après chaque selle liquide, et on continue l’allaitement. Un dessin simple remis en fin de consultation aide beaucoup.',
      },
      {
        authorId: etudiante.id,
        content:
          'Merci pour l’astuce ! On peut aussi demander à la maman de reformuler pour vérifier qu’elle a bien compris.',
      },
    ],
  },
  {
    id: 'f0000000-0000-4000-8000-000000000005',
    title: 'Poussée hypertensive ou urgence hypertensive ?',
    content:
      'La différence entre poussée et urgence hypertensive me semble encore floue. Quels éléments cliniques permettent de trancher rapidement ?',
    authorId: etudiante.id,
    pathologyTitle: 'Hypertension artérielle',
    daysAgo: 1,
    replies: [],
  },
];
