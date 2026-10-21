-- ============================================================================
-- AIC HOLA — MIGRATION 11
-- PRODUCTION READINESS
-- ============================================================================
--
-- Run AFTER every earlier migration:
--   schema.sql
--   schema-02-roles-finance-records.sql
--   schema-03-accounts-admin.sql
--   schema-04-worship-audio.sql
--   schema-05-treasury-accounting.sql
--   schema-06-messaging-moderation.sql
--   schema-07-robust-auth.sql
--   schema-08-pastoral-and-media-offices.sql
--   schema-09-fix-auth-schema-and-identities.sql
--   schema-10-media-for-events-notices-records.sql
--   migrations/20260913230000_pastoral_and_media_offices.sql
--   migrations/20260924090000_sermons_and_pastoral_powers.sql
--
-- What this migration does
-- ----------------------------------------------------------------------------
-- 1. REPAIRS SCHEMA DRIFT
--    The web console has been reading and writing things the database never
--    defined: the 'reports' record class, deletion of givers, and the
--    worship-audio / content-media storage buckets. This makes the console
--    actually work against a real database.
--
-- 2. APPROVAL BEFORE PUBLICATION
--    Nothing reaches the public site until it is approved. Events, notices,
--    records, sermons and worship audio all carry an approval state, and the
--    public read policies only ever return APPROVED rows. An unapproved
--    client or worker therefore cannot appear on the site.
--
-- 3. CONTACT MESSAGES & PRAYER REQUESTS
--    The website's contact form and prayer request form previously only
--    pretended to send. They now write to real tables, and staff read them in
--    the church console.
--
-- 4. CHURCH OFFICIALS
--    Official church roles (pastor, church secretary, church treasurer) are
--    published only once an administrator records them, so no individual is
--    named on the site until they are approved.
--
-- 5. OFFICIAL GIVING DETAILS
--    The official Lipa na M-PESA paybill and account are stored in the
--    database, next to the matching bank account, so the site and the books
--    can never drift apart.
-- ============================================================================

begin;

-- ============================================================================
-- 1. REPAIR: RECORD CLASSES
-- ============================================================================
-- public.record_class never contained 'reports', yet the console files every
-- new record with class = 'reports'. Adding it makes filing work at all.

alter type public.record_class add value if not exists 'reports';

-- ============================================================================
-- 2. REPAIR: GIVERS CAN BE DELETED
-- ============================================================================
-- A giver (finance_members) was referenced by transactions and pledges with
-- ON DELETE SET NULL, but the column itself was NOT NULL, so deleting a giver
-- always failed. Make the column nullable so the intended SET NULL works.

alter table if exists public.transactions
  alter column member_id drop not null;

-- ============================================================================
-- 3. REPAIR: STORAGE BUCKETS
-- ============================================================================
-- The website uploads worship audio to `worship-audio`, event/notice posters
-- and sermon audio to `content-media`, and record files to the private
-- `records` bucket. Only `records` is guaranteed by an earlier migration, so
-- we create the other two idempotently here.

insert into storage.buckets (id, name, public)
values ('worship-audio', 'worship-audio', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('content-media', 'content-media', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('records', 'records', false)
on conflict (id) do nothing;

-- Public read for the two public buckets.
drop policy if exists "Anyone can view content media" on storage.objects;
create policy "Anyone can view content media" on storage.objects
  for select to public
  using (bucket_id = 'content-media');

drop policy if exists "Anyone can listen to worship audio" on storage.objects;
create policy "Anyone can listen to worship audio" on storage.objects
  for select to public
  using (bucket_id = 'worship-audio');

-- Only the people who publish church media may write to them.
drop policy if exists "Staff can upload content media" on storage.objects;
create policy "Staff can upload content media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'content-media'
    and (public.is_staff() or public.can_publish_media() or public.is_overseer())
  );

drop policy if exists "Staff can update content media" on storage.objects;
create policy "Staff can update content media" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'content-media'
    and (public.is_staff() or public.can_publish_media() or public.is_overseer())
  );

