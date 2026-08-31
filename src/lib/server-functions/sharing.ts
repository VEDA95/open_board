import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { getSupabaseAdminClient } from '@lib/utils/supabase-admin';
import { requirePermissions, requireUser } from '@lib/utils/permissions';
import {
  boardAccessValidator,
  boardIdShareValidator,
  boardShareValidator,
  workspaceAccessValidator,
  workspaceIdShareValidator,
  workspaceShareValidator
} from '@lib/validators/sharing';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@lib/types/supabase';

type AdminClient = SupabaseClient<Database>;
export type Profile = Tables<'profiles'>;
export type Member = {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
};
export type AccessPermission = { id: string; path: string };
export type ResourceAccess = {
  attached: Array<AccessPermission>;
  available: Array<AccessPermission>;
};

// The per-resource member permissions provisioned by user-sharing end in
// ':member'; they're managed through the People list, not this permission
// picker, so they're hidden here.
const isManageablePermission = (path: string): boolean => !path.endsWith(':member');

// Provisioning is idempotent: a shared resource gets one hidden permission
// (linked to the resource via workspace_/board_permissions), one companion
// role (linked to that permission), and members are user_roles on that role.
// This is exactly what check_workspace_permissions / check_board_permissions
// evaluate. All provisioning runs with the service-role client because the
// underlying tables require global admin permissions via RLS — the caller's
// authority over the resource is asserted separately, before we get here.

async function ensurePermission(admin: AdminClient, path: string): Promise<string> {
  const { data: existing } = await admin
    .from('permissions')
    .select('id')
    .eq('path', path)
    .maybeSingle();

  if (existing != null) return existing.id;

  const { data: created, error } = await admin
    .from('permissions')
    .insert({ path })
    .select('id')
    .single();

  if (error != null) throw error;

  return created.id;
}

async function ensureRoleForPermission(admin: AdminClient, permissionId: string, roleName: string): Promise<string> {
  const { data: link } = await admin
    .from('role_permissions')
    .select('role')
    .eq('permission', permissionId)
    .maybeSingle();

  if (link != null) return link.role;

  const { data: role, error } = await admin
    .from('roles')
    .insert({ name: roleName })
    .select('id')
    .single();

  if (error != null) throw error;

  await admin.from('role_permissions').insert({ role: role.id, permission: permissionId });

  return role.id;
}

async function ensureWorkspaceMemberRole(admin: AdminClient, workspaceId: string, workspaceName: string): Promise<string> {
  const permissionId = await ensurePermission(admin, `workspace:${workspaceId}:member`);
  const { error } = await admin
    .from('workspace_permissions')
    .insert({ workspace: workspaceId, permission: permissionId });

  if (error != null && error.code !== '23505') throw error;

  return ensureRoleForPermission(admin, permissionId, `Members of ${workspaceName}`);
}

async function ensureBoardMemberRole(admin: AdminClient, boardId: string, boardName: string): Promise<string> {
  const permissionId = await ensurePermission(admin, `board:${boardId}:member`);
  const { error } = await admin
    .from('board_permissions')
    .insert({ board: boardId, permission: permissionId });

  if (error != null && error.code !== '23505') throw error;

  return ensureRoleForPermission(admin, permissionId, `Members of ${boardName}`);
}

// The member role already provisioned for a resource, or null if never shared.
async function findMemberRole(admin: AdminClient, path: string): Promise<string | null> {
  const { data: permission } = await admin
    .from('permissions')
    .select('id')
    .eq('path', path)
    .maybeSingle();

  if (permission == null) return null;

  const { data: link } = await admin
    .from('role_permissions')
    .select('role')
    .eq('permission', permission.id)
    .maybeSingle();

  return link?.role ?? null;
}

async function grantRole(admin: AdminClient, userId: string, roleId: string): Promise<void> {
  const { error } = await admin.from('user_roles').insert({ user_id: userId, role: roleId });

  if (error != null && error.code !== '23505') throw error;
}

