-- =============================================================================
-- TIBELE — Row Level Security sur toutes les tables applicatives
-- -----------------------------------------------------------------------------
-- POURQUOI : Supabase expose le schéma `public` via son API REST (PostgREST)
-- avec la clé anonyme publique. Sans RLS, n'importe qui pourrait lire/écrire
-- les tables directement, en contournant le backend.
--
-- STRATÉGIE : RLS activée SANS AUCUNE policy => tout accès via anon /
-- authenticated est refusé. Seul le backend accède aux données, via Prisma,
-- connecté avec le rôle propriétaire des tables (postgres), qui n'est pas
-- soumis à la RLS (pas de FORCE ROW LEVEL SECURITY).
--
-- À placer EN FIN de la migration initiale. Toute nouvelle table devra
-- également avoir la RLS activée. Idempotent.
-- =============================================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathologies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers   ENABLE ROW LEVEL SECURITY;

-- Table d'historique des migrations Prisma (créée dans public par Prisma)
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;
