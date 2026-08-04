-- cards_select previously used check_card_access(id), which re-queries the
-- cards table for the row being checked. On INSERT ... RETURNING (every
-- createCardFunc call uses .select()) that STABLE SECURITY DEFINER re-query
-- does not see the just-inserted row, so board_id resolves NULL and the insert
-- is rejected. Check board access via the row's own `list` column instead —
-- no self-requery, works for both plain SELECT and INSERT ... RETURNING.
-- Same class of fix as workspaces_select / boards_select in the RBAC repair.
drop policy if exists "cards_select" on "public"."cards";

  create policy "cards_select"
  on "public"."cards"
  as permissive
  for select
  to authenticated
using (
  EXISTS (
    SELECT 1
    FROM public.lists l
    WHERE l.id = cards.list
      AND public.check_board_permissions(l.board)
  )
);
