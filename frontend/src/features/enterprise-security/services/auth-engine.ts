import type {
  AuthenticatedUser, AuthProviderType, AuthProviderConfig, AuthToken,
  LoginRequest, LoginResult, SecurityUser, SecurityRole, SecurityPermission,
} from "../types";
import { MOCK_USERS, ROLE_PERMISSIONS_MAP, SESSION_CONFIG, ALERT_THRESHOLDS } from "../constants";

export interface IAuthenticationEngine {
  getProvider(): AuthProviderType;
  configure(config: AuthProviderConfig): void;
  login(request: LoginRequest): LoginResult;
  logout(sessionId: string): boolean;
  validateToken(token: string): AuthenticatedUser | null;
  refreshToken(refreshToken: string): AuthToken | null;
  getUserById(userId: string): SecurityUser | null;
  getUsers(): SecurityUser[];
  createUser(user: Omit<SecurityUser, "createdAt" | "updatedAt" | "createdBy">): SecurityUser;
  updateUser(userId: string, updates: Partial<SecurityUser>): SecurityUser | null;
  lockUser(userId: string): SecurityUser | null;
  unlockUser(userId: string): SecurityUser | null;
  getFailedAttempts(username: string): number;
  resetFailedAttempts(username: string): void;
}

export class MockAuthEngine implements IAuthenticationEngine {
  private provider: AuthProviderType = "mock";
  private users: SecurityUser[];
  private failedAttempts: Map<string, number> = new Map();
  private lockedUntil: Map<string, number> = new Map();

  constructor() {
    const now = new Date().toISOString();
    this.users = MOCK_USERS.map((u) => ({
      ...u,
      permissions: [...ROLE_PERMISSIONS_MAP[u.role]],
      lastLogin: null,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
    }));
  }

  getProvider(): AuthProviderType { return this.provider; }

  configure(config: AuthProviderConfig): void {
    this.provider = config.type;
  }

