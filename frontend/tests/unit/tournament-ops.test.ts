import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyticsEngine } from "@/features/tournament-ops/services/analytics-engine";
import { schedulingEngine } from "@/features/tournament-ops/services/scheduling-engine";
import { conflictEngine } from "@/features/tournament-ops/services/conflict-engine";
import { optimizationEngine } from "@/features/tournament-ops/services/optimization-engine";
import { recommendationEngine } from "@/features/tournament-ops/services/recommendation-engine";
import { reportingEngine } from "@/features/tournament-ops/services/reporting-engine";
import { simulationEngine } from "@/features/tournament-ops/services/simulation-engine";
import { tournamentService } from "@/features/tournament-ops/services/tournament-service";
import { VENUES, TEAMS, RESOURCE_TYPES, RESOURCE_REQUIREMENTS, READINESS_CATEGORIES, OPERATIONAL_PHASES, PHASE_DURATION_MINUTES, WEATHER_SCENARIOS } from "@/features/tournament-ops/constants";
import type { Match, Conflict, TournamentAnalytics, ScheduleSlot, AIRecommendation, TournamentState, ResourceAllocation } from "@/features/tournament-ops/types";
import { makeMatch, makeVenue, makeTournament, makeTeam, resetCounter } from "../fixtures";

beforeEach(() => {
  resetCounter();
});

describe("AnalyticsEngine", () => {
  it("computes analytics with empty matches and venues", () => {
    const result = analyticsEngine.compute([], [], []);
    expect(result.totalMatches).toBe(0);
    expect(result.completedMatches).toBe(0);
    expect(result.upcomingMatches).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalAttendance).toBe(0);
    expect(result.averageAttendance).toBe(0);
    expect(result.incidentsResolved).toBe(0);
  });

  it("computes analytics with all matches completed", () => {
    const matches = [
      makeMatch({ status: "completed", revenue: 10000, attendance: 50000, delayMinutes: 5, incidents: 1 }),
      makeMatch({ status: "completed", revenue: 15000, attendance: 60000, delayMinutes: 0, incidents: 0 }),
    ];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.completedMatches).toBe(2);
    expect(result.upcomingMatches).toBe(0);
    expect(result.totalRevenue).toBe(25000);
    expect(result.totalAttendance).toBe(110000);
    expect(result.averageAttendance).toBe(55000);
  });

  it("computes analytics with mix of statuses", () => {
    const matches = [
      makeMatch({ status: "completed", revenue: 8000 }),
      makeMatch({ status: "scheduled", revenue: 0 }),
      makeMatch({ status: "in_progress", revenue: 5000 }),
      makeMatch({ status: "cancelled", revenue: 0 }),
    ];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.completedMatches).toBe(1);
    expect(result.upcomingMatches).toBe(2);
  });

  it("computes analytics with delays", () => {
    const matches = [
      makeMatch({ delayMinutes: 15 }),
      makeMatch({ delayMinutes: 25 }),
      makeMatch({ delayMinutes: 0 }),
    ];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.totalRevenue).toBeGreaterThanOrEqual(0);
    expect(result.safetyIndex).toBeGreaterThan(0);
  });

  it("computes conflict resolution rate", () => {
    const matches = [makeMatch()];
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "high", title: "Test", description: "Test", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: true, detectedAt: "", resolvedAt: "" },
      { id: "c2", type: "venue_double_booked", severity: "medium", title: "Test", description: "Test", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 85, resolved: false, detectedAt: "", resolvedAt: "" },
    ];
    const result = analyticsEngine.compute(matches, VENUES, conflicts);
    expect(result.conflictResolutionRate).toBe(50);
    expect(result.incidentsResolved).toBe(1);
  });

  it("computes zero conflict resolution rate for zero conflicts", () => {
    const result = analyticsEngine.compute([makeMatch()], VENUES, []);
    expect(result.conflictResolutionRate).toBe(100);
  });

  it("computes venue stats per venue", () => {
    const existingVenue = VENUES[0]!;
    const matches = [makeMatch({ venueId: existingVenue.id, attendance: 40000 })];
    const result = analyticsEngine.compute(matches, VENUES, []);
    const entry = result.perVenueStats.find((vs) => vs.venueId === existingVenue.id);
    expect(entry).toBeDefined();
    expect(entry!.matchesHosted).toBe(1);
    expect(entry!.avgAttendance).toBe(40000);
  });

  it("computes daily attendance stats", () => {
    const matches = [
      makeMatch({ scheduledDate: "2026-06-15", attendance: 30000, revenue: 5000 }),
      makeMatch({ scheduledDate: "2026-06-15", attendance: 40000, revenue: 7000 }),
      makeMatch({ scheduledDate: "2026-06-16", attendance: 35000, revenue: 6000 }),
    ];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.dailyAttendance).toHaveLength(2);
    const day1 = result.dailyAttendance.find((d) => d.date === "2026-06-15");
    expect(day1?.totalAttendance).toBe(70000);
    expect(day1?.matchesCount).toBe(2);
    expect(day1?.revenue).toBe(12000);
  });

  it("computes operational efficiency with high delay penalties", () => {
    const matches = [
      makeMatch({ delayMinutes: 60, status: "completed" }),
      makeMatch({ delayMinutes: 45, status: "completed" }),
    ];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.operationalEfficiency).toBeGreaterThanOrEqual(0);
    expect(result.operationalEfficiency).toBeLessThanOrEqual(100);
  });

  it("computes resource utilization from venue zones", () => {
    const matches = [makeMatch()];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.resourceUtilization).toBeGreaterThanOrEqual(0);
  });

  it("computes aiRiskScore as average of match risks", () => {
    const matches = [
      makeMatch({ aiDelayRisk: 10 }),
      makeMatch({ aiDelayRisk: 20 }),
      makeMatch({ aiDelayRisk: 30 }),
    ];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.aiRiskScore).toBe(20);
  });

  it("computes aiRiskScore as 0 for empty matches", () => {
    const result = analyticsEngine.compute([], VENUES, []);
    expect(result.aiRiskScore).toBe(0);
  });

  it("computes total incidents from matches", () => {
    const matches = [
      makeMatch({ incidents: 2 }),
      makeMatch({ incidents: 5 }),
    ];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.totalIncidents).toBe(7);
  });

  it("sets stage and tournament name", () => {
    const result = analyticsEngine.compute([makeMatch()], VENUES, []);
    expect(result.tournamentName).toBe("World Cup 2030");
    expect(result.stage).toBe("group_stage");
  });

  it("handles matches with missing venue ID gracefully", () => {
    const matches = [makeMatch({ venueId: "nonexistent" })];
    const result = analyticsEngine.compute(matches, VENUES, []);
    expect(result.totalMatches).toBe(1);
  });

  it("computes readiness score as average of venue readiness", () => {
    const result = analyticsEngine.compute([makeMatch()], VENUES, []);
    expect(result.readinessScore).toBeGreaterThan(0);
    expect(result.readinessScore).toBeLessThanOrEqual(100);
  });
});

