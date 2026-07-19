export type AssetType =
  | "hvac" | "lighting" | "scoreboard" | "video_wall" | "power_distribution"
  | "generator" | "elevator" | "escalator" | "fire_safety" | "emergency_lighting"
  | "water_pump" | "plumbing" | "networking" | "wifi" | "cctv"
  | "turnstile" | "entry_gate" | "parking_barrier" | "ev_charger" | "pa_system" | "digital_signage";

export type ZoneLocation =
  | "north_stand" | "south_stand" | "east_stand" | "west_stand"
  | "main_concourse" | "east_concourse" | "west_concourse"
  | "vip_lounge" | "press_box" | "control_room" | "basement"
  | "roof" | "parking" | "perimeter" | "admin";

export type AssetStatus = "healthy" | "warning" | "critical" | "offline";
export type MaintenanceStatus = "none" | "scheduled" | "in_progress" | "overdue";
export type AlertSeverity = "critical" | "severe" | "warning" | "info";
export type AlertCategory = "failure_risk" | "environmental" | "safety" | "operational" | "maintenance_due" | "system";
export type WorkOrderPriority = "emergency" | "urgent" | "high" | "medium" | "low";
export type WorkOrderStatus = "open" | "in_progress" | "completed" | "cancelled";
export type FailureMode =
  | "mechanical_wear" | "electrical_fault" | "component_failure" | "battery_degradation"
  | "sensor_drift" | "cooling_failure" | "power_instability" | "network_failure"
  | "performance_degradation" | "overheating" | "firmware_corruption" | "physical_damage";

export interface Coordinates { x: number; y: number; }

export interface MaintenanceAsset {
  id: string;
  name: string;
  type: AssetType;
  zone: ZoneLocation;
  location?: string;
  installDate: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  coordinates?: Coordinates;
  criticality: "critical" | "high" | "medium" | "low";
}

export interface AssetHealth {
  assetId: string;
  assetName: string;
  type: AssetType;
  status: AssetStatus;
  healthScore: number;
  riskScore: number;
  temperature: number;
  powerUsageKw: number;
  utilization: number;
  predictedFailureDate: string | null;
  remainingUsefulLife: string | null;
  lastMaintenance: string;
  maintenanceStatus: MaintenanceStatus;
  vibrationMmS: number;
  pressureBar: number;
  criticality?: "critical" | "high" | "medium" | "low";
  lastUpdated: string;
}

export interface FailurePrediction {
  assetId: string;
  assetName: string;
  failureMode: FailureMode;
  probability: number;
  predictedDays: number;
  confidence: number;
  reasoning: string[];
  contributingFactors: string[];
  recommendedAction: string;
  estimatedCostImpact: string;
  operationalImpact: string;
  timestamp: string;
}

export interface WorkOrder {
  id: string;
  assetId: string;
  assetName: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  requiredSkills: string[];
  estimatedRepairMin: number;
  requiredParts: string[];
  safetyInstructions: string[];
  aiReasoning: string;
  businessImpact: string;
  createdAt: string;
  completedAt: string | null;
  assignedTeam: string | null;
}

export interface Alert {
  id: string;
  assetId: string;
  assetName: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  suggestedAction: string | null;
  requiresImmediateAction: boolean;
  acknowledged: boolean;
  predictionRelated: boolean;
  createdAt: string;
  acknowledgedAt: string | null;
}

export type SimulationScenario =
  | "power_failure" | "cooling_failure" | "network_failure" | "generator_failure"
  | "camera_failure" | "sensor_failure" | "fire_alarm_failure" | "water_leakage"
  | "overheating" | "unexpected_shutdown";

export interface ScenarioDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  impactDescription: string;
  mitigationFactor: number;
}

export interface SimulationResult {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  assetsInScope: { assetId: string; assetName: string; riskReduction: string }[];
  predictedDowntime: number;
  mitigatedDowntime: number;
  downtimeAverted: number;
  predictedCostImpact: number;
  mitigatedCostImpact: number;
  costSavings: number;
  recommendedActions: string[];
  scenarioSteps: string[];
  timestamp: string;
}

export interface AnalyticsSummary {
  totalAssets: number;
  averageHealthScore: number;
  criticalAssets: number;
  warningAssets: number;
  healthyAssets: number;
  offlineAssets: number;
  highRiskAssets: number;
  totalPredictions: number;
  highProbabilityFailures: number;
  openWorkOrders: number;
  highPriorityOrders: number;
  completionRate: number;
  maintenanceCompliance: number;
  averageResponseTime: string;
  lastUpdated: string;
}

export interface TrendData {
  date: string;
  avgHealthScore: number;
  avgRiskScore: number;
  predictedFailures: number;
}