drop policy if exists "Staff can delete content media" on storage.objects;
create policy "Staff can delete content media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'content-media'
    and (public.is_staff() or public.can_publish_media() or public.is_overseer())
  );

drop policy if exists "Staff can upload worship audio" on storage.objects;
create policy "Staff can upload worship audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'worship-audio'
    and (public.is_staff() or public.can_publish_media() or public.is_overseer())
  );

drop policy if exists "Staff can update worship audio" on storage.objects;
create policy "Staff can update worship audio" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'worship-audio'
    and (public.is_staff() or public.can_publish_media() or public.is_overseer())
  );

drop policy if exists "Staff can delete worship audio" on storage.objects;
create policy "Staff can delete worship audio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'worship-audio'
    and (public.is_staff() or public.can_publish_media() or public.is_overseer())
  );

-- ============================================================================
-- 4. APPROVAL WORKFLOW
-- ============================================================================
-- Every piece of content that can reach the public site carries an approval
-- state. The default is 'pending', so nothing is ever published by accident.

do $$
begin
  if not exists (
    select 1 from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'approval_state'
  ) then
    create type public.approval_state
      as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

-- The four columns every content table gains, in one place.
do $$
declare
  target text;
begin
  foreach target in array array['events', 'notices', 'records', 'sermons', 'audio_recordings']
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = target
    ) then
      execute format(
        'alter table public.%I
           add column if not exists approval public.approval_state not null default ''pending''',
        target
      );
      execute format(
        'alter table public.%I
           add column if not exists approved_by uuid references public.profiles(id) on delete set null',
        target
      );
      execute format(
        'alter table public.%I
           add column if not exists approved_at timestamptz',
        target
      );
      execute format(
        'alter table public.%I
           add column if not exists review_note text not null default ''''',
        target
      );
    end if;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 4a. Existing content is grandfathered in as approved
-- ----------------------------------------------------------------------------
-- Everything already in the database was put there by church staff through the
-- console, so it is treated as already reviewed. From now on every new row
-- starts life as 'pending' and only an administrator or the pastor may approve.

do $$
declare
  target text;
begin
  foreach target in array array['events', 'notices', 'records', 'sermons', 'audio_recordings']
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = target
    ) then
      execute format(
        'update public.%I
            set approval = ''approved''::public.approval_state
          where approval = ''pending''::public.approval_state',
        target
      );
    end if;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 4b. Only an overseer may change the approval state
-- ----------------------------------------------------------------------------

create or replace function public.enforce_content_approval()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.approval is distinct from old.approval then
    if not public.is_overseer() then
      raise exception
        'Only an administrator or the pastor can approve or reject published content';
    end if;

    if new.approval = 'approved' then
      new.approved_by := (select auth.uid());
      new.approved_at := now();
    else
      new.approved_by := null;
      new.approved_at := null;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_content_approval() from public, anon;

do $$
declare
  target text;
begin
  foreach target in array array['events', 'notices', 'records', 'sermons', 'audio_recordings']
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = target
    ) then
      execute format(
        'drop trigger if exists enforce_content_approval on public.%I',
        target
      );
      execute format(
        'create trigger enforce_content_approval
           before update on public.%I
           for each row execute procedure public.enforce_content_approval()',
        target
      );
    end if;
  end loop;
end
$$;

-- ----------------------------------------------------------------------------
-- 4c. Indexes for the review queue
-- ----------------------------------------------------------------------------

create index if not exists events_approval_idx on public.events (approval, starts_at desc);
create index if not exists notices_approval_idx on public.notices (approval, published_at desc);
create index if not exists records_approval_idx on public.records (approval, created_at desc);

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'sermons') then
    create index if not exists sermons_approval_idx on public.sermons (approval, service_date desc);
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'audio_recordings') then
    create index if not exists audio_recordings_approval_idx
      on public.audio_recordings (approval, created_at desc);
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- 4d. The public may only ever read APPROVED content
-- ----------------------------------------------------------------------------
-- This is the rule that keeps unapproved clients, workers, notices, sermons and
-- recordings off the public website and mobile app. It is enforced in Postgres,
-- not in the browser, so it cannot be bypassed.

