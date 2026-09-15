SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE SCHEMA "private";

CREATE TABLE "public"."audio_recordings" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"            text                     NOT NULL,
  "description"      text                     NOT NULL DEFAULT ''::text,
  "speaker"          text                     NOT NULL DEFAULT ''::text,
  "storage_path"     text                     NOT NULL DEFAULT ''::text,
  "stream_url"       text                     NOT NULL DEFAULT ''::text,
  "duration_seconds" integer,
  "kind"             text                     NOT NULL DEFAULT 'audio'::text,
  "is_live"          boolean                  NOT NULL DEFAULT false,
  "is_published"     boolean                  NOT NULL DEFAULT true,
  "recorded_at"      date,
  "created_by"       uuid                     NOT NULL,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audio_recordings_description_check" CHECK ((char_length(description) <= 2000)),
  CONSTRAINT "audio_recordings_duration_seconds_check" CHECK (((duration_seconds IS NULL) OR (duration_seconds >= 0))),
  CONSTRAINT "audio_recordings_kind_check" CHECK ((kind = ANY (ARRAY['audio'::text, 'live'::text]))),
  CONSTRAINT "audio_recordings_live_kind_check" CHECK (((NOT is_live) OR (kind = 'live'::text))),
  CONSTRAINT "audio_recordings_live_source_check" CHECK (((NOT is_live) OR (char_length(btrim(stream_url)) > 0) OR (char_length(btrim(storage_path)) > 0))),
  CONSTRAINT "audio_recordings_pkey" PRIMARY KEY (id),
  CONSTRAINT "audio_recordings_speaker_check" CHECK ((char_length(speaker) <= 160)),
  CONSTRAINT "audio_recordings_storage_path_check" CHECK ((char_length(storage_path) <= 1000)),
  CONSTRAINT "audio_recordings_stream_url_check" CHECK ((char_length(stream_url) <= 2000)),
  CONSTRAINT "audio_recordings_title_check" CHECK (((char_length(btrim(title)) >= 2) AND (char_length(btrim(title)) <= 200)))
);

ALTER TABLE "public"."audio_recordings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."audit_log" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "actor_id"    uuid,
  "actor_email" text                     NOT NULL DEFAULT ''::text,
  "action"      text                     NOT NULL,
  "entity"      text                     NOT NULL,
  "entity_id"   text                     NOT NULL DEFAULT ''::text,
  "detail"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "audit_log_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."audit_log"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."budgets" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fund_id"         uuid                     NOT NULL,
  "period_label"    text                     NOT NULL,
  "period_start"    date                     NOT NULL,
  "period_end"      date                     NOT NULL,
  "planned_income"  numeric(14,2)            NOT NULL DEFAULT 0,
  "planned_expense" numeric(14,2)            NOT NULL DEFAULT 0,
  "notes"           text                     NOT NULL DEFAULT ''::text,
  "created_by"      uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "budgets_pkey" PRIMARY KEY (id),
  CONSTRAINT "budgets_planned_expense_check" CHECK ((planned_expense >= (0)::numeric)),
  CONSTRAINT "budgets_planned_income_check" CHECK ((planned_income >= (0)::numeric)),
  CONSTRAINT "budgets_valid_range" CHECK ((period_end >= period_start))
);

ALTER TABLE "public"."budgets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."department_heads" (
  "head_id"      uuid                     NOT NULL,
  "appointed_by" uuid,
  "appointed_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "public"."department_heads"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."department_memberships" (
  "user_id" uuid NOT NULL
);

ALTER TABLE "public"."department_memberships"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."direct_messages" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "sender_id"    uuid                     NOT NULL,
  "recipient_id" uuid                     NOT NULL,
  "body"         text                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "direct_messages_body_check" CHECK (((char_length(btrim(body)) >= 1) AND (char_length(btrim(body)) <= 2000))),
  CONSTRAINT "direct_messages_distinct_users" CHECK ((sender_id <> recipient_id)),
  CONSTRAINT "direct_messages_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."direct_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."events" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"       text                     NOT NULL,
  "description" text                     NOT NULL DEFAULT ''::text,
  "starts_at"   timestamp with time zone NOT NULL,
  "ends_at"     timestamp with time zone NOT NULL,
  "location"    text                     NOT NULL DEFAULT ''::text,
  "created_by"  uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "events_description_check" CHECK ((char_length(description) <= 4000)),
  CONSTRAINT "events_pkey" PRIMARY KEY (id),
  CONSTRAINT "events_title_check" CHECK (((char_length(title) >= 3) AND (char_length(title) <= 160))),
  CONSTRAINT "events_valid_range" CHECK ((ends_at > starts_at))
);