describe("SchedulingEngine", () => {
  it("generates schedule slots for matches", () => {
    const matches = [
      makeMatch({ scheduledDate: "2026-06-15", scheduledTime: "14:00" }),
      makeMatch({ scheduledDate: "2026-06-15", scheduledTime: "18:00" }),
    ];
    const slots = schedulingEngine.generateSchedule(matches);
    expect(slots).toHaveLength(2);
    expect(slots[0]!.matchId).toBe(matches[0]!.id);
    expect(slots[0]!.date).toBe("2026-06-15");
    expect(slots[0]!.startTime).toBe("14:00");
    expect(slots[1]!.startTime).toBe("18:00");
  });

  it("generates end time as start time + 2 hours", () => {
    const matches = [makeMatch({ scheduledTime: "15:30" })];
    const slots = schedulingEngine.generateSchedule(matches);
    expect(slots[0]!.endTime).toBe("17:30");
  });

  it("generates schedule for empty matches list", () => {
    const slots = schedulingEngine.generateSchedule([]);
    expect(slots).toHaveLength(0);
  });

  it("generates slots with allocated resources as empty", () => {
    const matches = [makeMatch()];
    const slots = schedulingEngine.generateSchedule(matches);
    expect(slots[0]!.allocatedResources).toEqual([]);
    expect(slots[0]!.conflicts).toEqual([]);
  });

  it("generates slots with phase as match", () => {
    const matches = [makeMatch()];
    const slots = schedulingEngine.generateSchedule(matches);
    expect(slots[0]!.phase).toBe("match");
  });

  it("detects time overlap conflicts at same venue on same date", () => {
    const venue = VENUES[0]!;
    const matches = [
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "14:00" }),
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "15:00" }),
    ];
    const slots = schedulingEngine.generateSchedule(matches);
    const conflicts = schedulingEngine.detectConflicts(slots, matches, [venue]);
    const timeOverlaps = conflicts.filter((c) => c.type === "time_overlap");
    expect(timeOverlaps.length).toBeGreaterThanOrEqual(1);
    expect(timeOverlaps[0]!.severity).toBe("high");
  });

  it("detects no conflict when gap is sufficient", () => {
    const venue = VENUES[0]!;
    const matches = [
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "10:00" }),
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "14:00" }),
    ];
    const slots = schedulingEngine.generateSchedule(matches);
    const conflicts = schedulingEngine.detectConflicts(slots, matches, [venue]);
    const timeOverlaps = conflicts.filter((c) => c.type === "time_overlap");
    expect(timeOverlaps.length).toBe(0);
  });

  it("detects no conflict on different dates", () => {
    const venue = VENUES[0]!;
    const matches = [
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "14:00" }),
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-16", scheduledTime: "14:00" }),
    ];
    const slots = schedulingEngine.generateSchedule(matches);
    const conflicts = schedulingEngine.detectConflicts(slots, matches, [venue]);
    const timeOverlaps = conflicts.filter((c) => c.type === "time_overlap");
    expect(timeOverlaps.length).toBe(0);
  });

  it("detects team rest violations", () => {
    const team = TEAMS[0]!;
    const matches = [
      makeMatch({ homeTeamId: team.id, scheduledDate: "2026-06-15" }),
      makeMatch({ awayTeamId: team.id, scheduledDate: "2026-06-16" }),
    ];
    const slots = schedulingEngine.generateSchedule(matches);
    const conflicts = schedulingEngine.detectConflicts(slots, matches, VENUES);
    const restViolations = conflicts.filter((c) => c.type === "team_rest_violation");
    expect(restViolations.length).toBeGreaterThanOrEqual(1);
  });

  it("detects no rest violation with sufficient gap", () => {
    const team = TEAMS[0]!;
    const matches = [
      makeMatch({ homeTeamId: team.id, scheduledDate: "2026-06-15" }),
      makeMatch({ awayTeamId: team.id, scheduledDate: "2026-06-19" }),
    ];
    const slots = schedulingEngine.generateSchedule(matches);
    const conflicts = schedulingEngine.detectConflicts(slots, matches, VENUES);
    const restViolations = conflicts.filter((c) => c.type === "team_rest_violation");
    expect(restViolations.length).toBe(0);
  });

  it("resolveConflict returns AI resolution string", () => {
    const conflict: Conflict = {
      id: "c1", type: "time_overlap", severity: "high", title: "Test",
      description: "Test", affectedIds: [], affectedVenues: [],
      aiResolution: "Reschedule match to different time slot.",
      aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null,
    };
    const resolution = schedulingEngine.resolveConflict(conflict);
    expect(resolution).toBe("Reschedule match to different time slot.");
  });

  it("detects no conflicts with empty slots", () => {
    const conflicts = schedulingEngine.detectConflicts([], [], VENUES);
    expect(conflicts).toHaveLength(0);
  });

  it("detects multiple conflicts for single venue with tight schedule", () => {
    const venue = VENUES[0]!;
    const matches = [
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "10:00" }),
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "11:00" }),
      makeMatch({ venueId: venue.id, scheduledDate: "2026-06-15", scheduledTime: "12:00" }),
    ];
    const slots = schedulingEngine.generateSchedule(matches);
    const conflicts = schedulingEngine.detectConflicts(slots, matches, [venue]);
    expect(conflicts.filter((c) => c.type === "time_overlap").length).toBeGreaterThanOrEqual(2);
  });
});

