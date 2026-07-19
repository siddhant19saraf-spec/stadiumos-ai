import type { RoleDefinition, SecurityPermission, SecurityRole, ComplianceFrameworkStatus, ComplianceRequirement } from "./types";

/* ——— Role Definitions with Inheritance ——— */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { role: "super_admin", label: "Super Administrator", description: "Full system access with all permissions", inherits: [], priority: 1 },
  { role: "tournament_director", label: "Tournament Director", description: "Event scheduling and tournament operations", inherits: ["operations_manager"], priority: 2 },
  { role: "security_manager", label: "Security Manager", description: "Security operations and emergency response", inherits: [], priority: 3 },
  { role: "operations_manager", label: "Operations Manager", description: "Daily facility and infrastructure operations", inherits: [], priority: 4 },
  { role: "medical_coordinator", label: "Medical Coordinator", description: "Medical response and health safety", inherits: [], priority: 5 },
  { role: "maintenance_manager", label: "Maintenance Manager", description: "Predictive and preventive maintenance", inherits: [], priority: 6 },
  { role: "parking_manager", label: "Parking Manager", description: "Parking operations and traffic management", inherits: [], priority: 7 },
  { role: "energy_manager", label: "Energy Manager", description: "Energy consumption and sustainability", inherits: [], priority: 8 },
  { role: "vendor", label: "Vendor", description: "Limited vendor portal access", inherits: [], priority: 9 },
  { role: "auditor", label: "Read-Only Auditor", description: "Read-only access for compliance auditing", inherits: [], priority: 10 },
  { role: "guest", label: "Guest", description: "Minimal public access", inherits: [], priority: 11 },
];

function resolvePermissions(role: SecurityRole): SecurityPermission[] {
  switch (role) {
    case "super_admin":
      return ALL_PERMISSIONS;
    case "tournament_director":
      return [
        "dashboard:view", "security:view",
        "tournament:view", "tournament:edit", "tournament:manage",
        "crowd:view", "emergency:view",
        "incidents:view", "incidents:create",
        "reports:view", "reports:create", "reports:export",
        "audit:view", "alerts:view", "alerts:acknowledge",
        "logs:view", "compliance:view",
        "maintenance:view",
      ];
    case "security_manager":
      return [
        "dashboard:view", "security:view", "security:manage",
        "emergency:view", "emergency:manage",
        "crowd:view", "crowd:manage",
        "incidents:view", "incidents:create", "incidents:manage",
        "alerts:view", "alerts:acknowledge",
        "audit:view", "audit:export",
        "logs:view", "logs:export",
        "sessions:view", "sessions:revoke",
        "users:view",
        "compliance:view",
        "reports:view", "reports:export",
      ];
    case "operations_manager":
      return [
        "dashboard:view", "security:view",
        "crowd:view", "parking:view", "parking:manage",
        "energy:view", "maintenance:view", "maintenance:approve",
        "incidents:view", "incidents:create",
        "reports:view", "reports:export",
        "alerts:view", "alerts:acknowledge",
        "audit:view", "logs:view",
        "compliance:view",
        "users:view",
      ];
    case "medical_coordinator":
      return [
        "dashboard:view", "security:view",
        "emergency:view", "emergency:manage",
        "incidents:view", "incidents:create", "incidents:manage",
        "alerts:view", "alerts:acknowledge",
        "crowd:view", "audit:view", "logs:view",
        "reports:view", "reports:export",
      ];
    case "maintenance_manager":
      return [
        "dashboard:view", "security:view",
        "maintenance:view", "maintenance:approve",
        "energy:view",
        "incidents:view", "incidents:create",
        "alerts:view", "alerts:acknowledge",
        "reports:view", "reports:export",
        "audit:view", "logs:view",
      ];
    case "parking_manager":
      return [
        "dashboard:view", "security:view",
        "parking:view", "parking:manage",
        "crowd:view",
        "incidents:view", "incidents:create",
        "alerts:view", "alerts:acknowledge",
        "reports:view", "reports:export",
        "audit:view", "logs:view",
      ];
    case "energy_manager":
      return [
        "dashboard:view", "security:view",
        "energy:view", "energy:manage",
        "maintenance:view",
        "incidents:view",
        "alerts:view", "alerts:acknowledge",
        "reports:view", "reports:export",
        "audit:view", "logs:view",
        "compliance:view",
      ];
    case "vendor":
      return [
        "dashboard:view",
        "maintenance:view", "incidents:view",
        "reports:view",
      ];
    case "auditor":
      return [
        "dashboard:view", "security:view",
        "audit:view", "audit:export",
        "logs:view", "logs:export",
        "reports:view", "reports:export",
        "compliance:view",
        "users:view",
        "sessions:view",
        "alerts:view",
        "rbac:view",
      ];
    case "guest":
      return ["dashboard:view"];
  }
}