ALTER TABLE "public"."events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."finance_members" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "full_name"     text                     NOT NULL,
  "phone"         text                     NOT NULL DEFAULT ''::text,
  "email"         text                     NOT NULL DEFAULT ''::text,
  "member_number" text                     NOT NULL DEFAULT ''::text,
  "created_by"    uuid                     NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "finance_members_full_name_check" CHECK (((char_length(full_name) >= 2) AND (char_length(full_name) <= 160))),
  CONSTRAINT "finance_members_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."finance_members"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."funds" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        text                     NOT NULL,
  "description" text                     NOT NULL DEFAULT ''::text,
  "is_active"   boolean                  NOT NULL DEFAULT true,
  "created_by"  uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "funds_name_check" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 120))),
  CONSTRAINT "funds_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."funds"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."message_violations" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "offender_id"   uuid,
  "matched_terms" text[]                   NOT NULL DEFAULT '{}'::text[],
  "body_excerpt"  text                     NOT NULL DEFAULT ''::text,
  "strike_number" integer                  NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "message_violations_pkey" PRIMARY KEY (id),
  CONSTRAINT "message_violations_strike_number_check" CHECK (((strike_number >= 1) AND (strike_number <= 3)))
);

ALTER TABLE "public"."message_violations"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."moderation_reports" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "recipient_id"  uuid                     NOT NULL,
  "offender_id"   uuid,
  "offender_name" text                     NOT NULL DEFAULT 'Deleted account'::text,
  "matched_terms" text[]                   NOT NULL DEFAULT '{}'::text[],
  "body_excerpt"  text                     NOT NULL DEFAULT ''::text,
  "strike_number" integer                  NOT NULL,
  "action"        text                     NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "moderation_reports_action_check" CHECK ((action = ANY (ARRAY['warning'::text, 'account_deleted'::text]))),
  CONSTRAINT "moderation_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "moderation_reports_strike_number_check" CHECK (((strike_number >= 1) AND (strike_number <= 3)))
);

ALTER TABLE "public"."moderation_reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notices" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"        text                     NOT NULL,
  "description"  text                     NOT NULL DEFAULT ''::text,
  "published_at" timestamp with time zone NOT NULL DEFAULT now(),
  "pinned"       boolean                  NOT NULL DEFAULT false,
  "created_by"   uuid                     NOT NULL,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notices_description_check" CHECK ((char_length(description) <= 4000)),
  CONSTRAINT "notices_pkey" PRIMARY KEY (id),
  CONSTRAINT "notices_title_check" CHECK (((char_length(title) >= 3) AND (char_length(title) <= 160)))
);

ALTER TABLE "public"."notices"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."notifications_preferences" (
  "user_id"    uuid                     NOT NULL,
  "enabled"    boolean                  NOT NULL DEFAULT true,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notifications_preferences_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."notifications_preferences"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "display_name" text                     NOT NULL DEFAULT ''::text,
  "status"       text                     NOT NULL DEFAULT 'active'::text,
  "suspended_at" timestamp with time zone,
  "suspended_by" uuid,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."record_folders" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        text                     NOT NULL,
  "description" text                     NOT NULL DEFAULT ''::text,
  "created_by"  uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "record_folders_name_check" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 120))),
  CONSTRAINT "record_folders_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."record_folders"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."records" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "folder_id"       uuid,
  "title"           text                     NOT NULL,
  "summary"         text                     NOT NULL DEFAULT ''::text,
  "reference"       text                     NOT NULL DEFAULT ''::text,
  "storage_path"    text                     NOT NULL DEFAULT ''::text,
  "is_confidential" boolean                  NOT NULL DEFAULT false,
  "archived_at"     timestamp with time zone,
  "created_by"      uuid                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "records_pkey" PRIMARY KEY (id),
  CONSTRAINT "records_title_check" CHECK (((char_length(title) >= 2) AND (char_length(title) <= 200)))
);

