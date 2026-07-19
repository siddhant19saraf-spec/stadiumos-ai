// @ts-nocheck
import type {
  Incident, IncidentType, Severity, Priority, AIAnalysis, TimelineEntry,
  SmartAlert, ResponseTeam, AIRecommendation, EmergencyAnalytics, ResponseTimePoint, EvacuationStatus,
} from "../types";
import {
  INCIDENT_TYPE_CONFIG, INCIDENT_LOCATIONS, REPORTED_BY, TEAM_CONFIGS,
  RESPONSE_THRESHOLDS, EVACUATION_EXITS,
} from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
function uid(): string {
  return `inc-${Date.now().toString(36)}-${rand(1000, 9999)}`;
}

const INCIDENT_TYPES: IncidentType[] = [
  "medical_emergency", "fire", "security_threat", "crowd_surge", "stampede_risk",
  "suspicious_package", "infrastructure_failure", "power_failure", "network_failure",
  "weather_emergency", "vip_incident", "lost_child",
];

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const PRIORITIES: Priority[] = ["p0", "p1", "p2", "p3"];

const INCIDENT_DESCRIPTIONS: Record<IncidentType, string[]> = {
  medical_emergency: [
    "Spectator collapsed in Stand East lower section. Unconscious, breathing shallow.",
    "Spectator suffering chest pain in North Stand upper tier. History of cardiac condition.",
    "Child with severe allergic reaction at concession stand. Airway compromised.",
    "Staff member injured in service tunnel. Possible fracture to right leg.",
  ],
  fire: [
    "Smoke detected in Kitchen Facility B. Sprinklers activated. Possible grease fire.",
    "Small electrical fire in Broadcast Center control panel. Halon system engaged.",
    "Fire alarm triggered in Parking Level B2. Visual confirmation of flames near vehicle.",
  ],
  security_threat: [
    "Unidentified individual in restricted area near Player Tunnel. Refuses to comply with security.",
    "Suspicious behavior detected at Gate A. Individual attempting to bypass screening.",
    "Intruder alert on stadium perimeter. Individual scaling east fence line.",
  ],
  crowd_surge: [
    "Crowd surge detected at West Concourse near Gate C. Density exceeding 85%.",
    "Sudden crowd movement at South Stand entry tunnel. Multiple people pushed against barriers.",
    "Compression wave propagating through East Stand lower tier. Crush risk imminent.",
  ],
  stampede_risk: [
    "Panic reaction detected in North Stand. Multiple spectators attempting to exit simultaneously.",
    "Cascade effect observed in Upper Tier West. Crowd density spike of 40% in 30 seconds.",
    "Stampede trigger condition met in Section 203. Emergency evacuation may be required.",
  ],
  suspicious_package: [
    "Unattended backpack discovered under seat in Section 102. Owner not identified.",
    "Suspicious package delivered to VIP reception desk. Return address invalid.",
    "Unknown device attached to railing in East Concourse. Wires visible.",
  ],
  infrastructure_failure: [
    "Structural sensors report abnormal vibration in Upper Tier. Possible fatigue crack.",
    "Escalator malfunction at Gate B entrance. Sudden stop with passengers onboard.",
    "Flooding detected in basement level B1. Water main burst near pump room.",
  ],
  power_failure: [
    "Partial power loss in West Stand. Emergency lighting active. Backup generators engaging.",
    "UPS failure in Broadcast Center. Critical transmission equipment on battery backup.",
    "Transformer explosion at substation. South portion of stadium in darkness.",
  ],
  network_failure: [
    "Core network switch failure. CCTV feeds from East Stand offline. Redundant path degraded.",
    "Cellular network congestion critical. Emergency services communication affected.",
    "PA system network segmentation fault. North Stand audio zones unresponsive.",
  ],
  weather_emergency: [
    "Lightning strike detected within 5km radius. Evacuation of upper tiers recommended.",
    "Hailstorm approaching stadium. Wind gusts exceeding 80km/h. Structural advisory issued.",
    "Flash flood warning for surrounding area. Underground parking at risk of inundation.",
  ],
  vip_incident: [
    "VIP guest experiencing medical distress in hospitality suite. Security detail requesting assistance.",
    "Unauthorized individual approaching VIP vehicle convoy. Threat assessment in progress.",
    "VIP family member separated from security detail in main concourse area.",
  ],
  lost_child: [
    "Child separated from parent at Gate A entrance. Last seen near ticket scanning area.",
    "Unaccompanied minor at Guest Services desk. Estimated age 6, cannot locate guardian.",
    "Child found wandering in West Concourse. Wearing blue jersey, responds to 'Liam'.",
  ],
};

