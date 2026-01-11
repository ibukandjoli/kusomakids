-- Ajout de colonnes utiles pour l'affichage catalogue si elles manquent
ALTER TABLE public.story_templates ADD COLUMN IF NOT EXISTS price integer DEFAULT 3000;
ALTER TABLE public.story_templates ADD COLUMN IF NOT EXISTS age_range text DEFAULT '3-7 ans';
ALTER TABLE public.story_templates ADD COLUMN IF NOT EXISTS genre text DEFAULT 'Aventure';

-- Insertion des livres exemples
INSERT INTO public.story_templates (theme_slug, title_template, description, age_range, genre, content_json, is_active, cover_url)
VALUES
(
  'salif-metiers', 
  'Salif découvre les métiers', 
  'Dans cette aventure ludique et éducative, votre enfant découvre différents métiers passionnants. De pompier à médecin, en passant par agriculteur et artiste.',
  '4-6 ans',
  'Éducation',
  '{"idealFor": "Garçon & Fille"}',
  true,
  '/images/books/salif-metiers/main.png'
) ON CONFLICT (theme_slug) DO UPDATE 
SET description = EXCLUDED.description, is_active = true, cover_url = EXCLUDED.cover_url;

INSERT INTO public.story_templates (theme_slug, title_template, description, age_range, genre, content_json, is_active, cover_url)
VALUES
(
  'soso-etoiles', 
  'Soso et les Étoiles Magiques', 
  'Une aventure nocturne magique où votre enfant découvre les merveilles du ciel étoilé africain et les constellations racontées à travers des légendes traditionnelles.',
  '2-4 ans',
  'Aventure',
  '{"idealFor": "Garçon & Fille"}',
  true,
  '/images/books/soso-etoiles/main.png'
) ON CONFLICT (theme_slug) DO UPDATE 
SET description = EXCLUDED.description, is_active = true, cover_url = EXCLUDED.cover_url;

INSERT INTO public.story_templates (theme_slug, title_template, description, age_range, genre, content_json, is_active, cover_url)
VALUES
(
  'lina-abc', 
  'Le Voyage ABC avec Lina', 
  'Une aventure éducative pour apprendre l''alphabet à travers l''Afrique. Votre enfant découvre une lettre à chaque étape de son voyage.',
  '2-4 ans',
  'Éducation',
  '{"idealFor": "Garçon & Fille"}',
  true,
  '/images/books/lina-abc/main.png'
) ON CONFLICT (theme_slug) DO UPDATE 
SET description = EXCLUDED.description, is_active = true, cover_url = EXCLUDED.cover_url;
