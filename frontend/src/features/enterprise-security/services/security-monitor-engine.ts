import type { SecurityAlert, SecurityAlertType, AlertSeverity, AuditLog, SecurityUser, UserSession } from "../types";
import { ALERT_THRESHOLDS } from "../constants";

export interface ISecurityMonitorEngine {
  evaluateLog(log: AuditLog): SecurityAlert | null;
  evaluateFailedLogin(username: string, ipAddress: string, attemptCount: number, userId: string): SecurityAlert | null;
  evaluatePermissionViolation(user: string, userId: string, role: string, permission: string, ipAddress: string, correlationId: string): SecurityAlert;
  evaluateSessionChange(user: string, userId: string, oldIp: string, newIp: string, sessionId: string, correlationId: string): SecurityAlert | null;
  evaluatePrivilegeChange(user: string, userId: string, oldRole: string, newRole: string, changedBy: string, correlationId: string): SecurityAlert | null;
  getAllAlerts(): SecurityAlert[];
  getAlertsBySeverity(severity: AlertSeverity): SecurityAlert[];
  getUnacknowledgedAlerts(): SecurityAlert[];
  acknowledgeAlert(alertId: string, acknowledgedBy: string): SecurityAlert | null;
  getAlertCount(): number;
  getCriticalAlertCount(): number;
  seedMockAlerts(): void;
}

export class MockSecurityMonitorEngine implements ISecurityMonitorEngine {
  private alerts: SecurityAlert[] = [];
  private alertIdCounter = 0;

  constructor() {
    this.seedMockAlerts();
  }

  evaluateLog(log: AuditLog): SecurityAlert | null {
    if (log.result === "failure" && log.action.includes("login")) {
      return this.makeAlert("failed_login", `Failed login attempt by ${log.user}`,
        `User ${log.user} failed to ${log.action} on ${log.resourceType}`, "medium",
        log.user, log.userId, log.ipAddress, log.correlationId, { action: log.action });
    }
    if (log.result === "denied") {
      return this.makeAlert("permission_violation", `Permission denied for ${log.user}`,
        `Access denied: ${log.action} on ${log.resourceType}`, "high",
        log.user, log.userId, log.ipAddress, log.correlationId, { resource: log.resourceId });
    }
    if (log.action.includes("role_change") || log.action.includes("permission_change")) {
      return this.makeAlert("privilege_escalation", `Role/permission change by ${log.user}`,
        `${log.action} performed on ${log.resourceType}:${log.resourceId}`, "high",
        log.user, log.userId, log.ipAddress, log.correlationId, { detail: log.detail });
    }
    return null;
  }

  evaluateFailedLogin(username: string, ipAddress: string, attemptCount: number, userId: string): SecurityAlert | null {
    if (attemptCount >= ALERT_THRESHOLDS.MAX_FAILED_LOGINS_BEFORE_LOCK) {
      return this.makeAlert("brute_force", `Brute force attack detected — ${username}`,
        `${attemptCount} failed login attempts from ${ipAddress}. Account locked.`, "critical",
        username, userId, ipAddress, `corr-${Date.now().toString(36)}`, { attemptCount: String(attemptCount) });
    }
    if (attemptCount >= ALERT_THRESHOLDS.MAX_FAILED_LOGINS_BEFORE_ALERT) {
      return this.makeAlert("failed_login", `Multiple failed logins for ${username}`,
        `${attemptCount} failed attempts from ${ipAddress}`, "medium",
        username, userId, ipAddress, `corr-${Date.now().toString(36)}`, { attemptCount: String(attemptCount) });
    }
    return null;
  }

  evaluatePermissionViolation(user: string, userId: string, role: string, permission: string, ipAddress: string, correlationId: string): SecurityAlert {
    return this.makeAlert("unauthorized_api", `Unauthorized access attempt by ${user}`,
      `User with role ${role} attempted to access ${permission} from ${ipAddress}`, "high",
      user, userId, ipAddress, correlationId, { permission, role });
  }

  evaluateSessionChange(user: string, userId: string, oldIp: string, newIp: string, _sessionId: string, correlationId: string): SecurityAlert | null {
    if (oldIp && newIp && oldIp !== newIp && ALERT_THRESHOLDS.SESSION_HIJACKING_IP_CHANGE) {
      return this.makeAlert("session_hijacking", `IP address change detected for ${user}`,
        `Session IP changed from ${oldIp} to ${newIp}. Possible session hijacking.`, "high",
        user, userId, newIp, correlationId, { oldIp, newIp });
    }
    return null;
  }

  evaluatePrivilegeChange(user: string, userId: string, oldRole: string, newRole: string, changedBy: string, correlationId: string): SecurityAlert | null {
    if (!ALERT_THRESHOLDS.PRIVILEGE_ESCALATION_MONITOR) return null;
    if (oldRole !== "super_admin" && newRole === "super_admin") {
      return this.makeAlert("privilege_escalation", `Privilege escalation: ${user} to ${newRole}`,
        `User ${user} promoted from ${oldRole} to ${newRole} by ${changedBy}`, "critical",
        user, userId, "system", correlationId, { oldRole, newRole, changedBy });
    }
    return this.makeAlert("role_change", `Role changed for ${user}`,
      `User ${user} changed from ${oldRole} to ${newRole} by ${changedBy}`, "medium",
      user, userId, "system", correlationId, { oldRole, newRole, changedBy });
  }

  getAllAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

  getAlertsBySeverity(severity: AlertSeverity): SecurityAlert[] {
    return this.alerts.filter((a) => a.severity === severity);
  }

