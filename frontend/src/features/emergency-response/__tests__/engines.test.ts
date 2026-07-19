import { describe, it, expect } from "vitest";
import type { Incident, IncidentType, Severity, ResponseTeam, EmergencyAnalytics, ResponseTimePoint } from "../types";
import { TEAM_CONFIGS, INCIDENT_TYPE_CONFIG, RESPONSE_THRESHOLDS, EVACUATION_EXITS, RALLY_POINTS } from "../constants";
import { MockIncidentEngine } from "../services/incident-engine";
import { MockDispatchEngine } from "../services/dispatch-engine";
import { MockNotificationEngine } from "../services/notification-engine";
import { MockAnalyticsEngine } from "../services/analytics-engine";
import { MockMapEngine } from "../services/map-engine";
import { MockRecommendationEngine } from "../services/recommendation-engine";

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  const now = new Date().toISOString();
  return {
    id: "test-inc-001",
    type: "medical_emergency" as IncidentType,
    severity: "high" as Severity,
    priority: "p1" as const,
    status: "reported",
    title: "Medical Emergency — East Stand Lower",
    description: "Spectator collapsed in East Stand lower section.",
    location: "East Stand Lower",
    zoneId: "zone-1",
    coordinates: { x: 30, y: 25 },
    reportedAt: now,
    reportedBy: "CCTV Monitoring",
    assignedTeam: null,
    assignedTeamType: null,
    estimatedResolutionMinutes: 15,
    aiConfidence: 88,
    aiAnalysis: {
      severity: "high",
      confidence: 88,
      estimatedImpact: "Fan health at risk.",
      recommendedActions: ["Isolate East Stand Lower", "Divert foot traffic"],
      estimatedResponseMinutes: 4,
      recommendedTeam: "medical_alpha",
      evacuationRoutes: ["North Exit", "Gate A Exit"],
      resourceShortages: ["Advanced Life Support Supplies"],
      escalationProbability: 45,
      analysisSummary: "Medical emergency detected at East Stand Lower. Severity HIGH.",
    },
    timeline: [],
    lastUpdated: now,
    ...overrides,
  };
}

function makeTeam(overrides: Partial<ResponseTeam> = {}): ResponseTeam {
  return {
    ...TEAM_CONFIGS[0]!,
    ...overrides,
  };
}

describe("IncidentEngine", () => {
  const engine = new MockIncidentEngine();

  it("should process a new incident and set status to analyzing", async () => {
    const inc = makeIncident();
    const result = await engine.processNew(inc);
    expect(result.status).toBe("analyzing");
    expect(result.timeline.length).toBe(inc.timeline.length + 1);
    expect(result.timeline[result.timeline.length - 1]!.action).toContain("Incident Processing");
  });

  it("should update incident status", async () => {
    const inc = makeIncident();
    const result = await engine.updateStatus(inc, "dispatched");
    expect(result.status).toBe("dispatched");
    expect(result.lastUpdated).not.toBe(inc.lastUpdated);
  });

  it("should triage incidents by severity and recency", () => {
    const old = makeIncident({ id: "old", severity: "low", reportedAt: new Date(Date.now() - 60000).toISOString() });
    const critical = makeIncident({ id: "critical", severity: "critical", reportedAt: new Date().toISOString() });
    const recent = makeIncident({ id: "recent", severity: "low", reportedAt: new Date(Date.now() - 10000).toISOString() });
    const sorted = engine.triageBySeverity([old, recent, critical]);
    expect(sorted[0]!.id).toBe("critical");
    expect(sorted[1]!.id).toBe("recent");
    expect(sorted[2]!.id).toBe("old");
  });
});

