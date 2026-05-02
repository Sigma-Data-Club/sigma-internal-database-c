import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "../../context/AuthContext";
import { hasAnyPermission } from "../../auth/permissions";

type RequirePermissionRouteProps = {
  permissions: string[];
  children: ReactNode;
};

export default function RequirePermissionRoute({
  permissions,
  children,
}: RequirePermissionRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyPermission(user, permissions)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}