import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { getSupabaseAdminClient } from '@lib/utils/supabase-admin';
import { requirePermissions, requireUser } from '@lib/utils/permissions';
import { userIdValidator, userRoleValidator } from '@lib/validators/admin';

export type AdminUserRole = { id: string; name: string };
export type AdminUser = {
  id: string;
  email: string | null;
  createdAt: string;
  invitedAt: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: Array<AdminUserRole>;
};

export const listUsersFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<Array<AdminUser>> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requirePermissions(supabase, 'user:manage');

    // auth.users is not reachable through PostgREST — use the admin API.
    const admin = getSupabaseAdminClient();
    const { data: usersData, error } = await admin.auth.admin.listUsers({ perPage: 200 });

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    const userIds = usersData.users.map((user): string => user.id);

    const [profilesResult, rolesResult] = await Promise.all([
      supabase.from('profiles').select().in('user_id', userIds),
      supabase.from('user_roles').select('user_id, roles(id, name)').in('user_id', userIds)
    ]);

    const profileByUser = new Map(
      (profilesResult.data ?? []).map((profile) => [profile.user_id, profile])
    );
    const rolesByUser = new Map<string, Array<AdminUserRole>>();
    for (const row of rolesResult.data ?? []) {
      const existing = rolesByUser.get(row.user_id) ?? [];
      existing.push({ id: row.roles.id, name: row.roles.name });
      rolesByUser.set(row.user_id, existing);
    }

    return usersData.users.map((user): AdminUser => {
      const profile = profileByUser.get(user.id);

      return {
        id: user.id,
        email: user.email ?? null,
        createdAt: user.created_at,
        invitedAt: user.invited_at ?? null,
        username: profile?.username ?? null,
        firstName: profile?.first_name ?? null,
        lastName: profile?.last_name ?? null,
        roles: rolesByUser.get(user.id) ?? []
      };
    });
  });

export const assignUserRoleFunc = createServerFn({ method: 'POST' })
  .inputValidator(userRoleValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: data.userId, role: data.roleId });

    // Ignore if the user already has the role.
    if (error != null && error.code !== '23505') {
      setResponseStatus(403);
      throw error;
    }
  });

export const removeUserRoleFunc = createServerFn({ method: 'POST' })
  .inputValidator(userRoleValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', data.userId)
      .eq('role', data.roleId);

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const deleteUserFunc = createServerFn({ method: 'POST' })
  .inputValidator(userIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    const user = await requireUser(supabase);
    await requirePermissions(supabase, 'user:manage');

    if (user.id === data.userId) {
      setResponseStatus(400);
      throw new Error('You cannot delete your own account here');
    }

    // Deleting the auth user cascades to profiles / user_roles.
    const { error } = await getSupabaseAdminClient().auth.admin.deleteUser(data.userId);

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });
