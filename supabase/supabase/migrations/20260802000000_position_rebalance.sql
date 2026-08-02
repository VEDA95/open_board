-- Renumber fractional positions when midpoint insertion has shrunk a gap
-- below float precision. SECURITY INVOKER on purpose: the updates run as the
-- calling user, so RLS update policies still apply.
CREATE OR REPLACE FUNCTION public.rebalance_card_positions(target_list uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY INVOKER
 SET search_path TO ''
AS $function$
  WITH ranked AS (
    SELECT id, (row_number() OVER (ORDER BY position ASC NULLS LAST, created_at ASC)) * 1024 AS new_position
    FROM public.cards
    WHERE list = target_list AND is_active = true
  )
  UPDATE public.cards c
  SET position = r.new_position
  FROM ranked r
  WHERE c.id = r.id;
$function$
;

CREATE OR REPLACE FUNCTION public.rebalance_list_positions(target_board uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY INVOKER
 SET search_path TO ''
AS $function$
  WITH ranked AS (
    SELECT id, (row_number() OVER (ORDER BY position ASC NULLS LAST, created_at ASC)) * 1024 AS new_position
    FROM public.lists
    WHERE board = target_board
  )
  UPDATE public.lists l
  SET position = r.new_position
  FROM ranked r
  WHERE l.id = r.id;
$function$
;
