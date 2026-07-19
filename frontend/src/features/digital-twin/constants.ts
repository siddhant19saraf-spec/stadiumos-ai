import type { StadiumZone, LayerConfig, SimulationScenario } from "./types";

export const STADIUM_ZONES: StadiumZone[] = [
  { id: "section-101", name: "Section 101", type: "seating", level: 1, section: "North", coordinates: { x: 10, y: 5, width: 18, height: 12 } },
  { id: "section-102", name: "Section 102", type: "seating", level: 1, section: "North", coordinates: { x: 30, y: 5, width: 18, height: 12 } },
  { id: "section-103", name: "Section 103", type: "seating", level: 1, section: "North", coordinates: { x: 52, y: 5, width: 18, height: 12 } },
  { id: "section-104", name: "Section 104", type: "seating", level: 1, section: "North", coordinates: { x: 72, y: 5, width: 18, height: 12 } },
  { id: "section-201", name: "Section 201", type: "seating", level: 2, section: "East", coordinates: { x: 0, y: 18, width: 8, height: 20 } },
  { id: "section-202", name: "Section 202", type: "seating", level: 2, section: "East", coordinates: { x: 0, y: 40, width: 8, height: 18 } },
  { id: "section-203", name: "Section 203", type: "seating", level: 2, section: "West", coordinates: { x: 92, y: 18, width: 8, height: 20 } },
  { id: "section-204", name: "Section 204", type: "seating", level: 2, section: "West", coordinates: { x: 92, y: 40, width: 8, height: 18 } },
  { id: "section-301", name: "Section 301", type: "seating", level: 3, section: "South", coordinates: { x: 10, y: 76, width: 18, height: 12 } },
  { id: "section-302", name: "Section 302", type: "seating", level: 3, section: "South", coordinates: { x: 30, y: 76, width: 18, height: 12 } },
  { id: "section-303", name: "Section 303", type: "seating", level: 3, section: "South", coordinates: { x: 52, y: 76, width: 18, height: 12 } },
  { id: "section-304", name: "Section 304", type: "seating", level: 3, section: "South", coordinates: { x: 72, y: 76, width: 18, height: 12 } },
  { id: "vip-east", name: "VIP East Lounge", type: "vip", level: 2, coordinates: { x: 10, y: 39, width: 18, height: 8 } },
  { id: "vip-west", name: "VIP West Lounge", type: "vip", level: 2, coordinates: { x: 72, y: 39, width: 18, height: 8 } },
  { id: "gate-a", name: "Gate A", type: "gate_entry", level: 0, coordinates: { x: 22, y: 0, width: 10, height: 4 } },
  { id: "gate-b", name: "Gate B", type: "gate_entry", level: 0, coordinates: { x: 45, y: 0, width: 10, height: 4 } },
  { id: "gate-c", name: "Gate C", type: "gate_entry", level: 0, coordinates: { x: 68, y: 0, width: 10, height: 4 } },
  { id: "gate-d", name: "Gate D", type: "gate_entry", level: 0, coordinates: { x: 22, y: 88, width: 10, height: 4 } },
  { id: "gate-e", name: "Gate E", type: "gate_entry", level: 0, coordinates: { x: 45, y: 88, width: 10, height: 4 } },
  { id: "gate-f", name: "Gate F", type: "gate_entry", level: 0, coordinates: { x: 68, y: 88, width: 10, height: 4 } },
  { id: "exit-n", name: "North Emergency Exit", type: "emergency_exit", level: 0, coordinates: { x: 38, y: 0, width: 24, height: 3 } },
  { id: "exit-s", name: "South Emergency Exit", type: "emergency_exit", level: 0, coordinates: { x: 38, y: 89, width: 24, height: 3 } },
  { id: "exit-e", name: "East Emergency Exit", type: "emergency_exit", level: 0, coordinates: { x: 0, y: 38, width: 3, height: 24 } },
  { id: "exit-w", name: "West Emergency Exit", type: "emergency_exit", level: 0, coordinates: { x: 97, y: 38, width: 3, height: 24 } },
  { id: "food-a", name: "Food Court A", type: "food_court", level: 1, coordinates: { x: 2, y: 60, width: 14, height: 14 } },
  { id: "food-b", name: "Food Court B", type: "food_court", level: 1, coordinates: { x: 84, y: 60, width: 14, height: 14 } },
  { id: "conc-n", name: "North Concourse", type: "concourse", level: 1, coordinates: { x: 10, y: 18, width: 80, height: 6 } },
  { id: "conc-s", name: "South Concourse", type: "concourse", level: 1, coordinates: { x: 10, y: 60, width: 80, height: 6 } },
  { id: "park-1", name: "Parking Lot A", type: "parking", level: 0, coordinates: { x: 0, y: 0, width: 8, height: 4 } },
  { id: "park-2", name: "Parking Lot B", type: "parking", level: 0, coordinates: { x: 92, y: 0, width: 8, height: 4 } },
  { id: "park-3", name: "Parking Lot C", type: "parking", level: 0, coordinates: { x: 0, y: 88, width: 8, height: 4 } },
  { id: "park-4", name: "Parking Lot D", type: "parking", level: 0, coordinates: { x: 92, y: 88, width: 8, height: 4 } },
  { id: "med-1", name: "Medical Center East", type: "medical", level: 1, coordinates: { x: 2, y: 34, width: 6, height: 6 } },
  { id: "med-2", name: "Medical Center West", type: "medical", level: 1, coordinates: { x: 92, y: 34, width: 6, height: 6 } },
  { id: "sec-1", name: "Security Post North", type: "security", level: 0, coordinates: { x: 38, y: 4, width: 6, height: 3 } },
  { id: "sec-2", name: "Security Post South", type: "security", level: 0, coordinates: { x: 38, y: 85, width: 6, height: 3 } },
  { id: "sec-3", name: "Security Control Room", type: "control_center", level: 2, coordinates: { x: 45, y: 39, width: 10, height: 8 } },
  { id: "cam-1", name: "Camera Array North", type: "camera", level: 2, coordinates: { x: 35, y: 2, width: 4, height: 2 } },
  { id: "cam-2", name: "Camera Array South", type: "camera", level: 2, coordinates: { x: 35, y: 88, width: 4, height: 2 } },
  { id: "cam-3", name: "Camera Array East", type: "camera", level: 2, coordinates: { x: 2, y: 35, width: 2, height: 4 } },
  { id: "cam-4", name: "Camera Array West", type: "camera", level: 2, coordinates: { x: 96, y: 35, width: 2, height: 4 } },
  { id: "rest-1", name: "Restroom Block N1", type: "restroom", level: 1, coordinates: { x: 10, y: 25, width: 4, height: 3 } },
  { id: "rest-2", name: "Restroom Block N2", type: "restroom", level: 1, coordinates: { x: 86, y: 25, width: 4, height: 3 } },
  { id: "rest-3", name: "Restroom Block S1", type: "restroom", level: 1, coordinates: { x: 10, y: 65, width: 4, height: 3 } },
  { id: "rest-4", name: "Restroom Block S2", type: "restroom", level: 1, coordinates: { x: 86, y: 65, width: 4, height: 3 } },
  { id: "elev-1", name: "Elevator Bank 1", type: "elevator", level: 0, coordinates: { x: 10, y: 30, width: 3, height: 2 } },
  { id: "elev-2", name: "Elevator Bank 2", type: "elevator", level: 0, coordinates: { x: 87, y: 30, width: 3, height: 2 } },
  { id: "elev-3", name: "Elevator Bank 3", type: "elevator", level: 0, coordinates: { x: 10, y: 62, width: 3, height: 2 } },
  { id: "elev-4", name: "Elevator Bank 4", type: "elevator", level: 0, coordinates: { x: 87, y: 62, width: 3, height: 2 } },
  { id: "maint-1", name: "Maintenance Room East", type: "maintenance", level: 0, coordinates: { x: 5, y: 45, width: 4, height: 4 } },
  { id: "maint-2", name: "Maintenance Room West", type: "maintenance", level: 0, coordinates: { x: 91, y: 45, width: 4, height: 4 } },
  { id: "broad-1", name: "Broadcast Center", type: "broadcast", level: 2, coordinates: { x: 40, y: 30, width: 8, height: 6 } },
  { id: "retail-1", name: "Stadium Shop East", type: "retail", level: 1, coordinates: { x: 2, y: 55, width: 6, height: 4 } },
  { id: "retail-2", name: "Stadium Shop West", type: "retail", level: 1, coordinates: { x: 92, y: 55, width: 6, height: 4 } },
  { id: "fa-1", name: "First Aid Station", type: "first_aid", level: 1, coordinates: { x: 30, y: 25, width: 4, height: 3 } },
  { id: "fa-2", name: "First Aid Station 2", type: "first_aid", level: 1, coordinates: { x: 66, y: 25, width: 4, height: 3 } },
];

