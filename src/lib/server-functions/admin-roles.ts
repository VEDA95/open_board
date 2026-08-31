import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requirePermissions, requireUser } from '@lib/utils/permissions';
import {
  createPermissionValidator,
  createRoleValidator,
  permissionIdValidator,
  roleIdValidator,
  setRolePermissionValidator,
  updateRoleValidator
} from '@lib/validators/admin';
import type { Tables } from '@lib/types/supabase';

export type Role = Tables<'roles'>;
export type Permission = Tables<'permissions'>;
export type RoleWithPermissions = Role & { permissionIds: Array<string> };
export type RolesAndPermissions = {
  roles: Array<RoleWithPermissions>;
  permissions: Array<Permission>;
};

export const getRolesAndPermissionsFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<RolesAndPermissions> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requirePermissions(supabase, 'role:manage');

    const [rolesResult, permissionsResult, rolePermsResult] = await Promise.all([
      supabase.from('roles').select().order('name', { ascending: true }),
      supabase.from('permissions').select().order('path', { ascending: true }),
      supabase.from('role_permissions').select()
    ]);

    if (rolesResult.error != null) {
      setResponseStatus(400);
      throw rolesResult.error;
    }

    const permsByRole = new Map<string, Array<string>>();
    for (const rp of rolePermsResult.data ?? []) {
      const existing = permsByRole.get(rp.role) ?? [];
      existing.push(rp.permission);
      permsByRole.set(rp.role, existing);
    }

    return {
      roles: rolesResult.data.map((role): RoleWithPermissions => ({
        ...role,
        permissionIds: permsByRole.get(role.id) ?? []
      })),
      permissions: permissionsResult.data ?? []
    };
  });

export const createRoleFunc = createServerFn({ method: 'POST' })
  .inputValidator(createRoleValidator)
  .handler(async ({ data }): Promise<Role> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: role, error } = await supabase
      .from('roles')
      .insert({ name: data.name })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return role;
  });

export const updateRoleFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateRoleValidator)
  .handler(async ({ data }): Promise<Role> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: roles, error } = await supabase
      .from('roles')
      .update({ name: data.name })
      .eq('id', data.roleId)
      .select();

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (roles.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to rename this role');
    }

    return roles[0];
  });

export const deleteRoleFunc = createServerFn({ method: 'POST' })
  .inputValidator(roleIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('roles')
      .delete()
      .eq('id', data.roleId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this role');
    }
  });

export const createPermissionFunc = createServerFn({ method: 'POST' })
  .inputValidator(createPermissionValidator)
  .handler(async ({ data }): Promise<Permission> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: permission, error } = await supabase
      .from('permissions')
      .insert({ path: data.path })
      .select()
      .single();

    if (error != null) {
      setResponseStatus(403);
      throw error;
    }

    return permission;
  });

export const deletePermissionFunc = createServerFn({ method: 'POST' })
  .inputValidator(permissionIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', data.permissionId)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to delete this permission');
    }
  });

export const setRolePermissionFunc = createServerFn({ method: 'POST' })
  .inputValidator(setRolePermissionValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    if (data.enabled) {
      const { error } = await supabase
        .from('role_permissions')
        .insert({ role: data.roleId, permission: data.permissionId });

      // Ignore duplicate (already granted); surface everything else.
      if (error != null && error.code !== '23505') {
        setResponseStatus(403);
        throw error;
      }

      return;
    }

    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role', data.roleId)
      .eq('permission', data.permissionId);

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });
