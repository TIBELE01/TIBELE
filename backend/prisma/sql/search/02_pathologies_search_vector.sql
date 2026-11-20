-- =============================================================================
-- TIBELE — Recherche full-text française sur les pathologies
-- -----------------------------------------------------------------------------
-- À placer EN FIN de la migration initiale (après le SQL généré par Prisma).
-- Prérequis : 01_extensions.sql.
--
-- 1. Configuration de recherche `public.french_unaccent` : français (racinisation
--    `french_stem`) + suppression des accents (dictionnaire `unaccent`).
-- 2. Transformation de `pathologies.search_vector` (créée par Prisma comme
--    simple colonne tsvector) en colonne GÉNÉRÉE, recalculée automatiquement
--    par PostgreSQL à chaque INSERT/UPDATE. Pondération :
--      A = titre, B = description courte, C = définition.
-- 3. Recréation de l'index GIN (supprimé avec l'ancienne colonne).
--
-- Exemple de requête (côté backend, via $queryRaw paramétré) :
--   WHERE search_vector @@ websearch_to_tsquery('public.french_unaccent', $1)
--   ORDER BY ts_rank(search_vector, websearch_to_tsquery('public.french_unaccent', $1)) DESC
-- Idempotent.
-- =============================================================================

-- 1. Configuration de recherche française sans accents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_ts_config
    WHERE cfgname = 'french_unaccent' AND cfgnamespace = 'public'::regnamespace
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION public.french_unaccent (COPY = pg_catalog.french);
    ALTER TEXT SEARCH CONFIGURATION public.french_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH extensions.unaccent, pg_catalog.french_stem;
  END IF;
END
$$;

-- 2. Colonne générée (l'expression est IMMUTABLE : config explicite en regconfig)
ALTER TABLE public.pathologies DROP COLUMN IF EXISTS search_vector;

ALTER TABLE public.pathologies
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(title, '')), 'A') ||
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(definition, '')), 'C')
  ) STORED;

-- 3. Index GIN (même nom que dans schema.prisma pour éviter toute dérive)
CREATE INDEX IF NOT EXISTS pathologies_search_vector_idx
  ON public.pathologies USING GIN (search_vector);
