import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@lib/query-keys';
import {
  addDefaultRoleFunc,
  getAdminSettingsFunc,
  removeDefaultRoleFunc,
  updateAuthSettingsFunc,
  updateGeneralSettingsFunc
} from '@lib/server-functions/admin-settings';
import {
  createPermissionFunc,
  createRoleFunc,
  deletePermissionFunc,
  deleteRoleFunc,
  getRolesAndPermissionsFunc,
  setRolePermissionFunc,
  updateRoleFunc
} from '@lib/server-functions/admin-roles';
import {
  assignUserRoleFunc,
  deleteUserFunc,
  listUsersFunc,
  removeUserRoleFunc
} from '@lib/server-functions/admin-users';
import { inviteUserFunc } from '@lib/server-functions/admin-invites';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AdminSettings } from '@lib/server-functions/admin-settings';
import type { RolesAndPermissions } from '@lib/server-functions/admin-roles';
import type { AdminUser } from '@lib/server-functions/admin-users';

const onError = (error: Error): void => {
  toast.error(error.message);
};

// ---- Settings ----

export const adminSettingsQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.adminSettings, queryFn: () => getAdminSettingsFunc() });

export function useAdminSettings(): UseQueryResult<AdminSettings> {
  return useQuery(adminSettingsQueryOptions());
}

export function useAdminSettingsMutations() {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings });
    queryClient.invalidateQueries({ queryKey: queryKeys.appSettings });
  };

  return {
    updateGeneral: useMutation({
      mutationFn: updateGeneralSettingsFunc,
      onSuccess: (): void => {
        invalidate();
        toast.success('Settings saved');
      },
      onError
    }),
    updateAuth: useMutation({
      mutationFn: updateAuthSettingsFunc,
      onSuccess: (): void => {
        invalidate();
        toast.success('Settings saved');
      },
      onError
    }),
    addDefaultRole: useMutation({ mutationFn: addDefaultRoleFunc, onSuccess: invalidate, onError }),
    removeDefaultRole: useMutation({ mutationFn: removeDefaultRoleFunc, onSuccess: invalidate, onError })
  };
}

// ---- Roles & permissions ----

export const rolesQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.adminRoles, queryFn: () => getRolesAndPermissionsFunc() });

export function useRolesAndPermissions(): UseQueryResult<RolesAndPermissions> {
  return useQuery(rolesQueryOptions());
}

export function useRoleMutations() {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminRoles });
  };

  return {
    createRole: useMutation({
      mutationFn: createRoleFunc,
      onSuccess: (): void => {
        invalidate();
        toast.success('Role created');
      },
      onError
    }),
    updateRole: useMutation({ mutationFn: updateRoleFunc, onSuccess: invalidate, onError }),
    deleteRole: useMutation({ mutationFn: deleteRoleFunc, onSuccess: invalidate, onError }),
    setRolePermission: useMutation({ mutationFn: setRolePermissionFunc, onSuccess: invalidate, onError }),
    createPermission: useMutation({
      mutationFn: createPermissionFunc,
      onSuccess: (): void => {
        invalidate();
        toast.success('Permission created');
      },
      onError
    }),
    deletePermission: useMutation({ mutationFn: deletePermissionFunc, onSuccess: invalidate, onError })
  };
}

// ---- Users & invites ----

export const usersQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.adminUsers, queryFn: () => listUsersFunc() });

export function useAdminUsers(): UseQueryResult<Array<AdminUser>> {
  return useQuery(usersQueryOptions());
}

export function useUserMutations() {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
  };

  return {
    assignRole: useMutation({ mutationFn: assignUserRoleFunc, onSuccess: invalidate, onError }),
    removeRole: useMutation({ mutationFn: removeUserRoleFunc, onSuccess: invalidate, onError }),
    deleteUser: useMutation({
      mutationFn: deleteUserFunc,
      onSuccess: (): void => {
        invalidate();
        toast.success('User deleted');
      },
      onError
    }),
    inviteUser: useMutation({
      mutationFn: inviteUserFunc,
      onSuccess: (): void => {
        toast.success('Invitation sent');
      },
      onError
    })
  };
}
