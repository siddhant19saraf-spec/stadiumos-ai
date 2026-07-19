import { describe, it, expect } from "vitest";
import { TOURNAMENT, VENUES, TEAMS, RESOURCE_REQUIREMENTS, PHASE_DURATION_MINUTES } from "../constants";
import { MockSchedulingEngine } from "../services/scheduling-engine";
import { MockConflictEngine } from "../services/conflict-engine";
import { MockAnalyticsEngine } from "../services/analytics-engine";
import { MockRecommendationEngine } from "../services/recommendation-engine";
import { MockOptimizationEngine } from "../services/optimization-engine";
import type { Match, Venue, Conflict, ScheduleSlot } from "../types";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: `match-${Math.random().toString(36).slice(2, 6)}`,
    title: "BRA vs GER",
    stage: "group_stage",
    status: "scheduled",
    venueId: "venue-1",
    homeTeamId: "team-1",
    awayTeamId: "team-2",
    scheduledDate: "2030-06-15",
    scheduledTime: "21:00",
    actualStartTime: null,
    actualEndTime: null,
    estimatedDuration: 105,
    attendance: 75000,
    capacityPercent: 88,
    crowdDensity: 65,
    aiPredictedAttendance: 80000,
    revenue: 8500000,
    broadcastCoverage: ["BBC", "Sky Sports"],
    weatherForecast: {
      condition: "clear", temperature: 28, humidity: 45, windSpeed: 8, precipitation: 0,
      forecast: "Sunny", alert: null,
    },
    incidents: 0,
    securityLevel: "normal",
    aiDelayRisk: 12,
    delayMinutes: 0,
    operationalTimeline: [],
    ticketsSold: 75000,
    ticketsAvailable: 10450,
    ...overrides,
  };
}

function makeSlot(overrides: Partial<ScheduleSlot> = {}): ScheduleSlot {
  return {
    id: `slot-${Math.random().toString(36).slice(2, 6)}`,
    matchId: "match-1",
    venueId: "venue-1",
    date: "2030-06-15",
    startTime: "21:00",
    endTime: "23:00",
    phase: "match",
    allocatedResources: [],
    conflicts: [],
    ...overrides,
  };
}

describe("Tournament Constants", () => {
  it("should have a valid tournament definition", () => {
    expect(TOURNAMENT.name).toBe("World Cup 2030");
    expect(TOURNAMENT.totalMatches).toBe(64);
    expect(TOURNAMENT.venueIds.length).toBe(8);
  });

  it("should have 8 venues configured", () => {
    expect(VENUES.length).toBe(8);
    VENUES.forEach((v) => {
      expect(v.readiness.overall).toBeGreaterThanOrEqual(0);
    });
  });

  it("should have 16 teams configured", () => {
    expect(TEAMS.length).toBe(16);
    TEAMS.forEach((t) => {
      expect(t.points).toBeGreaterThanOrEqual(0);
    });
  });

  it("should have resource requirements for all resource types", () => {
    expect(Object.keys(RESOURCE_REQUIREMENTS).length).toBe(10);
  });

  it("should have duration for all operational phases", () => {
    expect(Object.keys(PHASE_DURATION_MINUTES).length).toBe(9);
  });
});

describe("SchedulingEngine", () => {
  const engine = new MockSchedulingEngine();

  it("should generate schedule slots for each match", () => {
    const matches = [makeMatch(), makeMatch({ id: "match-2" })];
    const slots = engine.generateSchedule(matches);
    expect(slots.length).toBe(2);
    expect(slots[0]!.matchId).toBe(matches[0]!.id);
  });

  it("should detect time overlaps between close matches", () => {
    const slots = [
      makeSlot({ startTime: "18:00", endTime: "20:00" }),
      makeSlot({ startTime: "19:00", endTime: "21:00" }),
    ];
    const matches = [makeMatch(), makeMatch()];
    const conflicts = engine.detectConflicts(slots, matches, VENUES);
    expect(conflicts.some((c) => c.type === "time_overlap")).toBe(true);
  });

  it("should not detect conflict for well-spaced matches", () => {
    const slots = [
      makeSlot({ startTime: "14:00", endTime: "16:00" }),
      makeSlot({ startTime: "21:00", endTime: "23:00" }),
    ];
    const matches = [makeMatch(), makeMatch()];
    const conflicts = engine.detectConflicts(slots, matches, VENUES);
    expect(conflicts.filter((c) => c.type === "time_overlap").length).toBe(0);
  });

  it("should resolve a conflict with AI suggestion", () => {
    const conflict: Conflict = {
      id: "conf-1", type: "time_overlap", severity: "high",
      title: "Time Overlap", description: "Test",
      affectedIds: ["m1", "m2"], affectedVenues: ["v1"],
      aiResolution: "Reschedule to 21:00", aiConfidence: 90,
      resolved: false, detectedAt: "", resolvedAt: null,
    };
    expect(engine.resolveConflict(conflict)).toBe("Reschedule to 21:00");
  });
});

