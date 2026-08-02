import { setResponseStatus } from '@tanstack/react-start/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@lib/types/supabase';

// Explicit permission asserts for friendly 401/403s before hitting RLS.
// RLS remains the backstop — these exist so callers get a clear error
// instead of an opaque row-level-security violation.

export async function requireUser(supabase: SupabaseClient<Database>): Promise<User> {
  const { data: { user } } = await supabase.auth.getUser();

  if (user == null) {
    setResponseStatus(401);
    throw new Error('Not authenticated');
  }

  return user;
}

export async function requirePermissions(
  supabase: SupabaseClient<Database>,
  ...paths: Array<string>
): Promise<void> {
  const { data } = await supabase.rpc('check_permissions', {
    required_permissions: paths
  });

  if (data !== true) {
    setResponseStatus(403);
    throw new Error('You do not have permission to perform this action');
  }
}

export async function requireWorkspaceAccess(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<void> {
  const { data } = await supabase.rpc('check_workspace_permissions', {
    workspace_id: workspaceId
  });

  if (data !== true) {
    setResponseStatus(403);
    throw new Error('You do not have access to this workspace');
  }
}

export async function requireBoardAccess(
  supabase: SupabaseClient<Database>,
  boardId: string
): Promise<void> {
  const { data } = await supabase.rpc('check_board_permissions', {
    board_id: boardId
  });

  if (data !== true) {
    setResponseStatus(403);
    throw new Error('You do not have access to this board');
  }
}
