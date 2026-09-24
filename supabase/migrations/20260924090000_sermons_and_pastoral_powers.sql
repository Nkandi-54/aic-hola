-- ============================================================================
-- AIC HOLA — MIGRATION: SERMONS ARCHIVE & PASTORAL POWERS
-- ============================================================================
-- Purpose:
--   1. Create public.sermons table for audio, video, and written sermon manuscripts.
--   2. Grant sermon publishing & management powers to Pastor, Admin, and Media office.
--   3. Enable real-time updates and RLS for public congregation reading/listening.
--   4. Seed foundational sermons into the library.
--   5. Strengthen pastoral oversight across the platform.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. PUBLIC.SERMONS TABLE
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sermons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  series text NOT NULL DEFAULT '',
  preacher text NOT NULL,
  scripture text NOT NULL DEFAULT '',
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  written_sermon text NOT NULL DEFAULT '',
  audio_url text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  attachment_url text NOT NULL DEFAULT '',
  accent_color text NOT NULL DEFAULT '#e8bd79',
  is_published boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  views_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexing for fast search and chronologic sorting
CREATE INDEX IF NOT EXISTS idx_sermons_service_date ON public.sermons (service_date DESC);
CREATE INDEX IF NOT EXISTS idx_sermons_published ON public.sermons (is_published);
CREATE INDEX IF NOT EXISTS idx_sermons_featured ON public.sermons (is_featured);

-- Touch updated_at trigger
DROP TRIGGER IF EXISTS touch_sermons_updated_at ON public.sermons;
CREATE TRIGGER touch_sermons_updated_at
  BEFORE UPDATE ON public.sermons
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- Congregation / Public reading
DROP POLICY IF EXISTS "Anyone can read published sermons" ON public.sermons;
CREATE POLICY "Anyone can read published sermons"
  ON public.sermons
  FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    OR public.is_overseer()
    OR public.can_publish_media()
  );

-- Pastor, Admin and Media insertion
DROP POLICY IF EXISTS "Pastor, admin and media can insert sermons" ON public.sermons;
CREATE POLICY "Pastor, admin and media can insert sermons"
  ON public.sermons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_overseer()
    OR public.can_publish_media()
  );

-- Pastor, Admin and Media update
DROP POLICY IF EXISTS "Pastor, admin and media can update sermons" ON public.sermons;
CREATE POLICY "Pastor, admin and media can update sermons"
  ON public.sermons
  FOR UPDATE
  TO authenticated
  USING (
    public.is_overseer()
    OR public.can_publish_media()
  )
  WITH CHECK (
    public.is_overseer()
    OR public.can_publish_media()
  );

-- Pastor and Admin deletion
DROP POLICY IF EXISTS "Pastor and admin can delete sermons" ON public.sermons;
CREATE POLICY "Pastor and admin can delete sermons"
  ON public.sermons
  FOR DELETE
  TO authenticated
  USING (
    public.is_overseer()
  );

GRANT SELECT ON public.sermons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sermons TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. ENABLE REALTIME ON PUBLIC.SERMONS
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'sermons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sermons;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. STORAGE ACCESS STRENGTHENING FOR PASTOR & MEDIA
-- ----------------------------------------------------------------------------

-- Ensure storage policies on content-media allow is_overseer()
DROP POLICY IF EXISTS "Staff can upload content media" ON storage.objects;
CREATE POLICY "Staff can upload content media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-media'
    AND (public.is_staff() OR public.can_publish_media() OR public.is_overseer())
  );

DROP POLICY IF EXISTS "Staff can update content media" ON storage.objects;
CREATE POLICY "Staff can update content media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'content-media'
    AND (public.is_staff() OR public.can_publish_media() OR public.is_overseer())
  );

DROP POLICY IF EXISTS "Staff can delete content media" ON storage.objects;
CREATE POLICY "Staff can delete content media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-media'
    AND (public.is_staff() OR public.can_publish_media() OR public.is_overseer())
  );

-- ----------------------------------------------------------------------------
-- 5. SEED INITIAL FOUNDATIONAL SERMONS
-- ----------------------------------------------------------------------------

INSERT INTO public.sermons (
  title,
  series,
  preacher,
  scripture,
  service_date,
  description,
  written_sermon,
  video_url,
  accent_color,
  is_published,
  is_featured
)
VALUES
  (
    'Walking in Faith',
    'Living by Faith',
    'AIC Hola Pulpit Ministry',
    'Proverbs 3:5-6; Hebrews 11:1-6',
    CURRENT_DATE - INTERVAL '3 days',
    'A message on trusting God in every situation, walking not by sight but by steady confidence in His promises.',
    E'Scripture Focus: Proverbs 3:5-6\n\n"Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."\n\nMain Message Outline:\n1. The Foundation of Trust — Placing unconditional faith in God''s unchanging character.\n2. Surrendering Our Own Understanding — Acknowledging human limitations in times of uncertainty.\n3. Stepping Out into Divine Guidance — When we submit our steps to Him, He clears the way ahead.\n\nPractical Devotional Reflection:\nTake a moment today to release whatever anxieties or uncertainties you are carrying into the Father''s hands. Walk forward in quiet obedience, knowing that He goes before you.',
    'https://www.youtube.com/@nkandi242',
    '#e8bd79',
    true,
    true
  ),
  (
    'The Power of Prayer',
    'Foundations of Worship',
    'AIC Hola Pulpit Ministry',
    'Philippians 4:6-7; James 5:16',
    CURRENT_DATE - INTERVAL '10 days',
    'Exploring how prayer transforms lives, brings peace in anxiety, and aligns our hearts with God''s perfect will.',
    E'Scripture Focus: Philippians 4:6-7\n\n"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."\n\nKey Reflections:\n• Prayer is not conquering God''s reluctance; it is laying hold of His willingness.\n• Praying with sincere thanksgiving even before the answer is visible.\n• The supernatural peace that guards our hearts and minds in Christ Jesus.',
    'https://www.youtube.com/@nkandi242',
    '#b9c8e8',
    true,
    false
  ),
  (
    'Love and Fellowship',
    'The Body of Christ',
    'AIC Hola Pulpit Ministry',
    '1 John 4:7-12; Hebrews 10:24-25',
    CURRENT_DATE - INTERVAL '17 days',
    'A sermon about genuine Christian community, sacrificial love, and walking together in unity.',
    E'Scripture Focus: 1 John 4:11\n\n"Dear friends, since God so loved us, we also ought to love one another."\n\nPractical Applications:\n1. Bearing one another''s burdens in love and patience.\n2. Forgiving as Christ has forgiven us.\n3. Consistent fellowship, prayer meetings, and mutual encouragement across our fellowships.',
    'https://www.youtube.com/@nkandi242',
    '#eeb0a0',
    true,
    false
  ),
  (
    'Hope in Hard Times',
    'Anchored in Christ',
    'AIC Hola Pulpit Ministry',
    'Romans 8:28, 38-39; Psalm 46:1-3',
    CURRENT_DATE - INTERVAL '24 days',
    'Finding unshakable strength, solace, and eternal hope through God''s enduring Word.',
    E'Scripture Focus: Psalm 46:1\n\n"God is our refuge and strength, an ever-present help in trouble."\n\nEven when the earth gives way and mountains fall into the heart of the sea, our anchor holds firmly in Christ.\n\nNo trial or distress is beyond His sovereign grace.',
    'https://www.youtube.com/@nkandi242',
    '#a9c8af',
    true,
    false
  )
ON CONFLICT DO NOTHING;

COMMIT;
