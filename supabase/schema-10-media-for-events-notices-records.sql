-- AIC Hola — Migration 10: Media support for events, notices and records

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';

-- Ensure content-media storage bucket exists for image and video uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-media', 'content-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for content-media:
-- Anyone (anon and authenticated) can view content media
DROP POLICY IF EXISTS "Anyone can view content media" ON storage.objects;
CREATE POLICY "Anyone can view content media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'content-media');

-- Staff can upload content media
DROP POLICY IF EXISTS "Staff can upload content media" ON storage.objects;
CREATE POLICY "Staff can upload content media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-media' AND (public.is_staff() OR public.can_publish_media()));

-- Staff can update content media
DROP POLICY IF EXISTS "Staff can update content media" ON storage.objects;
CREATE POLICY "Staff can update content media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'content-media' AND (public.is_staff() OR public.can_publish_media()));

-- Staff can delete content media
DROP POLICY IF EXISTS "Staff can delete content media" ON storage.objects;
CREATE POLICY "Staff can delete content media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'content-media' AND (public.is_staff() OR public.can_publish_media()));