ALTER TABLE "public"."records"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."transactions" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fund_id"     uuid                     NOT NULL,
  "category"    text                     NOT NULL DEFAULT 'general'::text,
  "amount"      numeric(14,2)            NOT NULL,
  "currency"    text                     NOT NULL DEFAULT 'KES'::text,
  "occurred_on" date                     NOT NULL DEFAULT CURRENT_DATE,
  "reference"   text                     NOT NULL DEFAULT ''::text,
  "description" text                     NOT NULL DEFAULT ''::text,
  "member_id"   uuid,
  "recorded_by" uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "transactions_amount_check" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "transactions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."transactions"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."department" AS ENUM (
  'church_secretary',
  'church_treasurer',
  'pastor',
  'youth',
  'sunday_school',
  'women',
  'men',
  'media'
);

ALTER TABLE "public"."department_heads"
  ADD COLUMN "department" public.department NOT NULL;

ALTER TABLE "public"."department_memberships"
  ADD COLUMN "department" public.department NOT NULL;

ALTER TABLE "public"."events"
  ADD COLUMN "department" public.department NOT NULL;

ALTER TABLE "public"."notices"
  ADD COLUMN "department" public.department NOT NULL;

ALTER TABLE "public"."record_folders"
  ADD COLUMN "department" public.department;

ALTER TABLE "public"."records"
  ADD COLUMN "department" public.department;

CREATE TYPE "public"."fund_kind" AS ENUM (
  'general',
  'building',
  'missions',
  'welfare',
  'youth',
  'other'
);

ALTER TABLE "public"."funds"
  ADD COLUMN "kind" public.fund_kind NOT NULL DEFAULT 'general'::public.fund_kind;

