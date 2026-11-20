TIBELE

1. Vision et contexte

TIBELE est une application web progressive (PWA) éducative destinée aux étudiants en médecine, aux infirmiers et aux médecins exerçant en Côte d'Ivoire. Le projet vise à fournir un support d'apprentissage structuré sous forme de fiches pédagogiques portant sur les pathologies courantes, avec pour chaque fiche une définition claire, les examens à réaliser, le diagnostic référentiel, la prise en charge sur place, l'ordonnance de sortie type et les mesures préventives.

Il est essentiel de souligner dès le départ que TIBELE n'est en aucun cas un outil de conseil médical. Il s'agit exclusivement d'un support pédagogique à visée éducative. Cette mention doit apparaître de manière visible sur chaque fiche pathologie, sous forme d'un bandeau d'avertissement, et pas seulement dans un pied de page.

La plateforme est entièrement gratuite. Aucun abonnement, aucune formule payante, aucun paywall. Toutes les fonctionnalités sont accessibles à tous les utilisateurs connectés. Pour soutenir financièrement le projet, une invitation aux dons est proposée de façon non intrusive via un popup flottant qui redirige vers un lien de paiement Djamo. Ce popup ne bloque jamais la navigation et reste discret.

2. Utilisateurs et rôles

Il existe deux types de comptes :

D'une part, le compte utilisateur standard, ouvert à toute personne qui s'inscrit avec un email et un mot de passe. Il donne accès à toutes les fiches pédagogiques, au forum de discussion, aux modules d'auto-évaluation (QCM et QCD) et à l'historique personnel des tentatives.

D'autre part, le compte administrateur, qui hérite de tous les droits d'un utilisateur standard et dispose en plus d'un panneau d'administration permettant de gérer les pathologies, les questions des quiz et la modération du forum. Le rôle administrateur est stocké côté serveur dans les métadonnées applicatives de l'utilisateur (au sens Supabase Auth), non modifiables par l'utilisateur lui-même, afin d'éviter toute escalade de privilèges. La création du premier administrateur se fait manuellement via une commande SQL exécutée dans l'éditeur Supabase.

Il n'existe pas de compte "établissement" ni de compte collectif : chaque compte est strictement individuel.

3. Stack technique

Le projet est construit autour de trois briques : un frontend React en TypeScript, un backend Node.js avec Express en TypeScript, et une base de données PostgreSQL hébergée sur Supabase, qui fournit également le service d'authentification.

Le frontend utilise React avec Vite comme bundler, React Router pour la navigation, TailwindCSS pour le style (thème médical bleu et blanc, approche mobile-first), et TanStack Query pour la gestion des données serveur et du cache. La PWA est configurée avec le plugin VitePWA, incluant un manifeste, un service worker et les icônes nécessaires.

Le backend est une API REST Express écrite en TypeScript, utilisant Prisma comme ORM pour dialoguer avec PostgreSQL, Zod pour la validation des entrées, et le SDK Supabase en mode "service role" pour vérifier les jetons d'authentification émis par Supabase Auth. Le backend ne gère ni l'inscription ni la connexion : ces opérations sont déléguées à Supabase Auth côté frontend. Le backend se contente de vérifier la validité du jeton envoyé dans le header Authorization et d'en extraire l'identité et le rôle de l'utilisateur.

La base de données PostgreSQL est hébergée sur Supabase. Prisma se connecte à la base via deux URL : une URL avec pooler pour les requêtes applicatives, et une URL directe pour les migrations. Les tables de l'application vivent dans le schéma public ; les tables d'authentification (auth.users) sont gérées par Supabase et ne doivent jamais être manipulées directement par Prisma. Un trigger SQL crée automatiquement une ligne dans la table profiles à chaque nouvelle inscription, en y reportant l'identifiant de l'utilisateur et son nom complet s'il a été fourni.

4. Modèle de données

Le modèle de données s'articule autour de plusieurs entités.

Profils : chaque utilisateur dispose d'un profil lié à son identifiant Supabase. Le profil contient le nom complet (facultatif), le rôle (utilisateur ou administrateur, dupliqué pour faciliter les requêtes) et les dates de création et mise à jour.