drop policy if exists "Published calendar is public" on public.events;
create policy "Approved events are public"
on public.events for select
to anon, authenticated
using (
  approval = 'approved'
  or public.is_overseer()
  or public.is_staff()
);

drop policy if exists "Published notices are public" on public.notices;
create policy "Approved notices are public"
on public.notices for select
to anon, authenticated
using (
  approval = 'approved'
  or public.is_overseer()
  or public.is_staff()
);

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'sermons') then
    execute 'drop policy if exists "Anyone can read published sermons" on public.sermons';
    execute 'drop policy if exists "Approved sermons are public" on public.sermons';
    execute $policy$
      create policy "Approved sermons are public"
        on public.sermons for select
        to anon, authenticated
        using (
          (is_published = true and approval = 'approved')
          or public.is_overseer()
          or public.can_publish_media()
        )
    $policy$;
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'audio_recordings') then
    execute 'drop policy if exists "Published worship audio is public" on public.audio_recordings';
    execute 'drop policy if exists "Approved worship audio is public" on public.audio_recordings';
    execute $policy$
      create policy "Approved worship audio is public"
        on public.audio_recordings for select
        to anon, authenticated
        using (
          (is_published = true and approval = 'approved')
          or public.is_overseer()
          or public.can_publish_media()
        )
    $policy$;
  end if;
end
$$;

-- The public live broadcast flag may only be turned on for approved audio.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'audio_recordings') then
    drop trigger if exists enforce_content_approval on public.audio_recordings;
    create trigger enforce_content_approval
      before insert or update on public.audio_recordings
      for each row execute procedure public.enforce_content_approval();
  end if;
end
$$;

-- ============================================================================
-- 5. CONTACT MESSAGES & PRAYER REQUESTS
-- ============================================================================
-- The public contact form and prayer request form now reach the church office
-- instead of stopping at the browser. Anyone may submit; only staff may read.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),

  kind text not null default 'message'
    check (kind in ('message', 'prayer')),

  name text not null
    check (char_length(btrim(name)) between 2 and 160),

  email text not null default ''
    check (char_length(email) <= 240),

  phone text not null default ''
    check (char_length(phone) <= 60),

  category text not null default 'General Inquiry'
    check (char_length(category) <= 120),

  message text not null
    check (char_length(btrim(message)) between 2 and 5000),

  status text not null default 'new'
    check (status in ('new', 'in_progress', 'answered', 'closed')),

  handled_by uuid references public.profiles(id) on delete set null,

  handled_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

