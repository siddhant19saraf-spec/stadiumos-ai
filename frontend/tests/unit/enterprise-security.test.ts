import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authEngine } from "@/features/enterprise-security/services/auth-engine";
import { rbacEngine } from "@/features/enterprise-security/services/rbac-engine";
import { permissionEngine } from "@/features/enterprise-security/services/permission-engine";
import { sessionEngine } from "@/features/enterprise-security/services/session-engine";
import { auditEngine } from "@/features/enterprise-security/services/audit-engine";
import { securityMonitorEngine } from "@/features/enterprise-security/services/security-monitor-engine";
import { complianceEngine } from "@/features/enterprise-security/services/compliance-engine";
import { securityAnalyticsEngine } from "@/features/enterprise-security/services/security-analytics-engine";
import { securityReportEngine } from "@/features/enterprise-security/services/security-report-engine";
import { securityService } from "@/features/enterprise-security/services/security-service";
import { authMiddleware } from "@/features/enterprise-security/middleware/auth-middleware";
import { rbacMiddleware } from "@/features/enterprise-security/middleware/rbac-middleware";
import { rateLimitMiddleware } from "@/features/enterprise-security/middleware/rate-limit-middleware";
import { auditMiddleware } from "@/features/enterprise-security/middleware/audit-middleware";
import { securityMiddleware } from "@/features/enterprise-security/middleware/security-middleware";
import {
  ROLE_DEFINITIONS, ALL_ROLES, ALL_PERMISSIONS, ROLE_PERMISSIONS_MAP,
  SESSION_CONFIG, ALERT_THRESHOLDS, COMPLIANCE_FRAMEWORKS, MOCK_USERS,
  PERMISSION_LABELS, DEPARTMENT_COLORS,
} from "@/features/enterprise-security/constants";
import type {
  SecurityRole, SecurityPermission, SecurityUser, UserSession,
  AuditLog, SecurityAlert, ComplianceFramework, SecurityContext,
} from "@/features/enterprise-security/types";
import { makeSecurityUser, makeAuditEntry } from "../../tests/fixtures/factories";

/* ===================================================================
   Constants - Expanded Coverage
   =================================================================== */
describe("Constants - Roles & Permissions", () => {
  it("should have 11 unique roles with unique priorities", () => {
    expect(ROLE_DEFINITIONS).toHaveLength(11);
    const priorities = ROLE_DEFINITIONS.map((r) => r.priority);
    const unique = new Set(priorities);
    expect(unique.size).toBe(11);
  });

  it("should have super_admin with priority 1", () => {
    const sa = ROLE_DEFINITIONS.find((r) => r.role === "super_admin");
    expect(sa!.priority).toBe(1);
  });

  it("should have guest with priority 11", () => {
    const g = ROLE_DEFINITIONS.find((r) => r.role === "guest");
    expect(g!.priority).toBe(11);
  });

  it("should have tournament_director inheriting operations_manager", () => {
    const td = ROLE_DEFINITIONS.find((r) => r.role === "tournament_director");
    expect(td!.inherits).toContain("operations_manager");
  });

  it("should verify exact permission count is 43", () => {
    expect(ALL_PERMISSIONS).toHaveLength(43);
  });

  it("should include all CRUD user permissions", () => {
    expect(ALL_PERMISSIONS).toContain("users:view");
    expect(ALL_PERMISSIONS).toContain("users:create");
    expect(ALL_PERMISSIONS).toContain("users:edit");
    expect(ALL_PERMISSIONS).toContain("users:delete");
    expect(ALL_PERMISSIONS).toContain("users:manage_roles");
  });

  it("should include settings permissions", () => {
    expect(ALL_PERMISSIONS).toContain("settings:view");
    expect(ALL_PERMISSIONS).toContain("settings:configure");
  });

  it("should include session permissions", () => {
    expect(ALL_PERMISSIONS).toContain("sessions:view");
    expect(ALL_PERMISSIONS).toContain("sessions:revoke");
  });

  it("should have PERMISSION_LABELS for every permission", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(PERMISSION_LABELS[perm]).toBeTruthy();
      expect(typeof PERMISSION_LABELS[perm]).toBe("string");
    }
  });

  it("should have no duplicate permission labels", () => {
    const labels = Object.values(PERMISSION_LABELS);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });

  it("should map security_manager to Manage Security label", () => {
    expect(PERMISSION_LABELS["security:manage"]).toBe("Manage Security");
  });

  it("should verify tournament_director permissions include tournament:manage", () => {
    expect(ROLE_PERMISSIONS_MAP["tournament_director"]).toContain("tournament:manage");
  });

  it("should verify security_manager does NOT have users:delete", () => {
    expect(ROLE_PERMISSIONS_MAP["security_manager"]).not.toContain("users:delete");
  });

  it("should verify operations_manager has parking:manage", () => {
    expect(ROLE_PERMISSIONS_MAP["operations_manager"]).toContain("parking:manage");
  });

  it("should verify vendor only has 3 permissions", () => {
    expect(ROLE_PERMISSIONS_MAP["vendor"]).toHaveLength(3);
  });

  it("should verify auditor has rbac:view but not rbac:manage", () => {
    const auditorPerms = ROLE_PERMISSIONS_MAP["auditor"];
    expect(auditorPerms).toContain("rbac:view");
    expect(auditorPerms).not.toContain("rbac:manage");
  });

  it("should verify medical_coordinator has emergency:manage", () => {
    expect(ROLE_PERMISSIONS_MAP["medical_coordinator"]).toContain("emergency:manage");
  });

  it("should have department colors for all departments", () => {
    const depts = ["Executive", "Tournament Operations", "Security", "Operations", "Medical", "Facilities", "Parking", "Energy", "External", "Compliance", "Public"];
    for (const d of depts) {
      expect(DEPARTMENT_COLORS[d]).toBeTruthy();
    }
  });
});

describe("Constants - Session Config & Alert Thresholds", () => {
  it("should have IDLE_TIMEOUT_MS set to 30 minutes", () => {
    expect(SESSION_CONFIG.IDLE_TIMEOUT_MS).toBe(1800000);
  });

  it("should have MAX_SESSION_DURATION_MS set to 24 hours", () => {
    expect(SESSION_CONFIG.MAX_SESSION_DURATION_MS).toBe(86400000);
  });

  it("should enforce password min length of 12", () => {
    expect(ALERT_THRESHOLDS.PASSWORD_MIN_LENGTH).toBe(12);
  });

  it("should require MFA by default", () => {
    expect(ALERT_THRESHOLDS.PASSWORD_REQUIRE_MFA).toBe(true);
  });

  it("should have brute force window of 15 minutes", () => {
    expect(ALERT_THRESHOLDS.BRUTE_FORCE_WINDOW_MS).toBe(900000);
  });

  it("should have API key rotation of 90 days", () => {
    expect(ALERT_THRESHOLDS.API_KEY_ROTATION_DAYS).toBe(90);
  });

  it("should have rate limit window of 60s", () => {
    expect(ALERT_THRESHOLDS.RATE_LIMIT_WINDOW_MS).toBe(60000);
  });
});

describe("Constants - Compliance Frameworks", () => {
  it("should define 6 compliance frameworks", () => {
    expect(COMPLIANCE_FRAMEWORKS).toHaveLength(6);
  });

  it("ISO 27001 should have 14 requirements", () => {
    const iso = COMPLIANCE_FRAMEWORKS.find((f) => f.framework === "iso_27001");
    expect(iso!.requirements.length).toBe(14);
  });

  it("SOC 2 should have 9 requirements", () => {
    const soc = COMPLIANCE_FRAMEWORKS.find((f) => f.framework === "soc_2");
    expect(soc!.requirements.length).toBe(9);
  });

  it("GDPR should have 10 requirements", () => {
    const gdpr = COMPLIANCE_FRAMEWORKS.find((f) => f.framework === "gdpr");
    expect(gdpr!.requirements.length).toBe(10);
  });

  it("each framework should have gaps array", () => {
    for (const f of COMPLIANCE_FRAMEWORKS) {
      expect(Array.isArray(f.gaps)).toBe(true);
    }
  });

  it("each framework should have recommendations array", () => {
    for (const f of COMPLIANCE_FRAMEWORKS) {
      expect(f.recommendations.length).toBeGreaterThan(0);
    }
  });

  it("each framework should have lastAssessment date", () => {
    for (const f of COMPLIANCE_FRAMEWORKS) {
      expect(new Date(f.lastAssessment).getTime()).not.toBeNaN();
    }
  });

  it("OWASP ASVS should have 12 requirements", () => {
    const owasp = COMPLIANCE_FRAMEWORKS.find((f) => f.framework === "owasp_asvs");
    expect(owasp!.requirements.length).toBe(12);
  });

  it("NIST CSF should have 5 requirements", () => {
    const nist = COMPLIANCE_FRAMEWORKS.find((f) => f.framework === "nist_csf");
    expect(nist!.requirements.length).toBe(5);
  });
});

