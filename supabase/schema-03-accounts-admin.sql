-- AIC Hola — migration 03
-- Account lifecycle & administrator bootstrap.
-- Makes every account real: self-service registration that cannot self-promote,
-- an admin console that can invite people, assign roles and department
-- memberships, suspend and remove accounts — with the church's administrative
-- rules enforced in the database, not just in the UI.
--
-- Run AFTER schema.sql and schema-02-roles-finance-records.sql.

-- ---------------------------------------------------------------------------
-- 1. Account status (suspend / reinstate) on profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended'));

alter table public.profiles
  add column if not exists suspended_at timestamptz;

alter table public.profiles
  add column if not exists suspended_by uuid references public.profiles(id);

-- A suspended member keeps their profile (and history) but loses all staff
-- authority. Mirrored by is_active() below.
create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select status = 'active' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Bootstrap: the first account becomes the administrator
-- ---------------------------------------------------------------------------

-- True while no administrator exists yet. The very first person to register
-- may claim the administrator seat exactly once; after that this is false for
-- everyone and the seat can only move through the admin console.
create or replace function public.admin_seat_is_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles where role = 'admin'
  );
$$;

-- Claim the administrator seat. Raises if an administrator already exists, so
-- it is a genuine one-time bootstrap and never a self-promotion backdoor.
create or replace function public.claim_admin_seat()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to claim the administrator seat';
  end if;
  if not public.admin_seat_is_open() then
    raise exception 'An administrator already exists; ask them to grant you a role';
  end if;
  update public.profiles set role = 'admin', status = 'active' where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Administrative rules, enforced in the database
-- ---------------------------------------------------------------------------

-- Only administrators manage people, roles and department heads (README rule).
-- The pastor shares *department content* authority but not people authority.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

-- Every staff-authority helper now also requires an active account, so a
-- suspended person loses every elevated power at once.
create or replace function public.is_overseer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'pastor') and status = 'active'
  );
$$;

create or replace function public.is_treasurer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('treasurer', 'admin', 'pastor') and status = 'active'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
      and role in ('department_head', 'department_editor', 'treasurer', 'pastor', 'admin')
  );
$$;

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
      and p.status = 'active'
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

-- Rule: only an administrator may change a role or the account status.
-- Self-service edits stay limited to your own display name.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.id is distinct from old.id then
    if not public.is_admin() then
      raise exception 'Only an administrator can change roles or account status';
    end if;
  end if;

  -- Rule: an administrator cannot demote or suspend themselves, so the church
  -- can never be left without an administrator by accident.
  if old.id = auth.uid() and (new.role is distinct from 'admin' or new.status is distinct from 'active') then
    raise exception 'You cannot remove your own administrator access';
  end if;

  if new.status = 'suspended' and old.status = 'active' then
    new.suspended_at := now();
    new.suspended_by := auth.uid();
  elsif new.status = 'active' and old.status = 'suspended' then
    new.suspended_at := null;
    new.suspended_by := null;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before update on public.profiles
for each row execute procedure public.protect_profile_privileges();

-- Rule: a department head seat may only be filled by someone the administrator
-- has actually given the `department_head` role, and never by a suspended
-- account. Appointing a head promotes them automatically; clearing it returns
-- them to `department_editor` if they hold no other head seat.
create or replace function public.enforce_department_head_rule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  head_role public.member_role;
  head_status text;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can appoint or change a department head';
  end if;

  select role, status into head_role, head_status
  from public.profiles where id = new.head_id;

  if head_status is null then
    raise exception 'That account no longer exists';
  end if;
  if head_status <> 'active' then
    raise exception 'A suspended account cannot lead a department';
  end if;
  if head_role not in ('department_head', 'pastor', 'admin') then
    raise exception 'Only a department head, pastor or administrator can lead a department';
  end if;

  -- Keep the profile role in step when a plain member is appointed.
  if head_role = 'department_editor' or head_role = 'member' then
    update public.profiles set role = 'department_head' where id = new.head_id;
  end if;

  new.appointed_by := auth.uid();
  new.appointed_at := now();
  return new;
