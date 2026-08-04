-- Resolve thumbnail object ids to their storage paths so the app can build
-- public avatar URLs. profiles.thumbnail is a storage.objects id, but the
-- storage schema isn't exposed to PostgREST. Batchable (takes an array) so a
-- list of users' avatars can be resolved in one call. Thumbnails live in a
-- public bucket, so no per-row access gating is needed.
CREATE OR REPLACE FUNCTION public.get_thumbnail_paths(object_ids uuid[])
 RETURNS TABLE(id uuid, object_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT o.id, o.name
  FROM storage.objects o
  WHERE o.id = ANY(object_ids) AND o.bucket_id = 'thumbnails';
$function$
;
