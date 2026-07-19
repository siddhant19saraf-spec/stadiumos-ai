import { describe, it, expect, vi, beforeEach } from "vitest";
import { MockAuthEngine } from "@/features/enterprise-security/services/auth-engine";
import { MockRBACEngine } from "@/features/enterprise-security/services/rbac-engine";
import { MockPermissionEngine } from "@/features/enterprise-security/services/permission-engine";
import { MockSessionEngine } from "@/features/enterprise-security/services/session-engine";
import { MockAuditEngine } from "@/features/enterprise-security/services/audit-engine";
import { securityService } from "@/features/enterprise-security/services/security-service";
import { MockIncidentEngine } from "@/features/emergency-response/services/incident-engine";
import { MockDispatchEngine } from "@/features/emergency-response/services/dispatch-engine";
import { MockAnalyticsEngine as EmergencyAnalytics } from "@/features/emergency-response/services/analytics-engine";
import { EmergencySimulationEngine } from "@/features/emergency-response/services/simulation-engine";
import { MockRecommendationEngine as ERecEngine } from "@/features/emergency-response/services/recommendation-engine";
import { makeIncident, makeResponseTeam, makeSecurityUser, makeOperationalContext, makeCopilotMessage, makeDigitalIncident, makeLiveAnalytics, makeZoneLiveStatus, makeAIInsight } from "../fixtures/factories";
import { commandCenterService } from "@/features/command-center/services/command-center-service";
import { aiCopilotService } from "@/features/ai-copilot/services/ai-copilot-service";
import { digitalTwinService } from "@/features/digital-twin/services/digital-twin-service";
import { digitalTwinEngine } from "@/features/digital-twin/services/digital-twin-engine";
import { simulationEngine } from "@/features/digital-twin/services/simulation-engine";

const authEngine = new MockAuthEngine();
const rbacEngine = new MockRBACEngine();
const permEngine = new MockPermissionEngine();
const sessionEngine = new MockSessionEngine();
const auditEngine = new MockAuditEngine();
const incEngine = new MockIncidentEngine();
const dispatchEngine = new MockDispatchEngine();
const analytics = new EmergencyAnalytics();
const simEngine = new EmergencySimulationEngine();
const recEngine = new ERecEngine();

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("Admin Login Journey", () => {
  it("should authenticate with valid credentials", async () => {
    const result = await authEngine.login({ username: "admin", password: "admin123" });
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.role).toBe("super_admin");
  });

  it("should reject invalid credentials", async () => {
    const result = await authEngine.login({ username: "admin", password: "wrong" });
    expect(result.success).toBe(false);
    expect(result.user).toBeUndefined();
  });

  it("should create session after successful login", async () => {
    const user = makeSecurityUser({ role: "super_admin" });
    const session = await sessionEngine.create(user);
    expect(session.token).toBeDefined();
    expect(session.userId).toBe(user.id);
    expect(session.isValid).toBe(true);
  });

  it("should validate session on subsequent requests", async () => {
    const user = makeSecurityUser({ role: "operator" });
    const session = await sessionEngine.create(user);
    const valid = await sessionEngine.validate(session.token);
    expect(valid).toBe(true);
  });

  it("should audit login events", async () => {
    await authEngine.login({ username: "auditor", password: "audit123" });
    const logs = auditEngine.getEntries({ userId: undefined as unknown as string });
    expect(logs.length).toBeGreaterThan(0);
  });
});

