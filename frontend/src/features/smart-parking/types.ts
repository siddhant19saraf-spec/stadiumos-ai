export type ParkingLotType =
  | "general" | "vip" | "staff" | "accessible" | "ev_charging"
  | "overflow" | "media" | "bus" | "rental" | "rideshare";

export type SlotStatus = "available" | "occupied" | "reserved" | "blocked" | "maintenance";

export type RoadDirection = "entry" | "exit" | "two_way";
export type RoadStatus = "open" | "congested" | "closed" | "construction";
export type CongestionLevel = "low" | "moderate" | "high" | "severe";

export type AlertType =
  | "parking_full" | "traffic_congestion" | "road_blocked" | "ev_chargers_full"
  | "vip_arrival" | "overflow_activated" | "accident" | "road_closure"
  | "queue_threshold" | "event_exit_surge";

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export type SimulationScenario =
  | "heavy_rain" | "vip_arrival" | "final_match" | "power_failure"
  | "overflow_parking" | "emergency_evacuation" | "road_closure"
  | "event_exit_surge" | "peak_traffic" | "holiday_event";

export interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ParkingLot {
  id: string;
  name: string;
  type: ParkingLotType;
  capacity: number;
  coordinates: Coordinates;
  entryRoadId: string;
  exitRoadId: string;
}

export interface ParkingSlot {
  id: string;
  lotId: string;
  slotNumber: string;
  type: ParkingLotType;
  status: SlotStatus;
  vehicleId?: string;
  reservedFor?: string;
  evChargingActive: boolean;
}

export interface ParkingLotStatus {
  lotId: string;
  lotName: string;
  type: ParkingLotType;
  totalSlots: number;
  occupied: number;
  available: number;
  reserved: number;
  blocked: number;
  occupancyPercent: number;
  evChargingUsed: number;
  evChargingTotal: number;
  vehicleTurnoverRate: number;
  avgParkingDurationMin: number;
  predictedFullTime: string | null;
  lastUpdated: string;
}

export interface TrafficRoad {
  id: string;
  name: string;
  direction: RoadDirection;
  status: RoadStatus;
  currentSpeedKmph: number;
  freeFlowSpeedKmph: number;
  queueLengthMeters: number;
  congestionLevel: CongestionLevel;
  vehicleCount: number;
  gateCongestionPercent: number;
  coordinates: { x1: number; y1: number; x2: number; y2: number };
}

export interface TrafficCondition {
  totalVehicles: number;
  activeRoads: number;
  blockedRoads: number;
  congestedRoads: number;
  avgSpeed: number;
  avgQueueLength: number;
  trafficHealthScore: number;
  gateCongestionAvg: number;
  lastUpdated: string;
}

export interface ParkingPrediction {
  lotId: string;
  predictedOccupancy30m: number;
  predictedOccupancy60m: number;
  predictedOccupancy120m: number;
  arrivalRatePerMin: number;
  departureRatePerMin: number;
  peakOccupancyTime: string;
  overflowProbability: number;
  evDemandPercent: number;
  accessibleDemandPercent: number;
  confidence: number;
  timestamp: string;
}

export interface TrafficPrediction {
  roadId: string;
  predictedCongestion30m: CongestionLevel;
  predictedSpeed30m: number;
  predictedQueue30m: number;
  surgeProbability: number;
  estimatedClearTime: string | null;
  confidence: number;
  timestamp: string;
}

export interface ParkingAlert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  locationId: string;
  locationName: string;
  timestamp: string;
  acknowledged: boolean;
  autoResolved: boolean;
}

export interface ParkingRecommendation {
  id: string;
  action: string;
  detail: string;
  priority: "urgent" | "high" | "medium" | "low";
  impact: string;
  locationId: string;
  locationName: string;
  reasoning: string[];
  confidence: number;
  timestamp: string;
}

export interface ParkingAnalytics {
  avgOccupancyPercent: number;
  peakUtilizationPercent: number;
  peakTime: string;
  avgParkingDurationMin: number;
  vehicleTurnoverAvg: number;
  trafficDelayMin: number;
  aiOptimizationScore: number;
  totalVehiclesProcessed: number;
  avgEvChargerUsage: number;
  accessibleUtilization: number;
  overflowUtilization: number;
  queueHealthIndex: number;
}

export interface SimulationState {
  active: boolean;
  scenario: SimulationScenario | null;
  speed: number;
  startedAt: string | null;
  elapsedMs: number;
}

export interface SmartParkingState {
  lots: ParkingLot[];
  slotStatuses: Map<string, ParkingLotStatus>;
  roads: TrafficRoad[];
  traffic: TrafficCondition;
  predictions: ParkingPrediction[];
  trafficPredictions: TrafficPrediction[];
  recommendations: ParkingRecommendation[];
  alerts: ParkingAlert[];
  analytics: ParkingAnalytics;
  simulation: SimulationState;
  selectedLotId: string | null;
  selectedRoadId: string | null;
  lastUpdated: string;
}

export type DashboardTab =
  | "overview" | "predictions" | "traffic" | "alerts" | "analytics" | "simulation";