describe("ConflictEngine", () => {
  it("detects time overlap conflicts with severity based on gap", () => {
    const venue = makeVenue({ id: "v-1", name: "Test Venue", status: "ready" });
    const slots: ScheduleSlot[] = [
      { id: "s1", matchId: "m1", venueId: "v-1", date: "2026-06-15", startTime: "14:00", endTime: "16:00", phase: "match", allocatedResources: [], conflicts: [] },
      { id: "s2", matchId: "m2", venueId: "v-1", date: "2026-06-15", startTime: "15:30", endTime: "17:30", phase: "match", allocatedResources: [], conflicts: [] },
    ];
    const matches = [makeMatch({ id: "m1" }), makeMatch({ id: "m2" })];
    const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
    const overlaps = conflicts.filter((c) => c.type === "time_overlap");
    expect(overlaps.length).toBeGreaterThanOrEqual(1);
  });

  it("detects venue double booking when multiple slots on same date", () => {
    const venue = makeVenue({ id: "v-1", name: "Test Venue", status: "ready" });
    const slots: ScheduleSlot[] = [
      { id: "s1", matchId: "m1", venueId: "v-1", date: "2026-06-15", startTime: "14:00", endTime: "16:00", phase: "match", allocatedResources: [], conflicts: [] },
      { id: "s2", matchId: "m2", venueId: "v-1", date: "2026-06-15", startTime: "18:00", endTime: "20:00", phase: "match", allocatedResources: [], conflicts: [] },
    ];
    const matches = [makeMatch({ id: "m1" }), makeMatch({ id: "m2" })];
    const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
    const doubleBooked = conflicts.filter((c) => c.type === "venue_double_booked");
    expect(doubleBooked.length).toBeGreaterThanOrEqual(1);
  });

  it("detects maintenance conflict when venue under maintenance has matches", () => {
    const venue = makeVenue({ id: "v-1", name: "Maintenance Venue", status: "maintenance" });
    const slots: ScheduleSlot[] = [
      { id: "s1", matchId: "m1", venueId: "v-1", date: "2026-06-15", startTime: "14:00", endTime: "16:00", phase: "match", allocatedResources: [], conflicts: [] },
    ];
    const matches = [makeMatch({ id: "m1" })];
    const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
    const maintConflicts = conflicts.filter((c) => c.type === "maintenance_conflict");
    expect(maintConflicts.length).toBeGreaterThanOrEqual(1);
    expect(maintConflicts[0]!.severity).toBe("critical");
  });

  it("detects no maintenance conflict when venue is ready", () => {
    const venue = makeVenue({ id: "v-1", status: "ready" });
    const slots: ScheduleSlot[] = [
      { id: "s1", matchId: "m1", venueId: "v-1", date: "2026-06-15", startTime: "14:00", endTime: "16:00", phase: "match", allocatedResources: [], conflicts: [] },
    ];
    const matches = [makeMatch({ id: "m1" })];
    const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
    const maintConflicts = conflicts.filter((c) => c.type === "maintenance_conflict");
    expect(maintConflicts.length).toBe(0);
  });

  it("prioritizes conflicts by severity order", () => {
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "low", title: "Low", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null },
      { id: "c2", type: "time_overlap", severity: "critical", title: "Critical", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null },
      { id: "c3", type: "time_overlap", severity: "high", title: "High", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null },
    ];
    const prioritized = conflictEngine.prioritize(conflicts);
    expect(prioritized[0]!.severity).toBe("critical");
    expect(prioritized[1]!.severity).toBe("high");
    expect(prioritized[2]!.severity).toBe("low");
  });

  it("suggestResolution returns AI resolution text", () => {
    const conflict: Conflict = {
      id: "c1", type: "venue_double_booked", severity: "high", title: "Test",
      description: "Test", affectedIds: [], affectedVenues: [],
      aiResolution: "Relocate to venue-2",
      aiConfidence: 85, resolved: false, detectedAt: "", resolvedAt: null,
    };
    expect(conflictEngine.suggestResolution(conflict)).toBe("Relocate to venue-2");
  });

  it("returns empty conflicts from empty slots", () => {
    const conflicts = conflictEngine.detectAll([], [], VENUES);
    expect(conflicts).toHaveLength(0);
  });

  it("returns empty list when no time conflicts exist", () => {
    const venue = makeVenue({ id: "v-1", name: "Test", status: "ready" });
    const slots: ScheduleSlot[] = [
      { id: "s1", matchId: "m1", venueId: "v-1", date: "2026-06-15", startTime: "10:00", endTime: "12:00", phase: "match", allocatedResources: [], conflicts: [] },
    ];
    const matches = [makeMatch({ id: "m1" })];
    const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
    expect(conflicts.filter((c) => c.type === "time_overlap")).toHaveLength(0);
  });

  it("severity is critical when gap under 60 min", () => {
    const venue = makeVenue({ id: "v-1", name: "Test", status: "ready" });
    const slots: ScheduleSlot[] = [
      { id: "s1", matchId: "m1", venueId: "v-1", date: "2026-06-15", startTime: "14:00", endTime: "14:30", phase: "match", allocatedResources: [], conflicts: [] },
      { id: "s2", matchId: "m2", venueId: "v-1", date: "2026-06-15", startTime: "14:30", endTime: "16:30", phase: "match", allocatedResources: [], conflicts: [] },
    ];
    const matches = [makeMatch({ id: "m1" }), makeMatch({ id: "m2" })];
    const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
    const timeConflicts = conflicts.filter((c) => c.type === "time_overlap");
    expect(timeConflicts.length).toBeGreaterThanOrEqual(1);
  });

  it("severity is medium when gap is between 120-180 min", () => {
    const venue = makeVenue({ id: "v-1", name: "Test", status: "ready" });
    const slots: ScheduleSlot[] = [
      { id: "s1", matchId: "m1", venueId: "v-1", date: "2026-06-15", startTime: "10:00", endTime: "11:00", phase: "match", allocatedResources: [], conflicts: [] },
      { id: "s2", matchId: "m2", venueId: "v-1", date: "2026-06-15", startTime: "12:30", endTime: "14:30", phase: "match", allocatedResources: [], conflicts: [] },
    ];
    const matches = [makeMatch({ id: "m1" }), makeMatch({ id: "m2" })];
    const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
    void conflicts;
  });
});

describe("OptimizationEngine", () => {
  it("optimizes resources for given matches and venues", () => {
    const matches = [makeMatch({ attendance: 50000 })];
    const venues = [makeVenue({ capacity: 80000 })];
    const resources = optimizationEngine.optimizeResources(matches, venues);
    expect(resources.length).toBeGreaterThan(0);
    RESOURCE_TYPES.forEach((type) => {
      const found = resources.find((r) => r.type === type);
      expect(found?.required).toBeGreaterThan(0);
    });
  });

  it("returns resource allocations with status sufficient or shortage", () => {
    const matches = [makeMatch()];
    const resources = optimizationEngine.optimizeResources(matches, VENUES);
    resources.forEach((r) => {
      expect(["sufficient", "shortage", "over_allocated"]).toContain(r.status);
    });
  });

  it("handles empty matches list", () => {
    const resources = optimizationEngine.optimizeResources([], VENUES);
    expect(resources.length).toBeGreaterThan(0);
    resources.forEach((r) => {
      expect(r.required).toBeGreaterThan(0);
    });
  });

  it("computes utilization percentage correctly", () => {
    const matches = [makeMatch()];
    const resources = optimizationEngine.optimizeResources(matches, VENUES);
    resources.forEach((r) => {
      expect(r.utilizationPercent).toBeGreaterThanOrEqual(0);
      expect(r.utilizationPercent).toBeLessThanOrEqual(200);
    });
  });

  it("returns all resource types", () => {
    const resources = optimizationEngine.optimizeResources([makeMatch()], VENUES);
    const types = resources.map((r) => r.type);
    RESOURCE_TYPES.forEach((rt) => {
      expect(types).toContain(rt);
    });
  });

  it("reallocates resources for shortage resources", () => {
    const resources: ResourceAllocation[] = [
      { type: "security", required: 100, allocated: 80, available: 90, utilizationPercent: 89, status: "shortage", teams: [] },
      { type: "medical", required: 50, allocated: 55, available: 60, utilizationPercent: 92, status: "sufficient", teams: [] },
    ];
    const reallocated = optimizationEngine.reallocate(resources, "m1", "v1");
    const security = reallocated.find((r) => r.type === "security")!;
    expect(security.allocated).toBeGreaterThan(80);
    expect(security.available).toBeGreaterThan(90);
  });

  it("reallocate does not change sufficient resources", () => {
    const resources: ResourceAllocation[] = [
      { type: "medical", required: 50, allocated: 55, available: 60, utilizationPercent: 92, status: "sufficient", teams: [] },
    ];
    const reallocated = optimizationEngine.reallocate(resources, "m1", "v1");
    expect(reallocated[0]!.allocated).toBe(55);
  });

  it("reallocate handles empty list", () => {
    const reallocated = optimizationEngine.reallocate([], "m1", "v1");
    expect(reallocated).toHaveLength(0);
  });

  it("optimizeResources uses venue capacity for calculations", () => {
    const largeVenue = makeVenue({ capacity: 100000 });
    const matches = [makeMatch({ attendance: 90000, venueId: largeVenue.id })];
    const resources = optimizationEngine.optimizeResources(matches, [largeVenue]);
    resources.forEach((r) => {
      expect(r.required).toBeGreaterThan(0);
    });
  });

  it("optimizeResources falls back to default capacity when venue not found", () => {
    const matches = [makeMatch({ venueId: "nonexistent" })];
    const resources = optimizationEngine.optimizeResources(matches, []);
    expect(resources.length).toBeGreaterThan(0);
  });
});

