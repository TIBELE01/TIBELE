import { qcd, qcm } from './helpers.js';
import type { SeedPathology } from './types.js';

export const paludisme: SeedPathology = {
  title: 'Paludisme',
  shortDescription:
    'Maladie parasitaire transmise par la piqûre de l’anophèle femelle ; première cause de consultation en Côte d’Ivoire. Urgence vitale dans sa forme grave.',
  definition: `Le paludisme (malaria) est une maladie parasitaire potentiellement mortelle due à des parasites du genre Plasmodium, transmis à l'homme par la piqûre d'un moustique anophèle femelle infecté. En Côte d'Ivoire, l'espèce dominante est Plasmodium falciparum, responsable des formes graves. La transmission est endémique sur tout le territoire, avec une recrudescence en saison des pluies.

L'accès palustre simple associe une fièvre (ou des antécédents de fièvre dans les 48 dernières heures), des frissons, des céphalées, des courbatures et parfois des vomissements ou une diarrhée.

Le paludisme grave est une urgence vitale. Il touche surtout les enfants de moins de 5 ans, les femmes enceintes et les personnes non immunes.`,
  exams: [
    'Test de diagnostic rapide (TDR) : résultat en 15 à 20 minutes, examen de première intention en l’absence de microscopie',
    'Goutte épaisse (recherche et densité parasitaire) et frottis sanguin (identification de l’espèce)',
    'Numération formule sanguine : anémie, thrombopénie',
    'Glycémie capillaire : recherche d’une hypoglycémie, surtout chez l’enfant et la femme enceinte',
    'Hémoglobine ou hématocrite : recherche d’une anémie sévère',
    'Forme grave : créatininémie, ionogramme sanguin, bilirubine, groupe sanguin, lactates si disponibles',
  ],
  referenceDiagnosis: `Accès palustre simple : fièvre (ou notion de fièvre récente) ET confirmation parasitologique (TDR ou goutte épaisse positifs), sans aucun signe de gravité.

Paludisme grave : présence de Plasmodium falciparum ET d'au moins un critère de gravité de l'OMS :
- trouble de la conscience ou coma
- prostration (incapacité de s'asseoir ou de se tenir debout)
- convulsions répétées (2 ou plus en 24 heures)
- détresse respiratoire
- collapsus circulatoire (choc)
- ictère
- saignement anormal
- anémie sévère (hémoglobine inférieure à 5 g/dL chez l'enfant)
- hypoglycémie (inférieure à 2,2 mmol/L, soit 0,4 g/L)
- insuffisance rénale ou hémoglobinurie
- parasitémie très élevée

En zone d'endémie, toute fièvre doit faire rechercher un paludisme, sans exclure pour autant une autre cause associée.`,
  onSiteTreatment: `1. Accès palustre simple (traitement ambulatoire)
- Combinaison thérapeutique à base d'artémisinine (CTA) par voie orale pendant 3 jours, selon les directives nationales : artéméther-luméfantrine (AL), artésunate-amodiaquine (ASAQ) ou dihydroartémisinine-pipéraquine (DHA-PPQ).
- Traitement de la fièvre : paracétamol.
- Administrer la première dose sur place et insister sur la nécessité de terminer les 3 jours de traitement.
- Traiter uniquement après confirmation parasitologique lorsque le TDR ou la goutte épaisse est disponible.

2. Paludisme grave (urgence, hospitalisation)
- Artésunate injectable (voie IV ou IM) : 2,4 mg/kg à H0, H12 et H24, puis une fois par jour (3 mg/kg si poids inférieur à 20 kg).
- Après au moins 24 heures de traitement injectable, et dès que le patient peut avaler : relais par une cure complète de CTA orale pendant 3 jours.
- Corriger l'hypoglycémie, traiter les convulsions (benzodiazépine), transfuser en cas d'anémie sévère, surveiller la conscience, la diurèse et les constantes.
- Si le plateau technique est insuffisant : première dose d'artésunate (IM) puis transfert urgent vers une structure de référence.

3. Femme enceinte
- Le paludisme est plus grave pendant la grossesse : prise en charge selon le protocole national, avis médical systématique.`,
  dischargePrescription: `Ordonnance indicative pour un adulte de 35 kg ou plus, accès palustre simple confirmé, sans signe de gravité (à adapter au poids, à l'âge, à la grossesse et aux directives nationales) :

1. Artéméther-luméfantrine 20 mg/120 mg : 4 comprimés le matin et 4 comprimés le soir pendant 3 jours (6 prises au total), à prendre au cours d'un repas ou avec du lait.
2. Paracétamol 1 g : 1 comprimé toutes les 6 à 8 heures en cas de fièvre ou de douleur, sans dépasser 3 g par jour.
3. Boire abondamment.

Conseils : terminer le traitement même si la fièvre disparaît. Revenir sans attendre en cas de vomissements répétés (traitement rejeté), de somnolence, de convulsions, de difficultés respiratoires, d'urines foncées ou de fièvre persistante après 3 jours. Dormir sous moustiquaire imprégnée.`,
  prevention: `- Dormir chaque nuit sous une moustiquaire imprégnée d'insecticide à longue durée d'action (MILDA), toute l'année.
- Lutte antivectorielle : éliminer les gîtes larvaires (eaux stagnantes, récipients abandonnés), assainir l'environnement.
- Femmes enceintes : traitement préventif intermittent à la sulfadoxine-pyriméthamine (TPIg-SP) à chaque consultation prénatale à partir du 2e trimestre (au moins 3 doses espacées d'au moins un mois), en plus de la MILDA.
- Vaccination antipaludique des jeunes enfants selon le calendrier vaccinal national.
- Consulter rapidement devant toute fièvre : un traitement précoce prévient les formes graves.
- Voyageurs non immuns : chimioprophylaxie adaptée avant tout séjour en zone d'endémie.`,
  references: [
    'OMS. Lignes directrices de l’OMS pour le paludisme (mises à jour régulières).',
    'Programme National de Lutte contre le Paludisme (PNLP), Côte d’Ivoire. Directives nationales de prise en charge des cas de paludisme.',
    'E. Pilly. Maladies infectieuses et tropicales (chapitre Paludisme).',
  ],
  questions: [
    qcm(
      'Quels examens permettent de confirmer un paludisme ?',
      [
        ['Test de diagnostic rapide (TDR)', true],
        ['Goutte épaisse', true],
        ['Radiographie thoracique', false],
        ['Sérologie VIH', false],
      ],
      'Le diagnostic de certitude repose sur la mise en évidence du parasite : TDR (détection d’antigènes) et goutte épaisse (microscopie). Une radiographie ou une sérologie VIH ne confirment pas le paludisme.',
    ),
    qcd(
      'Le paludisme est transmis à l’homme par la piqûre d’un moustique anophèle femelle infecté.',
      true,
      'Seule l’anophèle femelle, qui a besoin de sang pour la maturation de ses œufs, transmet le Plasmodium.',
    ),
    qcm(
      'Parmi les signes suivants, lesquels sont des critères de gravité du paludisme ?',
      [
        ['Troubles de la conscience', true],
        ['Convulsions répétées', true],
        ['Détresse respiratoire', true],
        ['Fièvre à 38,5 °C isolée', false],
      ],
      'Les troubles de la conscience, les convulsions répétées et la détresse respiratoire font partie des critères de gravité de l’OMS. Une fièvre isolée, même élevée, ne suffit pas à définir une forme grave.',
    ),
    qcd(
      'Le traitement de première intention du paludisme grave est l’artésunate injectable.',
      true,
      'L’artésunate par voie IV ou IM est le traitement de référence du paludisme grave ; il est suivi d’une cure complète de CTA orale dès que le patient peut avaler.',
    ),
    qcm(
      'Lesquelles de ces associations sont des combinaisons thérapeutiques à base d’artémisinine (CTA) ?',
      [
        ['Artéméther-luméfantrine', true],
        ['Artésunate-amodiaquine', true],
        ['Dihydroartémisinine-pipéraquine', true],
        ['Chloroquine seule', false],
      ],
      'Les trois premières sont des CTA recommandées. La chloroquine en monothérapie n’est plus recommandée pour P. falciparum à cause des résistances.',
    ),
    qcd(
      'La chloroquine en monothérapie est recommandée en première intention pour le paludisme à P. falciparum.',
      false,
      'Les résistances de P. falciparum à la chloroquine sont très répandues : le traitement de première intention est une CTA.',
    ),
    qcm(
      'Quelles mesures contribuent à la prévention du paludisme ?',
      [
        ['Moustiquaire imprégnée d’insecticide à longue durée d’action (MILDA)', true],
        ['Traitement préventif intermittent (TPIg-SP) chez la femme enceinte', true],
        ['Élimination des eaux stagnantes autour des habitations', true],
        ['Antibiothérapie systématique en cas de fièvre', false],
      ],
      'La prévention combine protection contre les piqûres, lutte contre les gîtes larvaires et chimioprévention des femmes enceintes. Les antibiotiques n’ont aucune action contre le Plasmodium.',
    ),
    qcd(
      'Une seule goutte épaisse négative permet d’exclure formellement un paludisme, même en cas de forte suspicion clinique.',
      false,
      'Un résultat négatif isolé n’élimine pas le diagnostic : en cas de forte suspicion, l’examen doit être répété (par exemple après 6 à 12 heures) et le patient surveillé.',
    ),
    qcm(
      'Chez un patient atteint de paludisme grave qui s’améliore sous artésunate injectable, que faut-il faire ?',
      [
        ['Relayer par une cure complète de CTA orale de 3 jours', true],
        ['Arrêter tout traitement dès la disparition de la fièvre', false],
        ['Poursuivre l’artésunate injectable pendant 14 jours', false],
      ],
      'Après au moins 24 heures de traitement injectable et dès que le patient peut avaler, on relaie par une cure complète de CTA orale de 3 jours pour achever l’éradication des parasites.',
    ),
    qcd(
      'Les moustiquaires imprégnées d’insecticide doivent être utilisées toute l’année, et pas seulement en saison des pluies.',
      true,
      'La transmission est endémique : les anophèles piquent toute l’année, avec un pic en saison des pluies. La protection doit donc être continue.',
    ),
  ],
};
