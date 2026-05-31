create extension if not exists "pg_cron" with schema "pg_catalog";

drop policy "board_read" on "public"."boards";

drop policy "workspace_create" on "public"."workspaces";

drop policy "workspace_delete" on "public"."workspaces";

drop policy "workspace_read" on "public"."workspaces";

drop policy "workspace_update" on "public"."workspaces";

alter table "public"."boards" drop constraint "boards_user_fkey";

alter table "public"."card_activities" drop constraint "card_activities_user_fkey";

alter table "public"."comments" drop constraint "comments_user_fkey";

alter table "public"."profiles" drop constraint "profiles_user_fkey";

alter table "public"."user_roles" drop constraint "user_roles_user_fkey";

alter table "public"."workspaces" drop constraint "workspaces_user_fkey";

drop function if exists "public"."check_permissions"(required_permission text);

alter table "public"."user_roles" drop constraint "user_roles_pkey";

drop index if exists "public"."user_roles_pkey";

alter table "public"."boards" drop column "user";

alter table "public"."boards" add column "user_id" uuid;

alter table "public"."card_activities" drop column "user";

alter table "public"."card_activities" add column "user_id" uuid;

alter table "public"."cards" add column "assignee" uuid;

alter table "public"."comments" drop column "user";

alter table "public"."comments" add column "user_id" uuid;

alter table "public"."profiles" drop column "user";

alter table "public"."profiles" add column "user_id" uuid not null;

alter table "public"."profiles" alter column "username" drop not null;

alter table "public"."user_roles" drop column "user";

alter table "public"."user_roles" add column "user_id" uuid not null;

alter table "public"."workspaces" drop column "user";

alter table "public"."workspaces" add column "user_id" uuid;

CREATE INDEX idx_board_permissions_board ON public.board_permissions USING btree (board);

CREATE INDEX idx_boards_workspace ON public.boards USING btree (workspace);

CREATE INDEX idx_card_activities_card ON public.card_activities USING btree (card);

CREATE INDEX idx_card_attachments_card ON public.card_attachments USING btree (card);

CREATE INDEX idx_cards_list ON public.cards USING btree (list);

CREATE INDEX idx_check_list_items_card ON public.check_list_items USING btree (card);

CREATE INDEX idx_comment_attachments_comment ON public.comment_attachments USING btree (comment);

CREATE INDEX idx_comments_card ON public.comments USING btree (card);

CREATE INDEX idx_lists_board ON public.lists USING btree (board);

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE INDEX idx_workspace_permissions_workspace ON public.workspace_permissions USING btree (workspace);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id, role);

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."boards" add constraint "boards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."boards" validate constraint "boards_user_id_fkey";

alter table "public"."card_activities" add constraint "card_activities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."card_activities" validate constraint "card_activities_user_id_fkey";

alter table "public"."cards" add constraint "cards_assignee_fkey" FOREIGN KEY (assignee) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."cards" validate constraint "cards_assignee_fkey";

alter table "public"."comments" add constraint "comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."comments" validate constraint "comments_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."workspaces" add constraint "workspaces_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."workspaces" validate constraint "workspaces_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_board_permissions()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    SELECT CASE
      WHEN (is_public = true) THEN true
      ELSE (EXISTS (SELECT 1
        FROM (((board_permissions bp
          JOIN permissions p ON ((p.id = bp.permission)))
          JOIN role_permissions rp ON ((rp.permission = p.id)))
          JOIN user_roles ur ON ((ur.role = rp.role)))
        WHERE ((bp.board = boards.id) AND (ur.user_id = ( SELECT auth.uid() AS uid)))))
    END
  );
end;
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
  SELECT is_public, workspace INTO board_record
  FROM public.boards
  WHERE id = board_id;

  IF NOT check_workspace_permissions(board_record.workspace) THEN
    RETURN false;
  END IF;

  IF board_record.is_public THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.board_permissions bp
    WHERE bp.board = board_id
      AND bp.permission IN (SELECT get_user_permission_ids())
  );
