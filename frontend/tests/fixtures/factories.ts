// @ts-nocheck
import type { Incident, IncidentType, Severity, ResponseTeam, AIAnalysis, EmergencyAnalytics, ResponseTimePoint, Priority, TeamType, IncidentStatus, DispatchAction } from "@/features/emergency-response/types";
import type { StadiumZone, CrowdAnalytics, CrowdPrediction, CrowdRecommendation, CrowdAlert } from "@/features/crowd-intelligence/types";
import type { Tournament, Match, Venue, Team, Conflict, AIRecommendation as TAIRecommendation, TournamentAnalytics } from "@/features/tournament-ops/types";
import type { MaintenanceAsset, AssetHealth, FailurePrediction, WorkOrder, Alert as PMAlert } from "@/features/predictive-maintenance/types";
import type { SustainabilitySummary, EnergyMetrics, CarbonMetrics, AIRecommendation as SusAIRecommendation, SmartAlert } from "@/features/sustainability/types";
import type { DigitalIncident, LiveAnalytics, ZoneLiveStatus, AIInsight } from "@/features/digital-twin/types";
import type { CopilotMessage, OperationalContext, ActiveRisk, ActionExecution } from "@/features/ai-copilot/types";
import type { SecurityUser, SecurityRole, Permission, AuditEntry, ComplianceFramework } from "@/features/enterprise-security/types";
import type { ExecutiveKPI, ExecutiveReport as ER, Decision, RiskAssessment } from "@/features/executive-analytics/types";

let _counter = 0;
function seq(prefix: string): string {
  _counter++;
  return `${prefix}-${_counter}-${Date.now().toString(36)}`;
}
function ts(): string {
  return new Date().toISOString();
}
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function resetCounter(): void {
  _counter = 0;
}

export function makeIncident(overrides: Partial<Incident> = {}): Incident {
  const now = ts();
  return {
    id: seq("inc"),
    type: "medical_emergency" as IncidentType,
    severity: "high" as Severity,
    priority: "p1" as Priority,
    status: "reported",
    title: "Test Incident — East Stand Lower",
    description: "Test incident description.",
    location: "East Stand Lower",
    zoneId: "zone-1",
    coordinates: { x: 30, y: 25 },
    reportedAt: now,
    reportedBy: "CCTV Monitoring",
    assignedTeam: null,
    assignedTeamType: null,
    estimatedResolutionMinutes: 15,
    aiConfidence: 88,
    aiAnalysis: makeAIAnalysis(),
    timeline: [],
    lastUpdated: now,
    ...overrides,
  };
}

export function makeAIAnalysis(overrides: Partial<AIAnalysis> = {}): AIAnalysis {
  return {
    severity: "high",
    confidence: 88,
    estimatedImpact: "Fan health at risk.",
    recommendedActions: ["Isolate area", "Divert foot traffic"],
    estimatedResponseMinutes: 4,
    recommendedTeam: "medical_alpha" as TeamType,
    evacuationRoutes: ["North Exit", "Gate A Exit"],
    resourceShortages: [],
    escalationProbability: 45,
    analysisSummary: "Medical emergency detected at East Stand Lower.",
    ...overrides,
  };
}

export function makeResponseTeam(overrides: Partial<ResponseTeam> = {}): ResponseTeam {
  return {
    id: seq("team"),
    name: "Medical Alpha",
    type: "medical_alpha" as TeamType,
    status: "available",
    members: 4,
    leader: "Dr. Smith",
    estimatedArrivalMinutes: 5,
    coordinates: { x: 50, y: 50 },
    incidentId: null,
    equipment: ["Defibrillator", "O2 Tank"],
    ...overrides,
  };
}

export function makeResponseTimePoint(overrides: Partial<ResponseTimePoint> = {}): ResponseTimePoint {
  return {
    incidentId: seq("rtp"),
    incidentType: "medical_emergency" as IncidentType,
    responseMinutes: 4.5,
    timestamp: ts(),
    severity: "high" as Severity,
    ...overrides,
  };
}

