import type { TournamentAnalytics, Match, Venue, Conflict, AIRecommendation, TournamentState } from "../types";

export interface IReportingEngine {
  generateExecutiveSummary(state: TournamentState): string;
  generateVenueReport(venue: Venue): string;
  generateMatchReport(match: Match): string;
  generateConflictReport(conflicts: Conflict[]): string;
}

export class MockReportingEngine implements IReportingEngine {
  generateExecutiveSummary(state: TournamentState): string {
    const { analytics, matches, conflicts, tournament } = state;
    const completion = tournament.totalMatches > 0
      ? Math.round((analytics.completedMatches / tournament.totalMatches) * 100)
      : 0;
    return [
      `Tournament: ${analytics.tournamentName}`,
      `Stage: ${analytics.stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      `Progress: ${analytics.completedMatches}/${tournament.totalMatches} matches (${completion}%)`,
      `Total Attendance: ${analytics.totalAttendance.toLocaleString()}`,
      `Revenue: $${analytics.totalRevenue.toLocaleString()}`,
      `Avg Delay: ${analytics.averageDelayMinutes} min`,
      `Safety Index: ${analytics.safetyIndex}/100`,
      `Operational Efficiency: ${analytics.operationalEfficiency}%`,
      `Active Conflicts: ${conflicts.filter((c) => !c.resolved).length}`,
      `Recommendations: ${matches.length > 0 ? "Active AI optimization in progress" : "Monitoring mode"}`,
      `Readiness Score: ${analytics.readinessScore}/100`,
    ].join("\n");
  }

  generateVenueReport(venue: Venue): string {
    return [
      `Venue: ${venue.name} (${venue.city})`,
      `Capacity: ${venue.capacity.toLocaleString()}`,
      `Status: ${venue.status.replace(/_/g, " ")}`,
      `Readiness: ${venue.readiness.overall}/100`,
      `  Infrastructure: ${venue.readiness.infrastructure}`,
      `  Safety: ${venue.readiness.safety}`,
      `  Maintenance: ${venue.readiness.maintenance}`,
      `  Parking: ${venue.readiness.parking}`,
      `  Connectivity: ${venue.readiness.connectivity}`,
      `  Power: ${venue.readiness.power}`,
      `  Emergency: ${venue.readiness.emergency}`,
      `  Cleaning: ${venue.readiness.cleaning}`,
      `Parking: ${venue.parkingOccupancy.toLocaleString()}/${venue.parkingCapacity.toLocaleString()} used`,
      `Last Inspected: ${venue.readiness.lastInspected} by ${venue.readiness.inspector}`,
      `Zone Status: ${venue.zones.filter((z) => z.status === "operational").length}/${venue.zones.length} operational`,
      venue.zones.filter((z) => z.issue).map((z) => `  Issue - ${z.zone}: ${z.issue}`).join("\n"),
    ].join("\n");
  }

  generateMatchReport(match: Match): string {
    return [
      `Match: ${match.title}`,
      `Status: ${match.status}`,
      `Date: ${match.scheduledDate} @ ${match.scheduledTime}`,
      `Attendance: ${(match.attendance ?? 0).toLocaleString()} (${match.capacityPercent}% capacity)`,
      `Revenue: $${(match.revenue ?? 0).toLocaleString()}`,
      `Incidents: ${match.incidents ?? 0}`,
      `AI Delay Risk: ${match.aiDelayRisk}%`,
      `Delay: ${match.delayMinutes} min`,
      `Weather: ${match.weatherForecast.condition} - ${match.weatherForecast.temperature}°C`,
      `Security Level: ${match.securityLevel}`,
      `Broadcast: ${match.broadcastCoverage.join(", ")}`,
    ].join("\n");
  }

  generateConflictReport(conflicts: Conflict[]): string {
    const unresolved = conflicts.filter((c) => !c.resolved);
    const bySeverity = (sev: string) => conflicts.filter((c) => c.severity === sev).length;
    return [
      `=== Conflict Report ===`,
      `Total: ${conflicts.length}`,
      `Unresolved: ${unresolved.length}`,
      `Critical: ${bySeverity("critical")}`,
      `High: ${bySeverity("high")}`,
      `Medium: ${bySeverity("medium")}`,
      `Low: ${bySeverity("low")}`,
      ``,
      ...unresolved.map((c, i) =>
        `${i + 1}. [${c.severity.toUpperCase()}] ${c.title}\n   ${c.description}\n   Resolution: ${c.aiResolution}`,
      ),
    ].join("\n");
  }
}

export const reportingEngine = new MockReportingEngine();