export const ZONE_CAPACITIES: Record<string, number> = {
  "section-101": 1800, "section-102": 1800, "section-103": 1800, "section-104": 1800,
  "section-201": 1200, "section-202": 1200, "section-203": 1200, "section-204": 1200,
  "section-301": 800, "section-302": 800, "section-303": 800, "section-304": 800,
  "vip-east": 400, "vip-west": 400,
  "gate-a": 300, "gate-b": 300, "gate-c": 300, "gate-d": 300, "gate-e": 300, "gate-f": 300,
  "food-a": 600, "food-b": 600,
  "conc-n": 2000, "conc-s": 2000,
  "park-1": 500, "park-2": 500, "park-3": 500, "park-4": 500,
  "med-1": 30, "med-2": 30, "fa-1": 15, "fa-2": 15,
  "broad-1": 100,
};

export const LAYER_CONFIGS: LayerConfig[] = [
  { id: "crowd_density", label: "Crowd Density", enabled: true, icon: "users", color: "#22c55e", opacity: 0.7 },
  { id: "parking", label: "Parking", enabled: true, icon: "car", color: "#3b82f6", opacity: 0.6 },
  { id: "security_teams", label: "Security Teams", enabled: true, icon: "shield", color: "#f59e0b", opacity: 0.8 },
  { id: "medical_teams", label: "Medical Teams", enabled: true, icon: "heart", color: "#ef4444", opacity: 0.8 },
  { id: "incidents", label: "Incidents", enabled: true, icon: "alert-triangle", color: "#dc2626", opacity: 0.9 },
  { id: "maintenance", label: "Maintenance", enabled: false, icon: "wrench", color: "#a855f7", opacity: 0.6 },
  { id: "weather", label: "Weather", enabled: true, icon: "cloud", color: "#0ea5e9", opacity: 0.5 },
  { id: "energy", label: "Energy", enabled: false, icon: "zap", color: "#eab308", opacity: 0.5 },
  { id: "queues", label: "Queues", enabled: true, icon: "clock", color: "#f97316", opacity: 0.7 },
  { id: "cleaning", label: "Cleaning", enabled: false, icon: "spray", color: "#14b8a6", opacity: 0.5 },
  { id: "broadcast", label: "Broadcast", enabled: false, icon: "radio", color: "#8b5cf6", opacity: 0.5 },
  { id: "iot_sensors", label: "IoT Sensors", enabled: false, icon: "cpu", color: "#06b6d4", opacity: 0.5 },
];