async function membersOfRole(admin: AdminClient, roleId: string | null): Promise<Array<Member>> {
  if (roleId == null) return [];

  const { data: userRoles } = await admin.from('user_roles').select('user_id').eq('role', roleId);
  const userIds = (userRoles ?? []).map((row): string => row.user_id);

  if (userIds.length === 0) return [];

  const { data: profiles } = await admin.from('profiles').select().in('user_id', userIds);

  return userIds.map((userId): Member => {
    const profile = (profiles ?? []).find((p): boolean => p.user_id === userId);

    return {
      userId,
      username: profile?.username ?? null,
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null
    };
  });
}

// ---- Authority checks (owner or *:manage) ----

async function requireWorkspaceManage(
  supabase: SupabaseClient<Database>,
  admin: AdminClient,
  workspaceId: string
): Promise<{ name: string }> {
  const user = await requireUser(supabase);
  const { data: workspace, error } = await admin
    .from('workspaces')
    .select('user_id, name')
    .eq('id', workspaceId)
    .single();

  if (error != null) {
    setResponseStatus(404);
    throw error;
  }

  if (workspace.user_id !== user.id) {
    await requirePermissions(supabase, 'workspace:manage');
  }

  return { name: workspace.name };
}

async function requireBoardManage(
  supabase: SupabaseClient<Database>,
  admin: AdminClient,
  boardId: string
): Promise<{ name: string; workspace: string }> {
  const user = await requireUser(supabase);
  const { data: board, error } = await admin
    .from('boards')
    .select('user_id, name, workspace')
    .eq('id', boardId)
    .single();

  if (error != null) {
    setResponseStatus(404);
    throw error;
  }

  if (board.user_id !== user.id) {
    await requirePermissions(supabase, 'board:manage');
  }

  return { name: board.name, workspace: board.workspace };
}

// ---- Workspace sharing ----

export const getWorkspaceMembersFunc = createServerFn({ method: 'GET' })
  .inputValidator(workspaceIdShareValidator)
  .handler(async ({ data }): Promise<Array<Member>> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireWorkspaceManage(supabase, admin, data.workspaceId);

    const roleId = await findMemberRole(admin, `workspace:${data.workspaceId}:member`);

    return membersOfRole(admin, roleId);
  });

export const shareWorkspaceFunc = createServerFn({ method: 'POST' })
  .inputValidator(workspaceShareValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    const { name } = await requireWorkspaceManage(supabase, admin, data.workspaceId);

    const roleId = await ensureWorkspaceMemberRole(admin, data.workspaceId, name);
    await grantRole(admin, data.userId, roleId);
  });

export const unshareWorkspaceFunc = createServerFn({ method: 'POST' })
  .inputValidator(workspaceShareValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireWorkspaceManage(supabase, admin, data.workspaceId);

    // Removing workspace membership revokes downstream board access too — every
    // board check is gated by check_workspace_permissions.
    const roleId = await findMemberRole(admin, `workspace:${data.workspaceId}:member`);

    if (roleId == null) return;

    await admin.from('user_roles').delete().eq('user_id', data.userId).eq('role', roleId);
  });

// ---- Board sharing (member also becomes a workspace member — board access is
// gated by workspace access) ----

export const getBoardMembersFunc = createServerFn({ method: 'GET' })
  .inputValidator(boardIdShareValidator)
  .handler(async ({ data }): Promise<Array<Member>> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireBoardManage(supabase, admin, data.boardId);

    const roleId = await findMemberRole(admin, `board:${data.boardId}:member`);

    return membersOfRole(admin, roleId);
  });

export const shareBoardFunc = createServerFn({ method: 'POST' })
  .inputValidator(boardShareValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    const { name, workspace } = await requireBoardManage(supabase, admin, data.boardId);

    const { data: ws } = await admin.from('workspaces').select('name').eq('id', workspace).single();

    // Grant workspace access first (the gate), then the specific board.
    const wsRole = await ensureWorkspaceMemberRole(admin, workspace, ws?.name ?? 'workspace');
    await grantRole(admin, data.userId, wsRole);

    const boardRole = await ensureBoardMemberRole(admin, data.boardId, name);
    await grantRole(admin, data.userId, boardRole);
  });

