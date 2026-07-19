import type { TournamentAnalytics, Match, Venue, Conflict, VenueStat, DailyStat } from "../types";
import { VENUES } from "../constants";

export interface IAnalyticsEngine {
  compute(matches: Match[], venues: Venue[], conflicts: Conflict[]): TournamentAnalytics;
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  compute(matches: Match[], _venues: Venue[], conflicts: Conflict[]): TournamentAnalytics {
    const completed = matches.filter((m) => m.status === "completed");
    const upcoming = matches.filter((m) => m.status !== "completed" && m.status !== "cancelled");
    const totalRevenue = matches.reduce((s, m) => s + (m.revenue ?? 0), 0);
    const totalAttendance = matches.reduce((s, m) => s + (m.attendance ?? 0), 0);
    const avgAttendance = matches.length > 0 ? Math.round(totalAttendance / matches.length) : 0;
    const delays = matches.filter((m) => m.delayMinutes > 0);
    const avgDelay = matches.length > 0 ? delays.reduce((s, m) => s + m.delayMinutes, 0) / matches.length : 0;
    const totalDelay = matches.reduce((s, m) => s + (m.delayMinutes ?? 0), 0);
    const resolvedConflicts = conflicts.filter((c) => c.resolved).length;

    const perVenueStats: VenueStat[] = VENUES.map((v) => {
      const venueMatches = matches.filter((m) => m.venueId === v.id);
      const hostCount = venueMatches.length;
      const avgVenueAttendance = hostCount > 0 ? Math.round(venueMatches.reduce((s, m) => s + (m.attendance ?? 0), 0) / hostCount) : 0;
      const incidents = venueMatches.reduce((s, m) => s + (m.incidents ?? 0), 0);
      return {
        venueId: v.id, venueName: v.name, matchesHosted: hostCount,
        utilizationPercent: hostCount > 0 ? Math.round((hostCount / Math.max(1, matches.length)) * 100) : 0,
        readinessPercent: v.readiness.overall,
        avgAttendance: avgVenueAttendance, incidents,
      };
    });

    const dailyMap = new Map<string, { attendance: number; matches: number; revenue: number; incidents: number }>();
    for (const match of matches) {
      const date = match.scheduledDate;
      const entry = dailyMap.get(date) ?? { attendance: 0, matches: 0, revenue: 0, incidents: 0 };
      entry.attendance += match.attendance ?? 0;
      entry.matches++;
      entry.revenue += match.revenue ?? 0;
      entry.incidents += match.incidents ?? 0;
      dailyMap.set(date, entry);
    }
    const dailyAttendance: DailyStat[] = Array.from(dailyMap.entries()).map(([date, d]) => ({
      date, totalAttendance: d.attendance, matchesCount: d.matches, revenue: d.revenue, incidents: d.incidents,
    }));

    const avgUtilization = perVenueStats.length > 0
      ? Math.round(perVenueStats.reduce((s, v) => s + v.utilizationPercent, 0) / perVenueStats.length)
      : 0;
    const avgReadiness = Math.round(VENUES.reduce((s, v) => s + v.readiness.overall, 0) / VENUES.length);
    const avgSafety = Math.round(VENUES.reduce((s, v) => s + v.readiness.safety, 0) / VENUES.length);

    const operationalEfficiency = Math.max(0, Math.min(100,
      100 - (avgDelay * 0.5) - (matches.length > 0 ? (conflicts.length / matches.length) * 5 : 0),
    ));

    const resourceUtil = Math.round(VENUES.reduce((s, v) => {
      const avgZone = v.zones.length > 0 ? v.zones.reduce((sz, z) => sz + z.occupancyPercent, 0) / v.zones.length : 0;
      return s + avgZone;
    }, 0) / VENUES.length);

    return {
      tournamentName: "World Cup 2030",
      stage: "group_stage",
      totalMatches: matches.length,
      completedMatches: completed.length,
      upcomingMatches: upcoming.length,
      totalRevenue,
      totalAttendance,
      averageAttendance: avgAttendance,
      venueUtilization: avgUtilization,
      averageDelayMinutes: parseFloat(avgDelay.toFixed(1)),
      safetyIndex: avgSafety,
      operationalEfficiency: parseFloat(operationalEfficiency.toFixed(0)),
      resourceUtilization: resourceUtil,
      aiRiskScore: Math.round(matches.reduce((s, m) => s + (m.aiDelayRisk ?? 0), 0) / Math.max(1, matches.length)),
      conflictResolutionRate: conflicts.length > 0 ? Math.round((resolvedConflicts / conflicts.length) * 100) : 100,
      readinessScore: avgReadiness,
      incidentsResolved: resolvedConflicts,
      totalIncidents: matches.reduce((s, m) => s + (m.incidents ?? 0), 0),
      perVenueStats,
      dailyAttendance,
    };
  }
}

export const analyticsEngine = new MockAnalyticsEngine();

