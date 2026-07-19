import type { AuditLog, SecurityRole } from "../types";

export interface IAuditEngine {
  log(action: string, user: string, userId: string, role: SecurityRole, resourceType: string, resourceId: string, detail: string, result: "success" | "failure" | "denied", ipAddress: string, correlationId: string, userAgent: string, severity: AuditLog["severity"], metadata?: Record<string, string>): AuditLog;
  getLogs(filters?: Partial<{ userId: string; action: string; resourceType: string; result: string; severity: string; fromDate: string; toDate: string }>): AuditLog[];
  getLogById(logId: string): AuditLog | null;
  getAllLogs(): AuditLog[];
  getUserActivity(userId: string, limit?: number): AuditLog[];
  getResourceAuditTrail(resourceType: string, resourceId: string): AuditLog[];
  getRecentLogs(count?: number): AuditLog[];
  getLogCount(): number;
  exportLogs(format: "json" | "csv"): string;
  clearLogs(): void;
}

export class MockAuditEngine implements IAuditEngine {
  private logs: AuditLog[] = [];
  private readonly MAX_LOGS = 10000;

  log(
    action: string, user: string, userId: string, role: SecurityRole,
    resourceType: string, resourceId: string, detail: string,
    result: "success" | "failure" | "denied",
    ipAddress: string, correlationId: string, userAgent: string,
    severity: AuditLog["severity"],
    metadata?: Record<string, string>,
  ): AuditLog {
    const entry: AuditLog = {
      id: `log-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`,
      timestamp: new Date().toISOString(),
      user, userId, role, action, resourceType, resourceId, detail,
      result, ipAddress, correlationId, userAgent, severity,
      metadata: metadata ?? {},
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }
    return entry;
  }

  getLogs(filters?: Partial<{
    userId: string; action: string; resourceType: string;
    result: string; severity: string; fromDate: string; toDate: string;
  }>): AuditLog[] {
    let filtered = [...this.logs];
    if (filters) {
      if (filters.userId) filtered = filtered.filter((l) => l.userId === filters.userId);
      if (filters.action) filtered = filtered.filter((l) => l.action === filters.action);
      if (filters.resourceType) filtered = filtered.filter((l) => l.resourceType === filters.resourceType);
      if (filters.result) filtered = filtered.filter((l) => l.result === filters.result);
      if (filters.severity) filtered = filtered.filter((l) => l.severity === filters.severity);
      if (filters.fromDate) filtered = filtered.filter((l) => new Date(l.timestamp) >= new Date(filters.fromDate!));
      if (filters.toDate) filtered = filtered.filter((l) => new Date(l.timestamp) <= new Date(filters.toDate!));
    }
    return filtered;
  }

  getLogById(logId: string): AuditLog | null {
    return this.logs.find((l) => l.id === logId) ?? null;
  }

  getAllLogs(): AuditLog[] {
    return [...this.logs];
  }

  getUserActivity(userId: string, limit = 50): AuditLog[] {
    return this.logs.filter((l) => l.userId === userId).slice(0, limit);
  }

  getResourceAuditTrail(resourceType: string, resourceId: string): AuditLog[] {
    return this.logs.filter((l) => l.resourceType === resourceType && l.resourceId === resourceId);
  }

  getRecentLogs(count = 20): AuditLog[] {
    return this.logs.slice(0, count);
  }

  getLogCount(): number {
    return this.logs.length;
  }

  exportLogs(format: "json" | "csv"): string {
    if (format === "json") {
      return JSON.stringify(this.logs, null, 2);
    }
    const headers = ["id", "timestamp", "user", "action", "resourceType", "resourceId", "result", "severity", "ipAddress", "correlationId"] as const;
    const rows = this.logs.map((l) =>
      headers.map((h) => `"${String((l as unknown as Record<string, unknown>)[h] ?? "").replace(/"/g, '""')}"`).join(","),
    );
    return [headers.join(","), ...rows].join("\n");
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const auditEngine = new MockAuditEngine();
