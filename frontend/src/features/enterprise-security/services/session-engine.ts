// @ts-nocheck
import type { UserSession, SecurityRole, SecurityContext } from "../types";
import { SESSION_CONFIG } from "../constants";

export interface ISessionEngine {
  createSession(userId: string, username: string, role: SecurityRole, ipAddress: string, userAgent: string, deviceId: string, deviceName: string, isTrusted: boolean): UserSession;
  getSession(sessionId: string): UserSession | null;
  getActiveSessions(userId: string): UserSession[];
  getAllSessions(): UserSession[];
  updateActivity(sessionId: string): UserSession | null;
  revokeSession(sessionId: string): boolean;
  revokeAllUserSessions(userId: string, exceptSessionId?: string): number;
  isSessionValid(session: UserSession): boolean;
  isIdle(session: UserSession): boolean;
  getExpiredSessions(): UserSession[];
  cleanupExpiredSessions(): number;
  getActiveSessionCount(): number;
  getTotalSessionCount(): number;
}

export class MockSessionEngine implements ISessionEngine {
  private sessions: Map<string, UserSession> = new Map();

  createSession(
    userId: string, username: string, role: SecurityRole,
    ipAddress: string, userAgent: string, deviceId: string,
    deviceName: string, isTrusted: boolean,
  ): UserSession {
    const activeSessions = this.getActiveSessions(userId);
    if (activeSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      const oldest = activeSessions.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )[0];
      this.revokeSession(oldest.id);
    }

    const now = Date.now();
    const session: UserSession = {
      id: `sess-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`,
      userId, username, role,
      token: `tok-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`,
      ipAddress, userAgent, deviceId, deviceName, isTrusted,
      createdAt: new Date(now).toISOString(),
      lastActivity: new Date(now).toISOString(),
      expiresAt: new Date(now + SESSION_CONFIG.MAX_SESSION_DURATION_MS).toISOString(),
      isActive: true,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): UserSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  getActiveSessions(userId: string): UserSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.userId === userId && s.isActive,
    );
  }

  getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  updateActivity(sessionId: string): UserSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastActivity = new Date().toISOString();
    if (!this.isSessionValid(session)) {
      session.isActive = false;
    }
    this.sessions.set(sessionId, session);
    return session;
  }

  revokeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.isActive = false;
    this.sessions.set(sessionId, session);
    return true;
  }

  revokeAllUserSessions(userId: string, exceptSessionId?: string): number {
    let count = 0;
    for (const [id, session] of this.sessions) {
      if (session.userId === userId && id !== exceptSessionId && session.isActive) {
        session.isActive = false;
        this.sessions.set(id, session);
        count++;
      }
    }
    return count;
  }

  isSessionValid(session: UserSession): boolean {
    if (!session.isActive) return false;
    if (new Date(session.expiresAt).getTime() <= Date.now()) return false;
    if (this.isIdle(session)) return false;
    return true;
  }

  isIdle(session: UserSession): boolean {
    const idleTime = Date.now() - new Date(session.lastActivity).getTime();
    return idleTime > SESSION_CONFIG.IDLE_TIMEOUT_MS;
  }

  getExpiredSessions(): UserSession[] {
    return Array.from(this.sessions.values()).filter((s) => !this.isSessionValid(s));
  }

  cleanupExpiredSessions(): number {
    const expired = this.getExpiredSessions();
    for (const s of expired) {
      this.sessions.delete(s.id);
    }
    return expired.length;
  }

  getActiveSessionCount(): number {
    return Array.from(this.sessions.values()).filter((s) => this.isSessionValid(s)).length;
  }

  getTotalSessionCount(): number {
    return this.sessions.size;
  }
}

export const sessionEngine = new MockSessionEngine();

