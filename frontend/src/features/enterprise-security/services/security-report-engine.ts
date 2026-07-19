import type { SecurityReport, SecurityAnalytics, SecurityAlert, AuditLog, SecurityUser } from "../types";
import { ROLE_DEFINITIONS, ROLE_PERMISSIONS_MAP, ALL_PERMISSIONS } from "../constants";

export interface ISecurityReportEngine {
  generateSecuritySummary(analytics: SecurityAnalytics, alerts: SecurityAlert[], generatedBy: string): SecurityReport;
  generateComplianceSummary(complianceScore: number, frameworkScores: { framework: string; label: string; score: number }[], generatedBy: string): SecurityReport;
  generateAuditHistory(logs: AuditLog[], generatedBy: string): SecurityReport;
  generateUserActivityReport(users: SecurityUser[], generatedBy: string): SecurityReport;
  generatePermissionMatrix(generatedBy: string): SecurityReport;
  generateRiskAssessment(alerts: SecurityAlert[], analytics: SecurityAnalytics, generatedBy: string): SecurityReport;
  generateOpenFindings(alerts: SecurityAlert[], generatedBy: string): SecurityReport;
  generateRecommendations(alerts: SecurityAlert[], analytics: SecurityAnalytics, generatedBy: string): SecurityReport;
  getAllReports(): SecurityReport[];
  getReportById(reportId: string): SecurityReport | null;
}

export class MockSecurityReportEngine implements ISecurityReportEngine {
  private reports: SecurityReport[] = [];

  generateSecuritySummary(analytics: SecurityAnalytics, alerts: SecurityAlert[], generatedBy: string): SecurityReport {
    return this.createReport("security_summary", "Security Summary Report", generatedBy, {
      overallScore: analytics.overallSecurityScore,
      totalUsers: analytics.totalUsers,
      activeSessions: analytics.activeSessions,
      failedLogins24h: analytics.failedLogins24h,
      suspiciousActivities24h: analytics.suspiciousActivities24h,
      openAlerts: analytics.openAlerts,
      criticalAlerts: analytics.criticalAlerts,
      avgResponseTime: analytics.avgResponseTimeMin,
      uptime: analytics.uptimePercentage,
      loginSuccessRate: analytics.loginSuccessRate,
      topRisks: analytics.topRisks,
      recentAlerts: alerts.slice(0, 10).map((a) => ({ title: a.title, severity: a.severity, timestamp: a.timestamp })),
      generatedAt: new Date().toISOString(),
    });
  }

  generateComplianceSummary(complianceScore: number, frameworkScores: { framework: string; label: string; score: number }[], generatedBy: string): SecurityReport {
    return this.createReport("compliance", "Compliance Summary Report", generatedBy, {
      overallScore: complianceScore,
      frameworks: frameworkScores,
      status: complianceScore >= 80 ? "Compliant" : complianceScore >= 60 ? "Partially Compliant" : "Non-Compliant",
      recommendations: frameworkScores.filter((f) => f.score < 70).map((f) => `Improve ${f.label} compliance from ${f.score}%`),
      generatedAt: new Date().toISOString(),
    });
  }

  generateAuditHistory(logs: AuditLog[], generatedBy: string): SecurityReport {
    return this.createReport("audit_history", "Audit History Report", generatedBy, {
      totalLogs: logs.length,
      timeframe: logs.length > 0 ? `${logs[logs.length - 1]?.timestamp} to ${logs[0]?.timestamp}` : "N/A",
      summary: {
        successes: logs.filter((l) => l.result === "success").length,
        failures: logs.filter((l) => l.result === "failure").length,
        denied: logs.filter((l) => l.result === "denied").length,
      },
      recentLogs: logs.slice(0, 50).map((l) => ({
        timestamp: l.timestamp, user: l.user, action: l.action, resourceType: l.resourceType, result: l.result, severity: l.severity,
      })),
      generatedAt: new Date().toISOString(),
    });
  }

