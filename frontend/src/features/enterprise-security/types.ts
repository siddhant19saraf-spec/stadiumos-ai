/* ===================================================================
   Enterprise Security, RBAC, Audit & Compliance — Type Definitions
   =================================================================== */

/* ——— Security Roles ——— */
export type SecurityRole =
  | "super_admin" | "tournament_director" | "operations_manager"
  | "security_manager" | "medical_coordinator" | "maintenance_manager"
  | "parking_manager" | "energy_manager" | "vendor" | "auditor" | "guest";

/* ——— Fine-Grained Permissions ——— */
export type SecurityPermission =
  | "dashboard:view"
  | "security:view" | "security:manage"
  | "users:view" | "users:create" | "users:edit" | "users:delete"
  | "users:manage_roles"
  | "tournament:view" | "tournament:edit" | "tournament:manage"
  | "crowd:view" | "crowd:manage"
  | "emergency:view" | "emergency:manage"
  | "maintenance:view" | "maintenance:approve"
  | "parking:view" | "parking:manage"
  | "energy:view" | "energy:manage"
  | "incidents:view" | "incidents:create" | "incidents:manage"
  | "audit:view" | "audit:export"
  | "reports:view" | "reports:create" | "reports:export"
  | "settings:view" | "settings:configure"
  | "compliance:view" | "compliance:manage"
  | "sessions:view" | "sessions:revoke"
  | "alerts:view" | "alerts:acknowledge"
  | "logs:view" | "logs:export"
  | "rbac:view" | "rbac:manage";

/* ——— Role Hierarchy Entry ——— */
export interface RoleDefinition {
  role: SecurityRole;
  label: string;
  description: string;
  inherits: SecurityRole[];
  priority: number;
}

/* ——— Security User ——— */
export interface SecurityUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: SecurityRole;
  permissions: SecurityPermission[];
  department: string;
  status: "active" | "inactive" | "suspended" | "locked";
  mfaEnabled: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/* ——— Session ——— */
export interface UserSession {
  id: string;
  userId: string;
  username: string;
  role: SecurityRole;
  token: string;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  deviceName: string;
  isTrusted: boolean;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
}

/* ——— Authentication Provider Abstraction ——— */
export type AuthProviderType = "oauth2" | "oidc" | "saml" | "jwt" | "mock";

export interface AuthProviderConfig {
  type: AuthProviderType;
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  metadataUrl: string;
  jwksUri: string;
  tokenEndpoint: string;
  authorizationEndpoint: string;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: SecurityRole;
  permissions: SecurityPermission[];
  mfaEnabled: boolean;
  provider: AuthProviderType;
  providerUserId: string;
  issuedAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  tokenType: string;
  expiresIn: number;
  scope: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
  mfaCode?: string;
  deviceId?: string;
  deviceName?: string;
  isTrusted?: boolean;
}

export interface LoginResult {
  success: boolean;
  user: AuthenticatedUser | null;
  session: UserSession | null;
  token: AuthToken | null;
  error?: string;
  requiresMfa: boolean;
  remainingAttempts: number;
}

/* ——— Audit Log (immutable) ——— */
export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  role: SecurityRole;
  action: string;
  resourceType: string;
  resourceId: string;
  detail: string;
  result: "success" | "failure" | "denied";
  ipAddress: string;
  correlationId: string;
  userAgent: string;
  severity: "info" | "warning" | "error" | "critical";
  metadata: Record<string, string>;
}

/* ——— Security Alert ——— */
export type SecurityAlertType =
  | "failed_login" | "brute_force" | "permission_violation"
  | "privilege_escalation" | "suspicious_activity" | "session_hijacking"
  | "unauthorized_api" | "mfa_failure" | "account_locked"
  | "role_change" | "sensitive_action";

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  user: string;
  userId: string;
  ipAddress: string;
  source: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  correlationId: string;
  metadata: Record<string, string>;
}

/* ——— Compliance Framework ——— */
export type ComplianceFramework =
  | "iso_27001" | "soc_2" | "gdpr" | "wcag" | "owasp_asvs" | "nist_csf";

export interface ComplianceRequirement {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  title: string;
  description: string;
  status: "compliant" | "non_compliant" | "partial" | "not_assessed";
  score: number;
  lastAssessed: string;
  remediationSteps: string[];
  owner: string;
}

export interface ComplianceFrameworkStatus {
  framework: ComplianceFramework;
  label: string;
  overallScore: number;
  requirements: ComplianceRequirement[];
  lastAssessment: string;
  gaps: string[];
  recommendations: string[];
}

/* ——— Security Analytics ——— */
export interface SecurityAnalytics {
  overallSecurityScore: number;
  totalUsers: number;
  activeSessions: number;
  failedLogins24h: number;
  suspiciousActivities24h: number;
  criticalAlerts: number;
  openAlerts: number;
  avgResponseTimeMin: number;
  uptimePercentage: number;
  threatTrends: { date: string; count: number; type: string }[];
  loginSuccessRate: number;
  permissionUsage: { permission: string; usageCount: number }[];
  auditActivity7d: { date: string; count: number }[];
  topRisks: { title: string; score: number; category: string }[];
  riskHeatmap: { zone: string; risk: number; label: string }[];
}

/* ——— Security Report ——— */
export interface SecurityReport {
  id: string;
  title: string;
  type: "security_summary" | "compliance" | "audit_history" | "user_activity"
       | "permission_matrix" | "risk_assessment" | "open_findings" | "recommendations";
  generatedAt: string;
  period: string;
  generatedBy: string;
  format: "json" | "csv" | "pdf" | "html";
  content: Record<string, unknown>;
}

/* ——— Middleware Types ——— */
export interface SecurityContext {
  userId: string;
  username: string;
  role: SecurityRole;
  permissions: SecurityPermission[];
  sessionId: string;
  correlationId: string;
  ipAddress: string;
  userAgent: string;
  isAuthenticated: boolean;
}

export interface MiddlewareResult {
  allowed: boolean;
  status: number;
  error?: string;
  context?: SecurityContext;
}

/* ——— Rate Limiting ——— */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  identifier: string;
}

export interface RateLimitState {
  identifier: string;
  count: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil: number | null;
}

/* ——— Main State ——— */
export interface EnterpriseSecurityData {
  currentUser: SecurityUser | null;
  users: SecurityUser[];
  sessions: UserSession[];
  auditLogs: AuditLog[];
  alerts: SecurityAlert[];
  complianceFrameworks: ComplianceFrameworkStatus[];
  analytics: SecurityAnalytics;
  reports: SecurityReport[];
  roleDefinitions: RoleDefinition[];
  selectedRole: SecurityRole | null;
  loading: boolean;
  lastUpdated: string | null;
}
