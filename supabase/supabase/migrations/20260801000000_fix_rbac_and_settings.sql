set check_function_bodies = off;

-- check_permissions previously joined on rp.role_id/rp.permission_id, but
-- role_permissions columns are (role, permission) — every call errored at runtime.
CREATE OR REPLACE FUNCTION public.check_permissions(VARIADIC required_permissions character varying[])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission
    WHERE ur.user_id = (select auth.uid())
      AND (p.path = any(required_permissions) OR p.path = 'auth:superuser')
  );
end;
$function$
;

-- Workspace access previously ignored ownership: a private workspace was
-- invisible to its own creator. Owner and superuser now always have access.
CREATE OR REPLACE FUNCTION public.check_workspace_permissions(workspace_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  workspace_record record;
BEGIN
  SELECT is_public, user_id INTO workspace_record
  FROM public.workspaces
  WHERE id = workspace_id;

  IF workspace_record IS NULL THEN
    RETURN false;
  END IF;

  IF workspace_record.is_public THEN
    RETURN true;
  END IF;

  IF workspace_record.user_id = (SELECT auth.uid()) THEN
    RETURN true;
  END IF;

  IF public.check_permissions('auth:superuser'::character varying) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_permissions wp
    WHERE wp.workspace = workspace_id
      AND wp.permission IN (SELECT public.get_user_permission_ids())
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_board_permissions(board_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  board_record record;
BEGIN
  SELECT is_public, workspace, user_id INTO board_record
  FROM public.boards
  WHERE id = board_id;

  IF board_record IS NULL THEN
    RETURN false;
  END IF;

  IF board_record.user_id = (SELECT auth.uid()) THEN
    RETURN true;
  END IF;

  IF public.check_permissions('auth:superuser'::character varying) THEN
    RETURN true;
  END IF;

  IF NOT public.check_workspace_permissions(board_record.workspace) THEN
    RETURN false;
  END IF;

  IF board_record.is_public THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.board_permissions bp
    WHERE bp.board = board_id
      AND bp.permission IN (SELECT public.get_user_permission_ids())
  );
END;
$function$
;

-- The select policies previously relied only on check_*_permissions(id),
-- whose table lookup cannot see a row being inserted by the same statement —
-- so INSERT ... RETURNING (used by PostgREST/supabase-js .select()) failed
-- for the creator. Check ownership directly on the row instead.
drop policy if exists "workspaces_select" on "public"."workspaces";

  create policy "workspaces_select"
  on "public"."workspaces"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR public.check_workspace_permissions(id)));


drop policy if exists "boards_select" on "public"."boards";

  create policy "boards_select"
  on "public"."boards"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR public.check_board_permissions(id)));


-- check_card_access ran with an empty search_path but called
-- check_board_permissions unqualified, so every card policy errored with
-- "function does not exist".
CREATE OR REPLACE FUNCTION public.check_card_access(card_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  board_id uuid;
BEGIN
  SELECT l.board INTO board_id
  FROM public.cards c
  JOIN public.lists l ON l.id = c.list
  WHERE c.id = card_id;

  RETURN public.check_board_permissions(board_id);
END;
$function$
;

-- Permission paths for the current user, used by the frontend to gate UI.
CREATE OR REPLACE FUNCTION public.get_user_permission_paths()
 RETURNS SETOF character varying
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT DISTINCT p.path
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  JOIN public.permissions p ON p.id = rp.permission
  WHERE ur.user_id = (SELECT auth.uid());
$function$
;

-- Auth settings live in their own singleton table (general_settings stays
-- presentation-only). default_roles holds the sets of roles granted to new
-- users, scoped by how the account was created: globally, on public
-- self-registration, on private (invited) registration, or per SSO identity
-- provider (post-MVP). No FK to auth_settings — it is a singleton (id = 1),
-- so the scope is expressed by the type column instead.
CREATE TYPE public.default_role_type AS ENUM (
    'global',
    'public_registration',
    'private_registration',
    'sso_provider'
);

CREATE TABLE public.auth_settings (
    id bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enable_registration boolean DEFAULT true NOT NULL,
    CONSTRAINT auth_settings_pkey PRIMARY KEY (id),
    CONSTRAINT auth_settings_id_check CHECK ((id = 1))
);

CREATE TABLE public.default_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role uuid NOT NULL,
    type public.default_role_type DEFAULT 'global'::public.default_role_type NOT NULL,
    provider character varying,
    CONSTRAINT default_roles_pkey PRIMARY KEY (id),
    CONSTRAINT default_roles_role_fkey FOREIGN KEY (role) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT default_roles_provider_check CHECK (((type = 'sso_provider'::public.default_role_type) = (provider IS NOT NULL)))
);

CREATE UNIQUE INDEX default_roles_role_type_provider_key ON public.default_roles USING btree (role, type, COALESCE(provider, ''));

ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.default_roles ENABLE ROW LEVEL SECURITY;

INSERT INTO public.auth_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;


  create policy "auth_settings_select"
  on "public"."auth_settings"
  as permissive
  for select
  to authenticated
using (true);



  create policy "auth_settings_update"
  on "public"."auth_settings"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['system:settings'::character varying]))
with check (public.check_permissions(VARIADIC ARRAY['system:settings'::character varying]));



  create policy "default_roles_select"
  on "public"."default_roles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "default_roles_insert"
  on "public"."default_roles"
  as permissive
  for insert
  to authenticated
with check (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying, 'system:settings'::character varying]));



  create policy "default_roles_update"
  on "public"."default_roles"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying, 'system:settings'::character varying]));



  create policy "default_roles_delete"
  on "public"."default_roles"
  as permissive
  for delete
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying, 'system:settings'::character varying]));


-- New users get a profile row plus every default role whose scope matches how
-- the account was created: global always applies; invited accounts (GoTrue
-- sets invited_at) get private_registration roles, self-service signups get
-- public_registration roles; sso_provider rows match the identity provider in
-- app metadata once SSO lands. Without a role a user has zero permissions and
-- cannot create anything.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);

  INSERT INTO public.user_roles (user_id, role)
  SELECT new.id, dr.role
  FROM public.default_roles dr
  WHERE dr.type = 'global'
     OR (dr.type = 'private_registration' AND new.invited_at IS NOT NULL)
     OR (dr.type = 'public_registration' AND new.invited_at IS NULL)
     OR (dr.type = 'sso_provider' AND dr.provider = (new.raw_app_meta_data ->> 'provider'))
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$function$
;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles USING btree (username);