export function makeEmergencyAnalytics(overrides: Partial<EmergencyAnalytics> = {}): EmergencyAnalytics {
  return {
    averageResponseMinutes: 4.5,
    openIncidents: 2,
    criticalIncidents: 1,
    resolvedIncidents: 3,
    totalIncidents: 6,
    emergencyReadinessScore: 85,
    safetyScore: 78,
    avgResolutionMinutes: 12.3,
    activeTeams: 2,
    availableTeams: 10,
    escalationRate: 16.7,
    criticalPerType: { medical_emergency: 1 },
    responseTimeHistory: [],
    evacuationStatus: "standby",
    affectedZones: ["zone-1", "zone-2"],
    resourceUtilization: 20,
    communicationStatus: "operational",
    ...overrides,
  };
}

export function makeDispatchAction(overrides: Partial<DispatchAction> = {}): DispatchAction {
  return {
    id: seq("dispatch"),
    incidentId: seq("inc"),
    action: "Dispatch Medical Alpha",
    teamId: seq("team"),
    timestamp: ts(),
    authorizedBy: null,
    status: "executed",
    result: "Team dispatched. ETA: 5 minutes.",
    ...overrides,
  };
}

export function makeCrowdZone(overrides: Partial<StadiumZone> = {}): StadiumZone {
  return {
    id: seq("zone"),
    name: "Zone A",
    type: "section",
    capacity: 5000,
    currentCount: 2500,
    densityPercent: 50,
    status: "normal",
    safetyScore: 92,
    waitTimeMinutes: 5,
    movementSpeed: 1.2,
    trend: "stable",
    location: { x: 0, y: 0, width: 100, height: 100 },
    ...overrides,
  };
}

export function makeCrowdAnalytics(overrides: Partial<CrowdAnalytics> = {}): CrowdAnalytics {
  return {
    totalVisitors: 45000,
    currentOccupancy: 32000,
    capacityPercent: 71,
    visitorsPerMinute: 120,
    congestionScore: 45,
    riskScore: 30,
    safetyIndex: 88,
    avgMovementSpeed: 1.1,
    heatIndex: 32,
    peakForecast: 48000,
    peakTime: "14:30",
    ...overrides,
  };
}

export function makeCrowdPrediction(overrides: Partial<CrowdPrediction> = {}): CrowdPrediction {
  return {
    id: seq("pred"),
    type: "congestion",
    title: "East Gate Congestion Predicted",
    description: "Crowd density at East Gate expected to reach 85%",
    confidence: 0.88,
    severity: "high",
    timeToOccur: "15 min",
    affectedZone: "East Gate",
    contributingFactors: ["Match ending", "Limited exit capacity"],
    suggestedAction: "Open auxiliary exits",
    businessImpact: "Potential safety risk if unaddressed",
    ...overrides,
  };
}

export function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  return {
    id: seq("tournament"),
    name: "FIFA World Cup 2026",
    shortName: "WC2026",
    sport: "Football",
    stage: "group_stage",
    startDate: "2026-06-11",
    endDate: "2026-07-19",
    venueIds: [seq("venue")],
    teamIds: [seq("team")],
    totalMatches: 64,
    completedMatches: 20,
    progressPercent: 31.25,
    operationalReadiness: 88,
    aiRiskScore: 25,
    tournamentDirector: "John Smith",
    organizingBody: "FIFA",
    ...overrides,
  };
}

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: seq("match"),
    title: "FC Barcelona vs Real Madrid",
    stage: "group_stage",
    status: "scheduled",
    venueId: seq("venue"),
    homeTeamId: seq("team"),
    awayTeamId: seq("team2"),
    scheduledDate: "2026-06-15",
    scheduledTime: "18:00",
    actualStartTime: null,
    actualEndTime: null,
    estimatedDuration: 105,
    attendance: 0,
    capacityPercent: 0,
    crowdDensity: 0,
    aiPredictedAttendance: 65000,
    revenue: 0,
    broadcastCoverage: ["ESPN", "BBC"],
    weatherForecast: { condition: "clear", temperature: 28, humidity: 60, windSpeed: 10, precipitation: 0, forecast: "Sunny", alert: null },
    incidents: 0,
    securityLevel: "normal",
    aiDelayRisk: 5,
    delayMinutes: 0,
    operationalTimeline: [],
    ticketsSold: 60000,
    ticketsAvailable: 15000,
    ...overrides,
  };
}