export const ALL_PERMISSIONS: SecurityPermission[] = [
  "dashboard:view",
  "security:view", "security:manage",
  "users:view", "users:create", "users:edit", "users:delete", "users:manage_roles",
  "tournament:view", "tournament:edit", "tournament:manage",
  "crowd:view", "crowd:manage",
  "emergency:view", "emergency:manage",
  "maintenance:view", "maintenance:approve",
  "parking:view", "parking:manage",
  "energy:view", "energy:manage",
  "incidents:view", "incidents:create", "incidents:manage",
  "audit:view", "audit:export",
  "reports:view", "reports:create", "reports:export",
  "settings:view", "settings:configure",
  "compliance:view", "compliance:manage",
  "sessions:view", "sessions:revoke",
  "alerts:view", "alerts:acknowledge",
  "logs:view", "logs:export",
  "rbac:view", "rbac:manage",
];

/* ——— Permission Label Map ——— */
export const PERMISSION_LABELS: Record<SecurityPermission, string> = {
  "dashboard:view": "View Dashboard",
  "security:view": "View Security",
  "security:manage": "Manage Security",
  "users:view": "View Users",
  "users:create": "Create Users",
  "users:edit": "Edit Users",
  "users:delete": "Delete Users",
  "users:manage_roles": "Manage Roles",
  "tournament:view": "View Tournament",
  "tournament:edit": "Edit Tournament",
  "tournament:manage": "Manage Tournament",
  "crowd:view": "View Crowd Data",
  "crowd:manage": "Manage Crowd",
  "emergency:view": "View Emergency Data",
  "emergency:manage": "Manage Emergency",
  "maintenance:view": "View Maintenance",
  "maintenance:approve": "Approve Maintenance",
  "parking:view": "View Parking",
  "parking:manage": "Manage Parking",
  "energy:view": "View Energy",
  "energy:manage": "Manage Energy",
  "incidents:view": "View Incidents",
  "incidents:create": "Create Incidents",
  "incidents:manage": "Manage Incidents",
  "audit:view": "View Audit Logs",
  "audit:export": "Export Audit Logs",
  "reports:view": "View Reports",
  "reports:create": "Create Reports",
  "reports:export": "Export Reports",
  "settings:view": "View Settings",
  "settings:configure": "Configure Settings",
  "compliance:view": "View Compliance",
  "compliance:manage": "Manage Compliance",
  "sessions:view": "View Sessions",
  "sessions:revoke": "Revoke Sessions",
  "alerts:view": "View Alerts",
  "alerts:acknowledge": "Acknowledge Alerts",
  "logs:view": "View Logs",
  "logs:export": "Export Logs",
  "rbac:view": "View RBAC",
  "rbac:manage": "Manage RBAC",
};

export const ALL_ROLES: SecurityRole[] = [
  "super_admin", "tournament_director", "operations_manager",
  "security_manager", "medical_coordinator", "maintenance_manager",
  "parking_manager", "energy_manager", "vendor", "auditor", "guest",
];

