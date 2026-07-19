import type { Tournament, Venue, Team, ResourceType, ReadinessCategory, OperationalPhase } from "./types";

export const TOURNAMENT: Tournament = {
  id: "wc-2030",
  name: "World Cup 2030",
  shortName: "WC 2030",
  sport: "Football",
  stage: "group_stage",
  startDate: "2030-06-08",
  endDate: "2030-07-14",
  venueIds: ["venue-1", "venue-2", "venue-3", "venue-4", "venue-5", "venue-6", "venue-7", "venue-8"],
  teamIds: Array.from({ length: 32 }, (_, i) => `team-${i + 1}`),
  totalMatches: 64,
  completedMatches: 18,
  progressPercent: 28,
  operationalReadiness: 87,
  aiRiskScore: 22,
  tournamentDirector: "Fatima Al-Rashid",
  organizingBody: "FIFA",
};

export const VENUES: Venue[] = [
  {
    id: "venue-1", name: "National Stadium", city: "Madrid", capacity: 85450,
    status: "ready", currentEvent: "Group A: Brazil vs Germany", nextEvent: "Group B: Argentina vs France",
    readiness: { overall: 92, infrastructure: 95, safety: 90, maintenance: 88, parking: 85, connectivity: 94, power: 96, emergency: 89, cleaning: 91, lastInspected: "2030-06-07", inspector: "Carlos Mendez" },
    coordinates: { x: 20, y: 25 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 82, issue: null },
      { zone: "concourse", status: "operational", occupancyPercent: 65, issue: null },
      { zone: "vip", status: "operational", occupancyPercent: 45, issue: null },
      { zone: "parking", status: "operational", occupancyPercent: 78, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 90, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 70, issue: null },
    ],
    parkingCapacity: 12000, parkingOccupancy: 9360, amenities: ["Doping Control", "Media Center", "VIP Lounge", "Medical Bay"],
  },
  {
    id: "venue-2", name: "Camp Nou", city: "Barcelona", capacity: 99354,
    status: "ready", currentEvent: "Group C: Portugal vs Netherlands", nextEvent: "Group D: England vs Italy",
    readiness: { overall: 88, infrastructure: 91, safety: 86, maintenance: 84, parking: 80, connectivity: 90, power: 92, emergency: 85, cleaning: 87, lastInspected: "2030-06-06", inspector: "Maria Torres" },
    coordinates: { x: 55, y: 20 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 79, issue: null },
      { zone: "concourse", status: "degraded", occupancyPercent: 72, issue: "Minor drainage blockage in section 3" },
      { zone: "vip", status: "operational", occupancyPercent: 55, issue: null },
      { zone: "parking", status: "operational", occupancyPercent: 82, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 85, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 60, issue: null },
    ],
    parkingCapacity: 10000, parkingOccupancy: 8200, amenities: ["Media Center", "VIP Lounge", "Medical Bay", "Doping Control"],
  },
  {
    id: "venue-3", name: "Estadio Metropolitano", city: "Madrid", capacity: 70460,
    status: "ready", currentEvent: "Group E: Spain vs Croatia", nextEvent: "Group F: Belgium vs Morocco",
    readiness: { overall: 85, infrastructure: 88, safety: 83, maintenance: 82, parking: 78, connectivity: 87, power: 90, emergency: 82, cleaning: 84, lastInspected: "2030-06-08", inspector: "Jorge Ruiz" },
    coordinates: { x: 38, y: 40 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 74, issue: null },
      { zone: "concourse", status: "operational", occupancyPercent: 58, issue: null },
      { zone: "vip", status: "operational", occupancyPercent: 35, issue: null },
      { zone: "parking", status: "operational", occupancyPercent: 85, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 80, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 65, issue: null },
    ],
    parkingCapacity: 8000, parkingOccupancy: 6800, amenities: ["Medical Bay", "VIP Lounge"],
  },
  {
    id: "venue-4", name: "La Cartuja", city: "Seville", capacity: 72600,
    status: "maintenance", currentEvent: null, nextEvent: "Group G: Uruguay vs South Korea",
    readiness: { overall: 65, infrastructure: 72, safety: 70, maintenance: 45, parking: 68, connectivity: 80, power: 85, emergency: 60, cleaning: 55, lastInspected: "2030-06-05", inspector: "Ana Lopez" },
    coordinates: { x: 75, y: 45 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "concourse", status: "offline", occupancyPercent: 0, issue: "Floor resurfacing in progress" },
      { zone: "vip", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "parking", status: "operational", occupancyPercent: 30, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 0, issue: null },
    ],
    parkingCapacity: 9000, parkingOccupancy: 2700, amenities: ["Doping Control", "Media Center"],
  },
  {
    id: "venue-5", name: "San Mames", city: "Bilbao", capacity: 53289,
    status: "ready", currentEvent: "Group H: Japan vs Senegal", nextEvent: "Group A: Brazil vs Switzerland",
    readiness: { overall: 90, infrastructure: 93, safety: 88, maintenance: 87, parking: 82, connectivity: 92, power: 94, emergency: 87, cleaning: 89, lastInspected: "2030-06-07", inspector: "Iker Diaz" },
    coordinates: { x: 15, y: 50 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 76, issue: null },
      { zone: "concourse", status: "operational", occupancyPercent: 55, issue: null },
      { zone: "vip", status: "operational", occupancyPercent: 40, issue: null },
      { zone: "parking", status: "operational", occupancyPercent: 72, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 78, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 50, issue: null },
    ],
    parkingCapacity: 6000, parkingOccupancy: 4320, amenities: ["Medical Bay", "VIP Lounge", "Doping Control"],
  },
  {
    id: "venue-6", name: "Mestalla", city: "Valencia", capacity: 55000,
    status: "preparing", currentEvent: null, nextEvent: "Group C: Portugal vs Iran",
    readiness: { overall: 78, infrastructure: 82, safety: 76, maintenance: 70, parking: 72, connectivity: 84, power: 88, emergency: 75, cleaning: 73, lastInspected: "2030-06-06", inspector: "Pablo Sanchez" },
    coordinates: { x: 60, y: 50 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "concourse", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "vip", status: "degraded", occupancyPercent: 0, issue: "AC system under repair" },
      { zone: "parking", status: "operational", occupancyPercent: 15, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 0, issue: null },
    ],
    parkingCapacity: 7000, parkingOccupancy: 1050, amenities: ["Media Center"],
  },
  {
    id: "venue-7", name: "Gran Canaria Stadium", city: "Las Palmas", capacity: 32400,
    status: "ready", currentEvent: "Group F: Belgium vs Canada", nextEvent: "Group E: Spain vs Costa Rica",
    readiness: { overall: 83, infrastructure: 86, safety: 81, maintenance: 79, parking: 75, connectivity: 85, power: 89, emergency: 80, cleaning: 82, lastInspected: "2030-06-04", inspector: "Elena Gomez" },
    coordinates: { x: 45, y: 10 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 71, issue: null },
      { zone: "concourse", status: "operational", occupancyPercent: 48, issue: null },
      { zone: "vip", status: "operational", occupancyPercent: 30, issue: null },
      { zone: "parking", status: "operational", occupancyPercent: 68, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 72, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 45, issue: null },
    ],
    parkingCapacity: 4000, parkingOccupancy: 2720, amenities: ["Medical Bay", "VIP Lounge"],
  },
  {
    id: "venue-8", name: "RCDE Stadium", city: "Barcelona", capacity: 40463,
    status: "ready", currentEvent: "Group D: England vs USA", nextEvent: "Group H: Japan vs Colombia",
    readiness: { overall: 86, infrastructure: 89, safety: 84, maintenance: 82, parking: 79, connectivity: 88, power: 91, emergency: 83, cleaning: 85, lastInspected: "2030-06-07", inspector: "Marcos Garcia" },
    coordinates: { x: 85, y: 25 }, zones: [
      { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
      { zone: "stands", status: "operational", occupancyPercent: 68, issue: null },
      { zone: "concourse", status: "operational", occupancyPercent: 52, issue: null },
      { zone: "vip", status: "operational", occupancyPercent: 25, issue: null },
      { zone: "parking", status: "operational", occupancyPercent: 74, issue: null },
      { zone: "broadcast", status: "operational", occupancyPercent: 82, issue: null },
      { zone: "media", status: "operational", occupancyPercent: 55, issue: null },
    ],
    parkingCapacity: 5000, parkingOccupancy: 3700, amenities: ["Doping Control", "Media Center", "Medical Bay"],
  },
];

