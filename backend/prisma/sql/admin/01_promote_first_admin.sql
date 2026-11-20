-- =============================================================================
-- TIBELE — Création du premier administrateur
-- -----------------------------------------------------------------------------
-- Prérequis :
--   - triggers/01_auth_users_profiles.sql déjà exécuté ;
--   - le compte a été créé normalement via l'inscription de l'application.
--
-- Usage : remplacer l'email ci-dessous, puis exécuter dans l'éditeur SQL
-- Supabase. Le rôle est écrit dans app_metadata (source de vérité, non
-- modifiable par l'utilisateur) ; le trigger recopie le rôle dans profiles.
-- Le backend lit app_metadata via getUser() : effet immédiat.
--
-- Pour rétrograder un admin : remplacer 'admin' par 'user'.
-- =============================================================================

UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'admin@exemple.ci';   -- <<< À REMPLACER

-- Vérification
SELECT u.email, u.raw_app_meta_data ->> 'role' AS app_metadata_role, p.role AS profile_role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'admin@exemple.ci';  -- <<< À REMPLACER
