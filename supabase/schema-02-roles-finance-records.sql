-- AIC Hola — migration 02
-- Department heads, pastor/admin global power, church finance, digital records.
-- Run AFTER schema.sql in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- 1. Roles & department leadership
-- ---------------------------------------------------------------------------

-- Add richer role values. `department_head` leads a single department and may
-- create/edit/delete that department's events & notices. `pastor` sits beside
-- `admin` with power over every department.
alter type public.member_role add value if not exists 'department_head';
alter type public.member_role add value if not exists 'pastor';
alter type public.member_role add value if not exists 'treasurer';

-- A department can have exactly one head (a `department_head`).
create table if not exists public.department_heads (
  department public.department primary key,
  head_id uuid not null references public.profiles(id) on delete cascade,
  appointed_by uuid references public.profiles(id),
  appointed_at timestamptz not null default now()
);

-- Anything that is true for both admin and pastor: full church-wide authority.
create or replace function public.is_overseer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'pastor')
  );
$$;

-- Treasurer authority (finance + records, not department content).
create or replace function public.is_treasurer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('treasurer', 'admin', 'pastor')
  );
$$;

-- Staff = anyone with any elevated responsibility.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('department_head', 'department_editor', 'treasurer', 'pastor', 'admin')
  );
$$;

-- Can the current user edit a given department's content?
--   admins & pastors: every department
--   department heads / editors: only departments they belong to OR lead
create or replace function public.can_edit_department(target public.department)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role in ('admin', 'pastor')
        or (
          p.role in ('department_head', 'department_editor', 'treasurer')
          and (
            exists (select 1 from public.department_memberships m
                    where m.user_id = p.id and m.department = target)
            or exists (select 1 from public.department_heads h
                       where h.head_id = p.id and h.department = target)
          )
        )
      )
  );
$$;
-- ---------------------------------------------------------------------------
-- 2. Church finance (treasurer workspace)
-- ---------------------------------------------------------------------------

create type public.fund_kind as enum ('general', 'building', 'missions', 'welfare', 'youth', 'other');
create type public.txn_direction as enum ('income', 'expense');

-- Named funds / accounts the church keeps money in.
create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  kind public.fund_kind not null default 'general',
  description text not null default '',
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Members/attendees for giving records.
create table if not exists public.finance_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 160),
  phone text not null default '',
  email text not null default '',
  member_number text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Every movement of money. Contributions are direction=income, payments
-- direction=expense.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds(id) on delete restrict,
  direction public.txn_direction not null,
  category text not null default 'general',
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'KES',
  occurred_on date not null default current_date,
  reference text not null default '',
  description text not null default '',
  member_id uuid references public.finance_members(id) on delete set null,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Annual / periodic approved budgets per fund.
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references public.funds(id) on delete cascade,
  period_label text not null,
  period_start date not null,
  period_end date not null,
  planned_income numeric(14, 2) not null default 0 check (planned_income >= 0),
  planned_expense numeric(14, 2) not null default 0 check (planned_expense >= 0),
  notes text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint budgets_valid_range check (period_end >= period_start)
);

-- ---------------------------------------------------------------------------
-- 3. Digital records system
-- ---------------------------------------------------------------------------

create type public.record_class as enum (
  'minutes', 'membership', 'legal', 'property', 'correspondence',
  'finance', 'events', 'personnel', 'other'
);

create table if not exists public.record_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  class public.record_class not null default 'other',
  department public.department,
  description text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.record_folders(id) on delete set null,
  title text not null check (char_length(title) between 2 and 200),
  class public.record_class not null default 'other',
  department public.department,
  summary text not null default '',
  reference text not null default '',
  -- Path inside the private `records` storage bucket.
  storage_path text not null default '',
  is_confidential boolean not null default false,
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Immutable audit trail for the records system.
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text not null default '',
  action text not null,
  entity text not null,
  entity_id text not null default '',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  record_id text;