function generateTimeline(incidentId: string, reportedAt: string): TimelineEntry[] {
  const reported = new Date(reportedAt);
  const entries: TimelineEntry[] = [
    { id: `${incidentId}-tl-1`, action: "Incident Reported", actor: pick(REPORTED_BY), timestamp: reportedAt, detail: "Initial notification received via standard reporting channel." },
    { id: `${incidentId}-tl-2`, action: "AI Analysis Complete", actor: "Emergency AI System", timestamp: new Date(reported.getTime() + 3000).toISOString(), detail: "Incident classified. Severity and impact assessed. Response team recommended." },
  ];
  return entries;
}

export class EmergencySimulationEngine {
  private tick = 0;
  private resolvedIds: Set<string> = new Set();

  generateIncident(existingCount: number): Incident | null {
    this.tick++;

    if (existingCount >= 8) return null;
    if (this.tick % 15 !== 0 && existingCount > 0 && Math.random() > 0.18) return null;

    const type = pick(INCIDENT_TYPES);
    const cfg = INCIDENT_TYPE_CONFIG[type];
    const severity: Severity = Math.random() < 0.6 ? cfg.defaultSeverity : pick(SEVERITIES);
    const priority = severity === "critical" ? "p0" as Priority : severity === "high" ? "p1" as Priority : severity === "medium" ? "p2" as Priority : "p3" as Priority;
    const id = uid();
    const reportedAt = new Date(Date.now() - rand(0, 300000)).toISOString();
    const location = pick(INCIDENT_LOCATIONS);
    const zoneId = `zone-${rand(1, 12)}`;
    const desc = pick(INCIDENT_DESCRIPTIONS[type]);
    const aiConfidence = rand(72, 97);
    const estimatedResolution = severity === "critical" ? rand(8, 25) : severity === "high" ? rand(15, 40) : severity === "medium" ? rand(25, 60) : rand(30, 90);

    const analysis: AIAnalysis = this.generateAIAnalysis(type, severity, location, estimatedResolution);

    return {
      id,
      type,
      severity,
      priority,
      status: "reported",
      title: `${cfg.label} — ${location}`,
      description: desc,
      location,
      zoneId,
      coordinates: { x: rand(5, 95), y: rand(5, 55) },
      reportedAt,
      reportedBy: pick(REPORTED_BY),
      assignedTeam: null,
      assignedTeamType: null,
      estimatedResolutionMinutes: estimatedResolution,
      aiConfidence,
      aiAnalysis: analysis,
      timeline: generateTimeline(id, reportedAt),
      lastUpdated: reportedAt,
    };
  }

  private generateAIAnalysis(type: IncidentType, severity: Severity, location: string, estimatedMinutes: number): AIAnalysis {
    const routeOptions = EVACUATION_EXITS.map((e) => e.label);
    const selectedRoutes = routeOptions.sort(() => Math.random() - 0.5).slice(0, rand(2, 4));
    const escalationProb = severity === "critical" ? randf(45, 85, 0) : severity === "high" ? randf(20, 55, 0) : randf(5, 30, 0);

    const shortageMap: Partial<Record<IncidentType, string[]>> = {
      medical_emergency: ["Advanced Life Support Supplies", "Burn Treatment Kits"],
      fire: ["Breathing Apparatus", "Fire Suppressant Foam"],
      crowd_surge: ["Crowd Control Barriers", "Additional Steward Personnel"],
      stampede_risk: ["Barricade Reinforcements", "Medical Triage Supplies"],
    };

    return {
      severity,
      confidence: rand(78, 96),
      estimatedImpact: this.estimateImpact(type, severity),
      recommendedActions: this.getRecommendedActions(type, severity, location),
      estimatedResponseMinutes: severity === "critical" ? rand(2, 4) : severity === "high" ? rand(3, 7) : rand(5, 12),
      recommendedTeam: this.recommendTeam(type),
      evacuationRoutes: selectedRoutes,
      resourceShortages: shortageMap[type]?.filter(() => Math.random() < 0.5) ?? [],
      escalationProbability: escalationProb,
      analysisSummary: `${type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} detected at ${location}. Severity assessed as ${severity.toUpperCase()} with ${rand(70, 95)}% confidence. ${escalationProb > 50 ? "Escalation likely without immediate intervention." : "Rapid response recommended to prevent escalation."}`,
    };
  }

