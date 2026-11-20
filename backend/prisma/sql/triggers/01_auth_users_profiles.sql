-- =============================================================================
-- TIBELE — Synchronisation auth.users -> public.profiles
-- -----------------------------------------------------------------------------
-- NE FAIT PAS partie des migrations Prisma (dépend du schéma `auth` géré par
-- Supabase, absent de la base shadow). À exécuter APRÈS les migrations, une
-- fois, dans l'éditeur SQL Supabase (ou `npx prisma db execute --file ...`).
-- Idempotent : peut être ré-exécuté sans risque.
--
-- Trois triggers sur auth.users :
--   1. AFTER INSERT : crée le profil (id, nom complet, rôle).
--   2. AFTER UPDATE du rôle dans app_metadata : recopie le rôle dans profiles.
--   3. AFTER DELETE : supprime le profil (et, en cascade, ses sujets, messages
--      et tentatives).
--
-- Source de vérité du rôle : auth.users.raw_app_meta_data->>'role'
-- (app_metadata, non modifiable par l'utilisateur). Toute valeur autre que
-- 'admin' est traitée comme 'user'.
--
-- Sécurité : fonctions SECURITY DEFINER avec search_path vide (noms qualifiés),
-- exécution révoquée pour les rôles exposés par l'API.
-- =============================================================================

-- 1. Création du profil à l'inscription --------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    -- Nom complet facultatif (métadonnées d'inscription), tronqué à 120 car.
    left(NULLIF(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''), 120),
    CASE
      WHEN NEW.raw_app_meta_data ->> 'role' = 'admin' THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Synchronisation du rôle --------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET
    role = CASE
      WHEN NEW.raw_app_meta_data ->> 'role' = 'admin' THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END,
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- 3. Suppression du profil ----------------------------------------------------
-- (remplace une clé étrangère inter-schémas profiles.id -> auth.users.id,
--  que Prisma ne sait pas gérer sans dérive de schéma)
CREATE OR REPLACE FUNCTION public.handle_deleted_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- Les fonctions ne doivent pas être appelables via l'API (RPC PostgREST)
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user()         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_auth_user_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_deleted_auth_user()     FROM PUBLIC, anon, authenticated;

-- Triggers --------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

DROP TRIGGER IF EXISTS on_auth_user_role_updated ON auth.users;
CREATE TRIGGER on_auth_user_role_updated
  AFTER UPDATE OF raw_app_meta_data ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_app_meta_data ->> 'role' IS DISTINCT FROM NEW.raw_app_meta_data ->> 'role')
  EXECUTE FUNCTION public.handle_auth_user_role_change();

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_auth_user();

-- Rattrapage : profils manquants pour des comptes créés avant le trigger
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  u.id,
  left(NULLIF(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 120),
  CASE WHEN u.raw_app_meta_data ->> 'role' = 'admin'
       THEN 'admin'::public.user_role ELSE 'user'::public.user_role END,
  now(),
  now()
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
