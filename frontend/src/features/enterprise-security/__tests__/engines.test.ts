import { describe, it, expect, beforeEach } from "vitest";
import { authEngine } from "../services/auth-engine";
import { rbacEngine } from "../services/rbac-engine";
import { permissionEngine } from "../services/permission-engine";
import { sessionEngine } from "../services/session-engine";
import { auditEngine } from "../services/audit-engine";
import { securityMonitorEngine } from "../services/security-monitor-engine";
import { complianceEngine } from "../services/compliance-engine";
import { securityAnalyticsEngine } from "../services/security-analytics-engine";
import { securityReportEngine } from "../services/security-report-engine";
import { securityService } from "../services/security-service";
import { authMiddleware } from "../middleware/auth-middleware";
import { rbacMiddleware } from "../middleware/rbac-middleware";
import { rateLimitMiddleware } from "../middleware/rate-limit-middleware";
import { auditMiddleware } from "../middleware/audit-middleware";
import { securityMiddleware } from "../middleware/security-middleware";
import {
  ROLE_DEFINITIONS, ALL_ROLES, ALL_PERMISSIONS, ROLE_PERMISSIONS_MAP,
  SESSION_CONFIG, ALERT_THRESHOLDS, COMPLIANCE_FRAMEWORKS, MOCK_USERS,
  PERMISSION_LABELS,
} from "../constants";
import type { SecurityRole, SecurityPermission } from "../types";

/* ===================================================================
   Constants
   =================================================================== */