CREATE TYPE "public"."member_role" AS ENUM (
  'member',
  'department_editor',
  'department_head',
  'pastor',
  'treasurer',
  'admin'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "role" public.member_role NOT NULL DEFAULT 'member'::public.member_role;

CREATE TYPE "public"."record_class" AS ENUM (
  'minutes',
  'membership',
  'legal',
  'property',
  'correspondence',
  'finance',
  'events',
  'personnel',
  'other'
);

ALTER TABLE "public"."record_folders"
  ADD COLUMN "class" public.record_class NOT NULL DEFAULT 'other'::public.record_class;

ALTER TABLE "public"."records"
  ADD COLUMN "class" public.record_class NOT NULL DEFAULT 'other'::public.record_class;

CREATE TYPE "public"."txn_direction" AS ENUM (
  'income',
  'expense'
);

ALTER TABLE "public"."transactions"
  ADD COLUMN "direction" public.txn_direction NOT NULL;

CREATE OR REPLACE FUNCTION private.account_directory_email (
  target_user_id uuid
)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select u.email
  from auth.users u
  where u.id = target_user_id
    and exists (
      select 1
      from public.profiles viewer
      where viewer.id = auth.uid()
        and viewer.status = 'active'
        and viewer.role in ('admin', 'pastor')
    );
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_user (
  target_user_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
  AS $function$
declare
  target_role public.member_role;
  target_exists boolean;
  active_admin_count integer;
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception 'You must be signed in to delete an account';
  end if;

  if not public.is_admin() then
    raise exception 'Only an administrator can permanently delete an account';
  end if;

  if target_user_id is null then
    raise exception 'A target user is required';
  end if;

  if target_user_id = actor_id then
    raise exception 'You cannot delete your own administrator account';
  end if;

  select exists (
    select 1 from auth.users where id = target_user_id
  )
  into target_exists;

  if not target_exists then
    raise exception 'That account no longer exists';
  end if;

  select role
    into target_role
  from public.profiles
  where id = target_user_id;

  if target_role = 'admin' then
    select count(*)
      into active_admin_count
    from public.profiles
    where role = 'admin'
      and status = 'active';

    if active_admin_count <= 1 then
      raise exception 'You cannot delete the last active administrator';
    end if;
  end if;

  -- Preserve authored content by transferring ownership to the administrator
  -- performing the deletion. Audit actor_id remains nullable and is preserved.
  update public.events
     set created_by = actor_id
   where created_by = target_user_id;

  update public.notices
     set created_by = actor_id
   where created_by = target_user_id;

  update public.funds
     set created_by = actor_id
   where created_by = target_user_id;

  update public.finance_members
     set created_by = actor_id
   where created_by = target_user_id;

  update public.budgets
     set created_by = actor_id
   where created_by = target_user_id;

  update public.record_folders
     set created_by = actor_id
   where created_by = target_user_id;

  update public.records
     set created_by = actor_id
   where created_by = target_user_id;

  update public.audio_recordings
     set created_by = actor_id
   where created_by = target_user_id;

  update public.transactions
     set recorded_by = actor_id
   where recorded_by = target_user_id;

  update public.department_heads
     set appointed_by = actor_id
   where appointed_by = target_user_id;

  update public.profiles
     set suspended_by = actor_id
   where suspended_by = target_user_id;

  -- auth.users has cascading references for the auth data and profiles.
  -- Profile-linked memberships, heads, messages, preferences and reports
  -- therefore follow the account deletion according to their FK policies.
  delete from auth.users
  where id = target_user_id;

  if not found then
    raise exception 'The account could not be deleted';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_seat_is_open()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select not exists (
    select 1
    from public.profiles
    where role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_edit_department (
  target public.department
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (
        p.role in ('admin', 'pastor')

        or (

          p.role in (
            'department_head',
            'department_editor'
          )

          and (
            exists (
              select 1
              from public.department_memberships m
              where m.user_id = p.id
                and m.department = target
            )

            or exists (
              select 1
              from public.department_heads h
              where h.head_id = p.id
                and h.department = target
            )
          )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_publish_media()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'pastor')
      and status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.claim_admin_seat()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  current_user_id uuid;
  current_role public.member_role;
  current_status text;
begin

  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'You must be signed in to claim the administrator seat';
  end if;


  if not public.admin_seat_is_open() then
    raise exception
      'An administrator already exists; ask them to grant you a role';
  end if;


  select role, status
  into current_role, current_status
  from public.profiles
  where id = current_user_id;


  if current_role is null then
    raise exception
      'Your account profile does not exist';
  end if;


  /*
    The first signed-in member may become admin.

    This is deliberately allowed here even though normal profile privilege
    changes are administrator-only. The profile protection trigger below
    explicitly recognises this one-time bootstrap transition.
  */

  update public.profiles
  set
    role = 'admin',
    status = 'active',
    suspended_at = null,
    suspended_by = null,
    updated_at = now()
  where id = current_user_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_department_head_rule()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  head_role public.member_role;
  head_status text;
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can appoint or change a department head';
  end if;

  select role, status
    into head_role, head_status
  from public.profiles
  where id = new.head_id;

  if head_status is null then
    raise exception 'That account no longer exists';
  end if;

  if head_status <> 'active' then
    raise exception 'A suspended account cannot lead a department';
  end if;

  if head_role not in (
    'member',
    'department_editor',
    'department_head',
    'pastor',
    'admin'
  ) then
    raise exception 'Only a member, department editor, department head, pastor or administrator can lead a department';
  end if;

  if head_role in ('department_editor', 'member') then
    update public.profiles
       set role = 'department_head'
     where id = new.head_id;
  end if;

  new.appointed_by := auth.uid();
  new.appointed_at := now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_membership_rule()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if not public.is_admin() then
    raise exception 'Only an administrator can change department memberships';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;

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
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do update
    set display_name = case
      when public.profiles.display_name is null
        or public.profiles.display_name = ''
      then excluded.display_name
      else public.profiles.display_name
    end;

  insert into public.notifications_preferences (user_id, enabled)
  values (new.id, true)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_active()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select coalesce(
    (
      select status = 'active'
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_overseer()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'pastor')
      and status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
      and role in (
        'department_editor',
        'department_head',
        'treasurer',
        'pastor',
        'admin'
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_treasurer()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('treasurer', 'admin', 'pastor')
      and status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.list_message_recipients (
  search_text text DEFAULT ''::text
)
  RETURNS TABLE (
    id           uuid,
    display_name text
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_audit()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  payload jsonb;
  record_id text;
  actor_email_value text;
begin

  if tg_op = 'DELETE' then
    payload := to_jsonb(old);
  else
    payload := to_jsonb(new);
  end if;

  /*
    Different audited tables use different primary-key structures.

    profiles / records / transactions:
      id

    department_memberships:
      user_id + department

    department_heads:
      department
  */

  record_id := coalesce(
    payload ->> 'id',
    case
      when payload ? 'user_id'
       and payload ? 'department'
      then (payload ->> 'user_id') || ':' || (payload ->> 'department')
      when payload ? 'department'
      then payload ->> 'department'
      else ''
    end
  );

  select coalesce(email, '')
  into actor_email_value
  from auth.users
  where id = auth.uid();

  insert into public.audit_log (
    actor_id,
    actor_email,
    action,
    entity,
    entity_id,
    detail
  )
  values (
    auth.uid(),
    coalesce(actor_email_value, ''),
    lower(tg_op),
    tg_table_name,
    coalesce(record_id, ''),
    coalesce(payload, '{}'::jsonb)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;

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

  if old.id = auth.uid()
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

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.single_live_broadcast()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

ALTER TABLE "public"."department_heads"
  ADD CONSTRAINT "department_heads_pkey" PRIMARY KEY (department);

ALTER TABLE "public"."department_memberships"
  ADD CONSTRAINT "department_memberships_pkey" PRIMARY KEY (user_id, department);

ALTER TABLE "public"."budgets"
  ADD CONSTRAINT "budgets_fund_id_fkey" FOREIGN KEY (fund_id) REFERENCES public.funds(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."audio_recordings"
  ADD CONSTRAINT "audio_recordings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."audit_log"
  ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."budgets"
  ADD CONSTRAINT "budgets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."department_heads"
  ADD CONSTRAINT "department_heads_appointed_by_fkey" FOREIGN KEY (appointed_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."department_heads"
  ADD CONSTRAINT "department_heads_head_id_fkey" FOREIGN KEY (head_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."department_memberships"
  ADD CONSTRAINT "department_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_messages"
  ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."direct_messages"
  ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."finance_members"
  ADD CONSTRAINT "finance_members_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."funds"
  ADD CONSTRAINT "funds_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."message_violations"
  ADD CONSTRAINT "message_violations_offender_id_fkey" FOREIGN KEY (offender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."moderation_reports"
  ADD CONSTRAINT "moderation_reports_offender_id_fkey" FOREIGN KEY (offender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."moderation_reports"
  ADD CONSTRAINT "moderation_reports_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."notices"
  ADD CONSTRAINT "notices_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."notifications_preferences"
  ADD CONSTRAINT "notifications_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_suspended_by_fkey" FOREIGN KEY (suspended_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."record_folders"
  ADD CONSTRAINT "record_folders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."records"
  ADD CONSTRAINT "records_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE "public"."records"
  ADD CONSTRAINT "records_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES public.record_folders(id) ON DELETE SET NULL;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_fund_id_fkey" FOREIGN KEY (fund_id) REFERENCES public.funds(id) ON DELETE RESTRICT;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.finance_members(id) ON DELETE SET NULL;

ALTER TABLE "public"."transactions"
  ADD CONSTRAINT "transactions_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES public.profiles(id);

CREATE VIEW "public"."account_directory" WITH (security_barrier=true, security_invoker=true) AS  SELECT id,
    display_name,
    role,
    status,
    suspended_at,
    suspended_by,
    created_at,
    updated_at,
    private.account_directory_email(id) AS email,
    COALESCE(( SELECT array_agg(dh.department ORDER BY dh.department) AS array_agg
           FROM public.department_heads dh
          WHERE (dh.head_id = p.id)), '{}'::public.department[]) AS led_departments,
    COALESCE(( SELECT array_agg(dm.department ORDER BY dm.department) AS array_agg
           FROM public.department_memberships dm
          WHERE (dm.user_id = p.id)), '{}'::public.department[]) AS departments
   FROM public.profiles p
  WHERE (EXISTS ( SELECT 1
           FROM public.profiles viewer
          WHERE ((viewer.id = auth.uid()) AND (viewer.status = 'active'::text) AND (viewer.role = ANY (ARRAY['admin'::public.member_role, 'pastor'::public.member_role])))));

CREATE INDEX audio_recordings_kind_idx ON public.audio_recordings USING btree (kind, created_at DESC);

CREATE INDEX audio_recordings_live_idx ON public.audio_recordings USING btree (is_live)
  WHERE (is_live = true);

CREATE INDEX audio_recordings_published_idx ON public.audio_recordings USING btree (is_published, created_at DESC);

CREATE UNIQUE INDEX audio_recordings_single_live_idx ON public.audio_recordings USING btree (is_live)
  WHERE (is_live = true);

CREATE INDEX audit_log_created_idx ON public.audit_log USING btree (created_at DESC);

CREATE INDEX direct_messages_recipient_sender_idx ON public.direct_messages USING btree (recipient_id, sender_id, created_at DESC);

CREATE INDEX direct_messages_sender_recipient_idx ON public.direct_messages USING btree (sender_id, recipient_id, created_at DESC);

CREATE INDEX events_department_idx ON public.events USING btree (department);

CREATE INDEX events_starts_at_idx ON public.events USING btree (starts_at);

CREATE INDEX message_violations_offender_idx ON public.message_violations USING btree (offender_id, created_at DESC);

CREATE INDEX moderation_reports_recipient_idx ON public.moderation_reports USING btree (recipient_id, created_at DESC);

CREATE INDEX notices_department_idx ON public.notices USING btree (department);

CREATE INDEX notices_published_at_idx ON public.notices USING btree (published_at DESC);

CREATE INDEX profiles_role_idx ON public.profiles USING btree (ROLE);

CREATE INDEX profiles_status_idx ON public.profiles USING btree (status);

CREATE INDEX records_class_idx ON public.records USING btree (class);

CREATE INDEX records_department_idx ON public.records USING btree (department);

CREATE INDEX transactions_direction_idx ON public.transactions USING btree (direction);

CREATE INDEX transactions_fund_idx ON public.transactions USING btree (fund_id);

CREATE INDEX transactions_occurred_idx ON public.transactions USING btree (occurred_on DESC);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER audio_recordings_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.audio_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER audio_recordings_touch
  BEFORE UPDATE ON public.audio_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER single_live_broadcast
  BEFORE INSERT OR UPDATE ON public.audio_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.single_live_broadcast();

CREATE TRIGGER department_heads_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.department_heads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER enforce_department_head_rule
  BEFORE INSERT OR UPDATE ON public.department_heads
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_department_head_rule();

CREATE TRIGGER enforce_membership_rule
  BEFORE INSERT OR DELETE OR UPDATE ON public.department_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_membership_rule();

CREATE TRIGGER memberships_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.department_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER events_touch
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER funds_touch
  BEFORE UPDATE ON public.funds
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER notices_touch
  BEFORE UPDATE ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER notifications_preferences_touch
  BEFORE UPDATE ON public.notifications_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER profiles_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER profiles_touch
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileges();

CREATE TRIGGER records_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER records_touch
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER transactions_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

CREATE TRIGGER transactions_touch
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Published worship audio is public" ON "public"."audio_recordings"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((is_published = true));

CREATE POLICY "Publishers create worship audio" ON "public"."audio_recordings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((public.can_publish_media() AND (created_by = ( SELECT auth.uid() AS uid))));

CREATE POLICY "Publishers delete worship audio" ON "public"."audio_recordings"
  FOR DELETE
  TO "authenticated"
  USING (public.can_publish_media());

CREATE POLICY "Publishers read worship audio" ON "public"."audio_recordings"
  FOR SELECT
  TO "authenticated"
  USING (public.can_publish_media());

CREATE POLICY "Publishers update worship audio" ON "public"."audio_recordings"
  FOR UPDATE
  TO "authenticated"
  USING (public.can_publish_media())
  WITH CHECK (public.can_publish_media());

CREATE POLICY "Overseers read audit log" ON "public"."audit_log"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_overseer() OR public.is_treasurer()));

CREATE POLICY "Treasurers manage budgets" ON "public"."budgets"
  FOR ALL
  TO "authenticated"
  USING (public.is_treasurer())
  WITH CHECK (public.is_treasurer());

CREATE POLICY "Overseers manage department heads" ON "public"."department_heads"
  FOR ALL
  TO "authenticated"
  USING (public.is_overseer())
  WITH CHECK (public.is_overseer());

CREATE POLICY "Staff can read department heads" ON "public"."department_heads"
  FOR SELECT
  TO "authenticated"
  USING (public.is_staff());

CREATE POLICY "Admins manage memberships" ON "public"."department_memberships"
  FOR ALL
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Staff can read memberships" ON "public"."department_memberships"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = auth.uid()) OR public.is_admin() OR public.is_staff()));

CREATE POLICY "Message participants can read their messages" ON "public"."direct_messages"
  FOR SELECT
  TO "authenticated"
  USING (((sender_id = auth.uid()) OR (recipient_id = auth.uid())));

CREATE POLICY "Editors can create department events" ON "public"."events"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((created_by = auth.uid()) AND public.can_edit_department(department)));

CREATE POLICY "Editors can delete department events" ON "public"."events"
  FOR DELETE
  TO "authenticated"
  USING (public.can_edit_department(department));

CREATE POLICY "Editors can update department events" ON "public"."events"
  FOR UPDATE
  TO "authenticated"
  USING (public.can_edit_department(department))
  WITH CHECK (public.can_edit_department(department));

CREATE POLICY "Published calendar is public" ON "public"."events"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Treasurers manage finance members" ON "public"."finance_members"
  FOR ALL
  TO "authenticated"
  USING (public.is_treasurer())
  WITH CHECK (public.is_treasurer());

CREATE POLICY "Treasurers manage funds" ON "public"."funds"
  FOR ALL
  TO "authenticated"
  USING (public.is_treasurer())
  WITH CHECK (public.is_treasurer());

CREATE POLICY "Moderation recipients can read reports" ON "public"."moderation_reports"
  FOR SELECT
  TO "authenticated"
  USING (((recipient_id = auth.uid()) OR public.is_admin() OR public.is_overseer() OR (EXISTS ( SELECT 1
   FROM public.department_memberships m
  WHERE ((m.user_id = auth.uid()) AND (m.department = 'church_secretary'::public.department))))));

CREATE POLICY "Editors can create department notices" ON "public"."notices"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((created_by = auth.uid()) AND public.can_edit_department(department)));

CREATE POLICY "Editors can delete department notices" ON "public"."notices"
  FOR DELETE
  TO "authenticated"
  USING (public.can_edit_department(department));

CREATE POLICY "Editors can update department notices" ON "public"."notices"
  FOR UPDATE
  TO "authenticated"
  USING (public.can_edit_department(department))
  WITH CHECK (public.can_edit_department(department));

CREATE POLICY "Published notices are public" ON "public"."notices"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users manage notification preference" ON "public"."notifications_preferences"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "Admins can update profiles" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can read their profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = auth.uid()) OR public.is_staff()));

CREATE POLICY "Users can update their own display name" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "Overseers manage record folders" ON "public"."record_folders"
  FOR ALL
  TO "authenticated"
  USING (public.is_overseer())
  WITH CHECK (public.is_overseer());

CREATE POLICY "Staff read record folders" ON "public"."record_folders"
  FOR SELECT
  TO "authenticated"
  USING ((public.is_staff() AND ((department IS NULL) OR public.can_edit_department(department) OR public.is_overseer())));

CREATE POLICY "Overseers and record owners write records" ON "public"."records"
  FOR ALL
  TO "authenticated"
  USING ((public.is_overseer() OR (public.is_staff() AND (department IS
    NOT NULL) AND public.can_edit_department(department)) OR (public.is_treasurer() AND (class = 'finance'::public.record_class))))
  WITH CHECK (((created_by = auth.uid()) AND (public.is_overseer() OR (public.is_staff() AND (department IS
    NOT NULL) AND public.can_edit_department(department)) OR (public.is_treasurer() AND (class = 'finance'::public.record_class)))));

CREATE POLICY "Staff read records" ON "public"."records"
  FOR SELECT
  TO "authenticated"
  USING
    ((public.is_overseer() OR (public.is_treasurer() AND (class = 'finance'::public.record_class)) OR (public.is_staff() AND (is_confidential = false) AND ((department IS NULL) OR
    public.can_edit_department(department)))));

CREATE POLICY "Treasurers manage transactions" ON "public"."transactions"
  FOR ALL
  TO "authenticated"
  USING (public.is_treasurer())
  WITH CHECK (public.is_treasurer());

CREATE POLICY "Anyone can read worship audio" ON "storage"."objects"
  FOR SELECT
  TO "anon", "authenticated"
  USING ((bucket_id = 'worship-audio'::text));

CREATE POLICY "Overseers delete record files" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'records'::text) AND public.is_overseer()));

CREATE POLICY "Publishers delete worship audio" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'worship-audio'::text) AND public.can_publish_media()));

CREATE POLICY "Publishers update worship audio" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'worship-audio'::text) AND public.can_publish_media()))
  WITH CHECK (((bucket_id = 'worship-audio'::text) AND public.can_publish_media()));

CREATE POLICY "Publishers upload worship audio" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'worship-audio'::text) AND public.can_publish_media()));

