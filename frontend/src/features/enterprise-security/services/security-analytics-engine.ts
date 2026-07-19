import type { SecurityAnalytics, AuditLog, SecurityAlert, UserSession, SecurityUser, SecurityPermission } from "../types";
import { ROLE_DEFINITIONS, PERMISSION_LABELS } from "../constants";

export interface ISecurityAnalyticsEngine {
  computeAnalytics(users: SecurityUser[], sessions: UserSession[], alerts: SecurityAlert[], auditLogs: AuditLog[]): SecurityAnalytics;
  getThreatTrends(auditLogs: AuditLog[]): { date: string; count: number; type: string }[];
  getLoginSuccessRate(auditLogs: AuditLog[]): number;
  getPermissionUsage(auditLogs: AuditLog[]): { permission: string; usageCount: number }[];
  getAuditActivity7d(auditLogs: AuditLog[]): { date: string; count: number }[];
  getTopRisks(alerts: SecurityAlert[]): { title: string; score: number; category: string }[];
  getRiskHeatmap(): { zone: string; risk: number; label: string }[];
  getOverallSecurityScore(users: SecurityUser[], sessions: UserSession[], alerts: SecurityAlert[]): number;
  getAverageResponseTime(alerts: SecurityAlert[]): number;
}

export class MockSecurityAnalyticsEngine implements ISecurityAnalyticsEngine {
  computeAnalytics(users: SecurityUser[], sessions: UserSession[], alerts: SecurityAlert[], auditLogs: AuditLog[]): SecurityAnalytics {
    const failedLogins24h = auditLogs.filter(
      (l) => l.result === "failure" && l.action.includes("login") &&
        new Date(l.timestamp) > new Date(Date.now() - 86400000),
    ).length;
    const suspicious24h = alerts.filter(
      (a) => ["suspicious_activity", "session_hijacking", "unauthorized_api"].includes(a.type) &&
        new Date(a.timestamp) > new Date(Date.now() - 86400000),
    ).length;

    return {
      overallSecurityScore: this.getOverallSecurityScore(users, sessions, alerts),
      totalUsers: users.length,
      activeSessions: sessions.filter((s) => s.isActive).length,
      failedLogins24h,
      suspiciousActivities24h: suspicious24h,
      criticalAlerts: alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length,
      openAlerts: alerts.filter((a) => !a.acknowledged).length,
      avgResponseTimeMin: this.getAverageResponseTime(alerts),
      uptimePercentage: 99.97,
      threatTrends: this.getThreatTrends(auditLogs),
      loginSuccessRate: this.getLoginSuccessRate(auditLogs),
      permissionUsage: this.getPermissionUsage(auditLogs),
      auditActivity7d: this.getAuditActivity7d(auditLogs),
      topRisks: this.getTopRisks(alerts),
      riskHeatmap: this.getRiskHeatmap(),
    };
  }

  getThreatTrends(auditLogs: AuditLog[]): { date: string; count: number; type: string }[] {
    const trends: { date: string; count: number; type: string }[] = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toISOString().substring(0, 10);
      const dayLogs = auditLogs.filter((l) => l.timestamp.startsWith(date));
      trends.push({ date, count: dayLogs.filter((l) => l.result === "failure" || l.result === "denied").length, type: "failed" });
      trends.push({ date, count: dayLogs.filter((l) => l.severity === "critical" || l.severity === "error").length, type: "critical" });
    }
    return trends;
  }

  getLoginSuccessRate(auditLogs: AuditLog[]): number {
    const logins = auditLogs.filter((l) => l.action.includes("login"));
    if (logins.length === 0) return 100;
    const successes = logins.filter((l) => l.result === "success").length;
    return Math.round((successes / logins.length) * 100);
  }

  getPermissionUsage(auditLogs: AuditLog[]): { permission: string; usageCount: number }[] {
    const usage = new Map<string, number>();
    for (const log of auditLogs) {
      const key = log.action;
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
    return Array.from(usage.entries())
      .map(([permission, usageCount]) => ({ permission, usageCount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 20);
  }

  getAuditActivity7d(auditLogs: AuditLog[]): { date: string; count: number }[] {
    const activity: { date: string; count: number }[] = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toISOString().substring(0, 10);
      activity.push({ date, count: auditLogs.filter((l) => l.timestamp.startsWith(date)).length });
    }
    return activity;
  }

  getTopRisks(alerts: SecurityAlert[]): { title: string; score: number; category: string }[] {
    const severityScore: Record<string, number> = { critical: 95, high: 70, medium: 40, low: 15 };
    const unacked = alerts.filter((a) => !a.acknowledged);
    return unacked
      .map((a) => ({ title: a.title, score: severityScore[a.severity] ?? 50, category: a.type }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  getRiskHeatmap(): { zone: string; risk: number; label: string }[] {
    return [
      { zone: "North Gate", risk: 75, label: "High" },
      { zone: "South Gate", risk: 45, label: "Medium" },
      { zone: "East Gate", risk: 30, label: "Low" },
      { zone: "West Gate", risk: 60, label: "Medium" },
      { zone: "VIP Lounge", risk: 15, label: "Low" },
      { zone: "Security HQ", risk: 10, label: "Low" },
      { zone: "Server Room", risk: 85, label: "High" },
      { zone: "Parking A", risk: 40, label: "Medium" },
      { zone: "Stadium Bowl", risk: 55, label: "Medium" },
      { zone: "Press Area", risk: 25, label: "Low" },
    ];
  }

  getOverallSecurityScore(users: SecurityUser[], sessions: UserSession[], alerts: SecurityAlert[]): number {
    const activeUsers = users.filter((u) => u.status === "active").length;
    const userHealth = users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 100;
    const activeSessions = sessions.filter((s) => s.isActive).length;
    const sessionHealth = sessions.length > 0 ? Math.round((activeSessions / Math.max(1, sessions.length)) * 100) : 100;
    const criticalAlerts = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
    const alertPenalty = Math.min(40, criticalAlerts * 8);
    const openAlerts = alerts.filter((a) => !a.acknowledged).length;
    const openPenalty = Math.min(20, openAlerts * 3);

    return Math.max(0, Math.min(100, Math.round((userHealth * 0.25 + sessionHealth * 0.25 + 90 * 0.3 + 85 * 0.2) - alertPenalty - openPenalty)));
  }

  getAverageResponseTime(alerts: SecurityAlert[]): number {
    const acknowledged = alerts.filter((a) => a.acknowledged && a.acknowledgedAt);
    if (acknowledged.length === 0) return 0;
    const responseTimes = acknowledged.map((a) =>
      (new Date(a.acknowledgedAt!).getTime() - new Date(a.timestamp).getTime()) / 60000,
    );
    return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  }
}

export const securityAnalyticsEngine = new MockSecurityAnalyticsEngine();
