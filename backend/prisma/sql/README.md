# Scripts SQL annexes (Supabase)

Ces scripts complètent `prisma/schema.prisma` pour ce que Prisma ne sait pas
exprimer. Ils sont tous **idempotents**.

| Fichier                                   | Rôle                                                                 | Où l'appliquer                                   |
| ----------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| `search/01_extensions.sql`                | Extensions `pg_trgm` et `unaccent`                                   | **Début** de la migration initiale               |
| `search/02_pathologies_search_vector.sql` | Config `french_unaccent`, colonne générée `search_vector`, index GIN | **Fin** de la migration initiale                 |
| `constraints/01_check_constraints.sql`    | Contraintes CHECK (scores, options des questions, slug…)             | **Fin** de la migration initiale                 |
| `security/01_enable_rls.sql`              | RLS activée sans policy sur toutes les tables                        | **Fin** de la migration initiale                 |
| `triggers/01_auth_users_profiles.sql`     | Création / synchro / suppression des profils depuis `auth.users`     | Éditeur SQL Supabase, **après** les migrations   |
| `admin/01_promote_first_admin.sql`        | Promotion du premier administrateur                                  | Éditeur SQL Supabase, une fois le compte inscrit |

## Procédure (migration initiale)

```bash
# 1. Générer la migration SANS l'appliquer
npx prisma migrate dev --name init --create-only

# 2. Éditer prisma/migrations/<horodatage>_init/migration.sql :
#    - coller search/01_extensions.sql EN TÊTE
#    - coller search/02, constraints/01 et security/01 EN FIN (dans cet ordre)

# 3. Appliquer
npx prisma migrate dev        # en développement
npx prisma migrate deploy     # en production
```

Puis, dans l'éditeur SQL Supabase : `triggers/01_auth_users_profiles.sql`,
et plus tard `admin/01_promote_first_admin.sql`.

## Pourquoi deux catégories ?

- Les scripts qui ne touchent que `public` sont **intégrés aux migrations** :
  la base shadow de Prisma les rejoue, ce qui évite toute dérive de schéma.
- Les scripts qui touchent `auth` (géré par Supabase) **ne peuvent pas** être
  dans les migrations : la base shadow n'a pas de schéma `auth`.