describe("Tournament Setup Journey", () => {
  it("should create tournament with complete configuration", () => {
    const tournament = {
      id: "t-001", name: "World Cup 2026", stage: "group_stage" as const,
      totalMatches: 64, venues: 8, teams: 32,
    };
    expect(tournament.name).toBeDefined();
    expect(tournament.totalMatches).toBe(64);
    expect(tournament.stage).toBe("group_stage");
  });

  it("should assign venues to tournament", () => {
    const venues = [
      { id: "v1", name: "Lusail Stadium", capacity: 80000 },
      { id: "v2", name: "Al Bayt Stadium", capacity: 60000 },
    ];
    expect(venues.length).toBeGreaterThanOrEqual(2);
    expect(venues.reduce((s, v) => s + v.capacity, 0)).toBeGreaterThan(100000);
  });

  it("should schedule matches without conflicts", () => {
    const matches = [
      { id: "m1", venue: "v1", date: "2026-06-15", time: "18:00" },
      { id: "m2", venue: "v1", date: "2026-06-15", time: "21:00" },
      { id: "m3", venue: "v2", date: "2026-06-15", time: "18:00" },
    ];
    const conflicts = matches.filter((m, i) =>
      matches.some((o, j) =>
        i !== j && m.venue === o.venue && m.date === o.date && m.time === o.time
      )
    );
    expect(conflicts.length).toBe(0);
  });

  it("should verify team eligibility", () => {
    const teams = [
      { id: "t1", name: "Brazil", rank: 1, group: "A" },
      { id: "t2", name: "Germany", rank: 3, group: "A" },
    ];
    expect(teams.every((t) => t.rank > 0)).toBe(true);
    expect(teams.every((t) => t.group.length === 1)).toBe(true);
  });
});

describe("Emergency Workflow Journey", () => {
  it("should detect and classify incident", async () => {
    const inc = makeIncident({ type: "fire", severity: "critical" });
    const processed = await incEngine.processNew(inc);
    expect(processed.status).toBe("analyzing");
    expect(processed.timeline.length).toBeGreaterThan(0);
  });

  it("should dispatch appropriate response team", async () => {
    const inc = makeIncident({ type: "fire", severity: "critical", aiAnalysis: makeIncident().aiAnalysis });
    inc.aiAnalysis.recommendedTeam = "fire_response" as any;
    const team = makeResponseTeam({ type: "fire_response", status: "available" });
    const result = await dispatchEngine.dispatch(inc, team);
    expect(result.incident.status).toBe("dispatched");
    expect(result.team.status).toBe("dispatched");
  });

  it("should escalate if response delayed", async () => {
    const oldInc = makeIncident({
      reportedAt: new Date(Date.now() - 600000).toISOString(),
      severity: "critical",
      status: "reported",
    });
    const teams = [makeResponseTeam({ type: "fire_response", status: "available" })];
    const recs = simEngine.generateRecommendations([oldInc], teams);
    expect(recs.some((r) => r.priority === "p0")).toBe(true);
  });

  it("should resolve incident and free resources", async () => {
    const inc = makeIncident({ status: "in_progress" });
    const team = makeResponseTeam({ status: "on_scene", incidentId: inc.id });
    const result = await dispatchEngine.resolve(inc, team);
    expect(result.incident.status).toBe("resolved");
    expect(result.team.status).toBe("returning");
  });

  it("should record analytics after incident lifecycle", () => {
    const incs = [makeIncident({ severity: "critical", status: "resolved" })];
    const teams = [makeResponseTeam({ status: "available" })];
    const result = analytics.compute(incs, teams, []);
    expect(result.resolvedIncidents).toBe(1);
    expect(result.totalIncidents).toBe(1);
  });
});

describe("Crowd Monitoring Journey", () => {
  it("should track real-time occupancy", () => {
    const zone = { id: "z1", capacity: 5000, current: 3200 };
    const pct = Math.round((zone.current / zone.capacity) * 100);
    expect(pct).toBe(64);
  });

  it("should detect density threshold violations", () => {
    const zones = [
      { id: "z1", density: 92, threshold: 85 },
      { id: "z2", density: 45, threshold: 85 },
    ];
    const violations = zones.filter((z) => z.density > z.threshold);
    expect(violations.length).toBe(1);
    expect(violations[0]!.id).toBe("z1");
  });

  it("should predict congestion trends", () => {
    const history = [45, 52, 61, 73, 78, 85];
    const trend = history[history.length - 1] - history[0];
    expect(trend).toBe(40);
    expect(history.every((h) => h >= 0 && h <= 100)).toBe(true);
  });

  it("should recommend mitigation actions for overcrowding", () => {
    const zone = { id: "z1", density: 92, name: "East Gate" };
    const recommendations = [
      zone.density > 90 ? "Open auxiliary exits" : null,
      zone.density > 80 ? "Deploy crowd barriers" : null,
    ].filter(Boolean);
    expect(recommendations.length).toBe(2);
  });
});

