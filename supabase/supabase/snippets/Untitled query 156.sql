create or replace function check_board_permissions(board_id uuid) 
returns boolean
language plpgsql
security definer set search_path = ''
as $$
begin
  return exists (
    SELECT CASE
      WHEN (is_public = true) THEN true
      ELSE (EXISTS (SELECT 1
        FROM (((board_permissions bp
          JOIN permissions p ON ((p.id = bp.permission)))
          JOIN role_permissions rp ON ((rp.permission = p.id)))
          JOIN user_roles ur ON ((ur.role = rp.role)))
        WHERE ((bp.board = board_id) AND (ur.user_id = ( SELECT auth.uid() AS uid)))))
    END
  );
end;
$$;