END;
$function$
;

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

  RETURN check_board_permissions(board_id);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_permissions(VARIADIC required_permissions character varying[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = (select auth.uid())
      AND (p.path = any(required_permissions) OR p.path = 'auth:superuser')
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_workspace_permissions()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    SELECT CASE
    WHEN (is_public = true) THEN true
    ELSE (EXISTS ( SELECT 1
       FROM (((workspace_permissions wp
         JOIN permissions p ON ((p.id = wp.permission)))
         JOIN role_permissions rp ON ((rp.permission = p.id)))
         JOIN user_roles ur ON ((ur.role = rp.role)))
      WHERE ((wp.workspace = workspaces.id) AND (ur.user_id = ( SELECT auth.uid() AS uid)))))
    END
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_workspace_permissions(workspace_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  workspace_is_public boolean;
BEGIN
  SELECT is_public INTO workspace_is_public
  FROM public.workspaces
  WHERE id = workspace_id;

  IF workspace_is_public THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_permissions wp
    WHERE wp.workspace = workspace_id
      AND wp.permission IN (SELECT get_user_permission_ids())
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_permission_ids()
 RETURNS SETOF uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
    SELECT DISTINCT rp.permission
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = (SELECT auth.uid());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (
    new.id
  );
  RETURN new;
END;$function$
;


  create policy "board_permissions_delete"
  on "public"."board_permissions"
  as permissive
  for delete
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]));



  create policy "board_permissions_insert"
  on "public"."board_permissions"
  as permissive
  for insert
  to authenticated
with check (public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]));



  create policy "board_permissions_select"
  on "public"."board_permissions"
  as permissive
  for select
  to authenticated
using (public.check_board_permissions(board));



  create policy "board_permissions_update"
  on "public"."board_permissions"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]));



  create policy "boards_delete"
  on "public"."boards"
  as permissive
  for delete
  to authenticated
