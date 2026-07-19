import type { AIRecommendation, Incident, ResponseTeam } from "../types";
import { EVACUATION_EXITS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IRecommendationEngine {
  generate(incidents: Incident[], teams: ResponseTeam[]): AIRecommendation[];
}

const TEMPLATES: Array<{
  match: (inc: Incident) => boolean;
  gen: (inc: Incident, teams: ResponseTeam[]) => AIRecommendation[];
}> = [
  {
    match: (inc) => inc.status === "reported" || inc.status === "analyzing",
    gen: (inc, teams) => {
      const recs: AIRecommendation[] = [];
      const team = teams.find((t) => t.type === inc.aiAnalysis.recommendedTeam && t.status === "available");
      if (team) {
        recs.push({
          id: `rec-dispatch-${inc.id}`,
          action: `Dispatch ${team.name}`,
          detail: `${team.leader}'s team (${team.members} members) dispatched to ${inc.location}. Equipped for ${inc.type.replace(/_/g, " ")}.`,
          priority: inc.severity === "critical" ? "p0" : inc.severity === "high" ? "p1" : "p2",
          confidence: inc.aiConfidence,
          incidentId: inc.id,
          impact: `Response initiated within ${team.estimatedArrivalMinutes} min. Fatality risk reduced by estimated ${rand(40, 65)}%.`,
          requiresApproval: inc.severity === "critical" || inc.severity === "high",
          category: "dispatch",
        });
      }
      return recs;
    },
  },
  {
    match: (inc) => inc.type === "fire" || inc.type === "stampede_risk" || inc.type === "crowd_surge",
    gen: (inc) => [{
      id: `rec-evac-${inc.id}`,
      action: `Activate ${inc.type === "fire" ? "Fire Protocol" : "Evacuation Standby"} for ${inc.location}`,
      detail: `${EVACUATION_EXITS.slice(0, 3).map((e) => e.label).join(", ")} designated as primary evacuation routes. Rally points prepared.`,
      priority: "p0" as const,
      confidence: rand(82, 95),
      incidentId: inc.id,
      impact: "Prevents casualty escalation. Full zone clearance estimated within 6 minutes.",
      requiresApproval: true,
      category: "evacuation",
    }],
  },
  {
    match: (inc) => inc.severity === "critical" || inc.severity === "high",
    gen: (inc) => [{
      id: `rec-comm-${inc.id}`,
      action: "Broadcast Safety Announcement",
      detail: `Inform all spectators in ${inc.location} and adjacent zones. Provide clear directional guidance. Message: "Please follow staff instructions and proceed calmly."`,
      priority: "p1" as const,
      confidence: rand(78, 92),
      incidentId: inc.id,
      impact: "Reduces panic risk by 40%. Estimated compliance rate: 85%.",
      requiresApproval: true,
      category: "communication",
    }],
  },
  {
    match: (inc) => inc.type === "security_threat",
    gen: (inc) => [{
      id: `rec-lockdown-${inc.id}`,
      action: "Initiate Zone Lockdown",
      detail: `Secure all access points to ${inc.location}. Activate CCTV monitoring. Deploy security to perimeter.`,
      priority: "p0" as const,
      confidence: rand(85, 96),
      incidentId: inc.id,
      impact: "Contains threat. Prevents spread to adjacent zones. Estimated containment in 4 min.",
      requiresApproval: true,
      category: "lockdown",
    }],
  },
  {
    match: (inc) => inc.type === "medical_emergency",
    gen: (inc) => [{
      id: `rec-med-${inc.id}`,
      action: "Prepare Medical Triage Area",
      detail: `Set up triage at nearest medical station. Request ambulance access to field level. Alert nearest hospital.`,
      priority: "p1" as const,
      confidence: rand(80, 93),
      incidentId: inc.id,
      impact: "Reduces treatment delay by 5-8 min. Improves patient outcome probability by 35%.",
      requiresApproval: false,
      category: "medical",
    }],
  },
  {
    match: (inc) => inc.type === "infrastructure_failure" || inc.type === "power_failure",
    gen: (inc) => [{
      id: `rec-eng-${inc.id}`,
      action: "Activate Engineering Response",
      detail: `Shut down affected systems. Engage backup infrastructure. Isolate damaged section for safety.`,
      priority: "p2" as const,
      confidence: rand(75, 90),
      incidentId: inc.id,
      impact: "Prevents secondary damage. Estimated repair time: 15-30 min with full team.",
      requiresApproval: false,
      category: "engineering",
    }],
  },
];

export class MockRecommendationEngine implements IRecommendationEngine {
  generate(incidents: Incident[], teams: ResponseTeam[]): AIRecommendation[] {
    const recs: AIRecommendation[] = [];
    const seen = new Set<string>();

    for (const inc of incidents) {
      if (inc.status === "resolved" || inc.status === "contained") continue;
      for (const template of TEMPLATES) {
        if (template.match(inc)) {
          const generated = template.gen(inc, teams);
          for (const rec of generated) {
            if (!seen.has(rec.action + rec.incidentId)) {
              seen.add(rec.action + rec.incidentId);
              recs.push(rec);
            }
          }
        }
      }
    }

    return recs.sort((a, b) => {
      const order = { p0: 0, p1: 1, p2: 2, p3: 3 };
      return order[a.priority] - order[b.priority];
    }).slice(0, 12);
  }
}

export const recommendationEngine = new MockRecommendationEngine();
