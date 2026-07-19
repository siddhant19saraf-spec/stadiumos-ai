import type { AIRecommendation, Conflict, Match, Venue, TournamentAnalytics } from "../types";
import { VENUES, TEAMS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${rand(100, 999)}`;
}

export interface IRecommendationEngine {
  generate(conflicts: Conflict[], matches: Match[], analytics: TournamentAnalytics): AIRecommendation[];
}

const severityScores: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export class MockRecommendationEngine implements IRecommendationEngine {
  generate(conflicts: Conflict[], matches: Match[], analytics: TournamentAnalytics): AIRecommendation[] {
    const recs: AIRecommendation[] = [];
    const unresolved = conflicts.filter((c) => !c.resolved).sort((a, b) => severityScores[a.severity] - severityScores[b.severity]);

    for (const conflict of unresolved.slice(0, 4)) {
      recs.push({
        id: uid("rec"),
        type: "reschedule",
        title: `Resolve Conflict: ${conflict.title}`,
        description: conflict.aiResolution,
        priority: conflict.severity === "critical" ? "critical" : conflict.severity === "high" ? "high" : "medium",
        confidence: conflict.aiConfidence,
        impact: "Resolves scheduling conflict, prevents operational disruption.",
        affectedMatchId: conflict.affectedIds[0] ?? null,
        affectedVenueId: conflict.affectedVenues[0] ?? null,
        reasoning: [conflict.description, "AI analysis completed", `Recommended resolution: ${conflict.aiResolution}`],
        requiresApproval: conflict.severity === "critical",
        implemented: false,
      });
    }

    const busyVenues = VENUES.filter((v) => v.parkingOccupancy > v.parkingCapacity * 0.8);
    for (const venue of busyVenues) {
      recs.push({
        id: uid("rec"), type: "allocate_staff",
        title: `Increase Staff at ${venue.name}`,
        description: `Parking at ${venue.name} is at ${Math.round((venue.parkingOccupancy / venue.parkingCapacity) * 100)}% capacity. Additional parking staff required to manage flow.`,
        priority: "high", confidence: rand(80, 93),
        impact: "Reduces parking wait times by estimated 40%. Prevents traffic congestion.",
        affectedMatchId: null, affectedVenueId: venue.id,
        reasoning: [`Parking utilization at ${venue.name} exceeds 80% threshold`, "Historical data shows congestion at this level", "Traffic modeling predicts 25min average entry delay"],
        requiresApproval: false, implemented: false,
      });
    }

    const lowestReadiness = VENUES.sort((a, b) => a.readiness.overall - b.readiness.overall)[0];
    if (lowestReadiness && lowestReadiness.readiness.overall < 75) {
      recs.push({
        id: uid("rec"), type: "activate_backup",
        title: `Activate Backup Plan for ${lowestReadiness.name}`,
        description: `${lowestReadiness.name} readiness at ${lowestReadiness.readiness.overall}%. Key deficiencies: ${Object.entries(lowestReadiness.readiness).filter(([, v]) => typeof v === "number" && v < 70).map(([k]) => k).join(", ")}. Backup venue protocol recommended.`,
        priority: "critical", confidence: rand(85, 95),
        impact: "Ensures match continuity. Prevents last-minute venue cancellation.",
        affectedMatchId: null, affectedVenueId: lowestReadiness.id,
        reasoning: [`Readiness score below 75% threshold`, "Maintenance issues unresolved", "Safety inspection pending"],
        requiresApproval: true, implemented: false,
      });
    }

    if (analytics.averageDelayMinutes > 10) {
      recs.push({
        id: uid("rec"), type: "schedule_optimization",
        title: "Optimize Match Schedule for Delay Reduction",
        description: `Average delay of ${analytics.averageDelayMinutes}min exceeds target. Recommend adjusting kickoff times by +15min buffer for remaining group stage matches.`,
        priority: "medium", confidence: rand(78, 90),
        impact: `Estimated delay reduction of 40%. Projects average delay drop to ${Math.round(analytics.averageDelayMinutes * 0.6)}min.`,
        affectedMatchId: null, affectedVenueId: null,
        reasoning: [`Current average delay: ${analytics.averageDelayMinutes}min`, "Buffer adjustment shown to reduce delays in 73% of similar tournaments", "Broadcast schedule can accommodate 15min shift"],
        requiresApproval: true, implemented: false,
      });
    }

    if (analytics.safetyIndex < 85) {
      recs.push({
        id: uid("rec"), type: "increase_security",
        title: "Elevate Security Posture Across Venues",
        description: `Safety index at ${analytics.safetyIndex}. Recommend increasing security presence by 20% and deploying additional screening at all venue entries.`,
        priority: "high", confidence: rand(80, 92),
        impact: "Expected to raise safety index by 8-12 points. Reduces incident probability by 30%.",
        affectedMatchId: null, affectedVenueId: null,
        reasoning: ["Safety index below 85 threshold", "Group stage progression increases risk profile", "Proactive security measure aligned with tournament guidelines"],
        requiresApproval: true, implemented: false,
      });
    }

    return recs.sort((a, b) => severityScores[a.priority] - severityScores[b.priority]).slice(0, 8);
  }
}

export const recommendationEngine = new MockRecommendationEngine();

