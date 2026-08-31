// Client-safe permission check (mirrors the SQL check_permissions rule: a
// superuser passes everything). Kept separate from utils/permissions.ts, which
// imports server-only code. Server functions re-verify; this only gates UI.
export const SUPERUSER_PERMISSION = 'auth:superuser';

// Permissions that grant access to some part of the admin section.
export const ADMIN_PERMISSIONS = ['user:manage', 'system:settings', 'role:manage'] as const;

export function hasAnyPermission(permissions: Array<string>, ...paths: Array<string>): boolean {
  if (permissions.includes(SUPERUSER_PERMISSION)) return true;

  return paths.some((path): boolean => permissions.includes(path));
}

export function canAccessAdmin(permissions: Array<string>): boolean {
  return hasAnyPermission(permissions, ...ADMIN_PERMISSIONS);
}