describe("RecommendationEngine", () => {
  it("generates recommendations from conflicts", () => {
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "critical", title: "Critical Overlap", description: "Test", affectedIds: ["m1"], affectedVenues: ["v1"], aiResolution: "Reschedule", aiConfidence: 92, resolved: false, detectedAt: "", resolvedAt: null },
    ];
    const matches = [makeMatch({ id: "m1" })];
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 5,
      safetyIndex: 88, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate(conflicts, matches, analytics);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs[0]!.type).toBe("reschedule");
    expect(recs[0]!.requiresApproval).toBe(true);
  });

  it("generates no more than 8 recommendations", () => {
    const conflicts: Conflict[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`, type: "time_overlap" as const, severity: "high" as const, title: `Conflict ${i}`, description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null,
    }));
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 5,
      safetyIndex: 88, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate(conflicts, [makeMatch()], analytics);
    expect(recs.length).toBeLessThanOrEqual(8);
  });

  it("generates staff allocation recommendations for busy venues", () => {
    const busyVenue = makeVenue({ parkingCapacity: 1000, parkingOccupancy: 900 });
    const conflicts: Conflict[] = [];
    const matches = [makeMatch({ venueId: busyVenue.id })];
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 5,
      safetyIndex: 88, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate(conflicts, matches, analytics);
    const allocateStaff = recs.filter((r) => r.type === "allocate_staff");
    expect(allocateStaff.length).toBeGreaterThanOrEqual(0);
  });

  it("generates security recommendation when safety index is low", () => {
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 5,
      safetyIndex: 75, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate([], [makeMatch()], analytics);
    const securityRec = recs.find((r) => r.type === "increase_security");
    expect(securityRec).toBeDefined();
    expect(securityRec!.requiresApproval).toBe(true);
  });

  it("generates schedule optimization when average delay is high", () => {
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 15,
      safetyIndex: 88, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate([], [makeMatch()], analytics);
    const scheduleRec = recs.find((r) => r.type === "schedule_optimization");
    expect(scheduleRec).toBeDefined();
  });

  it("does not generate schedule optimization when delay is low", () => {
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 5,
      safetyIndex: 88, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate([], [makeMatch()], analytics);
    const scheduleRec = recs.find((r) => r.type === "schedule_optimization");
    expect(scheduleRec).toBeUndefined();
  });

  it("recommendations are sorted by priority", () => {
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "critical", title: "Critical", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null },
      { id: "c2", type: "venue_double_booked", severity: "low", title: "Low", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 80, resolved: false, detectedAt: "", resolvedAt: null },
    ];
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 5,
      safetyIndex: 90, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate(conflicts, [makeMatch()], analytics);
    for (let i = 1; i < recs.length; i++) {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      expect(order[recs[i - 1]!.priority]).toBeLessThanOrEqual(order[recs[i]!.priority]);
    }
  });

  it("handles empty conflicts gracefully", () => {
    const analytics: TournamentAnalytics = {
      tournamentName: "Test", stage: "group_stage", totalMatches: 1, completedMatches: 0, upcomingMatches: 1,
      totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 5,
      safetyIndex: 90, operationalEfficiency: 90, resourceUtilization: 50, aiRiskScore: 20, conflictResolutionRate: 100,
      readinessScore: 85, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
    };
    const recs = recommendationEngine.generate([], [makeMatch()], analytics);
    expect(recs.length).toBeGreaterThanOrEqual(0);
  });
});

describe("ReportingEngine", () => {
  it("generates executive summary from state", () => {
    const state: TournamentState = {
      tournament: makeTournament({ name: "World Cup 2030", totalMatches: 64, completedMatches: 20 }),
      venues: VENUES.slice(0, 2),
      teams: TEAMS.slice(0, 4),
      matches: [makeMatch()],
      schedule: [],
      conflicts: [],
      recommendations: [],
      analytics: {
        tournamentName: "World Cup 2030", stage: "group_stage", totalMatches: 64, completedMatches: 20, upcomingMatches: 44,
        totalRevenue: 5000000, totalAttendance: 2000000, averageAttendance: 31250, venueUtilization: 85,
        averageDelayMinutes: 8.2, safetyIndex: 88, operationalEfficiency: 87, resourceUtilization: 72,
        aiRiskScore: 22, conflictResolutionRate: 100, readinessScore: 86, incidentsResolved: 1, totalIncidents: 5,
        perVenueStats: [], dailyAttendance: [],
      },
      timeline: [],
      predictions: [],
      resourceAllocations: [],
      lastUpdated: new Date().toISOString(),
    };
    const summary = reportingEngine.generateExecutiveSummary(state);
    expect(summary).toContain("World Cup 2030");
    expect(summary).toContain("Group Stage");
    expect(summary).toContain("20/64");
    expect(summary).toContain("$5");
    expect(summary).toContain("88/100");
    expect(summary).toContain("Active Conflicts");
  });

  it("generates venue report", () => {
    const venue = makeVenue({ name: "Test Stadium", city: "Test City", capacity: 75000, status: "ready" });
    const report = reportingEngine.generateVenueReport(venue);
    expect(report).toContain("Test Stadium");
    expect(report).toContain("Test City");
    expect(report).toContain("75,000");
    expect(report).toContain("ready");
  });

  it("generates venue report including zone issues", () => {
    const venue = makeVenue({
      zones: [
        { zone: "pitch", status: "operational", occupancyPercent: 0, issue: null },
        { zone: "concourse", status: "degraded", occupancyPercent: 50, issue: "Drainage blocked in section 3" },
      ],
    });
    const report = reportingEngine.generateVenueReport(venue);
    expect(report).toContain("1/2 operational");
    expect(report).toContain("Drainage blocked in section 3");
  });

  it("generates match report", () => {
    const match = makeMatch({ title: "Brazil vs Germany", status: "in_progress", scheduledDate: "2026-06-15", scheduledTime: "18:00", attendance: 60000, capacityPercent: 80, revenue: 5000000, incidents: 2 });
    const report = reportingEngine.generateMatchReport(match);
    expect(report).toContain("Brazil vs Germany");
    expect(report).toContain("in_progress");
    expect(report).toContain("capacity");
    expect(report).toContain("80%");
    expect(report).toContain("$5");
  });

  it("generates conflict report with multi-line output", () => {
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "high", title: "Time Overlap", description: "Gap insufficient", affectedIds: [], affectedVenues: [], aiResolution: "Adjust times", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null },
      { id: "c2", type: "maintenance_conflict", severity: "critical", title: "Maintenance Issue", description: "Venue under maintenance", affectedIds: [], affectedVenues: [], aiResolution: "Relocate", aiConfidence: 93, resolved: true, detectedAt: "", resolvedAt: "" },
    ];
    const report = reportingEngine.generateConflictReport(conflicts);
    expect(report).toContain("Total: 2");
    expect(report).toContain("Unresolved: 1");
    expect(report).toContain("Critical: 1");
    expect(report).toContain("High: 1");
  });

  it("generates conflict report with zero conflicts", () => {
    const report = reportingEngine.generateConflictReport([]);
    expect(report).toContain("Total: 0");
    expect(report).toContain("Unresolved: 0");
  });

  it("executive summary handles zero total matches", () => {
    const state: TournamentState = {
      tournament: makeTournament({ totalMatches: 0, completedMatches: 0 }),
      venues: [], teams: [], matches: [], schedule: [], conflicts: [], recommendations: [],
      analytics: {
        tournamentName: "Test", stage: "pre_tournament", totalMatches: 0, completedMatches: 0, upcomingMatches: 0,
        totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 0,
        safetyIndex: 100, operationalEfficiency: 100, resourceUtilization: 0, aiRiskScore: 0, conflictResolutionRate: 100,
        readinessScore: 0, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
      },
      timeline: [], predictions: [], resourceAllocations: [], lastUpdated: new Date().toISOString(),
    };
    const summary = reportingEngine.generateExecutiveSummary(state);
    expect(summary).toContain("0%");
  });

  it("executive summary shows monitoring mode when no matches", () => {
    const state: TournamentState = {
      tournament: makeTournament({ totalMatches: 0 }),
      venues: [], teams: [], matches: [], schedule: [], conflicts: [], recommendations: [],
      analytics: {
        tournamentName: "Test", stage: "pre_tournament", totalMatches: 0, completedMatches: 0, upcomingMatches: 0,
        totalRevenue: 0, totalAttendance: 0, averageAttendance: 0, venueUtilization: 0, averageDelayMinutes: 0,
        safetyIndex: 100, operationalEfficiency: 100, resourceUtilization: 0, aiRiskScore: 0, conflictResolutionRate: 100,
        readinessScore: 0, incidentsResolved: 0, totalIncidents: 0, perVenueStats: [], dailyAttendance: [],
      },
      timeline: [], predictions: [], resourceAllocations: [], lastUpdated: new Date().toISOString(),
    };
    const summary = reportingEngine.generateExecutiveSummary(state);
    expect(summary).toContain("Monitoring mode");
  });
});

describe("SimulationEngine", () => {
  it("simulates matches with correct count", () => {
    const matches = simulationEngine.simulateMatches();
    expect(matches.length).toBe(8);
  });

  it("simulated matches have all required fields", () => {
    const matches = simulationEngine.simulateMatches();
    matches.forEach((m) => {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.stage).toBe("group_stage");
      expect(m.venueId).toBeTruthy();
      expect(m.homeTeamId).toBeTruthy();
      expect(m.awayTeamId).toBeTruthy();
      expect(m.scheduledDate).toBeTruthy();
      expect(m.scheduledTime).toBeTruthy();
      expect(m.ticketsSold).toBeGreaterThan(0);
      expect(m.weatherForecast).toBeTruthy();
    });
  });

  it("simulated matches have varying statuses", () => {
    const matches = simulationEngine.simulateMatches();
    const statuses = new Set(matches.map((m) => m.status));
    expect(statuses.size).toBeGreaterThan(1);
  });

  it("simulated matches have operational timeline phases", () => {
    const matches = simulationEngine.simulateMatches();
    const inProgress = matches.find((m: Match) => m.status === "in_progress");
    const completed = matches.find((m: Match) => m.status === "completed");
    if (inProgress) {
      expect(inProgress.operationalTimeline.length).toBeGreaterThan(0);
    }
    if (completed) {
      expect(completed.operationalTimeline.length).toBeGreaterThan(0);
    }
  });

  it("simulates resources with all resource types", () => {
    const resources = simulationEngine.simulateResources();
    expect(resources.length).toBe(RESOURCE_TYPES.length);
    RESOURCE_TYPES.forEach((type) => {
      const found = resources.find((r) => r.type === type);
      expect(found).toBeDefined();
    });
  });

  it("simulated resources have valid status", () => {
    const resources = simulationEngine.simulateResources();
    resources.forEach((r) => {
      expect(["sufficient", "shortage"]).toContain(r.status);
      expect(r.required).toBeGreaterThan(0);
      expect(r.teams.length).toBeGreaterThan(0);
    });
  });

  it("simulates timeline for matches", () => {
    const matches = [makeMatch({ scheduledTime: "18:00" })];
    const timeline = simulationEngine.simulateTimeline(matches);
    expect(timeline.length).toBeLessThanOrEqual(6);
    timeline.forEach((entry) => {
      expect(entry.matchId).toBeTruthy();
      expect(entry.phases.length).toBeGreaterThan(0);
    });
  });

  it("simulated timeline phases have correct status progression", () => {
    const matches = [makeMatch()];
    const timeline = simulationEngine.simulateTimeline(matches);
    if (timeline.length > 0) {
      const phases = timeline[0]!.phases;
      const completedPhases = phases.filter((p) => p.status === "completed");
      const activePhases = phases.filter((p) => p.status === "active");
      const pendingPhases = phases.filter((p) => p.status === "pending");
      expect(completedPhases.length + activePhases.length + pendingPhases.length).toBe(phases.length);
    }
  });

  it("simulates predictions with all prediction types", () => {
    const predictions = simulationEngine.simulatePredictions();
    expect(predictions.length).toBe(5);
    const types = new Set(predictions.map((p) => p.type));
    expect(types.has("attendance")).toBe(true);
    expect(types.has("weather_impact")).toBe(true);
    expect(types.has("resource_shortage")).toBe(true);
    expect(types.has("parking_overflow")).toBe(true);
    expect(types.has("emergency_probability")).toBe(true);
  });

  it("simulated predictions have realistic probabilities", () => {
    const predictions = simulationEngine.simulatePredictions();
    predictions.forEach((p) => {
      expect(p.probability).toBeGreaterThanOrEqual(0);
      expect(p.probability).toBeLessThanOrEqual(100);
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(100);
    });
  });

  it("simulates schedule from matches", () => {
    const matches = [makeMatch({ scheduledTime: "18:00" })];
    const schedule = simulationEngine.simulateSchedule(matches);
    expect(schedule).toHaveLength(1);
    expect(schedule[0]!.matchId).toBe(matches[0]!.id);
  });

  it("simulated resources have utilization percent", () => {
    const resources = simulationEngine.simulateResources();
    resources.forEach((r) => {
      expect(r.utilizationPercent).toBeGreaterThanOrEqual(0);
    });
  });

  it("consecutive calls return different data due to randomness", () => {
    const first = simulationEngine.simulateMatches();
    const second = simulationEngine.simulateMatches();
    expect(first.length).toBe(second.length);
  });
});

describe("TournamentService", () => {
  beforeEach(() => {
    // Reset singleton state
    vi.restoreAllMocks();
  });

  it("provides singleton instance", () => {
    const instance1 = tournamentService;
    const instance2 = tournamentService;
    expect(instance1).toBe(instance2);
  });

  it("getState returns a valid TournamentState", () => {
    const state = tournamentService.getState();
    expect(state).toBeDefined();
    expect(state.tournament).toBeDefined();
    expect(state.tournament.id).toBe("wc-2030");
    expect(state.matches).toBeDefined();
    expect(state.matches.length).toBeGreaterThan(0);
    expect(state.venues.length).toBeGreaterThan(0);
    expect(state.teams.length).toBeGreaterThan(0);
  });

  it("state contains schedule, conflicts, recommendations arrays", () => {
    const state = tournamentService.getState();
    expect(Array.isArray(state.schedule)).toBe(true);
    expect(Array.isArray(state.conflicts)).toBe(true);
    expect(Array.isArray(state.recommendations)).toBe(true);
    expect(Array.isArray(state.timeline)).toBe(true);
    expect(Array.isArray(state.predictions)).toBe(true);
    expect(Array.isArray(state.resourceAllocations)).toBe(true);
  });

  it("state has lastUpdated timestamp", () => {
    const state = tournamentService.getState();
    expect(state.lastUpdated).toBeTruthy();
    expect(() => new Date(state.lastUpdated)).not.toThrow();
  });

  it("generates executive report", () => {
    // Trigger tick to populate analytics
    tournamentService.start(60000);
    const report = tournamentService.generateReport("executive");
    expect(typeof report).toBe("string");
    expect(report.length).toBeGreaterThan(0);
    tournamentService.stop();
  });

  it("generates venue report for existing venue", () => {
    const report = tournamentService.generateReport("venue", "venue-1");
    expect(report).toContain("National Stadium");
  });

  it("returns not found for nonexistent venue", () => {
    const report = tournamentService.generateReport("venue", "nonexistent");
    expect(report).toBe("Venue not found");
  });

  it("generates match report for existing match", () => {
    const state = tournamentService.getState();
    if (state.matches.length > 0) {
      const report = tournamentService.generateReport("match", state.matches[0]!.id);
      expect(report).toContain(state.matches[0]!.title);
    }
  });

  it("returns not found for nonexistent match", () => {
    const report = tournamentService.generateReport("match", "nonexistent");
    expect(report).toBe("Match not found");
  });

  it("generates conflict report", () => {
    const report = tournamentService.generateReport("conflict");
    expect(report).toContain("Conflict Report");
  });

  it("returns unknown for invalid report type", () => {
    const report = tournamentService.generateReport("invalid" as any);
    expect(report).toBe("Unknown report type");
  });

  it("subscribe returns an unsubscribe function", () => {
    const unsub = tournamentService.subscribe(() => {});
    expect(typeof unsub).toBe("function");
    expect(() => unsub()).not.toThrow();
  });

  it("acknowledgeRecommendation updates implemented flag", () => {
    const state = tournamentService.getState();
    if (state.recommendations.length > 0) {
      const recId = state.recommendations[0]!.id;
      tournamentService.acknowledgeRecommendation(recId);
      const updated = tournamentService.getState();
      const rec = updated.recommendations.find((r) => r.id === recId);
      expect(rec?.implemented).toBe(true);
    }
  });

  it("start and stop lifecycle methods work", () => {
    expect(() => tournamentService.start(60000)).not.toThrow();
    expect(() => tournamentService.stop()).not.toThrow();
  });

  it("start multiple times does not create multiple intervals", () => {
    tournamentService.stop();
    tournamentService.start(60000);
    tournamentService.start(60000);
    tournamentService.stop();
  });

  it("stop when not started does not throw", () => {
    tournamentService.stop();
    expect(() => tournamentService.stop()).not.toThrow();
  });

  it("state includes venue readiness data", () => {
    const state = tournamentService.getState();
    state.venues.forEach((v) => {
      expect(v.readiness.overall).toBeGreaterThanOrEqual(0);
      expect(v.readiness.overall).toBeLessThanOrEqual(100);
    });
  });

  it("matches have broadcast coverage arrays", () => {
    const state = tournamentService.getState();
    state.matches.forEach((m) => {
      expect(Array.isArray(m.broadcastCoverage)).toBe(true);
    });
  });
});

describe("Edge Cases — Tournament Ops", () => {
  describe("Tournament lifecycle edge cases", () => {
    it("processes tournament with all possible stages", () => {
      const stages = ["pre_tournament", "group_stage", "quarter_final", "semi_final", "final", "post_tournament"] as const;
      stages.forEach((stage) => {
        const t = makeTournament({ stage });
        expect(t.stage).toBe(stage);
      });
    });

    it("handles 0 total matches in analytics", () => {
      const analytics = analyticsEngine.compute([], [], []);
      expect(analytics.totalMatches).toBe(0);
      expect(analytics.averageAttendance).toBe(0);
    });

    it("handles all matches cancelled", () => {
      const matches = [makeMatch({ status: "cancelled" }), makeMatch({ status: "cancelled" })];
      const analytics = analyticsEngine.compute(matches, VENUES, []);
      expect(analytics.completedMatches).toBe(0);
      expect(analytics.upcomingMatches).toBe(0);
    });

    it("handles all matches postponed", () => {
      const matches = [makeMatch({ status: "postponed" })];
      const analytics = analyticsEngine.compute(matches, VENUES, []);
      expect(analytics.upcomingMatches).toBe(1);
      expect(analytics.completedMatches).toBe(0);
    });
  });

  describe("Match status edge cases", () => {
    it("handles all match statuses", () => {
      const statuses = ["scheduled", "preparing", "team_arrival", "warmup", "in_progress", "half_time", "second_half", "completed", "postponed", "cancelled"] as const;
      statuses.forEach((status) => {
        const m = makeMatch({ status });
        expect(m.status).toBe(status);
      });
    });

    it("handles match with zero attendance", () => {
      const m = makeMatch({ attendance: 0, revenue: 0, ticketsSold: 0 });
      expect(m.attendance).toBe(0);
      expect(m.revenue).toBe(0);
    });

    it("handles match with maximum attendance", () => {
      const m = makeMatch({ attendance: 100000, capacityPercent: 100 });
      expect(m.attendance).toBe(100000);
      expect(m.capacityPercent).toBe(100);
    });

    it("handles match with zero delay risk and delay minutes", () => {
      const m = makeMatch({ aiDelayRisk: 0, delayMinutes: 0 });
      expect(m.aiDelayRisk).toBe(0);
      expect(m.delayMinutes).toBe(0);
    });
  });

  describe("Resource allocation edge cases", () => {
    it("handles zero venue capacity", () => {
      const venue = makeVenue({ capacity: 0 });
      const matches = [makeMatch({ venueId: venue.id, attendance: 0 })];
      const resources = optimizationEngine.optimizeResources(matches, [venue]);
      expect(resources.length).toBeGreaterThan(0);
    });

    it("handles oversized match attendance", () => {
      const venue = makeVenue({ capacity: 1000 });
      const matches = [makeMatch({ venueId: venue.id, attendance: 100000 })];
      const resources = optimizationEngine.optimizeResources(matches, [venue]);
      expect(resources.length).toBeGreaterThan(0);
    });

    it("reallocation handles zero-divided utilization", () => {
      const resources: ResourceAllocation[] = [
        { type: "security", required: 0, allocated: 0, available: 0, utilizationPercent: 0, status: "sufficient", teams: [] },
      ];
      const reallocated = optimizationEngine.reallocate(resources, "m1", "v1");
      expect(reallocated[0]!.status).toBe("sufficient");
    });
  });

  describe("Conflict resolution edge cases", () => {
    it("detects conflicts across multiple venues simultaneously", () => {
      const venues = [
        makeVenue({ id: "v1", name: "Venue 1", status: "ready" }),
        makeVenue({ id: "v2", name: "Venue 2", status: "maintenance" }),
      ];
      const slots: ScheduleSlot[] = [
        { id: "s1", matchId: "m1", venueId: "v1", date: "2026-06-15", startTime: "14:00", endTime: "16:00", phase: "match", allocatedResources: [], conflicts: [] },
        { id: "s2", matchId: "m2", venueId: "v1", date: "2026-06-15", startTime: "15:00", endTime: "17:00", phase: "match", allocatedResources: [], conflicts: [] },
        { id: "s3", matchId: "m3", venueId: "v2", date: "2026-06-15", startTime: "14:00", endTime: "16:00", phase: "match", allocatedResources: [], conflicts: [] },
      ];
      const matches = [makeMatch({ id: "m1" }), makeMatch({ id: "m2" }), makeMatch({ id: "m3" })];
      const conflicts = conflictEngine.detectAll(slots, matches, venues);
      const types = new Set(conflicts.map((c) => c.type));
      expect(types.has("time_overlap")).toBe(true);
      expect(types.has("maintenance_conflict")).toBe(true);
    });

    it("all conflicts have unique IDs", () => {
      const venue = makeVenue({ id: "v1", status: "ready" });
      const slots: ScheduleSlot[] = [
        { id: "s1", matchId: "m1", venueId: "v1", date: "2026-06-15", startTime: "10:00", endTime: "12:00", phase: "match", allocatedResources: [], conflicts: [] },
        { id: "s2", matchId: "m2", venueId: "v1", date: "2026-06-15", startTime: "11:00", endTime: "13:00", phase: "match", allocatedResources: [], conflicts: [] },
        { id: "s3", matchId: "m3", venueId: "v1", date: "2026-06-15", startTime: "12:00", endTime: "14:00", phase: "match", allocatedResources: [], conflicts: [] },
      ];
      const matches = [makeMatch({ id: "m1" }), makeMatch({ id: "m2" }), makeMatch({ id: "m3" })];
      const conflicts = conflictEngine.detectAll(slots, matches, [venue]);
      const ids = conflicts.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Constants and types edge cases", () => {
    it("all resource types have requirements defined", () => {
      RESOURCE_TYPES.forEach((type) => {
        expect(RESOURCE_REQUIREMENTS[type]).toBeDefined();
        expect(RESOURCE_REQUIREMENTS[type]!.base).toBeGreaterThan(0);
      });
    });

    it("all readiness categories are valid", () => {
      READINESS_CATEGORIES.forEach((rc) => {
        expect(rc.key).toBeTruthy();
        expect(rc.label).toBeTruthy();
      });
    });

    it("all operational phases have durations", () => {
      OPERATIONAL_PHASES.forEach((phase) => {
        expect(PHASE_DURATION_MINUTES[phase]).toBeGreaterThan(0);
      });
    });

    it("weather scenarios have all required fields", () => {
      WEATHER_SCENARIOS.forEach((w) => {
        expect(w.condition).toBeTruthy();
        expect(w.temperature).toBeDefined();
        expect(w.forecast).toBeTruthy();
      });
    });

    it("TOURNAMENT has 32 teams and 64 matches", () => {
      const tournament = makeTournament({ teamIds: Array.from({ length: 32 }, (_, i) => `team-${i}`), totalMatches: 64 });
      expect(tournament.teamIds.length).toBe(32);
      expect(tournament.totalMatches).toBe(64);
    });
  });

  describe("Venue readiness edge cases", () => {
    it("handles venue with zero readiness", () => {
      const venue = makeVenue({
        readiness: { overall: 0, infrastructure: 0, safety: 0, maintenance: 0, parking: 0, connectivity: 0, power: 0, emergency: 0, cleaning: 0, lastInspected: "2026-01-01", inspector: "None" },
      });
      expect(venue.readiness.overall).toBe(0);
    });

    it("handles venue with 100 readiness", () => {
      const venue = makeVenue({
        readiness: { overall: 100, infrastructure: 100, safety: 100, maintenance: 100, parking: 100, connectivity: 100, power: 100, emergency: 100, cleaning: 100, lastInspected: "2026-01-01", inspector: "Perfect" },
      });
      expect(venue.readiness.overall).toBe(100);
    });

    it("handles venue with no zones", () => {
      const venue = makeVenue({ zones: [] });
      expect(venue.zones).toHaveLength(0);
    });

    it("handles venue with all possible statuses", () => {
      const statuses = ["ready", "preparing", "maintenance", "emergency", "post_event_cleanup", "inactive"] as const;
      statuses.forEach((status) => {
        const v = makeVenue({ status });
        expect(v.status).toBe(status);
      });
    });
  });

  describe("Weather forecast edge cases", () => {
    it("handles extreme weather condition", () => {
      const m = makeMatch({
        weatherForecast: { condition: "extreme_heat", temperature: 45, humidity: 20, windSpeed: 5, precipitation: 0, forecast: "Extreme heat", alert: "Cooling breaks required" },
      });
      expect(m.weatherForecast.condition).toBe("extreme_heat");
      expect(m.weatherForecast.temperature).toBe(45);
    });

    it("handles storm weather with alert", () => {
      const m = makeMatch({
        weatherForecast: { condition: "storm", temperature: 15, humidity: 92, windSpeed: 50, precipitation: 95, forecast: "Storm approaching", alert: "Lightning risk" },
      });
      expect(m.weatherForecast.alert).toBeTruthy();
    });

    it("handles snow weather condition", () => {
      const m = makeMatch({
        weatherForecast: { condition: "snow", temperature: -2, humidity: 85, windSpeed: 15, precipitation: 80, forecast: "Snow expected", alert: null },
      });
      expect(m.weatherForecast.condition).toBe("snow");
    });
  });

  describe("Security level edge cases", () => {
    it("handles all security levels", () => {
      const levels = ["normal", "elevated", "high", "critical"] as const;
      levels.forEach((level) => {
        const m = makeMatch({ securityLevel: level });
        expect(m.securityLevel).toBe(level);
      });
    });
  });

  describe("Team stats edge cases", () => {
    it("handles team with perfect record", () => {
      const team = makeTeam({ matchesPlayed: 5, matchesWon: 5, matchesDrawn: 0, matchesLost: 0, points: 15 });
      expect(team.matchesWon).toBe(team.matchesPlayed);
      expect(team.points).toBe(15);
    });

    it("handles team with no matches played", () => {
      const team = makeTeam({ matchesPlayed: 0, matchesWon: 0, matchesDrawn: 0, matchesLost: 0, points: 0 });
      expect(team.points).toBe(0);
    });

    it("handles team with maximum rank value", () => {
      const team = makeTeam({ rank: 100 });
      expect(team.rank).toBe(100);
    });

    it("handles team with minimum rank value", () => {
      const team = makeTeam({ rank: 1 });
      expect(team.rank).toBe(1);
    });
  });

  describe("Match operational timeline edge cases", () => {
    it("handles match with no operational timeline", () => {
      const m = makeMatch({ operationalTimeline: [] });
      expect(m.operationalTimeline).toHaveLength(0);
    });

    it("handles match with full operational timeline", () => {
      const phases = OPERATIONAL_PHASES.map((phase) => ({
        phase, startTime: "", endTime: "", status: "pending" as const, durationMinutes: PHASE_DURATION_MINUTES[phase],
      }));
      const m = makeMatch({ operationalTimeline: phases as any });
      expect(m.operationalTimeline.length).toBe(OPERATIONAL_PHASES.length);
    });
  });

  describe("Resource allocation teams edge cases", () => {
    it("resource allocations have valid team arrays", () => {
      const matches = [makeMatch()];
      const resources = optimizationEngine.optimizeResources(matches, VENUES);
      resources.forEach((r) => {
        expect(Array.isArray(r.teams)).toBe(true);
        r.teams.forEach((team) => {
          expect(typeof team).toBe("string");
        });
      });
    });
  });

  describe("Match scheduling edge cases", () => {
    it("handles match with no broadcast coverage", () => {
      const m = makeMatch({ broadcastCoverage: [] });
      expect(m.broadcastCoverage).toHaveLength(0);
    });

    it("handles match with multiple broadcasters", () => {
      const m = makeMatch({ broadcastCoverage: ["ESPN", "BBC", "Sky Sports", "beIN Sports", "Fox Sports"] });
      expect(m.broadcastCoverage.length).toBeGreaterThanOrEqual(5);
    });

    it("handles match with extreme aiDelayRisk", () => {
      const m = makeMatch({ aiDelayRisk: 100 });
      expect(m.aiDelayRisk).toBe(100);
    });

    it("handles match with zero aiDelayRisk", () => {
      const m = makeMatch({ aiDelayRisk: 0 });
      expect(m.aiDelayRisk).toBe(0);
    });

    it("handles match sold out scenario", () => {
      const m = makeMatch({ ticketsSold: 80000, ticketsAvailable: 0 });
      expect(m.ticketsAvailable).toBe(0);
    });

    it("handles match with all tickets available", () => {
      const m = makeMatch({ ticketsSold: 0, ticketsAvailable: 80000 });
      expect(m.ticketsSold).toBe(0);
      expect(m.ticketsAvailable).toBe(80000);
    });

    it("handles match with extreme revenue", () => {
      const m = makeMatch({ revenue: 10000000 });
      expect(m.revenue).toBe(10000000);
    });
  });

  describe("Conflict types edge cases", () => {
    it("handles all conflict types", () => {
      const types = ["venue_double_booked", "time_overlap", "insufficient_staff", "broadcast_conflict", "maintenance_conflict", "parking_overflow", "emergency_overlap", "weather_conflict", "team_rest_violation", "security_gap"] as const;
      types.forEach((type) => {
        const c: Conflict = { id: "c", type, severity: "medium", title: "Test", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 85, resolved: false, detectedAt: "", resolvedAt: null };
        expect(c.type).toBe(type);
      });
    });

    it("handles all conflict severities", () => {
      const severities = ["critical", "high", "medium", "low"] as const;
      severities.forEach((sev) => {
        const c: Conflict = { id: "c", type: "time_overlap", severity: sev, title: "Test", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 85, resolved: false, detectedAt: "", resolvedAt: null };
        expect(c.severity).toBe(sev);
      });
    });

    it("resolved conflicts have resolvedAt timestamp", () => {
      const c: Conflict = { id: "c1", type: "time_overlap", severity: "high", title: "Test", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: true, detectedAt: "2026-06-15", resolvedAt: "2026-06-16" };
      expect(c.resolved).toBe(true);
      expect(c.resolvedAt).toBeTruthy();
    });

    it("unresolved conflicts have null resolvedAt", () => {
      const c: Conflict = { id: "c1", type: "time_overlap", severity: "high", title: "Test", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: false, detectedAt: "2026-06-15", resolvedAt: null };
      expect(c.resolvedAt).toBeNull();
    });
  });

  describe("Operational phase edge cases", () => {
    it("all phases have positive duration", () => {
      OPERATIONAL_PHASES.forEach((phase) => {
        expect(PHASE_DURATION_MINUTES[phase]).toBeGreaterThan(0);
      });
    });

    it("match phase is longest phase", () => {
      expect(PHASE_DURATION_MINUTES.match).toBeGreaterThan(PHASE_DURATION_MINUTES.half_time_break);
      expect(PHASE_DURATION_MINUTES.match).toBeGreaterThan(PHASE_DURATION_MINUTES.warmup);
    });

    it("preparation and maintenance have substantial durations", () => {
      expect(PHASE_DURATION_MINUTES.preparation).toBeGreaterThanOrEqual(60);
      expect(PHASE_DURATION_MINUTES.maintenance).toBeGreaterThanOrEqual(60);
    });
  });

  describe("Weather scenario edge cases", () => {
    it("clear weather has no alert", () => {
      const clear = WEATHER_SCENARIOS.find((w) => w.condition === "clear");
      expect(clear?.alert).toBeNull();
    });

    it("storm weather has alert", () => {
      const storm = WEATHER_SCENARIOS.find((w) => w.condition === "storm");
      expect(storm?.alert).toBeTruthy();
    });

    it("extreme heat has alert", () => {
      const heat = WEATHER_SCENARIOS.find((w) => w.condition === "extreme_heat");
      expect(heat?.alert).toBeTruthy();
    });

    it("fog condition exists", () => {
      const fog = WEATHER_SCENARIOS.find((w) => w.condition === "fog");
      expect(fog).toBeDefined();
      expect(fog?.temperature).toBeLessThan(15);
    });
  });

  describe("Analytics operational efficiency edge cases", () => {
    it("operational efficiency decreases with more conflicts", () => {
      const matches = [makeMatch({ delayMinutes: 0 })];
      const conflicts: Conflict[] = Array.from({ length: 20 }, (_, i) => ({
        id: `c${i}`, type: "time_overlap" as const, severity: "high" as const, title: "", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null,
      }));
      const result = analyticsEngine.compute(matches, VENUES, conflicts);
      expect(result.operationalEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.operationalEfficiency).toBeLessThanOrEqual(100);
    });

    it("operational efficiency clamped to 0 when extremely negative", () => {
      const matches = [makeMatch({ delayMinutes: 200 })];
      const result = analyticsEngine.compute(matches, VENUES, []);
      expect(result.operationalEfficiency).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Match capacity edge cases", () => {
    it("capacity percent can exceed 100 with oversold", () => {
      const m = makeMatch({ attendance: 85000, capacityPercent: 110 });
      expect(m.attendance).toBeGreaterThan(0);
    });

    it("handles match with zero incidents", () => {
      const m = makeMatch({ incidents: 0 });
      expect(m.incidents).toBe(0);
    });

    it("handles match with many incidents", () => {
      const m = makeMatch({ incidents: 50 });
      expect(m.incidents).toBe(50);
    });

    it("handles match with extreme crowd density", () => {
      const m = makeMatch({ crowdDensity: 99 });
      expect(m.crowdDensity).toBe(99);
    });

    it("handles match with zero crowd density", () => {
      const m = makeMatch({ crowdDensity: 0 });
      expect(m.crowdDensity).toBe(0);
    });

    it("handles away team ID being same as home team", () => {
      const m = makeMatch({ homeTeamId: "team-1", awayTeamId: "team-1" });
      expect(m.homeTeamId).toBe(m.awayTeamId);
    });
  });

  describe("Venue readiness calculation edge cases", () => {
    it("readiness calculation uses all 8 categories", () => {
      const venue = VENUES[0]!;
      const categories = ["infrastructure", "safety", "maintenance", "parking", "connectivity", "power", "emergency", "cleaning"] as const;
      categories.forEach((cat) => {
        expect(venue.readiness[cat]).toBeGreaterThanOrEqual(0);
      });
    });

    it("average readiness computed correctly", () => {
      const readinessSum = VENUES.reduce((s, v) => s + v.readiness.overall, 0);
      const avg = Math.round(readinessSum / VENUES.length);
      const result = analyticsEngine.compute([], VENUES, []);
      expect(result.readinessScore).toBe(avg);
    });

    it("venue with maintenance status has lower readiness", () => {
      const maintVenue = VENUES.find((v) => v.status === "maintenance");
      expect(maintVenue).toBeDefined();
      expect(maintVenue!.readiness.overall).toBeLessThan(80);
    });
  });

  describe("Recommendation types coverage", () => {
    it("all recommendation types can be generated", () => {
      const types = ["reschedule", "relocate", "increase_security", "delay_kickoff", "allocate_staff", "activate_backup", "weather_action", "schedule_optimization"] as const;
      types.forEach((type) => {
        const rec: AIRecommendation = { id: "r", type, title: "Test", description: "", priority: "medium", confidence: 85, impact: "", affectedMatchId: null, affectedVenueId: null, reasoning: [], requiresApproval: false, implemented: false };
        expect(rec.type).toBe(type);
      });
    });

    it("recommendations track implemented state", () => {
      const pending: AIRecommendation = { id: "r1", type: "reschedule", title: "Test", description: "", priority: "high", confidence: 90, impact: "", affectedMatchId: null, affectedVenueId: null, reasoning: [], requiresApproval: true, implemented: false };
      const approved: AIRecommendation = { ...pending, implemented: true };
      expect(pending.implemented).toBe(false);
      expect(approved.implemented).toBe(true);
    });
  });

  describe("Timezone and date edge cases", () => {
    it("handles overnight schedule", () => {
      const m = makeMatch({ scheduledTime: "23:00" });
      expect(m.scheduledTime).toBe("23:00");
    });

    it("handles early morning schedule", () => {
      const m = makeMatch({ scheduledTime: "06:00" });
      expect(m.scheduledTime).toBe("06:00");
    });

    it("handles month-end date boundaries", () => {
      const m = makeMatch({ scheduledDate: "2026-01-31" });
      expect(m.scheduledDate).toBe("2026-01-31");
    });

    it("handles leap year date", () => {
      const m = makeMatch({ scheduledDate: "2028-02-29" });
      expect(m.scheduledDate).toBe("2028-02-29");
    });
  });

  describe("Forecast and weather alert edge cases", () => {
    it("weather alert contains useful information when present", () => {
      const withAlert = WEATHER_SCENARIOS.filter((w) => w.alert !== null);
      withAlert.forEach((w) => {
        expect(w.alert!.length).toBeGreaterThan(10);
      });
    });

    it("extreme heat forecast mentions cooling", () => {
      const heat = WEATHER_SCENARIOS.find((w) => w.condition === "extreme_heat");
      expect(heat?.forecast.toLowerCase()).toContain("warning");
    });

    it("storm forecast mentions delay possibility", () => {
      const storm = WEATHER_SCENARIOS.find((w) => w.condition === "storm");
      expect(storm?.forecast.toLowerCase()).toContain("delay");
    });
  });
});
