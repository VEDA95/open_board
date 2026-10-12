-- Tag every broadcast with the client that caused it, so that client can skip
-- its own echo while other listeners still react.
--
-- Previously each mutation refreshed the board twice for the acting user: once
-- from the mutation's own invalidation, then again when its broadcast arrived
-- back over the websocket a round trip later (too late to dedupe against the
-- first refetch).
--
-- The id is minted per browser tab, sent on each server-function call as the
-- x-client-id header, and relayed to PostgREST by getSupabaseServerClient.
-- PostgREST exposes request headers to SQL as the `request.headers` setting,
-- which is where this reads it from. It is deliberately per-tab and not
-- per-user: two tabs of the same user are two clients and must still update
-- each other.
--
-- realtime.broadcast_changes() builds a fixed payload with no room for an extra
-- key, so this calls realtime.send() directly with the same shape plus
-- `originator`. Keep the other keys identical — the client hooks read
-- payload.table / .record / .old_record.
CREATE OR REPLACE FUNCTION public.broadcast_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  rec record;
  board_id uuid;
  topic text;
  originator text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    rec := OLD;
  ELSE
    rec := NEW;
  END IF;

  IF TG_TABLE_NAME = 'cards' THEN
    SELECT l.board INTO board_id FROM public.lists l WHERE l.id = rec.list;
    topic := 'board:' || board_id;
  ELSIF TG_TABLE_NAME IN ('lists', 'labels') THEN
    topic := 'board:' || rec.board;
  ELSIF TG_TABLE_NAME IN ('check_list_items', 'comments', 'card_labels') THEN
    SELECT l.board INTO board_id
    FROM public.cards c
    JOIN public.lists l ON l.id = c.list
    WHERE c.id = rec.card;
    topic := 'board:' || board_id;
  ELSIF TG_TABLE_NAME = 'boards' THEN
    topic := 'workspace:' || rec.workspace;
  ELSIF TG_TABLE_NAME = 'workspaces' THEN
    topic := 'workspace:' || rec.id;
  END IF;

  -- NULL whenever the write did not come through PostgREST (direct SQL, a
  -- trigger, the SQL editor). Then no client matches and all of them refresh.
  BEGIN
    originator := current_setting('request.headers', true)::json ->> 'x-client-id';
  EXCEPTION WHEN OTHERS THEN
    originator := NULL;
  END;

  IF topic IS NOT NULL AND topic NOT LIKE '%:' THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'old_record', OLD,
        'record', NEW,
        'operation', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'originator', originator
      ),
      'db_change',
      topic,
      true
    );
  END IF;

  RETURN NULL;
END;
$function$
;
