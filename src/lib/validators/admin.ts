import { z } from 'zod';

export const ANNOUNCEMENT_TYPES = ['info', 'success', 'warning', 'error'] as const;
export const DEFAULT_ROLE_TYPES = [
  'global',
  'public_registration',
  'private_registration',
  'sso_provider'
] as const;

export const updateGeneralSettingsValidator = z.object({
  appName: z.string().min(1).max(100),
  appDescription: z.string().max(500).nullable(),
  showAnnouncementBanner: z.boolean(),
  announcementMessage: z.string().max(500).nullable(),
  announcementType: z.enum(ANNOUNCEMENT_TYPES)
});

// Form-side variant: TanStack Form models optional text fields as required
// `string`, so the nullable server fields are plain strings here (converted to
// null on submit).
export const generalSettingsFormValidator = z.object({
  appName: z.string().min(1).max(100),
  appDescription: z.string().max(500),
  showAnnouncementBanner: z.boolean(),
  announcementMessage: z.string().max(500),
  announcementType: z.enum(ANNOUNCEMENT_TYPES)
});

export const updateAuthSettingsValidator = z.object({
  enableRegistration: z.boolean()
});

export const addDefaultRoleValidator = z.object({
  role: z.uuid(),
  type: z.enum(DEFAULT_ROLE_TYPES),
  provider: z.string().max(100).nullable()
});

export const defaultRoleIdValidator = z.object({
  id: z.uuid()
});

export const createRoleValidator = z.object({
  name: z.string().min(1).max(50)
});

export const updateRoleValidator = z.object({
  roleId: z.uuid(),
  name: z.string().min(1).max(50)
});

export const roleIdValidator = z.object({
  roleId: z.uuid()
});

export const setRolePermissionValidator = z.object({
  roleId: z.uuid(),
  permissionId: z.uuid(),
  enabled: z.boolean()
});

export const userRoleValidator = z.object({
  userId: z.uuid(),
  roleId: z.uuid()
});

export const userIdValidator = z.object({
  userId: z.uuid()
});

export const inviteUserValidator = z.object({
  email: z.email()
});

export const createPermissionValidator = z.object({
  path: z.string().min(1).max(100)
});

export const permissionIdValidator = z.object({
  permissionId: z.uuid()
});
