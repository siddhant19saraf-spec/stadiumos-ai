import type { IncidentType, Severity, TeamType, ResponseTeam, AIRecommendation, MapEntity } from "./types";

export const INCIDENT_TYPE_CONFIG: Record<IncidentType, { label: string; defaultSeverity: Severity; icon: string; responsePriority: number }> = {
  medical_emergency: { label: "Medical Emergency", defaultSeverity: "critical", icon: "heart", responsePriority: 1 },
  fire: { label: "Fire", defaultSeverity: "critical", icon: "flame", responsePriority: 1 },
  security_threat: { label: "Security Threat", defaultSeverity: "critical", icon: "shield", responsePriority: 1 },
  crowd_surge: { label: "Crowd Surge", defaultSeverity: "high", icon: "users", responsePriority: 2 },
  stampede_risk: { label: "Stampede Risk", defaultSeverity: "critical", icon: "alert-triangle", responsePriority: 1 },
  suspicious_package: { label: "Suspicious Package", defaultSeverity: "high", icon: "package", responsePriority: 2 },
  infrastructure_failure: { label: "Infrastructure Failure", defaultSeverity: "high", icon: "wrench", responsePriority: 3 },
  power_failure: { label: "Power Failure", defaultSeverity: "high", icon: "zap", responsePriority: 2 },
  network_failure: { label: "Network Failure", defaultSeverity: "medium", icon: "wifi", responsePriority: 3 },
  weather_emergency: { label: "Weather Emergency", defaultSeverity: "high", icon: "cloud-lightning", responsePriority: 2 },
  vip_incident: { label: "VIP Incident", defaultSeverity: "high", icon: "star", responsePriority: 2 },
  lost_child: { label: "Lost Child", defaultSeverity: "medium", icon: "user-minus", responsePriority: 4 },
};

export const SEVERITY_PRIORITY_MAP: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const TEAM_CONFIGS: ResponseTeam[] = [
  { id: "med-alpha", type: "medical_alpha", name: "Medical Team Alpha", members: 6, leader: "Dr. Sarah Chen", status: "available", location: "Medical Station 1", coordinates: { x: 15, y: 20 }, incidentId: null, estimatedArrivalMinutes: 3, equipment: ["AED", "Stretcher", "Trauma Kit", "O2"], certifications: ["ACLS", "PHTLS", "CCC"] },
  { id: "med-bravo", type: "medical_bravo", name: "Medical Team Bravo", members: 4, leader: "Dr. James Wilson", status: "available", location: "Medical Station 2", coordinates: { x: 75, y: 20 }, incidentId: null, estimatedArrivalMinutes: 4, equipment: ["AED", "Stretcher", "Trauma Kit"], certifications: ["ACLS", "PHTLS"] },
  { id: "sec-alpha", type: "security_alpha", name: "Security Unit Alpha", members: 8, leader: "Cmdr. Raj Patel", status: "available", location: "Security Post 1", coordinates: { x: 40, y: 55 }, incidentId: null, estimatedArrivalMinutes: 2, equipment: ["Radio", "Body Cam", "Restraints", "Flashlight"], certifications: ["CPP", "PSP"] },
  { id: "sec-bravo", type: "security_bravo", name: "Security Unit Bravo", members: 6, leader: "Cmdr. Lisa Park", status: "available", location: "Security Post 2", coordinates: { x: 60, y: 10 }, incidentId: null, estimatedArrivalMinutes: 3, equipment: ["Radio", "Body Cam", "Restraints"], certifications: ["CPP"] },
  { id: "fire-resp", type: "fire_response", name: "Fire Response Unit", members: 8, leader: "Chief Mike Torres", status: "available", location: "Fire Station", coordinates: { x: 10, y: 50 }, incidentId: null, estimatedArrivalMinutes: 3, equipment: ["Extinguisher", "Ax", "Hose", "PPE", "SCBA"], certifications: ["NFFF", "HAZMAT"] },
  { id: "hazmat-1", type: "hazmat", name: "HAZMAT Team", members: 4, leader: "Dr. Anna Kowalski", status: "available", location: "Service Tunnel 3", coordinates: { x: 85, y: 50 }, incidentId: null, estimatedArrivalMinutes: 5, equipment: ["Level B Suits", "Decon Kit", "Monitor", "Containment"], certifications: ["HAZMAT", "CBRN"] },
  { id: "evac-1", type: "evacuation", name: "Evacuation Team Alpha", members: 10, leader: "Coord. David Kim", status: "available", location: "Concourse East", coordinates: { x: 30, y: 35 }, incidentId: null, estimatedArrivalMinutes: 2, equipment: ["Megaphone", "Flashlight", "Vests", "Radio"], certifications: ["FEMA", "ECS"] },
  { id: "eng-1", type: "engineering", name: "Engineering Response", members: 4, leader: "Eng. Maria Santos", status: "available", location: "Plant Room B2", coordinates: { x: 50, y: 58 }, incidentId: null, estimatedArrivalMinutes: 5, equipment: ["Toolkit", "Multimeter", "Generator", "Cutters"], certifications: ["NFPA 70E", "OSHA"] },
  { id: "vip-1", type: "vip_protection", name: "VIP Protection Detail", members: 4, leader: "Agent John Drake", status: "available", location: "VIP Suite Level", coordinates: { x: 50, y: 40 }, incidentId: null, estimatedArrivalMinutes: 1, equipment: ["Comms", "Body Armor", "Medical Kit"], certifications: ["EPC", "PSD"] },
  { id: "crowd-1", type: "crowd_management", name: "Crowd Management Unit", members: 8, leader: "Coord. Alex Novak", status: "available", location: "Main Concourse", coordinates: { x: 45, y: 30 }, incidentId: null, estimatedArrivalMinutes: 2, equipment: ["Barriers", "Vests", "Radios", "Flashlights"], certifications: ["CEM", "ICS"] },
  { id: "comms-1", type: "communications", name: "Communications Team", members: 3, leader: "Dir. Sam Rivera", status: "available", location: "Broadcast Center", coordinates: { x: 50, y: 45 }, incidentId: null, estimatedArrivalMinutes: 1, equipment: ["PA System", "Radios", "Mobile Unit"], certifications: ["RAN"] },
  { id: "cmd-1", type: "command", name: "Command Unit", members: 5, leader: "Gen. Robert Hayes", status: "available", location: "Command Post", coordinates: { x: 50, y: 50 }, incidentId: null, estimatedArrivalMinutes: 0, equipment: ["Workstations", "Displays", "Comms Array", "Drones"], certifications: ["ICS 400", "CEM"] },
];

