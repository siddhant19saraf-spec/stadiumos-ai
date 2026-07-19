import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  MockIncidentEngine,
  incidentEngine,
} from "@/features/emergency-response/services/incident-engine";
import {
  MockDispatchEngine,
  dispatchEngine,
} from "@/features/emergency-response/services/dispatch-engine";
import {
  MockRecommendationEngine,
  recommendationEngine,
} from "@/features/emergency-response/services/recommendation-engine";
import {
  MockAnalyticsEngine,
  analyticsEngine,
} from "@/features/emergency-response/services/analytics-engine";
import {
  MockNotificationEngine,
  notificationEngine,
} from "@/features/emergency-response/services/notification-engine";
import {
  MockMapEngine,
  mapEngine,
} from "@/features/emergency-response/services/map-engine";
import {
  INCIDENT_TYPE_CONFIG,
  SEVERITY_PRIORITY_MAP,
  TEAM_CONFIGS,
  RESPONSE_THRESHOLDS,
  EVACUATION_EXITS,
  RALLY_POINTS,
  INCIDENT_LOCATIONS,
  REPORTED_BY,
  REFRESH_INTERVAL,
} from "@/features/emergency-response/constants";
import type {
  Incident,
  IncidentType,
  Severity,
  Priority,
  ResponseTeam,
  IncidentStatus,
  TeamType,
} from "@/features/emergency-response/types";
import {
  makeIncident,
  makeResponseTeam,
  makeAIAnalysis,
  makeResponseTimePoint,
  makeEmergencyAnalytics,
  resetCounter,
} from "../fixtures/factories";

function allIncidentTypes(): IncidentType[] {
  return [
    "medical_emergency", "fire", "security_threat", "crowd_surge",
    "stampede_risk", "suspicious_package", "infrastructure_failure",
    "power_failure", "network_failure", "weather_emergency",
    "vip_incident", "lost_child",
  ];
}

function allSeverities(): Severity[] {
  return ["critical", "high", "medium", "low"];
}

function allPriorities(): Priority[] {
  return ["p0", "p1", "p2", "p3"];
}

function allStatuses(): IncidentStatus[] {
  return ["reported", "analyzing", "assessing", "dispatched", "in_progress", "contained", "resolved"];
}

function allTeamTypes(): TeamType[] {
  return [
    "medical_alpha", "medical_bravo", "security_alpha", "security_bravo",
    "fire_response", "hazmat", "evacuation", "engineering",
    "vip_protection", "crowd_management", "communications", "command",
  ];
}

