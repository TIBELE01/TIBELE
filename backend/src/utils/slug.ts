/**
 * Génère un slug URL à partir d'un titre : minuscules, sans accents, mots
 * séparés par des tirets. Ex. « Hypertension artérielle » -> « hypertension-arterielle ».
 *
 * Le résultat respecte la contrainte CHECK de la base (`^[a-z0-9]+(-[a-z0-9]+)*$`).
 * Peut renvoyer une chaîne vide si le titre ne contient aucun caractère latin
 * ou chiffre : à l'appelant de le refuser.
 */
export function slugify(input: string, maxLength = 200): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // supprime les diacritiques
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // tout le reste devient un séparateur
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/, '');
}
