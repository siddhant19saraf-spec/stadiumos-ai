import type { EnterpriseSecurityData, SecurityRole, SecurityUser, LoginRequest, LoginResult, SecurityPermission, SecurityContext, SecurityReport, AuditLog } from "../types";
import { authEngine } from "./auth-engine";
import { rbacEngine } from "./rbac-engine";
import { permissionEngine } from "./permission-engine";
import { sessionEngine } from "./session-engine";
import { auditEngine } from "./audit-engine";
import { securityMonitorEngine } from "./security-monitor-engine";
import { complianceEngine } from "./compliance-engine";
import { securityAnalyticsEngine } from "./security-analytics-engine";
import { securityReportEngine } from "./security-report-engine";
import { ROLE_DEFINITIONS } from "../constants";

export interface ISecurityService {
  initialize(): EnterpriseSecurityData;
  login(request: LoginRequest): { data: EnterpriseSecurityData; result: LoginResult };
  logout(sessionId: string, data: EnterpriseSecurityData): EnterpriseSecurityData;
  getSecurityContext(userId: string, sessionId: string, ipAddress: string, userAgent: string, correlationId: string): SecurityContext | null;
  checkPermission(context: SecurityContext, permission: SecurityPermission): boolean;
  getUsers(): SecurityUser[];
  updateUser(userId: string, updates: Partial<SecurityUser>, context: SecurityContext): SecurityUser | null;
  lockUser(userId: string, context: SecurityContext): SecurityUser | null;
  unlockUser(userId: string, context: SecurityContext): SecurityUser | null;
  acknowledgeAlert(alertId: string, context: SecurityContext): EnterpriseSecurityData;
  getRoleHierarchy(): { role: SecurityRole; label: string; priority: number }[];
  getPermissionMatrix(): { role: SecurityRole; permissions: SecurityPermission[]; count: number }[];
  generateReport(type: string, context: SecurityContext): SecurityReport;
  getAuditLogs(filters?: Record<string, string>): AuditLog[];
  getComplianceData(): ReturnType<typeof complianceEngine.getAllFrameworks>;
  refreshAnalytics(data: EnterpriseSecurityData): EnterpriseSecurityData;
}

export function createInitialState(): EnterpriseSecurityData {
  return {
    currentUser: null,
    users: [],
    sessions: [],
    auditLogs: [],
    alerts: [],
    complianceFrameworks: [],
    analytics: null as any,
    reports: [],
    roleDefinitions: ROLE_DEFINITIONS,
    selectedRole: null,
    loading: false,
    lastUpdated: null,
  };
}