export const TEAMS: Team[] = [
  { id: "team-1", name: "Brazil", shortName: "BRA", country: "Brazil", rank: 1, group: "A", matchesPlayed: 2, matchesWon: 2, matchesDrawn: 0, matchesLost: 0, points: 6, restDaysUsed: 4, nextMatchId: null, lastMatchId: null, players: 23, staff: 18 },
  { id: "team-2", name: "Germany", shortName: "GER", country: "Germany", rank: 3, group: "A", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, restDaysUsed: 3, nextMatchId: null, lastMatchId: null, players: 23, staff: 18 },
  { id: "team-3", name: "Argentina", shortName: "ARG", country: "Argentina", rank: 2, group: "B", matchesPlayed: 2, matchesWon: 2, matchesDrawn: 0, matchesLost: 0, points: 6, restDaysUsed: 4, nextMatchId: null, lastMatchId: null, players: 23, staff: 19 },
  { id: "team-4", name: "France", shortName: "FRA", country: "France", rank: 4, group: "B", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, restDaysUsed: 3, nextMatchId: null, lastMatchId: null, players: 23, staff: 17 },
  { id: "team-5", name: "Portugal", shortName: "POR", country: "Portugal", rank: 5, group: "C", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 1, matchesLost: 0, points: 4, restDaysUsed: 3, nextMatchId: null, lastMatchId: null, players: 23, staff: 16 },
  { id: "team-6", name: "Netherlands", shortName: "NED", country: "Netherlands", rank: 7, group: "C", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, restDaysUsed: 3, nextMatchId: null, lastMatchId: null, players: 23, staff: 17 },
  { id: "team-7", name: "England", shortName: "ENG", country: "England", rank: 6, group: "D", matchesPlayed: 2, matchesWon: 2, matchesDrawn: 0, matchesLost: 0, points: 6, restDaysUsed: 4, nextMatchId: null, lastMatchId: null, players: 23, staff: 18 },
  { id: "team-8", name: "Italy", shortName: "ITA", country: "Italy", rank: 9, group: "D", matchesPlayed: 2, matchesWon: 0, matchesDrawn: 1, matchesLost: 1, points: 1, restDaysUsed: 2, nextMatchId: null, lastMatchId: null, players: 23, staff: 16 },
  { id: "team-9", name: "Spain", shortName: "ESP", country: "Spain", rank: 8, group: "E", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 1, matchesLost: 0, points: 4, restDaysUsed: 3, nextMatchId: null, lastMatchId: null, players: 23, staff: 18 },
  { id: "team-10", name: "Croatia", shortName: "CRO", country: "Croatia", rank: 12, group: "E", matchesPlayed: 2, matchesWon: 0, matchesDrawn: 2, matchesLost: 0, points: 2, restDaysUsed: 2, nextMatchId: null, lastMatchId: null, players: 23, staff: 15 },
  { id: "team-11", name: "Belgium", shortName: "BEL", country: "Belgium", rank: 10, group: "F", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, restDaysUsed: 3, nextMatchId: null, lastMatchId: null, players: 23, staff: 16 },
  { id: "team-12", name: "Morocco", shortName: "MAR", country: "Morocco", rank: 14, group: "F", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, restDaysUsed: 2, nextMatchId: null, lastMatchId: null, players: 23, staff: 14 },
  { id: "team-13", name: "Uruguay", shortName: "URU", country: "Uruguay", rank: 11, group: "G", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, restDaysUsed: 3, nextMatchId: null, lastMatchId: null, players: 23, staff: 16 },
  { id: "team-14", name: "South Korea", shortName: "KOR", country: "South Korea", rank: 23, group: "G", matchesPlayed: 2, matchesWon: 0, matchesDrawn: 1, matchesLost: 1, points: 1, restDaysUsed: 2, nextMatchId: null, lastMatchId: null, players: 23, staff: 15 },
  { id: "team-15", name: "Japan", shortName: "JPN", country: "Japan", rank: 18, group: "H", matchesPlayed: 2, matchesWon: 1, matchesDrawn: 0, matchesLost: 1, points: 3, restDaysUsed: 2, nextMatchId: null, lastMatchId: null, players: 23, staff: 15 },
  { id: "team-16", name: "Senegal", shortName: "SEN", country: "Senegal", rank: 20, group: "H", matchesPlayed: 2, matchesWon: 0, matchesDrawn: 1, matchesLost: 1, points: 1, restDaysUsed: 2, nextMatchId: null, lastMatchId: null, players: 23, staff: 14 },
];