/* ——— Role-to-Permission Resolution ——— */
export const ROLE_PERMISSIONS_MAP: Record<SecurityRole, SecurityPermission[]> = ALL_ROLES.reduce(
  (acc, role) => {
    acc[role] = resolvePermissions(role);
    return acc;
  },
  {} as Record<SecurityRole, SecurityPermission[]>,
);

/* ——— Session Configuration ——— */
export const SESSION_CONFIG = {
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,
  MAX_SESSION_DURATION_MS: 24 * 60 * 60 * 1000,
  MAX_CONCURRENT_SESSIONS: 5,
  REMEMBER_DEVICE_DURATION_MS: 30 * 24 * 60 * 60 * 1000,
  TOKEN_REFRESH_THRESHOLD_MS: 5 * 60 * 1000,
} as const;

/* ——— Security Alert Thresholds ——— */
export const ALERT_THRESHOLDS = {
  MAX_FAILED_LOGINS_BEFORE_LOCK: 5,
  MAX_FAILED_LOGINS_BEFORE_ALERT: 3,
  BRUTE_FORCE_WINDOW_MS: 15 * 60 * 1000,
  SUSPICIOUS_LOGIN_GEO_RADIUS_KM: 100,
  SESSION_HIJACKING_IP_CHANGE: true,
  PRIVILEGE_ESCALATION_MONITOR: true,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  API_KEY_ROTATION_DAYS: 90,
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REQUIRE_MFA: true,
} as const;

/* ——— Compliance Frameworks ——— */
function makeComplianceFramework(
  framework: ComplianceFrameworkStatus["framework"],
  label: string,
  controls: { id: string; title: string; description: string }[],
  baseScore: number,
): ComplianceFrameworkStatus {
  const requirements: ComplianceRequirement[] = controls.map((c, i) => ({
    id: `${framework}-${c.id}`,
    framework,
    controlId: c.id,
    title: c.title,
    description: c.description,
    status: (i < Math.floor(controls.length * (baseScore / 100)) ? "compliant"
      : i < Math.floor(controls.length * ((baseScore + 15) / 100)) ? "partial"
      : "non_compliant") as ComplianceRequirement["status"],
    score: Math.round(baseScore + (Math.random() * 20 - 10)),
    lastAssessed: new Date().toISOString(),
    remediationSteps: ["Review control documentation", "Implement missing controls", "Schedule re-assessment"],
    owner: label.includes("GDPR") ? "Data Protection Officer" : "Security Team",
  }));
  const compliant = requirements.filter((r) => r.status === "compliant").length;
  const overallScore = Math.round((compliant / requirements.length) * 100);
  return {
    framework,
    label,
    overallScore,
    requirements,
    lastAssessment: new Date().toISOString(),
    gaps: requirements.filter((r) => r.status !== "compliant").map((r) => `${r.controlId}: ${r.title}`),
    recommendations: [
      "Implement continuous monitoring",
      "Schedule quarterly assessments",
      "Document all control implementations",
    ],
  };
}