export function makeVenue(overrides: Partial<Venue> = {}): Venue {
  return {
    id: seq("venue"),
    name: "Lusail Iconic Stadium",
    city: "Lusail",
    capacity: 80000,
    status: "ready",
    readiness: {
      overall: 92, infrastructure: 95, safety: 90, maintenance: 88,
      parking: 85, connectivity: 94, power: 96, emergency: 89, cleaning: 91,
      lastInspected: "2026-06-01", inspector: "QA Team",
    },
    currentEvent: null,
    nextEvent: null,
    coordinates: { x: 500, y: 300 },
    zones: [],
    parkingCapacity: 15000,
    parkingOccupancy: 0,
    amenities: ["WiFi", "Air Conditioning", "VIP Lounges"],
    ...overrides,
  };
}

export function makeTeam(overrides: Partial<Team> = {}): Team {
  return {
    id: seq("team"),
    name: "FC Barcelona",
    shortName: "BAR",
    country: "Spain",
    rank: 2,
    group: "A",
    matchesPlayed: 0,
    matchesWon: 0,
    matchesDrawn: 0,
    matchesLost: 0,
    points: 0,
    restDaysUsed: 0,
    nextMatchId: null,
    lastMatchId: null,
    players: 23,
    staff: 15,
    ...overrides,
  };
}

export function makeMaintenanceAsset(overrides: Partial<MaintenanceAsset> = {}): MaintenanceAsset {
  return {
    id: seq("asset"),
    name: "HVAC Unit A1",
    type: "hvac",
    zone: "north_stand",
    installDate: "2024-01-15",
    criticality: "high",
    ...overrides,
  };
}

export function makeAssetHealth(overrides: Partial<AssetHealth> = {}): AssetHealth {
  return {
    assetId: seq("asset"),
    assetName: "HVAC Unit A1",
    type: "hvac",
    status: "healthy",
    healthScore: 85,
    riskScore: 15,
    temperature: 42,
    powerUsageKw: 150,
    utilization: 75,
    predictedFailureDate: null,
    remainingUsefulLife: "365 days",
    lastMaintenance: "2026-01-01",
    maintenanceStatus: "none",
    vibrationMmS: 2.1,
    pressureBar: 4.5,
    lastUpdated: ts(),
    ...overrides,
  };
}

export function makeFailurePrediction(overrides: Partial<FailurePrediction> = {}): FailurePrediction {
  return {
    assetId: seq("asset"),
    assetName: "HVAC Unit A1",
    failureMode: "mechanical_wear",
    probability: 0.75,
    predictedDays: 45,
    confidence: 0.88,
    reasoning: ["Vibration levels increasing", "Temperature deviation detected"],
    contributingFactors: ["Continuous operation", "Filter not replaced"],
    recommendedAction: "Schedule bearing replacement",
    estimatedCostImpact: "$12,000",
    operationalImpact: "Cooling capacity reduced by 30%",
    timestamp: ts(),
    ...overrides,
  };
}

export function makeWorkOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: seq("wo"),
    assetId: seq("asset"),
    assetName: "HVAC Unit A1",
    title: "Bearing Replacement",
    description: "Replace worn bearings in HVAC Unit A1",
    priority: "high",
    status: "open",
    requiredSkills: ["HVAC Technician", "Mechanical"],
    estimatedRepairMin: 180,
    requiredParts: ["Bearing Kit", "Lubricant"],
    safetyInstructions: ["Lockout/Tagout required", "PPE required"],
    aiReasoning: "Vibration analysis indicates bearing wear at 75% probability of failure within 45 days",
    businessImpact: "Prevents unplanned downtime during match day",
    createdAt: ts(),
    completedAt: null,
    assignedTeam: null,
    ...overrides,
  };
}

export function makePMAlert(overrides: Partial<PMAlert> = {}): PMAlert {
  return {
    id: seq("alert"),
    assetId: seq("asset"),
    assetName: "HVAC Unit A1",
    severity: "warning",
    category: "failure_risk",
    title: "Bearing Wear Detected",
    message: "Vibration analysis indicates bearing degradation",
    suggestedAction: "Schedule inspection within 7 days",
    requiresImmediateAction: false,
    acknowledged: false,
    predictionRelated: true,
    createdAt: ts(),
    acknowledgedAt: null,
    ...overrides,
  };
}

