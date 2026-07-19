import type { MaintenanceAsset, SimulationScenario, ScenarioDefinition } from "./types";

export const ALERT_THRESHOLDS = {
  TEMP_HIGH_C: 45,
  TEMP_CRITICAL_C: 60,
  POWER_ABNORMAL_PCT: 20,
  HEALTH_CRITICAL: 30,
  HEALTH_WARNING: 60,
  VIBRATION_HIGH: 7.0,
  PRESSURE_HIGH: 8.0,
  RUL_CRITICAL_DAYS: 30,
  MAINTENANCE_OVERDUE_DAYS: 7,
} as const;

export const ASSETS: MaintenanceAsset[] = [
  // HVAC (3)
  { id: "hvac-1", name: "North Stand HVAC", type: "hvac", zone: "north_stand", location: "North Stand Level 2", installDate: "2022-03-15", manufacturer: "Carrier", model: "CV-1800", serialNumber: "CV-22-1847", coordinates: { x: 30, y: 18 }, criticality: "critical" },
  { id: "hvac-2", name: "South Stand HVAC", type: "hvac", zone: "south_stand", location: "South Stand Level 2", installDate: "2022-03-15", manufacturer: "Carrier", model: "CV-1800", serialNumber: "CV-22-1848", coordinates: { x: 70, y: 18 }, criticality: "critical" },
  { id: "hvac-3", name: "VIP HVAC Unit", type: "hvac", zone: "vip_lounge", location: "VIP Lounge Roof", installDate: "2022-06-01", manufacturer: "Trane", model: "XL-1500", serialNumber: "TR-22-0932", coordinates: { x: 50, y: 10 }, criticality: "high" },
  // Lighting (3)
  { id: "light-1", name: "Main Stand Lighting", type: "lighting", zone: "main_concourse", location: "Concourse Ceiling", installDate: "2021-11-20", manufacturer: "Philips", model: "ArenaVision LED", serialNumber: "PH-21-4421", coordinates: { x: 35, y: 35 }, criticality: "high" },
  { id: "light-2", name: "Pitch Lighting Array", type: "lighting", zone: "north_stand", location: "North Stand Roof", installDate: "2021-11-20", manufacturer: "Philips", model: "ArenaVision LED Pro", serialNumber: "PH-21-4422", coordinates: { x: 50, y: 25 }, criticality: "critical" },
  { id: "light-3", name: "Emergency Lighting NC", type: "emergency_lighting", zone: "main_concourse", location: "Concourse Walls", installDate: "2021-11-20", manufacturer: "Eaton", model: "EL-900", serialNumber: "ET-21-3321", coordinates: { x: 45, y: 40 }, criticality: "critical" },
  // Scoreboard & Video (2)
  { id: "sb-1", name: "Main Scoreboard", type: "scoreboard", zone: "north_stand", location: "North Stand Face", installDate: "2022-01-10", manufacturer: "Daktronics", model: "ProStar 2000", serialNumber: "DK-22-101", coordinates: { x: 50, y: 5 }, criticality: "critical" },
  { id: "vw-1", name: "East Video Wall", type: "video_wall", zone: "east_stand", location: "East Stand Concourse", installDate: "2022-01-10", manufacturer: "Samsung", model: "IF-85H", serialNumber: "SS-22-873", coordinates: { x: 15, y: 30 }, criticality: "medium" },
  // Power (3)
  { id: "pwr-1", name: "Main Power Distribution", type: "power_distribution", zone: "basement", location: "Basement Room B1", installDate: "2021-09-01", manufacturer: "Schneider Electric", model: "MasterPact MTZ", serialNumber: "SE-21-001", coordinates: { x: 30, y: 55 }, criticality: "critical" },
  { id: "pwr-2", name: "Backup Generator A", type: "generator", zone: "basement", location: "Basement Room G1", installDate: "2021-09-01", manufacturer: "Cummins", model: "C2000D6", serialNumber: "CU-21-445", coordinates: { x: 38, y: 55 }, criticality: "critical" },
  { id: "pwr-3", name: "Backup Generator B", type: "generator", zone: "basement", location: "Basement Room G2", installDate: "2021-09-01", manufacturer: "Cummins", model: "C2000D6", serialNumber: "CU-21-446", coordinates: { x: 46, y: 55 }, criticality: "critical" },
  // Elevator & Escalator (4)
  { id: "elv-1", name: "North Elevator Bank", type: "elevator", zone: "north_stand", location: "North Stand Core", installDate: "2022-02-15", manufacturer: "Otis", model: "Gen3", serialNumber: "OT-22-112", coordinates: { x: 28, y: 42 }, criticality: "high" },
  { id: "elv-2", name: "South Elevator Bank", type: "elevator", zone: "south_stand", location: "South Stand Core", installDate: "2022-02-15", manufacturer: "Otis", model: "Gen3", serialNumber: "OT-22-113", coordinates: { x: 72, y: 42 }, criticality: "high" },
  { id: "esc-1", name: "East Escalator", type: "escalator", zone: "east_concourse", location: "East Concourse Level 1-2", installDate: "2022-02-15", manufacturer: "Schindler", model: "9500", serialNumber: "SC-22-221", coordinates: { x: 10, y: 48 }, criticality: "medium" },
  { id: "esc-2", name: "West Escalator", type: "escalator", zone: "west_concourse", location: "West Concourse Level 1-2", installDate: "2022-02-15", manufacturer: "Schindler", model: "9500", serialNumber: "SC-22-222", coordinates: { x: 90, y: 48 }, criticality: "medium" },
  // Fire Safety (2)
  { id: "fire-1", name: "Fire Alarm Panel", type: "fire_safety", zone: "control_room", location: "Security Control Room", installDate: "2021-09-01", manufacturer: "Simplex", model: "4100U", serialNumber: "SX-21-551", coordinates: { x: 55, y: 15 }, criticality: "critical" },
  { id: "fire-2", name: "Sprinkler System", type: "fire_safety", zone: "basement", location: "Basement Pump Room", installDate: "2021-09-01", manufacturer: "Viking", model: "V-3000", serialNumber: "VK-21-332", coordinates: { x: 54, y: 55 }, criticality: "critical" },
  // Water (2)
  { id: "pump-1", name: "Main Water Pump", type: "water_pump", zone: "basement", location: "Basement Pump Room", installDate: "2021-09-01", manufacturer: "Grundfos", model: "CR-120", serialNumber: "GF-21-771", coordinates: { x: 62, y: 55 }, criticality: "critical" },
  { id: "plumb-1", name: "Concourse Plumbing", type: "plumbing", zone: "main_concourse", location: "Concourse Level 1", installDate: "2021-09-01", manufacturer: "Uponor", model: "MP-1500", serialNumber: "UP-21-123", coordinates: { x: 40, y: 45 }, criticality: "medium" },
  // Network (3)
  { id: "net-1", name: "Core Network Switch", type: "networking", zone: "control_room", location: "Control Room Rack A", installDate: "2022-03-01", manufacturer: "Cisco", model: "Catalyst 9500", serialNumber: "CS-22-001", coordinates: { x: 60, y: 15 }, criticality: "critical" },
  { id: "net-2", name: "WiFi Controller", type: "wifi", zone: "control_room", location: "Control Room Rack B", installDate: "2022-03-01", manufacturer: "Aruba", model: "MM-750", serialNumber: "AR-22-002", coordinates: { x: 65, y: 15 }, criticality: "high" },
  { id: "net-3", name: "WiFi AP Cluster A", type: "wifi", zone: "main_concourse", location: "Concourse Ceiling", installDate: "2022-03-01", manufacturer: "Aruba", model: "AP-535", serialNumber: "AR-22-100", coordinates: { x: 42, y: 38 }, criticality: "medium" },
  // Security (3)
  { id: "cam-1", name: "CCTV Camera Cluster A", type: "cctv", zone: "north_stand", location: "North Stand Roof", installDate: "2022-01-15", manufacturer: "HikVision", model: "DS-2CD8A85F", serialNumber: "HV-22-301", coordinates: { x: 35, y: 3 }, criticality: "high" },
  { id: "cam-2", name: "CCTV Camera Cluster B", type: "cctv", zone: "south_stand", location: "South Stand Roof", installDate: "2022-01-15", manufacturer: "HikVision", model: "DS-2CD8A85F", serialNumber: "HV-22-302", coordinates: { x: 65, y: 3 }, criticality: "high" },
  { id: "cam-3", name: "CCTV Camera Cluster C", type: "cctv", zone: "east_concourse", location: "East Concourse Ceiling", installDate: "2022-01-15", manufacturer: "HikVision", model: "DS-2CD8A85F", serialNumber: "HV-22-303", coordinates: { x: 12, y: 38 }, criticality: "medium" },
  // Access (4)
  { id: "turn-1", name: "Turnstile Bank North", type: "turnstile", zone: "north_stand", location: "North Entry", installDate: "2021-11-01", manufacturer: "Boon Edam", model: "Speedlane 900", serialNumber: "BE-21-401", coordinates: { x: 38, y: 65 }, criticality: "medium" },
  { id: "turn-2", name: "Turnstile Bank South", type: "turnstile", zone: "south_stand", location: "South Entry", installDate: "2021-11-01", manufacturer: "Boon Edam", model: "Speedlane 900", serialNumber: "BE-21-402", coordinates: { x: 62, y: 65 }, criticality: "medium" },
  { id: "gate-1", name: "Entry Gate Main", type: "entry_gate", zone: "main_concourse", location: "Main Entry Plaza", installDate: "2021-11-01", manufacturer: "Gunnebo", model: "SpeedStile E", serialNumber: "GB-21-501", coordinates: { x: 45, y: 68 }, criticality: "high" },
  { id: "gate-2", name: "Entry Gate VIP", type: "entry_gate", zone: "vip_lounge", location: "VIP Entry", installDate: "2021-11-01", manufacturer: "Gunnebo", model: "SpeedStile E", serialNumber: "GB-21-502", coordinates: { x: 55, y: 68 }, criticality: "medium" },
  // Parking (2)
  { id: "park-1", name: "Parking Barrier North", type: "parking_barrier", zone: "parking", location: "North Parking Entry", installDate: "2022-04-01", manufacturer: "FAAC", model: "844 T", serialNumber: "FC-22-601", coordinates: { x: 20, y: 70 }, criticality: "low" },
  { id: "park-2", name: "Parking Barrier South", type: "parking_barrier", zone: "parking", location: "South Parking Entry", installDate: "2022-04-01", manufacturer: "FAAC", model: "844 T", serialNumber: "FC-22-602", coordinates: { x: 80, y: 70 }, criticality: "low" },
  // EV (1)
  { id: "ev-1", name: "EV Charger Bank", type: "ev_charger", zone: "parking", location: "Parking Level 1", installDate: "2022-05-15", manufacturer: "ChargePoint", model: "CPF-250", serialNumber: "CP-22-701", coordinates: { x: 25, y: 72 }, criticality: "low" },
  // PA & Signage (2)
  { id: "pa-1", name: "Public Address System", type: "pa_system", zone: "main_concourse", location: "Concourse Level 1 & 2", installDate: "2021-11-01", manufacturer: "Bosch", model: "PRAESENSA", serialNumber: "BS-21-801", coordinates: { x: 48, y: 32 }, criticality: "high" },
  { id: "sig-1", name: "Digital Signage Cluster", type: "digital_signage", zone: "main_concourse", location: "Concourse Level 1", installDate: "2022-01-10", manufacturer: "LG", model: "49XS4E", serialNumber: "LG-22-901", coordinates: { x: 50, y: 35 }, criticality: "medium" },
];

