-- =============================================================================
-- TIBELE — Contraintes d'intégrité (CHECK) non exprimables dans Prisma
-- -----------------------------------------------------------------------------
-- À placer EN FIN de la migration initiale. Filet de sécurité en base, en
-- complément de la validation Zod côté backend (qui reste la 1re barrière).
-- Idempotent (DROP ... IF EXISTS puis ADD).
-- =============================================================================

-- Pathologies : titre non vide, slug au format kebab-case ASCII
ALTER TABLE public.pathologies DROP CONSTRAINT IF EXISTS pathologies_title_not_blank;
ALTER TABLE public.pathologies
  ADD CONSTRAINT pathologies_title_not_blank CHECK (char_length(btrim(title)) > 0);

ALTER TABLE public.pathologies DROP CONSTRAINT IF EXISTS pathologies_slug_format;
ALTER TABLE public.pathologies
  ADD CONSTRAINT pathologies_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Forum : contenus non vides, compteur de réponses positif
ALTER TABLE public.forum_topics DROP CONSTRAINT IF EXISTS forum_topics_title_not_blank;
ALTER TABLE public.forum_topics
  ADD CONSTRAINT forum_topics_title_not_blank CHECK (char_length(btrim(title)) > 0);

ALTER TABLE public.forum_topics DROP CONSTRAINT IF EXISTS forum_topics_content_not_blank;
ALTER TABLE public.forum_topics
  ADD CONSTRAINT forum_topics_content_not_blank CHECK (char_length(btrim(content)) > 0);

ALTER TABLE public.forum_topics DROP CONSTRAINT IF EXISTS forum_topics_reply_count_positive;
ALTER TABLE public.forum_topics
  ADD CONSTRAINT forum_topics_reply_count_positive CHECK (reply_count >= 0);

ALTER TABLE public.forum_posts DROP CONSTRAINT IF EXISTS forum_posts_content_not_blank;
ALTER TABLE public.forum_posts
  ADD CONSTRAINT forum_posts_content_not_blank CHECK (char_length(btrim(content)) > 0);

-- Questions : options = tableau JSON ; QCD = exactement 2 options ; QCM >= 2
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_options_shape;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_options_shape CHECK (
    jsonb_typeof(options) = 'array'
    AND (
      (type = 'QCD' AND jsonb_array_length(options) = 2)
      OR (type = 'QCM' AND jsonb_array_length(options) >= 2)
    )
  );

-- Tentatives : 0 <= score <= total, au moins une question
ALTER TABLE public.quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_score_range;
ALTER TABLE public.quiz_attempts
  ADD CONSTRAINT quiz_attempts_score_range
  CHECK (total_questions > 0 AND score >= 0 AND score <= total_questions);