Pathologies : chaque fiche représente une pathologie. Elle contient un titre, un slug unique généré à partir du titre, une description courte, une définition longue, la liste des examens à réaliser, le diagnostic référentiel, le traitement sur place, l'ordonnance de sortie type, les mesures de prévention, un tableau de références bibliographiques, une URL d'image optionnelle, et les dates de création et mise à jour. Un vecteur de recherche full-text en français est généré automatiquement à partir du titre, de la description et de la définition, avec un index GIN associé, pour permettre une recherche performante. Un index trigramme sur le titre complète le dispositif pour les recherches partielles.

Sujets du forum : chaque sujet contient un titre, le contenu du premier message, l'auteur (référence vers un profil), une pathologie associée optionnelle (référence vers une pathologie, utile pour contextualiser la discussion), un compteur de réponses et la date de création. Les sujets sont listés par ordre chronologique inverse, avec une pagination de dix sujets par page.

Messages du forum : chaque message est rattaché à un sujet, possède un auteur, un contenu et une date de création. La suppression d'un sujet entraîne en cascade la suppression de ses messages. Les messages sont paginés à raison de dix par page.

Questions : chaque question est rattachée à une pathologie et possède un texte, un type (QCM ou QCD), un tableau d'options et une explication facultative. Pour un QCM, les options sont une liste d'objets comportant chacun un texte et un booléen indiquant si l'option est correcte ; plusieurs options peuvent être correctes simultanément. Pour un QCD (question à choix direct, c'est-à-dire vrai ou faux), on utilise le même format mais avec deux options seulement : la première option représente "Vrai", la seconde représente "Faux", et l'indicateur de bonne réponse est positionné sur l'une des deux.

Tentatives de quiz : à chaque soumission d'un quiz complet par un utilisateur, une ligne est créée contenant l'identifiant de l'utilisateur, l'identifiant de la pathologie, le score obtenu, le nombre total de questions et la date de complétion. Les réponses individuelles sont rattachées à cette tentative, formant ainsi un historique structuré et exploitable pour afficher les progrès de l'apprenant.