export const unshareBoardFunc = createServerFn({ method: 'POST' })
  .inputValidator(boardShareValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireBoardManage(supabase, admin, data.boardId);

    // Only revoke this board; the user keeps workspace membership (and thus
    // access to public boards) until removed from the workspace.
    const roleId = await findMemberRole(admin, `board:${data.boardId}:member`);

    if (roleId == null) return;

    await admin.from('user_roles').delete().eq('user_id', data.userId).eq('role', roleId);
  });

// ---- Access by permission: attach/detach permissions on a private resource so
// anyone whose roles grant one of them can access it (an OR with direct sharing). ----

async function resourceAccess(
  admin: AdminClient,
  attachedPaths: Array<AccessPermission>
): Promise<ResourceAccess> {
  const attached = attachedPaths.filter((permission): boolean => isManageablePermission(permission.path));
  const attachedIds = new Set(attached.map((permission): string => permission.id));

  const { data: allPermissions } = await admin.from('permissions').select('id, path');
  const available = (allPermissions ?? [])
    .filter((permission): boolean => isManageablePermission(permission.path) && !attachedIds.has(permission.id))
    .sort((a, b): number => a.path.localeCompare(b.path));

  return { attached, available };
}

export const getWorkspaceAccessFunc = createServerFn({ method: 'GET' })
  .inputValidator(workspaceIdShareValidator)
  .handler(async ({ data }): Promise<ResourceAccess> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireWorkspaceManage(supabase, admin, data.workspaceId);

    const { data: rows } = await admin
      .from('workspace_permissions')
      .select('permissions(id, path)')
      .eq('workspace', data.workspaceId);

    const attached = (rows ?? [])
      .map((row): AccessPermission | null => row.permissions)
      .filter((permission): permission is AccessPermission => permission != null);

    return resourceAccess(admin, attached);
  });

export const addWorkspaceAccessFunc = createServerFn({ method: 'POST' })
  .inputValidator(workspaceAccessValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireWorkspaceManage(supabase, admin, data.workspaceId);

    const { error } = await admin
      .from('workspace_permissions')
      .insert({ workspace: data.workspaceId, permission: data.permissionId });

    if (error != null && error.code !== '23505') {
      setResponseStatus(400);
      throw error;
    }
  });

export const removeWorkspaceAccessFunc = createServerFn({ method: 'POST' })
  .inputValidator(workspaceAccessValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireWorkspaceManage(supabase, admin, data.workspaceId);

    await admin
      .from('workspace_permissions')
      .delete()
      .eq('workspace', data.workspaceId)
      .eq('permission', data.permissionId);
  });

export const getBoardAccessFunc = createServerFn({ method: 'GET' })
  .inputValidator(boardIdShareValidator)
  .handler(async ({ data }): Promise<ResourceAccess> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireBoardManage(supabase, admin, data.boardId);

    const { data: rows } = await admin
      .from('board_permissions')
      .select('permissions(id, path)')
      .eq('board', data.boardId);

    const attached = (rows ?? [])
      .map((row): AccessPermission | null => row.permissions)
      .filter((permission): permission is AccessPermission => permission != null);

    return resourceAccess(admin, attached);
  });

export const addBoardAccessFunc = createServerFn({ method: 'POST' })
  .inputValidator(boardAccessValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireBoardManage(supabase, admin, data.boardId);

    const { error } = await admin
      .from('board_permissions')
      .insert({ board: data.boardId, permission: data.permissionId });

    if (error != null && error.code !== '23505') {
      setResponseStatus(400);
      throw error;
    }
  });

export const removeBoardAccessFunc = createServerFn({ method: 'POST' })
  .inputValidator(boardAccessValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    await requireBoardManage(supabase, admin, data.boardId);

    await admin
      .from('board_permissions')
      .delete()
      .eq('board', data.boardId)
      .eq('permission', data.permissionId);
  });
