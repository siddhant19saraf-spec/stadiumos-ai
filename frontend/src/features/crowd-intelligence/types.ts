export type ZoneStatus = "normal" | "moderate" | "congested" | "critical";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type PredictionType = "crowd_movement" | "congestion" | "queue_growth" | "gate_overload" | "exit_congestion" | "emergency_risk" | "weather_impact" | "parking_overflow";

export interface StadiumZone {
  id: string;
  name: string;
  type: "gate" | "concourse" | "section" | "concession" | "restroom" | "vip" | "exit";
  capacity: number;
  currentCount: number;
  densityPercent: number;
  status: ZoneStatus;
  safetyScore: number;
  waitTimeMinutes: number;
  movementSpeed: number;
  trend: "increasing" | "stable" | "decreasing";
  location: { x: number; y: number; width: number; height: number };
  prediction30m?: number;
}

export interface CrowdAnalytics {
  totalVisitors: number;
  currentOccupancy: number;
  capacityPercent: number;
  visitorsPerMinute: number;
  congestionScore: number;
  riskScore: number;
  safetyIndex: number;
  avgMovementSpeed: number;
  heatIndex: number;
  peakForecast: number;
  peakTime: string;
}

export interface CrowdPrediction {
  id: string;
  type: PredictionType;
  title: string;
  description: string;
  confidence: number;
  severity: AlertSeverity;
  timeToOccur: string;
  affectedZone: string;
  contributingFactors: string[];
  suggestedAction: string;
  businessImpact: string;
}

export interface CrowdRecommendation {
  id: string;
  action: string;
  location: string;
  reason: string;
  priority: "critical" | "high" | "medium" | "low";
  confidence: number;
  expectedImpact: string;
  implementationTime: string;
  category: "entry" | "exit" | "security" | "staff" | "communication" | "infrastructure";
}

export interface CrowdAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  zone: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface ZoneCrowdData {
  zoneId: string;
  currentCount: number;
  predicted30m: number;
  predicted60m: number;
  safetyScore: number;
  movementSpeed: number;
  densityPercent: number;
  waitTime: number;
  status: ZoneStatus;
  trend: "increasing" | "stable" | "decreasing";
  flowRate: number;
}

export interface CrowdTimelinePoint {
  timestamp: string;
  actual: number;
  predicted: number;
  upperBound: number;
  lowerBound: number;
}

export interface GateUtilization {
  gateName: string;
  currentRate: number;
  capacity: number;
  utilizationPercent: number;
  waitTime: number;
  trend: "increasing" | "stable" | "decreasing";
}

export interface QueueGrowthPoint {
  timestamp: string;
  location: string;
  currentLength: number;
  predictedLength30m: number;
  growthRate: number;
}

export interface AIInsight {
  id: string;
  title: string;
  detail: string;
  type: "prediction" | "observation" | "warning" | "recommendation";
  timestamp: string;
  confidence: number;
}

export interface HeatmapConfig {
  minOpacity: number;
  maxOpacity: number;
  colorStops: Array<{ threshold: number; color: string }>;
}

export interface SimulationState {
  zones: StadiumZone[];
  analytics: CrowdAnalytics;
  predictions: CrowdPrediction[];
  recommendations: CrowdRecommendation[];
  alerts: CrowdAlert[];
  insights: AIInsight[];
  timeline: CrowdTimelinePoint[];
  gateUtilization: GateUtilization[];
  queueGrowth: QueueGrowthPoint[];
}
