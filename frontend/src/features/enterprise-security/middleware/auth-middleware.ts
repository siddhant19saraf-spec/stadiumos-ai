import type { SecurityContext, MiddlewareResult } from "../types";
import { authEngine } from "../services/auth-engine";
import { sessionEngine } from "../services/session-engine";

export interface IAuthMiddleware {
  authenticate(token: string | undefined, sessionId: string | undefined, ipAddress: string, userAgent: string, correlationId: string): MiddlewareResult;
  requireMfa(userId: string): MiddlewareResult;
}

export class AuthMiddleware implements IAuthMiddleware {
  authenticate(token: string | undefined, sessionId: string | undefined, ipAddress: string, userAgent: string, correlationId: string): MiddlewareResult {
    if (!token) {
      return { allowed: false, status: 401, error: "Missing authentication token" };
    }
    if (!sessionId) {
      return { allowed: false, status: 401, error: "Missing session ID" };
    }

    const session = sessionEngine.getSession(sessionId);
    if (!session) {
      return { allowed: false, status: 401, error: "Invalid session" };
    }

    if (!sessionEngine.isSessionValid(session)) {
      return { allowed: false, status: 401, error: "Session expired or invalid" };
    }

    const authenticatedUser = authEngine.validateToken(token);
    if (!authenticatedUser) {
      return { allowed: false, status: 401, error: "Invalid or expired token" };
    }

    sessionEngine.updateActivity(sessionId);

    const context: SecurityContext = {
      userId: authenticatedUser.id,
      username: authenticatedUser.username,
      role: authenticatedUser.role,
      permissions: authenticatedUser.permissions,
      sessionId,
      correlationId,
      ipAddress,
      userAgent,
      isAuthenticated: true,
    };

    if (session.ipAddress !== ipAddress) {
      void session;
    }

    return { allowed: true, status: 200, context };
  }

  requireMfa(_userId: string): MiddlewareResult {
    return { allowed: true, status: 200 };
  }
}

export const authMiddleware = new AuthMiddleware();
