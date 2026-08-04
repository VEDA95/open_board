-- Realtime: broadcast row changes to hierarchical private topics so connected
-- clients can invalidate their queries. board:{id} for everything under a board
-- (lists, cards, labels, card_labels, checklist items, comments); workspace:{id}
-- for boards and the workspace row itself. Receiving is authorized by the RLS
-- policy on realtime.messages below (evaluated with the subscriber's JWT).
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

  IF topic IS NOT NULL AND topic NOT LIKE '%:' THEN
    PERFORM realtime.broadcast_changes(topic, 'db_change', TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD);
  END IF;

  RETURN NULL;
END;
$function$
;

CREATE TRIGGER broadcast_cards AFTER INSERT OR UPDATE OR DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();
CREATE TRIGGER broadcast_lists AFTER INSERT OR UPDATE OR DELETE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();
CREATE TRIGGER broadcast_labels AFTER INSERT OR UPDATE OR DELETE ON public.labels
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();
CREATE TRIGGER broadcast_card_labels AFTER INSERT OR UPDATE OR DELETE ON public.card_labels
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();
CREATE TRIGGER broadcast_check_list_items AFTER INSERT OR UPDATE OR DELETE ON public.check_list_items
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();
CREATE TRIGGER broadcast_comments AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();
CREATE TRIGGER broadcast_boards AFTER INSERT OR UPDATE OR DELETE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();
CREATE TRIGGER broadcast_workspaces AFTER INSERT OR UPDATE OR DELETE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_change();

-- Authorize receiving broadcasts: a client may read messages on a board:/workspace:
-- topic only if they have access to that board/workspace. realtime.topic() returns
-- the subscribed channel's topic for the current request.
CREATE POLICY "receive board and workspace broadcasts"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    extension = 'broadcast'
    AND (
      (realtime.topic() LIKE 'board:%'
        AND public.check_board_permissions(NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid))
      OR (realtime.topic() LIKE 'workspace:%'
        AND public.check_workspace_permissions(NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid))
    )
  );
