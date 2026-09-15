-- AIC Hola — Migration 09: Fix Auth Schema, Restore Identities & Profile Trigger
-- Resolves "500: Database error querying schema" and unblocks user sign-in and sign-up.

-- ---------------------------------------------------------------------------
-- 1. Fix protect_profile_privileges() trigger logic on public.profiles
-- ---------------------------------------------------------------------------
-- Previously, the self-demotion check evaluated `new.role is distinct from 'admin'`,
-- which threw an exception for EVERY regular member updating their profile.
-- We ensure the check only applies when `old.role = 'admin'`.

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.id is distinct from old.id then
    if not public.is_admin()
       and not (
         old.id = auth.uid()
         and public.admin_seat_is_open()
         and new.role = 'admin'::public.member_role
         and new.status = 'active'
       ) then
      raise exception 'Only an administrator can change roles or account status';
    end if;
  end if;

  -- Only prevent an administrator from stripping their own admin/active status.
  -- Regular members updating display names or details are not subject to this restriction.
  if old.role = 'admin'::public.member_role
     and old.id = auth.uid()
     and (new.role is distinct from 'admin'::public.member_role
          or new.status is distinct from 'active') then
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
$function$;

-- ---------------------------------------------------------------------------
-- 2. Resilient handle_new_user() trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  raw_name text;
begin
  raw_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Member'
  );

  begin
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
  exception
    when others then
      null;
  end;

  begin
    insert into public.notifications_preferences (user_id, enabled)
    values (new.id, true)
    on conflict (user_id) do nothing;
  exception
    when others then
      null;
  end;

  return new;
exception
  when others then
    return new;
end;
$function$;

-- Ensure trigger is attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Resilient ensure_profile() RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_profile()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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

  select
    email,
    raw_user_meta_data ->> 'display_name'
  into
    user_email,
    meta_name
  from auth.users
  where id = current_user_id;

  insert into public.profiles (
    id,
    display_name,
    role,
    status
  )
  values (
    current_user_id,
    coalesce(
      nullif(meta_name, ''),
      split_part(coalesce(user_email, ''), '@', 1),
      'Member'
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
$function$;

GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated, postgres;

-- ---------------------------------------------------------------------------
-- 4. Coerce token columns on auth.users so GoTrue never encounters NULL
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_user_token_integrity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  new.confirmation_token := coalesce(new.confirmation_token, '');
  new.recovery_token := coalesce(new.recovery_token, '');
  new.email_change_token_new := coalesce(new.email_change_token_new, '');
  new.email_change := coalesce(new.email_change, '');
  new.email_change_token_current := coalesce(new.email_change_token_current, '');
  new.phone_change := coalesce(new.phone_change, '');
  new.phone_change_token := coalesce(new.phone_change_token, '');
  new.reauthentication_token := coalesce(new.reauthentication_token, '');
  new.aud := coalesce(nullif(new.aud, ''), 'authenticated');
  new.role := coalesce(nullif(new.role, ''), 'authenticated');
  new.is_super_admin := coalesce(new.is_super_admin, false);
  new.is_sso_user := coalesce(new.is_sso_user, false);

  if new.raw_app_meta_data is null or new.raw_app_meta_data = 'null'::jsonb or not (new.raw_app_meta_data ? 'provider') then
    new.raw_app_meta_data := jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'));
  end if;

  if new.raw_user_meta_data is null or new.raw_user_meta_data = 'null'::jsonb then
    new.raw_user_meta_data := '{}'::jsonb;
  end if;

  return new;
end;
$function$;

DROP TRIGGER IF EXISTS ensure_user_token_integrity ON auth.users;

CREATE TRIGGER ensure_user_token_integrity
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_token_integrity();

-- ---------------------------------------------------------------------------
-- 5. One-time data repair on auth.users for existing accounts
-- ---------------------------------------------------------------------------
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  aud = COALESCE(NULLIF(aud, ''), 'authenticated'),
  role = COALESCE(NULLIF(role, ''), 'authenticated'),
  is_super_admin = COALESCE(is_super_admin, false),
  is_sso_user = COALESCE(is_sso_user, false),
  email_confirmed_at = COALESCE(email_confirmed_at, created_at, now()),
  raw_app_meta_data = CASE
    WHEN raw_app_meta_data IS NULL OR raw_app_meta_data = 'null'::jsonb OR NOT (raw_app_meta_data ? 'provider')
      THEN jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
    ELSE raw_app_meta_data
  END,
  raw_user_meta_data = CASE
    WHEN raw_user_meta_data IS NULL OR raw_user_meta_data = 'null'::jsonb
      THEN '{}'::jsonb
    ELSE raw_user_meta_data
  END;

-- ---------------------------------------------------------------------------
-- 6. Backfill and repair auth.identities
-- ---------------------------------------------------------------------------
-- Repair any identities with missing email or NULL identity_data
UPDATE auth.identities i
SET identity_data = jsonb_build_object(
  'sub', u.id::text,
  'email', u.email,
  'email_verified', true
)
FROM auth.users u
WHERE i.user_id = u.id
  AND (i.identity_data IS NULL OR i.identity_data = 'null'::jsonb OR NOT (i.identity_data ? 'email'));

-- Insert missing identity records for any auth.users missing from auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  provider,
  provider_id,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'email',
  u.id::text,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true
  ),
  u.last_sign_in_at,
  COALESCE(u.created_at, now()),
  COALESCE(u.updated_at, now())
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

-- ---------------------------------------------------------------------------
-- 7. Ensure profiles and notification preferences for all auth.users
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (
  id,
  display_name,
  role,
  status
)
SELECT
  u.id,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'display_name', ''),
    SPLIT_PART(COALESCE(u.email, ''), '@', 1),
    'Member'
  ),
  'member',
  'active'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notifications_preferences (
  user_id,
  enabled
)
SELECT
  u.id,
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications_preferences np WHERE np.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

