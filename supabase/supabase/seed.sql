-- Seed data for the RBAC layer, storage buckets and settings singletons.
--
-- Applied automatically by `supabase db reset` (local). `supabase db push`
-- does NOT run this file, so for a self-hosted deployment this is an explicit
-- deploy step after the migrations:
--
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- This file is idempotent and needs no superuser privileges, so it is safe to
-- re-run on every deploy, and safe to paste into the Studio SQL editor or run
-- through the pooler.
--
-- The previous version was a raw pg_dump fragment. Dropped from it:
--   * SET session_replication_role = replica
--       Requires superuser ("permission denied to set parameter"), and only
--       existed to suppress FK checks during a dump restore. It was silently
--       turning the broken user_roles insert below into a dangling row
--       instead of an error.
--   * SET check_function_bodies / row_security = off,
--     set_config('search_path', '', false), RESET ALL
--       Dump restore artifacts with no purpose in a seed.
--   * setval() on auth.refresh_tokens_id_seq, public.general_settings_id_seq
--     and supabase_functions.hooks_id_seq
--       Dump artifacts. `supabase_functions` only exists where the webhooks
--       init script ran, so that line errored on other Postgres hosts.
--   * INSERT INTO user_roles with a hardcoded dev user uuid
--       That auth.users row exists only on the machine the dump came from, so
--       it either failed the foreign key or inserted a dangling row — leaving
--       the deployment with no superuser at all. Replaced by the
--       lookup-based grant at the bottom of this file.
--
-- Note on conflict targets: `permissions.path` and `roles.name` have no unique
-- constraint, so the upserts key on the canonical ids below. Keeping those ids
-- stable matters — role_permissions, workspace_permissions and
-- board_permissions all reference them.

-- Permission paths.
INSERT INTO public.permissions (id, path) VALUES
    ('6182bc1c-ec8a-474c-aee1-bbda7c6f8ba8', 'auth:superuser'),
    ('dded4dc3-3d44-4dc4-8104-f595e39f6fd7', 'role:manage'),
    ('faa9c9bc-6e8b-44aa-bfc3-49426c42857e', 'user:manage'),
    ('10de7750-eacb-4fe9-ba64-7eadf7812214', 'system:settings'),
    ('1aa11646-2783-4409-90c2-d797f0717ed6', 'workspace:create'),
    ('a8ea5855-7eba-4d37-ac5e-e70f4181da09', 'workspace:update'),
    ('69dfa7ee-74ed-470d-b4b7-43b85aa95163', 'workspace:delete'),
    ('ed99affd-9686-416a-8d8d-a01ed50496ee', 'workspace:manage'),
    ('b95eef59-1d75-4346-9f69-b328b2633ad0', 'board:create'),
    ('8be8cb11-ca0f-40c2-9430-e9e15b36ee10', 'board:update'),
    ('66ab20b1-974a-4954-b200-fe17271b5bd3', 'board:delete'),
    ('45174565-2013-453b-9f7e-cbd88b5677f6', 'board:manage')
ON CONFLICT (id) DO UPDATE SET path = EXCLUDED.path;

INSERT INTO public.roles (id, name) VALUES
    ('dbeb55a3-4f17-48f9-b099-d4818fb4d528', 'superuser'),
    ('68bfba99-62c5-4cd5-8ee3-dd12a35c9d73', 'user'),
    ('1b2a10d8-f0d6-4a1a-8f44-6b0b20602533', 'admin')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Resolved by name/path rather than raw id pairs, so a database whose roles
-- were created by hand (different ids) still gets the right grants.
-- `admin` intentionally holds only the `*:manage` paths — those supersede the
-- per-action create/update/delete grants that the `user` role carries.
INSERT INTO public.role_permissions (role, permission)
SELECT r.id, p.id
FROM (VALUES
    ('superuser', 'auth:superuser'),
    ('admin',     'board:manage'),
    ('admin',     'role:manage'),
    ('admin',     'workspace:manage'),
    ('admin',     'user:manage'),
    ('admin',     'system:settings'),
    ('user',      'workspace:create'),
    ('user',      'workspace:update'),
    ('user',      'workspace:delete'),
    ('user',      'board:create'),
    ('user',      'board:update'),
    ('user',      'board:delete')
) AS grants(role_name, permission_path)
JOIN public.roles r ON r.name = grants.role_name
JOIN public.permissions p ON p.path = grants.permission_path
ON CONFLICT (role, permission) DO NOTHING;

-- Every new user gets the `user` role: handle_new_user applies `global` rows
-- regardless of how the account was created. Without a default role a new
-- signup has zero permissions and cannot create anything.
INSERT INTO public.default_roles (role, type)
SELECT r.id, 'global'::public.default_role_type
FROM public.roles r
WHERE r.name = 'user'
ON CONFLICT DO NOTHING;

-- Storage buckets. The attachment buckets are private — files are reached only
-- through server-issued signed URLs. `thumbnails` is public because avatars are
-- displayed by plain public URL.
--
-- Only (id, name, public) are set: the timestamp / `type` /
-- `avif_autodetection` columns the old dump listed explicitly vary across
-- storage-api versions, and relying on column defaults keeps this portable.
-- DO UPDATE on `public` so the flag is corrected if a bucket already exists
-- with the wrong visibility.
INSERT INTO storage.buckets (id, name, public) VALUES
    ('thumbnails', 'thumbnails', true),
    ('card_attachments', 'card_attachments', false),
    ('comment_attachments', 'comment_attachments', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Settings singletons. Both tables CHECK (id = 1); the app reads them with
-- .single(), which fails with "Cannot coerce the result to a single JSON
-- object" when the row is missing.
INSERT INTO public.general_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.auth_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Promote a user to superuser by email, if that user exists.
--
-- Driven by a GUC so no personal address is baked into the repo, and written
-- as a lookup so it is a no-op (rather than a foreign-key error) when the
-- account has not signed up yet. Sign up through the app first, then:
--
--   psql "$DATABASE_URL" \
--     -c "SET seed.superuser_email = 'you@example.com'" \
--     -f supabase/seed.sql
--
-- To apply it on every `supabase db reset`, add to supabase/config.toml:
--   [db.settings]
--   seed.superuser_email = "you@example.com"
--
-- Or promote someone directly at any time, without this file:
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT u.id, r.id FROM auth.users u, public.roles r
--   WHERE u.email = 'you@example.com' AND r.name = 'superuser'
--   ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.id
FROM auth.users u
CROSS JOIN public.roles r
WHERE u.email = NULLIF(current_setting('seed.superuser_email', true), '')
  AND r.name = 'superuser'
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF NULLIF(current_setting('seed.superuser_email', true), '') IS NULL THEN
    RAISE NOTICE 'seed: seed.superuser_email not set, no superuser granted. See the comment at the bottom of seed.sql.';
  END IF;
END
$$;