export const COMPLIANCE_FRAMEWORKS: ComplianceFrameworkStatus[] = [
  makeComplianceFramework("iso_27001", "ISO 27001", [
    { id: "a5", title: "Information Security Policies", description: "Policy framework for information security" },
    { id: "a6", title: "Organization of Information Security", description: "Internal organization and external parties" },
    { id: "a7", title: "Human Resource Security", description: "Prior to employment, during, and termination" },
    { id: "a8", title: "Asset Management", description: "Inventory, classification, and media handling" },
    { id: "a9", title: "Access Control", description: "Business requirements, user access, and responsibilities" },
    { id: "a10", title: "Cryptography", description: "Encryption and key management" },
    { id: "a11", title: "Physical Security", description: "Secure areas, equipment security" },
    { id: "a12", title: "Operations Security", description: "Procedures, malware, backup, logging" },
    { id: "a13", title: "Communications Security", description: "Network security, information transfer" },
    { id: "a14", title: "System Acquisition & Development", description: "Security requirements, development lifecycle" },
    { id: "a15", title: "Supplier Relationships", description: "Security in supplier agreements" },
    { id: "a16", title: "Incident Management", description: "Reporting, response, and lessons learned" },
    { id: "a17", title: "Business Continuity", description: "BCM, redundancies, and testing" },
    { id: "a18", title: "Compliance", description: "Legal, contractual, and regulatory compliance" },
  ], 72),
  makeComplianceFramework("soc_2", "SOC 2", [
    { id: "cc1", title: "Control Environment", description: "Integrity and ethical values" },
    { id: "cc2", title: "Communication", description: "Information and communication systems" },
    { id: "cc3", title: "Risk Assessment", description: "Risk identification and analysis" },
    { id: "cc4", title: "Monitoring Activities", description: "Ongoing and separate evaluations" },
    { id: "cc5", title: "Control Activities", description: "Policies and procedures" },
    { id: "cc6", title: "Logical & Physical Access", description: "Access controls and security" },
    { id: "cc7", title: "System Operations", description: "Monitoring, incident response" },
    { id: "cc8", title: "Change Management", description: "System changes and updates" },
    { id: "cc9", title: "Risk Mitigation", description: "Business disruption risks" },
  ], 68),
  makeComplianceFramework("gdpr", "GDPR", [
    { id: "art5", title: "Lawful Processing", description: "Principles of data processing" },
    { id: "art6", title: "Lawfulness of Processing", description: "Legal basis for processing" },
    { id: "art7", title: "Consent", description: "Conditions for consent" },
    { id: "art15", title: "Right of Access", description: "Data subject access rights" },
    { id: "art16", title: "Right to Rectification", description: "Correct inaccurate data" },
    { id: "art17", title: "Right to Erasure", description: "Right to be forgotten" },
    { id: "art32", title: "Security of Processing", description: "Technical and organizational measures" },
    { id: "art33", title: "Data Breach Notification", description: "72-hour notification requirement" },
    { id: "art35", title: "DPIA", description: "Data protection impact assessment" },
    { id: "art37", title: "DPO Designation", description: "Data protection officer appointment" },
  ], 65),
  makeComplianceFramework("wcag", "WCAG 2.2 AA", [
    { id: "1.1.1", title: "Non-text Content", description: "Alt text for images" },
    { id: "1.2.1", title: "Audio-only/Video-only", description: "Captions and transcripts" },
    { id: "1.3.1", title: "Info and Relationships", description: "Semantic structure" },
    { id: "1.4.3", title: "Color Contrast", description: "Minimum contrast ratio" },
    { id: "2.1.1", title: "Keyboard", description: "Full keyboard access" },
    { id: "2.4.1", title: "Bypass Blocks", description: "Skip navigation" },
    { id: "2.4.4", title: "Link Purpose", description: "Descriptive link text" },
    { id: "3.1.1", title: "Language of Page", description: "Programmatic language" },
    { id: "3.3.2", title: "Labels/Instructions", description: "Form input labels" },
    { id: "4.1.2", title: "Name, Role, Value", description: "ARIA attributes" },
  ], 82),
  makeComplianceFramework("owasp_asvs", "OWASP ASVS", [
    { id: "v1", title: "Architecture & Design", description: "Security architecture review" },
    { id: "v2", title: "Authentication", description: "Authentication verification" },
    { id: "v3", title: "Session Management", description: "Session security controls" },
    { id: "v4", title: "Access Control", description: "Authorization checks" },
    { id: "v5", title: "Input Validation", description: "Sanitization and encoding" },
    { id: "v6", title: "Cryptography", description: "Cryptographic practices" },
    { id: "v7", title: "Error Handling & Logging", description: "Error and log management" },
    { id: "v8", title: "Data Protection", description: "Data security in transit/rest" },
    { id: "v9", title: "Communications", description: "TLS and network security" },
    { id: "v10", title: "Malicious Code", description: "Code integrity checks" },
    { id: "v11", title: "Business Logic", description: "Business logic verification" },
    { id: "v12", title: "Files & Resources", description: "File upload and resource management" },
  ], 58),
  makeComplianceFramework("nist_csf", "NIST CSF", [
    { id: "id", title: "Identify", description: "Asset management, governance, risk assessment" },
    { id: "pr", title: "Protect", description: "Access control, awareness, data security" },
    { id: "de", title: "Detect", description: "Anomalies, monitoring, detection processes" },
    { id: "rs", title: "Respond", description: "Response planning, communications, analysis" },
    { id: "rc", title: "Recover", description: "Recovery planning, improvements, communications" },
  ], 60),
];