  getUnacknowledgedAlerts(): SecurityAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): SecurityAlert | null {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return null;
    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    return alert;
  }

  getAlertCount(): number {
    return this.alerts.length;
  }

  getCriticalAlertCount(): number {
    return this.alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  }

  seedMockAlerts(): void {
    const now = Date.now();
    const hourMs = 3600000;

    const mockAlerts: Omit<SecurityAlert, "id">[] = [
      { type: "failed_login", title: "Failed login attempt — admin", message: "Failed login for admin from 203.0.113.42", severity: "medium", timestamp: new Date(now - hourMs * 2).toISOString(), user: "admin", userId: "u-001", ipAddress: "203.0.113.42", source: "Auth Engine", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, correlationId: "corr-a1", metadata: { attemptCount: "2" } },
      { type: "brute_force", title: "Brute force detected — security", message: "5 failed attempts for security from 198.51.100.23. Account locked.", severity: "critical", timestamp: new Date(now - hourMs * 5).toISOString(), user: "security", userId: "u-003", ipAddress: "198.51.100.23", source: "Security Monitor", acknowledged: true, acknowledgedBy: "admin", acknowledgedAt: new Date(now - hourMs * 4).toISOString(), correlationId: "corr-b1", metadata: { attemptCount: "5" } },
      { type: "permission_violation", title: "Permission violation — vendor1", message: "vendor1 attempted to access emergency:view without permission", severity: "high", timestamp: new Date(now - hourMs * 3).toISOString(), user: "vendor1", userId: "u-009", ipAddress: "192.0.2.100", source: "Permission Engine", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, correlationId: "corr-c1", metadata: { permission: "emergency:view" } },
      { type: "suspicious_activity", title: "Suspicious login location — director", message: "Login from unexpected geographic location (Russia)", severity: "high", timestamp: new Date(now - hourMs * 8).toISOString(), user: "director", userId: "u-002", ipAddress: "91.108.56.100", source: "Geo IP Monitor", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, correlationId: "corr-d1", metadata: { expectedCountry: "US", actualCountry: "RU" } },
      { type: "session_hijacking", title: "Session hijacking attempt — ops", message: "IP address changed from 10.0.0.1 to 185.220.101.42 during active session", severity: "high", timestamp: new Date(now - hourMs * 12).toISOString(), user: "ops", userId: "u-004", ipAddress: "185.220.101.42", source: "Session Engine", acknowledged: true, acknowledgedBy: "admin", acknowledgedAt: new Date(now - hourMs * 11).toISOString(), correlationId: "corr-e1", metadata: { oldIp: "10.0.0.1", newIp: "185.220.101.42" } },
      { type: "unauthorized_api", title: "Unauthorized API access — guest1", message: "Guest user attempted to access /api/admin/users from 203.0.113.200", severity: "high", timestamp: new Date(now - hourMs * 1).toISOString(), user: "guest1", userId: "u-011", ipAddress: "203.0.113.200", source: "API Gateway", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, correlationId: "corr-f1", metadata: { endpoint: "/api/admin/users" } },
      { type: "account_locked", title: "Account locked — locked_user", message: "Account locked_user locked due to 5 failed login attempts", severity: "medium", timestamp: new Date(now - hourMs * 6).toISOString(), user: "locked_user", userId: "u-012", ipAddress: "198.51.100.50", source: "Auth Engine", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, correlationId: "corr-g1", metadata: {} },
      { type: "sensitive_action", title: "Sensitive action: User role change", message: "User auditor promoted to operations_manager by admin", severity: "critical", timestamp: new Date(now - hourMs * 24).toISOString(), user: "auditor", userId: "u-010", ipAddress: "10.0.0.10", source: "RBAC Engine", acknowledged: false, acknowledgedBy: null, acknowledgedAt: null, correlationId: "corr-h1", metadata: { oldRole: "auditor", newRole: "operations_manager", changedBy: "admin" } },
      { type: "mfa_failure", title: "MFA failure — admin", message: "MFA code verification failed for admin from 203.0.113.42", severity: "medium", timestamp: new Date(now - hourMs * 4).toISOString(), user: "admin", userId: "u-001", ipAddress: "203.0.113.42", source: "Auth Engine", acknowledged: true, acknowledgedBy: "admin", acknowledgedAt: new Date(now - hourMs * 3.5).toISOString(), correlationId: "corr-i1", metadata: {} },
      { type: "role_change", title: "Role change: medical to auditor", message: "User medical reassigned to auditor role by admin", severity: "low", timestamp: new Date(now - hourMs * 48).toISOString(), user: "medical", userId: "u-005", ipAddress: "10.0.0.10", source: "RBAC Engine", acknowledged: true, acknowledgedBy: "admin", acknowledgedAt: new Date(now - hourMs * 47).toISOString(), correlationId: "corr-j1", metadata: { oldRole: "medical_coordinator", newRole: "auditor", changedBy: "admin" } },
    ];

    this.alerts = mockAlerts.map((a) => ({
      ...a,
      id: `alert-${++this.alertIdCounter}`,
    }));
  }

  private makeAlert(
    type: SecurityAlertType, title: string, message: string,
    severity: AlertSeverity, user: string, userId: string,
    ipAddress: string, correlationId: string, metadata: Record<string, string>,
  ): SecurityAlert {
    return {
      id: `alert-${++this.alertIdCounter}`,
      type, title, message, severity,
      timestamp: new Date().toISOString(),
      user, userId, ipAddress, source: "Security Monitor",
      acknowledged: false, acknowledgedBy: null, acknowledgedAt: null,
      correlationId, metadata,
    };
  }
}

export const securityMonitorEngine = new MockSecurityMonitorEngine();
