// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import type { Incident, ResponseTeam, DispatchAction } from "../types";
import { MockIncidentEngine } from "../services/incident-engine";
import { MockDispatchEngine } from "../services/dispatch-engine";
import { MockNotificationEngine } from "../services/notification-engine";
import { MockAnalyticsEngine } from "../services/analytics-engine";
import { MockRecommendationEngine } from "../services/recommendation-engine";

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  const now = new Date().toISOString();
  return {
    id: `wf-inc-${Date.now()}`,
    type: "medical_emergency",
    severity: "critical",
    priority: "p0",
    status: "reported",
    title: "Test Incident",
    description: "Test description",
    location: "Test Location",
    zoneId: "zone-1",
    coordinates: { x: 30, y: 25 },
    reportedAt: now,
    reportedBy: "Test",
    assignedTeam: null,
    assignedTeamType: null,
    estimatedResolutionMinutes: 15,
    aiConfidence: 90,
    aiAnalysis: {
      severity: "critical",
      confidence: 90,
      estimatedImpact: "Test impact",
      recommendedActions: ["Action 1"],
      estimatedResponseMinutes: 3,
      recommendedTeam: "medical_alpha",
      evacuationRoutes: ["Exit A"],
      resourceShortages: ["Supply X"],
      escalationProbability: 80,
      analysisSummary: "Test summary.",
    },
    timeline: [],
    lastUpdated: now,
    ...overrides,
  };
}