using ((public.check_board_permissions(id) AND (((user_id = ( SELECT auth.uid() AS uid)) AND public.check_permissions(VARIADIC ARRAY['board:delete'::character varying])) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "boards_insert"
  on "public"."boards"
  as permissive
  for insert
  to authenticated
with check ((public.check_permissions(VARIADIC ARRAY['board:create'::character varying]) AND public.check_workspace_permissions(workspace) AND (user_id = ( SELECT auth.uid() AS uid))));



  create policy "boards_select"
  on "public"."boards"
  as permissive
  for select
  to authenticated
using (public.check_board_permissions(id));



  create policy "boards_update"
  on "public"."boards"
  as permissive
  for update
  to authenticated
using ((public.check_board_permissions(id) AND (((user_id = ( SELECT auth.uid() AS uid)) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "card_activities_insert"
  on "public"."card_activities"
  as permissive
  for insert
  to authenticated
with check ((public.check_card_access(card) AND (user_id = ( SELECT auth.uid() AS uid))));



  create policy "card_activities_select"
  on "public"."card_activities"
  as permissive
  for select
  to authenticated
using (public.check_card_access(card));



  create policy "card_attachments_delete"
  on "public"."card_attachments"
  as permissive
  for delete
  to authenticated
using ((public.check_card_access(card) AND (public.check_permissions(VARIADIC ARRAY['board:delete'::character varying]) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "card_attachments_insert"
  on "public"."card_attachments"
  as permissive
  for insert
  to authenticated
with check ((public.check_card_access(card) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "card_attachments_select"
  on "public"."card_attachments"
  as permissive
  for select
  to authenticated
using (public.check_card_access(card));



  create policy "cards_delete"
  on "public"."cards"
  as permissive
  for delete
  to authenticated
using ((public.check_card_access(id) AND (public.check_permissions(VARIADIC ARRAY['board:delete'::character varying]) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "cards_insert"
  on "public"."cards"
  as permissive
  for insert
  to authenticated
with check (((EXISTS ( SELECT 1
   FROM public.lists l
  WHERE ((l.id = cards.list) AND public.check_board_permissions(l.board)))) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "cards_select"
  on "public"."cards"
  as permissive
  for select
  to authenticated
using (public.check_card_access(id));



  create policy "cards_update"
  on "public"."cards"
  as permissive
  for update
  to authenticated
using ((public.check_card_access(id) AND ((assignee = ( SELECT auth.uid() AS uid)) OR public.check_permissions(VARIADIC ARRAY['board:update'::character varying]) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "check_list_items_delete"
  on "public"."check_list_items"
  as permissive
  for delete
  to authenticated
using ((public.check_card_access(card) AND (public.check_permissions(VARIADIC ARRAY['board:delete'::character varying]) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "check_list_items_insert"
  on "public"."check_list_items"
  as permissive
  for insert
  to authenticated
with check ((public.check_card_access(card) AND public.check_permissions(VARIADIC ARRAY['board:create'::character varying])));



  create policy "check_list_items_select"
  on "public"."check_list_items"
  as permissive
  for select
  to authenticated
using (public.check_card_access(card));



  create policy "check_list_items_update"
  on "public"."check_list_items"
  as permissive
  for update
  to authenticated
using ((public.check_card_access(card) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "comment_attachments_delete"
  on "public"."comment_attachments"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.comments c
  WHERE ((c.id = comment_attachments.comment) AND ((c.user_id = ( SELECT auth.uid() AS uid)) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying])) AND public.check_card_access(c.card)))));



  create policy "comment_attachments_insert"
  on "public"."comment_attachments"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.comments c
  WHERE ((c.id = comment_attachments.comment) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND public.check_card_access(c.card)))));



  create policy "comment_attachments_select"
  on "public"."comment_attachments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.comments c
  WHERE ((c.id = comment_attachments.comment) AND public.check_card_access(c.card)))));



  create policy "comments_delete"
  on "public"."comments"
  as permissive
  for delete
  to authenticated
using ((public.check_card_access(card) AND ((user_id = ( SELECT auth.uid() AS uid)) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "comments_insert"
  on "public"."comments"
  as permissive
  for insert
  to authenticated
with check ((public.check_card_access(card) AND (user_id = ( SELECT auth.uid() AS uid))));



  create policy "comments_select"
  on "public"."comments"
  as permissive
  for select
  to authenticated
using (public.check_card_access(card));



  create policy "comments_update"
  on "public"."comments"
  as permissive
  for update
  to authenticated
using ((public.check_card_access(card) AND (user_id = ( SELECT auth.uid() AS uid))));



  create policy "general_settings_select"
  on "public"."general_settings"
  as permissive
  for select
  to authenticated
using (true);



  create policy "general_settings_update"
  on "public"."general_settings"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['system:settings'::character varying]));



  create policy "labels_delete"
  on "public"."labels"
  as permissive
  for delete
  to authenticated
using ((public.check_board_permissions(board) AND (public.check_permissions(VARIADIC ARRAY['board:delete'::character varying]) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "labels_insert"
  on "public"."labels"
  as permissive
  for insert
  to authenticated
with check ((public.check_board_permissions(board) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "labels_select"
  on "public"."labels"
  as permissive
  for select
  to authenticated
using (public.check_board_permissions(board));



  create policy "labels_update"
  on "public"."labels"
  as permissive
  for update
  to authenticated
using ((public.check_board_permissions(board) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "lists_delete"
  on "public"."lists"
  as permissive
  for delete
  to authenticated
using ((public.check_board_permissions(board) AND (public.check_permissions(VARIADIC ARRAY['board:delete'::character varying]) OR public.check_permissions(VARIADIC ARRAY['board:manage'::character varying]))));



  create policy "lists_insert"
  on "public"."lists"
  as permissive
  for insert
  to authenticated
with check ((public.check_board_permissions(board) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "lists_select"
  on "public"."lists"
  as permissive
  for select
  to authenticated
using (public.check_board_permissions(board));



  create policy "lists_update"
  on "public"."lists"
  as permissive
  for update
  to authenticated
using ((public.check_board_permissions(board) AND public.check_permissions(VARIADIC ARRAY['board:update'::character varying])));



  create policy "permissions_delete"
  on "public"."permissions"
  as permissive
  for delete
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "permissions_insert"
  on "public"."permissions"
  as permissive
  for insert
  to authenticated
with check (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "permissions_select"
  on "public"."permissions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "permissions_update"
  on "public"."permissions"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "profiles_delete"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR public.check_permissions(VARIADIC ARRAY['user:manage'::character varying])));



  create policy "profiles_insert"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "profiles_select"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "profiles_update"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR public.check_permissions(VARIADIC ARRAY['user:manage'::character varying])));



  create policy "role_permissions_delete"
  on "public"."role_permissions"
  as permissive
  for delete
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "role_permissions_insert"
  on "public"."role_permissions"
  as permissive
  for insert
  to authenticated
with check (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "role_permissions_select"
  on "public"."role_permissions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "role_permissions_update"
  on "public"."role_permissions"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "roles_delete"
  on "public"."roles"
  as permissive
  for delete
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "roles_insert"
  on "public"."roles"
  as permissive
  for insert
  to authenticated
with check (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "roles_select"
  on "public"."roles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "roles_update"
  on "public"."roles"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['role:manage'::character varying]));



  create policy "user_roles_delete"
  on "public"."user_roles"
  as permissive
  for delete
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['user:manage'::character varying]));



  create policy "user_roles_insert"
  on "public"."user_roles"
  as permissive
  for insert
  to authenticated
with check (public.check_permissions(VARIADIC ARRAY['user:manage'::character varying]));



  create policy "user_roles_select"
  on "public"."user_roles"
  as permissive
  for select
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR public.check_permissions(VARIADIC ARRAY['user:manage'::character varying])));



  create policy "user_roles_update"
  on "public"."user_roles"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['user:manage'::character varying]));



  create policy "workspace_permissions_delete"
  on "public"."workspace_permissions"
  as permissive
  for delete
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['workspace:manage'::character varying]));



  create policy "workspace_permissions_insert"
  on "public"."workspace_permissions"
  as permissive
  for insert
  to authenticated
with check (public.check_permissions(VARIADIC ARRAY['workspace:manage'::character varying]));



  create policy "workspace_permissions_select"
  on "public"."workspace_permissions"
  as permissive
  for select
  to authenticated
using (public.check_workspace_permissions(workspace));



  create policy "workspace_permissions_update"
  on "public"."workspace_permissions"
  as permissive
  for update
  to authenticated
using (public.check_permissions(VARIADIC ARRAY['workspace:manage'::character varying]));



  create policy "workspaces_delete"
  on "public"."workspaces"
  as permissive
  for delete
  to authenticated
using ((public.check_workspace_permissions(id) AND (((user_id = ( SELECT auth.uid() AS uid)) AND public.check_permissions(VARIADIC ARRAY['workspace:delete'::character varying])) OR public.check_permissions(VARIADIC ARRAY['workspace:manage'::character varying]))));



  create policy "workspaces_insert"
  on "public"."workspaces"
  as permissive
  for insert
  to authenticated
with check ((public.check_permissions(VARIADIC ARRAY['workspace:create'::character varying]) AND (user_id = ( SELECT auth.uid() AS uid))));



  create policy "workspaces_select"
  on "public"."workspaces"
  as permissive
  for select
  to authenticated
using (public.check_workspace_permissions(id));



  create policy "workspaces_update"
  on "public"."workspaces"
  as permissive
  for update
  to authenticated
using ((public.check_workspace_permissions(id) AND (((user_id = ( SELECT auth.uid() AS uid)) AND public.check_permissions(VARIADIC ARRAY['workspace:update'::character varying])) OR public.check_permissions(VARIADIC ARRAY['workspace:manage'::character varying]))));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Give users access to own folder tlow5s_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'comment_attachments'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "Give users access to own folder tlow5s_1"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'comment_attachments'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "Give users access to own folder tlow5s_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'comment_attachments'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "Give users authenticated access to bucket 16v3daf_1"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'thumbnails'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "create files 1elmww1_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'card_attachments'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "create files 1elmww1_1"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'card_attachments'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "create files 1elmww1_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'card_attachments'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])));



  create policy "read files 1elmww1_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'card_attachments'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.card_attachments ca
  WHERE (ca.file = objects.id))))));



  create policy "read files tlow5s_0"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'comment_attachments'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.comment_attachments cma
  WHERE (cma.file = objects.id))))));



  create policy "users can update or delete their own files 16v3daf_0"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'thumbnails'::text) AND (( SELECT (auth.uid())::text AS uid) = owner_id)));



  create policy "users can update or delete their own files 16v3daf_1"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'thumbnails'::text));



  create policy "users can update or delete their own files 16v3daf_2"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'thumbnails'::text) AND (( SELECT (auth.uid())::text AS uid) = owner_id)));



