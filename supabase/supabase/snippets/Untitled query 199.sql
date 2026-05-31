CREATE OR REPLACE FUNCTION check_card_access(card_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER STABLE SET search_path = ''
AS $$
DECLARE
  board_id uuid;
BEGIN
  SELECT l.board INTO board_id
  FROM public.cards c
  JOIN public.lists l ON l.id = c.list
  WHERE c.id = card_id;

  RETURN check_board_permissions(board_id);
END;
$$;