import type { ParkingLot, TrafficRoad, SimulationScenario } from "./types";

export const ALERT_THRESHOLDS = {
  PARKING_FULL: 95,
  PARKING_NEAR_FULL: 85,
  TRAFFIC_CONGESTED: 40,
  QUEUE_CRITICAL: 100,
  EV_FULL: 90,
  OVERFLOW_TRIGGER: 90,
  VIP_BUFFER_MINUTES: 30,
  ACCIDENT_LIKELIHOOD: 0.08,
} as const;

export const PARKING_LOTS: ParkingLot[] = [
  { id: "lot-a", name: "Lot A - North Main", type: "general", capacity: 1200, coordinates: { x: 8, y: 5, width: 18, height: 16 }, entryRoadId: "north-entry", exitRoadId: "north-exit" },
  { id: "lot-b", name: "Lot B - South Main", type: "general", capacity: 1000, coordinates: { x: 74, y: 5, width: 18, height: 16 }, entryRoadId: "south-entry", exitRoadId: "south-exit" },
  { id: "lot-c", name: "Lot C - East Wing", type: "general", capacity: 800, coordinates: { x: 8, y: 40, width: 16, height: 14 }, entryRoadId: "east-entry", exitRoadId: "east-exit" },
  { id: "lot-d", name: "Lot D - West Wing", type: "general", capacity: 750, coordinates: { x: 76, y: 40, width: 16, height: 14 }, entryRoadId: "west-entry", exitRoadId: "west-exit" },
  { id: "lot-vip", name: "VIP Parking", type: "vip", capacity: 150, coordinates: { x: 38, y: 3, width: 10, height: 8 }, entryRoadId: "north-entry", exitRoadId: "north-exit" },
  { id: "lot-ev", name: "EV Charging Station", type: "ev_charging", capacity: 200, coordinates: { x: 52, y: 3, width: 10, height: 8 }, entryRoadId: "north-entry", exitRoadId: "north-exit" },
  { id: "lot-accessible", name: "Accessible Parking", type: "accessible", capacity: 100, coordinates: { x: 35, y: 72, width: 12, height: 6 }, entryRoadId: "east-entry", exitRoadId: "east-exit" },
  { id: "lot-media", name: "Media Parking", type: "media", capacity: 300, coordinates: { x: 20, y: 72, width: 12, height: 6 }, entryRoadId: "east-entry", exitRoadId: "east-exit" },
  { id: "lot-bus", name: "Bus Parking", type: "bus", capacity: 80, coordinates: { x: 68, y: 72, width: 14, height: 6 }, entryRoadId: "south-entry", exitRoadId: "south-exit" },
  { id: "lot-rideshare", name: "Rideshare Drop-off", type: "rideshare", capacity: 60, coordinates: { x: 50, y: 72, width: 14, height: 6 }, entryRoadId: "east-entry", exitRoadId: "east-exit" },
  { id: "lot-staff", name: "Staff Parking", type: "staff", capacity: 400, coordinates: { x: 30, y: 14, width: 14, height: 8 }, entryRoadId: "west-entry", exitRoadId: "west-exit" },
  { id: "lot-overflow", name: "Overflow Lot", type: "overflow", capacity: 500, coordinates: { x: 40, y: 28, width: 20, height: 10 }, entryRoadId: "north-entry", exitRoadId: "north-exit" },
  { id: "lot-rental", name: "Rental Car Return", type: "rental", capacity: 120, coordinates: { x: 58, y: 52, width: 10, height: 8 }, entryRoadId: "south-entry", exitRoadId: "south-exit" },
];