describe("ConflictEngine", () => {
  const engine = new MockConflictEngine();

  it("should detect venue double-booking conflicts", () => {
    const slots = [
      makeSlot({ date: "2030-06-15", startTime: "14:00", endTime: "16:00" }),
      makeSlot({ id: "slot-2", date: "2030-06-15", startTime: "18:00", endTime: "20:00" }),
    ];
    const matches = [makeMatch(), makeMatch()];
    const conflicts = engine.detectAll(slots, matches, VENUES);
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it("should detect maintenance conflicts", () => {
    const maintenanceVenue = VENUES.find((v) => v.status === "maintenance")!;
    const slots = [makeSlot({ venueId: maintenanceVenue.id })];
    const matches = [makeMatch({ venueId: maintenanceVenue.id })];
    const conflicts = engine.detectAll(slots, matches, VENUES);
    expect(conflicts.some((c) => c.type === "maintenance_conflict")).toBe(true);
  });

  it("should prioritize critical conflicts first", () => {
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "low", title: "", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 0, resolved: false, detectedAt: "", resolvedAt: null },
      { id: "c2", type: "venue_double_booked", severity: "critical", title: "", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 0, resolved: false, detectedAt: "", resolvedAt: null },
      { id: "c3", type: "time_overlap", severity: "high", title: "", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 0, resolved: false, detectedAt: "", resolvedAt: null },
    ];
    const sorted = engine.prioritize(conflicts);
    expect(sorted[0]!.severity).toBe("critical");
    expect(sorted[1]!.severity).toBe("high");
    expect(sorted[2]!.severity).toBe("low");
  });
});

describe("AnalyticsEngine", () => {
  const engine = new MockAnalyticsEngine();

  it("should compute analytics from matches", () => {
    const matches = [
      makeMatch({ status: "completed", revenue: 5000000, attendance: 70000 }),
      makeMatch({ id: "m2", status: "in_progress", revenue: 6000000, attendance: 80000 }),
      makeMatch({ id: "m3", status: "scheduled" }),
    ];
    const analytics = engine.compute(matches, VENUES, []);
    expect(analytics.totalMatches).toBe(3);
    expect(analytics.completedMatches).toBe(1);
    expect(analytics.upcomingMatches).toBe(2);
    expect(analytics.totalRevenue).toBeGreaterThan(0);
    expect(analytics.totalAttendance).toBeGreaterThan(0);
    expect(analytics.venueUtilization).toBeGreaterThanOrEqual(0);
    expect(analytics.safetyIndex).toBeGreaterThan(0);
  });

  it("should handle empty matches gracefully", () => {
    const analytics = engine.compute([], VENUES, []);
    expect(analytics.totalMatches).toBe(0);
    expect(analytics.completedMatches).toBe(0);
    expect(analytics.totalRevenue).toBe(0);
    expect(analytics.averageDelayMinutes).toBe(0);
  });
});

describe("RecommendationEngine", () => {
  const engine = new MockRecommendationEngine();

  it("should generate recommendations from conflicts", () => {
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "high", title: "Time Overlap", description: "Test conflict", affectedIds: ["m1"], affectedVenues: ["v1"], aiResolution: "Reschedule", aiConfidence: 90, resolved: false, detectedAt: "", resolvedAt: null },
    ];
    const matches = [makeMatch()];
    const analytics = new MockAnalyticsEngine().compute(matches, VENUES, []);
    const recs = engine.generate(conflicts, matches, analytics);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.type === "reschedule")).toBe(true);
  });

  it("should skip resolved conflicts", () => {
    const conflicts: Conflict[] = [
      { id: "c1", type: "time_overlap", severity: "high", title: "", description: "", affectedIds: [], affectedVenues: [], aiResolution: "", aiConfidence: 0, resolved: true, detectedAt: "", resolvedAt: null },
    ];
    const recs = engine.generate(conflicts, [], new MockAnalyticsEngine().compute([], VENUES, []));
    expect(recs.filter((r) => r.type === "reschedule").length).toBe(0);
  });
});

describe("OptimizationEngine", () => {
  const engine = new MockOptimizationEngine();

  it("should optimize resources based on matches and venues", () => {
    const matches = [makeMatch({ attendance: 80000 }), makeMatch({ attendance: 60000 })];
    const resources = engine.optimizeResources(matches, VENUES);
    expect(resources.length).toBe(10);
    expect(resources.every((r) => r.utilizationPercent >= 0)).toBe(true);
  });

  it("should reallocate resources to fix shortages", () => {
    const resources = [
      { type: "security" as const, required: 100, allocated: 70, available: 120, utilizationPercent: 58, status: "shortage" as const, teams: ["sec-1"] },
    ];
    const reallocated = engine.reallocate(resources, "match-1", "venue-1");
    expect(reallocated[0]!.allocated).toBeGreaterThan(70);
  });
});

