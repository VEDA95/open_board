-- The storage schema is not exposed to PostgREST, so the app can't join
-- card_attachments to storage.objects directly. This SECURITY DEFINER function
-- returns the object path + metadata for a card's attachments, gated by
-- check_card_access so callers only see attachments on cards they can access.
-- Signed URLs / deletes are then issued through the Storage API by path.
CREATE OR REPLACE FUNCTION public.get_card_attachments(card_id uuid)
 RETURNS TABLE(file uuid, object_name text, size bigint, mime_type text, uploaded_at timestamptz)
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
      o.id,
      o.name,
      (o.metadata ->> 'size')::bigint,
      o.metadata ->> 'mimetype',
      o.created_at
    FROM public.card_attachments ca
    JOIN storage.objects o ON o.id = ca.file
    WHERE ca.card = card_id
    ORDER BY o.created_at DESC;
END;
$function$
;
