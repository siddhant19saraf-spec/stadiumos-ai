import type { SecurityContext } from "../types";
import { auditEngine } from "../services/audit-engine";

export interface IAuditMiddleware {
  logAction(context: SecurityContext, action: string, resourceType: string, resourceId: string, detail: string, result: "success" | "failure" | "denied", severity?: "info" | "warning" | "error" | "critical", metadata?: Record<string, string>): void;
  logAccess(context: SecurityContext, resourceType: string, resourceId: string, allowed: boolean): void;
  logSensitiveAction(context: SecurityContext, action: string, resourceType: string, resourceId: string, detail: string): void;
}

export class AuditMiddleware implements IAuditMiddleware {
  logAction(
    context: SecurityContext, action: string, resourceType: string,
    resourceId: string, detail: string, result: "success" | "failure" | "denied",
    severity: "info" | "warning" | "error" | "critical" = "info",
    metadata?: Record<string, string>,
  ): void {
    auditEngine.log(
      action, context.username, context.userId, context.role,
      resourceType, resourceId, detail, result,
      context.ipAddress, context.correlationId, context.userAgent,
      severity, metadata,
    );
  }

  logAccess(context: SecurityContext, resourceType: string, resourceId: string, allowed: boolean): void {
    this.logAction(
      context, allowed ? "access_granted" : "access_denied",
      resourceType, resourceId,
      allowed ? `Access granted to ${resourceType}:${resourceId}` : `Access denied to ${resourceType}:${resourceId}`,
      allowed ? "success" : "denied",
      allowed ? "info" : "warning",
    );
  }

  logSensitiveAction(context: SecurityContext, action: string, resourceType: string, resourceId: string, detail: string): void {
    this.logAction(context, action, resourceType, resourceId, detail, "success", "critical");
  }
}

export const auditMiddleware = new AuditMiddleware();