export const SCENARIO_CONFIGS: Record<SimulationScenario, { name: string; description: string; details: string; icon: string; color: string; tags: string[] }> = {
  power_failure: { name: "Power Failure", description: "Main power distribution failure", details: "Main power distribution fails. Generators auto-start. Critical load shedding activates. UPS provides bridge power.", icon: "zap-off", color: "#ef4444", tags: ["power", "generator", "ups", "critical"] },
  cooling_failure: { name: "Cooling Failure", description: "HVAC cooling system failure", details: "North Stand HVAC cooling fails. Temperature rises in affected zone. Backup cooling activation. Occupant comfort degrades.", icon: "thermometer", color: "#f97316", tags: ["hvac", "temperature", "cooling", "comfort"] },
  network_failure: { name: "Network Failure", description: "Core network switch failure", details: "Core network switch fails. WiFi controllers go offline. CCTV streaming interrupted. POS systems on backup connection.", icon: "wifi-off", color: "#a855f7", tags: ["network", "wifi", "cctv", "connectivity"] },
  generator_failure: { name: "Generator Failure", description: "Backup generator A failure", details: "Generator A fails during operation. Generator B carries full load. Fuel system inspection initiated. Load shedding plan activated.", icon: "fuel", color: "#f59e0b", tags: ["generator", "power", "backup", "fuel"] },
  camera_failure: { name: "Camera Failure", description: "CCTV camera cluster failure", details: "Camera Cluster A goes offline. Security monitoring blind spot created. Mobile cameras deployed. Drone surveillance considered.", icon: "camera-off", color: "#dc2626", tags: ["cctv", "security", "surveillance", "blind-spot"] },
  sensor_failure: { name: "Sensor Failure", description: "IoT sensor drift across multiple assets", details: "Multiple sensors reporting anomalous readings. Data quality degrades. Cross-validation with adjacent assets. Manual inspection triggered.", icon: "activity", color: "#3b82f6", tags: ["sensor", "iot", "data", "calibration"] },
  fire_alarm_failure: { name: "Fire Alarm Failure", description: "Fire alarm panel communication failure", details: "Fire alarm panel loses communication with zone modules. Manual patrols activated. Fire brigade notified. Evacuation protocol review.", icon: "flame", color: "#ef4444", tags: ["fire", "safety", "alarm", "evacuation"] },
  water_leakage: { name: "Water Leakage", description: "Main water pump leakage detected", details: "Main water pump seal failure. Pressure drops. Standby pump activated. Plumbing inspection required. Water damage assessment.", icon: "droplet", color: "#06b6d4", tags: ["water", "plumbing", "pump", "leak"] },
  overheating: { name: "Overheating", description: "Multiple assets overheating", details: "Temperature exceeds thresholds on power distribution and generators. Cooling systems at maximum. Load reduction ordered. Emergency vents open.", icon: "sun", color: "#eab308", tags: ["temperature", "overheating", "load", "ventilation"] },
  unexpected_shutdown: { name: "Unexpected Shutdown", description: "Random equipment shutdown event", details: "Multiple assets experience unexpected shutdown. Root cause investigation. Auto-recovery attempts. Failover to redundant systems.", icon: "power-off", color: "#dc2626", tags: ["shutdown", "failure", "redundancy", "recovery"] },
};

