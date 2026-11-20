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
