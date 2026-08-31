import { createServerFn } from '@tanstack/react-start';
import { setResponseStatus } from '@tanstack/react-start/server';
import { getSupabaseServerClient } from '@lib/utils/supabase';
import { requirePermissions, requireUser } from '@lib/utils/permissions';
import {
  addDefaultRoleValidator,
  defaultRoleIdValidator,
  updateAuthSettingsValidator,
  updateGeneralSettingsValidator
} from '@lib/validators/admin';
import type { Tables } from '@lib/types/supabase';

export type GeneralSettings = Tables<'general_settings'>;
export type AuthSettings = Tables<'auth_settings'>;
export type Role = Tables<'roles'>;
export type DefaultRoleRow = Tables<'default_roles'> & { roles: Pick<Role, 'id' | 'name'> | null };
export type AdminSettings = {
  general: GeneralSettings;
  auth: AuthSettings;
  defaultRoles: Array<DefaultRoleRow>;
  roles: Array<Role>;
};

export const getAdminSettingsFunc = createServerFn({ method: 'GET' })
  .handler(async (): Promise<AdminSettings> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requirePermissions(supabase, 'system:settings');

    const [generalResult, authResult, defaultRolesResult, rolesResult] = await Promise.all([
      supabase.from('general_settings').select().eq('id', 1).single(),
      supabase.from('auth_settings').select().eq('id', 1).single(),
      supabase.from('default_roles').select('*, roles(id, name)'),
      supabase.from('roles').select().order('name', { ascending: true })
    ]);

    if (generalResult.error != null || authResult.error != null) {
      setResponseStatus(400);
      throw generalResult.error ?? authResult.error;
    }

    return {
      general: generalResult.data,
      auth: authResult.data,
      defaultRoles: defaultRolesResult.data ?? [],
      roles: rolesResult.data ?? []
    };
  });

export const updateGeneralSettingsFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateGeneralSettingsValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requirePermissions(supabase, 'system:settings');

    const { error } = await supabase
      .from('general_settings')
      .update({
        app_name: data.appName,
        app_description: data.appDescription,
        show_announcement_banner: data.showAnnouncementBanner,
        announcement_message: data.announcementMessage,
        announcement_type: data.announcementType,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const updateAuthSettingsFunc = createServerFn({ method: 'POST' })
  .inputValidator(updateAuthSettingsValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);
    await requirePermissions(supabase, 'system:settings');

    const { error } = await supabase
      .from('auth_settings')
      .update({ enable_registration: data.enableRegistration, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error == null) return;

    setResponseStatus(400);
    throw error;
  });

export const addDefaultRoleFunc = createServerFn({ method: 'POST' })
  .inputValidator(addDefaultRoleValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { error } = await supabase
      .from('default_roles')
      .insert({
        role: data.role,
        type: data.type,
        provider: data.type === 'sso_provider' ? data.provider : null
      });

    if (error == null) return;

    setResponseStatus(error.code === '23505' ? 409 : 403);
    throw new Error(error.code === '23505' ? 'That role is already a default for this scope' : error.message);
  });

export const removeDefaultRoleFunc = createServerFn({ method: 'POST' })
  .inputValidator(defaultRoleIdValidator)
  .handler(async ({ data }): Promise<void> => {
    const supabase = getSupabaseServerClient();
    await requireUser(supabase);

    const { data: deleted, error } = await supabase
      .from('default_roles')
      .delete()
      .eq('id', data.id)
      .select('id');

    if (error != null) {
      setResponseStatus(400);
      throw error;
    }

    if (deleted.length === 0) {
      setResponseStatus(403);
      throw new Error('You do not have permission to remove this default role');
    }
  });
