create or replace function check_permissions(required_permissions variadic varchar[]) 
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
  return exists (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = (select auth.uid())
      AND (p.path = any(required_permissions) OR p.path = 'auth:superuser')
  );
end;
$$;