export const TRAFFIC_ROADS: TrafficRoad[] = [
  { id: "north-entry", name: "North Entry Road (Hwy 101)", direction: "entry", status: "open", currentSpeedKmph: 45, freeFlowSpeedKmph: 80, queueLengthMeters: 120, congestionLevel: "moderate", vehicleCount: 180, gateCongestionPercent: 60, coordinates: { x1: 38, y1: -2, x2: 42, y2: 5 } },
  { id: "south-entry", name: "South Entry Road (I-280)", direction: "entry", status: "open", currentSpeedKmph: 55, freeFlowSpeedKmph: 80, queueLengthMeters: 80, congestionLevel: "low", vehicleCount: 140, gateCongestionPercent: 40, coordinates: { x1: 75, y1: -2, x2: 79, y2: 5 } },
  { id: "east-entry", name: "East Entry Road (CA-82)", direction: "entry", status: "open", currentSpeedKmph: 30, freeFlowSpeedKmph: 70, queueLengthMeters: 200, congestionLevel: "high", vehicleCount: 250, gateCongestionPercent: 75, coordinates: { x1: -2, y1: 40, x2: 8, y2: 45 } },
  { id: "west-entry", name: "West Entry Road (El Camino)", direction: "entry", status: "open", currentSpeedKmph: 35, freeFlowSpeedKmph: 75, queueLengthMeters: 150, congestionLevel: "moderate", vehicleCount: 200, gateCongestionPercent: 55, coordinates: { x1: 92, y1: 40, x2: 100, y2: 45 } },
  { id: "north-exit", name: "North Exit Ramp", direction: "exit", status: "open", currentSpeedKmph: 50, freeFlowSpeedKmph: 70, queueLengthMeters: 60, congestionLevel: "low", vehicleCount: 90, gateCongestionPercent: 30, coordinates: { x1: 42, y1: 5, x2: 38, y2: -2 } },
  { id: "south-exit", name: "South Exit Ramp", direction: "exit", status: "open", currentSpeedKmph: 60, freeFlowSpeedKmph: 70, queueLengthMeters: 40, congestionLevel: "low", vehicleCount: 70, gateCongestionPercent: 20, coordinates: { x1: 79, y1: 5, x2: 75, y2: -2 } },
  { id: "east-exit", name: "East Exit Ramp", direction: "exit", status: "open", currentSpeedKmph: 40, freeFlowSpeedKmph: 65, queueLengthMeters: 90, congestionLevel: "moderate", vehicleCount: 120, gateCongestionPercent: 45, coordinates: { x1: 8, y1: 45, x2: -2, y2: 40 } },
  { id: "west-exit", name: "West Exit Ramp", direction: "exit", status: "open", currentSpeedKmph: 45, freeFlowSpeedKmph: 65, queueLengthMeters: 70, congestionLevel: "low", vehicleCount: 100, gateCongestionPercent: 35, coordinates: { x1: 100, y1: 45, x2: 92, y2: 40 } },
  { id: "perimeter-north", name: "Perimeter North", direction: "two_way", status: "open", currentSpeedKmph: 50, freeFlowSpeedKmph: 60, queueLengthMeters: 20, congestionLevel: "low", vehicleCount: 60, gateCongestionPercent: 15, coordinates: { x1: 35, y1: -1, x2: 65, y2: -1 } },
  { id: "perimeter-south", name: "Perimeter South", direction: "two_way", status: "open", currentSpeedKmph: 25, freeFlowSpeedKmph: 50, queueLengthMeters: 50, congestionLevel: "moderate", vehicleCount: 110, gateCongestionPercent: 40, coordinates: { x1: 25, y1: 80, x2: 75, y2: 80 } },
];

