import type { MiddlewareResult, SecurityContext } from "../types";
import { authMiddleware } from "./auth-middleware";
import { rbacMiddleware } from "./rbac-middleware";
import { rateLimitMiddleware } from "./rate-limit-middleware";
import { auditMiddleware } from "./audit-middleware";

export interface ISecurityMiddleware {
  authenticateRequest(token: string | undefined, sessionId: string | undefined, ipAddress: string, userAgent: string, correlationId: string): MiddlewareResult;
  authorizeRequest(context: SecurityContext | undefined, requiredPermission: string): MiddlewareResult;
  checkRateLimit(identifier: string): MiddlewareResult;
  secureEndpoint(token: string | undefined, sessionId: string | undefined, ipAddress: string, userAgent: string, correlationId: string, requiredPermission: string): Promise<MiddlewareResult>;
  sanitizeInput(input: string): string;
  validateEmail(email: string): boolean;
  sanitizeOutput(output: unknown): unknown;
  generateCorrelationId(): string;
}

export class SecurityMiddleware implements ISecurityMiddleware {
  authenticateRequest(token: string | undefined, sessionId: string | undefined, ipAddress: string, userAgent: string, correlationId: string): MiddlewareResult {
    return authMiddleware.authenticate(token, sessionId, ipAddress, userAgent, correlationId);
  }

  authorizeRequest(context: SecurityContext | undefined, requiredPermission: string): MiddlewareResult {
    const result = rbacMiddleware.requirePermission(context, requiredPermission as any);
    if (!result.allowed) {
      auditMiddleware.logAction(
        result.context ?? context ?? { userId: "unknown", username: "unknown", role: "guest", permissions: [], sessionId: "", correlationId: "", ipAddress: "", userAgent: "", isAuthenticated: false },
        "authorization_failed", "permission", requiredPermission,
        `Authorization failed for ${requiredPermission}`, "denied", "warning",
      );
    }
    return result;
  }

  checkRateLimit(identifier: string): MiddlewareResult {
    return rateLimitMiddleware.check(identifier);
  }

  async secureEndpoint(
    token: string | undefined, sessionId: string | undefined,
    ipAddress: string, userAgent: string, correlationId: string,
    requiredPermission: string,
  ): Promise<MiddlewareResult> {
    const rateCheck = this.checkRateLimit(ipAddress);
    if (!rateCheck.allowed) return rateCheck;

    const authResult = this.authenticateRequest(token, sessionId, ipAddress, userAgent, correlationId);
    if (!authResult.allowed) return authResult;

    const authzResult = this.authorizeRequest(authResult.context, requiredPermission);
    return authzResult;
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .replace(/\\/g, "&#x5C;")
      .replace(/`/g, "&#x60;");
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  sanitizeOutput(output: unknown): unknown {
    if (typeof output === "string") {
      return this.sanitizeInput(output);
    }
    if (Array.isArray(output)) {
      return output.map((item) => this.sanitizeOutput(item));
    }
    if (output && typeof output === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(output as Record<string, unknown>)) {
        sanitized[key] = this.sanitizeOutput(value);
      }
      return sanitized;
    }
    return output;
  }

  generateCorrelationId(): string {
    return `corr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
  }
}

export const securityMiddleware = new SecurityMiddleware();
