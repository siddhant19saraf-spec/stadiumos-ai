import type { RoleConfig } from "./types";

export const EXECUTIVE_ROLES: RoleConfig[] = [
  { role: "ceo", label: "Chief Executive Officer", description: "Strategic overview of all operations", kpiCategories: ["operations", "financial", "sustainability", "satisfaction", "risk"], priorityModules: ["operations", "financial", "sustainability"], defaultView: "overview" },
  { role: "coo", label: "Chief Operations Officer", description: "Daily operations and resource allocation", kpiCategories: ["operations", "parking", "queue", "energy", "satisfaction"], priorityModules: ["operations", "parking", "queue"], defaultView: "overview" },
  { role: "tournament_director", label: "Tournament Director", description: "Event scheduling and tournament operations", kpiCategories: ["tournament", "operations", "satisfaction", "crowd"], priorityModules: ["tournament", "crowd", "operations"], defaultView: "overview" },
  { role: "security_director", label: "Security Director", description: "Safety, security, and emergency response", kpiCategories: ["safety", "emergency", "risk", "crowd"], priorityModules: ["safety", "emergency", "crowd"], defaultView: "overview" },
  { role: "operations_manager", label: "Operations Manager", description: "Facility and infrastructure management", kpiCategories: ["operations", "infrastructure", "parking", "queue", "energy"], priorityModules: ["operations", "infrastructure", "energy"], defaultView: "overview" },
  { role: "maintenance_manager", label: "Maintenance Manager", description: "Predictive and preventive maintenance", kpiCategories: ["infrastructure", "operations", "energy"], priorityModules: ["infrastructure", "energy", "operations"], defaultView: "overview" },
  { role: "energy_manager", label: "Energy Manager", description: "Energy consumption and sustainability", kpiCategories: ["energy", "sustainability", "financial"], priorityModules: ["energy", "sustainability", "infrastructure"], defaultView: "overview" },
  { role: "medical_coordinator", label: "Medical Coordinator", description: "Medical response and health safety", kpiCategories: ["safety", "emergency", "crowd"], priorityModules: ["safety", "emergency", "crowd"], defaultView: "overview" },
];

export const ALERT_THRESHOLDS = {
  OPERATIONAL_HEALTH_MIN: 60,
  SAFETY_SCORE_MIN: 70,
  RISK_SCORE_MAX: 40,
  EMERGENCY_ELEVATED_COUNT: 3,
  EMERGENCY_CRITICAL_COUNT: 1,
  INFRASTRUCTURE_HEALTH_MIN: 55,
  CROWD_HEALTH_MIN: 65,
  QUEUE_PERFORMANCE_MIN: 60,
  ENERGY_EFFICIENCY_MIN: 65,
  CARBON_SCORE_MIN: 50,
  FINANCIAL_PERFORMANCE_MIN: 60,
  VISITOR_SATISFACTION_MIN: 70,
  PARKING_UTILIZATION_MAX: 85,
};

export const KPI_CATEGORY_LABELS: Record<string, string> = {
  operations: "Operations", safety: "Safety & Security", crowd: "Crowd Intelligence",
  tournament: "Tournament Ops", emergency: "Emergency Response", infrastructure: "Infrastructure",
  parking: "Smart Parking", queue: "Queue Analytics", energy: "Energy & Sustainability",
  sustainability: "Sustainability", financial: "Financial", satisfaction: "Visitor Experience", risk: "Risk",
};

export const KPI_CATEGORY_ICONS: Record<string, string> = {
  operations: "Settings", safety: "Shield", crowd: "Users", tournament: "Calendar",
  emergency: "Siren", infrastructure: "Building2", parking: "Car", queue: "Clock",
  energy: "Zap", sustainability: "Leaf", financial: "DollarSign", satisfaction: "Heart", risk: "AlertTriangle",
};

export const MODULE_NAMES: Record<string, string> = {
  "command-center": "Command Center", "tournament-ops": "Tournament Operations",
  "crowd-intelligence": "Crowd Intelligence", "emergency-response": "Emergency Response",
  "smart-parking": "Smart Parking", "queue-prediction": "Queue Analytics",
  "predictive-maintenance": "Predictive Maintenance", sustainability: "Sustainability Intelligence",
  energy: "Energy Management", "digital-twin": "Digital Twin",
};