  private estimateImpact(type: IncidentType, severity: Severity): string {
    const impacts: Record<string, string[]> = {
      medical_emergency: ["Fan health at risk. Potential fatality without immediate care.", "Medical resources will be strained for 20-45 minutes."],
      fire: ["Structural damage to affected zone. Potential for spread to adjacent areas.", "Evacuation of 2000+ spectators likely required."],
      security_threat: ["Risk to spectator and personnel safety. Potential match interruption.", "Lockdown procedures may be required for 15-30 minutes."],
      crowd_surge: ["Crowd compression risk. Potential for injuries if not relieved within 5 minutes.", "Access to affected section may need restriction for 10-20 minutes."],
      stampede_risk: ["Imminent mass casualty risk. Immediate evacuation and crowd dispersion required.", "Panic cascade could affect 5000+ spectators within 90 seconds."],
      suspicious_package: ["Potential explosive or hazardous device. Evacuation radius of 50m required.", "Service disruption for 30-60 minutes during investigation."],
      infrastructure_failure: ["Structural integrity may be compromised. Risk of collapse in affected zone.", "Repair timeline estimated at 2-4 hours depending on damage assessment."],
      power_failure: ["Critical systems on battery backup. 15 minutes before UPS exhaustion.", "Potential complete blackout affecting 40% of stadium operations."],
      network_failure: ["Communication and monitoring systems degraded. CCTV coverage reduced.", "Emergency response coordination impacted. Backup radio systems activated."],
      weather_emergency: ["Spectator safety at risk from lightning/hail. Upper tier evacuation may be required.", "Match delay or postponement possible. 15,000+ spectators in exposed areas."],
      vip_incident: ["High-profile individual involved. Security and media attention escalated.", "Potential reputational impact. VIP protocol activated for duration of event."],
      lost_child: ["Child safety concern. Search and reunification process initiated.", "Minimal operational impact. Guest services and security coordinating."],
    };
    return pick(impacts[type]!);
  }

  private getRecommendedActions(type: IncidentType, severity: Severity, location: string): string[] {
    const base: string[] = [`Isolate ${location}`, `Divert foot traffic from area`, `Alert all nearby response teams`];
    if (severity === "critical" || severity === "high") base.push("Initiate emergency broadcast", "Prepare evacuation route", "Notify tournament director");
    if (type === "medical_emergency") base.push("Prepare medical triage area", "Request ambulance access to field level");
    if (type === "fire") base.push("Activate zone sprinklers", "Shut down HVAC in affected zone", "Stage fire suppression team");
    if (type === "security_threat") base.push("Lockdown adjacent areas", "Deploy K9 unit if available", "Review CCTV footage in real-time");
    if (type === "crowd_surge" || type === "stampede_risk") base.push("Deploy crowd barriers", "Activate PA guidance messages", "Open alternative egress paths");
    return base;
  }

  private recommendTeam(type: IncidentType) {
    const map: Partial<Record<IncidentType, string>> = {
      medical_emergency: "medical_alpha",
      fire: "fire_response",
      security_threat: "security_alpha",
      crowd_surge: "crowd_management",
      stampede_risk: "crowd_management",
      suspicious_package: "hazmat",
      infrastructure_failure: "engineering",
      power_failure: "engineering",
      network_failure: "engineering",
      weather_emergency: "evacuation",
      vip_incident: "vip_protection",
      lost_child: "security_alpha",
    };
    const teamId = map[type] ?? "security_alpha";
    return teamId as import("../types").TeamType;
  }