export const RESPONSE_THRESHOLDS = {
  criticalResponseTargetMinutes: 3,
  highResponseTargetMinutes: 5,
  mediumResponseTargetMinutes: 8,
  lowResponseTargetMinutes: 12,
  escalationThresholdPercent: 75,
  maxConcurrentCritical: 3,
  resourceCriticalPercent: 80,
};

export const EVACUATION_EXITS: MapEntity[] = [
  { id: "exit-n", type: "emergency_exit", label: "North Exit", coordinates: { x: 50, y: 2 }, pulse: false },
  { id: "exit-s", type: "emergency_exit", label: "South Exit", coordinates: { x: 50, y: 58 }, pulse: false },
  { id: "exit-e1", type: "emergency_exit", label: "Gate A Exit", coordinates: { x: 25, y: 8 }, pulse: false },
  { id: "exit-e2", type: "emergency_exit", label: "Gate C Exit", coordinates: { x: 75, y: 8 }, pulse: false },
  { id: "exit-w1", type: "emergency_exit", label: "Service Exit West", coordinates: { x: 5, y: 40 }, pulse: false },
  { id: "exit-w2", type: "emergency_exit", label: "Service Exit East", coordinates: { x: 95, y: 40 }, pulse: false },
];

export const RALLY_POINTS: MapEntity[] = [
  { id: "rally-1", type: "rally_point", label: "Rally Point A", coordinates: { x: 10, y: 10 }, pulse: false },
  { id: "rally-2", type: "rally_point", label: "Rally Point B", coordinates: { x: 90, y: 10 }, pulse: false },
  { id: "rally-3", type: "rally_point", label: "Rally Point C", coordinates: { x: 10, y: 52 }, pulse: false },
  { id: "rally-4", type: "rally_point", label: "Rally Point D", coordinates: { x: 90, y: 52 }, pulse: false },
];

export const INCIDENT_LOCATIONS = [
  "East Stand Lower", "West Stand Lower", "North Stand", "South Stand",
  "VIP Lounge", "Press Box", "Main Concourse", "East Concourse",
  "West Concourse", "Gate A Plaza", "Gate C Plaza", "Parking Level B1",
  "Parking Level B2", "Service Tunnel 1", "Service Tunnel 2",
  "Kitchen Facility", "Broadcast Center", "Medical Station 1",
  "Medical Station 2", "Security Control Room", "Roof Access Point",
  "Player Tunnel", "Dressing Room Wing", "Hospitality Suite 1",
  "Hospitality Suite 2", "Stadium Shop East",
];

export const REPORTED_BY = [
  "Security Patrol Alpha", "CCTV Monitoring", "Spectator Hotline",
  "Medical Station", "Tournament Official", "VIP Liaison",
  "Fire Safety System", "IoT Sensor Network", "Crowd AI Monitor",
  "Steward Team 3", "Police Liaison", "Broadcast Director",
];

export const REFRESH_INTERVAL = 4000;