export const RESOURCE_TYPES: ResourceType[] = ["security", "medical", "maintenance", "cleaning", "broadcast", "volunteers", "parking_staff", "officials", "stewards", "food_service"];

export const RESOURCE_REQUIREMENTS: Record<string, { base: number; perThousandSpectators: number }> = {
  security: { base: 50, perThousandSpectators: 3 },
  medical: { base: 15, perThousandSpectators: 1 },
  maintenance: { base: 20, perThousandSpectators: 0.5 },
  cleaning: { base: 30, perThousandSpectators: 1.2 },
  broadcast: { base: 40, perThousandSpectators: 0.2 },
  volunteers: { base: 60, perThousandSpectators: 2 },
  parking_staff: { base: 25, perThousandSpectators: 0.8 },
  officials: { base: 8, perThousandSpectators: 0.1 },
  stewards: { base: 40, perThousandSpectators: 1.5 },
  food_service: { base: 35, perThousandSpectators: 1.5 },
};

export const READINESS_CATEGORIES: { key: ReadinessCategory; label: string }[] = [
  { key: "infrastructure", label: "Infrastructure" },
  { key: "safety", label: "Safety" },
  { key: "maintenance", label: "Maintenance" },
  { key: "parking", label: "Parking" },
  { key: "connectivity", label: "Connectivity" },
  { key: "power", label: "Power Systems" },
  { key: "emergency", label: "Emergency Readiness" },
  { key: "cleaning", label: "Cleaning" },
];

