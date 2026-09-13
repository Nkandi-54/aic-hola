create extension if not exists pgcrypto;

create type public.department as enum (
  'church_secretary',
  'church_treasurer',
  'pastor',
  'youth',
  'sunday_school',
  'women',
  'men',
  'media'
);

create type public.member_role as enum ('member', 'department_editor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.department_memberships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  department public.department not null,
  primary key (user_id, department)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  department public.department not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_range check (ends_at > starts_at)
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  department public.department not null,
  title text not null check (char_length(title) between 3 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  published_at timestamptz not null default now(),
  pinned boolean not null default false,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('department_editor', 'admin')
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
    left join public.department_memberships m on m.user_id = p.id
    where p.id = auth.uid()
      and (p.role = 'admin' or (p.role = 'department_editor' and m.department = target))
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and (new.role is distinct from old.role or new.id is distinct from old.id) then
    raise exception 'Only an administrator can change profile privileges';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before update on public.profiles
for each row execute procedure public.protect_profile_privileges();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  insert into public.notifications_preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.department_memberships enable row level security;
alter table public.events enable row level security;
alter table public.notices enable row level security;
alter table public.notifications_preferences enable row level security;

create policy "Users can read their profile" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "Users can update their own display name" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins can update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Staff can read memberships" on public.department_memberships for select to authenticated using (user_id = auth.uid() or public.is_staff());
create policy "Published calendar is public" on public.events for select using (true);
create policy "Published notices are public" on public.notices for select using (true);
create policy "Editors can create department notices" on public.notices for insert to authenticated with check (created_by = auth.uid() and public.can_edit_department(department));
create policy "Editors can update department notices" on public.notices for update to authenticated using (public.can_edit_department(department)) with check (public.can_edit_department(department));
create policy "Editors can delete department notices" on public.notices for delete to authenticated using (public.can_edit_department(department));
create policy "Editors can create department events" on public.events for insert to authenticated with check (created_by = auth.uid() and public.can_edit_department(department));
create policy "Editors can update department events" on public.events for update to authenticated using (public.can_edit_department(department)) with check (public.can_edit_department(department));
create policy "Editors can delete department events" on public.events for delete to authenticated using (public.can_edit_department(department));
create policy "Users manage notification preference" on public.notifications_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create index events_starts_at_idx on public.events (starts_at);
create index events_department_idx on public.events (department);
create index notices_published_at_idx on public.notices (published_at desc);
create index notices_department_idx on public.notices (department);

revoke all on public.profiles, public.department_memberships, public.events, public.notices, public.notifications_preferences from anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.notices to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.department_memberships to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.notices to authenticated;
grant select, insert, update, delete on public.notifications_preferences to authenticated;
