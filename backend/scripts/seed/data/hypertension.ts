import { qcd, qcm } from './helpers.js';
import type { SeedPathology } from './types.js';

export const hypertension: SeedPathology = {
  title: 'Hypertension artérielle',
  shortDescription:
    'Élévation persistante de la pression artérielle (≥ 140/90 mmHg), le plus souvent silencieuse, principal facteur de risque d’AVC et de maladies cardiovasculaires.',
  definition: `L'hypertension artérielle (HTA) est définie par une pression artérielle systolique supérieure ou égale à 140 mmHg et/ou une pression artérielle diastolique supérieure ou égale à 90 mmHg, mesurées au cabinet lors d'au moins deux consultations différentes.

Dans la grande majorité des cas, l'HTA est dite essentielle (sans cause identifiée) et se développe en association avec des facteurs de risque : sel alimentaire en excès, surpoids, sédentarité, tabac, alcool, antécédents familiaux, âge.

L'HTA est le plus souvent asymptomatique : on la surnomme le « tueur silencieux ». Non traitée, elle provoque des complications graves : accident vasculaire cérébral (AVC), insuffisance cardiaque, infarctus du myocarde, insuffisance rénale, atteinte de la rétine.`,
  exams: [
    'Mesure de la pression artérielle aux deux bras, patient assis après 5 minutes de repos, avec un brassard adapté à la taille du bras ; répéter la mesure',
    'Automesure à domicile ou mesure ambulatoire de la PA (MAPA) pour confirmer le diagnostic si disponible',
    'Glycémie à jeun',
    'Créatininémie avec estimation du débit de filtration glomérulaire, ionogramme sanguin (kaliémie)',
    'Bilan lipidique (cholestérol total, HDL, LDL, triglycérides)',
    'Bandelette urinaire : recherche de protéinurie et d’hématurie',
    'Électrocardiogramme (ECG) ; fond d’œil et échocardiographie selon les possibilités',
  ],
  referenceDiagnosis: `Le diagnostic d'HTA est posé devant une PA supérieure ou égale à 140/90 mmHg, retrouvée sur plusieurs mesures lors d'au moins deux consultations.

Classification de la PA au cabinet (mmHg) :
- PA normale : inférieure à 140/90
- HTA de grade 1 : 140-159 / 90-99
- HTA de grade 2 : 160-179 / 100-109
- HTA de grade 3 (sévère) : supérieure ou égale à 180 / 110

Situations aiguës :
- Poussée hypertensive : PA très élevée (≥ 180/110) SANS signe d'atteinte aiguë d'un organe.
- Urgence hypertensive : PA très élevée AVEC atteinte aiguë d'un organe cible (déficit neurologique, douleur thoracique, œdème aigu du poumon, encéphalopathie, insuffisance rénale aiguë). Elle nécessite une hospitalisation immédiate.

Le bilan recherche les facteurs de risque associés, le retentissement sur les organes cibles et une éventuelle cause secondaire (surtout chez le sujet jeune ou en cas d'HTA résistante).`,
  onSiteTreatment: `1. Mesures hygiéno-diététiques (pour tous les patients)
- Réduire le sel (moins de 5 g par jour), augmenter fruits et légumes.
- Activité physique régulière (au moins 30 minutes presque tous les jours), perte de poids si surpoids.
- Arrêt du tabac, consommation d'alcool limitée.

2. Traitement médicamenteux (HTA confirmée)
- Classes de première intention : diurétique thiazidique (hydrochlorothiazide, indapamide), inhibiteur calcique (amlodipine), IEC (énalapril, périndopril) ou ARA2.
- Chez le sujet d'origine africaine, privilégier un inhibiteur calcique et/ou un diurétique thiazidique ; les IEC et ARA2 sont moins efficaces en monothérapie mais utiles en association ou en cas de diabète ou d'atteinte rénale.
- Privilégier les associations fixes en un seul comprimé quotidien pour favoriser l'observance.
- Objectif : PA inférieure à 140/90 mmHg au minimum (et inférieure à 130/80 mmHg si bien toléré).

3. Poussée hypertensive (sans atteinte d'organe)
- Repos au calme, reprise ou ajustement du traitement oral, réévaluation de la PA. Ne pas faire baisser la PA brutalement. La nifédipine sublinguale est déconseillée.

4. Urgence hypertensive
- Hospitalisation immédiate, traitement antihypertenseur injectable sous surveillance : transfert urgent vers une structure adaptée.`,
  dischargePrescription: `Ordonnance indicative pour un adulte avec HTA de grade 1 ou 2, d'origine africaine, sans comorbidité particulière (à adapter à chaque patient : grossesse, insuffisance rénale, diabète, etc.) :

1. Amlodipine 5 mg : 1 comprimé le matin (augmentation à 10 mg possible après 4 semaines si la PA n'est pas contrôlée).
2. Hydrochlorothiazide 25 mg : 1 comprimé le matin, si une association est nécessaire.
3. Mesures hygiéno-diététiques : moins de 5 g de sel par jour (une cuillère à café rase), activité physique, arrêt du tabac, alcool limité.

Suivi : contrôle de la PA et de la tolérance à 1 mois (ionogramme et créatininémie après introduction d'un diurétique), puis tous les 3 à 6 mois une fois la PA contrôlée. Le traitement est en règle générale à vie : ne jamais l'arrêter sans avis médical, même si l'on se sent bien.

Consulter en urgence en cas de céphalées intenses, trouble de la vue, douleur thoracique, faiblesse d'un côté du corps ou difficulté à parler.`,
  prevention: `- Limiter le sel (moins de 5 g par jour) : éviter les bouillons cubes en excès, les aliments très salés et les conserves.
- Alimentation riche en fruits, légumes et aliments peu transformés.
- Activité physique : au moins 150 minutes par semaine d'activité modérée.
- Maintenir un poids normal.
- Ne pas fumer ; limiter l'alcool.
- Dépistage régulier de la tension, au moins une fois par an chez l'adulte de plus de 40 ans ou en cas d'antécédents familiaux.
- Bonne observance du traitement et suivi régulier chez les patients déjà diagnostiqués.`,
  references: [
    'OMS. Guideline for the pharmacological treatment of hypertension in adults (2021).',
    'ESH. 2023 Guidelines for the management of arterial hypertension.',
    'ISH. 2020 International Society of Hypertension Global Hypertension Practice Guidelines.',
  ],
  questions: [
    qcd(
      'L’hypertension artérielle est définie par une PA supérieure ou égale à 140/90 mmHg, retrouvée à plusieurs reprises au cabinet.',
      true,
      'Le diagnostic repose sur des mesures répétées lors d’au moins deux consultations : une valeur isolée ne suffit pas.',
    ),
    qcm(
      'Quelles mesures hygiéno-diététiques sont recommandées chez le patient hypertendu ?',
      [
        ['Réduire la consommation de sel', true],
        ['Pratiquer une activité physique régulière', true],
        ['Arrêter le tabac', true],
        ['Augmenter la consommation de sel pour « équilibrer » la tension', false],
      ],
      'La réduction du sel, l’activité physique et l’arrêt du tabac diminuent la PA et le risque cardiovasculaire. Augmenter le sel aggrave l’hypertension.',
    ),
    qcm(
      'Quels examens font partie du bilan initial d’un patient hypertendu ?',
      [
        ['Glycémie à jeun', true],
        ['Créatininémie', true],
        ['Électrocardiogramme (ECG)', true],
        ['Scanner cérébral systématique', false],
      ],
      'Le bilan initial recherche les autres facteurs de risque et le retentissement sur les organes cibles (glycémie, fonction rénale, ECG). Un scanner cérébral n’est pas systématique.',
    ),
    qcd(
      'Chez un patient d’origine africaine, un inhibiteur calcique ou un diurétique thiazidique est privilégié en première intention.',
      true,
      'Ces classes sont les plus efficaces en monothérapie dans cette population ; les IEC et ARA2 sont plus utiles en association ou en cas de diabète ou d’atteinte rénale.',
    ),
    qcm(
      'Quelles conditions sont nécessaires pour une mesure correcte de la PA ?',
      [
        ['Patient assis, au repos depuis environ 5 minutes', true],
        ['Brassard adapté à la circonférence du bras', true],
        ['Bras posé à hauteur du cœur', true],
        ['Mesure effectuée juste après un effort physique', false],
      ],
      'Une mesure fiable exige un repos préalable, un brassard adapté et un bras au niveau du cœur. L’effort, le stress et un brassard trop petit surestiment la PA.',
    ),
    qcd(
      'Une PA à 190/115 mmHg sans aucun signe d’atteinte d’organe constitue une urgence hypertensive.',
      false,
      'Sans atteinte aiguë d’un organe cible, on parle de poussée hypertensive : on réévalue et on ajuste le traitement oral sans baisse brutale de la PA. L’urgence hypertensive suppose une atteinte d’organe.',
    ),
    qcm(
      'Lesquels de ces organes sont des organes cibles de l’HTA ?',
      [
        ['Cerveau', true],
        ['Reins', true],
        ['Rétine', true],
        ['Os', false],
      ],
      'L’HTA lèse surtout le cerveau (AVC), le cœur, les reins et la rétine. Les os ne sont pas des organes cibles.',
    ),
    qcd(
      'L’hypertension artérielle provoque toujours des symptômes (maux de tête, vertiges).',
      false,
      'L’HTA est le plus souvent asymptomatique, d’où l’importance du dépistage par la mesure de la PA.',
    ),
    qcm(
      'Quel est l’objectif tensionnel minimal chez l’adulte hypertendu traité ?',
      [
        ['PA inférieure à 140/90 mmHg', true],
        ['PA inférieure à 180/110 mmHg', false],
        ['Normalisation de la PA en quelques minutes', false],
      ],
      'L’objectif minimal est une PA inférieure à 140/90 mmHg (et inférieure à 130/80 mmHg si bien toléré). La baisse doit être progressive, pas brutale.',
    ),
    qcd(
      'Un patient hypertendu traité qui se sent bien peut arrêter son traitement de lui-même.',
      false,
      'Le traitement est en règle générale poursuivi à vie : l’absence de symptômes est justement le signe que le traitement agit. L’arrêt expose à l’AVC et aux complications.',
    ),
  ],
};