export function makeDigitalIncident(overrides: Partial<DigitalIncident> = {}): DigitalIncident {
  return {
    id: seq("dinc"),
    type: "medical",
    title: "Medical Emergency",
    description: "Spectator collapsed in North Stand",
    severity: "high",
    zoneId: seq("zone"),
    zoneName: "North Stand",
    timestamp: ts(),
    status: "active",
    ...overrides,
  };
}

export function makeLiveAnalytics(overrides: Partial<LiveAnalytics> = {}): LiveAnalytics {
  return {
    operationalHealth: 88,
    safetyIndex: 85,
    energyUsageMw: 4.2,
    maintenanceHealth: 82,
    parkingUtilization: 65,
    resourceUtilization: 70,
    queueHealth: 78,
    totalOccupancy: 45000,
    totalCapacity: 75000,
    activeIncidents: 2,
    activeTeams: 8,
    avgTemperature: 26.5,
    ...overrides,
  };
}

export function makeZoneLiveStatus(overrides: Partial<ZoneLiveStatus> = {}): ZoneLiveStatus {
  return {
    zoneId: seq("zone"),
    currentOccupancy: 3000,
    maxCapacity: 5000,
    occupancyPercent: 60,
    riskScore: 15,
    safetyScore: 90,
    queueTimeMinutes: 5,
    temperature: 26,
    status: "operational",
    maintenanceStatus: "none",
    predictedOccupancy30m: 3500,
    energyUsageKw: 120,
    cleaningStatus: "clean",
    lastUpdated: ts(),
    ...overrides,
  };
}

export function makeAIInsight(overrides: Partial<AIInsight> = {}): AIInsight {
  return {
    id: seq("insight"),
    title: "Crowd Congestion Warning",
    description: "North Stand expected to reach 90% capacity in 30 minutes",
    type: "warning",
    severity: "high",
    confidence: 0.85,
    timestamp: ts(),
    ...overrides,
  };
}

export function makeCopilotMessage(overrides: Partial<CopilotMessage> = {}): CopilotMessage {
  return {
    id: seq("msg"),
    role: "assistant",
    content: "Test message content",
    timestamp: ts(),
    status: "complete",
    ...overrides,
  };
}

export function makeOperationalContext(overrides: Partial<OperationalContext> = {}): OperationalContext {
  return {
    stadiumName: "Lusail Iconic Stadium",
    tournamentName: "FIFA World Cup 2026",
    currentMatch: "FC Barcelona vs Real Madrid",
    attendance: 45000,
    capacity: 75000,
    weather: "Clear",
    temperature: 30,
    crowdDensity: 60,
    parkingOccupancy: 70,
    avgQueueTime: 8,
    staffAvailability: 85,
    emergencyAlerts: 0,
    energyUsage: 450,
    revenue: 1500000,
    fanSatisfaction: 4.2,
    activeRisks: [],
    predictedProblems: [],
    timeOfDay: "Afternoon",
    eventPhase: "Second Half",
    ...overrides,
  };
}

export function makeActiveRisk(overrides: Partial<ActiveRisk> = {}): ActiveRisk {
  return {
    id: seq("risk"),
    title: "East Gate Congestion",
    description: "Crowd density at East Gate has reached 78%",
    level: "high",
    location: "East Gate",
    module: "Crowd",
    trend: "increasing",
    probability: 85,
    timestamp: ts(),
    ...overrides,
  };
}

export function makeActionExecution(overrides: Partial<ActionExecution> = {}): ActionExecution {
  return {
    id: seq("exec"),
    action: "Open auxiliary exits",
    status: "completed",
    timestamp: ts(),
    result: "Successfully executed: Open auxiliary exits",
    ...overrides,
  };
}

export function makeSecurityUser(overrides: Partial<SecurityUser> = {}): SecurityUser {
  return {
    id: seq("user"),
    username: "testuser",
    email: "testuser@stadiumos.ai",
    role: "operator" as SecurityRole,
    department: "Security",
    mfaEnabled: false,
    lastLogin: ts(),
    isActive: true,
    ...overrides,
  };
}