describe("DispatchEngine", () => {
  const engine = new MockDispatchEngine();

  it("should recommend the closest available team of matching type", () => {
    const inc = makeIncident({ coordinates: { x: 10, y: 10 } });
    const farTeam = makeTeam({ id: "far", type: "medical_alpha", coordinates: { x: 90, y: 90 }, status: "available" });
    const closeTeam = makeTeam({ id: "close", type: "medical_alpha", coordinates: { x: 12, y: 12 }, status: "available" });
    const recommended = engine.recommendTeam(inc, [farTeam, closeTeam]);
    expect(recommended?.id).toBe("close");
  });

  it("should return null if no teams available", () => {
    const inc = makeIncident();
    const busy = makeTeam({ status: "dispatched" });
    expect(engine.recommendTeam(inc, [busy])).toBeNull();
  });

  it("should dispatch team and update incident + team status", async () => {
    const inc = makeIncident();
    const team = makeTeam();
    const result = await engine.dispatch(inc, team);
    expect(result.incident.status).toBe("dispatched");
    expect(result.team.status).toBe("dispatched");
    expect(result.team.incidentId).toBe(inc.id);
    expect(result.log.status).toBe("executed");
    expect(result.log.action).toContain("Dispatch");
  });

  it("should resolve incident and free the team", async () => {
    const inc = makeIncident({ status: "in_progress", assignedTeam: "med-alpha" });
    const team = makeTeam({ status: "on_scene", incidentId: inc.id });
    const result = await engine.resolve(inc, team);
    expect(result.incident.status).toBe("resolved");
    expect(result.team.status).toBe("returning");
    expect(result.team.incidentId).toBeNull();
    expect(result.log.action).toBe("Resolve Incident");
  });
});

describe("NotificationEngine", () => {
  const engine = new MockNotificationEngine();

  it("should generate critical incident alert for critical severity", () => {
    const inc = makeIncident({ severity: "critical" });
    const alerts = engine.generate([inc], []);
    expect(alerts.some((a) => a.type === "critical_incident")).toBe(true);
  });

  it("should generate escalation alert when probability > 75", () => {
    const inc = makeIncident({
      aiAnalysis: { ...makeIncident().aiAnalysis, escalationProbability: 85 },
    });
    const alerts = engine.generate([inc], []);
    expect(alerts.some((a) => a.type === "escalating_event")).toBe(true);
  });

  it("should generate resource shortage alert when shortages exist", () => {
    const inc = makeIncident({
      aiAnalysis: { ...makeIncident().aiAnalysis, resourceShortages: ["O2 Tanks"] },
    });
    const alerts = engine.generate([inc], []);
    expect(alerts.some((a) => a.type === "resource_shortage")).toBe(true);
  });

  it("should not generate duplicate alerts", () => {
    const inc = makeIncident({ severity: "critical" });
    const existing = [{
      id: "existing", type: "critical_incident" as const, title: "", message: "",
      severity: "critical" as const, incidentId: inc.id, timestamp: "", acknowledged: false,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }];
    const alerts = engine.generate([inc], existing);
    expect(alerts.filter((a) => a.type === "critical_incident").length).toBe(0);
  });

  it("should acknowledge an alert", async () => {
    const alert = {
      id: "test-alert", type: "critical_incident" as const, title: "Test", message: "Test",
      severity: "critical" as const, incidentId: null, timestamp: "", acknowledged: false,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    };
    const ack = await engine.acknowledge(alert);
    expect(ack.acknowledged).toBe(true);
  });

  it("should clear expired alerts", () => {
    const expired = {
      id: "expired", type: "critical_incident" as const, title: "", message: "",
      severity: "critical" as const, incidentId: null, timestamp: "", acknowledged: false,
      expiresAt: new Date(Date.now() - 10000).toISOString(),
    };
    const valid = {
      id: "valid", type: "critical_incident" as const, title: "", message: "",
      severity: "critical" as const, incidentId: null, timestamp: "", acknowledged: false,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    };
    const remaining = engine.clearExpired([expired, valid]);
    expect(remaining.length).toBe(1);
    expect(remaining[0]!.id).toBe("valid");
  });
});

describe("AnalyticsEngine", () => {
  const engine = new MockAnalyticsEngine();

  it("should compute analytics from incidents and teams", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "critical", status: "reported" }),
      makeIncident({ id: "2", severity: "high", status: "dispatched" }),
      makeIncident({ id: "3", severity: "low", status: "resolved" }),
    ];
    const teams = [
      makeTeam({ id: "t1", status: "dispatched" }),
      makeTeam({ id: "t2", status: "available" }),
      makeTeam({ id: "t3", status: "available" }),
    ];
    const responseTimes: ResponseTimePoint[] = [
      { incidentId: "1", incidentType: "medical_emergency", responseMinutes: 4.5, timestamp: "", severity: "critical" },
    ];
    const result: EmergencyAnalytics = engine.compute(incidents, teams, responseTimes);
    expect(result.openIncidents).toBe(2);
    expect(result.criticalIncidents).toBe(1);
    expect(result.resolvedIncidents).toBe(1);
    expect(result.totalIncidents).toBe(3);
    expect(result.activeTeams).toBe(1);
    expect(result.availableTeams).toBe(2);
    expect(result.averageResponseMinutes).toBe(4.5);
    expect(result.emergencyReadinessScore).toBeGreaterThan(0);
    expect(result.safetyScore).toBeGreaterThan(0);
    expect(result.communicationStatus).toBe("operational");
  });

  it("should record response time point", () => {
    const inc = makeIncident();
    const point = engine.recordResponseTime(inc, 3.2);
    expect(point.incidentId).toBe(inc.id);
    expect(point.responseMinutes).toBe(3.2);
    expect(point.severity).toBe(inc.severity);
  });
});

