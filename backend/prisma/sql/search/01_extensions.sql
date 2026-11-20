-- =============================================================================
-- TIBELE — Extensions PostgreSQL requises
-- -----------------------------------------------------------------------------
-- À placer EN TÊTE de la migration initiale (avant le SQL généré par Prisma),
-- car l'index trigramme `gin_trgm_ops` en dépend.
-- Sur Supabase, les extensions sont installées dans le schéma `extensions`
-- (présent dans le search_path par défaut). Le CREATE SCHEMA rend le script
-- exécutable aussi sur une base PostgreSQL standard (base shadow, local, CI).
-- Idempotent.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;

-- Recherche partielle / tolérante aux fautes sur le titre
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Suppression des accents (ex. « diabete » trouve « diabète »)
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