export const SCENARIO_CONFIGS: Record<SimulationScenario, { label: string; icon: string; description: string }> = {
  heavy_rain: { label: "Heavy Rain", icon: "cloud-rain", description: "Simulate heavy rainfall affecting visibility and crowd movement" },
  power_failure: { label: "Power Failure", icon: "zap-off", description: "Simulate partial or total power loss across stadium zones" },
  medical_emergency: { label: "Medical Emergency", icon: "heart-pulse", description: "Simulate a medical incident requiring emergency response" },
  crowd_surge: { label: "Crowd Surge", icon: "users", description: "Simulate sudden crowd movement causing density spikes" },
  fire: { label: "Fire", icon: "flame", description: "Simulate fire detection and emergency evacuation protocols" },
  network_failure: { label: "Network Failure", icon: "wifi-off", description: "Simulate communication network degradation" },
  parking_overflow: { label: "Parking Overflow", icon: "car", description: "Simulate parking capacity exceeding limits" },
  vip_arrival: { label: "VIP Arrival", icon: "star", description: "Simulate high-profile VIP arrival requiring security" },
  final_match_crowd: { label: "Final Match Crowd", icon: "trophy", description: "Simulate maximum capacity crowd scenario" },
  weather_delay: { label: "Weather Delay", icon: "clock", description: "Simulate match delay due to adverse weather" },
};