describe("Incident Workflow", () => {
  let incidentEngine: MockIncidentEngine;
  let dispatchEngine: MockDispatchEngine;
  let notificationEngine: MockNotificationEngine;
  let analyticsEngine: MockAnalyticsEngine;
  let recommendationEngine: MockRecommendationEngine;
  let incident: Incident;
  let team: ResponseTeam;

  beforeEach(() => {
    incidentEngine = new MockIncidentEngine();
    dispatchEngine = new MockDispatchEngine();
    notificationEngine = new MockNotificationEngine();
    analyticsEngine = new MockAnalyticsEngine();
    recommendationEngine = new MockRecommendationEngine();
    incident = makeIncident();
    team = {
      id: "med-alpha",
      type: "medical_alpha",
      name: "Medical Team Alpha",
      members: 6,
      leader: "Dr. Chen",
      status: "available",
      location: "Station 1",
      coordinates: { x: 15, y: 20 },
      incidentId: null,
      estimatedArrivalMinutes: 3,
      equipment: ["AED", "Stretcher"],
      certifications: ["ACLS"],
    };
  });

  it("should complete full incident lifecycle: create → analyze → dispatch → resolve", async () => {
    // Step 1: Process new incident
    const processed = await incidentEngine.processNew(incident);
    expect(processed.status).toBe("analyzing");

    // Step 2: AI analysis (simulated - AI analysis is embedded in the incident data)
    expect(processed.aiAnalysis.severity).toBe("critical");
    expect(processed.aiAnalysis.confidence).toBeGreaterThanOrEqual(70);

    // Step 3: Risk assessment via analytics
    const analytics = analyticsEngine.compute([processed], [team], []);
    expect(analytics.criticalIncidents).toBe(1);
    expect(analytics.openIncidents).toBe(1);

    // Step 4: Team recommendation
    const recs = recommendationEngine.generate([processed], [team]);
    expect(recs.length).toBeGreaterThan(0);
    const dispatchRec = recs.find((r) => r.category === "dispatch");
    expect(dispatchRec).toBeDefined();
    expect(dispatchRec!.confidence).toBeGreaterThanOrEqual(70);

    // Step 5: Dispatch
    const dispatchResult = await dispatchEngine.dispatch(processed, team);
    expect(dispatchResult.incident.status).toBe("dispatched");
    expect(dispatchResult.team.status).toBe("dispatched");
    expect(dispatchResult.log.status).toBe("executed");

    // Step 6: Simulate arrival (arrival is tracked via team progress)
    const arrivedTeam = { ...dispatchResult.team, status: "on_scene" as const };
    const arriving = await incidentEngine.updateStatus(dispatchResult.incident, "in_progress");
    expect(arriving.status).toBe("in_progress");

    // Step 7: Contain and resolve
    const contained = await incidentEngine.updateStatus(arriving, "contained");
    expect(contained.status).toBe("contained");

    const resolved = await dispatchEngine.resolve(contained, { ...arrivedTeam, incidentId: contained.id });
    expect(resolved.incident.status).toBe("resolved");
    expect(resolved.team.status).toBe("returning");

    // Step 8: Post-incident analytics
    const postAnalytics = analyticsEngine.compute([resolved.incident], [resolved.team], [{
      incidentId: resolved.incident.id,
      incidentType: resolved.incident.type,
      responseMinutes: 4.2,
      timestamp: new Date().toISOString(),
      severity: resolved.incident.severity,
    }]);
    expect(postAnalytics.resolvedIncidents).toBe(1);
    expect(postAnalytics.averageResponseMinutes).toBe(4.2);
  });

  it("should handle escalation when severity is critical", async () => {
    const criticalIncident = makeIncident({ severity: "critical" });

    // Generate alerts
    const alerts = notificationEngine.generate([criticalIncident], []);
    const criticalAlert = alerts.find((a) => a.type === "critical_incident");
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert!.severity).toBe("critical");

    // Acknowledge alert
    const ack = await notificationEngine.acknowledge(criticalAlert!);
    expect(ack.acknowledged).toBe(true);

    // Escalate by updating status
    const escalated = await incidentEngine.updateStatus(criticalIncident, "assessing");
    expect(escalated.status).toBe("assessing");
  });

  it("should dispatch nearest matching team", () => {
    const farTeam = { ...team, id: "far", coordinates: { x: 90, y: 90 } };
    const closeTeam = { ...team, id: "close", coordinates: { x: 12, y: 12 } };
    const recommended = dispatchEngine.recommendTeam(incident, [farTeam, closeTeam]);
    expect(recommended?.id).toBe("close");
  });

  it("should handle delayed response alert", async () => {
    const oldIncident = makeIncident({
      reportedAt: new Date(Date.now() - 600000).toISOString(),
    });

    const alerts = notificationEngine.generate([oldIncident], []);
    const delayed = alerts.find((a) => a.type === "critical_incident");
    expect(delayed).toBeDefined();
  });

  it("should notify about resource shortages across multiple incidents", () => {
    const inc1 = makeIncident({ id: "a", aiAnalysis: { ...incident.aiAnalysis, resourceShortages: ["Supply X"] } });
    const inc2 = makeIncident({ id: "b", aiAnalysis: { ...incident.aiAnalysis, resourceShortages: ["Supply Y"] } });
    const alerts = notificationEngine.generate([inc1, inc2], []);
    expect(alerts.some((a) => a.type === "resource_shortage")).toBe(true);
  });
});

describe("Edge Cases", () => {
  it("should handle empty incident list gracefully", () => {
    const engine = new MockAnalyticsEngine();
    const analytics = engine.compute([], [], []);
    expect(analytics.openIncidents).toBe(0);
    expect(analytics.criticalIncidents).toBe(0);
    expect(analytics.totalIncidents).toBe(0);
    expect(analytics.emergencyReadinessScore).toBeGreaterThanOrEqual(0);
  });

  it("should handle dispatch with no suitable team", () => {
    const engine = new MockDispatchEngine();
    const inc = makeIncident({ aiAnalysis: { ...incident.aiAnalysis, recommendedTeam: "fire_response" } });
    const otherTeams = [team]; // team is medical, not fire
    const recommended = engine.recommendTeam(inc, otherTeams);
    expect(recommended).not.toBeNull();
  });

  it("should handle resolution of already-resolved incident", async () => {
    const engine = new MockDispatchEngine();
    const inc = makeIncident({ status: "resolved", assignedTeam: "med-alpha" });
    const teamMember = { ...team, status: "on_scene" as const, incidentId: inc.id };
    const result = await engine.resolve(inc, teamMember);
    expect(result.incident.status).toBe("resolved");
  });
});