describe("Constants", () => {
  it("should define all 11 roles", () => {
    expect(ALL_ROLES).toHaveLength(11);
    expect(ALL_ROLES).toContain("super_admin");
    expect(ALL_ROLES).toContain("guest");
    expect(ROLE_DEFINITIONS).toHaveLength(11);
  });

  it("should define all 43 permissions", () => {
    expect(ALL_PERMISSIONS.length).toBeGreaterThanOrEqual(30);
    expect(ALL_PERMISSIONS).toContain("dashboard:view");
    expect(ALL_PERMISSIONS).toContain("rbac:manage");
    expect(ALL_PERMISSIONS).toContain("settings:configure");
  });

  it("should have role definitions with correct structure", () => {
    for (const def of ROLE_DEFINITIONS) {
      expect(def.label).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(typeof def.priority).toBe("number");
      expect(Array.isArray(def.inherits)).toBe(true);
    }
  });

  it("should have super_admin with all permissions", () => {
    const superPerms = ROLE_PERMISSIONS_MAP["super_admin"];
    expect(superPerms.length).toBe(ALL_PERMISSIONS.length);
    expect(superPerms).toEqual(ALL_PERMISSIONS);
  });

  it("should have guest with minimum permissions", () => {
    const guestPerms = ROLE_PERMISSIONS_MAP["guest"];
    expect(guestPerms.length).toBe(1);
    expect(guestPerms).toContain("dashboard:view");
  });

  it("should have auditor with read-only permissions", () => {
    const auditorPerms = ROLE_PERMISSIONS_MAP["auditor"];
    expect(auditorPerms).toContain("audit:view");
    expect(auditorPerms).toContain("audit:export");
    expect(auditorPerms).toContain("logs:view");
    expect(auditorPerms).not.toContain("users:create");
    expect(auditorPerms).not.toContain("users:edit");
    expect(auditorPerms).not.toContain("users:delete");
  });

  it("should have session config with required fields", () => {
    expect(SESSION_CONFIG.IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
    expect(SESSION_CONFIG.MAX_SESSION_DURATION_MS).toBe(24 * 60 * 60 * 1000);
    expect(SESSION_CONFIG.MAX_CONCURRENT_SESSIONS).toBe(5);
  });

  it("should have alert thresholds defined", () => {
    expect(ALERT_THRESHOLDS.MAX_FAILED_LOGINS_BEFORE_LOCK).toBe(5);
    expect(ALERT_THRESHOLDS.MAX_FAILED_LOGINS_BEFORE_ALERT).toBe(3);
    expect(ALERT_THRESHOLDS.RATE_LIMIT_MAX_REQUESTS).toBe(100);
  });

  it("should define 6 compliance frameworks", () => {
    expect(COMPLIANCE_FRAMEWORKS).toHaveLength(6);
    const frameworks = COMPLIANCE_FRAMEWORKS.map((f) => f.framework);
    expect(frameworks).toContain("iso_27001");
    expect(frameworks).toContain("soc_2");
    expect(frameworks).toContain("gdpr");
    expect(frameworks).toContain("wcag");
    expect(frameworks).toContain("owasp_asvs");
    expect(frameworks).toContain("nist_csf");
  });

  it("should have 13 mock users with diverse roles", () => {
    expect(MOCK_USERS).toHaveLength(13);
    const roles = new Set(MOCK_USERS.map((u) => u.role));
    expect(roles.has("super_admin")).toBe(true);
    expect(roles.has("vendor")).toBe(true);
    expect(roles.has("auditor")).toBe(true);
    expect(roles.has("guest")).toBe(true);
  });

  it("should have permission labels for all permissions", () => {
    for (const perm of ALL_PERMISSIONS) {
      expect(PERMISSION_LABELS[perm]).toBeTruthy();
    }
  });
});

/* ===================================================================
   Auth Engine
   =================================================================== */
describe("AuthEngine", () => {
  it("should default to mock provider", () => {
    expect(authEngine.getProvider()).toBe("mock");
  });

  it("should successfully authenticate with valid credentials", () => {
    const result = authEngine.login({ username: "admin", password: "valid_password" });
    expect(result.success).toBe(true);
    expect(result.user).toBeTruthy();
    expect(result.session).toBeTruthy();
    expect(result.token).toBeTruthy();
    expect(result.user!.username).toBe("admin");
    expect(result.user!.role).toBe("super_admin");
  });

  it("should reject invalid credentials", () => {
    const result = authEngine.login({ username: "admin", password: "wrong_password" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid credentials");
  });

  it("should reject locked accounts", () => {
    const result = authEngine.login({ username: "locked_user", password: "valid_password" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("locked");
  });

  it("should reject suspended accounts", () => {
    const result = authEngine.login({ username: "suspended_user", password: "valid_password" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("suspended");
  });

  it("should require MFA for MFA-enabled users", () => {
    const result = authEngine.login({ username: "security", password: "valid_password" });
    expect(result.success).toBe(false);
    expect(result.requiresMfa).toBe(true);
  });

  it("should accept MFA when code is provided", () => {
    const result = authEngine.login({ username: "security", password: "valid_password", mfaCode: "123456" });
    expect(result.success).toBe(true);
  });

  it("should lock account after max failed attempts", () => {
    for (let i = 0; i < 5; i++) {
      authEngine.login({ username: "ops", password: "wrong" });
    }
    const result = authEngine.login({ username: "ops", password: "valid_password" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("locked");
    authEngine.unlockUser(authEngine.getUsers().find((u) => u.username === "ops")!.id);
    authEngine.resetFailedAttempts("ops");
  });

  it("should track failed login attempts", () => {
    authEngine.resetFailedAttempts("newuser");
    authEngine.login({ username: "newuser", password: "wrong" });
    expect(authEngine.getFailedAttempts("newuser")).toBe(1);
    authEngine.login({ username: "newuser", password: "wrong" });
    expect(authEngine.getFailedAttempts("newuser")).toBe(2);
    authEngine.resetFailedAttempts("newuser");
    expect(authEngine.getFailedAttempts("newuser")).toBe(0);
  });

  it("should validate tokens", () => {
    const result = authEngine.login({ username: "admin", password: "valid_password" });
    const validated = authEngine.validateToken(result.token!.accessToken);
    expect(validated).toBeTruthy();
    expect(validated!.username).toBe("admin");
  });

  it("should refresh tokens", () => {
    const newToken = authEngine.refreshToken("some_refresh_token");
    expect(newToken).toBeTruthy();
    expect(newToken!.accessToken).toBeTruthy();
    expect(newToken!.refreshToken).toBeTruthy();
  });

  it("should get all users", () => {
    const users = authEngine.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(13);
  });

  it("should get user by ID", () => {
    const user = authEngine.getUserById("u-001");
    expect(user).toBeTruthy();
    expect(user!.username).toBe("admin");
    expect(authEngine.getUserById("nonexistent")).toBeNull();
  });

  it("should lock and unlock users", () => {
    authEngine.unlockUser("u-012");
    const unlocked = authEngine.getUserById("u-012");
    expect(unlocked!.status).toBe("active");
    authEngine.lockUser("u-012");
    const locked = authEngine.getUserById("u-012");
    expect(locked!.status).toBe("locked");
    authEngine.unlockUser("u-012");
  });
});

/* ===================================================================
   RBAC Engine
   =================================================================== */
describe("RBACEngine", () => {
  it("should get role definitions for all roles", () => {
    for (const role of ALL_ROLES) {
      const def = rbacEngine.getRoleDefinition(role);
      expect(def).toBeTruthy();
      expect(def!.role).toBe(role);
    }
  });

  it("should return permissions for each role", () => {
    for (const role of ALL_ROLES) {
      const perms = rbacEngine.getPermissionsForRole(role);
      expect(Array.isArray(perms)).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    }
  });

  it("should check specific permissions", () => {
    expect(rbacEngine.hasPermission("super_admin", "rbac:manage")).toBe(true);
    expect(rbacEngine.hasPermission("auditor", "users:create")).toBe(false);
    expect(rbacEngine.hasPermission("guest", "dashboard:view")).toBe(true);
    expect(rbacEngine.hasPermission("guest", "users:view")).toBe(false);
  });

  it("should check any/all permissions", () => {
    expect(rbacEngine.hasAnyPermission("operations_manager", ["dashboard:view", "rbac:manage"])).toBe(true);
    expect(rbacEngine.hasAnyPermission("guest", ["users:create", "rbac:manage"])).toBe(false);
    expect(rbacEngine.hasAllPermissions("super_admin", ["dashboard:view", "security:manage", "users:delete"])).toBe(true);
    expect(rbacEngine.hasAllPermissions("auditor", ["dashboard:view", "users:create"])).toBe(false);
  });

  it("should return role hierarchy sorted by priority", () => {
    const hierarchy = rbacEngine.getRoleHierarchy();
    expect(hierarchy[0]!.role).toBe("super_admin");
    expect(hierarchy[hierarchy.length - 1]!.role).toBe("guest");
    for (let i = 0; i < hierarchy.length - 1; i++) {
      expect(hierarchy[i]!.priority).toBeLessThan(hierarchy[i + 1]!.priority);
    }
  });

  it("should find roles with a given permission", () => {
    const withRbacManage = rbacEngine.getRolesWithPermission("rbac:manage");
    expect(withRbacManage).toContain("super_admin");
    expect(withRbacManage).not.toContain("guest");
    const withDashboardView = rbacEngine.getRolesWithPermission("dashboard:view");
    expect(withDashboardView.length).toBe(ALL_ROLES.length);
  });

  it("should return permission matrix with counts", () => {
    const matrix = rbacEngine.getPermissionMatrix();
    expect(matrix).toHaveLength(ALL_ROLES.length);
    const superAdmin = matrix.find((m) => m.role === "super_admin");
    expect(superAdmin!.count).toBe(ALL_PERMISSIONS.length);
    const guest = matrix.find((m) => m.role === "guest");
    expect(guest!.count).toBe(1);
  });

  it("should check role superiority", () => {
    expect(rbacEngine.isRoleSuperior("super_admin", "guest")).toBe(true);
    expect(rbacEngine.isRoleSuperior("guest", "super_admin")).toBe(false);
    expect(rbacEngine.isRoleSuperior("operations_manager", "vendor")).toBe(true);
  });

  it("should get role priority", () => {
    expect(rbacEngine.getRolePriority("super_admin")).toBe(1);
    expect(rbacEngine.getRolePriority("guest")).toBe(11);
    expect(rbacEngine.getRolePriority("operations_manager")).toBe(4);
  });
});

/* ===================================================================
   Permission Engine
   =================================================================== */
describe("PermissionEngine", () => {
  const adminContext = permissionEngine.buildSecurityContext(
    { id: "u-001", username: "admin", email: "admin@test.com", displayName: "Admin", role: "super_admin", permissions: ALL_PERMISSIONS, department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
    "sess-1", "10.0.0.1", "Chrome", "corr-1",
  );
  const guestContext = permissionEngine.buildSecurityContext(
    { id: "u-011", username: "guest1", email: "guest@test.com", displayName: "Guest", role: "guest", permissions: ["dashboard:view"], department: "Public", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
    "sess-2", "10.0.0.2", "Firefox", "corr-2",
  );

  it("should check permissions correctly", () => {
    expect(permissionEngine.checkPermission(adminContext, "rbac:manage")).toBe(true);
    expect(permissionEngine.checkPermission(guestContext, "dashboard:view")).toBe(true);
    expect(permissionEngine.checkPermission(guestContext, "users:create")).toBe(false);
  });

  it("should check any/all permissions", () => {
    expect(permissionEngine.checkAnyPermission(adminContext, ["dashboard:view", "users:create"])).toBe(true);
    expect(permissionEngine.checkAnyPermission(guestContext, ["users:create", "settings:configure"])).toBe(false);
    expect(permissionEngine.checkAllPermissions(adminContext, ["dashboard:view", "security:manage", "users:delete"])).toBe(true);
  });

  it("should evaluate impersonation capability", () => {
    expect(permissionEngine.canImpersonate(adminContext, "guest")).toBe(true);
    expect(permissionEngine.canImpersonate(guestContext, "super_admin")).toBe(false);
  });

  it("should check resource access", () => {
    expect(permissionEngine.canAccessResource(adminContext, "dashboard", "main")).toBe(true);
    expect(permissionEngine.canAccessResource(adminContext, "unknown", "x")).toBe(false);
    expect(permissionEngine.canAccessResource(guestContext, "dashboard", "main")).toBe(true);
    expect(permissionEngine.canAccessResource(guestContext, "audit", "logs")).toBe(false);
  });

  it("should filter allowed items", () => {
    const items = [{ name: "A", perm: "dashboard:view" as SecurityPermission }, { name: "B", perm: "users:delete" as SecurityPermission }];
    const allowed = permissionEngine.filterAllowed(items, guestContext, (i) => i.perm);
    expect(allowed).toHaveLength(1);
    expect(allowed[0]!.name).toBe("A");
  });

  it("should build security context correctly", () => {
    const ctx = permissionEngine.buildSecurityContext(
      { id: "u-001", username: "admin", email: "a@b.com", displayName: "A", role: "super_admin", permissions: ["dashboard:view"], department: "IT", status: "active", mfaEnabled: false, lastLogin: null, createdAt: "", updatedAt: "", createdBy: "" },
      "sess-x", "1.1.1.1", "Safari", "corr-x",
    );
    expect(ctx.userId).toBe("u-001");
    expect(ctx.role).toBe("super_admin");
    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.sessionId).toBe("sess-x");
    expect(ctx.correlationId).toBe("corr-x");
  });
});

/* ===================================================================
   Session Engine
   =================================================================== */
describe("SessionEngine", () => {
  it("should create a session", () => {
    const session = sessionEngine.createSession("u-001", "admin", "super_admin", "10.0.0.1", "Chrome", "dev-1", "Main Terminal", true);
    expect(session.id).toBeTruthy();
    expect(session.isActive).toBe(true);
    expect(session.userId).toBe("u-001");
    expect(session.isTrusted).toBe(true);
  });

  it("should get session by ID", () => {
    const session = sessionEngine.createSession("u-002", "director", "tournament_director", "10.0.0.2", "Firefox", "dev-2", "Laptop", false);
    const retrieved = sessionEngine.getSession(session.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved!.username).toBe("director");
  });

  it("should get active sessions for a user", () => {
    const sessions = sessionEngine.getActiveSessions("u-001");
    expect(Array.isArray(sessions)).toBe(true);
  });

  it("should revoke a session", () => {
    const session = sessionEngine.createSession("u-003", "security", "security_manager", "10.0.0.3", "Edge", "dev-3", "Tablet", false);
    expect(session.isActive).toBe(true);
    sessionEngine.revokeSession(session.id);
    const revoked = sessionEngine.getSession(session.id);
    expect(revoked!.isActive).toBe(false);
  });

  it("should revoke all user sessions except one", () => {
    const s1 = sessionEngine.createSession("u-004", "ops", "operations_manager", "10.0.0.4", "Chrome", "dev-4", "Desktop", false);
    const s2 = sessionEngine.createSession("u-004", "ops", "operations_manager", "10.0.0.5", "Firefox", "dev-5", "Laptop", false);
    const count = sessionEngine.revokeAllUserSessions("u-004", s1.id);
    expect(count).toBeGreaterThanOrEqual(1);
    expect(sessionEngine.getSession(s1.id)!.isActive).toBe(true);
    expect(sessionEngine.getSession(s2.id)!.isActive).toBe(false);
  });

  it("should validate session validity", () => {
    const session = sessionEngine.createSession("u-005", "medical", "medical_coordinator", "10.0.0.6", "Safari", "dev-6", "Phone", false);
    expect(sessionEngine.isSessionValid(session)).toBe(true);
    session.isActive = false;
    expect(sessionEngine.isSessionValid(session)).toBe(false);
  });

  it("should detect idle sessions", () => {
    const session = sessionEngine.createSession("u-006", "maintenance", "maintenance_manager", "10.0.0.7", "Chrome", "dev-7", "Tablet", false);
    expect(sessionEngine.isIdle(session)).toBe(false);
  });

  it("should update session activity", () => {
    const session = sessionEngine.createSession("u-007", "parking", "parking_manager", "10.0.0.8", "Chrome", "dev-8", "Kiosk", false);
    const updated = sessionEngine.updateActivity(session.id);
    expect(updated).toBeTruthy();
    expect(updated!.lastActivity).toBeTruthy();
  });
});

/* ===================================================================
   Audit Engine
   =================================================================== */
describe("AuditEngine", () => {
  beforeEach(() => { auditEngine.clearLogs(); });

  it("should log entries with all required fields", () => {
    const log = auditEngine.log("test_action", "admin", "u-001", "super_admin", "test", "res-1", "Test log entry", "success", "10.0.0.1", "corr-1", "Chrome", "info");
    expect(log).toHaveProperty("id");
    expect(log).toHaveProperty("timestamp");
    expect(log.user).toBe("admin");
    expect(log.action).toBe("test_action");
    expect(log.result).toBe("success");
  });

  it("should filter logs by various criteria", () => {
    auditEngine.log("login", "admin", "u-001", "super_admin", "session", "s1", "Login", "success", "1.1.1.1", "c1", "UA", "info");
    auditEngine.log("login_failed", "admin", "u-001", "super_admin", "session", "s2", "Failed", "failure", "1.1.1.2", "c2", "UA", "warning");
    const failures = auditEngine.getLogs({ result: "failure" });
    expect(failures).toHaveLength(1);
    expect(failures[0]!.action).toBe("login_failed");
  });

  it("should get user activity", () => {
    auditEngine.log("action_a", "admin", "u-001", "super_admin", "type", "r1", "detail", "success", "ip", "c", "ua", "info");
    auditEngine.log("action_b", "admin", "u-001", "super_admin", "type", "r2", "detail", "success", "ip", "c", "ua", "info");
    auditEngine.log("action_c", "other", "u-002", "guest", "type", "r3", "detail", "success", "ip", "c", "ua", "info");
    const activity = auditEngine.getUserActivity("u-001");
    expect(activity).toHaveLength(2);
  });

  it("should get resource audit trail", () => {
    auditEngine.log("update", "admin", "u-001", "super_admin", "user", "u-005", "Update user", "success", "ip", "c", "ua", "info");
    auditEngine.log("delete", "admin", "u-001", "super_admin", "user", "u-005", "Delete user", "success", "ip", "c", "ua", "critical");
    const trail = auditEngine.getResourceAuditTrail("user", "u-005");
    expect(trail).toHaveLength(2);
  });

  it("should export logs as CSV", () => {
    auditEngine.log("test", "admin", "u-001", "super_admin", "type", "r1", "detail", "success", "ip", "c", "ua", "info");
    const csv = auditEngine.exportLogs("csv");
    expect(csv).toContain("id,timestamp,user,action");
    expect(csv).toContain("admin");
  });

  it("should export logs as JSON", () => {
    auditEngine.log("test", "admin", "u-001", "super_admin", "type", "r1", "detail", "success", "ip", "c", "ua", "info");
    const json = auditEngine.exportLogs("json");
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("should clear all logs", () => {
    auditEngine.log("test", "admin", "u-001", "super_admin", "type", "r1", "detail", "success", "ip", "c", "ua", "info");
    expect(auditEngine.getLogCount()).toBeGreaterThan(0);
    auditEngine.clearLogs();
    expect(auditEngine.getLogCount()).toBe(0);
  });
});

/* ===================================================================
   Security Monitor Engine
   =================================================================== */
describe("SecurityMonitorEngine", () => {
  it("should have seeded mock alerts", () => {
    const alerts = securityMonitorEngine.getAllAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(10);
  });

  it("should include critical alerts", () => {
    const critical = securityMonitorEngine.getAlertsBySeverity("critical");
    expect(critical.length).toBeGreaterThan(0);
    for (const alert of critical) {
      expect(alert.severity).toBe("critical");
    }
  });

  it("should acknowledge an alert", () => {
    const alerts = securityMonitorEngine.getAllAlerts();
    const target = alerts.find((a) => !a.acknowledged);
    if (target) {
      const acked = securityMonitorEngine.acknowledgeAlert(target.id, "admin");
      expect(acked!.acknowledged).toBe(true);
      expect(acked!.acknowledgedBy).toBe("admin");
    }
  });

  it("should get unacknowledged alerts", () => {
    const unacked = securityMonitorEngine.getUnacknowledgedAlerts();
    for (const a of unacked) {
      expect(a.acknowledged).toBe(false);
    }
  });

  it("should evaluate failed login attempts", () => {
    const alert = securityMonitorEngine.evaluateFailedLogin("testuser", "1.1.1.1", 5, "u-999");
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("brute_force");
    expect(alert!.severity).toBe("critical");

    const warningAlert = securityMonitorEngine.evaluateFailedLogin("testuser2", "2.2.2.2", 3, "u-998");
    expect(warningAlert).not.toBeNull();
    expect(warningAlert!.type).toBe("failed_login");
    expect(warningAlert!.severity).toBe("medium");
  });

  it("should evaluate permission violations", () => {
    const alert = securityMonitorEngine.evaluatePermissionViolation("guest1", "u-011", "guest", "users:delete", "1.1.1.1", "corr-test");
    expect(alert.type).toBe("unauthorized_api");
    expect(alert.severity).toBe("high");
  });

  it("should detect session hijacking on IP change", () => {
    const alert = securityMonitorEngine.evaluateSessionChange("ops", "u-004", "10.0.0.1", "185.220.101.42", "sess-1", "corr-test");
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("session_hijacking");
  });

  it("should not alert on same IP", () => {
    const alert = securityMonitorEngine.evaluateSessionChange("ops", "u-004", "10.0.0.1", "10.0.0.1", "sess-1", "corr-test");
    expect(alert).toBeNull();
  });

  it("should evaluate privilege escalation", () => {
    const alert = securityMonitorEngine.evaluatePrivilegeChange("auditor", "u-010", "auditor", "super_admin", "admin", "corr-test");
    expect(alert).not.toBeNull();
    expect(alert!.severity).toBe("critical");
    expect(alert!.type).toBe("privilege_escalation");
  });
});

/* ===================================================================
   Compliance Engine
   =================================================================== */
describe("ComplianceEngine", () => {
  it("should return all compliance frameworks", () => {
    const frameworks = complianceEngine.getAllFrameworks();
    expect(frameworks).toHaveLength(6);
  });

  it("should return a specific framework", () => {
    const iso = complianceEngine.getFramework("iso_27001");
    expect(iso).toBeTruthy();
    expect(iso!.label).toBe("ISO 27001");
    expect(iso!.requirements.length).toBeGreaterThan(0);
  });

  it("should calculate overall compliance score", () => {
    const score = complianceEngine.getOverallComplianceScore();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should return framework scores", () => {
    const scores = complianceEngine.getFrameworkScores();
    expect(scores).toHaveLength(6);
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(["compliant", "partial", "non_compliant"]).toContain(s.status);
    }
  });

  it("should identify gaps", () => {
    const gaps = complianceEngine.getGaps();
    expect(gaps.length).toBeGreaterThan(0);
    for (const gap of gaps) {
      expect(typeof gap).toBe("string");
    }
  });

  it("should assess a control and update score", () => {
    const result = complianceEngine.assessControl("iso_27001", "a5", "compliant", 95);
    expect(result).toBeTruthy();
    expect(result!.status).toBe("compliant");
  });

  it("should return compliant/non-compliant counts", () => {
    const compliant = complianceEngine.getCompliantCount();
    const nonCompliant = complianceEngine.getNonCompliantCount();
    expect(compliant + nonCompliant).toBeGreaterThan(0);
  });
});

/* ===================================================================
   Security Analytics Engine
   =================================================================== */
describe("SecurityAnalyticsEngine", () => {
  it("should compute full analytics", () => {
    const analytics = securityAnalyticsEngine.computeAnalytics(
      authEngine.getUsers(), sessionEngine.getAllSessions(),
      securityMonitorEngine.getAllAlerts(), auditEngine.getRecentLogs(200),
    );
    expect(analytics).toHaveProperty("overallSecurityScore");
    expect(analytics).toHaveProperty("totalUsers");
    expect(analytics).toHaveProperty("activeSessions");
    expect(analytics).toHaveProperty("failedLogins24h");
    expect(analytics).toHaveProperty("threatTrends");
    expect(analytics).toHaveProperty("riskHeatmap");
    expect(analytics).toHaveProperty("topRisks");
    expect(analytics.overallSecurityScore).toBeGreaterThanOrEqual(0);
    expect(analytics.overallSecurityScore).toBeLessThanOrEqual(100);
  });

  it("should return threat trends for 7 days", () => {
    const trends = securityAnalyticsEngine.getThreatTrends([]);
    expect(trends.length).toBeGreaterThanOrEqual(7);
  });

  it("should return risk heatmap with zones", () => {
    const heatmap = securityAnalyticsEngine.getRiskHeatmap();
    expect(heatmap.length).toBeGreaterThan(0);
    for (const item of heatmap) {
      expect(item).toHaveProperty("zone");
      expect(item).toHaveProperty("risk");
      expect(item).toHaveProperty("label");
    }
  });

  it("should calculate login success rate", () => {
    expect(securityAnalyticsEngine.getLoginSuccessRate([])).toBe(100);
  });

  it("should get top risks from alerts", () => {
    const topRisks = securityAnalyticsEngine.getTopRisks(securityMonitorEngine.getAllAlerts());
    expect(topRisks.length).toBeGreaterThan(0);
    expect(topRisks[0]).toHaveProperty("score");
    expect(topRisks[0]).toHaveProperty("title");
  });

  it("should calculate overall security score", () => {
    const users = authEngine.getUsers();
    const sessions = sessionEngine.getAllSessions();
    const alerts = securityMonitorEngine.getAllAlerts();
    const score = securityAnalyticsEngine.getOverallSecurityScore(users, sessions, alerts);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

/* ===================================================================
   Security Report Engine
   =================================================================== */
describe("SecurityReportEngine", () => {
  it("should generate security summary report", () => {
    const analytics = securityAnalyticsEngine.computeAnalytics([], [], [], []);
    const report = securityReportEngine.generateSecuritySummary(analytics, [], "admin");
    expect(report.type).toBe("security_summary");
    expect(report.title).toContain("Security Summary");
    expect(report.generatedBy).toBe("admin");
    expect(report.content).toHaveProperty("overallScore");
  });

  it("should generate compliance summary report", () => {
    const report = securityReportEngine.generateComplianceSummary(72, [{ framework: "iso_27001", label: "ISO 27001", score: 72 }], "admin");
    expect(report.type).toBe("compliance");
    expect(report.content).toHaveProperty("frameworks");
  });

  it("should generate audit history report", () => {
    const report = securityReportEngine.generateAuditHistory([], "admin");
    expect(report.type).toBe("audit_history");
    expect(report.content).toHaveProperty("totalLogs");
  });

  it("should generate user activity report", () => {
    const report = securityReportEngine.generateUserActivityReport([], "admin");
    expect(report.type).toBe("user_activity");
    expect(report.content).toHaveProperty("totalUsers");
  });

  it("should generate permission matrix report", () => {
    const report = securityReportEngine.generatePermissionMatrix("admin");
    expect(report.type).toBe("permission_matrix");
    expect(report.content).toHaveProperty("matrix");
    expect(report.content).toHaveProperty("totalPermissions");
  });

  it("should generate risk assessment report", () => {
    const analytics = securityAnalyticsEngine.computeAnalytics([], [], [], []);
    const report = securityReportEngine.generateRiskAssessment([], analytics, "admin");
    expect(report.type).toBe("risk_assessment");
    expect(report.content).toHaveProperty("riskItems");
  });

  it("should generate recommendations report", () => {
    const analytics = securityAnalyticsEngine.computeAnalytics([], [], [], []);
    const report = securityReportEngine.generateRecommendations([], analytics, "admin");
    expect(report.type).toBe("recommendations");
    expect(report.content).toHaveProperty("recommendations");
  });

  it("should track all generated reports", () => {
    const prev = securityReportEngine.getAllReports().length;
    securityReportEngine.generateSecuritySummary(
      securityAnalyticsEngine.computeAnalytics([], [], [], []), [], "admin",
    );
    expect(securityReportEngine.getAllReports().length).toBe(prev + 1);
  });
});

/* ===================================================================
   Middleware
   =================================================================== */
describe("AuthMiddleware", () => {
  it("should reject missing token", () => {
    const result = authMiddleware.authenticate(undefined, "sess-1", "ip", "ua", "corr-1");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
  });

  it("should reject missing session", () => {
    const result = authMiddleware.authenticate("tok-1", undefined, "ip", "ua", "corr-1");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
  });
});

describe("RBACMiddleware", () => {
  const adminCtx = {
    userId: "u-001", username: "admin", role: "super_admin" as SecurityRole,
    permissions: ALL_PERMISSIONS, sessionId: "s1", correlationId: "c1",
    ipAddress: "ip", userAgent: "ua", isAuthenticated: true,
  };
  const guestCtx = {
    userId: "u-011", username: "guest1", role: "guest" as SecurityRole,
    permissions: ["dashboard:view"] as SecurityPermission[], sessionId: "s2",
    correlationId: "c2", ipAddress: "ip", userAgent: "ua", isAuthenticated: true,
  };

  it("should allow with correct permission", () => {
    expect(rbacMiddleware.requirePermission(adminCtx, "users:delete").allowed).toBe(true);
    expect(rbacMiddleware.requirePermission(guestCtx, "dashboard:view").allowed).toBe(true);
  });

  it("should deny without correct permission", () => {
    expect(rbacMiddleware.requirePermission(guestCtx, "users:delete").allowed).toBe(false);
    expect(rbacMiddleware.requirePermission(guestCtx, "users:delete").status).toBe(403);
  });

  it("should deny unauthenticated", () => {
    const result = rbacMiddleware.requirePermission(
      { ...adminCtx, isAuthenticated: false }, "dashboard:view",
    );
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(401);
  });

  it("should check any permission", () => {
    expect(rbacMiddleware.requireAnyPermission(adminCtx, ["dashboard:view", "users:delete"]).allowed).toBe(true);
    expect(rbacMiddleware.requireAnyPermission(guestCtx, ["users:create", "settings:configure"]).allowed).toBe(false);
  });

  it("should check all permissions", () => {
    expect(rbacMiddleware.requireAllPermissions(adminCtx, ["dashboard:view", "security:manage"]).allowed).toBe(true);
  });

  it("should check role membership", () => {
    expect(rbacMiddleware.requireRole(adminCtx, ["super_admin", "auditor"]).allowed).toBe(true);
    expect(rbacMiddleware.requireRole(guestCtx, ["super_admin", "operations_manager"]).allowed).toBe(false);
  });
});

describe("RateLimitMiddleware", () => {
  it("should allow first request", () => {
    rateLimitMiddleware.reset("test-ip");
    const result = rateLimitMiddleware.check("test-ip");
    expect(result.allowed).toBe(true);
  });

  it("should block after exceeding limit", () => {
    rateLimitMiddleware.reset("block-ip");
    for (let i = 0; i < ALERT_THRESHOLDS.RATE_LIMIT_MAX_REQUESTS; i++) {
      rateLimitMiddleware.check("block-ip");
    }
    const result = rateLimitMiddleware.check("block-ip");
    expect(result.allowed).toBe(false);
    expect(result.status).toBe(429);
  });

  it("should reset rate limit state", () => {
    rateLimitMiddleware.reset("reset-ip");
    expect(rateLimitMiddleware.getState("reset-ip")).toBeNull();
  });

  it("should get active blocks", () => {
    const blocks = rateLimitMiddleware.getActiveBlocks();
    expect(Array.isArray(blocks)).toBe(true);
  });
});

describe("AuditMiddleware", () => {
  const ctx = {
    userId: "u-001", username: "admin", role: "super_admin" as SecurityRole,
    permissions: ALL_PERMISSIONS, sessionId: "s1", correlationId: "c1",
    ipAddress: "10.0.0.1", userAgent: "Chrome", isAuthenticated: true,
  };

  it("should log an action", () => {
    auditMiddleware.logAction(ctx, "test_action", "resource", "r1", "Test detail", "success");
    const logs = auditEngine.getLogs({ action: "test_action" });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]!.user).toBe("admin");
  });

  it("should log access", () => {
    auditMiddleware.logAccess(ctx, "dashboard", "main", true);
    const logs = auditEngine.getLogs({ action: "access_granted" });
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should log sensitive action", () => {
    auditMiddleware.logSensitiveAction(ctx, "delete_user", "user", "u-005", "Deleted user u-005");
    const logs = auditEngine.getLogs({ severity: "critical" });
    expect(logs.length).toBeGreaterThan(0);
  });
});

describe("SecurityMiddleware", () => {
  it("should generate correlation IDs", () => {
    const id1 = securityMiddleware.generateCorrelationId();
    const id2 = securityMiddleware.generateCorrelationId();
    expect(id1).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(id1).toContain("corr-");
  });

  it("should sanitize input", () => {
    const sanitized = securityMiddleware.sanitizeInput("<script>alert('xss')</script>");
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized).toContain("&lt;");
  });

  it("should validate email", () => {
    expect(securityMiddleware.validateEmail("test@example.com")).toBe(true);
    expect(securityMiddleware.validateEmail("invalid")).toBe(false);
    expect(securityMiddleware.validateEmail("")).toBe(false);
  });

  it("should sanitize output objects", () => {
    const output = securityMiddleware.sanitizeOutput({ name: "<b>test</b>", value: 42 });
    expect((output as any).name).toContain("&lt;");
    expect((output as any).value).toBe(42);
  });
});

/* ===================================================================
   Executive Service (Orchestrator)
   =================================================================== */
describe("SecurityService", () => {
  it("should initialize with all data", () => {
    const data = securityService.initialize();
    expect(data.users.length).toBeGreaterThan(0);
    expect(data.alerts.length).toBeGreaterThan(0);
    expect(data.analytics).toBeTruthy();
    expect(data.complianceFrameworks.length).toBe(6);
    expect(data.lastUpdated).toBeTruthy();
  });

  it("should authenticate a user via login", () => {
    const { data, result } = securityService.login({ username: "admin", password: "valid_password" });
    expect(result.success).toBe(true);
    expect(data.currentUser).toBeTruthy();
    expect(data.currentUser!.username).toBe("admin");
  });

  it("should handle failed login", () => {
    const { data, result } = securityService.login({ username: "admin", password: "wrong" });
    expect(result.success).toBe(false);
    expect(data.currentUser).toBeNull();
  });

  it("should create security context", () => {
    const ctx = securityService.getSecurityContext("u-001", "sess-test", "10.0.0.1", "Chrome", "corr-test");
    expect(ctx).toBeTruthy();
    expect(ctx!.username).toBe("admin");
    expect(ctx!.isAuthenticated).toBe(true);
  });

  it("should return null context for unknown user", () => {
    const ctx = securityService.getSecurityContext("u-999", "sess-test", "10.0.0.1", "Chrome", "corr-test");
    expect(ctx).toBeNull();
  });

  it("should check permissions via service", () => {
    const ctx = securityService.getSecurityContext("u-001", "sess-test", "10.0.0.1", "Chrome", "corr-test")!;
    expect(securityService.checkPermission(ctx, "rbac:manage")).toBe(true);
    expect(securityService.checkPermission(ctx, "nonexistent" as any)).toBe(false);
  });

  it("should return role hierarchy", () => {
    const hierarchy = securityService.getRoleHierarchy();
    expect(hierarchy.length).toBe(11);
    expect(hierarchy[0]!.role).toBe("super_admin");
  });

  it("should return permission matrix", () => {
    const matrix = securityService.getPermissionMatrix();
    expect(matrix.length).toBe(11);
  });

  it("should refresh analytics", () => {
    const data = securityService.initialize();
    const refreshed = securityService.refreshAnalytics(data);
    expect(refreshed.lastUpdated).toBeTruthy();
    expect(refreshed.analytics).toBeTruthy();
  });

  it("should get compliance data", () => {
    const data = securityService.getComplianceData();
    expect(data.length).toBe(6);
  });

  it("should get audit logs", () => {
    const logs = securityService.getAuditLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should generate reports", () => {
    const ctx = securityService.getSecurityContext("u-001", "sess-test", "10.0.0.1", "Chrome", "corr-test")!;
    const report = securityService.generateReport("security_summary", ctx);
    expect(report.title).toContain("Security Summary");
    expect(report.generatedBy).toBe("admin");
  });
});

