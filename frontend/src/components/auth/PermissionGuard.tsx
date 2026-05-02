import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { hasAnyPermission } from "../../auth/permissions";

type PermissionGuardProps = {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

export default function PermissionGuard({
  permissions,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (!hasAnyPermission(user, permissions)) {
    return fallback;
  }

  return <>{children}</>;
}