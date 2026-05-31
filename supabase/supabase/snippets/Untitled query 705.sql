CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_workspace_permissions_workspace ON public.workspace_permissions(workspace);
CREATE INDEX IF NOT EXISTS idx_board_permissions_board ON public.board_permissions(board);
CREATE INDEX IF NOT EXISTS idx_cards_list ON public.cards(list);
CREATE INDEX IF NOT EXISTS idx_lists_board ON public.lists(board);