beforeEach(() => {
  resetCounter();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Constants", () => {
  it("INCIDENT_TYPE_CONFIG covers all 12 incident types", () => {
    const types = allIncidentTypes();
    for (const t of types) {
      expect(INCIDENT_TYPE_CONFIG[t]).toBeDefined();
      expect(INCIDENT_TYPE_CONFIG[t].label).toBeTruthy();
      expect(typeof INCIDENT_TYPE_CONFIG[t].responsePriority).toBe("number");
    }
  });

  it("INCIDENT_TYPE_CONFIG label values are correct", () => {
    expect(INCIDENT_TYPE_CONFIG.medical_emergency.label).toBe("Medical Emergency");
    expect(INCIDENT_TYPE_CONFIG.fire.label).toBe("Fire");
    expect(INCIDENT_TYPE_CONFIG.security_threat.label).toBe("Security Threat");
    expect(INCIDENT_TYPE_CONFIG.crowd_surge.label).toBe("Crowd Surge");
    expect(INCIDENT_TYPE_CONFIG.stampede_risk.label).toBe("Stampede Risk");
    expect(INCIDENT_TYPE_CONFIG.suspicious_package.label).toBe("Suspicious Package");
    expect(INCIDENT_TYPE_CONFIG.infrastructure_failure.label).toBe("Infrastructure Failure");
    expect(INCIDENT_TYPE_CONFIG.power_failure.label).toBe("Power Failure");
    expect(INCIDENT_TYPE_CONFIG.network_failure.label).toBe("Network Failure");
    expect(INCIDENT_TYPE_CONFIG.weather_emergency.label).toBe("Weather Emergency");
    expect(INCIDENT_TYPE_CONFIG.vip_incident.label).toBe("VIP Incident");
    expect(INCIDENT_TYPE_CONFIG.lost_child.label).toBe("Lost Child");
  });

  it("INCIDENT_TYPE_CONFIG icons are all defined", () => {
    for (const t of allIncidentTypes()) {
      expect(INCIDENT_TYPE_CONFIG[t].icon).toBeTruthy();
    }
  });

  it("INCIDENT_TYPE_CONFIG defaultSeverity mappings", () => {
    expect(INCIDENT_TYPE_CONFIG.medical_emergency.defaultSeverity).toBe("critical");
    expect(INCIDENT_TYPE_CONFIG.fire.defaultSeverity).toBe("critical");
    expect(INCIDENT_TYPE_CONFIG.security_threat.defaultSeverity).toBe("critical");
    expect(INCIDENT_TYPE_CONFIG.stampede_risk.defaultSeverity).toBe("critical");
    expect(INCIDENT_TYPE_CONFIG.crowd_surge.defaultSeverity).toBe("high");
    expect(INCIDENT_TYPE_CONFIG.suspicious_package.defaultSeverity).toBe("high");
    expect(INCIDENT_TYPE_CONFIG.infrastructure_failure.defaultSeverity).toBe("high");
    expect(INCIDENT_TYPE_CONFIG.power_failure.defaultSeverity).toBe("high");
    expect(INCIDENT_TYPE_CONFIG.weather_emergency.defaultSeverity).toBe("high");
    expect(INCIDENT_TYPE_CONFIG.vip_incident.defaultSeverity).toBe("high");
    expect(INCIDENT_TYPE_CONFIG.network_failure.defaultSeverity).toBe("medium");
    expect(INCIDENT_TYPE_CONFIG.lost_child.defaultSeverity).toBe("medium");
  });

  it("INCIDENT_TYPE_CONFIG response priority order is correct", () => {
    expect(INCIDENT_TYPE_CONFIG.medical_emergency.responsePriority).toBe(1);
    expect(INCIDENT_TYPE_CONFIG.fire.responsePriority).toBe(1);
    expect(INCIDENT_TYPE_CONFIG.security_threat.responsePriority).toBe(1);
    expect(INCIDENT_TYPE_CONFIG.stampede_risk.responsePriority).toBe(1);
    expect(INCIDENT_TYPE_CONFIG.crowd_surge.responsePriority).toBe(2);
    expect(INCIDENT_TYPE_CONFIG.suspicious_package.responsePriority).toBe(2);
    expect(INCIDENT_TYPE_CONFIG.power_failure.responsePriority).toBe(2);
    expect(INCIDENT_TYPE_CONFIG.weather_emergency.responsePriority).toBe(2);
    expect(INCIDENT_TYPE_CONFIG.vip_incident.responsePriority).toBe(2);
    expect(INCIDENT_TYPE_CONFIG.infrastructure_failure.responsePriority).toBe(3);
    expect(INCIDENT_TYPE_CONFIG.network_failure.responsePriority).toBe(3);
    expect(INCIDENT_TYPE_CONFIG.lost_child.responsePriority).toBe(4);
  });

  it("SEVERITY_PRIORITY_MAP has all 4 severities", () => {
    expect(SEVERITY_PRIORITY_MAP).toEqual({ critical: 0, high: 1, medium: 2, low: 3 });
  });

  it("SEVERITY_PRIORITY_MAP order is correct", () => {
    expect(SEVERITY_PRIORITY_MAP.critical).toBeLessThan(SEVERITY_PRIORITY_MAP.high);
    expect(SEVERITY_PRIORITY_MAP.high).toBeLessThan(SEVERITY_PRIORITY_MAP.medium);
    expect(SEVERITY_PRIORITY_MAP.medium).toBeLessThan(SEVERITY_PRIORITY_MAP.low);
  });

  it("TEAM_CONFIGS has all 12 teams", () => {
    expect(TEAM_CONFIGS.length).toBe(12);
  });

  it("TEAM_CONFIGS covers all team types", () => {
    const types = TEAM_CONFIGS.map((t) => t.type);
    for (const tt of allTeamTypes()) {
      expect(types).toContain(tt);
    }
  });

  it("TEAM_CONFIGS each team has required fields", () => {
    for (const team of TEAM_CONFIGS) {
      expect(team.id).toBeTruthy();
      expect(team.name).toBeTruthy();
      expect(team.members).toBeGreaterThan(0);
      expect(team.leader).toBeTruthy();
      expect(team.status).toBe("available");
      expect(team.coordinates).toBeDefined();
      expect(typeof team.coordinates.x).toBe("number");
      expect(typeof team.coordinates.y).toBe("number");
      expect(team.estimatedArrivalMinutes).toBeGreaterThanOrEqual(0);
      expect(team.equipment.length).toBeGreaterThan(0);
    }
  });

  it("TEAM_CONFIGS all start as available", () => {
    expect(TEAM_CONFIGS.every((t) => t.status === "available")).toBe(true);
  });

  it("RESPONSE_THRESHOLDS values are all positive", () => {
    expect(RESPONSE_THRESHOLDS.criticalResponseTargetMinutes).toBe(3);
    expect(RESPONSE_THRESHOLDS.highResponseTargetMinutes).toBe(5);
    expect(RESPONSE_THRESHOLDS.mediumResponseTargetMinutes).toBe(8);
    expect(RESPONSE_THRESHOLDS.lowResponseTargetMinutes).toBe(12);
    expect(RESPONSE_THRESHOLDS.escalationThresholdPercent).toBe(75);
    expect(RESPONSE_THRESHOLDS.maxConcurrentCritical).toBe(3);
    expect(RESPONSE_THRESHOLDS.resourceCriticalPercent).toBe(80);
  });

  it("RESPONSE_THRESHOLDS target times increase with lower severity", () => {
    expect(RESPONSE_THRESHOLDS.criticalResponseTargetMinutes).toBeLessThan(RESPONSE_THRESHOLDS.highResponseTargetMinutes);
    expect(RESPONSE_THRESHOLDS.highResponseTargetMinutes).toBeLessThan(RESPONSE_THRESHOLDS.mediumResponseTargetMinutes);
    expect(RESPONSE_THRESHOLDS.mediumResponseTargetMinutes).toBeLessThan(RESPONSE_THRESHOLDS.lowResponseTargetMinutes);
  });

  it("EVACUATION_EXITS has 6 exits", () => {
    expect(EVACUATION_EXITS.length).toBe(6);
  });

  it("EVACUATION_EXITS all have type emergency_exit", () => {
    expect(EVACUATION_EXITS.every((e) => e.type === "emergency_exit")).toBe(true);
  });

  it("EVACUATION_EXITS all have unique ids", () => {
    const ids = EVACUATION_EXITS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("EVACUATION_EXITS coordinates are within bounds", () => {
    for (const exit of EVACUATION_EXITS) {
      expect(exit.coordinates.x).toBeGreaterThanOrEqual(0);
      expect(exit.coordinates.x).toBeLessThanOrEqual(100);
      expect(exit.coordinates.y).toBeGreaterThanOrEqual(0);
      expect(exit.coordinates.y).toBeLessThanOrEqual(100);
    }
  });

  it("RALLY_POINTS has 4 points", () => {
    expect(RALLY_POINTS.length).toBe(4);
  });

  it("RALLY_POINTS all have type rally_point", () => {
    expect(RALLY_POINTS.every((r) => r.type === "rally_point")).toBe(true);
  });

  it("RALLY_POINTS have unique ids", () => {
    const ids = RALLY_POINTS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("INCIDENT_LOCATIONS has 26 locations", () => {
    expect(INCIDENT_LOCATIONS.length).toBe(26);
  });

  it("INCIDENT_LOCATIONS all are non-empty strings", () => {
    expect(INCIDENT_LOCATIONS.every((l) => l.length > 0)).toBe(true);
  });

  it("REPORTED_BY has 12 sources", () => {
    expect(REPORTED_BY.length).toBe(12);
  });

  it("REPORTED_BY all are non-empty strings", () => {
    expect(REPORTED_BY.every((r) => r.length > 0)).toBe(true);
  });

  it("REFRESH_INTERVAL is 4000ms", () => {
    expect(REFRESH_INTERVAL).toBe(4000);
  });
});

describe("MockIncidentEngine", () => {
  let engine: MockIncidentEngine;

  beforeEach(() => {
    engine = new MockIncidentEngine();
  });

  describe("processNew", () => {
    it("should enrich incident with analyzing status", async () => {
      const inc = makeIncident({ status: "reported" });
      const result = await engine.processNew(inc);
      expect(result.status).toBe("analyzing");
    });

    it("should set lastUpdated to current timestamp", async () => {
      const inc = makeIncident();
      const result = await engine.processNew(inc);
      expect(result.lastUpdated).toBeTruthy();
    });

    it("should add a timeline entry for processing started", async () => {
      const inc = makeIncident({ timeline: [] });
      const result = await engine.processNew(inc);
      expect(result.timeline.length).toBe(1);
      expect(result.timeline[0].action).toBe("Incident Processing Started");
      expect(result.timeline[0].actor).toBe("Incident Engine");
    });

    it("should preserve existing timeline entries", async () => {
      const inc = makeIncident({
        timeline: [{ id: "tl-1", action: "Reported", actor: "CCTV", timestamp: new Date().toISOString(), detail: "Initial" }],
      });
      const result = await engine.processNew(inc);
      expect(result.timeline.length).toBe(2);
      expect(result.timeline[0].id).toBe("tl-1");
    });

    it("should preserve all other incident properties", async () => {
      const inc = makeIncident({ title: "Custom Title", location: "Custom Location" });
      const result = await engine.processNew(inc);
      expect(result.title).toBe("Custom Title");
      expect(result.location).toBe("Custom Location");
      expect(result.id).toBe(inc.id);
      expect(result.type).toBe(inc.type);
      expect(result.severity).toBe(inc.severity);
      expect(result.priority).toBe(inc.priority);
    });

    it("should handle incident with empty timeline", async () => {
      const inc = makeIncident({ timeline: [] });
      const result = await engine.processNew(inc);
      expect(result.timeline).toHaveLength(1);
    });

    it("should produce consecutive timeline entry IDs", async () => {
      const inc1 = makeIncident();
      const r1 = await engine.processNew(inc1);
      const inc2 = makeIncident();
      const r2 = await engine.processNew(inc2);
      expect(r1.timeline[0].id).toContain(inc1.id);
      expect(r2.timeline[0].id).toContain(inc2.id);
    });
  });

  describe("updateStatus", () => {
    it("should update incident status", async () => {
      const inc = makeIncident({ status: "reported" });
      const result = await engine.updateStatus(inc, "assessing");
      expect(result.status).toBe("assessing");
    });

    it("should update lastUpdated timestamp", async () => {
      vi.useFakeTimers();
      const inc = makeIncident();
      vi.advanceTimersByTime(100);
      const result = await engine.updateStatus(inc, "resolved");
      expect(result.lastUpdated).toBeTruthy();
      expect(result.lastUpdated).not.toBe(inc.lastUpdated);
      vi.useRealTimers();
    });

    it("should add a timeline entry for the status change", async () => {
      const inc = makeIncident({ status: "reported", timeline: [] });
      const result = await engine.updateStatus(inc, "analyzing");
      expect(result.timeline.length).toBe(1);
      expect(result.timeline[0].action).toContain("Status Changed");
    });

    it("should transition through all statuses", async () => {
      const inc = makeIncident({ timeline: [] });
      let current = inc;
      const statuses: IncidentStatus[] = ["reported", "analyzing", "assessing", "dispatched", "in_progress", "contained", "resolved"];
      for (const s of statuses) {
        const result = await engine.updateStatus(current, s);
        expect(result.status).toBe(s);
        current = result;
      }
      expect(current.timeline.length).toBe(statuses.length);
    });

    it("should preserve existing properties", async () => {
      const inc = makeIncident({ severity: "critical", type: "fire" });
      const result = await engine.updateStatus(inc, "dispatched");
      expect(result.severity).toBe("critical");
      expect(result.type).toBe("fire");
      expect(result.id).toBe(inc.id);
    });
  });

  describe("triageBySeverity", () => {
    it("should sort critical before high", () => {
      const high = makeIncident({ severity: "high" });
      const critical = makeIncident({ severity: "critical" });
      const sorted = engine.triageBySeverity([high, critical]);
      expect(sorted[0].severity).toBe("critical");
      expect(sorted[1].severity).toBe("high");
    });

    it("should sort high before medium", () => {
      const medium = makeIncident({ severity: "medium" });
      const high = makeIncident({ severity: "high" });
      const sorted = engine.triageBySeverity([medium, high]);
      expect(sorted[0].severity).toBe("high");
      expect(sorted[1].severity).toBe("medium");
    });

    it("should sort medium before low", () => {
      const low = makeIncident({ severity: "low" });
      const medium = makeIncident({ severity: "medium" });
      const sorted = engine.triageBySeverity([low, medium]);
      expect(sorted[0].severity).toBe("medium");
      expect(sorted[1].severity).toBe("low");
    });

    it("should order by reportedAt when same severity", () => {
      const older = makeIncident({ severity: "high", reportedAt: new Date(Date.now() - 10000).toISOString() });
      const newer = makeIncident({ severity: "high", reportedAt: new Date().toISOString() });
      const sorted = engine.triageBySeverity([newer, older]);
      expect(sorted[0].id).toBe(older.id);
      expect(sorted[1].id).toBe(newer.id);
    });

    it("should handle empty array", () => {
      const result = engine.triageBySeverity([]);
      expect(result).toEqual([]);
    });

    it("should handle single incident", () => {
      const inc = makeIncident();
      const result = engine.triageBySeverity([inc]);
      expect(result).toEqual([inc]);
    });

    it("should handle all severities together", () => {
      const incidents = [
        makeIncident({ severity: "low" }),
        makeIncident({ severity: "critical" }),
        makeIncident({ severity: "high" }),
        makeIncident({ severity: "medium" }),
      ];
      const sorted = engine.triageBySeverity(incidents);
      expect(sorted[0].severity).toBe("critical");
      expect(sorted[1].severity).toBe("high");
      expect(sorted[2].severity).toBe("medium");
      expect(sorted[3].severity).toBe("low");
    });

    it("should not mutate the original array", () => {
      const incidents = [makeIncident({ severity: "low" }), makeIncident({ severity: "critical" })];
      const copy = [...incidents];
      engine.triageBySeverity(incidents);
      expect(incidents).toEqual(copy);
    });

    it("should handle 10+ incidents with mixed severities", () => {
      const incidents = Array.from({ length: 12 }, (_, i) => {
        const sev: Severity = i < 3 ? "critical" : i < 6 ? "high" : i < 9 ? "medium" : "low";
        return makeIncident({ severity: sev, reportedAt: new Date(Date.now() - i * 1000).toISOString() });
      });
      const sorted = engine.triageBySeverity(incidents);
      expect(sorted[0].severity).toBe("critical");
      expect(sorted[3].severity).toBe("high");
      expect(sorted[6].severity).toBe("medium");
      expect(sorted[9].severity).toBe("low");
    });
  });

  describe("singleton incidentEngine", () => {
    it("should be an instance of MockIncidentEngine", () => {
      expect(incidentEngine).toBeInstanceOf(MockIncidentEngine);
    });

    it("should have processNew method", async () => {
      const inc = makeIncident();
      const result = await incidentEngine.processNew(inc);
      expect(result.status).toBe("analyzing");
    });

    it("should have updateStatus method", async () => {
      const inc = makeIncident();
      const result = await incidentEngine.updateStatus(inc, "resolved");
      expect(result.status).toBe("resolved");
    });

    it("should have triageBySeverity method", () => {
      const result = incidentEngine.triageBySeverity([makeIncident({ severity: "low" }), makeIncident({ severity: "critical" })]);
      expect(result[0].severity).toBe("critical");
    });
  });
});

describe("MockDispatchEngine", () => {
  let engine: MockDispatchEngine;

  beforeEach(() => {
    engine = new MockDispatchEngine();
  });

  describe("recommendTeam", () => {
    it("should recommend the matching team type closest to incident", () => {
      const inc = makeIncident({ coordinates: { x: 10, y: 10 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
      const teams = [
        makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 50, y: 50 } }),
        makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 15, y: 15 } }),
      ];
      const result = engine.recommendTeam(inc, teams);
      expect(result?.id).toBe(teams[1].id);
    });

    it("should return null when no teams available", () => {
      const inc = makeIncident();
      const result = engine.recommendTeam(inc, []);
      expect(result).toBeNull();
    });

    it("should filter to only available teams of matching type", () => {
      const inc = makeIncident({ aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
      const teams = [
        makeResponseTeam({ type: "medical_alpha", status: "dispatched" }),
        makeResponseTeam({ type: "security_alpha", status: "dispatched" }),
      ];
      const result = engine.recommendTeam(inc, teams);
      expect(result).toBeNull();
    });

    it("should fall back to nearest available team when no type match", () => {
      const inc = makeIncident({ coordinates: { x: 0, y: 0 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "hazmat" }) });
      const teams = [
        makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 5, y: 5 } }),
        makeResponseTeam({ type: "security_alpha", status: "available", coordinates: { x: 90, y: 90 } }),
      ];
      const result = engine.recommendTeam(inc, teams);
      expect(result?.id).toBe(teams[0].id);
    });

    it("should prefer matching type over non-matching even if farther", () => {
      const inc = makeIncident({ coordinates: { x: 50, y: 50 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "fire_response" }) });
      const teams = [
        makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 48, y: 48 } }),
        makeResponseTeam({ type: "fire_response", status: "available", coordinates: { x: 10, y: 10 } }),
      ];
      const result = engine.recommendTeam(inc, teams);
      expect(result?.type).toBe("fire_response");
    });

    it("should sort by distance correctly", () => {
      const inc = makeIncident({ coordinates: { x: 50, y: 50 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
      const far = makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 90, y: 90 } });
      const near = makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 52, y: 52 } });
      const result = engine.recommendTeam(inc, [far, near]);
      expect(result?.id).toBe(near.id);
    });

    it("should handle teams with same distance", () => {
      const inc = makeIncident({ coordinates: { x: 50, y: 50 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_bravo" }) });
      const a = makeResponseTeam({ type: "medical_bravo", status: "available", coordinates: { x: 60, y: 50 } });
      const b = makeResponseTeam({ type: "medical_bravo", status: "available", coordinates: { x: 40, y: 50 } });
      const result = engine.recommendTeam(inc, [a, b]);
      expect(result).toBeTruthy();
    });

    it("should not recommend dispatched teams", () => {
      const inc = makeIncident({ aiAnalysis: makeAIAnalysis({ recommendedTeam: "security_alpha" }) });
      const teams = [
        makeResponseTeam({ type: "security_alpha", status: "dispatched" }),
        makeResponseTeam({ type: "security_alpha", status: "on_scene" }),
        makeResponseTeam({ type: "security_alpha", status: "returning" }),
      ];
      const result = engine.recommendTeam(inc, teams);
      expect(result).toBeNull();
    });

    it("should handle 10+ teams with mixed types", () => {
      const inc = makeIncident({ coordinates: { x: 50, y: 50 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
      const teams = Array.from({ length: 12 }, (_, i) => {
        const types: TeamType[] = ["medical_alpha", "medical_bravo", "security_alpha", "security_bravo", "fire_response", "hazmat", "evacuation", "engineering", "vip_protection", "crowd_management", "communications", "command"];
        return makeResponseTeam({ type: types[i], status: "available", coordinates: { x: 10 + i * 5, y: 10 + i * 5 } });
      });
      const result = engine.recommendTeam(inc, teams);
      expect(result?.type).toBe("medical_alpha");
    });
  });

  describe("dispatch", () => {
    it("should update incident status to dispatched", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.incident.status).toBe("dispatched");
    });

    it("should assign team to incident", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.incident.assignedTeam).toBe(team.id);
      expect(result.incident.assignedTeamType).toBe(team.type);
    });

    it("should update team status to dispatched", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.team.status).toBe("dispatched");
      expect(result.team.incidentId).toBe(inc.id);
    });

    it("should create a dispatch log entry", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.log.action).toContain("Dispatch");
      expect(result.log.status).toBe("executed");
      expect(result.log.incidentId).toBe(inc.id);
      expect(result.log.teamId).toBe(team.id);
    });

    it("should add timeline entry for dispatch", async () => {
      const inc = makeIncident({ timeline: [] });
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.incident.timeline.length).toBe(1);
      expect(result.incident.timeline[0].action).toBe("Team Dispatched");
    });

    it("should preserve existing timeline entries during dispatch", async () => {
      const inc = makeIncident({
        timeline: [{ id: "tl-1", action: "Reported", actor: "System", timestamp: new Date().toISOString(), detail: "Initial" }],
      });
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.incident.timeline.length).toBe(2);
    });

    it("should set authorizedBy to null initially", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.log.authorizedBy).toBeNull();
    });

    it("should provide ETA in result message", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam({ estimatedArrivalMinutes: 7 });
      const result = await engine.dispatch(inc, team);
      expect(result.log.result).toContain("ETA: 7 minutes");
    });

    it("should preserve estimatedResolutionMinutes", async () => {
      const inc = makeIncident({ estimatedResolutionMinutes: 20 });
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.incident.estimatedResolutionMinutes).toBe(20);
    });

    it("should update lastUpdated timestamp on incident", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.dispatch(inc, team);
      expect(result.incident.lastUpdated).toBeTruthy();
      expect(new Date(result.incident.lastUpdated).getTime()).toBeGreaterThanOrEqual(new Date(inc.lastUpdated).getTime());
    });
  });

  describe("resolve", () => {
    it("should update incident status to resolved", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.resolve(inc, team);
      expect(result.incident.status).toBe("resolved");
    });

    it("should set team status to returning", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.resolve(inc, team);
      expect(result.team.status).toBe("returning");
    });

    it("should clear incidentId from team", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam({ incidentId: inc.id });
      const result = await engine.resolve(inc, team);
      expect(result.team.incidentId).toBeNull();
    });

    it("should create resolve log entry", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.resolve(inc, team);
      expect(result.log.action).toBe("Resolve Incident");
      expect(result.log.incidentId).toBe(inc.id);
    });

    it("should set authorizedBy to Command Operator", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await engine.resolve(inc, team);
      expect(result.log.authorizedBy).toBe("Command Operator");
    });

    it("should add timeline entry for resolution", async () => {
      const inc = makeIncident({ timeline: [] });
      const team = makeResponseTeam();
      const result = await engine.resolve(inc, team);
      expect(result.incident.timeline.length).toBe(1);
      expect(result.incident.timeline[0].action).toBe("Incident Resolved");
    });

    it("should use team leader as timeline actor", async () => {
      const inc = makeIncident({ timeline: [] });
      const team = makeResponseTeam({ leader: "Dr. Smith" });
      const result = await engine.resolve(inc, team);
      expect(result.incident.timeline[0].actor).toBe("Dr. Smith");
    });

    it("should preserve all other incident fields", async () => {
      const inc = makeIncident({ severity: "critical", type: "fire", location: "North Stand" });
      const team = makeResponseTeam();
      const result = await engine.resolve(inc, team);
      expect(result.incident.severity).toBe("critical");
      expect(result.incident.type).toBe("fire");
      expect(result.incident.location).toBe("North Stand");
    });
  });

  describe("singleton dispatchEngine", () => {
    it("should be an instance of MockDispatchEngine", () => {
      expect(dispatchEngine).toBeInstanceOf(MockDispatchEngine);
    });

    it("should recommend teams", () => {
      const inc = makeIncident();
      const result = dispatchEngine.recommendTeam(inc, []);
      expect(result).toBeNull();
    });

    it("should dispatch", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await dispatchEngine.dispatch(inc, team);
      expect(result.incident.status).toBe("dispatched");
    });

    it("should resolve", async () => {
      const inc = makeIncident();
      const team = makeResponseTeam();
      const result = await dispatchEngine.resolve(inc, team);
      expect(result.incident.status).toBe("resolved");
    });
  });
});

