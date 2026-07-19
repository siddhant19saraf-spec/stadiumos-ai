export type TournamentStage =
  | "pre_tournament" | "group_stage" | "quarter_final" | "semi_final"
  | "final" | "post_tournament";

export type MatchStatus =
  | "scheduled" | "preparing" | "team_arrival" | "warmup"
  | "in_progress" | "half_time" | "second_half" | "completed"
  | "postponed" | "cancelled";

export type VenueStatus =
  | "ready" | "preparing" | "maintenance" | "emergency"
  | "post_event_cleanup" | "inactive";

export type VenueZone = "pitch" | "stands" | "concourse" | "vip" | "parking" | "media" | "broadcast" | "backstage";

export type ConflictType =
  | "venue_double_booked" | "time_overlap" | "insufficient_staff"
  | "broadcast_conflict" | "maintenance_conflict" | "parking_overflow"
  | "emergency_overlap" | "weather_conflict" | "team_rest_violation"
  | "security_gap";

export type ConflictSeverity = "critical" | "high" | "medium" | "low";

export type ResourceType =
  | "security" | "medical" | "maintenance" | "cleaning"
  | "broadcast" | "volunteers" | "parking_staff" | "officials"
  | "stewards" | "food_service";

export type ReadinessCategory =
  | "infrastructure" | "safety" | "maintenance" | "parking"
  | "connectivity" | "power" | "emergency" | "cleaning";

export type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "extreme_heat" | "fog" | "snow";

export type OperationalPhase =
  | "preparation" | "security_sweep" | "team_arrival" | "warmup"
  | "match" | "half_time_break" | "post_match" | "cleanup" | "maintenance";

export type PredictionType =
  | "schedule_delay" | "resource_shortage" | "attendance" | "parking_overflow"
  | "staff_requirement" | "emergency_probability" | "weather_impact";

export interface Tournament {
  id: string;
  name: string;
  shortName: string;
  sport: string;
  stage: TournamentStage;
  startDate: string;
  endDate: string;
  venueIds: string[];
  teamIds: string[];
  totalMatches: number;
  completedMatches: number;
  progressPercent: number;
  operationalReadiness: number;
  aiRiskScore: number;
  tournamentDirector: string;
  organizingBody: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  capacity: number;
  status: VenueStatus;
  readiness: VenueReadiness;
  currentEvent: string | null;
  nextEvent: string | null;
  coordinates: { x: number; y: number };
  zones: VenueZoneStatus[];
  parkingCapacity: number;
  parkingOccupancy: number;
  amenities: string[];
}

export interface VenueReadiness {
  overall: number;
  infrastructure: number;
  safety: number;
  maintenance: number;
  parking: number;
  connectivity: number;
  power: number;
  emergency: number;
  cleaning: number;
  lastInspected: string;
  inspector: string;
}

export interface VenueZoneStatus {
  zone: VenueZone;
  status: "operational" | "degraded" | "offline";
  occupancyPercent: number;
  issue: string | null;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  country: string;
  rank: number;
  group: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  points: number;
  restDaysUsed: number;
  nextMatchId: string | null;
  lastMatchId: string | null;
  players: number;
  staff: number;
}

export interface Match {
  id: string;
  title: string;
  stage: TournamentStage;
  status: MatchStatus;
  venueId: string;
  homeTeamId: string;
  awayTeamId: string;
  scheduledDate: string;
  scheduledTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  estimatedDuration: number;
  attendance: number;
  capacityPercent: number;
  crowdDensity: number;
  aiPredictedAttendance: number;
  revenue: number;
  broadcastCoverage: string[];
  weatherForecast: WeatherData;
  incidents: number;
  securityLevel: "normal" | "elevated" | "high" | "critical";
  aiDelayRisk: number;
  delayMinutes: number;
  operationalTimeline: TimelinePhase[];
  ticketsSold: number;
  ticketsAvailable: number;
}

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  forecast: string;
  alert: string | null;
}

export interface ScheduleSlot {
  id: string;
  matchId: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  phase: OperationalPhase;
  allocatedResources: ResourceAllocation[];
  conflicts: Conflict[];
}

export interface ResourceAllocation {
  type: ResourceType;
  required: number;
  allocated: number;
  available: number;
  utilizationPercent: number;
  status: "sufficient" | "shortage" | "over_allocated";
  teams: string[];
}

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  affectedIds: string[];
  affectedVenues: string[];
  aiResolution: string;
  aiConfidence: number;
  resolved: boolean;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface AIRecommendation {
  id: string;
  type: "reschedule" | "relocate" | "increase_security" | "delay_kickoff"
    | "allocate_staff" | "activate_backup" | "weather_action" | "schedule_optimization";
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  confidence: number;
  impact: string;
  affectedMatchId: string | null;
  affectedVenueId: string | null;
  reasoning: string[];
  requiresApproval: boolean;
  implemented: boolean;
}

export interface TournamentAnalytics {
  tournamentName: string;
  stage: TournamentStage;
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  totalRevenue: number;
  totalAttendance: number;
  averageAttendance: number;
  venueUtilization: number;
  averageDelayMinutes: number;
  safetyIndex: number;
  operationalEfficiency: number;
  resourceUtilization: number;
  aiRiskScore: number;
  conflictResolutionRate: number;
  readinessScore: number;
  incidentsResolved: number;
  totalIncidents: number;
  perVenueStats: VenueStat[];
  dailyAttendance: DailyStat[];
}

export interface VenueStat {
  venueId: string;
  venueName: string;
  matchesHosted: number;
  utilizationPercent: number;
  readinessPercent: number;
  avgAttendance: number;
  incidents: number;
}

export interface DailyStat {
  date: string;
  totalAttendance: number;
  matchesCount: number;
  revenue: number;
  incidents: number;
}

export interface OperationalTimelineEntry {
  id: string;
  matchId: string;
  matchTitle: string;
  venueName: string;
  phases: TimelinePhase[];
  startTime: string;
  endTime: string;
}

export interface TimelinePhase {
  phase: OperationalPhase;
  startTime: string;
  endTime: string;
  status: "pending" | "active" | "completed" | "delayed";
  durationMinutes: number;
}

export interface PredictiveInsight {
  id: string;
  type: PredictionType;
  title: string;
  description: string;
  probability: number;
  severity: "low" | "medium" | "high" | "critical";
  affectedEntity: string;
  timeframe: string;
  suggestedAction: string;
  confidence: number;
}

export interface TournamentState {
  tournament: Tournament;
  venues: Venue[];
  teams: Team[];
  matches: Match[];
  schedule: ScheduleSlot[];
  conflicts: Conflict[];
  recommendations: AIRecommendation[];
  analytics: TournamentAnalytics;
  timeline: OperationalTimelineEntry[];
  predictions: PredictiveInsight[];
  resourceAllocations: ResourceAllocation[];
  lastUpdated: string;
}
