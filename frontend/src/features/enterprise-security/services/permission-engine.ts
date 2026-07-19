import type { SecurityRole, SecurityPermission, SecurityUser, SecurityContext } from "../types";
import { rbacEngine } from "./rbac-engine";
import { authEngine } from "./auth-engine";

export interface IPermissionEngine {
  checkPermission(context: SecurityContext, permission: SecurityPermission): boolean;
  checkAnyPermission(context: SecurityContext, permissions: SecurityPermission[]): boolean;
  checkAllPermissions(context: SecurityContext, permissions: SecurityPermission[]): boolean;
  canImpersonate(context: SecurityContext, targetRole: SecurityRole): boolean;
  canAccessResource(context: SecurityContext, resourceType: string, resourceId: string): boolean;
  canManageUser(context: SecurityContext, targetUserId: string): boolean;
  filterAllowed<T>(items: T[], context: SecurityContext, getPermission: (item: T) => SecurityPermission): T[];
  buildSecurityContext(user: SecurityUser, sessionId: string, ipAddress: string, userAgent: string, correlationId: string): SecurityContext;
  getUserEffectivePermissions(userId: string): SecurityPermission[];
}

export class MockPermissionEngine implements IPermissionEngine {
  private permissionCache: Map<string, SecurityPermission[]> = new Map();

  checkPermission(context: SecurityContext, permission: SecurityPermission): boolean {
    return context.permissions.includes(permission);
  }

  checkAnyPermission(context: SecurityContext, permissions: SecurityPermission[]): boolean {
    return permissions.some((p) => context.permissions.includes(p));
  }

  checkAllPermissions(context: SecurityContext, permissions: SecurityPermission[]): boolean {
    return permissions.every((p) => context.permissions.includes(p));
  }

  canImpersonate(context: SecurityContext, targetRole: SecurityRole): boolean {
    if (!context.permissions.includes("users:manage_roles")) return false;
    return rbacEngine.isRoleSuperior(context.role, targetRole);
  }

  canAccessResource(context: SecurityContext, resourceType: string, _resourceId: string): boolean {
    const permMap: Record<string, SecurityPermission> = {
      dashboard: "dashboard:view",
      security: "security:view",
      users: "users:view",
      tournament: "tournament:view",
      crowd: "crowd:view",
      emergency: "emergency:view",
      maintenance: "maintenance:view",
      parking: "parking:view",
      energy: "energy:view",
      incidents: "incidents:view",
      audit: "audit:view",
      reports: "reports:view",
      settings: "settings:view",
      compliance: "compliance:view",
      sessions: "sessions:view",
      alerts: "alerts:view",
      logs: "logs:view",
      rbac: "rbac:view",
    };
    const required = permMap[resourceType];
    if (!required) return false;
    return context.permissions.includes(required);
  }

  canManageUser(context: SecurityContext, targetUserId: string): boolean {
    if (!context.permissions.includes("users:edit")) return false;
    const targetUser = authEngine.getUserById(targetUserId);
    if (!targetUser) return false;
    return rbacEngine.isRoleSuperior(context.role, targetUser.role);
  }

  filterAllowed<T>(items: T[], context: SecurityContext, getPermission: (item: T) => SecurityPermission): T[] {
    return items.filter((item) => context.permissions.includes(getPermission(item)));
  }

  buildSecurityContext(
    user: SecurityUser,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    correlationId: string,
  ): SecurityContext {
    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: [...user.permissions],
      sessionId,
      correlationId,
      ipAddress,
      userAgent,
      isAuthenticated: user.status === "active",
    };
  }

  getUserEffectivePermissions(userId: string): SecurityPermission[] {
    const cacheKey = `user-perms-${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached) return cached;

    const user = authEngine.getUserById(userId);
    if (!user) return [];

    const permissions = [
      ...user.permissions,
      ...rbacEngine.getInheritedRoles(user.role).flatMap((r) => rbacEngine.getPermissionsForRole(r)),
    ];
    const unique = [...new Set(permissions)];
    this.permissionCache.set(cacheKey, unique);
    setTimeout(() => this.permissionCache.delete(cacheKey), 300_000);
    return unique;
  }
}

export const permissionEngine = new MockPermissionEngine();
