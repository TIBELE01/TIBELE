import { qcd, qcm } from './helpers.js';
import type { SeedPathology } from './types.js';

export const gastroEnterite: SeedPathology = {
  title: 'Gastro-entérite aiguë',
  shortDescription:
    'Diarrhée aiguë, avec ou sans vomissements. Le danger principal est la déshydratation, surtout chez l’enfant de moins de 5 ans : la réhydratation orale est le pilier du traitement.',
  definition: `La gastro-entérite aiguë est une inflammation aiguë de la muqueuse gastro-intestinale, définie par l'émission d'au moins 3 selles liquides ou molles par jour, évoluant depuis moins de 14 jours, avec ou sans vomissements et fièvre.

Les causes les plus fréquentes sont virales (rotavirus, norovirus). Les causes bactériennes (Escherichia coli, Shigella, Salmonella, Vibrio cholerae) et parasitaires sont également possibles, surtout en cas de selles glairo-sanglantes (dysenterie) ou de contexte épidémique (choléra).

Le principal risque est la déshydratation aiguë, particulièrement rapide chez le nourrisson et le jeune enfant. La malnutrition et l'absence d'accès à l'eau potable aggravent le pronostic.`,
  exams: [
    'Évaluation clinique de l’état d’hydratation (examen prioritaire) : soif, état de conscience, yeux enfoncés, fontanelle, pli cutané, capacité à boire',
    'Pesée de l’enfant (permet de calculer les volumes de réhydratation et de suivre l’évolution)',
    'Température et recherche de signes de gravité (léthargie, convulsions, abdomen distendu)',
    'Coproculture et examen parasitologique des selles : non systématiques, réservés aux diarrhées sanglantes, persistantes ou en contexte épidémique',
    'Ionogramme sanguin, créatininémie et glycémie en cas de déshydratation sévère',
    'TDR du paludisme en cas de fièvre en zone d’endémie',
  ],
  referenceDiagnosis: `Le diagnostic est avant tout clinique : diarrhée aiguë (au moins 3 selles liquides par jour depuis moins de 14 jours). L'enjeu est d'évaluer le degré de déshydratation (classification OMS) :

- Pas de déshydratation : enfant éveillé, boit normalement, yeux normaux, pli cutané qui s'efface immédiatement.
- Déshydratation modérée (« quelque déshydratation ») : enfant agité ou irritable, yeux enfoncés, boit avidement (soif intense), pli cutané qui s'efface lentement.
- Déshydratation sévère : enfant léthargique ou inconscient, yeux enfoncés, boit mal ou est incapable de boire, pli cutané qui s'efface très lentement (plus de 2 secondes).

Formes particulières :
- Dysenterie : présence de sang dans les selles.
- Diarrhée persistante : plus de 14 jours.
- Choléra suspecté : selles très abondantes en « eau de riz », contexte épidémique.`,
  onSiteTreatment: `La réhydratation est le traitement essentiel, selon le plan adapté au degré de déshydratation :

Plan A — pas de déshydratation (traitement à domicile)
- Solution de réhydratation orale (SRO) après chaque selle liquide.
- Zinc chez l'enfant : 20 mg par jour pendant 10 jours (10 mg par jour avant 6 mois).
- Poursuivre l'alimentation normale et l'allaitement.

Plan B — déshydratation modérée
- SRO sous surveillance en structure de santé : environ 75 mL/kg en 4 heures, puis réévaluation.

Plan C — déshydratation sévère (urgence)
- Perfusion intraveineuse de Ringer lactate (à défaut, sérum physiologique) : environ 100 mL/kg, rapidement au début (30 mL/kg en 30 minutes à 1 heure selon l'âge), puis le reste en 2 à 5 heures ; surveillance rapprochée et passage aux SRO dès que le patient peut boire.

Autres mesures
- Pas d'antibiotiques systématiques : réservés à la dysenterie, au choléra grave et à certaines situations précises.
- Éviter les antidiarrhéiques (lopéramide), contre-indiqués chez le jeune enfant.
- Paracétamol en cas de fièvre mal tolérée.
- Référer devant toute forme sévère, un nourrisson de moins de 6 mois, une malnutrition ou l'échec de la réhydratation orale.`,
  dischargePrescription: `Ordonnance indicative pour un enfant de 2 ans (environ 12 kg), diarrhée aiguë sans déshydratation (à adapter à l'âge et au poids) :

1. Solution de réhydratation orale (SRO) : 1 sachet dissous dans 1 litre d'eau potable ; donner 100 à 200 mL après chaque selle liquide (50 à 100 mL avant 2 ans), à la tasse ou à la cuillère, par petites gorgées. Conserver la solution préparée au maximum 24 heures.
2. Zinc 20 mg (dispersible) : 1 comprimé par jour pendant 10 jours, même si la diarrhée s'arrête avant.
3. Paracétamol : 15 mg/kg toutes les 6 heures en cas de fièvre (sirop dosé au poids).

Conseils : continuer l'allaitement et l'alimentation habituelle, ne pas diluer le lait, se laver les mains au savon. Revenir immédiatement en cas de refus de boire, de vomissements incessants, de sang dans les selles, de somnolence, de yeux enfoncés ou de fièvre persistante.`,
  prevention: `- Lavage des mains à l'eau et au savon (après les selles, avant de préparer les repas, avant de manger, après avoir changé un enfant).
- Eau potable : puiser une eau sûre, la traiter à domicile (chloration, filtration, ébullition) et la conserver dans un récipient propre et couvert.
- Assainissement : latrines, évacuation hygiénique des selles, hygiène alimentaire (cuisson, protection des aliments).
- Allaitement maternel exclusif pendant les 6 premiers mois.
- Vaccination anti-rotavirus et contre la rougeole selon le calendrier vaccinal national.
- Supplémentation en zinc lors de chaque épisode de diarrhée et prise en charge de la malnutrition.`,
  references: [
    'OMS. Le traitement de la diarrhée : manuel à l’usage des médecins et autres personnels de santé (2005).',
    'OMS / UNICEF. Prise en charge intégrée des maladies de l’enfant (PCIME).',
    'OMS / UNICEF. Déclaration commune : prise en charge clinique de la diarrhée aiguë (SRO à faible osmolarité et zinc).',
  ],
  questions: [
    qcd(
      'Le premier traitement de la diarrhée aiguë est la réhydratation par solution de réhydratation orale (SRO).',
      true,
      'La mort par diarrhée est due à la déshydratation : compenser les pertes en eau et en sels par les SRO est le traitement essentiel.',
    ),
    qcm(
      'Parmi les signes suivants, lesquels évoquent une déshydratation chez l’enfant ?',
      [
        ['Yeux enfoncés', true],
        ['Soif intense, l’enfant boit avidement', true],
        ['Pli cutané qui s’efface lentement', true],
        ['Larmes abondantes et langue humide', false],
      ],
      'Yeux enfoncés, soif intense et pli cutané lent sont des signes de déshydratation. Des larmes abondantes et une bouche humide sont rassurantes.',
    ),
    qcd(
      'Une antibiothérapie doit être prescrite systématiquement dans toute diarrhée aiguë.',
      false,
      'La plupart des diarrhées aiguës sont virales et guérissent sans antibiotique. Ils sont réservés à la dysenterie, au choléra grave et à quelques situations précises.',
    ),
    qcm(
      'Dans quelles situations une antibiothérapie est-elle indiquée ?',
      [
        ['Diarrhée avec du sang dans les selles (dysenterie)', true],
        ['Choléra suspecté avec déshydratation sévère', true],
        ['Diarrhée aqueuse simple, sans signe de gravité', false],
        ['Diarrhée aiguë probablement virale chez un enfant en bon état', false],
      ],
      'Les antibiotiques sont indiqués en cas de dysenterie et de choléra grave. Dans une diarrhée aqueuse simple ou virale, ils sont inutiles et exposent aux effets indésirables et aux résistances.',
    ),
    qcm(
      'Quelles mesures font partie de la prise en charge à domicile (plan A) ?',
      [
        ['SRO après chaque selle liquide', true],
        ['Zinc chez l’enfant pendant 10 à 14 jours', true],
        ['Poursuite de l’alimentation et de l’allaitement', true],
        ['Arrêt de toute alimentation pendant 24 heures', false],
      ],
      'Il faut continuer à alimenter l’enfant et à l’allaiter. Le jeûne aggrave la dénutrition et retarde la guérison.',
    ),
    qcd(
      'Le lopéramide est recommandé pour traiter la diarrhée aiguë du jeune enfant.',
      false,
      'Les antidiarrhéiques comme le lopéramide sont contre-indiqués chez le jeune enfant (risque d’effets graves) et n’apportent aucun bénéfice sur la déshydratation.',
    ),
    qcm(
      'Quels solutés peut-on utiliser pour la réhydratation intraveineuse d’une déshydratation sévère ?',
      [
        ['Ringer lactate', true],
        ['Sérum physiologique (NaCl 0,9 %) à défaut de Ringer lactate', true],
        ['Soluté glucosé à 5 % seul', false],
        ['Eau sucrée à boire en grande quantité', false],
      ],
      'Le Ringer lactate est le soluté de choix ; le sérum physiologique est une alternative. Le glucosé à 5 % seul ne corrige pas les pertes en sels. L’eau sucrée est inadaptée.',
    ),
    qcd(
      'Un enfant léthargique, incapable de boire, doit être réhydraté en urgence par voie intraveineuse.',
      true,
      'La léthargie et l’incapacité à boire sont des signes de déshydratation sévère (plan C) : perfusion immédiate puis transfert si le plateau technique est insuffisant.',
    ),
    qcm(
      'Quelles mesures contribuent à prévenir les gastro-entérites ?',
      [
        ['Lavage des mains à l’eau et au savon', true],
        ['Consommation d’eau potable', true],
        ['Allaitement maternel exclusif pendant 6 mois', true],
        ['Antibiothérapie préventive systématique', false],
      ],
      'L’hygiène des mains, l’eau potable et l’allaitement exclusif sont les mesures de prévention les plus efficaces. Les antibiotiques préventifs sont inutiles et dangereux (résistances).',
    ),
    qcd(
      'Le zinc réduit la durée et la gravité d’un épisode de diarrhée chez l’enfant.',
      true,
      'Associé aux SRO, le zinc (10 à 14 jours) diminue la durée de l’épisode et le risque de récidive dans les mois suivants.',
    ),
  ],
};