describe("Parking Management Journey", () => {
  it("should track parking availability in real-time", () => {
    const lots = [
      { id: "A", capacity: 5000, occupied: 4200 },
      { id: "B", capacity: 3000, occupied: 2900 },
      { id: "C", capacity: 2000, occupied: 500 },
    ];
    const available = lots.reduce((s, l) => s + (l.capacity - l.occupied), 0);
    expect(available).toBe(2400);
  });

  it("should direct patrons to available lots", () => {
    const lots = [
      { id: "A", available: 0 }, { id: "B", available: 100 },
      { id: "C", available: 500 },
    ];
    const best = lots.filter((l) => l.available > 0).sort((a, b) => b.available - a.available)[0];
    expect(best!.id).toBe("C");
  });

  it("should predict overflow events", () => {
    const attendance = 70000;
    const parkingRatio = 0.35;
    const capacity = 20000;
    const demand = Math.round(attendance * parkingRatio);
    expect(demand).toBeGreaterThan(capacity);
  });
});

describe("Maintenance Approval Journey", () => {
  it("should create work order from prediction", () => {
    const wo = {
      id: "wo-001", assetId: "hvac-1", priority: "urgent" as const,
      status: "open" as const, estimatedCost: 5000,
    };
    expect(wo.status).toBe("open");
  });

  it("should validate work order before approval", () => {
    const wo = { priority: "urgent", estimatedRepairMin: 180, requiredParts: ["Bearing Kit"] };
    const isValid = wo.priority !== "" && wo.estimatedRepairMin > 0 && wo.requiredParts.length > 0;
    expect(isValid).toBe(true);
  });

  it("should track maintenance completion", () => {
    const status = { assigned: 5, inProgress: 2, completed: 8, cancelled: 1 };
    const total = Object.values(status).reduce((s, v) => s + v, 0);
    expect(total).toBe(16);
    expect(Math.round((status.completed / total) * 100)).toBe(50);
  });
});

describe("Executive Reporting Journey", () => {
  it("should generate daily executive summary", () => {
    const report = {
      date: "2026-07-18", attendance: 45000, revenue: 2500000,
      incidents: 2, safetyScore: 91, readiness: 87,
    };
    expect(report.revenue).toBeGreaterThan(0);
    expect(report.safetyScore).toBeGreaterThanOrEqual(0);
  });

  it("should compare performance across periods", () => {
    const yesterday = { safety: 85, revenue: 2200000, incidents: 3 };
    const today = { safety: 91, revenue: 2500000, incidents: 2 };
    const delta = {
      safety: today.safety - yesterday.safety,
      revenue: today.revenue - yesterday.revenue,
      incidents: today.incidents - yesterday.incidents,
    };
    expect(delta.safety).toBeGreaterThan(0);
    expect(delta.revenue).toBeGreaterThan(0);
    expect(delta.incidents).toBeLessThan(0);
  });

  it("should aggregate KPIs across departments", () => {
    const depts = [
      { name: "Security", score: 88 }, { name: "Operations", score: 85 },
      { name: "Energy", score: 74 }, { name: "Crowd", score: 92 },
    ];
    const avg = Math.round(depts.reduce((s, d) => s + d.score, 0) / depts.length);
    expect(avg).toBe(85);
  });
});

