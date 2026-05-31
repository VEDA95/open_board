CREATE OR REPLACE FUNCTION check_workspace_permissions(workspace_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER STABLE SET search_path = ''
AS $$
DECLARE
  workspace_is_public boolean;
BEGIN
  SELECT is_public INTO workspace_is_public
  FROM public.workspaces
  WHERE id = workspace_id;

  IF workspace_is_public THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_permissions wp
    WHERE wp.workspace = workspace_id
      AND wp.permission IN (SELECT get_user_permission_ids())
  );
END;
$$;