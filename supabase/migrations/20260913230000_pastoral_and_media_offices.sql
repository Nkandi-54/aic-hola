-- ============================================================================
-- AIC HOLA — MIGRATION: PASTORAL AND MEDIA OFFICES SUITE
-- ============================================================================
-- Purpose:
--   1. Dynamic Livestream & Broadcast Control (broadcast_settings table)
--   2. Empower Media department to publish audio & control broadcasts
--   3. Pulpit & Preaching Schedule for pastoral and worship planning
--   4. Confidential Pastoral Care & Visitation Logs for Pastor & Admin
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. MEDIA PERMISSIONS: EMPOWER MEDIA DEPARTMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_publish_media()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND (
        role IN ('admin', 'pastor')
        OR public.can_edit_department('media'::public.department)
      )
      AND status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_publish_media() TO authenticated;

-- ============================================================================
-- 2. DYNAMIC BROADCAST SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.broadcast_settings (
  id text PRIMARY KEY DEFAULT 'primary',
  is_live boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT 'Sunday Morning Worship Service',
  service_type text NOT NULL DEFAULT 'Main Service',
  youtube_video_id text DEFAULT '',
  youtube_playlist_id text DEFAULT 'PLxQiFsFVDeJGSPEKPUGPeypbNRHZbfrCC',
  custom_stream_url text DEFAULT '',
  announcement text DEFAULT '',
  scheduled_start timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

INSERT INTO public.broadcast_settings (id, is_live, title, service_type, youtube_playlist_id)
VALUES ('primary', false, 'Sunday Morning Worship Service', 'Main Service', 'PLxQiFsFVDeJGSPEKPUGPeypbNRHZbfrCC')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.broadcast_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read broadcast settings" ON public.broadcast_settings;
CREATE POLICY "Anyone can read broadcast settings"
  ON public.broadcast_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Media editors and overseers can update broadcast settings" ON public.broadcast_settings;
CREATE POLICY "Media editors and overseers can update broadcast settings"
  ON public.broadcast_settings
  FOR UPDATE
  TO authenticated
  USING (public.can_publish_media())
  WITH CHECK (public.can_publish_media());

DROP TRIGGER IF EXISTS touch_broadcast_settings_updated_at ON public.broadcast_settings;
CREATE TRIGGER touch_broadcast_settings_updated_at
  BEFORE UPDATE ON public.broadcast_settings
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

GRANT SELECT ON public.broadcast_settings TO anon, authenticated;
GRANT UPDATE ON public.broadcast_settings TO authenticated;

-- ============================================================================
-- 3. PULPIT & PREACHING SCHEDULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pulpit_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_date date NOT NULL,
  service_type text NOT NULL DEFAULT 'Sunday Main Service',
  preacher text NOT NULL,
  sermon_theme text NOT NULL,
  scripture_reading text NOT NULL DEFAULT '',
  liturgist text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'completed')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pulpit_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view pulpit schedule" ON public.pulpit_schedule;
CREATE POLICY "Staff can view pulpit schedule"
  ON public.pulpit_schedule
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "Pastor and admin can manage pulpit schedule" ON public.pulpit_schedule;
CREATE POLICY "Pastor and admin can manage pulpit schedule"
  ON public.pulpit_schedule
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'pastor')
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'pastor')
        AND status = 'active'
    )
  );

DROP TRIGGER IF EXISTS touch_pulpit_schedule_updated_at ON public.pulpit_schedule;
CREATE TRIGGER touch_pulpit_schedule_updated_at
  BEFORE UPDATE ON public.pulpit_schedule
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_pulpit_schedule_date ON public.pulpit_schedule (service_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulpit_schedule TO authenticated;

-- ============================================================================
-- 4. CONFIDENTIAL PASTORAL CARE & VISITATION LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pastoral_care_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name text NOT NULL,
  phone_contact text DEFAULT '',
  care_type text NOT NULL DEFAULT 'home_visit' CHECK (
    care_type IN ('home_visit', 'hospital_visit', 'counseling', 'bereavement', 'prayer_support', 'new_believer')
  ),
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  pastoral_notes text NOT NULL,
  prayer_items text DEFAULT '',
  follow_up_date date,
  status text NOT NULL DEFAULT 'in_progress' CHECK (
    status IN ('in_progress', 'followup_needed', 'completed')
  ),
  confidentiality_level text NOT NULL DEFAULT 'pastor_only' CHECK (
    confidentiality_level IN ('pastor_only', 'pastoral_team')
  ),
  ministered_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pastoral_care_records ENABLE ROW LEVEL SECURITY;

-- Strict: only pastor and admin can select, insert, update or delete pastoral care records
DROP POLICY IF EXISTS "Pastor and admin can view pastoral care records" ON public.pastoral_care_records;
CREATE POLICY "Pastor and admin can view pastoral care records"
  ON public.pastoral_care_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'pastor')
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Pastor and admin can manage pastoral care records" ON public.pastoral_care_records;
CREATE POLICY "Pastor and admin can manage pastoral care records"
  ON public.pastoral_care_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'pastor')
        AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'pastor')
        AND status = 'active'
    )
  );

DROP TRIGGER IF EXISTS touch_pastoral_care_updated_at ON public.pastoral_care_records;
CREATE TRIGGER touch_pastoral_care_updated_at
  BEFORE UPDATE ON public.pastoral_care_records
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_pastoral_care_date ON public.pastoral_care_records (visit_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pastoral_care_records TO authenticated;

COMMIT;