  generateSmartAlerts(incidents: Incident[]): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const criticalUnresolved = incidents.filter((i) => i.severity === "critical" && i.status !== "resolved");

    if (criticalUnresolved.length > RESPONSE_THRESHOLDS.maxConcurrentCritical) {
      alerts.push({
        id: `alert-${Date.now()}-overload`,
        type: "critical_incident",
        title: "Critical Incident Overload",
        message: `${criticalUnresolved.length} critical incidents active. Maximum concurrent capacity is ${RESPONSE_THRESHOLDS.maxConcurrentCritical}. Request mutual aid.`,
        severity: "critical",
        incidentId: null,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        expiresAt: new Date(Date.now() + 120000).toISOString(),
      });
    }

    for (const inc of incidents) {
      if (inc.status === "resolved") continue;
      const elapsed = (Date.now() - new Date(inc.reportedAt).getTime()) / 60000;
      const target = inc.severity === "critical" ? RESPONSE_THRESHOLDS.criticalResponseTargetMinutes : inc.severity === "high" ? RESPONSE_THRESHOLDS.highResponseTargetMinutes : RESPONSE_THRESHOLDS.mediumResponseTargetMinutes;
      if (elapsed > target && inc.status !== "dispatched" && inc.status !== "in_progress") {
        alerts.push({
          id: `alert-delay-${inc.id}`,
          type: "delayed_response",
          title: `Delayed Response — ${inc.title}`,
          message: `${Math.round(elapsed)} min elapsed without dispatch. Target: ${target} min.`,
          severity: "high",
          incidentId: inc.id,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          expiresAt: new Date(Date.now() + 180000).toISOString(),
        });
      }
      if (inc.aiAnalysis.escalationProbability > 75) {
        alerts.push({
          id: `alert-escalate-${inc.id}`,
          type: "escalating_event",
          title: `Escalation Risk — ${inc.title}`,
          message: `Escalation probability at ${inc.aiAnalysis.escalationProbability}%. Immediate intervention recommended.`,
          severity: "high",
          incidentId: inc.id,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          expiresAt: new Date(Date.now() + 180000).toISOString(),
        });
      }
    }

    const shortages = incidents.filter((i) => i.aiAnalysis.resourceShortages.length > 0 && i.status !== "resolved");
    if (shortages.length > 1) {
      alerts.push({
        id: `alert-resource-${Date.now()}`,
        type: "resource_shortage",
        title: "Resource Shortage Detected",
        message: `${shortages.length} incident(s) report resource gaps. Supplies running low in ${shortages.map((i) => i.location).join(", ")}.`,
        severity: "medium",
        incidentId: null,
        timestamp: new Date().toISOString(),
        acknowledged: false,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      });
    }