export const SCENARIO_CONFIGS: Record<SimulationScenario, { name: string; description: string; details: string; icon: string; color: string; tags: string[] }> = {
  heavy_rain: { name: "Heavy Rain", description: "Severe weather reduces visibility and road capacity", details: "Speed reduction across all roads. Queue buildup at gates. Reduced parking demand as fans arrive later.", icon: "cloud-rain", color: "#3b82f6", tags: ["weather", "speed", "delay", "queue"] },
  vip_arrival: { name: "VIP Arrival", description: "High-profile guest arrival with motorcade", details: "VIP lot reserved. North entry road partially closed for motorcade. Increased security screening.", icon: "star", color: "#f59e0b", tags: ["vip", "security", "closure", "priority"] },
  final_match: { name: "Final Match", description: "Championship game with sell-out crowd", details: "Maximum capacity scenario. All lots fill rapidly. Overflow parking activated. Extended peak duration.", icon: "trophy", color: "#ef4444", tags: ["sell-out", "peak", "overflow", "max-capacity"] },
  power_failure: { name: "Power Failure", description: "Grid power loss affects lighting and EV chargers", details: "EV chargers offline. Gate systems on backup. Reduced lot capacity. Manual traffic management.", icon: "zap-off", color: "#a855f7", tags: ["power", "emergency", "ev", "backup"] },
  overflow_parking: { name: "Overflow Parking", description: "Primary lots full, overflow activated", details: "Overflow lot opened. Shuttle buses deployed. Entry queue management active. Wayfinding updates.", icon: "parking-circle-off", color: "#f97316", tags: ["overflow", "shuttle", "queue", "saturation"] },
  emergency_evacuation: { name: "Emergency Evacuation", description: "Urgent evacuation of all lots and roads", details: "All exit roads prioritized. Entry roads closed. Emergency vehicle access active. Lot clearing protocol.", icon: "alert-triangle", color: "#dc2626", tags: ["evacuation", "emergency", "closure", "safety"] },
  road_closure: { name: "Road Closure", description: "Major entry road closed due to accident", details: "East entry road closed. Traffic rerouted to north/south. Extended queues at remaining gates.", icon: "circle-x", color: "#e11d48", tags: ["closure", "accident", "reroute", "congestion"] },
  event_exit_surge: { name: "Event Exit Surge", description: "Post-event departure wave from all lots", details: "All lots discharging simultaneously. Exit queue buildup. Peak departure rate. Traffic gridlock risk.", icon: "arrow-up-wide-narrow", color: "#f43f5e", tags: ["exit", "surge", "departure", "gridlock"] },
  peak_traffic: { name: "Peak Traffic", description: "Pre-event peak traffic hour", details: "Maximum arrival rate. All entry roads congested. Gate queue management critical. Timing optimization.", icon: "car", color: "#eab308", tags: ["arrival", "peak", "congestion", "gate"] },
  holiday_event: { name: "Holiday Event", description: "Special holiday match with family crowds", details: "Higher family traffic. Accessible parking demand up. Extended dwell times. Concession traffic.", icon: "sparkles", color: "#22c55e", tags: ["holiday", "family", "accessible", "extended"] },
};

export const LOT_CAPACITY_DETAILS: Record<string, { general: number; vip: number; accessible: number; ev: number }> = {
  "lot-a": { general: 1080, vip: 60, accessible: 30, ev: 30 },
  "lot-b": { general: 900, vip: 50, accessible: 25, ev: 25 },
  "lot-c": { general: 720, vip: 40, accessible: 20, ev: 20 },
  "lot-d": { general: 680, vip: 35, accessible: 20, ev: 15 },
  "lot-vip": { general: 0, vip: 150, accessible: 0, ev: 0 },
  "lot-ev": { general: 0, vip: 0, accessible: 0, ev: 200 },
  "lot-accessible": { general: 0, vip: 0, accessible: 100, ev: 0 },
  "lot-media": { general: 270, vip: 30, accessible: 0, ev: 0 },
  "lot-bus": { general: 80, vip: 0, accessible: 0, ev: 0 },
  "lot-rideshare": { general: 60, vip: 0, accessible: 0, ev: 0 },
  "lot-staff": { general: 380, vip: 20, accessible: 0, ev: 0 },
  "lot-overflow": { general: 500, vip: 0, accessible: 0, ev: 0 },
  "lot-rental": { general: 120, vip: 0, accessible: 0, ev: 0 },
};

export const REFRESH_INTERVAL_MS = 5000;
export const SNAPSHOT_INTERVAL_MS = 30000;
export const MAX_SNAPSHOTS = 50;