export const OPERATIONAL_PHASES: OperationalPhase[] = [
  "preparation", "security_sweep", "team_arrival", "warmup",
  "match", "half_time_break", "post_match", "cleanup", "maintenance",
];

export const PHASE_DURATION_MINUTES: Record<OperationalPhase, number> = {
  preparation: 120, security_sweep: 45, team_arrival: 30, warmup: 30,
  match: 105, half_time_break: 15, post_match: 20, cleanup: 60, maintenance: 90,
};

export const WEATHER_SCENARIOS = [
  { condition: "clear" as const, temperature: 28, humidity: 45, windSpeed: 8, precipitation: 0, forecast: "Sunny, ideal conditions for play.", alert: null },
  { condition: "cloudy" as const, temperature: 22, humidity: 55, windSpeed: 12, precipitation: 5, forecast: "Overcast but no rain expected.", alert: null },
  { condition: "rain" as const, temperature: 18, humidity: 78, windSpeed: 20, precipitation: 60, forecast: "Light rain expected during match hours.", alert: "Pitch waterlogging possible in sustained rain" },
  { condition: "storm" as const, temperature: 15, humidity: 92, windSpeed: 45, precipitation: 90, forecast: "Thunderstorms approaching. Match delay possible.", alert: "Lightning risk. Emergency protocols activated." },
  { condition: "extreme_heat" as const, temperature: 38, humidity: 30, windSpeed: 5, precipitation: 0, forecast: "Extreme heat warning in effect.", alert: "Cooling breaks to be implemented. Hydration stations active." },
  { condition: "fog" as const, temperature: 12, humidity: 88, windSpeed: 5, precipitation: 10, forecast: "Dense fog reducing visibility below 50m.", alert: "Broadcast cameras affected. Player visibility concerns." },
];

export const REFRESH_INTERVAL = 5000;