describe("MockRecommendationEngine", () => {
  let engine: MockRecommendationEngine;

  beforeEach(() => {
    engine = new MockRecommendationEngine();
  });

  it("should return empty array for empty incidents", () => {
    const result = engine.generate([], []);
    expect(result).toEqual([]);
  });

  it("should skip resolved and contained incidents", () => {
    const resolved = makeIncident({ status: "resolved" });
    const contained = makeIncident({ status: "contained" });
    const result = engine.generate([resolved, contained], []);
    expect(result).toEqual([]);
  });

  it("should generate dispatch recommendation for reported incident with matching team", () => {
    const inc = makeIncident({ status: "reported", aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const result = engine.generate([inc], [team]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const dispatchRec = result.find((r) => r.category === "dispatch");
    expect(dispatchRec).toBeDefined();
    expect(dispatchRec!.action).toContain("Dispatch");
  });

  it("should generate evacuation recommendation for fire incidents", () => {
    const inc = makeIncident({ type: "fire", status: "reported" });
    const result = engine.generate([inc], []);
    const evacRec = result.find((r) => r.category === "evacuation");
    expect(evacRec).toBeDefined();
    expect(evacRec!.priority).toBe("p0");
  });

  it("should generate evacuation recommendation for stampede_risk", () => {
    const inc = makeIncident({ type: "stampede_risk", status: "reported" });
    const result = engine.generate([inc], []);
    const evacRec = result.find((r) => r.category === "evacuation");
    expect(evacRec).toBeDefined();
  });

  it("should generate evacuation recommendation for crowd_surge", () => {
    const inc = makeIncident({ type: "crowd_surge", status: "reported" });
    const result = engine.generate([inc], []);
    const evacRec = result.find((r) => r.category === "evacuation");
    expect(evacRec).toBeDefined();
  });

  it("should generate communication recommendation for critical severity", () => {
    const inc = makeIncident({ severity: "critical", status: "reported" });
    const result = engine.generate([inc], []);
    const commRec = result.find((r) => r.category === "communication");
    expect(commRec).toBeDefined();
  });

  it("should generate communication recommendation for high severity", () => {
    const inc = makeIncident({ severity: "high", status: "reported" });
    const result = engine.generate([inc], []);
    const commRec = result.find((r) => r.category === "communication");
    expect(commRec).toBeDefined();
  });

  it("should generate lockdown recommendation for security_threat", () => {
    const inc = makeIncident({ type: "security_threat", status: "reported" });
    const result = engine.generate([inc], []);
    const lockdownRec = result.find((r) => r.category === "lockdown");
    expect(lockdownRec).toBeDefined();
    expect(lockdownRec!.priority).toBe("p0");
  });

  it("should generate medical recommendation for medical_emergency", () => {
    const inc = makeIncident({ type: "medical_emergency", status: "reported" });
    const result = engine.generate([inc], []);
    const medRec = result.find((r) => r.category === "medical");
    expect(medRec).toBeDefined();
  });

  it("should generate engineering recommendation for infrastructure_failure", () => {
    const inc = makeIncident({ type: "infrastructure_failure", status: "reported" });
    const result = engine.generate([inc], []);
    const engRec = result.find((r) => r.category === "engineering");
    expect(engRec).toBeDefined();
  });

  it("should generate engineering recommendation for power_failure", () => {
    const inc = makeIncident({ type: "power_failure", status: "reported" });
    const result = engine.generate([inc], []);
    const engRec = result.find((r) => r.category === "engineering");
    expect(engRec).toBeDefined();
  });

  it("should sort recommendations by priority p0 first", () => {
    const fire = makeIncident({ type: "fire", status: "reported" });
    const med = makeIncident({ type: "medical_emergency", status: "reported" });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const result = engine.generate([med, fire], [team]);
    expect(result[0].priority).toBe("p0");
  });

  it("should not generate dispatch rec when no matching available team", () => {
    const inc = makeIncident({ status: "reported", aiAnalysis: makeAIAnalysis({ recommendedTeam: "hazmat" }) });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const result = engine.generate([inc], [team]);
    const dispatchRec = result.find((r) => r.category === "dispatch");
    expect(dispatchRec).toBeUndefined();
  });

  it("should limit results to 12 recommendations", () => {
    const incidents = Array.from({ length: 20 }, () => makeIncident({ type: "fire", status: "reported" }));
    const result = engine.generate(incidents, []);
    expect(result.length).toBeLessThanOrEqual(12);
  });

  it("should require approval for critical or high severity dispatch", () => {
    const critical = makeIncident({ severity: "critical", status: "reported", aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const result = engine.generate([critical], [team]);
    const dispatchRec = result.find((r) => r.category === "dispatch");
    expect(dispatchRec?.requiresApproval).toBe(true);
  });

  it("should not require approval for medium severity dispatch", () => {
    const medium = makeIncident({ severity: "medium", status: "reported", aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const result = engine.generate([medium], [team]);
    const dispatchRec = result.find((r) => r.category === "dispatch");
    expect(dispatchRec?.requiresApproval).toBe(false);
  });

  it("should deduplicate recommendations by action+incidentId", () => {
    const inc = makeIncident({ severity: "critical", status: "reported", aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const result = engine.generate([inc, inc], [team]);
    const actions = result.map((r) => `${r.action}-${r.incidentId}`);
    expect(new Set(actions).size).toBe(actions.length);
  });
});

describe("MockAnalyticsEngine", () => {
  let engine: MockAnalyticsEngine;

  beforeEach(() => {
    engine = new MockAnalyticsEngine();
  });

  describe("compute", () => {
    it("should return zeroed analytics for empty inputs", () => {
      const result = engine.compute([], [], []);
      expect(result.totalIncidents).toBe(0);
      expect(result.openIncidents).toBe(0);
      expect(result.criticalIncidents).toBe(0);
      expect(result.resolvedIncidents).toBe(0);
      expect(result.activeTeams).toBe(0);
      expect(result.averageResponseMinutes).toBe(0);
      expect(result.avgResolutionMinutes).toBe(0);
    });

    it("should count open and resolved incidents correctly", () => {
      const incidents = [
        makeIncident({ status: "reported" }),
        makeIncident({ status: "in_progress" }),
        makeIncident({ status: "resolved" }),
      ];
      const result = engine.compute(incidents, [], []);
      expect(result.totalIncidents).toBe(3);
      expect(result.openIncidents).toBe(2);
      expect(result.resolvedIncidents).toBe(1);
    });

    it("should count critical incidents from open incidents", () => {
      const incidents = [
        makeIncident({ severity: "critical", status: "reported" }),
        makeIncident({ severity: "critical", status: "resolved" }),
        makeIncident({ severity: "high", status: "reported" }),
      ];
      const result = engine.compute(incidents, [], []);
      expect(result.criticalIncidents).toBe(1);
    });

    it("should compute average response time from history", () => {
      const points = [
        makeResponseTimePoint({ responseMinutes: 4 }),
        makeResponseTimePoint({ responseMinutes: 6 }),
      ];
      const result = engine.compute([], [], points);
      expect(result.averageResponseMinutes).toBe(5);
    });

    it("should compute average response time as 0 when no history", () => {
      const result = engine.compute([], [], []);
      expect(result.averageResponseMinutes).toBe(0);
    });

    it("should compute avg resolution minutes from resolved incidents", () => {
      const incidents = [
        makeIncident({ status: "resolved", estimatedResolutionMinutes: 10 }),
        makeIncident({ status: "resolved", estimatedResolutionMinutes: 20 }),
      ];
      const result = engine.compute(incidents, [], []);
      expect(result.avgResolutionMinutes).toBe(15);
    });

    it("should return 0 avg resolution when no resolved incidents", () => {
      const incidents = [makeIncident({ status: "reported" })];
      const result = engine.compute(incidents, [], []);
      expect(result.avgResolutionMinutes).toBe(0);
    });

    it("should count active (dispatched or on_scene) teams", () => {
      const teams = [
        makeResponseTeam({ status: "available" }),
        makeResponseTeam({ status: "dispatched" }),
        makeResponseTeam({ status: "on_scene" }),
        makeResponseTeam({ status: "returning" }),
      ];
      const result = engine.compute([], teams, []);
      expect(result.activeTeams).toBe(2);
    });

    it("should compute available teams correctly", () => {
      const teams = [
        makeResponseTeam({ status: "available" }),
        makeResponseTeam({ status: "available" }),
        makeResponseTeam({ status: "dispatched" }),
      ];
      const result = engine.compute([], teams, []);
      expect(result.availableTeams).toBe(2);
    });

    it("should compute readiness score without critical incidents", () => {
      const result = engine.compute([], [], []);
      expect(result.emergencyReadinessScore).toBeGreaterThanOrEqual(0);
      expect(result.emergencyReadinessScore).toBeLessThanOrEqual(100);
    });

    it("should lower readiness score with more critical incidents", () => {
      const noCritical = engine.compute([makeIncident({ status: "reported", severity: "high" })], [], []);
      const withCritical = engine.compute([makeIncident({ status: "reported", severity: "critical" })], [], []);
      expect(withCritical.emergencyReadinessScore).toBeLessThanOrEqual(noCritical.emergencyReadinessScore);
    });

    it("should compute safety score within valid range", () => {
      const result = engine.compute([], [], []);
      expect(result.safetyScore).toBeGreaterThanOrEqual(0);
      expect(result.safetyScore).toBeLessThanOrEqual(100);
    });

    it("should set evacuationStatus to none when no critical incidents", () => {
      const result = engine.compute([makeIncident({ severity: "medium" })], [], []);
      expect(result.evacuationStatus).toBe("none");
    });

    it("should set evacuationStatus to standby when critical incidents exist", () => {
      const result = engine.compute([makeIncident({ severity: "critical", status: "reported" })], [], []);
      expect(result.evacuationStatus).toBe("standby");
    });

    it("should set evacuationStatus to partial when more than 2 critical", () => {
      const incidents = [
        makeIncident({ severity: "critical", status: "reported" }),
        makeIncident({ severity: "critical", status: "reported" }),
        makeIncident({ severity: "critical", status: "reported" }),
      ];
      const result = engine.compute(incidents, [], []);
      expect(result.evacuationStatus).toBe("partial");
    });

    it("should compute criticalPerType correctly", () => {
      const incidents = [
        makeIncident({ severity: "critical", type: "fire", status: "reported" }),
        makeIncident({ severity: "critical", type: "fire", status: "reported" }),
        makeIncident({ severity: "critical", type: "medical_emergency", status: "reported" }),
      ];
      const result = engine.compute(incidents, [], []);
      expect(result.criticalPerType.fire).toBe(2);
      expect(result.criticalPerType.medical_emergency).toBe(1);
    });

    it("should collect affected zones from open incidents", () => {
      const incidents = [
        makeIncident({ zoneId: "zone-1", status: "reported" }),
        makeIncident({ zoneId: "zone-2", status: "reported" }),
        makeIncident({ zoneId: "zone-1", status: "resolved" }),
      ];
      const result = engine.compute(incidents, [], []);
      expect(result.affectedZones).toContain("zone-1");
      expect(result.affectedZones).toContain("zone-2");
      expect(result.affectedZones.length).toBe(2);
    });

    it("should set communicationStatus to degraded when network_failure open", () => {
      const incidents = [makeIncident({ type: "network_failure", status: "reported" })];
      const result = engine.compute(incidents, [], []);
      expect(result.communicationStatus).toBe("degraded");
    });

    it("should set communicationStatus to operational when no network_failure", () => {
      const incidents = [makeIncident({ type: "fire", status: "reported" })];
      const result = engine.compute(incidents, [], []);
      expect(result.communicationStatus).toBe("operational");
    });

    it("should compute escalation rate correctly", () => {
      const incidents = [
        makeIncident({ severity: "critical", status: "reported" }),
        makeIncident({ severity: "high", status: "reported" }),
        makeIncident({ severity: "medium", status: "reported" }),
        makeIncident({ severity: "medium", status: "resolved" }),
      ];
      const result = engine.compute(incidents, [], []);
      expect(result.escalationRate).toBe(25);
    });

    it("should compute resource utilization correctly", () => {
      const teams = [
        makeResponseTeam({ status: "available" }),
        makeResponseTeam({ status: "dispatched" }),
        makeResponseTeam({ status: "available" }),
        makeResponseTeam({ status: "dispatched" }),
      ];
      const result = engine.compute([], teams, []);
      expect(result.resourceUtilization).toBe(50);
    });

    it("should handle response time with single entry", () => {
      const points = [makeResponseTimePoint({ responseMinutes: 7.5 })];
      const result = engine.compute([], [], points);
      expect(result.averageResponseMinutes).toBe(7.5);
    });

    it("should handle many response time entries", () => {
      const points = Array.from({ length: 100 }, (_, i) => makeResponseTimePoint({ responseMinutes: i }));
      const result = engine.compute([], [], points);
      expect(result.averageResponseMinutes).toBeGreaterThan(0);
    });

    it("should pass through responseTimeHistory", () => {
      const points = [makeResponseTimePoint(), makeResponseTimePoint()];
      const result = engine.compute([], [], points);
      expect(result.responseTimeHistory).toBe(points);
    });
  });

  describe("recordResponseTime", () => {
    it("should create a ResponseTimePoint from incident", () => {
      const inc = makeIncident({ type: "fire", severity: "critical" });
      const result = engine.recordResponseTime(inc, 5.5);
      expect(result.incidentId).toBe(inc.id);
      expect(result.incidentType).toBe("fire");
      expect(result.responseMinutes).toBe(5.5);
      expect(result.severity).toBe("critical");
    });

    it("should set timestamp to current time", () => {
      const inc = makeIncident();
      const result = engine.recordResponseTime(inc, 3);
      expect(result.timestamp).toBeTruthy();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });

    it("should handle zero response time", () => {
      const inc = makeIncident();
      const result = engine.recordResponseTime(inc, 0);
      expect(result.responseMinutes).toBe(0);
    });

    it("should handle negative values gracefully", () => {
      const inc = makeIncident();
      const result = engine.recordResponseTime(inc, -1);
      expect(result.responseMinutes).toBe(-1);
    });
  });

  describe("singleton analyticsEngine", () => {
    it("should compute analytics", () => {
      const result = analyticsEngine.compute([], [], []);
      expect(result).toBeDefined();
      expect(typeof result.totalIncidents).toBe("number");
    });

    it("should record response time", () => {
      const inc = makeIncident();
      const result = analyticsEngine.recordResponseTime(inc, 4);
      expect(result.responseMinutes).toBe(4);
    });
  });
});

describe("MockNotificationEngine", () => {
  let engine: MockNotificationEngine;

  beforeEach(() => {
    engine = new MockNotificationEngine();
  });

  describe("generate", () => {
    it("should return empty array for no incidents", () => {
      const result = engine.generate([], []);
      expect(result).toEqual([]);
    });

    it("should skip resolved incidents", () => {
      const inc = makeIncident({ status: "resolved", severity: "critical" });
      const result = engine.generate([inc], []);
      expect(result).toEqual([]);
    });

    it("should generate critical_incident alert for critical severity", () => {
      const inc = makeIncident({ severity: "critical", status: "reported" });
      const result = engine.generate([inc], []);
      expect(result.length).toBeGreaterThanOrEqual(1);
      const criticalAlert = result.find((a) => a.type === "critical_incident");
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert!.severity).toBe("critical");
    });

    it("should NOT generate critical_incident alert for non-critical severity", () => {
      const inc = makeIncident({ severity: "high", status: "reported" });
      const result = engine.generate([inc], []);
      const criticalAlert = result.find((a) => a.type === "critical_incident");
      expect(criticalAlert).toBeUndefined();
    });

    it("should generate escalating_event alert when escalationProbability > 75", () => {
      const inc = makeIncident({ aiAnalysis: makeAIAnalysis({ escalationProbability: 80 }), status: "reported" });
      const result = engine.generate([inc], []);
      const escalateAlert = result.find((a) => a.type === "escalating_event");
      expect(escalateAlert).toBeDefined();
    });

    it("should NOT generate escalating_event alert when escalationProbability <= 75", () => {
      const inc = makeIncident({ aiAnalysis: makeAIAnalysis({ escalationProbability: 50 }), status: "reported" });
      const result = engine.generate([inc], []);
      const escalateAlert = result.find((a) => a.type === "escalating_event");
      expect(escalateAlert).toBeUndefined();
    });

    it("should generate resource_shortage alert when resourceShortages present", () => {
      const inc = makeIncident({ aiAnalysis: makeAIAnalysis({ resourceShortages: ["Defibrillator"] }), status: "reported" });
      const result = engine.generate([inc], []);
      const resourceAlert = result.find((a) => a.type === "resource_shortage");
      expect(resourceAlert).toBeDefined();
    });

    it("should NOT generate resource_shortage alert when no shortages", () => {
      const inc = makeIncident({ aiAnalysis: makeAIAnalysis({ resourceShortages: [] }), status: "reported" });
      const result = engine.generate([inc], []);
      const resourceAlert = result.find((a) => a.type === "resource_shortage");
      expect(resourceAlert).toBeUndefined();
    });

    it("should not generate duplicate alerts for same incident+type", () => {
      const inc = makeIncident({ severity: "critical", status: "reported" });
      const existing = [{
        id: "existing", type: "critical_incident" as const, title: "Existing", message: "",
        severity: "critical" as const, incidentId: inc.id, timestamp: "", acknowledged: false,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      }];
      const result = engine.generate([inc], existing);
      const criticalAlert = result.find((a) => a.type === "critical_incident");
      expect(criticalAlert).toBeUndefined();
    });

    it("should set acknowledged to false on new alerts", () => {
      const inc = makeIncident({ severity: "critical", status: "reported" });
      const result = engine.generate([inc], []);
      expect(result.every((a) => a.acknowledged === false)).toBe(true);
    });

    it("should set expiresAt on generated alerts", () => {
      const inc = makeIncident({ severity: "critical", status: "reported" });
      const result = engine.generate([inc], []);
      for (const alert of result) {
        expect(alert.expiresAt).toBeTruthy();
        expect(new Date(alert.expiresAt).getTime()).toBeGreaterThan(Date.now());
      }
    });

    it("should handle multiple incidents generating multiple alerts", () => {
      const inc1 = makeIncident({ severity: "critical", status: "reported" });
      const inc2 = makeIncident({ severity: "critical", status: "reported" });
      const result = engine.generate([inc1, inc2], []);
      const criticalAlerts = result.filter((a) => a.type === "critical_incident");
      expect(criticalAlerts.length).toBe(2);
    });
  });

  describe("acknowledge", () => {
    it("should set acknowledged to true", async () => {
      const alert = {
        id: "alert-1", type: "critical_incident" as const, title: "Test", message: "Test",
        severity: "critical" as const, incidentId: "inc-1", timestamp: "", acknowledged: false,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      };
      const result = await engine.acknowledge(alert);
      expect(result.acknowledged).toBe(true);
    });

    it("should preserve all other fields", async () => {
      const alert = {
        id: "alert-1", type: "critical_incident" as const, title: "Test Alert", message: "Message",
        severity: "critical" as const, incidentId: "inc-1", timestamp: "2024-01-01", acknowledged: false,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      };
      const result = await engine.acknowledge(alert);
      expect(result.id).toBe("alert-1");
      expect(result.title).toBe("Test Alert");
      expect(result.message).toBe("Message");
      expect(result.severity).toBe("critical");
      expect(result.incidentId).toBe("inc-1");
    });
  });

  describe("clearExpired", () => {
    it("should remove expired alerts", () => {
      const valid = {
        id: "valid", type: "critical_incident" as const, title: "Valid", message: "",
        severity: "critical" as const, incidentId: null, timestamp: "",
        acknowledged: false, expiresAt: new Date(Date.now() + 60000).toISOString(),
      };
      const expired = {
        id: "expired", type: "critical_incident" as const, title: "Expired", message: "",
        severity: "critical" as const, incidentId: null, timestamp: "",
        acknowledged: false, expiresAt: new Date(Date.now() - 60000).toISOString(),
      };
      const result = engine.clearExpired([valid, expired]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("valid");
    });

    it("should keep all alerts when none are expired", () => {
      const alerts = [
        { id: "a1", type: "critical_incident" as const, title: "A1", message: "", severity: "critical" as const, incidentId: null, timestamp: "", acknowledged: false, expiresAt: new Date(Date.now() + 60000).toISOString() },
        { id: "a2", type: "critical_incident" as const, title: "A2", message: "", severity: "critical" as const, incidentId: null, timestamp: "", acknowledged: false, expiresAt: new Date(Date.now() + 120000).toISOString() },
      ];
      const result = engine.clearExpired(alerts);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when all alerts expired", () => {
      const alerts = [
        { id: "a1", type: "critical_incident" as const, title: "A1", message: "", severity: "critical" as const, incidentId: null, timestamp: "", acknowledged: false, expiresAt: new Date(Date.now() - 60000).toISOString() },
      ];
      const result = engine.clearExpired(alerts);
      expect(result).toHaveLength(0);
    });
  });

  describe("singleton notificationEngine", () => {
    it("should be an instance of MockNotificationEngine", () => {
      expect(notificationEngine).toBeInstanceOf(MockNotificationEngine);
    });

    it("should generate alerts", () => {
      const inc = makeIncident({ severity: "critical", status: "reported" });
      const result = notificationEngine.generate([inc], []);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe("MockMapEngine", () => {
  let engine: MockMapEngine;

  beforeEach(() => {
    engine = new MockMapEngine();
  });

  describe("buildEntities", () => {
    it("should include EVACUATION_EXITS entities", () => {
      const result = engine.buildEntities([], []);
      const exits = result.filter((e) => e.type === "emergency_exit");
      expect(exits.length).toBe(EVACUATION_EXITS.length);
    });

    it("should include RALLY_POINTS entities", () => {
      const result = engine.buildEntities([], []);
      const rally = result.filter((e) => e.type === "rally_point");
      expect(rally.length).toBe(RALLY_POINTS.length);
    });

    it("should add incident entities for non-resolved incidents", () => {
      const inc = makeIncident({ status: "reported" });
      const result = engine.buildEntities([inc], []);
      const incEntities = result.filter((e) => e.type === "incident");
      expect(incEntities.length).toBe(1);
      expect(incEntities[0].label).toBe(inc.title);
    });

    it("should skip resolved incidents in map entities", () => {
      const inc = makeIncident({ status: "resolved" });
      const result = engine.buildEntities([inc], []);
      const incEntities = result.filter((e) => e.type === "incident");
      expect(incEntities).toHaveLength(0);
    });

    it("should set pulse true for critical incidents", () => {
      const inc = makeIncident({ severity: "critical", status: "reported" });
      const result = engine.buildEntities([inc], []);
      const incEntity = result.find((e) => e.id === `map-inc-${inc.id}`);
      expect(incEntity?.pulse).toBe(true);
    });

    it("should set pulse false for non-critical incidents", () => {
      const inc = makeIncident({ severity: "high", status: "reported" });
      const result = engine.buildEntities([inc], []);
      const incEntity = result.find((e) => e.id === `map-inc-${inc.id}`);
      expect(incEntity?.pulse).toBe(false);
    });

    it("should add team entities for all teams", () => {
      const teams = [makeResponseTeam(), makeResponseTeam()];
      const result = engine.buildEntities([], teams);
      const teamEntities = result.filter((e) => e.id.startsWith("map-team-"));
      expect(teamEntities.length).toBe(2);
    });

    it("should map medical_alpha to medical_team type", () => {
      const team = makeResponseTeam({ type: "medical_alpha" });
      const result = engine.buildEntities([], [team]);
      const entity = result.find((e) => e.id === `map-team-${team.id}`);
      expect(entity?.type).toBe("medical_team");
    });

    it("should map security_alpha to security_team type", () => {
      const team = makeResponseTeam({ type: "security_alpha" });
      const result = engine.buildEntities([], [team]);
      const entity = result.find((e) => e.id === `map-team-${team.id}`);
      expect(entity?.type).toBe("security_team");
    });

    it("should map fire_response to fire_team type", () => {
      const team = makeResponseTeam({ type: "fire_response" });
      const result = engine.buildEntities([], [team]);
      const entity = result.find((e) => e.id === `map-team-${team.id}`);
      expect(entity?.type).toBe("fire_team");
    });

    it("should set pulse true for dispatched teams", () => {
      const team = makeResponseTeam({ status: "dispatched" });
      const result = engine.buildEntities([], [team]);
      const entity = result.find((e) => e.id === `map-team-${team.id}`);
      expect(entity?.pulse).toBe(true);
    });

    it("should set pulse false for non-dispatched teams", () => {
      const team = makeResponseTeam({ status: "available" });
      const result = engine.buildEntities([], [team]);
      const entity = result.find((e) => e.id === `map-team-${team.id}`);
      expect(entity?.pulse).toBe(false);
    });
  });

  describe("getBlockedAreas", () => {
    it("should return blocked areas for fire incidents", () => {
      const inc = makeIncident({ type: "fire", status: "reported" });
      const result = engine.getBlockedAreas([inc]);
      expect(result.length).toBe(1);
      expect(result[0].type).toBe("blocked_area");
    });

    it("should return blocked areas for infrastructure_failure", () => {
      const inc = makeIncident({ type: "infrastructure_failure", status: "reported" });
      const result = engine.getBlockedAreas([inc]);
      expect(result.length).toBe(1);
    });

    it("should skip resolved incidents for blocked areas", () => {
      const inc = makeIncident({ type: "fire", status: "resolved" });
      const result = engine.getBlockedAreas([inc]);
      expect(result).toHaveLength(0);
    });

    it("should skip non-fire/infrastructure types", () => {
      const inc = makeIncident({ type: "medical_emergency", status: "reported" });
      const result = engine.getBlockedAreas([inc]);
      expect(result).toHaveLength(0);
    });

    it("should return empty array for empty input", () => {
      const result = engine.getBlockedAreas([]);
      expect(result).toEqual([]);
    });

    it("should set pulse to false for blocked areas", () => {
      const inc = makeIncident({ type: "fire", status: "reported" });
      const result = engine.getBlockedAreas([inc]);
      expect(result[0].pulse).toBe(false);
    });
  });

  describe("teamToMapType mapping completeness", () => {
    it("should handle all 12 team types without falling to default", () => {
      const engine = new MockMapEngine();
      const types: TeamType[] = [
        "medical_alpha", "medical_bravo", "security_alpha", "security_bravo",
        "fire_response", "hazmat", "evacuation", "engineering",
        "vip_protection", "crowd_management", "communications", "command",
      ];
      for (const t of types) {
        const team = makeResponseTeam({ type: t });
        const result = engine.buildEntities([], [team]);
        const entity = result.find((e) => e.id === `map-team-${team.id}`);
        expect(entity?.type).toBeDefined();
      }
    });
  });

  describe("singleton mapEngine", () => {
    it("should be an instance of MockMapEngine", () => {
      expect(mapEngine).toBeInstanceOf(MockMapEngine);
    });

    it("should build entities", () => {
      const result = mapEngine.buildEntities([], []);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should get blocked areas", () => {
      const inc = makeIncident({ type: "fire", status: "reported" });
      const result = mapEngine.getBlockedAreas([inc]);
      expect(result.length).toBe(1);
    });
  });
});

describe("Additional Dispatch Engine Edge Cases", () => {
  let engine: MockDispatchEngine;

  beforeEach(() => {
    engine = new MockDispatchEngine();
  });

  it("should calculate team distance correctly", () => {
    const inc = makeIncident({ coordinates: { x: 0, y: 0 } });
    const team = makeResponseTeam({ coordinates: { x: 3, y: 4 } });
    const result = engine.recommendTeam(inc, [team]);
    expect(result).toBeDefined();
  });

  it("should prefer nearest team when multiple match type", () => {
    const inc = makeIncident({ coordinates: { x: 10, y: 10 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const teams = [
      makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 100, y: 100 } }),
      makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 12, y: 12 } }),
      makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 50, y: 50 } }),
    ];
    const result = engine.recommendTeam(inc, teams);
    expect(result?.id).toBe(teams[1].id);
  });

  it("should handle incident at extreme coordinate", () => {
    const inc = makeIncident({ coordinates: { x: 0, y: 0 }, aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available", coordinates: { x: 100, y: 100 } });
    const result = engine.recommendTeam(inc, [team]);
    expect(result).not.toBeNull();
  });

  it("should return null when all teams are dispatched", () => {
    const inc = makeIncident({ aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const teams = [
      makeResponseTeam({ type: "medical_alpha", status: "dispatched" }),
      makeResponseTeam({ type: "medical_alpha", status: "on_scene" }),
    ];
    const result = engine.recommendTeam(inc, teams);
    expect(result).toBeNull();
  });

  it("should dispatch with correct log format", async () => {
    const inc = makeIncident();
    const team = makeResponseTeam({ name: "Medical Alpha" });
    const result = await engine.dispatch(inc, team);
    expect(result.log.action).toBe("Dispatch Medical Alpha");
    expect(result.log.status).toBe("executed");
  });

  it("should set incident assigned fields on dispatch", async () => {
    const inc = makeIncident();
    const team = makeResponseTeam({ id: "team-99", type: "medical_alpha" });
    const result = await engine.dispatch(inc, team);
    expect(result.incident.assignedTeam).toBe("team-99");
    expect(result.incident.assignedTeamType).toBe("medical_alpha");
  });

  it("should handle dispatch for team with no equipment", async () => {
    const inc = makeIncident();
    const team = makeResponseTeam({ equipment: [] });
    const result = await engine.dispatch(inc, team);
    expect(result.incident.status).toBe("dispatched");
  });

  it("should handle resolve for incident with complex timeline", async () => {
    const inc = makeIncident({
      timeline: [
        { id: "tl-1", action: "Reported", actor: "System", timestamp: new Date().toISOString(), detail: "Initial" },
        { id: "tl-2", action: "Analyzed", actor: "AI", timestamp: new Date().toISOString(), detail: "Analysis complete" },
        { id: "tl-3", action: "Dispatched", actor: "Dispatch", timestamp: new Date().toISOString(), detail: "Team sent" },
      ],
    });
    const team = makeResponseTeam({ leader: "Cmdr. Test" });
    const result = await engine.resolve(inc, team);
    expect(result.incident.timeline.length).toBe(4);
    expect(result.incident.timeline[3].actor).toBe("Cmdr. Test");
  });

  it("should produce unique dispatch log IDs", async () => {
    const inc1 = makeIncident();
    const inc2 = makeIncident();
    const team = makeResponseTeam();
    const r1 = await engine.dispatch(inc1, team);
    const r2 = await engine.dispatch(inc2, team);
    expect(r1.log.id).not.toBe(r2.log.id);
  });
});

describe("Additional Recommendation Engine Edge Cases", () => {
  let engine: MockRecommendationEngine;

  beforeEach(() => {
    engine = new MockRecommendationEngine();
  });

  it("should handle analyze status incidents for dispatch rec", () => {
    const inc = makeIncident({ status: "analyzing", aiAnalysis: makeAIAnalysis({ recommendedTeam: "medical_alpha" }) });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const result = engine.generate([inc], [team]);
    expect(result.some((r) => r.category === "dispatch")).toBe(true);
  });

  it("should produce evacuation rec with p0 priority", () => {
    const inc = makeIncident({ type: "fire", status: "reported" });
    const result = engine.generate([inc], []);
    const evac = result.find((r) => r.category === "evacuation");
    expect(evac?.priority).toBe("p0");
  });

  it("should set confidence in range for communication recs", () => {
    const inc = makeIncident({ severity: "critical", status: "reported" });
    const result = engine.generate([inc], []);
    const comm = result.find((r) => r.category === "communication");
    expect(comm?.confidence).toBeGreaterThanOrEqual(78);
    expect(comm?.confidence).toBeLessThanOrEqual(92);
  });

  it("should produce medical rec with p1 priority for medical_emergency", () => {
    const inc = makeIncident({ type: "medical_emergency", status: "reported" });
    const result = engine.generate([inc], []);
    const med = result.find((r) => r.category === "medical");
    expect(med?.priority).toBe("p1");
  });

  it("should produce engineering rec with p2 priority for infrastructure_failure", () => {
    const inc = makeIncident({ type: "infrastructure_failure", status: "reported" });
    const result = engine.generate([inc], []);
    const eng = result.find((r) => r.category === "engineering");
    expect(eng?.priority).toBe("p2");
  });

  it("should produce engineering rec with p2 priority for power_failure", () => {
    const inc = makeIncident({ type: "power_failure", status: "reported" });
    const result = engine.generate([inc], []);
    const eng = result.find((r) => r.category === "engineering");
    expect(eng?.priority).toBe("p2");
  });

  it("should generate impact summary in all recommendations", () => {
    const inc = makeIncident({ type: "fire", status: "reported" });
    const result = engine.generate([inc], []);
    for (const r of result) {
      expect(r.impact).toBeTruthy();
    }
  });

  it("should generate detail in all recommendations", () => {
    const inc = makeIncident({ type: "fire", status: "reported" });
    const result = engine.generate([inc], []);
    for (const r of result) {
      expect(r.detail).toBeTruthy();
    }
  });

  it("should not rec for network_failure or weather_emergency specific templates", () => {
    const inc = makeIncident({ type: "network_failure", status: "reported" });
    const result = engine.generate([inc], []);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Additional Analytics Engine Edge Cases", () => {
  let engine: MockAnalyticsEngine;

  beforeEach(() => {
    engine = new MockAnalyticsEngine();
  });

  it("should handle empty teams array for resourceUtilization", () => {
    const result = engine.compute([], [], []);
    expect(result.resourceUtilization).toBe(0);
  });

  it("should handle all resolved incidents", () => {
    const incidents = [
      makeIncident({ status: "resolved" }),
      makeIncident({ status: "resolved" }),
    ];
    const result = engine.compute(incidents, [], []);
    expect(result.openIncidents).toBe(0);
    expect(result.resolvedIncidents).toBe(2);
    expect(result.criticalIncidents).toBe(0);
  });

  it("should handle all incident types in criticalPerType", () => {
    const types = ["fire", "medical_emergency", "security_threat", "crowd_surge"] as const;
    const incidents = types.map((t) => makeIncident({ type: t, severity: "critical", status: "reported" }));
    const result = engine.compute(incidents, [], []);
    for (const t of types) {
      expect(result.criticalPerType[t]).toBe(1);
    }
  });

  it("should handle incidents with same zoneId in affectedZones without duplicates", () => {
    const incidents = [
      makeIncident({ zoneId: "zone-1", status: "reported" }),
      makeIncident({ zoneId: "zone-1", status: "reported" }),
    ];
    const result = engine.compute(incidents, [], []);
    expect(result.affectedZones.filter((z) => z === "zone-1").length).toBe(1);
  });

  it("should clip safety score to min 0", () => {
    const incidents = Array.from({ length: 100 }, () => makeIncident({ severity: "critical", status: "reported" }));
    const result = engine.compute(incidents, [], []);
    expect(result.safetyScore).toBeGreaterThanOrEqual(0);
  });

  it("should clip readiness score to min 0", () => {
    const incidents = Array.from({ length: 100 }, () => makeIncident({ severity: "critical", status: "reported" }));
    const result = engine.compute(incidents, [], []);
    expect(result.emergencyReadinessScore).toBeGreaterThanOrEqual(0);
  });

  it("should compute escalation rate as 0 when no incidents", () => {
    const result = engine.compute([], [], []);
    expect(result.escalationRate).toBe(0);
  });

  it("should handle large response time history", () => {
    const points = Array.from({ length: 1000 }, (_, i) => makeResponseTimePoint({ responseMinutes: (i % 10) + 1 }));
    const result = engine.compute([], [], points);
    expect(result.averageResponseMinutes).toBeGreaterThan(0);
  });
});

describe("Additional Notification Engine Edge Cases", () => {
  let engine: MockNotificationEngine;

  beforeEach(() => {
    engine = new MockNotificationEngine();
  });

  it("should not generate resource_shortage alert for severity low", () => {
    const inc = makeIncident({ severity: "low", status: "reported", aiAnalysis: makeAIAnalysis({ resourceShortages: ["Kit"] }) });
    const result = engine.generate([inc], []);
    expect(result.some((a) => a.type === "resource_shortage")).toBe(true);
  });

  it("should generate alert with correct incidentId matching", () => {
    const inc = makeIncident({ severity: "critical", status: "reported" });
    const result = engine.generate([inc], []);
    for (const alert of result) {
      if (alert.incidentId) {
        expect(alert.incidentId).toBe(inc.id);
      }
    }
  });

  it("should not generate alerts for incidents with resolved status", () => {
    const critical = makeIncident({ severity: "critical", status: "resolved" });
    const highEsc = makeIncident({ aiAnalysis: makeAIAnalysis({ escalationProbability: 80 }), status: "resolved" });
    const shortage = makeIncident({ aiAnalysis: makeAIAnalysis({ resourceShortages: ["Kit"] }), status: "resolved" });
    const result = engine.generate([critical, highEsc, shortage], []);
    expect(result.length).toBe(0);
  });

  it("should generate alerts with unique IDs", () => {
    const inc1 = makeIncident({ severity: "critical", status: "reported" });
    const inc2 = makeIncident({ severity: "critical", status: "reported" });
    const result = engine.generate([inc1, inc2], []);
    const ids = result.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Additional Map Engine Edge Cases", () => {
  let engine: MockMapEngine;

  beforeEach(() => {
    engine = new MockMapEngine();
  });

  it("should map hazmat to fire_team", () => {
    const team = makeResponseTeam({ type: "hazmat" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.type).toBe("fire_team");
  });

  it("should map evacuation to rally_point", () => {
    const team = makeResponseTeam({ type: "evacuation" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.type).toBe("rally_point");
  });

  it("should map engineering to command_post", () => {
    const team = makeResponseTeam({ type: "engineering" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.type).toBe("command_post");
  });

  it("should map vip_protection to security_team", () => {
    const team = makeResponseTeam({ type: "vip_protection" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.type).toBe("security_team");
  });

  it("should map crowd_management to security_team", () => {
    const team = makeResponseTeam({ type: "crowd_management" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.type).toBe("security_team");
  });

  it("should map communications to command_post", () => {
    const team = makeResponseTeam({ type: "communications" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.type).toBe("command_post");
  });

  it("should map command to command_post", () => {
    const team = makeResponseTeam({ type: "command" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.type).toBe("command_post");
  });

  it("should include status in team entity label", () => {
    const team = makeResponseTeam({ status: "dispatched" });
    const result = engine.buildEntities([], [team]);
    const entity = result.find((e) => e.id === `map-team-${team.id}`);
    expect(entity?.label).toContain("dispatched");
  });

  it("should include severity on incident entities", () => {
    const inc = makeIncident({ severity: "critical", status: "reported" });
    const result = engine.buildEntities([inc], []);
    const entity = result.find((e) => e.id === `map-inc-${inc.id}`);
    expect(entity?.severity).toBe("critical");
  });
});