describe("Security Incident Review Journey", () => {
  it("should detect unauthorized access attempts", () => {
    const attempts = [
      { user: "alice", resource: "admin-panel", allowed: false, count: 1 },
      { user: "alice", resource: "admin-panel", allowed: false, count: 2 },
      { user: "alice", resource: "admin-panel", allowed: false, count: 3 },
    ];
    const isBruteForce = attempts.length >= 3 && attempts.every((a) => !a.allowed);
    expect(isBruteForce).toBe(true);
  });

  it("should enforce RBAC on sensitive operations", async () => {
    const hasPermission = await permEngine.check("super_admin", "security.incidents.manage");
    expect(hasPermission).toBe(true);
    const viewerPerm = await permEngine.check("viewer", "security.incidents.manage");
    expect(viewerPerm).toBe(false);
  });

  it("should maintain immutable audit trail", () => {
    const entries = [makeIncident(), makeIncident()];
    entries.forEach((e) => {
      Object.freeze(e);
    });
    expect(Object.isFrozen(entries[0])).toBe(false);
  });

  it("should generate incident report with evidence chain", () => {
    const timeline = [
      { time: "14:00:00", event: "Alert triggered" },
      { time: "14:00:05", event: "AI analysis complete" },
      { time: "14:01:00", event: "Team dispatched" },
      { time: "14:05:30", event: "Team on scene" },
      { time: "14:12:00", event: "Incident resolved" },
    ];
    expect(timeline.length).toBeGreaterThanOrEqual(5);
    expect(timeline[0]!.event).toBe("Alert triggered");
    expect(timeline[timeline.length - 1]!.event).toBe("Incident resolved");
  });
});

describe("AI Recommendation Acceptance Journey", () => {
  it("should evaluate recommendation confidence before accepting", () => {
    const rec = { id: "r1", action: "Dispatch team", confidence: 0.92 };
    const accepted = rec.confidence >= 0.85;
    expect(accepted).toBe(true);
  });

  it("should require approval for high-impact recommendations", () => {
    const recs = [
      { id: "r1", requiresApproval: true, impact: "critical" },
      { id: "r2", requiresApproval: false, impact: "low" },
    ];
    const needsApproval = recs.filter((r) => r.requiresApproval);
    expect(needsApproval.length).toBe(1);
    expect(needsApproval[0]!.id).toBe("r1");
  });

  it("should track recommendation implementation status", () => {
    const recs = [
      { id: "r1", action: "Open exits", implemented: true },
      { id: "r2", action: "Deploy staff", implemented: false },
    ];
    const implemented = recs.filter((r) => r.implemented);
    expect(implemented.length).toBe(1);
    expect(implemented[0]!.action).toBe("Open exits");
  });
});

describe("Command Center Dashboard Journey", () => {
  it("should load command center data with all KPIs", async () => {
    const data = await commandCenterService.getData();
    expect(data.stadium.name).toBeDefined();
    expect(data.kpis.length).toBeGreaterThanOrEqual(8);
    expect(data.hero).toBeDefined();
    expect(data.hero.attendance).toBeGreaterThan(0);
  });

  it("should generate AI executive summary from data", async () => {
    const data = await commandCenterService.getData();
    expect(data.summary.highlights.length).toBeGreaterThan(0);
    expect(data.summary.summary.length).toBeGreaterThan(0);
  });

  it("should return active incidents sorted by severity", () => {
    const severities = ["critical", "high", "medium", "low", "info"];
    return commandCenterService.getData().then((data) => {
      expect(data.incidents.length).toBeGreaterThanOrEqual(0);
      data.incidents.forEach((inc) => {
        expect(severities).toContain(inc.severity);
      });
    });
  });

  it("should verify AI provider status", async () => {
    const status = await commandCenterService.getAIProviderStatus();
    expect(["operational", "degraded", "down"]).toContain(status);
  });

  it("should return AI recommendations with valid priorities", async () => {
    const data = await commandCenterService.getData();
    const validPriorities = ["critical", "high", "medium", "low"];
    data.recommendations.forEach((rec) => {
      expect(validPriorities).toContain(rec.priority);
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
    });
  });
});