export const securityService: ISecurityService = {
  initialize(): EnterpriseSecurityData {
    const users = authEngine.getUsers();
    const sessions = sessionEngine.getAllSessions();
    const alerts = securityMonitorEngine.getAllAlerts();
    const auditLogs = auditEngine.getRecentLogs(200);
    const complianceFrameworks = complianceEngine.getAllFrameworks();
    const analytics = securityAnalyticsEngine.computeAnalytics(users, sessions, alerts, auditLogs);
    const complianceScore = complianceEngine.getOverallComplianceScore();
    const frameworkScores = complianceEngine.getFrameworkScores();
    const report = securityReportEngine.generateSecuritySummary(analytics, alerts, "system");

    return {
      currentUser: null,
      users,
      sessions,
      auditLogs,
      alerts,
      complianceFrameworks,
      analytics,
      reports: [report],
      roleDefinitions: ROLE_DEFINITIONS,
      selectedRole: null,
      loading: false,
      lastUpdated: new Date().toISOString(),
    };
  },

  login(request: LoginRequest) {
    const data = this.initialize();
    const result = authEngine.login(request);
    if (result.success && result.session) {
      const existingSession = sessionEngine.getSession(result.session.id);
      if (!existingSession) {
        sessionEngine.createSession(
          result.user!.id, result.user!.username, result.user!.role,
          result.session.ipAddress, result.session.userAgent,
          result.session.deviceId, result.session.deviceName,
          result.session.isTrusted,
        );
      }
      auditEngine.log(
        "login", result.user!.username, result.user!.id, result.user!.role,
        "session", result.session.id, "User logged in successfully",
        "success", result.session.ipAddress, `corr-${Date.now().toString(36)}`,
        result.session.userAgent, "info",
      );
      data.currentUser = {
        id: result.user!.id, username: result.user!.username, email: result.user!.email,
        displayName: result.user!.displayName, role: result.user!.role,
        permissions: result.user!.permissions, department: "",
        status: "active", mfaEnabled: result.user!.mfaEnabled,
        lastLogin: new Date().toISOString(),
        createdAt: "", updatedAt: "", createdBy: "",
      };
    } else {
      auditEngine.log(
        "login_failed", request.username, "unknown", "guest",
        "session", "N/A", `Failed login: ${result.error}`,
        "failure", request.deviceId ?? "unknown", `corr-${Date.now().toString(36)}`,
        "Unknown", "warning",
      );
      const alert = securityMonitorEngine.evaluateFailedLogin(
        request.username, request.deviceId ?? "unknown",
        authEngine.getFailedAttempts(request.username), "unknown",
      );
      if (alert) {
        data.alerts = [alert, ...data.alerts];
      }
    }
    data.analytics = securityAnalyticsEngine.computeAnalytics(data.users, data.sessions, data.alerts, data.auditLogs);
    return { data, result };
  },

  logout(sessionId: string, data: EnterpriseSecurityData) {
    const session = sessionEngine.getSession(sessionId);
    if (session) {
      sessionEngine.revokeSession(sessionId);
      auditEngine.log(
        "logout", session.username, session.userId, session.role,
        "session", sessionId, "User logged out", "success",
        session.ipAddress, `corr-${Date.now().toString(36)}`, session.userAgent, "info",
      );
    }
    data.sessions = sessionEngine.getAllSessions();
    data.currentUser = null;
    return data;
  },

  getSecurityContext(userId: string, sessionId: string, ipAddress: string, userAgent: string, correlationId: string): SecurityContext | null {
    const user = authEngine.getUserById(userId);
    if (!user) return null;
    return permissionEngine.buildSecurityContext(user, sessionId, ipAddress, userAgent, correlationId);
  },

  checkPermission(context: SecurityContext, permission: SecurityPermission): boolean {
    const allowed = permissionEngine.checkPermission(context, permission);
    if (!allowed) {
      auditEngine.log(
        "permission_check", context.username, context.userId, context.role,
        "permission", permission, `Permission denied: ${permission}`,
        "denied", context.ipAddress, context.correlationId, context.userAgent, "warning",
      );
    }
    return allowed;
  },

  getUsers(): SecurityUser[] {
    return authEngine.getUsers();
  },

  updateUser(userId: string, updates: Partial<SecurityUser>, context: SecurityContext): SecurityUser | null {
    if (!permissionEngine.canManageUser(context, userId)) return null;
    const oldUser = authEngine.getUserById(userId);
    const updated = authEngine.updateUser(userId, updates);
    if (updated && oldUser && oldUser.role !== updated.role) {
      auditEngine.log(
        "role_change", context.username, context.userId, context.role,
        "user", userId, `User role changed: ${oldUser.role} → ${updated.role}`,
        "success", context.ipAddress, context.correlationId, context.userAgent, "warning",
      );
      const alert = securityMonitorEngine.evaluatePrivilegeChange(
        updated.username, updated.id, oldUser.role, updated.role, context.username, context.correlationId,
      );
      if (alert) {
        void alert;
      }
    }
    return updated;
  },

  lockUser(userId: string, context: SecurityContext): SecurityUser | null {
    if (!context.permissions.includes("users:edit")) return null;
    const user = authEngine.lockUser(userId);
    if (user) {
      sessionEngine.revokeAllUserSessions(userId);
      auditEngine.log(
        "lock_user", context.username, context.userId, context.role,
        "user", userId, `User ${user.username} locked by ${context.username}`,
        "success", context.ipAddress, context.correlationId, context.userAgent, "warning",
      );
    }
    return user;
  },

  unlockUser(userId: string, context: SecurityContext): SecurityUser | null {
    if (!context.permissions.includes("users:edit")) return null;
    const user = authEngine.unlockUser(userId);
    if (user) {
      auditEngine.log(
        "unlock_user", context.username, context.userId, context.role,
        "user", userId, `User ${user.username} unlocked by ${context.username}`,
        "success", context.ipAddress, context.correlationId, context.userAgent, "info",
      );
    }
    return user;
  },

  acknowledgeAlert(alertId: string, context: SecurityContext): EnterpriseSecurityData {
    securityMonitorEngine.acknowledgeAlert(alertId, context.username);
    const data = this.initialize();
    data.currentUser = authEngine.getUserById(context.userId) ?? null;
    return data;
  },

  getRoleHierarchy() {
    return rbacEngine.getRoleHierarchy();
  },

  getPermissionMatrix() {
    return rbacEngine.getPermissionMatrix();
  },

  generateReport(type: string, context: SecurityContext): SecurityReport {
    const data = this.initialize();
    const analytics = data.analytics;
    const frameworkScores = complianceEngine.getFrameworkScores();

    let report: SecurityReport;
    switch (type) {
      case "security_summary":
        report = securityReportEngine.generateSecuritySummary(analytics, data.alerts, context.username);
        break;
      case "compliance":
        report = securityReportEngine.generateComplianceSummary(complianceEngine.getOverallComplianceScore(), frameworkScores, context.username);
        break;
      case "audit_history":
        report = securityReportEngine.generateAuditHistory(data.auditLogs, context.username);
        break;
      case "user_activity":
        report = securityReportEngine.generateUserActivityReport(data.users, context.username);
        break;
      case "permission_matrix":
        report = securityReportEngine.generatePermissionMatrix(context.username);
        break;
      case "risk_assessment":
        report = securityReportEngine.generateRiskAssessment(data.alerts, analytics, context.username);
        break;
      case "open_findings":
        report = securityReportEngine.generateOpenFindings(data.alerts, context.username);
        break;
      case "recommendations":
        report = securityReportEngine.generateRecommendations(data.alerts, analytics, context.username);
        break;
      default:
        report = securityReportEngine.generateSecuritySummary(analytics, data.alerts, context.username);
    }

    auditEngine.log(
      "generate_report", context.username, context.userId, context.role,
      "report", report.id, `Generated report: ${report.title}`,
      "success", context.ipAddress, context.correlationId, context.userAgent, "info",
    );
    return report;
  },

  getAuditLogs(filters?: Record<string, string>): AuditLog[] {
    return auditEngine.getLogs(filters as any);
  },

  getComplianceData() {
    return complianceEngine.getAllFrameworks();
  },

  refreshAnalytics(data: EnterpriseSecurityData): EnterpriseSecurityData {
    const alerts = securityMonitorEngine.getAllAlerts();
    const auditLogs = auditEngine.getRecentLogs(200);
    const users = authEngine.getUsers();
    const sessions = sessionEngine.getAllSessions();
    return {
      ...data,
      users,
      sessions,
      alerts,
      auditLogs,
      analytics: securityAnalyticsEngine.computeAnalytics(users, sessions, alerts, auditLogs),
      lastUpdated: new Date().toISOString(),
    };
  },
};