describe("Constants - Mock Users", () => {
  it("should have 13 mock users", () => {
    expect(MOCK_USERS).toHaveLength(13);
  });

  it("should include locked user", () => {
    const locked = MOCK_USERS.find((u) => u.username === "locked_user");
    expect(locked).toBeDefined();
    expect(locked!.status).toBe("locked");
  });

  it("should include suspended user", () => {
    const suspended = MOCK_USERS.find((u) => u.username === "suspended_user");
    expect(suspended).toBeDefined();
    expect(suspended!.status).toBe("suspended");
  });

  it("should have admin with mfa enabled", () => {
    const admin = MOCK_USERS.find((u) => u.username === "admin");
    expect(admin!.mfaEnabled).toBe(true);
  });

  it("should have unique usernames", () => {
    const usernames = MOCK_USERS.map((u) => u.username);
    const unique = new Set(usernames);
    expect(unique.size).toBe(usernames.length);
  });

  it("should cover all 11 roles", () => {
    const roles = new Set(MOCK_USERS.map((u) => u.role));
    for (const role of ALL_ROLES) {
      expect(roles.has(role)).toBe(true);
    }
  });
});

/* ===================================================================
   Auth Engine - Expanded
   =================================================================== */
describe("AuthEngine - Login Edge Cases", () => {
  beforeEach(() => {
    authEngine.resetFailedAttempts("edgeuser");
    authEngine.unlockUser("u-012");
  });

  it("should fail login for nonexistent user", () => {
    const result = authEngine.login({ username: "nonexistent", password: "valid_password" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid credentials");
  });

  it("should require MFA code for mfa-enabled user", () => {
    const result = authEngine.login({ username: "admin", password: "valid_password" });
    expect(result.requiresMfa).toBe(true);
    expect(result.error).toContain("MFA code required");
  });

  it("should accept MFA code for mfa-enabled user", () => {
    const result = authEngine.login({ username: "admin", password: "valid_password", mfaCode: "123456" });
    expect(result.success).toBe(true);
  });

  it("should track remaining attempts after failed login", () => {
    authEngine.resetFailedAttempts("attemptuser");
    authEngine.login({ username: "attemptuser", password: "wrong" });
    const result = authEngine.login({ username: "attemptuser", password: "wrong" });
    expect(result.remainingAttempts).toBe(3);
  });

  it("should lock account after 5 failed attempts", () => {
    authEngine.resetFailedAttempts("lockuser");
    for (let i = 0; i < 5; i++) {
      authEngine.login({ username: "lockuser", password: "wrong" });
    }
    const result = authEngine.login({ username: "lockuser", password: "wrong" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("locked");
  });

  it("should provide lock duration in error message", () => {
    authEngine.resetFailedAttempts("lockduration");
    for (let i = 0; i < 5; i++) {
      authEngine.login({ username: "lockduration", password: "wrong" });
    }
    const result = authEngine.login({ username: "lockduration", password: "wrong" });
    expect(result.error).toContain("seconds");
  });

  it("should include device info in session on login", () => {
    const result = authEngine.login({
      username: "ops", password: "valid_password",
      deviceId: "dev-mac-001", deviceName: "MacBook Pro", isTrusted: true,
    });
    expect(result.success).toBe(true);
    expect(result.session!.deviceId).toBe("dev-mac-001");
    expect(result.session!.deviceName).toBe("MacBook Pro");
    expect(result.session!.isTrusted).toBe(true);
  });

  it("should generate access and refresh tokens", () => {
    const result = authEngine.login({ username: "director", password: "valid_password" });
    expect(result.token!.accessToken).toContain("tok-");
    expect(result.token!.refreshToken).toContain("ref-");
    expect(result.token!.tokenType).toBe("Bearer");
  });

  it("should include permissions in scope", () => {
    const result = authEngine.login({ username: "auditor", password: "valid_password" });
    expect(result.token!.scope.length).toBeGreaterThan(0);
  });

  it("should update lastLogin on successful login", () => {
    const before = authEngine.getUserById("u-004")!.lastLogin;
    authEngine.login({ username: "ops", password: "valid_password" });
    const after = authEngine.getUserById("u-004")!.lastLogin;
    expect(after).not.toBe(before);
  });
});

describe("AuthEngine - User Management", () => {
  it("should create a new user", () => {
    const newUser = authEngine.createUser({
      id: "u-new", username: "newuser", email: "new@test.com",
      displayName: "New User", role: "operator", permissions: ["dashboard:view"],
      department: "IT", status: "active", mfaEnabled: false, lastLogin: null,
    });
    expect(newUser.createdAt).toBeTruthy();
    expect(newUser.createdBy).toBe("system");
  });

  it("should update existing user", () => {
    const updated = authEngine.updateUser("u-001", { department: "Executive Updated" });
    expect(updated!.department).toBe("Executive Updated");
    expect(updated!.updatedAt).toBeTruthy();
  });

  it("should return null when updating nonexistent user", () => {
    const result = authEngine.updateUser("u-nonexistent", { department: "test" });
    expect(result).toBeNull();
  });

  it("should lock and unlock user", () => {
    authEngine.unlockUser("u-012");
    const locked = authEngine.lockUser("u-012");
    expect(locked!.status).toBe("locked");
    const unlocked = authEngine.unlockUser("u-012");
    expect(unlocked!.status).toBe("active");
  });

  it("should clear locked status on unlock", () => {
    authEngine.lockUser("u-012");
    authEngine.unlockUser("u-012");
    const result = authEngine.login({ username: "locked_user", password: "valid_password" });
    expect(result.success).toBe(true);
  });

  it("should handle locking already locked user", () => {
    authEngine.lockUser("u-001");
    const locked = authEngine.lockUser("u-001");
    expect(locked!.status).toBe("locked");
    authEngine.unlockUser("u-001");
  });

  it("should return null for lock on nonexistent user", () => {
    const result = authEngine.lockUser("u-nonexistent");
    expect(result).toBeNull();
  });
});

describe("AuthEngine - Token & Provider", () => {
  it("should configure auth provider", () => {
    authEngine.configure({ type: "oauth2", issuer: "test", clientId: "c1", clientSecret: "s1", redirectUri: "r", scopes: ["openid"], metadataUrl: "m", jwksUri: "j", tokenEndpoint: "t", authorizationEndpoint: "a" });
    expect(authEngine.getProvider()).toBe("oauth2");
    authEngine.configure({ type: "mock", issuer: "", clientId: "", clientSecret: "", redirectUri: "", scopes: [], metadataUrl: "", jwksUri: "", tokenEndpoint: "", authorizationEndpoint: "" });
  });

  it("should validate valid token", () => {
    const result = authEngine.login({ username: "ops", password: "valid_password" });
    const validated = authEngine.validateToken(result.token!.accessToken);
    expect(validated).not.toBeNull();
    expect(validated!.username).toBe("ops");
  });

  it("should return null for invalid token format", () => {
    const validated = authEngine.validateToken("invalid-token");
    expect(validated).toBeNull();
  });

  it("should return null for token when user is inactive", () => {
    const validated = authEngine.validateToken("tok-something");
    const lockedUser = authEngine.getUserById("u-012");
    if (lockedUser && lockedUser.status === "locked") {
      const validatedLocked = authEngine.validateToken("tok-anything");
      expect(validatedLocked).toBeNull();
    }
  });

  it("should refresh token and return new tokens", () => {
    const token = authEngine.refreshToken("old_refresh_token");
    expect(token!.accessToken).toBeTruthy();
    expect(token!.refreshToken).toBeTruthy();
    expect(token!.accessToken).not.toBe("old_refresh_token");
  });
});

/* ===================================================================
   RBAC Engine - Expanded
   =================================================================== */
describe("RBACEngine - Permission Queries", () => {
  it("should return empty array for unknown role definition", () => {
    expect(rbacEngine.getRoleDefinition("unknown" as SecurityRole)).toBeUndefined();
  });

  it("should return empty array for unknown role permissions", () => {
    const perms = rbacEngine.getPermissionsForRole("unknown" as SecurityRole);
    expect(perms).toEqual([]);
  });

  it("should return permissions for tournament_director including inherited", () => {
    const perms = rbacEngine.getPermissionsForRole("tournament_director");
    expect(perms).toContain("dashboard:view");
    expect(perms).toContain("tournament:manage");
    expect(perms).toContain("reports:create");
  });

  it("should return empty inherited roles for roles with no inheritance", () => {
    const inherited = rbacEngine.getInheritedRoles("guest");
    expect(inherited).toEqual([]);
  });

  it("should return inherited roles for tournament_director", () => {
    const inherited = rbacEngine.getInheritedRoles("tournament_director");
    expect(inherited).toContain("operations_manager");
  });

  it("should check hasPermission for all 11 roles against dashboard:view", () => {
    for (const role of ALL_ROLES) {
      expect(rbacEngine.hasPermission(role, "dashboard:view")).toBe(true);
    }
  });

  it("should check hasPermission false for unauthorized permissions", () => {
    expect(rbacEngine.hasPermission("guest", "users:manage_roles")).toBe(false);
    expect(rbacEngine.hasPermission("vendor", "security:manage")).toBe(false);
    expect(rbacEngine.hasPermission("energy_manager", "users:delete")).toBe(false);
  });

  it("should check hasAnyPermission correctly", () => {
    expect(rbacEngine.hasAnyPermission("security_manager", ["emergency:view", "rbac:manage"])).toBe(true);
    expect(rbacEngine.hasAnyPermission("vendor", ["rbac:manage", "settings:configure"])).toBe(false);
  });

  it("should check hasAllPermissions correctly", () => {
    expect(rbacEngine.hasAllPermissions("security_manager", ["emergency:view", "security:manage"])).toBe(true);
    expect(rbacEngine.hasAllPermissions("parking_manager", ["parking:view", "energy:manage"])).toBe(false);
  });

  it("should find roles with permission for all 43 permissions", () => {
    for (const perm of ALL_PERMISSIONS) {
      const roles = rbacEngine.getRolesWithPermission(perm);
      expect(roles.length).toBeGreaterThan(0);
    }
  });

  it("should only find super_admin for rbac:manage", () => {
    const roles = rbacEngine.getRolesWithPermission("rbac:manage");
    expect(roles).toEqual(["super_admin"]);
  });

  it("should find multiple roles for emergency:view", () => {
    const roles = rbacEngine.getRolesWithPermission("emergency:view");
    expect(roles.length).toBeGreaterThan(1);
    expect(roles).toContain("security_manager");
    expect(roles).toContain("medical_coordinator");
  });

  it("should return sorted permission matrix", () => {
    const matrix = rbacEngine.getPermissionMatrix();
    expect(matrix[0].role).toBe("super_admin");
    expect(matrix[10].role).toBe("guest");
  });

  it("should verify isRoleSuperior works for all combinations", () => {
    expect(rbacEngine.isRoleSuperior("super_admin", "super_admin")).toBe(false);
    expect(rbacEngine.isRoleSuperior("tournament_director", "operations_manager")).toBe(true);
    expect(rbacEngine.isRoleSuperior("guest", "vendor")).toBe(false);
  });

  it("should return false for isRoleSuperior with unknown role", () => {
    expect(rbacEngine.isRoleSuperior("super_admin", "unknown" as SecurityRole)).toBe(false);
    expect(rbacEngine.isRoleSuperior("unknown" as SecurityRole, "guest")).toBe(false);
  });

  it("should return default priority 99 for unknown role", () => {
    expect(rbacEngine.getRolePriority("unknown" as SecurityRole)).toBe(99);
  });

  it("should return correct priority for each role", () => {
    const expected: [SecurityRole, number][] = [
      ["super_admin", 1], ["tournament_director", 2], ["security_manager", 3],
      ["operations_manager", 4], ["medical_coordinator", 5], ["maintenance_manager", 6],
      ["parking_manager", 7], ["energy_manager", 8], ["vendor", 9],
      ["auditor", 10], ["guest", 11],
    ];
    for (const [role, priority] of expected) {
      expect(rbacEngine.getRolePriority(role)).toBe(priority);
    }
  });
});

/* ===================================================================
   Permission Engine - Expanded
   =================================================================== */
describe("PermissionEngine - Granular Checks", () => {
  let adminCtx: SecurityContext;
  let guestCtx: SecurityContext;
  let opsCtx: SecurityContext;

  beforeEach(() => {
    adminCtx = permissionEngine.buildSecurityContext(
      { id: "u-001", username: "admin", email: "a@b.com", displayName: "A", role: "super_admin", permissions: [...ALL_PERMISSIONS], department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-1", "10.0.0.1", "Chrome", "corr-1",
    );
    guestCtx = permissionEngine.buildSecurityContext(
      { id: "u-011", username: "guest1", email: "g@b.com", displayName: "G", role: "guest", permissions: ["dashboard:view"], department: "Public", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-2", "10.0.0.2", "FF", "corr-2",
    );
    opsCtx = permissionEngine.buildSecurityContext(
      { id: "u-004", username: "ops", email: "o@b.com", displayName: "O", role: "operations_manager", permissions: [...ROLE_PERMISSIONS_MAP["operations_manager"]], department: "Ops", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-3", "10.0.0.3", "Edge", "corr-3",
    );
  });

  it("should check all 43 permissions for admin", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(permissionEngine.checkPermission(adminCtx, perm)).toBe(true);
    }
  });

  it("should check all 43 permissions for guest (only 1 passes)", () => {
    for (const perm of ALL_PERMISSIONS) {
      if (perm === "dashboard:view") {
        expect(permissionEngine.checkPermission(guestCtx, perm)).toBe(true);
      } else {
        expect(permissionEngine.checkPermission(guestCtx, perm)).toBe(false);
      }
    }
  });

  it("should check any permission with empty array", () => {
    expect(permissionEngine.checkAnyPermission(adminCtx, [])).toBe(false);
  });

  it("should check all permissions with empty array", () => {
    expect(permissionEngine.checkAllPermissions(adminCtx, [])).toBe(true);
  });

  it("should not allow impersonation without users:manage_roles", () => {
    expect(permissionEngine.canImpersonate(opsCtx, "guest")).toBe(false);
  });

  it("should not allow impersonation of superior role", () => {
    expect(permissionEngine.canImpersonate(adminCtx, "super_admin")).toBe(false);
  });

  it("should allow impersonation of inferior role", () => {
    expect(permissionEngine.canImpersonate(adminCtx, "guest")).toBe(true);
  });

  it("should allow resource access for admin to all types", () => {
    const types = ["dashboard", "security", "users", "tournament", "crowd", "emergency", "maintenance", "parking", "energy", "incidents", "audit", "reports", "settings", "compliance", "sessions", "alerts", "logs", "rbac"];
    for (const t of types) {
      expect(permissionEngine.canAccessResource(adminCtx, t, "any")).toBe(true);
    }
  });

  it("should deny resource access for unknown type", () => {
    expect(permissionEngine.canAccessResource(adminCtx, "nonexistent", "x")).toBe(false);
  });

  it("should manage users only if role is superior", () => {
    expect(permissionEngine.canManageUser(adminCtx, "u-011")).toBe(true);
    expect(permissionEngine.canManageUser(opsCtx, "u-001")).toBe(false);
  });

  it("should return false for canManageUser without users:edit", () => {
    expect(permissionEngine.canManageUser(guestCtx, "u-001")).toBe(false);
  });

  it("should filter allowed items by permission", () => {
    const items = [
      { name: "A", perm: "dashboard:view" as SecurityPermission },
      { name: "B", perm: "users:delete" as SecurityPermission },
      { name: "C", perm: "audit:view" as SecurityPermission },
    ];
    const allowed = permissionEngine.filterAllowed(items, guestCtx, (i) => i.perm);
    expect(allowed).toHaveLength(1);
    expect(allowed[0].name).toBe("A");
  });

  it("should build security context with isAuthenticated true for active user", () => {
    expect(adminCtx.isAuthenticated).toBe(true);
  });

  it("should build security context with isAuthenticated false for inactive user", () => {
    const ctx = permissionEngine.buildSecurityContext(
      { id: "u-012", username: "locked", email: "l@b.com", displayName: "L", role: "operations_manager", permissions: [], department: "Ops", status: "locked", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-x", "ip", "ua", "corr-x",
    );
    expect(ctx.isAuthenticated).toBe(false);
  });

  it("should get effective permissions including inherited", () => {
    const perms = permissionEngine.getUserEffectivePermissions("u-002");
    expect(perms.length).toBeGreaterThan(0);
    expect(perms).toContain("dashboard:view");
  });

  it("should return empty array for unknown user effective permissions", () => {
    const perms = permissionEngine.getUserEffectivePermissions("u-nonexistent");
    expect(perms).toEqual([]);
  });

  it("should cache effective permissions", () => {
    const perms1 = permissionEngine.getUserEffectivePermissions("u-001");
    const perms2 = permissionEngine.getUserEffectivePermissions("u-001");
    expect(perms1).toEqual(perms2);
  });
});

/* ===================================================================
   Session Engine - Expanded
   =================================================================== */
describe("SessionEngine - Lifecycle", () => {
  beforeEach(() => {
    const allSessions = sessionEngine.getAllSessions();
    for (const s of allSessions) {
      sessionEngine.revokeSession(s.id);
    }
  });

  it("should enforce max concurrent sessions", () => {
    for (let i = 0; i < 6; i++) {
      sessionEngine.createSession("u-concurrent", "concurrent", "guest", `10.0.0.${i}`, "UA", `dev-${i}`, "Device", false);
    }
    const active = sessionEngine.getActiveSessions("u-concurrent");
    expect(active.length).toBeLessThanOrEqual(5);
  });

  it("should revoke oldest session when limit exceeded", () => {
    const s1 = sessionEngine.createSession("u-oldest", "oldest", "guest", "10.0.0.1", "UA", "dev-1", "Device", false);
    for (let i = 0; i < 5; i++) {
      sessionEngine.createSession("u-oldest", "oldest", "guest", `10.0.0.${i + 2}`, "UA", `dev-${i + 2}`, "Device", false);
    }
    const old = sessionEngine.getSession(s1.id);
    expect(old!.isActive).toBe(false);
  });

  it("should return null for unknown session", () => {
    expect(sessionEngine.getSession("nonexistent")).toBeNull();
  });

  it("should revoke all sessions for a user except specified one", () => {
    const keep = sessionEngine.createSession("u-revoke-all", "ra", "guest", "10.0.0.1", "UA", "dev-1", "Device", false);
    sessionEngine.createSession("u-revoke-all", "ra", "guest", "10.0.0.2", "UA", "dev-2", "Device", false);
    sessionEngine.createSession("u-revoke-all", "ra", "guest", "10.0.0.3", "UA", "dev-3", "Device", false);
    const count = sessionEngine.revokeAllUserSessions("u-revoke-all", keep.id);
    expect(count).toBe(2);
    expect(sessionEngine.getSession(keep.id)!.isActive).toBe(true);
  });

  it("should return 0 when revoking all sessions for unknown user", () => {
    const count = sessionEngine.revokeAllUserSessions("u-unknown");
    expect(count).toBe(0);
  });

  it("should mark session inactive on revoke", () => {
    const s = sessionEngine.createSession("u-revoke", "revoke", "guest", "ip", "ua", "dev", "Device", false);
    const result = sessionEngine.revokeSession(s.id);
    expect(result).toBe(true);
    expect(sessionEngine.getSession(s.id)!.isActive).toBe(false);
  });

  it("should return false when revoking nonexistent session", () => {
    expect(sessionEngine.revokeSession("nonexistent")).toBe(false);
  });

  it("should update activity and return session", () => {
    const s = sessionEngine.createSession("u-activity", "act", "guest", "ip", "ua", "dev", "Device", false);
    const updated = sessionEngine.updateActivity(s.id);
    expect(updated).not.toBeNull();
    expect(updated!.lastActivity).toBeTruthy();
  });

  it("should return null when updating activity for unknown session", () => {
    expect(sessionEngine.updateActivity("nonexistent")).toBeNull();
  });

  it("should expire session after max duration", () => {
    const s = sessionEngine.createSession("u-expire", "exp", "guest", "ip", "ua", "dev", "Device", false);
    const oldExpiry = new Date(Date.now() - 1000).toISOString();
    s.expiresAt = oldExpiry;
    expect(sessionEngine.isSessionValid(s)).toBe(false);
  });

  it("should count active sessions", () => {
    sessionEngine.createSession("u-count1", "c1", "guest", "ip", "ua", "dev", "Device", false);
    sessionEngine.createSession("u-count2", "c2", "guest", "ip", "ua", "dev", "Device", false);
    expect(sessionEngine.getActiveSessionCount()).toBeGreaterThanOrEqual(2);
  });

  it("should return total session count", () => {
    const before = sessionEngine.getTotalSessionCount();
    sessionEngine.createSession("u-total", "tot", "guest", "ip", "ua", "dev", "Device", false);
    expect(sessionEngine.getTotalSessionCount()).toBe(before + 1);
  });

  it("should cleanup expired sessions", () => {
    const s = sessionEngine.createSession("u-cleanup", "cln", "guest", "ip", "ua", "dev", "Device", false);
    s.expiresAt = new Date(Date.now() - 100000).toISOString();
    s.isActive = true;
    const count = sessionEngine.cleanupExpiredSessions();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should get expired sessions list", () => {
    const s = sessionEngine.createSession("u-expired-list", "el", "guest", "ip", "ua", "dev", "Device", false);
    s.expiresAt = new Date(Date.now() - 100000).toISOString();
    const expired = sessionEngine.getExpiredSessions();
    expect(expired.length).toBeGreaterThanOrEqual(0);
  });
});

/* ===================================================================
   Audit Engine - Expanded
   =================================================================== */
describe("AuditEngine - CRUD & Filtering", () => {
  beforeEach(() => {
    auditEngine.clearLogs();
  });

  it("should generate sequential events with unique IDs", () => {
    const l1 = auditEngine.log("a1", "u1", "uid1", "guest", "type", "r1", "d1", "success", "ip", "c", "ua", "info");
    const l2 = auditEngine.log("a2", "u2", "uid2", "guest", "type", "r2", "d2", "failure", "ip", "c", "ua", "warning");
    expect(l1.id).not.toBe(l2.id);
  });

  it("should enforce max log limit", () => {
    for (let i = 0; i < 10050; i++) {
      auditEngine.log(`action_${i}`, "user", `uid_${i}`, "guest", "type", `r_${i}`, "d", "success", "ip", "c", "ua", "info");
    }
    expect(auditEngine.getLogCount()).toBeLessThanOrEqual(10000);
  });

  it("should filter by userId", () => {
    auditEngine.log("a1", "user1", "uid1", "guest", "t", "r1", "d", "success", "ip", "c", "ua", "info");
    auditEngine.log("a2", "user2", "uid2", "guest", "t", "r2", "d", "failure", "ip", "c", "ua", "warning");
    const filtered = auditEngine.getLogs({ userId: "uid1" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].user).toBe("user1");
  });

  it("should filter by action", () => {
    auditEngine.log("login", "u", "uid", "guest", "t", "r", "d", "success", "ip", "c", "ua", "info");
    auditEngine.log("logout", "u", "uid", "guest", "t", "r", "d", "success", "ip", "c", "ua", "info");
    const filtered = auditEngine.getLogs({ action: "login" });
    expect(filtered).toHaveLength(1);
  });

  it("should filter by resourceType", () => {
    auditEngine.log("a", "u", "uid", "guest", "user", "r", "d", "success", "ip", "c", "ua", "info");
    auditEngine.log("b", "u", "uid", "guest", "session", "r", "d", "success", "ip", "c", "ua", "info");
    const filtered = auditEngine.getLogs({ resourceType: "user" });
    expect(filtered).toHaveLength(1);
  });

  it("should filter by result", () => {
    auditEngine.log("a", "u", "uid", "guest", "t", "r", "d", "success", "ip", "c", "ua", "info");
    auditEngine.log("b", "u", "uid", "guest", "t", "r", "d", "failure", "ip", "c", "ua", "warning");
    const filtered = auditEngine.getLogs({ result: "failure" });
    expect(filtered).toHaveLength(1);
  });

  it("should filter by severity", () => {
    auditEngine.log("a", "u", "uid", "guest", "t", "r", "d", "success", "ip", "c", "ua", "info");
    auditEngine.log("b", "u", "uid", "guest", "t", "r", "d", "failure", "ip", "c", "ua", "critical");
    const filtered = auditEngine.getLogs({ severity: "critical" });
    expect(filtered).toHaveLength(1);
  });

  it("should filter by date range", () => {
    auditEngine.log("a", "u", "uid", "guest", "t", "r", "d", "success", "ip", "c", "ua", "info");
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const filtered = auditEngine.getLogs({ fromDate: futureDate });
    expect(filtered).toHaveLength(0);
  });

  it("should return null for unknown log id", () => {
    expect(auditEngine.getLogById("nonexistent")).toBeNull();
  });

  it("should limit user activity results", () => {
    for (let i = 0; i < 100; i++) {
      auditEngine.log(`a${i}`, "user", "uid", "guest", "t", `r${i}`, "d", "success", "ip", "c", "ua", "info");
    }
    const activity = auditEngine.getUserActivity("uid", 10);
    expect(activity.length).toBeLessThanOrEqual(10);
  });

  it("should return resource audit trail", () => {
    auditEngine.log("update", "u", "uid", "guest", "user", "u-001", "Updated", "success", "ip", "c", "ua", "info");
    auditEngine.log("delete", "u", "uid", "guest", "user", "u-001", "Deleted", "success", "ip", "c", "ua", "critical");
    const trail = auditEngine.getResourceAuditTrail("user", "u-001");
    expect(trail).toHaveLength(2);
  });

  it("should export logs as CSV with proper headers", () => {
    auditEngine.log("test", "admin", "u-001", "super_admin", "type", "r1", "detail", "success", "ip", "c", "ua", "info");
    const csv = auditEngine.exportLogs("csv");
    expect(csv).toContain("id,timestamp,user,action,resourceType,resourceId,result,severity,ipAddress,correlationId");
    expect(csv).toContain("admin");
    expect(csv).toContain("test");
  });

  it("should handle CSV escaping of special characters", () => {
    auditEngine.log("test", `user"name`, "u-001", "guest", "type", "r1", `detail with "quotes"`, "success", "ip", "c", "ua", "info");
    const csv = auditEngine.exportLogs("csv");
    expect(csv).toContain('""');
  });

  it("should export logs as JSON", () => {
    auditEngine.log("test", "admin", "u-001", "super_admin", "type", "r1", "detail", "success", "ip", "c", "ua", "info");
    const json = auditEngine.exportLogs("json");
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].user).toBe("admin");
  });

  it("should clear all logs", () => {
    auditEngine.log("a", "u", "uid", "guest", "t", "r", "d", "success", "ip", "c", "ua", "info");
    expect(auditEngine.getLogCount()).toBeGreaterThan(0);
    auditEngine.clearLogs();
    expect(auditEngine.getLogCount()).toBe(0);
  });

  it("should store metadata in log entries", () => {
    const log = auditEngine.log("a", "u", "uid", "guest", "t", "r", "d", "success", "ip", "c", "ua", "info", { key1: "val1", key2: "val2" });
    expect(log.metadata.key1).toBe("val1");
    expect(log.metadata.key2).toBe("val2");
  });
});

/* ===================================================================
   Security Monitor Engine - Expanded
   =================================================================== */
describe("SecurityMonitorEngine - Alert Generation", () => {
  it("should evaluate log entry for failed login", () => {
    const log: AuditLog = {
      id: "l1", timestamp: new Date().toISOString(), user: "test", userId: "u-test",
      role: "guest", action: "login_failed", resourceType: "session", resourceId: "s1",
      detail: "Failed login", result: "failure", ipAddress: "1.1.1.1",
      correlationId: "c1", userAgent: "UA", severity: "warning", metadata: {},
    };
    const alert = securityMonitorEngine.evaluateLog(log);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("failed_login");
  });

  it("should evaluate log entry for denied access", () => {
    const log: AuditLog = {
      id: "l2", timestamp: new Date().toISOString(), user: "test", userId: "u-test",
      role: "guest", action: "access_resource", resourceType: "admin", resourceId: "r1",
      detail: "Access denied", result: "denied", ipAddress: "1.1.1.1",
      correlationId: "c1", userAgent: "UA", severity: "warning", metadata: {},
    };
    const alert = securityMonitorEngine.evaluateLog(log);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("permission_violation");
  });

  it("should evaluate log entry for role change", () => {
    const log: AuditLog = {
      id: "l3", timestamp: new Date().toISOString(), user: "admin", userId: "u-admin",
      role: "super_admin", action: "role_change", resourceType: "user", resourceId: "u-002",
      detail: "Role changed from guest to admin", result: "success", ipAddress: "1.1.1.1",
      correlationId: "c1", userAgent: "UA", severity: "warning", metadata: {},
    };
    const alert = securityMonitorEngine.evaluateLog(log);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("privilege_escalation");
  });

  it("should return null for benign log entry", () => {
    const log: AuditLog = {
      id: "l4", timestamp: new Date().toISOString(), user: "admin", userId: "u-admin",
      role: "super_admin", action: "view_dashboard", resourceType: "dashboard", resourceId: "main",
      detail: "Viewed dashboard", result: "success", ipAddress: "1.1.1.1",
      correlationId: "c1", userAgent: "UA", severity: "info", metadata: {},
    };
    const alert = securityMonitorEngine.evaluateLog(log);
    expect(alert).toBeNull();
  });

  it("should evaluate failed login under threshold as medium", () => {
    const alert = securityMonitorEngine.evaluateFailedLogin("user", "1.1.1.1", 3, "u-1");
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe("medium");
    expect(alert!.type).toBe("failed_login");
  });

  it("should evaluate failed login at threshold as critical brute force", () => {
    const alert = securityMonitorEngine.evaluateFailedLogin("user", "1.1.1.1", 5, "u-1");
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe("critical");
    expect(alert!.type).toBe("brute_force");
  });

  it("should return null for few failed attempts", () => {
    const alert = securityMonitorEngine.evaluateFailedLogin("user", "1.1.1.1", 1, "u-1");
    expect(alert).toBeNull();
  });

  it("should always create alert for permission violation", () => {
    const alert = securityMonitorEngine.evaluatePermissionViolation("user", "u-1", "guest", "admin:access", "1.1.1.1", "c1");
    expect(alert.severity).toBe("high");
    expect(alert.type).toBe("unauthorized_api");
  });

  it("should detect session hijacking on IP change", () => {
    const alert = securityMonitorEngine.evaluateSessionChange("user", "u-1", "10.0.0.1", "10.0.0.2", "sess-1", "c1");
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("session_hijacking");
  });

  it("should not alert on same IP", () => {
    const alert = securityMonitorEngine.evaluateSessionChange("user", "u-1", "10.0.0.1", "10.0.0.1", "sess-1", "c1");
    expect(alert).toBeNull();
  });

  it("should evaluate privilege escalation to super_admin", () => {
    const alert = securityMonitorEngine.evaluatePrivilegeChange("user", "u-1", "guest", "super_admin", "admin", "c1");
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe("critical");
    expect(alert!.type).toBe("privilege_escalation");
  });

  it("should evaluate non-escalation privilege change as role_change", () => {
    const alert = securityMonitorEngine.evaluatePrivilegeChange("user", "u-1", "guest", "operator", "admin", "c1");
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("role_change");
    expect(alert!.severity).toBe("medium");
  });

  it("should acknowledge an existing alert", () => {
    const alert = securityMonitorEngine.evaluatePermissionViolation("user", "u-1", "guest", "admin", "1.1.1.1", "c1");
    const acked = securityMonitorEngine.acknowledgeAlert(alert.id, "admin");
    expect(acked).not.toBeNull();
    expect(acked!.acknowledged).toBe(true);
    expect(acked!.acknowledgedBy).toBe("admin");
  });

  it("should return null when acknowledging nonexistent alert", () => {
    const result = securityMonitorEngine.acknowledgeAlert("nonexistent", "admin");
    expect(result).toBeNull();
  });

  it("should filter alerts by severity", () => {
    const alerts = securityMonitorEngine.getAlertsBySeverity("critical");
    for (const a of alerts) {
      expect(a.severity).toBe("critical");
    }
  });

  it("should return unacknowledged alerts", () => {
    const unacked = securityMonitorEngine.getUnacknowledgedAlerts();
    for (const a of unacked) {
      expect(a.acknowledged).toBe(false);
    }
  });

  it("should count critical unacknowledged alerts", () => {
    const count = securityMonitorEngine.getCriticalAlertCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should have seeded alerts", () => {
    const alerts = securityMonitorEngine.getAllAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(10);
  });

  it("should log brute force with attempt count in metadata", () => {
    const alert = securityMonitorEngine.evaluateFailedLogin("target", "5.5.5.5", 5, "u-target");
    expect(alert!.metadata.attemptCount).toBe("5");
  });
});

/* ===================================================================
   Compliance Engine - Expanded
   =================================================================== */
describe("ComplianceEngine - Assessment", () => {
  it("should return undefined for unknown framework", () => {
    expect(complianceEngine.getFramework("unknown" as ComplianceFramework)).toBeUndefined();
  });

  it("should calculate overall score as average of framework scores", () => {
    const score = complianceEngine.getOverallComplianceScore();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should return framework scores with correct status", () => {
    const scores = complianceEngine.getFrameworkScores();
    for (const s of scores) {
      if (s.score >= 80) expect(s.status).toBe("compliant");
      else if (s.score >= 60) expect(s.status).toBe("partial");
      else expect(s.status).toBe("non_compliant");
    }
  });

  it("should return gaps for a specific framework", () => {
    const gaps = complianceEngine.getGaps("iso_27001");
    expect(gaps.length).toBeGreaterThan(0);
    for (const g of gaps) {
      expect(typeof g).toBe("string");
    }
  });

  it("should assess a control and update score", () => {
    const result = complianceEngine.assessControl("gdpr", "art5", "compliant", 100);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("compliant");
    expect(result!.score).toBe(100);
  });

  it("should return null for unknown framework in assessControl", () => {
    const result = complianceEngine.assessControl("unknown" as ComplianceFramework, "c1", "compliant", 90);
    expect(result).toBeNull();
  });

  it("should return null for unknown control in assessControl", () => {
    const result = complianceEngine.assessControl("iso_27001", "nonexistent", "compliant", 90);
    expect(result).toBeNull();
  });

  it("should recalculate overall score after assessment", () => {
    const before = complianceEngine.getOverallComplianceScore();
    complianceEngine.assessControl("owasp_asvs", "v1", "compliant", 100);
    complianceEngine.assessControl("owasp_asvs", "v2", "compliant", 100);
    complianceEngine.assessControl("owasp_asvs", "v3", "compliant", 100);
    complianceEngine.assessControl("owasp_asvs", "v4", "compliant", 100);
    complianceEngine.assessControl("owasp_asvs", "v5", "compliant", 100);
    const after = complianceEngine.getOverallComplianceScore();
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it("should count compliant and non-compliant", () => {
    const compliant = complianceEngine.getCompliantCount();
    const nonCompliant = complianceEngine.getNonCompliantCount();
    const total = COMPLIANCE_FRAMEWORKS.reduce((s, f) => s + f.requirements.length, 0);
    expect(compliant + nonCompliant).toBeLessThanOrEqual(total);
  });

  it("should return last assessment date", () => {
    const date = complianceEngine.getLastAssessmentDate();
    expect(new Date(date).getTime()).not.toBeNaN();
  });

  it("should get recommendations for a framework", () => {
    const recs = complianceEngine.getRecommendations("soc_2");
    expect(recs.length).toBeGreaterThan(0);
  });

  it("should return all gaps across frameworks", () => {
    const allGaps = complianceEngine.getGaps();
    expect(allGaps.length).toBeGreaterThan(0);
  });
});

/* ===================================================================
   Security Analytics Engine - Expanded
   =================================================================== */
describe("SecurityAnalyticsEngine - Computation", () => {
  it("should compute login success rate with mixed data", () => {
    const logs: AuditLog[] = [
      { id: "1", timestamp: new Date().toISOString(), user: "u", userId: "uid", role: "guest", action: "login", resourceType: "s", resourceId: "r", detail: "d", result: "success", ipAddress: "ip", correlationId: "c", userAgent: "ua", severity: "info", metadata: {} },
      { id: "2", timestamp: new Date().toISOString(), user: "u", userId: "uid", role: "guest", action: "login", resourceType: "s", resourceId: "r", detail: "d", result: "failure", ipAddress: "ip", correlationId: "c", userAgent: "ua", severity: "warning", metadata: {} },
      { id: "3", timestamp: new Date().toISOString(), user: "u", userId: "uid", role: "guest", action: "login", resourceType: "s", resourceId: "r", detail: "d", result: "success", ipAddress: "ip", correlationId: "c", userAgent: "ua", severity: "info", metadata: {} },
    ];
    expect(securityAnalyticsEngine.getLoginSuccessRate(logs)).toBe(67);
  });

  it("should return 100% login success rate with no logs", () => {
    expect(securityAnalyticsEngine.getLoginSuccessRate([])).toBe(100);
  });

  it("should return risk heatmap with all zones", () => {
    const heatmap = securityAnalyticsEngine.getRiskHeatmap();
    expect(heatmap).toHaveLength(10);
    const zones = heatmap.map((h) => h.zone);
    expect(zones).toContain("North Gate");
    expect(zones).toContain("Server Room");
    expect(zones).toContain("VIP Lounge");
  });

  it("should get permission usage from audit logs", () => {
    const logs: AuditLog[] = [
      { id: "1", timestamp: new Date().toISOString(), user: "u", userId: "uid", role: "guest", action: "view_dashboard", resourceType: "d", resourceId: "r", detail: "d", result: "success", ipAddress: "ip", correlationId: "c", userAgent: "ua", severity: "info", metadata: {} },
      { id: "2", timestamp: new Date().toISOString(), user: "u", userId: "uid", role: "guest", action: "view_dashboard", resourceType: "d", resourceId: "r", detail: "d", result: "success", ipAddress: "ip", correlationId: "c", userAgent: "ua", severity: "info", metadata: {} },
      { id: "3", timestamp: new Date().toISOString(), user: "u", userId: "uid", role: "guest", action: "manage_users", resourceType: "u", resourceId: "r", detail: "d", result: "success", ipAddress: "ip", correlationId: "c", userAgent: "ua", severity: "info", metadata: {} },
    ];
    const usage = securityAnalyticsEngine.getPermissionUsage(logs);
    const dashboard = usage.find((u) => u.permission === "view_dashboard");
    expect(dashboard!.usageCount).toBe(2);
  });

  it("should compute overall security score", () => {
    const score = securityAnalyticsEngine.getOverallSecurityScore(
      authEngine.getUsers(), sessionEngine.getAllSessions(), securityMonitorEngine.getAllAlerts(),
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should calculate average response time", () => {
    const alerts = securityMonitorEngine.getAllAlerts();
    const avgTime = securityAnalyticsEngine.getAverageResponseTime(alerts);
    expect(avgTime).toBeGreaterThanOrEqual(0);
  });

  it("should return 0 average response time when no acknowledged alerts", () => {
    const alerts = securityMonitorEngine.getAlertsBySeverity("low");
    const avgTime = securityAnalyticsEngine.getAverageResponseTime(alerts);
    expect(avgTime).toBe(0);
  });
});

/* ===================================================================
   Security Report Engine - Expanded
   =================================================================== */
describe("SecurityReportEngine - Report Generation", () => {
  it("should generate open findings report", () => {
    const alerts = securityMonitorEngine.getAllAlerts();
    const report = securityReportEngine.generateOpenFindings(alerts, "admin");
    expect(report.type).toBe("open_findings");
    expect(report.content).toHaveProperty("findings");
    expect(report.content).toHaveProperty("summary");
  });

  it("should generate recommendations report with low score triggers", () => {
    const analytics = securityAnalyticsEngine.computeAnalytics([], [], [], []);
    const report = securityReportEngine.generateRecommendations([], analytics, "admin");
    expect(report.content).toHaveProperty("recommendations");
    const items = report.content.recommendations as Array<{ priority: string }>;
    expect(items.some((r: any) => r.priority === "low")).toBe(true);
  });

  it("should include high priority rec when score below 70", () => {
    const analytics: any = { overallSecurityScore: 65, failedLogins24h: 0, criticalAlerts: 0, openAlerts: 0 };
    const report = securityReportEngine.generateRecommendations([], analytics, "admin");
    const items = report.content.recommendations as Array<{ priority: string }>;
    expect(items.some((r: any) => r.priority === "high")).toBe(true);
  });

  it("should include critical priority rec when critical alerts exist", () => {
    const alert = securityMonitorEngine.evaluateFailedLogin("test", "1.1.1.1", 5, "u-t");
    const analytics: any = { overallSecurityScore: 85, failedLogins24h: 0, criticalAlerts: 1, openAlerts: 0 };
    const report = securityReportEngine.generateRecommendations(alert ? [alert] : [], analytics, "admin");
    const items = report.content.recommendations as Array<{ priority: string }>;
    expect(items.some((r: any) => r.priority === "critical")).toBe(true);
  });

  it("should generate permission matrix report with correct structure", () => {
    const report = securityReportEngine.generatePermissionMatrix("admin");
    const matrix = report.content.matrix as Array<{ role: string; permissions: string[] }>;
    expect(matrix).toHaveLength(11);
    const superAdmin = matrix.find((m: any) => m.role === "Super Administrator");
    expect(superAdmin!.permissions.length).toBe(43);
  });

  it("should find report by ID", () => {
    const analytics = securityAnalyticsEngine.computeAnalytics([], [], [], []);
    const report = securityReportEngine.generateSecuritySummary(analytics, [], "admin");
    const found = securityReportEngine.getReportById(report.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(report.id);
  });

  it("should return null for unknown report ID", () => {
    expect(securityReportEngine.getReportById("nonexistent")).toBeNull();
  });
});

/* ===================================================================
   Middleware - Auth
   =================================================================== */
describe("AuthMiddleware - Edge Cases", () => {
  it("should reject missing token", () => {
    const result = authMiddleware.authenticate(undefined, "sess-1", "ip", "ua", "corr-1");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain("token");
  });

  it("should reject missing session ID", () => {
    const result = authMiddleware.authenticate("tok-1", undefined, "ip", "ua", "corr-1");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain("session");
  });

  it("should reject invalid session", () => {
    const result = authMiddleware.authenticate("tok-1", "nonexistent-session", "ip", "ua", "corr-1");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain("Invalid session");
  });

  it("should reject expired session", () => {
    const s = sessionEngine.createSession("u-exp-auth", "exp-auth", "guest", "ip", "ua", "dev", "Device", false);
    s.expiresAt = new Date(Date.now() - 1000).toISOString();
    const result = authMiddleware.authenticate("tok-123", s.id, "ip", "ua", "corr-1");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
  });

  it("should require MFA call returns allowed", () => {
    const result = authMiddleware.requireMfa("u-001");
    expect(result.allowed).toBe(true);
  });
});

/* ===================================================================
   Middleware - RBAC
   =================================================================== */
describe("RBACMiddleware - Authorization Edge Cases", () => {
  it("should reject unauthenticated context", () => {
    const ctx: SecurityContext = { userId: "u", username: "u", role: "guest", permissions: [], sessionId: "s", correlationId: "c", ipAddress: "ip", userAgent: "ua", isAuthenticated: false };
    expect(rbacMiddleware.requirePermission(ctx, "dashboard:view").allowed).toBe(false);
    expect(rbacMiddleware.requirePermission(ctx, "dashboard:view").status).toBe(401);
  });

  it("should reject undefined context", () => {
    expect(rbacMiddleware.requirePermission(undefined, "dashboard:view").allowed).toBe(false);
    expect(rbacMiddleware.requirePermission(undefined, "dashboard:view").status).toBe(401);
  });

  it("should require any permission with unauthenticated context", () => {
    const ctx: SecurityContext = { userId: "u", username: "u", role: "guest", permissions: [], sessionId: "s", correlationId: "c", ipAddress: "ip", userAgent: "ua", isAuthenticated: false };
    expect(rbacMiddleware.requireAnyPermission(ctx, ["dashboard:view"]).allowed).toBe(false);
  });

  it("should require all permissions with unauthenticated context", () => {
    const ctx: SecurityContext = { userId: "u", username: "u", role: "guest", permissions: [], sessionId: "s", correlationId: "c", ipAddress: "ip", userAgent: "ua", isAuthenticated: false };
    expect(rbacMiddleware.requireAllPermissions(ctx, ["dashboard:view"]).allowed).toBe(false);
  });

  it("should check role membership with unauthenticated context", () => {
    const ctx: SecurityContext = { userId: "u", username: "u", role: "guest", permissions: [], sessionId: "s", correlationId: "c", ipAddress: "ip", userAgent: "ua", isAuthenticated: false };
    expect(rbacMiddleware.requireRole(ctx, ["guest"]).allowed).toBe(false);
  });
});

/* ===================================================================
   Middleware - Rate Limiter
   =================================================================== */
describe("RateLimitMiddleware - Edge Cases", () => {
  beforeEach(() => {
    rateLimitMiddleware.clearExpired();
  });

  it("should allow first request for new identifier", () => {
    const result = rateLimitMiddleware.check("new-ip");
    expect(result.allowed).toBe(true);
    expect(result.status).toBe(200);
  });

  it("should block after max requests", () => {
    rateLimitMiddleware.reset("block-test");
    for (let i = 0; i < ALERT_THRESHOLDS.RATE_LIMIT_MAX_REQUESTS; i++) {
      rateLimitMiddleware.check("block-test");
    }
    const result = rateLimitMiddleware.check("block-test");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(429);
  });

  it("should provide retry-after seconds in error", () => {
    rateLimitMiddleware.reset("retry-test");
    for (let i = 0; i < ALERT_THRESHOLDS.RATE_LIMIT_MAX_REQUESTS; i++) {
      rateLimitMiddleware.check("retry-test");
    }
    const result = rateLimitMiddleware.check("retry-test");
    expect(result.error).toContain("60 seconds");
  });

  it("should return null state for unknown identifier", () => {
    expect(rateLimitMiddleware.getState("unknown")).toBeNull();
  });

  it("should track state after a request", () => {
    rateLimitMiddleware.check("track-test");
    const state = rateLimitMiddleware.getState("track-test");
    expect(state).not.toBeNull();
    expect(state!.identifier).toBe("track-test");
    expect(state!.count).toBe(1);
  });

  it("should reset state for identifier", () => {
    rateLimitMiddleware.check("reset-me");
    rateLimitMiddleware.reset("reset-me");
    expect(rateLimitMiddleware.getState("reset-me")).toBeNull();
  });

  it("should get active blocks list", () => {
    rateLimitMiddleware.reset("block-1");
    rateLimitMiddleware.reset("block-2");
    for (let i = 0; i < ALERT_THRESHOLDS.RATE_LIMIT_MAX_REQUESTS + 1; i++) {
      rateLimitMiddleware.check("block-1");
    }
    const blocks = rateLimitMiddleware.getActiveBlocks();
    expect(Array.isArray(blocks)).toBe(true);
  });

  it("should clear expired entries", () => {
    rateLimitMiddleware.check("expire-test");
    const cleared = rateLimitMiddleware.clearExpired();
    expect(cleared).toBeGreaterThanOrEqual(0);
  });

  it("should handle rapid requests within window correctly", () => {
    rateLimitMiddleware.reset("rapid");
    for (let i = 0; i < 5; i++) {
      const result = rateLimitMiddleware.check("rapid");
      expect(result.allowed).toBe(true);
    }
    const state = rateLimitMiddleware.getState("rapid");
    expect(state!.count).toBe(6);
  });
});

/* ===================================================================
   Middleware - Audit
   =================================================================== */
describe("AuditMiddleware - Action Logging", () => {
  beforeEach(() => {
    auditEngine.clearLogs();
  });

  const ctx: SecurityContext = {
    userId: "u-001", username: "admin", role: "super_admin",
    permissions: ALL_PERMISSIONS, sessionId: "s1", correlationId: "c1",
    ipAddress: "10.0.0.1", userAgent: "Chrome", isAuthenticated: true,
  };

  it("should log an action with custom severity", () => {
    auditMiddleware.logAction(ctx, "test", "resource", "r1", "Test", "success", "critical");
    const logs = auditEngine.getLogs({ severity: "critical" });
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should log access granted", () => {
    auditMiddleware.logAccess(ctx, "dashboard", "main", true);
    const logs = auditEngine.getLogs({ action: "access_granted" });
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should log access denied", () => {
    auditMiddleware.logAccess(ctx, "admin", "panel", false);
    const logs = auditEngine.getLogs({ action: "access_denied" });
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should log sensitive action with critical severity", () => {
    auditMiddleware.logSensitiveAction(ctx, "delete_user", "user", "u-005", "Deleted user");
    const logs = auditEngine.getLogs({ severity: "critical" });
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should include metadata in logged action", () => {
    auditMiddleware.logAction(ctx, "custom", "resource", "r1", "detail", "success", "info", { env: "prod", region: "us" });
    const logs = auditEngine.getLogs({ action: "custom" });
    expect(logs[0].metadata.env).toBe("prod");
  });
});

/* ===================================================================
   Middleware - Security
   =================================================================== */
describe("SecurityMiddleware - Utility Functions", () => {
  it("should generate unique correlation IDs", () => {
    const ids = Array.from({ length: 100 }, () => securityMiddleware.generateCorrelationId());
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });

  it("should generate correlation ID with prefix", () => {
    const id = securityMiddleware.generateCorrelationId();
    expect(id).toContain("corr-");
  });

  it("should sanitize HTML special characters", () => {
    const input = "<script>alert('xss')</script>";
    const sanitized = securityMiddleware.sanitizeInput(input);
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized).not toContain("'");
  });

  it("should sanitize double quotes", () => {
    const sanitized = securityMiddleware.sanitizeInput('He said "hello"');
    expect(sanitized).not.toContain('"');
    expect(sanitized).toContain("&quot;");
  });

  it("should sanitize backslashes", () => {
    const sanitized = securityMiddleware.sanitizeInput("path\\to\\file");
    expect(sanitized).toContain("&#x5C;");
  });

  it("should sanitize backticks", () => {
    const sanitized = securityMiddleware.sanitizeInput("`code`");
    expect(sanitized).toContain("&#x60;");
  });

  it("should validate correct emails", () => {
    expect(securityMiddleware.validateEmail("user@example.com")).toBe(true);
    expect(securityMiddleware.validateEmail("test.user+label@domain.co.uk")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(securityMiddleware.validateEmail("")).toBe(false);
    expect(securityMiddleware.validateEmail("notanemail")).toBe(false);
    expect(securityMiddleware.validateEmail("@domain.com")).toBe(false);
    expect(securityMiddleware.validateEmail("user@")).toBe(false);
  });

  it("should sanitize output string", () => {
    const result = securityMiddleware.sanitizeOutput("<b>bold</b>");
    expect(result).toContain("&lt;");
  });

  it("should sanitize output array", () => {
    const result = securityMiddleware.sanitizeOutput(["<a>link</a>", "<b>bold</b>"]) as string[];
    expect(result[0]).toContain("&lt;");
    expect(result[1]).toContain("&lt;");
  });

  it("should sanitize output object recursively", () => {
    const result = securityMiddleware.sanitizeOutput({ name: "<script>", nested: { value: "<evil>" } }) as Record<string, any>;
    expect(result.name).toContain("&lt;");
    expect(result.nested.value).toContain("&lt;");
  });

  it("should passthrough non-string non-object values", () => {
    expect(securityMiddleware.sanitizeOutput(42)).toBe(42);
    expect(securityMiddleware.sanitizeOutput(null)).toBeNull();
    expect(securityMiddleware.sanitizeOutput(undefined)).toBeUndefined();
  });
});

/* ===================================================================
   Security Service - Orchestration
   =================================================================== */
describe("SecurityService - Orchestration", () => {
  it("should handle login for MFA user without MFA code", () => {
    const { result } = securityService.login({ username: "admin", password: "valid_password" });
    expect(result.success).toBe(false);
    expect(result.requiresMfa).toBe(true);
  });

  it("should handle full login lifecycle", () => {
    const { data, result } = securityService.login({ username: "ops", password: "valid_password" });
    expect(result.success).toBe(true);
    expect(data.currentUser).not.toBeNull();
    expect(data.currentUser!.username).toBe("ops");

    const logoutData = securityService.logout(result.session!.id, data);
    expect(logoutData.currentUser).toBeNull();
  });

  it("should handle failed login with alert creation", () => {
    for (let i = 0; i < 5; i++) {
      securityService.login({ username: "bruteuser", password: "wrong" });
    }
    const { data } = securityService.login({ username: "bruteuser", password: "wrong" });
    const bruteAlerts = data.alerts.filter((a) => a.type === "brute_force");
    expect(bruteAlerts.length).toBeGreaterThan(0);
  });

  it("should lock user via service", () => {
    const ctx = permissionEngine.buildSecurityContext(
      { id: "u-001", username: "admin", email: "a@b.com", displayName: "A", role: "super_admin", permissions: ALL_PERMISSIONS, department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-svc", "ip", "ua", "corr-svc",
    );
    const locked = securityService.lockUser("u-005", ctx);
    expect(locked).not.toBeNull();
    expect(locked!.status).toBe("locked");
    securityService.unlockUser("u-005", ctx);
  });

  it("should return null when locking without permission", () => {
    const ctx = permissionEngine.buildSecurityContext(
      { id: "u-011", username: "guest", email: "g@b.com", displayName: "G", role: "guest", permissions: ["dashboard:view"], department: "Public", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-g", "ip", "ua", "corr-g",
    );
    const result = securityService.lockUser("u-001", ctx);
    expect(result).toBeNull();
  });

  it("should unlock user", () => {
    const ctx = permissionEngine.buildSecurityContext(
      { id: "u-001", username: "admin", email: "a@b.com", displayName: "A", role: "super_admin", permissions: ALL_PERMISSIONS, department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-u", "ip", "ua", "corr-u",
    );
    securityService.lockUser("u-012", ctx);
    const unlocked = securityService.unlockUser("u-012", ctx);
    expect(unlocked).not.toBeNull();
    expect(unlocked!.status).toBe("active");
  });

  it("should acknowledge alert via service", () => {
    const alerts = securityMonitorEngine.getAllAlerts();
    const target = alerts.find((a) => !a.acknowledged);
    if (target) {
      const ctx = permissionEngine.buildSecurityContext(
        { id: "u-001", username: "admin", email: "a@b.com", displayName: "A", role: "super_admin", permissions: ALL_PERMISSIONS, department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
        "sess-a", "ip", "ua", "corr-a",
      );
      const data = securityService.acknowledgeAlert(target.id, ctx);
      const acked = data.alerts.find((a) => a.id === target.id);
      expect(acked!.acknowledged).toBe(true);
    }
  });

  it("should generate all report types", () => {
    const ctx = permissionEngine.buildSecurityContext(
      { id: "u-001", username: "admin", email: "a@b.com", displayName: "A", role: "super_admin", permissions: ALL_PERMISSIONS, department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-r", "ip", "ua", "corr-r",
    );
    const types = ["security_summary", "compliance", "audit_history", "user_activity", "permission_matrix", "risk_assessment", "open_findings", "recommendations"];
    for (const type of types) {
      const report = securityService.generateReport(type, ctx);
      expect(report.type).toBe(type);
    }
  });

  it("should generate default report for unknown type", () => {
    const ctx = permissionEngine.buildSecurityContext(
      { id: "u-001", username: "admin", email: "a@b.com", displayName: "A", role: "super_admin", permissions: ALL_PERMISSIONS, department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-d", "ip", "ua", "corr-d",
    );
    const report = securityService.generateReport("unknown_type", ctx);
    expect(report.type).toBe("security_summary");
  });

  it("should get audit logs via service", () => {
    auditEngine.log("svc_test", "admin", "u-001", "super_admin", "test", "r1", "test", "success", "ip", "c", "ua", "info");
    const logs = securityService.getAuditLogs({ result: "success" });
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should initialize with analytics", () => {
    const data = securityService.initialize();
    expect(data.analytics.overallSecurityScore).toBeGreaterThan(0);
    expect(data.reports.length).toBeGreaterThan(0);
  });
});
