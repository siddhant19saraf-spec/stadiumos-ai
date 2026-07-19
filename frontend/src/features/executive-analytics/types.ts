export type ExecutiveRole =
  | "ceo" | "coo" | "tournament_director" | "security_director"
  | "operations_manager" | "maintenance_manager" | "energy_manager" | "medical_coordinator";

export type KpiCategory =
  | "operations" | "safety" | "crowd" | "tournament" | "emergency"
  | "infrastructure" | "parking" | "queue" | "energy" | "sustainability"
  | "financial" | "satisfaction" | "risk";

export type AlertSeverity = "critical" | "severe" | "high" | "medium" | "low";
export type AlertCategory =
  | "critical_incident" | "high_risk" | "infrastructure_failure" | "safety_issue"
  | "resource_shortage" | "budget_overrun" | "esg_risk" | "weather_threat"
  | "crowd_safety" | "security_breach" | "power_failure" | "network_outage";
export type DecisionStatus = "active" | "implemented" | "dismissed" | "in_review";
export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface ExecutiveKpi {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  category: KpiCategory;
  trend: "up" | "down" | "stable";
  status: "critical" | "warning" | "healthy" | "neutral";
  changePct: number;
  changeDirection: "increase" | "decrease" | "unchanged";
  tooltip: string;
  target?: number;
  benchmark?: number;
}

export interface ExecutiveSummary {
  operationalHealthScore: number;
  safetyScore: number;
  crowdHealthScore: number;
  tournamentProgress: number;
  emergencyStatus: "normal" | "elevated" | "critical";
  infrastructureHealth: number;
  parkingUtilization: number;
  queuePerformance: number;
  energyEfficiency: number;
  carbonScore: number;
  financialPerformance: number;
  visitorSatisfaction: number;
  executiveRiskScore: number;
  activeDecisions: number;
  unacknowledgedAlerts: number;
  criticalAlerts: number;
  totalIncidents: number;
  activeIncidents: number;
  matchDayStatus: "active" | "preparing" | "standby";
  lastUpdated: string;
}

export interface DecisionRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "p0" | "p1" | "p2" | "p3";
  status: DecisionStatus;
  reasoning: string[];
  confidence: number;
  supportingEvidence: string[];
  businessImpact: string;
  operationalImpact: string;
  riskAssessment: string;
  alternativeOptions: string[];
  sourceModule: string;
  estimatedCostImpact: number;
  estimatedTimeImpact: string;
  requiresAuthorization: boolean;
  authorizedBy: string | null;
  createdAt: string;
  implementedAt: string | null;
}

export interface ExecutiveAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: AlertCategory;
  sourceModule: string;
  involvesModules: string[];
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  requiresExecutiveAction: boolean;
  aiSuggestion: string;
  escalationLevel: "normal" | "escalated" | "executive" | "board";
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "incident" | "operation" | "maintenance" | "security_event" | "weather_event"
       | "resource_allocation" | "ai_recommendation" | "executive_decision" | "milestone";
  title: string;
  description: string;
  severity: "positive" | "info" | "warning" | "critical";
  category: string;
  module: string;
  associatedDecisionId?: string;
  associatedAlertId?: string;
  acknowledged: boolean;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  confidence?: number;
  sources?: string[];
  recommendations?: { title: string; confidence: number }[];
}

export interface CopilotQueryResult {
  answer: string;
  confidence: number;
  sources: string[];
  recommendations: { title: string; confidence: number; priority: string }[];
  relevantKpis: string[];
  dataPoints: { label: string; value: string }[];
  riskFlags: string[];
}

export interface RoleConfig {
  role: ExecutiveRole;
  label: string;
  description: string;
  kpiCategories: KpiCategory[];
  priorityModules: string[];
  defaultView: string;
}

export interface BoardReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  executiveSummary: string;
  operationalOverview: string;
  kpiScorecards: { category: KpiCategory; kpis: ExecutiveKpi[] }[];
  incidentSummary: string;
  resourceUtilization: string;
  infrastructureHealth: string;
  riskAnalysis: string;
  financialOverview: string;
  sustainabilityOverview: string;
  topRecommendations: DecisionRecommendation[];
  strategicRoadmap: string;
  forecastSummary: string;
}

export interface RiskAssessment {
  id: string;
  category: string;
  title: string;
  description: string;
  level: RiskLevel;
  probability: number;
  impact: number;
  riskScore: number;
  affectedModules: string[];
  mitigationActions: string[];
  owner: string;
  status: "active" | "mitigated" | "monitoring" | "closed";
  trend: "improving" | "stable" | "worsening";
  lastUpdated: string;
}

export interface ModuleSnapshot {
  moduleId: string;
  moduleName: string;
  status: "healthy" | "warning" | "critical" | "offline";
  healthScore: number;
  activeAlerts: number;
  summary: string;
  kpis: { label: string; value: string; status: "healthy" | "warning" | "critical" }[];
  lastUpdated: string;
}

export interface ExecutiveAnalyticsData {
  summary: ExecutiveSummary;
  kpis: ExecutiveKpi[];
  decisions: DecisionRecommendation[];
  alerts: ExecutiveAlert[];
  timeline: TimelineEvent[];
  risks: RiskAssessment[];
  moduleSnapshots: ModuleSnapshot[];
  copilotHistory: CopilotMessage[];
  lastReport: BoardReport | null;
  selectedRole: ExecutiveRole;
  loading: boolean;
  lastUpdated: string | null;
}