export interface SimulationScenarioItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  details: string;
  tags: string[];
}

export const INCIDENT_SEVERITIES = ["critical", "high", "medium", "low"] as const;

export const SIMULATION_SCENARIOS: SimulationScenarioItem[] = [
  { id: "heavy_rain", name: "Heavy Rain", description: "Simulate heavy rainfall affecting visibility and crowd movement", icon: "sparkles", color: "#3b82f6", details: "Reduces visibility by 60%, increases slip risk, slows crowd movement by 30%. Emergency protocols for water ingress.", tags: ["weather", "crowd", "safety"] },
  { id: "power_failure", name: "Power Failure", icon: "sparkles", color: "#f59e0b", description: "Simulate partial or total power loss across stadium zones", details: "Affects lighting, scoreboards, concessions. Backup generators activate in 15s. Critical zones have UPS backup.", tags: ["infrastructure", "critical"] },
  { id: "medical_emergency", name: "Medical Emergency", icon: "sparkles", color: "#ef4444", description: "Simulate a medical incident requiring emergency response", details: "Coordinates emergency services access, crowd clearing for responders, nearest medical equipment locations.", tags: ["medical", "emergency"] },
  { id: "crowd_surge", name: "Crowd Surge", icon: "sparkles", color: "#dc2626", description: "Simulate sudden crowd movement causing density spikes", details: "Triggers pinch point analysis, gate balancing recommendations, automated PA announcements.", tags: ["crowd", "safety", "critical"] },
  { id: "fire", name: "Fire", icon: "sparkles", color: "#ef4444", description: "Simulate fire detection and emergency evacuation protocols", details: "Activates evacuation plan, identifies nearest exits, coordinates with emergency services, manages crowd flow.", tags: ["fire", "evacuation", "critical"] },
  { id: "network_failure", name: "Network Failure", icon: "sparkles", color: "#8b5cf6", description: "Simulate communication network degradation", details: "Degrades IoT sensor data, affects real-time tracking. Falls back to local processing with delayed sync.", tags: ["infrastructure", "technical"] },
  { id: "parking_overflow", name: "Parking Overflow", icon: "sparkles", color: "#f97316", description: "Simulate parking capacity exceeding limits", details: "Activates overflow lots, coordinates shuttle services, updates digital signage for alternate parking.", tags: ["parking", "logistics"] },
  { id: "vip_arrival", name: "VIP Arrival", icon: "sparkles", color: "#eab308", description: "Simulate high-profile VIP arrival requiring security", details: "Coordinates security corridor, manages crowd control, reserves elevator banks, clears arrival zone.", tags: ["security", "logistics"] },
  { id: "final_match_crowd", name: "Final Match Crowd", icon: "sparkles", color: "#22c55e", description: "Simulate maximum capacity crowd scenario", details: "All zones at 100% capacity, extended queue times, maximum concessions load, full parking utilization.", tags: ["crowd", "capacity", "peak"] },
  { id: "weather_delay", name: "Weather Delay", icon: "sparkles", color: "#0ea5e9", description: "Simulate match delay due to adverse weather", details: "Manages shelter-in-place, updates digital signage, coordinates concessions during delay, rescheduling.", tags: ["weather", "logistics"] },
];

export const REFRESH_INTERVAL = 3000;