begin
  if (tg_op = 'DELETE') then
    payload := to_jsonb(old);
    record_id := coalesce(old.id::text, '');
  else
    payload := to_jsonb(new);
    record_id := coalesce(new.id::text, '');
  end if;

  insert into public.audit_log (actor_id, actor_email, action, entity, entity_id, detail)
  values (
    auth.uid(),
    coalesce((select email from auth.users where id = auth.uid()), ''),
    lower(tg_op),
    tg_table_name,
    record_id,
    payload
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists records_audit on public.records;
create trigger records_audit
after insert or update or delete on public.records
for each row execute procedure public.log_audit();

drop trigger if exists transactions_audit on public.transactions;
create trigger transactions_audit
after insert or update or delete on public.transactions
for each row execute procedure public.log_audit();
-- ---------------------------------------------------------------------------
-- 4. Row level security
-- ---------------------------------------------------------------------------

alter table public.department_heads enable row level security;
alter table public.funds enable row level security;
alter table public.finance_members enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.record_folders enable row level security;
alter table public.records enable row level security;
alter table public.audit_log enable row level security;

-- Department heads: readable by staff, writable only by overseers.
drop policy if exists "Staff can read department heads" on public.department_heads;
create policy "Staff can read department heads" on public.department_heads
  for select to authenticated using (public.is_staff());
drop policy if exists "Overseers manage department heads" on public.department_heads;
create policy "Overseers manage department heads" on public.department_heads
  for all to authenticated using (public.is_overseer()) with check (public.is_overseer());

-- Finance: only treasurer / admin / pastor.
drop policy if exists "Treasurers manage funds" on public.funds;
create policy "Treasurers manage funds" on public.funds
  for all to authenticated using (public.is_treasurer()) with check (public.is_treasurer());

drop policy if exists "Treasurers manage finance members" on public.finance_members;
create policy "Treasurers manage finance members" on public.finance_members
  for all to authenticated using (public.is_treasurer()) with check (public.is_treasurer());

drop policy if exists "Treasurers manage transactions" on public.transactions;
create policy "Treasurers manage transactions" on public.transactions
  for all to authenticated using (public.is_treasurer()) with check (public.is_treasurer());

drop policy if exists "Treasurers manage budgets" on public.budgets;
create policy "Treasurers manage budgets" on public.budgets
  for all to authenticated using (public.is_treasurer()) with check (public.is_treasurer());

-- Records: staff read non-confidential + their own department's records.
-- Confidential records only reachable by overseers and treasurers.
drop policy if exists "Staff read records" on public.records;
create policy "Staff read records" on public.records
  for select to authenticated using (
    public.is_overseer()
    or public.is_treasurer() and class = 'finance'
    or (
      public.is_staff()
      and is_confidential = false
      and (department is null or public.can_edit_department(department))
    )
  );

drop policy if exists "Overseers and record owners write records" on public.records;
create policy "Overseers and record owners write records" on public.records
  for all to authenticated
  using (
    public.is_overseer()
    or (public.is_staff() and department is not null and public.can_edit_department(department))
    or (public.is_treasurer() and class = 'finance')
  )
  with check (
    created_by = auth.uid()
    and (
      public.is_overseer()
      or (public.is_staff() and department is not null and public.can_edit_department(department))
      or (public.is_treasurer() and class = 'finance')
    )
  );

drop policy if exists "Staff read record folders" on public.record_folders;
create policy "Staff read record folders" on public.record_folders
  for select to authenticated using (
    public.is_staff() and (department is null or public.can_edit_department(department) or public.is_overseer())
  );

drop policy if exists "Overseers manage record folders" on public.record_folders;
create policy "Overseers manage record folders" on public.record_folders
  for all to authenticated using (public.is_overseer()) with check (public.is_overseer());

-- Audit log: readable by overseers & treasurers, append-only via trigger.
drop policy if exists "Overseers read audit log" on public.audit_log;
create policy "Overseers read audit log" on public.audit_log
  for select to authenticated using (public.is_overseer() or public.is_treasurer());

-- ---------------------------------------------------------------------------
-- 5. Grants, indexes, timestamps
-- ---------------------------------------------------------------------------

create index if not exists transactions_fund_idx on public.transactions (fund_id);
create index if not exists transactions_occurred_idx on public.transactions (occurred_on desc);
create index if not exists transactions_direction_idx on public.transactions (direction);
create index if not exists records_class_idx on public.records (class);
create index if not exists records_department_idx on public.records (department);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- Keep updated_at fresh everywhere.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists funds_touch on public.funds;
create trigger funds_touch before update on public.funds
  for each row execute procedure public.touch_updated_at();
drop trigger if exists transactions_touch on public.transactions;
create trigger transactions_touch before update on public.transactions
  for each row execute procedure public.touch_updated_at();
drop trigger if exists records_touch on public.records;
create trigger records_touch before update on public.records
  for each row execute procedure public.touch_updated_at();

revoke all on public.department_heads, public.funds, public.finance_members,
  public.transactions, public.budgets, public.record_folders, public.records,
  public.audit_log from anon, authenticated;

grant select, insert, update, delete on public.department_heads to authenticated;
grant select, insert, update, delete on public.funds to authenticated;
grant select, insert, update, delete on public.finance_members to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update, delete on public.record_folders to authenticated;
grant select, insert, update, delete on public.records to authenticated;
grant select on public.audit_log to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Private storage bucket for record files
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('records', 'records', false)
on conflict (id) do nothing;

drop policy if exists "Staff read record files" on storage.objects;
create policy "Staff read record files" on storage.objects
  for select to authenticated
  using (bucket_id = 'records' and public.is_staff());

drop policy if exists "Staff upload record files" on storage.objects;
create policy "Staff upload record files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'records' and public.is_staff());

drop policy if exists "Overseers delete record files" on storage.objects;
create policy "Overseers delete record files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'records' and public.is_overseer());
