export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";
export type IncidentStatus = "open" | "dispatched" | "resolved" | "monitoring";
export type RecommendationPriority = "critical" | "high" | "medium" | "low";
export type AIProviderStatus = "operational" | "degraded" | "down";

export interface StadiumInfo {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export interface TournamentInfo {
  id: string;
  name: string;
  matchDay: number;
  totalMatchDays: number;
}

export interface CurrentMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: "pregame" | "first_half" | "half_time" | "second_half" | "final";
  startTime: string;
}

export interface HeroMetrics {
  attendance: number;
  capacity: number;
  capacityPercent: number;
  weather: {
    condition: string;
    temperature: number;
    icon: string;
  };
  riskLevel: AlertSeverity;
  aiHealthScore: number;
}

export interface AIExecutiveSummary {
  summary: string;
  highlights: AIHighlight[];
  generatedAt: string;
}

export interface AIHighlight {
  type: "positive" | "warning" | "critical" | "info";
  message: string;
}

export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  icon: string;
  trend: number[];
}

export interface AIRecommendation {
  id: string;
  action: string;
  location?: string;
  reason: string;
  expectedImpact: string;
  confidence: number;
  priority: RecommendationPriority;
  estimatedResolutionMinutes: number;
  category: "crowd" | "security" | "parking" | "staff" | "energy" | "operations";
}

export interface Incident {
  id: string;
  time: string;
  location: string;
  type: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  assignedTeam: string;
  aiRecommendation: string;
  description: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  message: string;
  type: "alert" | "action" | "system" | "ai";
  severity?: AlertSeverity;
  module: string;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  secondary?: number;
  label?: string;
}

export interface CommandCenterData {
  stadium: StadiumInfo;
  tournament: TournamentInfo;
  match: CurrentMatch;
  hero: HeroMetrics;
  summary: AIExecutiveSummary;
  kpis: KPIMetric[];
  recommendations: AIRecommendation[];
  incidents: Incident[];
  activityFeed: ActivityEvent[];
  attendanceTimeline: ChartDataPoint[];
  crowdDensityTrend: ChartDataPoint[];
  parkingOccupancy: ChartDataPoint[];
  queueForecast: ChartDataPoint[];
  incidentTimeline: ChartDataPoint[];
  energyUsage: ChartDataPoint[];
  revenueTrend: ChartDataPoint[];
}
