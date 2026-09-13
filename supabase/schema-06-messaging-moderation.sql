-- ============================================================================
-- AIC HOLA — MIGRATION 06
-- REGISTERED-USER MESSAGING & MODERATION
-- ============================================================================
--
-- Run after schema-03-accounts-admin.sql.
-- Message creation is intentionally handled by the moderation Edge Function.
-- The client cannot bypass vulgar-language filtering or strike enforcement.

begin;

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint direct_messages_distinct_users check (sender_id <> recipient_id)
);

create index if not exists direct_messages_sender_recipient_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);

create index if not exists direct_messages_recipient_sender_idx
  on public.direct_messages (recipient_id, sender_id, created_at desc);

create table if not exists public.message_violations (
  id uuid primary key default gen_random_uuid(),
  offender_id uuid references public.profiles(id) on delete set null,
  matched_terms text[] not null default '{}',
  body_excerpt text not null default '',
  strike_number integer not null check (strike_number between 1 and 3),
  created_at timestamptz not null default now()
);

create index if not exists message_violations_offender_idx
  on public.message_violations (offender_id, created_at desc);

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  offender_id uuid references public.profiles(id) on delete set null,
  offender_name text not null default 'Deleted account',
  matched_terms text[] not null default '{}',
  body_excerpt text not null default '',
  strike_number integer not null check (strike_number between 1 and 3),
  action text not null check (action in ('warning', 'account_deleted')),
  created_at timestamptz not null default now()
);

create index if not exists moderation_reports_recipient_idx
  on public.moderation_reports (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;
alter table public.message_violations enable row level security;
alter table public.moderation_reports enable row level security;

create policy "Message participants can read their messages"
on public.direct_messages for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "Moderation recipients can read reports"
on public.moderation_reports for select to authenticated
using (
  recipient_id = auth.uid()
  or public.is_admin()
  or public.is_overseer()
  or exists (
    select 1
    from public.department_memberships m
    where m.user_id = auth.uid()
      and m.department = 'church_secretary'
  )
);

revoke all on public.direct_messages, public.message_violations, public.moderation_reports
from anon, authenticated;
grant select on public.direct_messages to authenticated;
grant select on public.moderation_reports to authenticated;

create or replace function public.list_message_recipients(search_text text default '')
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(nullif(btrim(p.display_name), ''), 'AIC Hola member')
  from public.profiles p
  where p.id <> auth.uid()
    and p.status = 'active'
    and (
      nullif(btrim(search_text), '') is null
      or p.display_name ilike '%' || btrim(search_text) || '%'
    )
  order by lower(coalesce(p.display_name, ''))
  limit 50;
$$;

revoke all on function public.list_message_recipients(text) from public;
grant execute on function public.list_message_recipients(text) to authenticated;

commit;