export const SIMULATION_SCENARIOS: ScenarioDefinition[] = [
  { id: "heatwave", title: "Heat Wave", description: "Sustained 38°C+ temperatures for 3+ consecutive days", category: "weather", impactDescription: "HVAC systems at max capacity, risk of overheating in power distribution", mitigationFactor: 0.7 },
  { id: "match-day", title: "Match Day Peak Load", description: "Full stadium capacity with all systems at maximum utilization", category: "operations", impactDescription: "Power, HVAC, and network systems under maximum design load for 8+ hours", mitigationFactor: 0.65 },
  { id: "power-outage", title: "Extended Power Outage", description: "Grid power lost for >2 hours during an event", category: "failure", impactDescription: "Generators run continuously, critical systems on UPS backup", mitigationFactor: 0.75 },
  { id: "flooding", title: "Flooding Event", description: "Water ingress due to heavy rainfall or plumbing failure", category: "weather", impactDescription: "Basement equipment at risk, electrical systems potentially compromised", mitigationFactor: 0.8 },
  { id: "cyber", title: "Cyber Attack", description: "Network intrusion targeting building management systems", category: "security", impactDescription: "Network-dependent systems potentially compromised or taken offline", mitigationFactor: 0.6 },
  { id: "staff-shortage", title: "Staff Shortage", description: "Critical maintenance staff unavailable due to illness or holiday", category: "operations", impactDescription: "Scheduled maintenance delayed, response times for critical failures increased", mitigationFactor: 0.5 },
  { id: "equipment-fire", title: "Equipment Fire", description: "Small electrical fire in a critical equipment room", category: "failure", impactDescription: "Affected system offline for extended period, adjacent equipment at risk", mitigationFactor: 0.7 },
  { id: "supply-chain", title: "Parts Supply Chain Delay", description: "Critical spare parts delayed by 4+ weeks", category: "logistics", impactDescription: "Repair timeline extended, redundant systems may not be restorable quickly", mitigationFactor: 0.4 },
  { id: "regulatory", title: "Regulatory Inspection", description: "Unscheduled safety inspection by governing body", category: "compliance", impactDescription: "Non-compliant systems must be immediately addressed or face penalties", mitigationFactor: 0.55 },
  { id: "multi-failure", title: "Concurrent Multi-System Failure", description: "Two or more critical systems fail simultaneously", category: "failure", impactDescription: "Combined impact exceeds redundancy capacity, escalation to emergency protocols", mitigationFactor: 0.45 },
];

export const REFRESH_INTERVAL_MS = 5000;
