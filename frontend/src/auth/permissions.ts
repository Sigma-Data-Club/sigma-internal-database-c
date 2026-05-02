import type { AuthUser } from "../types/auth";

export function getUserPermissions(user: AuthUser | null | undefined): string[] {
  if (!user || !Array.isArray(user.permissions)) {
    return [];
  }
  return user.permissions;
}

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string,
): boolean {
  const permissions = getUserPermissions(user);

  if (permissions.includes(permission)) {
    return true;
  }

  const [resource] = permission.split(".");
  if (resource && permissions.includes(`${resource}.manage`)) {
    return true;
  }

  return false;
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  permissionsToCheck: string[],
): boolean {
  return permissionsToCheck.some((permission) => hasPermission(user, permission));
}

export function hasAllPermissions(
  user: AuthUser | null | undefined,
  permissionsToCheck: string[],
): boolean {
  return permissionsToCheck.every((permission) => hasPermission(user, permission));
}