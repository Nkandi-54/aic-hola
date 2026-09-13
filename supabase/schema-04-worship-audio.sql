-- ============================================================================
-- AIC HOLA — MIGRATION 04
-- WORSHIP AUDIO
-- ============================================================================
--
-- Run AFTER:
--   schema.sql
--   schema-02-roles-finance-records.sql
--   schema-03-accounts-admin.sql
--
-- Purpose:
--   * Published worship recordings
--   * Optional live audio stream
--   * One active live broadcast at a time
--   * Public playback
--   * Admin/pastor-only publishing
--   * Secure storage access
--   * Full audit trail
-- ============================================================================

begin;

-- ============================================================================
-- 1. AUDIO RECORDINGS
-- ============================================================================

create table if not exists public.audio_recordings (
  id uuid primary key default gen_random_uuid(),

  title text not null
    check (char_length(btrim(title)) between 2 and 200),

  description text not null default ''
    check (char_length(description) <= 2000),

  speaker text not null default ''
    check (char_length(speaker) <= 160),

  storage_path text not null default ''
    check (char_length(storage_path) <= 1000),

  stream_url text not null default ''
    check (char_length(stream_url) <= 2000),

  duration_seconds integer
    check (
      duration_seconds is null
      or duration_seconds >= 0
    ),

  kind text not null default 'audio'
    check (kind in ('audio', 'live')),

  is_live boolean not null default false,

  is_published boolean not null default true,

  recorded_at date,

  created_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  -- A live row must actually represent a live broadcast.
  constraint audio_recordings_live_kind_check
    check (not is_live or kind = 'live'),

  -- A live broadcast must have something that can actually be streamed.
  constraint audio_recordings_live_source_check
    check (
      not is_live
      or char_length(btrim(stream_url)) > 0
      or char_length(btrim(storage_path)) > 0
    )
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

create index if not exists audio_recordings_published_idx
  on public.audio_recordings (is_published, created_at desc);

create index if not exists audio_recordings_kind_idx
  on public.audio_recordings (kind, created_at desc);

create index if not exists audio_recordings_live_idx
  on public.audio_recordings (is_live)
  where is_live = true;

-- Database-level guarantee: maximum one live broadcast.
create unique index if not exists audio_recordings_single_live_idx
  on public.audio_recordings ((is_live))
  where is_live = true;

-- ============================================================================
-- 3. PUBLISHING AUTHORIZATION
-- ============================================================================

create or replace function public.can_publish_media()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'pastor')
      and status = 'active'
  );
$$;

revoke all on function public.can_publish_media() from public;
revoke all on function public.can_publish_media() from anon;
grant execute on function public.can_publish_media() to authenticated;

-- ============================================================================
-- 4. LIVE BROADCAST MANAGEMENT
-- ============================================================================

create or replace function public.single_live_broadcast()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_live then

    -- A live recording is always a live kind.
    new.kind := 'live';

    -- A live broadcast must have a stream/file source.
    if char_length(btrim(coalesce(new.stream_url, ''))) = 0
       and char_length(btrim(coalesce(new.storage_path, ''))) = 0 then
      raise exception
        'A live broadcast requires a stream URL or storage path';
    end if;

    -- End any previous live broadcast.
    update public.audio_recordings
       set is_live = false,
           updated_at = now()
     where is_live = true
       and id <> new.id;

  end if;

  return new;
end;
$$;

revoke all on function public.single_live_broadcast() from public;
grant execute on function public.single_live_broadcast() to authenticated;

drop trigger if exists single_live_broadcast
  on public.audio_recordings;

create trigger single_live_broadcast
before insert or update
on public.audio_recordings
for each row
execute procedure public.single_live_broadcast();

-- ============================================================================
-- 5. UPDATED_AT
-- ============================================================================

drop trigger if exists audio_recordings_touch
  on public.audio_recordings;

create trigger audio_recordings_touch
before update
on public.audio_recordings
for each row
execute procedure public.touch_updated_at();

-- ============================================================================
-- 6. AUDIT
-- ============================================================================

drop trigger if exists audio_recordings_audit
  on public.audio_recordings;

create trigger audio_recordings_audit
after insert or update or delete
on public.audio_recordings
for each row
execute procedure public.log_audit();

-- ============================================================================
-- 7. RLS
-- ============================================================================

alter table public.audio_recordings enable row level security;

drop policy if exists "Published worship audio is public"
  on public.audio_recordings;

create policy "Published worship audio is public"
on public.audio_recordings
for select
to anon, authenticated
using (
  is_published = true
);

drop policy if exists "Publishers read worship audio"
  on public.audio_recordings;

create policy "Publishers read worship audio"
on public.audio_recordings
for select
to authenticated
using (
  public.can_publish_media()
);

drop policy if exists "Publishers create worship audio"
  on public.audio_recordings;

create policy "Publishers create worship audio"
on public.audio_recordings
for insert
to authenticated
with check (
  public.can_publish_media()
  and created_by = (select auth.uid())
);

drop policy if exists "Publishers update worship audio"
  on public.audio_recordings;

create policy "Publishers update worship audio"
on public.audio_recordings
for update
to authenticated
using (
  public.can_publish_media()
)
with check (
  public.can_publish_media()
);

drop policy if exists "Publishers delete worship audio"
  on public.audio_recordings;

create policy "Publishers delete worship audio"
on public.audio_recordings
for delete
to authenticated
using (
  public.can_publish_media()
);

-- ============================================================================
-- 8. TABLE PRIVILEGES
-- ============================================================================

revoke all
on public.audio_recordings
from anon, authenticated;

grant select
on public.audio_recordings
to anon, authenticated;

grant insert, update, delete
on public.audio_recordings
to authenticated;

-- ============================================================================
-- 9. STORAGE BUCKET
-- ============================================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit
)
values (
  'worship-audio',
  'worship-audio',
  true,
  314572800
)
on conflict (id)
do update set
  public = true,
  file_size_limit = 314572800;

-- Public playback.
drop policy if exists "Anyone can read worship audio"
  on storage.objects;

create policy "Anyone can read worship audio"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'worship-audio'
);

-- Only admin/pastor may upload.
drop policy if exists "Publishers upload worship audio"
  on storage.objects;

create policy "Publishers upload worship audio"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'worship-audio'
  and public.can_publish_media()
);

-- Only admin/pastor may modify.
drop policy if exists "Publishers update worship audio"
  on storage.objects;

create policy "Publishers update worship audio"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'worship-audio'
  and public.can_publish_media()
)
with check (
  bucket_id = 'worship-audio'
  and public.can_publish_media()
);

-- Only admin/pastor may delete.
drop policy if exists "Publishers delete worship audio"
  on storage.objects;

create policy "Publishers delete worship audio"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'worship-audio'
  and public.can_publish_media()
);

commit;