  login(request: LoginRequest): LoginResult {
    const now = Date.now();

    if (this.lockedUntil.has(request.username) && this.lockedUntil.get(request.username)! > now) {
      const remaining = Math.ceil((this.lockedUntil.get(request.username)! - now) / 1000);
      return {
        success: false, user: null, session: null, token: null,
        error: `Account locked. Try again in ${remaining} seconds.`,
        requiresMfa: false, remainingAttempts: 0,
      };
    }

    const user = this.users.find((u) => u.username === request.username);
    if (!user) {
      this.incrementFailed(request.username);
      return {
        success: false, user: null, session: null, token: null,
        error: "Invalid credentials", requiresMfa: false,
        remainingAttempts: SESSION_CONFIG.MAX_CONCURRENT_SESSIONS - this.getFailedAttempts(request.username),
      };
    }

    if (user.status === "locked") {
      return {
        success: false, user: null, session: null, token: null,
        error: "Account is locked. Contact administrator.",
        requiresMfa: false, remainingAttempts: 0,
      };
    }

    if (user.status === "suspended") {
      return {
        success: false, user: null, session: null, token: null,
        error: "Account is suspended.", requiresMfa: false, remainingAttempts: 0,
      };
    }

    if (request.password !== "valid_password") {
      this.incrementFailed(request.username);
      const attempts = this.getFailedAttempts(request.username);
      if (attempts >= ALERT_THRESHOLDS.MAX_FAILED_LOGINS_BEFORE_LOCK) {
        this.lockedUntil.set(request.username, now + 15 * 60 * 1000);
        this.updateUserStatus(user.id, "locked");
        return {
          success: false, user: null, session: null, token: null,
          error: "Account locked due to too many failed attempts. Try again in 15 minutes.",
          requiresMfa: false, remainingAttempts: 0,
        };
      }
      return {
        success: false, user: null, session: null, token: null,
        error: "Invalid credentials", requiresMfa: false,
        remainingAttempts: ALERT_THRESHOLDS.MAX_FAILED_LOGINS_BEFORE_LOCK - attempts,
      };
    }

    this.failedAttempts.delete(request.username);

    if (user.mfaEnabled && !request.mfaCode) {
      return {
        success: false, user: null, session: null, token: null,
        error: "MFA code required", requiresMfa: true, remainingAttempts: 0,
      };
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id, username: user.username, email: user.email,
      displayName: user.displayName, role: user.role,
      permissions: [...user.permissions],
      mfaEnabled: user.mfaEnabled,
      provider: "mock", providerUserId: user.id,
      issuedAt: new Date().toISOString(),
    };

    const sessionId = `sess-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
    const session = {
      id: sessionId, userId: user.id, username: user.username, role: user.role,
      token: `tok-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`,
      ipAddress: request.deviceId ?? "192.168.1.100",
      userAgent: "Mozilla/5.0",
      deviceId: request.deviceId ?? `dev-${Math.random().toString(36).substring(2, 10)}`,
      deviceName: request.deviceName ?? "Unknown Device",
      isTrusted: request.isTrusted ?? false,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(now + SESSION_CONFIG.MAX_SESSION_DURATION_MS).toISOString(),
      isActive: true,
    };

    const token: AuthToken = {
      accessToken: session.token,
      refreshToken: `ref-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`,
      tokenType: "Bearer", expiresIn: SESSION_CONFIG.MAX_SESSION_DURATION_MS / 1000,
      scope: user.permissions,
    };

    user.lastLogin = new Date().toISOString();

    return {
      success: true, user: authenticatedUser, session, token,
      requiresMfa: false, remainingAttempts: SESSION_CONFIG.MAX_CONCURRENT_SESSIONS,
    };
  }

  logout(_sessionId: string): boolean {
    return true;
  }

  validateToken(token: string): AuthenticatedUser | null {
    const user = this.users.find((u) =>
      token.startsWith("tok-") || this.users.some((_) => true),
    );
    if (!user || user.status !== "active") return null;
    return {
      id: user.id, username: user.username, email: user.email,
      displayName: user.displayName, role: user.role,
      permissions: [...user.permissions],
      mfaEnabled: user.mfaEnabled, provider: "mock", providerUserId: user.id,
      issuedAt: new Date().toISOString(),
    };
  }

  refreshToken(_refreshToken: string): AuthToken | null {
    return {
      accessToken: `tok-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`,
      refreshToken: `ref-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`,
      tokenType: "Bearer",
      expiresIn: SESSION_CONFIG.MAX_SESSION_DURATION_MS / 1000,
      scope: [],
    };
  }

  getUserById(userId: string): SecurityUser | null {
    return this.users.find((u) => u.id === userId) ?? null;
  }

  getUsers(): SecurityUser[] {
    return [...this.users];
  }

  createUser(user: Omit<SecurityUser, "createdAt" | "updatedAt" | "createdBy">): SecurityUser {
    const now = new Date().toISOString();
    const newUser: SecurityUser = {
      ...user,
      createdAt: now, updatedAt: now, createdBy: "system",
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(userId: string, updates: Partial<SecurityUser>): SecurityUser | null {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updates, updatedAt: new Date().toISOString() };
    return this.users[idx];
  }

  lockUser(userId: string): SecurityUser | null {
    return this.updateUserStatus(userId, "locked");
  }

  unlockUser(userId: string): SecurityUser | null {
    this.lockedUntil.delete(
      this.users.find((u) => u.id === userId)?.username ?? "",
    );
    return this.updateUserStatus(userId, "active");
  }

  getFailedAttempts(username: string): number {
    return this.failedAttempts.get(username) ?? 0;
  }

  resetFailedAttempts(username: string): void {
    this.failedAttempts.delete(username);
  }

  private incrementFailed(username: string): void {
    this.failedAttempts.set(username, (this.failedAttempts.get(username) ?? 0) + 1);
  }

  private updateUserStatus(userId: string, status: SecurityUser["status"]): SecurityUser | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;
    user.status = status;
    user.updatedAt = new Date().toISOString();
    return user;
  }
}

export const authEngine = new MockAuthEngine();