  generateUserActivityReport(users: SecurityUser[], generatedBy: string): SecurityReport {
    return this.createReport("user_activity", "User Activity Report", generatedBy, {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === "active").length,
      inactiveUsers: users.filter((u) => u.status === "inactive").length,
      lockedUsers: users.filter((u) => u.status === "locked").length,
      suspendedUsers: users.filter((u) => u.status === "suspended").length,
      roleDistribution: ROLE_DEFINITIONS.map((r) => ({
        role: r.label,
        count: users.filter((u) => u.role === r.role).length,
      })),
      users: users.map((u) => ({
        id: u.id, username: u.username, displayName: u.displayName,
        role: u.role, status: u.status, mfaEnabled: u.mfaEnabled,
        lastLogin: u.lastLogin, department: u.department,
      })),
      generatedAt: new Date().toISOString(),
    });
  }

  generatePermissionMatrix(generatedBy: string): SecurityReport {
    const matrix = ROLE_DEFINITIONS.map((r) => ({
      role: r.label,
      permissions: [...(ROLE_PERMISSIONS_MAP[r.role] ?? [])],
      count: ROLE_PERMISSIONS_MAP[r.role]?.length ?? 0,
    }));
    return this.createReport("permission_matrix", "Permission Matrix Report", generatedBy, {
      totalRoles: ROLE_DEFINITIONS.length,
      totalPermissions: ALL_PERMISSIONS.length,
      matrix,
      summary: matrix.map((m) => `${m.role}: ${m.count} permissions`),
      generatedAt: new Date().toISOString(),
    });
  }

  generateRiskAssessment(alerts: SecurityAlert[], analytics: SecurityAnalytics, generatedBy: string): SecurityReport {
    const severityScore: Record<string, number> = { critical: 95, high: 70, medium: 40, low: 15 };
    const riskItems = alerts.filter((a) => !a.acknowledged).map((a) => ({
      title: a.title, risk: severityScore[a.severity] ?? 50, category: a.type,
      severity: a.severity, timestamp: a.timestamp, user: a.user,
    }));
    return this.createReport("risk_assessment", "Risk Assessment Report", generatedBy, {
      overallScore: analytics.overallSecurityScore,
      totalRisks: riskItems.length,
      criticalRisks: riskItems.filter((r) => r.severity === "critical").length,
      highRisks: riskItems.filter((r) => r.severity === "high").length,
      mediumRisks: riskItems.filter((r) => r.severity === "medium").length,
      lowRisks: riskItems.filter((r) => r.severity === "low").length,
      riskItems,
      riskHeatmap: analytics.riskHeatmap,
      recommendations: riskItems.filter((r) => r.risk >= 70).map((r) => `Address: ${r.title}`),
      generatedAt: new Date().toISOString(),
    });
  }

  generateOpenFindings(alerts: SecurityAlert[], generatedBy: string): SecurityReport {
    const open = alerts.filter((a) => !a.acknowledged);
    return this.createReport("open_findings", "Open Findings Report", generatedBy, {
      totalFindings: open.length,
      findings: open.map((a) => ({
        id: a.id, title: a.title, severity: a.severity, type: a.type,
        timestamp: a.timestamp, user: a.user, source: a.source,
      })),
      summary: {
        critical: open.filter((a) => a.severity === "critical").length,
        high: open.filter((a) => a.severity === "high").length,
        medium: open.filter((a) => a.severity === "medium").length,
        low: open.filter((a) => a.severity === "low").length,
      },
      generatedAt: new Date().toISOString(),
    });
  }

  generateRecommendations(alerts: SecurityAlert[], analytics: SecurityAnalytics, generatedBy: string): SecurityReport {
    const severityScore: Record<string, number> = { critical: 95, high: 70, medium: 40, low: 15 };
    const topRisks = alerts.filter((a) => !a.acknowledged)
      .sort((a, b) => (severityScore[b.severity] ?? 0) - (severityScore[a.severity] ?? 0))
      .slice(0, 5);

    return this.createReport("recommendations", "Security Recommendations Report", generatedBy, {
      overallScore: analytics.overallSecurityScore,
      recommendations: [
        ...(analytics.overallSecurityScore < 70 ? [{ priority: "high", title: "Improve overall security score", detail: "Current score is below 70%. Focus on resolving critical alerts and improving user compliance." }] : []),
        ...(analytics.failedLogins24h > 10 ? [{ priority: "high", title: "Investigate failed login spike", detail: `${analytics.failedLogins24h} failed logins in 24h. Possible brute force attack.` }] : []),
        ...(analytics.criticalAlerts > 0 ? [{ priority: "critical", title: "Resolve critical alerts", detail: `${analytics.criticalAlerts} critical alerts require immediate attention.` }] : []),
        ...(analytics.openAlerts > 5 ? [{ priority: "medium", title: "Review open security alerts", detail: `${analytics.openAlerts} alerts are unacknowledged.` }] : []),
        ...topRisks.map((a) => ({ priority: a.severity, title: `Address: ${a.title}`, detail: `Severity ${a.severity} alert from ${a.source}. User: ${a.user}` })),
        { priority: "medium", title: "Enable MFA for all users", detail: "Only a subset of users have MFA enabled. Enforce MFA to reduce account compromise risk." },
        { priority: "low", title: "Review permission assignments", detail: "Conduct quarterly permission audit to ensure least privilege principle." },
        { priority: "low", title: "Update compliance documentation", detail: "Ensure ISO 27001 and SOC 2 documentation is current." },
      ],
      generatedAt: new Date().toISOString(),
    });
  }

  getAllReports(): SecurityReport[] {
    return [...this.reports];
  }

  getReportById(reportId: string): SecurityReport | null {
    return this.reports.find((r) => r.id === reportId) ?? null;
  }

  private createReport(type: SecurityReport["type"], title: string, generatedBy: string, content: Record<string, unknown>): SecurityReport {
    const now = new Date();
    const report: SecurityReport = {
      id: `sr-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      title, type, generatedBy,
      generatedAt: now.toISOString(),
      period: `${new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString()} — ${now.toLocaleDateString()}`,
      format: "json",
      content,
    };
    this.reports.unshift(report);
    return report;
  }
}

export const securityReportEngine = new MockSecurityReportEngine();

