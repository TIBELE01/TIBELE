/** Chemins de l'application (source unique, évite les chaînes en dur). */
export const ROUTES = {
  home: '/',
  forum: '/forum',
  history: '/historique',
  profile: '/profil',
  login: '/connexion',
  register: '/inscription',
  admin: '/admin',
  pathology: (slug: string) => `/pathologies/${slug}`,
  quiz: (slug: string) => `/quiz/${slug}`,
} as const;
