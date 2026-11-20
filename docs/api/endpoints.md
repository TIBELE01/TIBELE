# API TIBELE — endpoints

Base : `/api`. Réponses JSON. Succès : `{ "data": … }` (+ `"meta"` pour les listes).
Erreurs : `{ "error": { "code", "message", "details"? } }`.
Authentification : header `Authorization: Bearer <jeton Supabase>`.

Pagination : `meta = { page, pageSize, total, totalPages }`.

| Méthode | Route                              | Accès    | Description                                                                                                                                                |
| ------- | ---------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/health`                          | public   | Sonde de vie (hors `/api`)                                                                                                                                 |
| GET     | `/api/pathologies?page=&limit=&q=` | public   | Liste paginée par ordre alphabétique (`limit` ≤ 50, 12 par défaut). `q` : recherche full-text française sans accents + titre partiel, triée par pertinence |
| GET     | `/api/pathologies/:slug`           | public   | Fiche complète + `questionsCount`                                                                                                                          |
| GET     | `/api/forum/topics?page=`          | public*  | Sujets, 10 par page, du plus récent au plus ancien                                                                                                         |
| GET     | `/api/forum/topics/:id`            | public*  | Un sujet avec son premier message                                                                                                                          |
| POST    | `/api/forum/topics`                | connecté | Crée un sujet `{ title (3–200), content (1–10 000), pathologyId? }` → 201                                                                                  |

\* La lecture du forum est publique (CONTEXTE §6). Pour la réserver aux connectés :
ajouter `forumRouter.use(authenticate)` dans `src/routes/forum.routes.ts`.

Les écritures sont limitées à 20 requêtes/minute, toutes les routes à 300 requêtes / 15 min (par IP).

## Quiz (connexion requise, jamais mis en cache : `Cache-Control: no-store`)

| Méthode | Route                                   | Description                                                                                                                                                                                                                                                                                              |
| ------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET     | `/api/quiz/pathologies/:slug/questions` | Questions de la pathologie, **sans bonnes réponses ni explications** : `{ id, text, type, options: [{ text }] }`                                                                                                                                                                                         |
| POST    | `/api/quiz/pathologies/:slug/attempts`  | Soumission : `{ answers: [{ questionId, selected: number[] }` (QCM) ou `{ questionId, value: boolean }` (QCD) `] }`. Une réponse par question, toutes obligatoires. Renvoie 201 avec `score`, `totalQuestions` et, par question, `isCorrect`, `userAnswer`, `explanation` (jamais les options correctes) |
| GET     | `/api/quiz/attempts?page=`              | Historique personnel, 10 par page, du plus récent au plus ancien                                                                                                                                                                                                                                         |
| GET     | `/api/quiz/attempts/:id`                | Détail d'une de ses tentatives (404 si elle appartient à un autre utilisateur)                                                                                                                                                                                                                           |

Correction côté serveur uniquement : QCM **tout ou rien** (exactement les bonnes options), QCD binaire.
Le corps de la soumission est strict : toute clé inconnue (`score`, `isCorrect`…) est refusée.

## Administration (rôle administrateur uniquement : 401 sans jeton, 403 sinon)

| Méthode | Route                                  | Description                                                                                          |
| ------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| POST    | `/api/admin/pathologies`               | Crée une fiche (slug généré, suffixe `-2` si déjà pris) → 201                                        |
| PATCH   | `/api/admin/pathologies/:id`           | Modification partielle (le slug ne change jamais ; `imageUrl: null` retire l'image)                  |
| DELETE  | `/api/admin/pathologies/:id`           | Supprime la fiche, ses questions et les tentatives associées → 204                                   |
| GET     | `/api/admin/pathologies/:id/questions` | Questions **avec** bonnes réponses                                                                   |
| POST    | `/api/admin/pathologies/:id/questions` | Crée une question `{ text, type: "QCM"\|"QCD", options: [{ text, isCorrect }], explanation? }` → 201 |
| PUT     | `/api/admin/questions/:id`             | Remplace une question (le type est immuable)                                                         |
| DELETE  | `/api/admin/questions/:id`             | Supprime une question → 204                                                                          |
| DELETE  | `/api/admin/forum/topics/:id`          | Supprime un sujet et ses messages → 204                                                              |
| DELETE  | `/api/admin/forum/posts/:id`           | Supprime un message et décrémente le compteur de réponses → 204                                      |

Règles des questions : QCM = 2 à 8 options dont au moins une correcte ; QCD = exactement 2 options dont une correcte
(libellés normalisés en « Vrai » / « Faux »).

## Santé

| Route               | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `GET /health`       | Sonde de vie (sans accès à la base, hors rate limiting)   |
| `GET /health/ready` | Sonde de disponibilité : 200 si la base répond, 503 sinon |