Réponses utilisateur : chaque réponse est rattachée à une tentative de quiz et à une question. Elle contient la réponse fournie (sous forme d'objet JSON) et un booléen indiquant si la réponse était correcte. Pour un QCM, la réponse stockée contient la liste des index sélectionnés. Pour un QCD, elle contient un booléen.

5. Authentification et sécurité

L'authentification repose entièrement sur Supabase Auth. Le frontend utilise le SDK Supabase côté client avec la clé publique anonyme pour inscrire les utilisateurs, les connecter, maintenir la session et rafraîchir les jetons. Le jeton d'accès est automatiquement attaché à chaque appel API vers le backend.

Le backend, à chaque requête protégée, extrait le jeton du header Authorization et le fait vérifier par le SDK Supabase en mode service role via la méthode getUser. Cette vérification garantit que le jeton est valide et non expiré, et permet de récupérer les métadonnées applicatives, dont le rôle. Un middleware d'authentification injecte ensuite l'utilisateur dans l'objet requête. Un second middleware, chaîné après le premier, bloque l'accès aux routes administrateur pour tout utilisateur dont le rôle n'est pas administrateur.

La clé service role Supabase ne doit en aucun cas être exposée côté frontend. Elle réside uniquement dans le fichier d'environnement du backend et n'apparaît jamais dans un bundle client.

Les mots de passe sont gérés par Supabase Auth, qui utilise bcrypt en interne avec les standards de sécurité actuels. Le backend n'a jamais accès aux mots de passe en clair.

La sécurité comporte également plusieurs autres mesures : utilisation de Helmet pour les en-têtes HTTP de sécurité, configuration CORS avec une liste blanche d'origines, rate-limiting global (100 requêtes par tranche de 15 minutes par IP) et rate-limiting renforcé sur les routes d'écriture (20 requêtes par minute). Les entrées sont validées systématiquement avec Zod. Toutes les requêtes Prisma utilisent des requêtes paramétrées via Prisma Client ; aucune concaténation SQL manuelle n'est autorisée sauf via tagged template si nécessaire.

Le contenu du forum est stocké en texte brut et échappé à l'affichage React, empêchant toute injection HTML ou XSS.

6. Règles métier

Toutes les routes sont publiques pour la consultation des pathologies et la recherche. Les routes de création de sujets, de réponses, de soumission de quiz et de consultation d'historique nécessitent une authentification. Les routes d'administration nécessitent en plus le rôle administrateur.

Une attention particulière doit être portée à la confidentialité des bonnes réponses aux questions. Lorsqu'un endpoint renvoie les questions d'un quiz au frontend, il ne doit jamais inclure l'indicateur de bonne réponse. Seul l'endpoint de correction, appelé à la soumission, calcule le score côté serveur. Le frontend reçoit ensuite le score final et la liste des réponses correctes ou incorrectes, sans que l'utilisateur ait pu connaître les réponses avant de soumettre.

La correction d'un QCM suit une logique tout ou rien : une réponse est considérée correcte uniquement si l'utilisateur a coché exactement les bonnes options, ni plus ni moins. Une seule mauvaise option cochée ou une seule bonne option oubliée rend la réponse fausse. La correction d'un QCD est binaire : l'utilisateur doit choisir la bonne valeur de vérité.

La recherche fonctionne sur les champs titre, description courte et définition. Une première implémentation peut utiliser des recherches insensibles à la casse avec contains, puis évoluer vers une recherche full-text PostgreSQL optimisée. Les résultats de recherche affichent le titre, l'extrait et l'image.

Le forum est ouvert à tout utilisateur connecté en lecture et en écriture. Les visiteurs non connectés peuvent lire les sujets et messages, mais doivent se connecter pour poster. L'administrateur peut supprimer n'importe quel sujet ou message, indépendamment de son auteur.

7. Fonctionnalités frontend

L'application comporte les pages suivantes.

Page d'accueil : liste paginée des pathologies, avec pour chacune une vignette (image ou placeholder), le titre, un extrait de la description et un lien vers la fiche complète. Une barre de recherche permet de filtrer dynamiquement. Un bandeau d'avertissement rappelle que TIBELE est un outil pédagogique et non un outil de diagnostic.

Page fiche pathologie : affichage complet de la fiche avec toutes ses sections bien séparées visuellement (définition, examens, diagnostic référentiel, traitement sur place, ordonnance de sortie, prévention, références). Un bandeau d'avertissement médical est affiché en haut de manière permanente. Un bouton mène directement au module d'auto-évaluation associé à la pathologie.

Page forum : liste paginée des sujets, avec le titre, l'auteur, la date, le nombre de réponses et la pathologie associée le cas échéant. Un bouton permet de créer un nouveau sujet, accessible aux utilisateurs connectés. Un formulaire simple avec titre, contenu et sélection optionnelle de pathologie est proposé.

Page sujet du forum : affichage du premier message et des réponses paginées, avec un formulaire de réponse en bas pour les utilisateurs connectés. Les modérateurs disposent de boutons de suppression.

Page quiz : pour une pathologie donnée, les questions sont chargées et affichées une par une ou en liste. L'utilisateur répond à toutes les questions, puis soumet. Le score final est affiché avec le détail question par question (correct ou incorrect) et l'explication éventuelle. Un bouton permet de recommencer ou de consulter l'historique.

Page historique : liste des tentatives passées avec la pathologie, le score, la date, et un lien pour revoir les détails.

Page connexion / inscription : formulaires simples avec email et mot de passe, plus le nom complet à l'inscription. Gestion des erreurs claire (email déjà pris, mot de passe trop faible, identifiants incorrects).

Page profil : affichage du nom complet, de l'email, du rôle et de la date d'inscription. Bouton de déconnexion. Aucune gestion d'abonnement puisque tout est gratuit.

Panneau administrateur : accessible uniquement aux administrateurs via un lien visible dans la barre de navigation. Permet de créer, modifier et supprimer des pathologies ; de gérer les questions des quiz rattachées aux pathologies (création, modification, suppression) ; et de modérer le forum (suppression de sujets et de messages).

8. Composants transversaux

Popup de dons : un composant flottant, non intrusif, qui invite à soutenir le projet par un don via Djamo. Le popup s'affiche après un certain temps de navigation (par exemple deux minutes cumulées ou trois pages vues), au maximum une fois par session. Il peut être fermé et ne plus être réaffiché pendant sept jours grâce à un stockage local. Un petit bouton flottant permanent (icône cœur discrète en bas à droite) reste visible pour permettre à tout moment d'accéder au lien de don. Aucune donnée n'est stockée en base à ce sujet ; tout est géré côté client via le stockage local du navigateur.

Invitation à installer la PWA : un composant détecte l'événement beforeinstallprompt du navigateur et propose un bouton discret "Installer TIBELE" quand l'application est installable. Une fois installée, l'invitation disparaît automatiquement.

Barre de navigation : présente sur toutes les pages, avec logo, liens vers l'accueil, le forum, la page profil, l'historique, et un lien administrateur conditionnel. Sur mobile, elle se transforme en menu hamburger.

Avertissement médical : composant réutilisable affiché sur chaque fiche pathologie et éventuellement sur d'autres pages clés, rappelant que TIBELE est un support pédagogique et non un outil de conseil médical.

Gestion des routes protégées : un composant ProtectedRoute vérifie la présence d'une session et redirige vers la page de connexion si nécessaire. Une variante admin vérifie également le rôle.

9. PWA

L'application est une PWA complète. Un manifeste définit le nom ("TIBELE"), le nom court, une description, une couleur de thème médicale (bleu foncé), un fond blanc, le mode d'affichage standalone, et les icônes aux tailles requises (192x192, 512x512, et une icône maskable 512x512).

Le service worker est généré automatiquement par VitePWA avec une stratégie de mise à jour automatique. Les assets statiques (JavaScript, CSS, HTML, images) sont mis en cache avec une stratégie cache-first. Les requêtes vers les endpoints de pathologies sont mises en cache avec une stratégie stale-while-revalidate, ce qui permet à un utilisateur en zone à faible connectivité de consulter récemment des fiches déjà chargées.

Une bannière "Installer l'application" est proposée de manière non intrusive lorsque le navigateur détecte l'installabilité.

10. Structure du projet

Le projet est organisé en deux dossiers racine : un dossier backend et un dossier frontend, chacun avec sa propre configuration TypeScript, ses dépendances et son fichier d'environnement. Un fichier README à la racine documente les étapes d'installation et de démarrage.

Le backend est structuré en plusieurs sous-dossiers : config pour les variables d'environnement, les clients Supabase et Prisma ; middlewares pour l'authentification, la gestion d'erreurs et le rate-limiting ; routes pour les endpoints organisés par domaine (pathologies, forum, quiz, admin) ; controllers pour la logique métier extraite des routes si besoin ; validators pour les schémas Zod ; utils pour les fonctions utilitaires. Le schéma Prisma et les fichiers SQL annexes (trigger, recherche full-text) sont placés dans un dossier prisma séparé. Un dossier scripts contient le script de seed des données de démonstration.

Le frontend est structuré en composants, pages, hooks, contexte d'authentification, services API et bibliothèque cliente Supabase. Les pages correspondent aux écrans listés plus haut. Les composants réutilisables incluent le popup de dons, l'invitation à installer, la route protégée et l'avertissement médical. Le contexte d'authentification centralise l'état de session et expose les fonctions de connexion, déconnexion et inscription.

11. Données de démonstration

Un script de seed alimente la base avec quelques pathologies réalistes (par exemple paludisme, hypertension artérielle, gastro-entérite) comprenant toutes les sections remplies de manière cohérente, ainsi qu'une dizaine de questions QCM et QCD par pathologie, et quelques sujets de forum pour animer le forum dès le démarrage.

12.  Contraintes transversales

Le site doit être entièrement responsive, pensé mobile-first, compte tenu du fait que la majorité des utilisateurs ivoiriens y accéderont depuis un smartphone.

La performance est un critère important : la page d'accueil doit se charger rapidement, la recherche doit répondre en moins d'une seconde sur une connexion mobile standard, et la PWA doit rester fonctionnelle en mode dégradé (offline partiel pour les fiches déjà consultées).

La scalabilité est garantie par l'usage d'index adaptés en base (slug unique, index sur les clés étrangères, index full-text et trigramme) et par une architecture sans état côté backend, permettant un scale horizontal sur plusieurs instances. 