create index if not exists contact_messages_kind_idx
  on public.contact_messages (kind, created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone, signed in or not, may send the church a message or a prayer request.
drop policy if exists "Anyone can send a message to the church" on public.contact_messages;
create policy "Anyone can send a message to the church"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- Only church staff read the inbox. Nobody outside the office ever sees it.
drop policy if exists "Staff read the church inbox" on public.contact_messages;
create policy "Staff read the church inbox"
  on public.contact_messages
  for select
  to authenticated
  using (public.is_staff() or public.is_overseer());

drop policy if exists "Staff manage the church inbox" on public.contact_messages;
create policy "Staff manage the church inbox"
  on public.contact_messages
  for update
  to authenticated
  using (public.is_staff() or public.is_overseer())
  with check (public.is_staff() or public.is_overseer());

drop trigger if exists contact_messages_touch on public.contact_messages;
create trigger contact_messages_touch
  before update on public.contact_messages
  for each row execute procedure public.touch_updated_at();

revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update on public.contact_messages to authenticated;

-- ============================================================================
-- 6. CHURCH OFFICIALS
-- ============================================================================
-- Named individuals (pastor, church secretary, church treasurer) appear on the
-- public site only after an administrator records them here. An empty table
-- means the website simply does not name anybody, which is the safe default.

create table if not exists public.church_officials (
  id uuid primary key default gen_random_uuid(),

  office text not null
    check (office in ('pastor', 'church_secretary', 'church_treasurer')),

  full_name text not null
    check (char_length(btrim(full_name)) between 2 and 160),

  phone text not null default ''
    check (char_length(phone) <= 60),

  email text not null default ''
    check (char_length(email) <= 240),

  is_published boolean not null default false,

  created_by uuid not null default auth.uid()
    references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint church_officials_one_per_office unique (office)
);

alter table public.church_officials enable row level security;

drop policy if exists "Published church officials are public" on public.church_officials;
create policy "Published church officials are public"
  on public.church_officials
  for select
  to anon, authenticated
  using (is_published = true or public.is_overseer());

drop policy if exists "Overseers manage church officials" on public.church_officials;
create policy "Overseers manage church officials"
  on public.church_officials
  for all
  to authenticated
  using (public.is_overseer())
  with check (public.is_overseer());

drop trigger if exists church_officials_touch on public.church_officials;
create trigger church_officials_touch
  before update on public.church_officials
  for each row execute procedure public.touch_updated_at();

drop trigger if exists church_officials_audit on public.church_officials;
create trigger church_officials_audit
  after insert or update or delete on public.church_officials
  for each row execute procedure public.log_audit();

revoke all on public.church_officials from anon, authenticated;
grant select on public.church_officials to anon, authenticated;
grant select, insert, update, delete on public.church_officials to authenticated;

-- ============================================================================
-- 7. OFFICIAL GIVING DETAILS
-- ============================================================================
-- The public giving details live in the database so the website, the mobile app
-- and the church books all quote the same paybill and account number.

create table if not exists public.church_settings (
  id text primary key default 'primary',

  paybill text not null default '',
  paybill_account text not null default '',
  bank_name text not null default '',
  bank_account_name text not null default '',

  contact_email text not null default '',
  contact_phone text not null default '',
  postal_address text not null default '',
  physical_location text not null default '',

  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.church_settings (
  id,
  paybill,
  paybill_account,
  bank_name,
  bank_account_name,
  contact_email,
  contact_phone,
  postal_address,
  physical_location
)
values (
  'primary',
  '542542',
  '01410637946150',
  'Equity Bank',
  'AIC Hola Church',
  'contacts@aichola.org',
  '+254 727 175 730',
  'P.O. Box 24 – 70101, Hola, Kenya',
  'AIC Hola Church, Hola Town, Tana River County, Kenya'
)
on conflict (id) do nothing;

alter table public.church_settings enable row level security;

drop policy if exists "Anyone can read the church giving details" on public.church_settings;
create policy "Anyone can read the church giving details"
  on public.church_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Overseers manage the church settings" on public.church_settings;
create policy "Overseers manage the church settings"
  on public.church_settings
  for update
  to authenticated
  using (public.is_overseer())
  with check (public.is_overseer());

drop trigger if exists church_settings_touch on public.church_settings;
create trigger church_settings_touch
  before update on public.church_settings
  for each row execute procedure public.touch_updated_at();

revoke all on public.church_settings from anon, authenticated;
grant select on public.church_settings to anon, authenticated;
grant update on public.church_settings to authenticated;

-- ============================================================================
-- 8. THE OFFICIAL CHURCH BANK ACCOUNT
-- ============================================================================
-- Record the real paybill collection account so the treasurer reconciles the
-- money that actually arrives from 542 / 01410637946150.

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'bank_accounts') then
    insert into public.bank_accounts (
      name,
      bank_name,
      account_number,
      currency,
      statement_balance
    )
    select
      'AIC Hola M-PESA Paybill Collection',
      'Equity Bank',
      '01410637946150',
      'KES',
      0
    where not exists (
      select 1 from public.bank_accounts
      where account_number = '01410637946150'
    );
  end if;
end
$$;

-- ============================================================================
-- 9. KEEP THE PUBLIC AUDIT SURFACE CLOSED
-- ============================================================================
-- The audit log, inbox, officials and settings are staff-only. Re-assert the
-- grants so a later migration can never accidentally widen them.

revoke all on function public.enforce_content_approval() from anon;

commit;
