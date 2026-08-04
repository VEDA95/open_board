-- Object paths + metadata for every comment attachment on a card, gated by
-- check_card_access (via the parent comment's card). Mirrors
-- get_card_attachments; the storage schema is not exposed to PostgREST, so the
-- app resolves paths here and issues signed URLs through the Storage API.
CREATE OR REPLACE FUNCTION public.get_comment_attachments(card_id uuid)
 RETURNS TABLE(comment uuid, file uuid, object_name text, size bigint, mime_type text, uploaded_at timestamptz)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.check_card_access(card_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      cma.comment,
      o.id,
      o.name,
      (o.metadata ->> 'size')::bigint,
      o.metadata ->> 'mimetype',
      o.created_at
    FROM public.comment_attachments cma
    JOIN public.comments c ON c.id = cma.comment
    JOIN storage.objects o ON o.id = cma.file
    WHERE c.card = card_id
    ORDER BY o.created_at ASC;
END;
$function$
;