/* ——— Mock Users ——— */
export const MOCK_USERS = [
  { id: "u-001", username: "admin", email: "admin@stadiumos.ai", displayName: "Alex Administrator", role: "super_admin" as const, department: "Executive", status: "active" as const, mfaEnabled: true },
  { id: "u-002", username: "director", email: "director@stadiumos.ai", displayName: "Taylor Tournament", role: "tournament_director" as const, department: "Tournament Operations", status: "active" as const, mfaEnabled: false },
  { id: "u-003", username: "security", email: "security@stadiumos.ai", displayName: "Sam Security", role: "security_manager" as const, department: "Security", status: "active" as const, mfaEnabled: true },
  { id: "u-004", username: "ops", email: "ops@stadiumos.ai", displayName: "Jordan Operations", role: "operations_manager" as const, department: "Operations", status: "active" as const, mfaEnabled: false },
  { id: "u-005", username: "medical", email: "medical@stadiumos.ai", displayName: "Morgan Medical", role: "medical_coordinator" as const, department: "Medical", status: "active" as const, mfaEnabled: false },
  { id: "u-006", username: "maintenance", email: "maintenance@stadiumos.ai", displayName: "Casey Caretaker", role: "maintenance_manager" as const, department: "Facilities", status: "active" as const, mfaEnabled: false },
  { id: "u-007", username: "parking", email: "parking@stadiumos.ai", displayName: "Pat Parking", role: "parking_manager" as const, department: "Parking", status: "active" as const, mfaEnabled: false },
  { id: "u-008", username: "energy", email: "energy@stadiumos.ai", displayName: "Eve Energy", role: "energy_manager" as const, department: "Energy", status: "active" as const, mfaEnabled: false },
  { id: "u-009", username: "vendor1", email: "vendor@external.com", displayName: "Victor Vendor", role: "vendor" as const, department: "External", status: "active" as const, mfaEnabled: false },
  { id: "u-010", username: "auditor", email: "auditor@stadiumos.ai", displayName: "Audrey Auditor", role: "auditor" as const, department: "Compliance", status: "active" as const, mfaEnabled: false },
  { id: "u-011", username: "guest1", email: "guest@stadiumos.ai", displayName: "Guest User", role: "guest" as const, department: "Public", status: "active" as const, mfaEnabled: false },
  { id: "u-012", username: "locked_user", email: "locked@stadiumos.ai", displayName: "Luke Locked", role: "operations_manager" as const, department: "Operations", status: "locked" as const, mfaEnabled: false },
  { id: "u-013", username: "suspended_user", email: "suspended@stadiumos.ai", displayName: "Sasha Suspended", role: "vendor" as const, department: "External", status: "suspended" as const, mfaEnabled: false },
];

/* ——— Department Colors for UI ——— */
export const DEPARTMENT_COLORS: Record<string, string> = {
  Executive: "#6366f1",
  "Tournament Operations": "#f59e0b",
  Security: "#ef4444",
  Operations: "#3b82f6",
  Medical: "#10b981",
  Facilities: "#8b5cf6",
  Parking: "#14b8a6",
  Energy: "#f97316",
  External: "#6b7280",
  Compliance: "#06b6d4",
  Public: "#9ca3af",
};
