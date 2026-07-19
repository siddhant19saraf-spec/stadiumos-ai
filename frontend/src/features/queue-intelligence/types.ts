export type QueuePointType =
  | "food_counter" | "beverage_counter" | "merchandise" | "restroom"
  | "security" | "entry_gate" | "customer_service" | "atm"
  | "ticket_booth" | "information";

export type QueueStatus = "normal" | "busy" | "congested" | "critical";
export type CounterStatus = "open" | "closed" | "limited" | "breakdown";
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertType =
  | "long_queue" | "counter_failure" | "inventory_shortage" | "staff_shortage"
  | "satisfaction_drop" | "equipment_failure" | "overcrowding" | "restock_needed";

export type SimulationScenario =
  | "halftime_rush" | "rain_delay" | "vip_event" | "sold_out_match"
  | "counter_failure" | "staff_shortage" | "emergency_evacuation"
  | "merchandise_drop" | "heat_wave" | "post_game_exit";

export interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: "food" | "beverage" | "merchandise" | "other";
  basePrice: number;
  prepTimeSec: number;
  popularity: number;
}

export interface QueuePoint {
  id: string;
  name: string;
  type: QueuePointType;
  totalCounters: number;
  coordinates: Coordinates;
  menuItems?: string[];
}

export interface QueuePointStatus {
  queuePointId: string;
  queuePointName: string;
  type: QueuePointType;
  currentLength: number;
  estimatedWaitMin: number;
  serviceSpeedSec: number;
  activeCounters: number;
  totalCounters: number;
  counterStatuses: CounterStatus[];
  capacityUtilization: number;
  customerSatisfaction: number;
  status: QueueStatus;
  lastUpdated: string;
}

export interface QueuePrediction {
  queuePointId: string;
  predictedLength15m: number;
  predictedLength30m: number;
  predictedWait15m: number;
  predictedWait30m: number;
  peakDemandTime: string;
  overloadProbability: number;
  abandonmentRate: number;
  recommendedCounters: number;
  confidence: number;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "food" | "beverage" | "merchandise" | "supplies";
  currentStock: number;
  maxStock: number;
  reorderPoint: number;
  dailyDemand: number;
  wastePercent: number;
  predictedShortageInMin: number | null;
  restockPriority: "critical" | "high" | "medium" | "low";
  lastRestocked: string;
}

export interface ConcessionAnalytics {
  totalSales: number;
  revenuePerMin: number;
  avgServiceTimeSec: number;
  staffUtilization: number;
  peakHour: string;
  popularCategory: string;
  revenueForecast: number;
  customerSatisfactionAvg: number;
  operationalEfficiency: number;
  aiOptimizationScore: number;
  totalCustomersServed: number;
  wasteReductionPercent: number;
}

export interface QueueAlert {
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
  metricValue: number;
  threshold: number;
}

export interface QueueRecommendation {
  id: string;
  action: string;
  detail: string;
  priority: "urgent" | "high" | "medium" | "low";
  locationId: string;
  locationName: string;
  reasoning: string[];
  contributingFactors: string[];
  operationalImpact: string;
  estimatedImprovement: string;
  confidence: number;
  timestamp: string;
}

export interface SimulationState {
  active: boolean;
  scenario: SimulationScenario | null;
  speed: number;
  startedAt: string | null;
  elapsedMs: number;
}

export interface QueueIntelligenceState {
  queuePoints: QueuePoint[];
  queueStatuses: Map<string, QueuePointStatus>;
  predictions: QueuePrediction[];
  inventory: InventoryItem[];
  inventoryStatuses: Map<string, InventoryItem>;
  analytics: ConcessionAnalytics;
  recommendations: QueueRecommendation[];
  alerts: QueueAlert[];
  simulation: SimulationState;
  selectedQueueId: string | null;
  lastUpdated: string;
}

export type DashboardTab =
  | "overview" | "queues" | "predictions" | "inventory" | "analytics" | "alerts" | "simulation";
