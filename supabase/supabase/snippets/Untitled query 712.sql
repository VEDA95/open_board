CREATE OR REPLACE FUNCTION check_board_permissions(board_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER STABLE SET search_path = ''
AS $$
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
$$;