import type { SecurityContext, MiddlewareResult, SecurityPermission } from "../types";
import { permissionEngine } from "../services/permission-engine";

export interface IRBACMiddleware {
  requirePermission(context: SecurityContext | undefined, permission: SecurityPermission): MiddlewareResult;
  requireAnyPermission(context: SecurityContext | undefined, permissions: SecurityPermission[]): MiddlewareResult;
  requireAllPermissions(context: SecurityContext | undefined, permissions: SecurityPermission[]): MiddlewareResult;
  requireRole(context: SecurityContext | undefined, allowedRoles: string[]): MiddlewareResult;
}

export class RBACMiddleware implements IRBACMiddleware {
  requirePermission(context: SecurityContext | undefined, permission: SecurityPermission): MiddlewareResult {
    if (!context?.isAuthenticated) {
      return { allowed: false, status: 401, error: "Authentication required" };
    }
    if (!permissionEngine.checkPermission(context, permission)) {
      return { allowed: false, status: 403, error: `Missing required permission: ${permission}` };
    }
    return { allowed: true, status: 200, context };
  }

  requireAnyPermission(context: SecurityContext | undefined, permissions: SecurityPermission[]): MiddlewareResult {
    if (!context?.isAuthenticated) {
      return { allowed: false, status: 401, error: "Authentication required" };
    }
    if (!permissionEngine.checkAnyPermission(context, permissions)) {
      return { allowed: false, status: 403, error: "Missing required permissions" };
    }
    return { allowed: true, status: 200, context };
  }

  requireAllPermissions(context: SecurityContext | undefined, permissions: SecurityPermission[]): MiddlewareResult {
    if (!context?.isAuthenticated) {
      return { allowed: false, status: 401, error: "Authentication required" };
    }
    if (!permissionEngine.checkAllPermissions(context, permissions)) {
      return { allowed: false, status: 403, error: "Missing one or more required permissions" };
    }
    return { allowed: true, status: 200, context };
  }

  requireRole(context: SecurityContext | undefined, allowedRoles: string[]): MiddlewareResult {
    if (!context?.isAuthenticated) {
      return { allowed: false, status: 401, error: "Authentication required" };
    }
    if (!allowedRoles.includes(context.role)) {
      return { allowed: false, status: 403, error: `Role ${context.role} not authorized. Required: ${allowedRoles.join(", ")}` };
    }
    return { allowed: true, status: 200, context };
  }
}

export const rbacMiddleware = new RBACMiddleware();