describe("MapEngine", () => {
  const engine = new MockMapEngine();

  it("should build map entities from incidents and teams", () => {
    const inc = makeIncident({ status: "reported" });
    const team = makeTeam();
    const entities = engine.buildEntities([inc], [team]);
    expect(entities.length).toBeGreaterThan(EVACUATION_EXITS.length + RALLY_POINTS.length);
    expect(entities.some((e) => e.type === "incident")).toBe(true);
    expect(entities.some((e) => e.type === "medical_team")).toBe(true);
  });

  it("should not include resolved incidents", () => {
    const inc = makeIncident({ status: "resolved" });
    const entities = engine.buildEntities([inc], []);
    expect(entities.filter((e) => e.type === "incident").length).toBe(0);
  });

  it("should identify blocked areas from fire and infrastructure incidents", () => {
    const fire = makeIncident({ id: "fire", type: "fire", status: "in_progress" });
    const medical = makeIncident({ id: "med", type: "medical_emergency", status: "in_progress" });
    const blocked = engine.getBlockedAreas([fire, medical]);
    expect(blocked.length).toBe(1);
    expect(blocked[0]!.type).toBe("blocked_area");
  });
});

describe("RecommendationEngine", () => {
  const engine = new MockRecommendationEngine();

  it("should generate dispatch recommendations for unreported incidents", () => {
    const inc = makeIncident({ status: "reported" });
    const team = makeTeam({ type: "medical_alpha", status: "available" });
    const recs = engine.generate([inc], [team]);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.category === "dispatch")).toBe(true);
  });

  it("should generate evacuation recommendations for fire incidents", () => {
    const inc = makeIncident({ id: "fire", type: "fire", status: "reported" });
    const recs = engine.generate([inc], []);
    expect(recs.some((r) => r.category === "evacuation")).toBe(true);
  });

  it("should generate communication recommendations for high severity", () => {
    const inc = makeIncident({ severity: "critical", status: "reported" });
    const recs = engine.generate([inc], []);
    expect(recs.some((r) => r.category === "communication")).toBe(true);
  });

  it("should skip resolved incidents", () => {
    const inc = makeIncident({ status: "resolved" });
    const recs = engine.generate([inc], []);
    expect(recs.length).toBe(0);
  });

  it("should sort recommendations by priority", () => {
    const critical = makeIncident({ id: "c1", severity: "critical", status: "reported" });
    const low = makeIncident({ id: "l1", severity: "low", status: "reported" });
    const recs = engine.generate([critical, low], []);
    const p0s = recs.filter((r) => r.priority === "p0");
    const p3s = recs.filter((r) => r.priority === "p3");
    if (p0s.length > 0 && p3s.length > 0) {
      expect(recs.indexOf(p0s[0]!)).toBeLessThan(recs.indexOf(p3s[0]!));
    }
  });
});

describe("Constants", () => {
  it("should have all 12 incident types configured", () => {
    expect(Object.keys(INCIDENT_TYPE_CONFIG).length).toBe(12);
  });

  it("should have 12 response teams configured", () => {
    expect(TEAM_CONFIGS.length).toBe(12);
  });

  it("should have response thresholds defined", () => {
    expect(RESPONSE_THRESHOLDS.criticalResponseTargetMinutes).toBeGreaterThan(0);
    expect(RESPONSE_THRESHOLDS.maxConcurrentCritical).toBeGreaterThan(0);
  });

  it("should have evacuation exits and rally points", () => {
    expect(EVACUATION_EXITS.length).toBeGreaterThanOrEqual(4);
    expect(RALLY_POINTS.length).toBeGreaterThanOrEqual(4);
  });
});

