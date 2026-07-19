import type { SecurityRole, SecurityPermission, RoleDefinition } from "../types";
import { ROLE_DEFINITIONS, ROLE_PERMISSIONS_MAP } from "../constants";

export interface IRBACEngine {
  getRoleDefinition(role: SecurityRole): RoleDefinition | undefined;
  getAllRoles(): RoleDefinition[];
  getPermissionsForRole(role: SecurityRole): SecurityPermission[];
  hasPermission(role: SecurityRole, permission: SecurityPermission): boolean;
  hasAnyPermission(role: SecurityRole, permissions: SecurityPermission[]): boolean;
  hasAllPermissions(role: SecurityRole, permissions: SecurityPermission[]): boolean;
  getInheritedRoles(role: SecurityRole): SecurityRole[];
  getRoleHierarchy(): { role: SecurityRole; label: string; priority: number }[];
  getRolesWithPermission(permission: SecurityPermission): SecurityRole[];
  getPermissionMatrix(): { role: SecurityRole; permissions: SecurityPermission[]; count: number }[];
  isRoleSuperior(role: SecurityRole, target: SecurityRole): boolean;
  getRolePriority(role: SecurityRole): number;
}

export class MockRBACEngine implements IRBACEngine {
  getRoleDefinition(role: SecurityRole): RoleDefinition | undefined {
    return ROLE_DEFINITIONS.find((r) => r.role === role);
  }

  getAllRoles(): RoleDefinition[] {
    return [...ROLE_DEFINITIONS];
  }

  getPermissionsForRole(role: SecurityRole): SecurityPermission[] {
    return [...(ROLE_PERMISSIONS_MAP[role] ?? [])];
  }

  hasPermission(role: SecurityRole, permission: SecurityPermission): boolean {
    return ROLE_PERMISSIONS_MAP[role]?.includes(permission) ?? false;
  }

  hasAnyPermission(role: SecurityRole, permissions: SecurityPermission[]): boolean {
    const rolePerms = ROLE_PERMISSIONS_MAP[role] ?? [];
    return permissions.some((p) => rolePerms.includes(p));
  }

  hasAllPermissions(role: SecurityRole, permissions: SecurityPermission[]): boolean {
    const rolePerms = ROLE_PERMISSIONS_MAP[role] ?? [];
    return permissions.every((p) => rolePerms.includes(p));
  }

  getInheritedRoles(role: SecurityRole): SecurityRole[] {
    const def = ROLE_DEFINITIONS.find((r) => r.role === role);
    if (!def) return [];
    const inherited: SecurityRole[] = [];
    for (const parentRole of def.inherits) {
      inherited.push(parentRole);
      inherited.push(...this.getInheritedRoles(parentRole));
    }
    return inherited;
  }

  getRoleHierarchy(): { role: SecurityRole; label: string; priority: number }[] {
    return ROLE_DEFINITIONS
      .sort((a, b) => a.priority - b.priority)
      .map((r) => ({ role: r.role, label: r.label, priority: r.priority }));
  }

  getRolesWithPermission(permission: SecurityPermission): SecurityRole[] {
    return (Object.entries(ROLE_PERMISSIONS_MAP) as [SecurityRole, SecurityPermission[]][])
      .filter(([, perms]) => perms.includes(permission))
      .map(([role]) => role);
  }

  getPermissionMatrix(): { role: SecurityRole; permissions: SecurityPermission[]; count: number }[] {
    return ROLE_DEFINITIONS.map((r) => ({
      role: r.role,
      permissions: [...(ROLE_PERMISSIONS_MAP[r.role] ?? [])],
      count: ROLE_PERMISSIONS_MAP[r.role]?.length ?? 0,
    }));
  }

  isRoleSuperior(role: SecurityRole, target: SecurityRole): boolean {
    const roleDef = ROLE_DEFINITIONS.find((r) => r.role === role);
    const targetDef = ROLE_DEFINITIONS.find((r) => r.role === target);
    if (!roleDef || !targetDef) return false;
    return roleDef.priority < targetDef.priority;
  }

  getRolePriority(role: SecurityRole): number {
    return ROLE_DEFINITIONS.find((r) => r.role === role)?.priority ?? 99;
  }
}

export const rbacEngine = new MockRBACEngine();
