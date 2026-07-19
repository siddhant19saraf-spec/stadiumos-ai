export type ZoneType =
  | "seating" | "gate_entry" | "gate_exit" | "vip" | "concourse"
  | "food_court" | "parking" | "medical" | "security" | "camera"
  | "restroom" | "elevator" | "emergency_exit" | "maintenance" | "control_center"
  | "broadcast" | "media" | "storage" | "retail" | "first_aid";

export type LayerId =
  | "crowd_density" | "parking" | "security_teams" | "medical_teams"
  | "incidents" | "maintenance" | "weather" | "energy" | "queues"
  | "cleaning" | "broadcast" | "iot_sensors";

export type SimulationScenario =
  | "heavy_rain" | "power_failure" | "medical_emergency" | "crowd_surge"
  | "fire" | "network_failure" | "parking_overflow" | "vip_arrival"
  | "final_match_crowd" | "weather_delay";

export type ZoneStatus = "operational" | "degraded" | "offline" | "emergency";
export type AlertSeverity = "critical" | "high" | "medium" | "low";

export interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StadiumZone {
  id: string;
  name: string;
  type: ZoneType;
  coordinates: Coordinates;
  section?: string;
  level: number;
}

export interface ZoneLiveStatus {
  zoneId: string;
  currentOccupancy: number;
  maxCapacity: number;
  occupancyPercent: number;
  riskScore: number;
  safetyScore: number;
  queueTimeMinutes: number;
  temperature: number;
  status: ZoneStatus;
  maintenanceStatus: "none" | "scheduled" | "in_progress" | "overdue";
  predictedOccupancy30m: number;
  energyUsageKw: number;
  cleaningStatus: "clean" | "due" | "in_progress";
  lastUpdated: string;
}

export interface LayerConfig {
  id: LayerId;
  label: string;
  enabled: boolean;
  icon: string;
  color: string;
  opacity: number;
}

export interface MapEntity {
  id: string;
  zoneId: string;
  type: "team" | "incident" | "asset" | "sensor" | "vehicle";
  label: string;
  coordinates: { x: number; y: number };
  status?: string;
  pulse: boolean;
  layer: LayerId;
}

export interface DigitalIncident {
  id: string;
  type: "medical" | "security" | "fire" | "lost_child" | "maintenance" | "weather";
  title: string;
  description: string;
  severity: AlertSeverity;
  zoneId: string;
  zoneName: string;
  timestamp: string;
  status: "active" | "resolved" | "monitoring";
  assignedTeam?: string;
}

export interface LiveAnalytics {
  operationalHealth: number;
  safetyIndex: number;
  energyUsageMw: number;
  maintenanceHealth: number;
  parkingUtilization: number;
  resourceUtilization: number;
  queueHealth: number;
  totalOccupancy: number;
  totalCapacity: number;
  activeIncidents: number;
  activeTeams: number;
  avgTemperature: number;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: "warning" | "prediction" | "recommendation" | "observation";
  severity: AlertSeverity;
  zoneId?: string;
  confidence: number;
  timestamp: string;
  suggestedAction?: string;
}

export interface ZoneRecommendation {
  zoneId: string;
  zoneName: string;
  currentOccupancyPercent: number;
  predictedOccupancyPercent: number;
  timeToPrediction: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  confidence: number;
}

export interface SimulationState {
  active: boolean;
  scenario: SimulationScenario | null;
  speed: number;
  elapsedMs: number;
  startTime: string | null;
}

export interface TimeTravelState {
  active: boolean;
  currentTimestamp: string;
  speed: number;
  direction: "forward" | "backward" | "paused";
  availableRange: { start: string; end: string };
}

export interface TimelineSnapshot {
  timestamp: string;
  label: string;
  zones: ZoneLiveStatus[];
  entities: MapEntity[];
  incidents: DigitalIncident[];
  analytics: LiveAnalytics;
}

export interface DigitalTwinState {
  zones: StadiumZone[];
  zoneStatuses: Map<string, ZoneLiveStatus>;
  layers: LayerConfig[];
  entities: MapEntity[];
  incidents: DigitalIncident[];
  analytics: LiveAnalytics;
  insights: AIInsight[];
  recommendations: Map<string, ZoneRecommendation>;
  simulation: SimulationState;
  timeTravel: TimeTravelState;
  selectedZoneId: string | null;
  highlightedAssetId: string | null;
  snapshots: TimelineSnapshot[];
  lastUpdated: string;
}
