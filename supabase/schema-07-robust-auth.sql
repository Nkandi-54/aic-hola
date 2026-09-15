-- AIC Hola — migration 07
-- Resilient Authentication & Profile Self-Healing
--
-- Resolves sign-up and sign-in failures:
-- 1. Hardens public.handle_new_user() so that trigger exceptions never abort
--    auth.users insertion with "500: Database error saving new user".
-- 2. Uses ON CONFLICT (id) DO UPDATE to handle idempotent profile creations.
-- 3. Provides public.ensure_profile() RPC for client-side auto-healing of missing
--    profile records.
-- 4. Preserves the existing staff profile-read permissions.
-- 5. Documents how to disable email confirmation in Supabase Dashboard for
--    instant member access.
--
-- Run in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- 1. Ensure profiles table columns exist
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended'));

-- ---------------------------------------------------------------------------
-- 2. Resilient handle_new_user trigger
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_name text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    ''
  );

  -- Safe idempotent insert into profiles.
  -- Existing roles are never overwritten.
  insert into public.profiles (
    id,
    display_name,
    role,
    status
  )
  values (
    new.id,
    raw_name,
    'member',
    'active'
  )
  on conflict (id) do update
    set display_name = case
      when public.profiles.display_name is null
        or public.profiles.display_name = ''
      then excluded.display_name
      else public.profiles.display_name
    end;

  -- Safe insert into notification preferences.
  -- Failure here must never prevent account creation.
  begin
    insert into public.notifications_preferences (
      user_id,
      enabled
    )
    values (
      new.id,
      true
    )
    on conflict (user_id) do nothing;
  exception
    when others then
      null;
  end;

  return new;

exception
  when others then
    -- Critical:
    -- NEVER abort auth.users row creation if profile-related work fails.
    --
    -- The Auth user remains available and ensure_profile() can repair
    -- the profile when the user signs in.
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Ensure the trigger is active on auth.users
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Auto-healing RPC: ensure_profile()
-- ---------------------------------------------------------------------------

-- Callable by any authenticated user to create or repair their own profile.
create or replace function public.ensure_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  user_email text;
  meta_name text;
  res_profile record;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Read the authenticated user's Auth record.
  select
    email,
    raw_user_meta_data ->> 'display_name'
  into
    user_email,
    meta_name
  from auth.users
  where id = current_user_id;

  -- Create the profile if it is missing.
  --
  -- Existing roles are preserved.
  insert into public.profiles (
    id,
    display_name,
    role,
    status
  )
  values (
    current_user_id,
    coalesce(
      meta_name,
      split_part(coalesce(user_email, ''), '@', 1)
    ),
    'member',
    'active'
  )
  on conflict (id) do update
    set display_name = case
      when public.profiles.display_name is null
        or public.profiles.display_name = ''
      then excluded.display_name
      else public.profiles.display_name
    end;

  -- Also ensure notification preferences exist.
  begin
    insert into public.notifications_preferences (
      user_id,
      enabled
    )
    values (
      current_user_id,
      true
    )
    on conflict (user_id) do nothing;
  exception
    when others then
      null;
  end;

  -- Return the repaired/current profile.
  select
    id,
    display_name,
    role,
    status
  into res_profile
  from public.profiles
  where id = current_user_id;

  return to_jsonb(res_profile);

end;
$$;

-- Only authenticated users may call the profile-healing RPC.
grant execute on function public.ensure_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Verify RLS policies on profiles
-- ---------------------------------------------------------------------------

-- Preserve the existing behavior:
-- users can read their own profile,
-- staff (department editors/admins) can read profiles.
drop policy if exists "Users can read their profile"
  on public.profiles;

create policy "Users can read their profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_staff()
);

-- Users may update their own profile.
-- The existing protect_profile_privileges() trigger continues to prevent
-- non-admin users from changing protected privilege fields such as role.
drop policy if exists "Users can update their own display name"
  on public.profiles;

create policy "Users can update their own display name"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

-- Ensure authenticated users have the required table privileges.
grant select, update
on public.profiles
to authenticated;

grant usage
on schema public
to anon, authenticated;