    return alerts;
  }

  generateRecommendations(incidents: Incident[], availableTeams: ResponseTeam[]): AIRecommendation[] {
    const recs: AIRecommendation[] = [];
    const unassigned = incidents.filter((i) => i.status === "reported" || i.status === "analyzing");

    for (const inc of unassigned.slice(0, 5)) {
      const team = availableTeams.find((t) => t.type === inc.aiAnalysis.recommendedTeam && t.status === "available");
      if (team) {
        recs.push({
          id: `rec-dispatch-${inc.id}`,
          action: `Dispatch ${team.name} to ${inc.location}`,
          detail: `${team.name} (${team.members} members, led by ${team.leader}) recommended for ${inc.title}. ETA: ${team.estimatedArrivalMinutes} min.`,
          priority: inc.severity === "critical" ? "p0" : inc.severity === "high" ? "p1" : "p2",
          confidence: inc.aiConfidence,
          incidentId: inc.id,
          impact: `Response initiated within ${team.estimatedArrivalMinutes} min. Reduces escalation risk by estimated ${rand(35, 60)}%.`,
          requiresApproval: inc.severity === "critical" || inc.severity === "high",
          category: "dispatch",
        });
      }

      if (inc.severity === "critical" || inc.aiAnalysis.escalationProbability > 70) {
        recs.push({
          id: `rec-comm-${inc.id}`,
          action: `Broadcast Safety Announcement for ${inc.location}`,
          detail: `Inform spectators in ${inc.location} and adjacent zones of incident. Provide guidance and direction.`,
          priority: inc.severity === "critical" ? "p0" : "p1",
          confidence: rand(80, 94),
          incidentId: inc.id,
          impact: "Reduces panic risk by providing clear instructions. Estimated compliance rate: 85%.",
          requiresApproval: true,
          category: "communication",
        });
      }

      if (inc.type === "fire" || inc.type === "stampede_risk" || inc.type === "crowd_surge") {
        recs.push({
          id: `rec-evac-${inc.id}`,
          action: `Activate ${inc.type === "fire" ? "Evacuation" : "Standby"} Protocol for ${inc.location}`,
          detail: `${inc.type === "fire" ? "Full evacuation" : "Prepare evacuation"} of affected zone and adjacent areas. ${EVACUATION_EXITS.slice(0, 2).map((e) => e.label).join(", ")} identified as primary exits.`,
          priority: "p0",
          confidence: rand(82, 95),
          incidentId: inc.id,
          impact: "Prevents casualty escalation. Estimated 1200 people to be evacuated within 6 minutes.",
          requiresApproval: true,
          category: "evacuation",
        });
      }
    }

    return recs;
  }

  generateAnalytics(incidents: Incident[], teams: ResponseTeam[], responseTimes: ResponseTimePoint[]): EmergencyAnalytics {
    const resolved = incidents.filter((i) => i.status === "resolved");
    const criticalIncidents = incidents.filter((i) => i.severity === "critical" && i.status !== "resolved");
    const teamLoad = teams.filter((t) => t.status === "dispatched" || t.status === "on_scene").length;
    const totalTeams = teams.length;
    const resourceUtil = totalTeams > 0 ? (teamLoad / totalTeams) * 100 : 0;

    const criticalPerType: Partial<Record<import("../types").IncidentType, number>> = {};
    for (const inc of criticalIncidents) {
      criticalPerType[inc.type] = (criticalPerType[inc.type] ?? 0) + 1;
    }

    const avgResponse = responseTimes.length > 0
      ? responseTimes.reduce((s, r) => s + r.responseMinutes, 0) / responseTimes.length
      : 0;
    const avgResolution = resolved.length > 0
      ? resolved.reduce((s, i) => {
          const start = new Date(i.reportedAt).getTime();
          const end = new Date(i.lastUpdated).getTime();
          return s + (end - start) / 60000;
        }, 0) / resolved.length
      : 0;

    const readinessPenalty = criticalIncidents.length * 8 + resourceUtil * 0.2;
    const readinessScore = Math.max(0, Math.min(100, 92 - readinessPenalty));
    const safetyPenalty = criticalIncidents.length * 5 + incidents.filter((i) => i.status !== "resolved").length * 2;
    const safetyScore = Math.max(0, Math.min(100, 88 - safetyPenalty));

    return {
      averageResponseMinutes: parseFloat(avgResponse.toFixed(1)),
      openIncidents: incidents.filter((i) => i.status !== "resolved").length,
      criticalIncidents: criticalIncidents.length,
      resolvedIncidents: resolved.length,
      totalIncidents: incidents.length,
      emergencyReadinessScore: parseFloat(readinessScore.toFixed(0)),
      safetyScore: parseFloat(safetyScore.toFixed(0)),
      avgResolutionMinutes: parseFloat(avgResolution.toFixed(1)),
      activeTeams: teamLoad,
      availableTeams: totalTeams - teamLoad,
      escalationRate: parseFloat((criticalIncidents.length / Math.max(1, incidents.length) * 100).toFixed(1)),
      criticalPerType,
      responseTimeHistory: responseTimes,
      evacuationStatus: criticalIncidents.length > 3 ? "partial" : criticalIncidents.length > 1 ? "standby" : "none",
      affectedZones: [...new Set(incidents.filter((i) => i.status !== "resolved").map((i) => i.zoneId))],
      resourceUtilization: parseFloat(resourceUtil.toFixed(0)),
      communicationStatus: incidents.filter((i) => i.type === "network_failure" && i.status !== "resolved").length > 0 ? "degraded" : "operational",
    };
  }
}

export const simulationEngine = new EmergencySimulationEngine();

