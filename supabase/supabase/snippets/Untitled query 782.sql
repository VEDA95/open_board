CREATE OR REPLACE FUNCTION get_user_permission_ids()
RETURNS SETOF uuid
LANGUAGE plpgsql
SECURITY DEFINER STABLE SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
    SELECT DISTINCT rp.permission
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = (SELECT auth.uid());
END;
$$;