end;
$$;

drop trigger if exists enforce_department_head_rule on public.department_heads;
create trigger enforce_department_head_rule
before insert or update on public.department_heads
for each row execute procedure public.enforce_department_head_rule();

-- Rule: a department membership may only be granted or revoked by an
-- administrator, so staff can never widen their own scope.
create or replace function public.enforce_membership_rule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can change department memberships';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists enforce_membership_rule on public.department_memberships;
create trigger enforce_membership_rule
before insert or update or delete on public.department_memberships
for each row execute procedure public.enforce_membership_rule();

-- Rule: audit every role, status and membership change — people management is
-- as accountable as money in this church.
drop trigger if exists profiles_audit on public.profiles;
create trigger profiles_audit
after update on public.profiles
for each row execute procedure public.log_audit();

drop trigger if exists memberships_audit on public.department_memberships;
create trigger memberships_audit
after insert or update or delete on public.department_memberships
for each row execute procedure public.log_audit();

drop trigger if exists department_heads_audit on public.department_heads;
create trigger department_heads_audit
after insert or update or delete on public.department_heads
for each row execute procedure public.log_audit();
-- ---------------------------------------------------------------------------
-- 4. Row level security for people management
-- ---------------------------------------------------------------------------

-- Profiles: everyone may read their own; only an administrator may read the
-- whole church directory (to run the console). Suspended people keep read
-- access to their own row so the app can explain the state.
drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Self-service: a person may only edit their own display name. The trigger
-- above blocks any attempt to slip a role or status change through here.
drop policy if exists "Users can update their own display name" on public.profiles;
create policy "Users can update their own display name" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete to authenticated
  using (public.is_admin() and id <> auth.uid());

-- Department memberships: staff may read the ones that concern them; only an
-- administrator may write (enforced again by the membership trigger).
drop policy if exists "Staff can read memberships" on public.department_memberships;
create policy "Staff can read memberships" on public.department_memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_staff());

drop policy if exists "Admins manage memberships" on public.department_memberships;
create policy "Admins manage memberships" on public.department_memberships
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Admin account directory (profile + email in one read)
-- ---------------------------------------------------------------------------

-- The API never exposes auth.users, so administrators get a read-only view
-- that joins each profile to its email. `security_invoker` keeps the caller's
-- RLS in force: only the admin profile policy above lets a row through.
create or replace view public.account_directory
with (security_invoker = true)
as
select
  p.id,
  p.display_name,
  p.role,
  p.status,
  p.created_at,
  p.suspended_at,
  u.email,
  coalesce(
    (select array_agg(h.department order by h.department)
       from public.department_heads h where h.head_id = p.id),
    '{}'::public.department[]
  ) as led_departments,
  coalesce(
    (select array_agg(m.department order by m.department)
       from public.department_memberships m where m.user_id = p.id),
    '{}'::public.department[]
  ) as departments
from public.profiles p
join auth.users u on u.id = p.id;

revoke all on public.account_directory from anon, authenticated;
grant select on public.account_directory to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Grant the new functions to signed-in users
-- ---------------------------------------------------------------------------

-- Permanently delete an account by an administrator.
-- Cascades through department heads, memberships, direct messages, profile, and auth record.
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an active administrator can delete accounts';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own administrator account';
  end if;

  delete from public.department_heads where head_id = target_user_id;
  delete from public.department_memberships where user_id = target_user_id;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'direct_messages') then
    delete from public.direct_messages where sender_id = target_user_id or recipient_id = target_user_id;
  end if;
  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from anon, authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

revoke all on function public.claim_admin_seat() from anon, authenticated;
revoke all on function public.admin_seat_is_open() from anon, authenticated;
grant execute on function public.claim_admin_seat() to authenticated;
grant execute on function public.admin_seat_is_open() to authenticated, anon;

-- Keep updated_at fresh on profiles now that admins edit them directly.
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- Index the fields the console filters on.
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);
