export type IncidentType =
  | "medical_emergency"
  | "fire"
  | "security_threat"
  | "crowd_surge"
  | "stampede_risk"
  | "suspicious_package"
  | "infrastructure_failure"
  | "power_failure"
  | "network_failure"
  | "weather_emergency"
  | "vip_incident"
  | "lost_child";

export type Severity = "critical" | "high" | "medium" | "low";
export type Priority = "p0" | "p1" | "p2" | "p3";
export type IncidentStatus =
  | "reported"
  | "analyzing"
  | "assessing"
  | "dispatched"
  | "in_progress"
  | "contained"
  | "resolved";

export type TeamType =
  | "medical_alpha"
  | "medical_bravo"
  | "security_alpha"
  | "security_bravo"
  | "fire_response"
  | "hazmat"
  | "evacuation"
  | "engineering"
  | "vip_protection"
  | "crowd_management"
  | "communications"
  | "command";

export type TeamStatus = "available" | "dispatched" | "on_scene" | "returning";

export type AlertType =
  | "critical_incident"
  | "delayed_response"
  | "resource_shortage"
  | "high_risk_zone"
  | "escalating_event"
  | "communication_failure";

export type MapEntityType =
  | "incident"
  | "medical_team"
  | "security_team"
  | "fire_team"
  | "emergency_exit"
  | "blocked_area"
  | "rally_point"
  | "command_post";

export type EvacuationStatus = "none" | "standby" | "partial" | "full";

export interface Coordinates {
  x: number;
  y: number;
}

export interface TimelineEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  detail: string;
}

export interface AIAnalysis {
  severity: Severity;
  confidence: number;
  estimatedImpact: string;
  recommendedActions: string[];
  estimatedResponseMinutes: number;
  recommendedTeam: TeamType | null;
  evacuationRoutes: string[];
  resourceShortages: string[];
  escalationProbability: number;
  analysisSummary: string;
}

export interface ResponseTeam {
  id: string;
  type: TeamType;
  name: string;
  members: number;
  leader: string;
  status: TeamStatus;
  location: string;
  coordinates: Coordinates;
  incidentId: string | null;
  estimatedArrivalMinutes: number;
  equipment: string[];
  certifications: string[];
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  priority: Priority;
  status: IncidentStatus;
  title: string;
  description: string;
  location: string;
  zoneId: string;
  coordinates: Coordinates;
  reportedAt: string;
  reportedBy: string;
  assignedTeam: string | null;
  assignedTeamType: TeamType | null;
  estimatedResolutionMinutes: number;
  aiConfidence: number;
  aiAnalysis: AIAnalysis;
  timeline: TimelineEntry[];
  lastUpdated: string;
}

export interface SmartAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: Severity;
  incidentId: string | null;
  timestamp: string;
  acknowledged: boolean;
  expiresAt: string;
}

export interface AIRecommendation {
  id: string;
  action: string;
  detail: string;
  priority: Priority;
  confidence: number;
  incidentId: string;
  impact: string;
  requiresApproval: boolean;
  category: "dispatch" | "evacuation" | "communication" | "lockdown" | "medical" | "engineering";
}

export interface MapEntity {
  id: string;
  type: MapEntityType;
  label: string;
  coordinates: Coordinates;
  severity?: Severity;
  status?: string;
  pulse: boolean;
}

export interface DispatchAction {
  id: string;
  incidentId: string;
  action: string;
  teamId: string | null;
  timestamp: string;
  authorizedBy: string | null;
  status: "pending" | "approved" | "executed" | "failed";
  result: string | null;
}

export interface EmergencyAnalytics {
  averageResponseMinutes: number;
  openIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  totalIncidents: number;
  emergencyReadinessScore: number;
  safetyScore: number;
  avgResolutionMinutes: number;
  activeTeams: number;
  availableTeams: number;
  escalationRate: number;
  criticalPerType: Partial<Record<IncidentType, number>>;
  responseTimeHistory: ResponseTimePoint[];
  evacuationStatus: EvacuationStatus;
  affectedZones: string[];
  resourceUtilization: number;
  communicationStatus: "operational" | "degraded" | "failed";
}

export interface ResponseTimePoint {
  incidentId: string;
  incidentType: IncidentType;
  responseMinutes: number;
  timestamp: string;
  severity: Severity;
}

export interface CommandAction {
  type: "dispatch" | "escalate" | "notify" | "broadcast" | "close_area" | "reassign" | "resolve";
  incidentId: string;
  params: Record<string, string>;
  requiresAuth: boolean;
}

export interface EmergencyState {
  incidents: Incident[];
  teams: ResponseTeam[];
  alerts: SmartAlert[];
  recommendations: AIRecommendation[];
  analytics: EmergencyAnalytics;
  mapEntities: MapEntity[];
  dispatchLog: DispatchAction[];
  lastUpdated: string;
}