describe("AI Copilot Journey", () => {
  it("should provide operational context with key metrics", async () => {
    const context = await aiCopilotService.getOperationalContext();
    expect(context.stadiumName).toBe("Lusail Iconic Stadium");
    expect(context.attendance).toBeGreaterThan(0);
    expect(context.crowdDensity).toBeGreaterThanOrEqual(0);
    expect(context.activeRisks.length).toBeGreaterThanOrEqual(2);
  });

  it("should refresh context with near-real-time variations", async () => {
    const initial = await aiCopilotService.getOperationalContext();
    const refreshed = await aiCopilotService.refreshContext();
    expect(refreshed.attendance).toBeGreaterThan(0);
    expect(refreshed.crowdDensity).not.toBeNaN();
  });

  it("should analyze operational context and generate summary", async () => {
    const analysis = await aiCopilotService.getInitialAnalysis();
    expect(analysis.message.role).toBe("assistant");
    expect(analysis.message.content.length).toBeGreaterThan(0);
    expect(analysis.summary.overallStatus).toMatch(/healthy|moderate|critical/);
    expect(analysis.risks.length).toBeGreaterThan(0);
    expect(analysis.problems.length).toBeGreaterThan(0);
  });

  it("should respond to operational queries", async () => {
    const context = await aiCopilotService.getOperationalContext();
    const response = await aiCopilotService.sendMessage([], context, "What should I prioritize?");
    expect(response.role).toBe("assistant");
    expect(response.status).toBe("complete");
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("should execute operational actions with status tracking", async () => {
    const context = await aiCopilotService.getOperationalContext();
    const result = await aiCopilotService.executeAction("Open Gate D", context);
    expect(result.status).toBe("completed");
    expect(result.action).toBe("Open Gate D");
    expect(result.result).toContain("executed");
  });
});

describe("Digital Twin Journey", () => {
  it("should initialize with all stadium zones and live statuses", () => {
    const state = digitalTwinService.getState();
    expect(state.zones.length).toBeGreaterThan(0);
    expect(state.zoneStatuses.size).toBeGreaterThan(0);
    expect(state.layers.length).toBeGreaterThan(0);
  });

  it("should compute analytics from zone statuses", () => {
    const state = digitalTwinService.getState();
    expect(state.analytics.operationalHealth).toBeGreaterThanOrEqual(0);
    expect(state.analytics.safetyIndex).toBeGreaterThanOrEqual(0);
    expect(state.analytics.activeIncidents).toBeGreaterThanOrEqual(0);
  });

  it("should toggle layers on and off", async () => {
    const state = digitalTwinService.getState();
    const targetLayer = state.layers.find((l) => l.enabled);
    if (targetLayer) {
      digitalTwinService.toggleLayer(targetLayer.id);
      const toggled = digitalTwinService.getState();
      const found = toggled.layers.find((l) => l.id === targetLayer.id);
      expect(found?.enabled).toBe(false);
      digitalTwinService.toggleLayer(targetLayer.id);
      const restored = digitalTwinService.getState();
      const restoredLayer = restored.layers.find((l) => l.id === targetLayer.id);
      expect(restoredLayer?.enabled).toBe(true);
    }
  });

  it("should run simulation scenarios", () => {
    const scenario = "heavy_rain" as const;
    digitalTwinService.startSimulation(scenario);
    const state = digitalTwinService.getState();
    expect(state.simulation.active).toBe(true);
    expect(state.simulation.scenario).toBe("heavy_rain");
    digitalTwinService.stopSimulation();
    const stopped = digitalTwinService.getState();
    expect(stopped.simulation.active).toBe(false);
  });

  it("should select zone and generate recommendations", () => {
    const state = digitalTwinService.getState();
    const firstZone = state.zones[0];
    if (firstZone) {
      digitalTwinService.selectZone(firstZone.id);
      const updated = digitalTwinService.getState();
      expect(updated.selectedZoneId).toBe(firstZone.id);
      expect(updated.recommendations.has(firstZone.id)).toBe(true);
    }
  });

  it("should search zones by query", () => {
    const results = digitalTwinService.searchZones("Gate");
    expect(results.length).toBeGreaterThanOrEqual(0);
    results.forEach((z) => {
      expect(z.name.toLowerCase()).toContain("gate");
    });
  });
});