export function makeAuditEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: seq("audit"),
    userId: seq("user"),
    username: "testuser",
    action: "user.login",
    resource: "auth",
    details: "User logged in successfully",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0",
    status: "success",
    timestamp: ts(),
    correlationId: seq("corr"),
    ...overrides,
  };
}

export function makeExecutiveKPI(overrides: Partial<ExecutiveKPI> = {}): ExecutiveKPI {
  return {
    id: seq("kpi"),
    name: "Revenue per Match",
    category: "financial",
    value: 2500000,
    target: 3000000,
    unit: "USD",
    trend: "up",
    status: "on_track",
    ...overrides,
  };
}

export function makeDecision(overrides: Partial<Decision> = {}): Decision {
  return {
    id: seq("decision"),
    title: "Increase Security Presence",
    description: "Deploy additional security personnel to East Gate",
    category: "security",
    impact: "High",
    urgency: "high",
    confidence: 0.85,
    options: [
      { id: "opt1", label: "Deploy 10 officers", impact: "Reduces risk by 40%", cost: "$5,000", feasibility: 0.9 },
      { id: "opt2", label: "Deploy 5 officers", impact: "Reduces risk by 20%", cost: "$2,500", feasibility: 0.95 },
    ],
    selectedOptionId: null,
    status: "pending",
    createdAt: ts(),
    createdBy: "AI",
    ...overrides,
  };
}

export function makeRiskAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    id: seq("risk"),
    category: "security",
    title: "Crowd Crush Risk",
    description: "East Gate density exceeds 80% threshold",
    probability: 0.65,
    impact: 0.85,
    score: 55,
    level: "high",
    mitigation: "Open auxiliary exits, deploy crowd barriers",
    owner: "Security Director",
    status: "active",
    ...overrides,
  };
}

export function makeSustainabilitySummary(overrides: Partial<SustainabilitySummary> = {}): SustainabilitySummary {
  return {
    totalEnergyKwh: 12500,
    livePowerDemandKw: 450,
    totalWaterL: 85000,
    totalCO2Kg: 5200,
    wasteGeneratedKg: 1800,
    renewablePct: 35,
    operationalEfficiency: 82,
    sustainabilityScore: 74,
    esgComplianceScore: 81,
    netZeroProgress: 42,
    costSavingsYtd: 125000,
    carbonReductionYtd: 8500,
    lastUpdated: ts(),
    ...overrides,
  };
}

export function makeEnergyMetrics(overrides: Partial<EnergyMetrics> = {}): EnergyMetrics {
  return {
    assetId: seq("asset"),
    assetName: "HVAC Unit A1",
    consumptionKw: 150,
    demandKw: 175,
    peakDemandKw: 220,
    voltage: 480,
    currentA: 312,
    powerFactor: 0.95,
    temperature: 42,
    efficiency: 0.88,
    source: "grid",
    co2Intensity: 0.45,
    costPerKwh: 0.12,
    timestamp: ts(),
    ...overrides,
  };
}

export function makeCarbonMetrics(overrides: Partial<CarbonMetrics> = {}): CarbonMetrics {
  return {
    scope1: 1200,
    scope2: 3400,
    scope3: 600,
    totalCO2: 5200,
    co2PerKwh: 0.45,
    renewablePct: 35,
    carbonOffset: 500,
    netCO2: 4700,
    timestamp: ts(),
    ...overrides,
  };
}

export function makeSusRecommendation(overrides: Partial<SusAIRecommendation> = {}): SusAIRecommendation {
  return {
    id: seq("rec"),
    title: "Upgrade to LED Lighting",
    description: "Replace conventional lighting with LED in North Stand",
    category: "energy",
    priority: "p1",
    status: "active",
    domain: "energy",
    assetId: seq("asset"),
    assetName: "North Stand Lighting",
    estimatedSavingsKwh: 25000,
    estimatedWaterSavingsL: 0,
    estimatedCostSavings: 30000,
    estimatedCarbonReduction: 12000,
    implementationCost: 75000,
    roi: 2.5,
    paybackDays: 912,
    reasoning: ["LED reduces energy consumption by 60%"],
    contributingFactors: ["Aging infrastructure"],
    suggestedAction: "Procure and install LED fixtures",
    automationPossible: false,
    timestamp: ts(),
    ...overrides,
  };
}