CREATE POLICY "Staff read record files" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'records'::text) AND public.is_staff()));

CREATE POLICY "Staff upload record files" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'records'::text) AND public.is_staff()));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

REVOKE ALL ON FUNCTION "private"."account_directory_email"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "private"."account_directory_email"(uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."admin_delete_user"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."admin_delete_user"(uuid) TO "authenticated", "postgres";

GRANT EXECUTE ON FUNCTION "public"."admin_seat_is_open"() TO PUBLIC, "anon", "authenticated", "postgres";

GRANT EXECUTE ON FUNCTION "public"."can_edit_department"(public.department) TO PUBLIC, "postgres";

REVOKE ALL ON FUNCTION "public"."can_publish_media"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."can_publish_media"() TO "authenticated", "postgres";

GRANT EXECUTE ON FUNCTION "public"."claim_admin_seat"() TO PUBLIC, "authenticated", "postgres";

GRANT EXECUTE ON FUNCTION "public"."enforce_department_head_rule"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."enforce_membership_rule"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."ensure_profile"() TO PUBLIC, "authenticated", "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_active"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_overseer"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_staff"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."is_treasurer"() TO PUBLIC, "postgres";

REVOKE ALL ON FUNCTION "public"."list_message_recipients"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."list_message_recipients"(text) TO "authenticated", "postgres";

GRANT EXECUTE ON FUNCTION "public"."log_audit"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."protect_profile_privileges"() TO PUBLIC, "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "postgres";

REVOKE ALL ON FUNCTION "public"."single_live_broadcast"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."single_live_broadcast"() TO "authenticated", "postgres";

GRANT EXECUTE ON FUNCTION "public"."touch_updated_at"() TO PUBLIC, "postgres";

GRANT CREATE, USAGE ON SCHEMA "private" TO "postgres";

REVOKE ALL ON TABLE "public"."audio_recordings" FROM "anon";

GRANT SELECT ON TABLE "public"."audio_recordings" TO "anon";

REVOKE ALL ON TABLE "public"."audio_recordings" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."audio_recordings" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audio_recordings" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."audio_recordings" TO "service_role";

REVOKE ALL ON TABLE "public"."audit_log" FROM "authenticated";

GRANT SELECT ON TABLE "public"."audit_log" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."audit_log" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."audit_log" TO "service_role";

REVOKE ALL ON TABLE "public"."budgets" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."budgets" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."budgets" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."budgets" TO "service_role";

REVOKE ALL ON TABLE "public"."department_heads" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."department_heads" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."department_heads" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."department_heads" TO "service_role";

REVOKE ALL ON TABLE "public"."department_memberships" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."department_memberships" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."department_memberships" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."department_memberships" TO "service_role";

REVOKE ALL ON TABLE "public"."direct_messages" FROM "authenticated";

GRANT SELECT ON TABLE "public"."direct_messages" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."direct_messages" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."direct_messages" TO "service_role";

REVOKE ALL ON TABLE "public"."events" FROM "anon";

GRANT SELECT ON TABLE "public"."events" TO "anon";

REVOKE ALL ON TABLE "public"."events" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."events" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."events" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."events" TO "service_role";

REVOKE ALL ON TABLE "public"."finance_members" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."finance_members" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."finance_members" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."finance_members" TO "service_role";

REVOKE ALL ON TABLE "public"."funds" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."funds" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."funds" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."funds" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."message_violations" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."message_violations" TO "service_role";

REVOKE ALL ON TABLE "public"."moderation_reports" FROM "authenticated";

GRANT SELECT ON TABLE "public"."moderation_reports" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."moderation_reports" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."moderation_reports" TO "service_role";

REVOKE ALL ON TABLE "public"."notices" FROM "anon";

GRANT SELECT ON TABLE "public"."notices" TO "anon";

REVOKE ALL ON TABLE "public"."notices" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."notices" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notices" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."notices" TO "service_role";

REVOKE ALL ON TABLE "public"."notifications_preferences" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."notifications_preferences" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."notifications_preferences" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."notifications_preferences" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT SELECT, UPDATE ON TABLE "public"."profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."record_folders" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."record_folders" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."record_folders" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."record_folders" TO "service_role";

REVOKE ALL ON TABLE "public"."records" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."records" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."records" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."records" TO "service_role";

REVOKE ALL ON TABLE "public"."transactions" FROM "authenticated";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."transactions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transactions" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."transactions" TO "service_role";

GRANT USAGE ON TYPE "public"."department" TO "postgres";

GRANT USAGE ON TYPE "public"."fund_kind" TO "postgres";

GRANT USAGE ON TYPE "public"."member_role" TO "postgres";

GRANT USAGE ON TYPE "public"."record_class" TO "postgres";

GRANT USAGE ON TYPE "public"."txn_direction" TO "postgres";

REVOKE ALL ON TABLE "public"."account_directory" FROM "authenticated";

GRANT SELECT ON TABLE "public"."account_directory" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."account_directory" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."account_directory" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";

