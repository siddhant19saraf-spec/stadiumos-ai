// @ts-nocheck
import { describe, it, expect } from "vitest";
import type { AssetHealth, MaintenanceAsset } from "../types";
import { ASSETS, SIMULATION_SCENARIOS, ALERT_THRESHOLDS } from "../constants";
import { MockAssetEngine } from "../services/asset-engine";
import { MockHealthEngine } from "../services/health-engine";
import { MockPredictionEngine } from "../services/prediction-engine";
import { MockMaintenanceEngine } from "../services/maintenance-engine";
import { MockWorkOrderEngine } from "../services/work-order-engine";
import { MockSimulationEngine } from "../services/simulation-engine";
import { MockAnalyticsEngine } from "../services/analytics-engine";
import { MockAlertEngine } from "../services/alert-engine";
import { predictiveMaintenanceService } from "../services/predictive-service";

function makeHealth(overrides: Partial<AssetHealth> = {}): AssetHealth {
  return {
    assetId: "hvac-001",
    assetName: "Main HVAC Unit 1",
    type: "hvac",
    status: "healthy",
    healthScore: 75,
    riskScore: 25,
    temperature: 38.5,
    powerUsageKw: 45.2,
    utilization: 70,
    predictedFailureDate: null,
    remainingUsefulLife: null,
    lastMaintenance: new Date().toISOString(),
    maintenanceStatus: "none",
    vibrationMmS: 2.1,
    pressureBar: 1.5,
    criticality: "high" as const,
    lastUpdated: new Date().toISOString(),
    ...overrides,
  };
}

describe("AssetEngine", () => {
  const engine = new MockAssetEngine();

  it("should return 30 assets", () => {
    const assets = engine.getAssets();
    expect(assets.length).toBe(30);
  });

  it("each asset should have required fields", () => {
    const assets = engine.getAssets();
    for (const asset of assets) {
      expect(asset.id).toBeTruthy();
      expect(asset.name).toBeTruthy();
      expect(asset.type).toBeTruthy();
      expect(asset.installDate).toBeTruthy();
    }
  });

  it("should simulate health for all assets", () => {
    const assets = engine.getAssets();
    const healthMap = engine.simulateHealth(assets);
    expect(healthMap.size).toBe(30);
    for (const [, h] of healthMap) {
      expect(h.healthScore).toBeGreaterThanOrEqual(5);
      expect(h.healthScore).toBeLessThanOrEqual(100);
      expect(h.riskScore).toBeGreaterThanOrEqual(0);
      expect(h.riskScore).toBeLessThanOrEqual(95);
    }
  });

  it("should produce different health on subsequent ticks", () => {
    const assets = engine.getAssets();
    const first = engine.simulateHealth(assets);
    const second = engine.simulateHealth(assets);
    const firstValues = Array.from(first.values()).map((h) => h.healthScore);
    const secondValues = Array.from(second.values()).map((h) => h.healthScore);
    expect(firstValues).not.toEqual(secondValues);
  });

  it("should find asset by id", () => {
    const asset = engine.getAssetById("hvac-001");
    expect(asset).toBeDefined();
    expect(asset!.id).toBe("hvac-001");
  });

  it("should return undefined for unknown id", () => {
    expect(engine.getAssetById("nonexistent")).toBeUndefined();
  });
});

describe("HealthEngine", () => {
  const engine = new MockHealthEngine();

  it("should calculate zone health from health map", () => {
    const h1 = makeHealth({ assetId: "hvac-001", healthScore: 80, riskScore: 20 });
    const h2 = makeHealth({ assetId: "hvac-002", healthScore: 60, riskScore: 40 });
    const map = new Map<string, AssetHealth>([["hvac-001", h1], ["hvac-002", h2]]);
    const zones = engine.calculateZoneHealth(map);
    expect(zones.size).toBeGreaterThan(0);
  });

  it("should return correct risk labels", () => {
    expect(engine.getRiskLabel(80)).toBe("critical");
    expect(engine.getRiskLabel(60)).toBe("high");
    expect(engine.getRiskLabel(30)).toBe("medium");
    expect(engine.getRiskLabel(10)).toBe("low");
  });

  it("should return correct health labels", () => {
    expect(engine.getHealthLabel(85)).toBe("excellent");
    expect(engine.getHealthLabel(70)).toBe("good");
    expect(engine.getHealthLabel(50)).toBe("fair");
    expect(engine.getHealthLabel(25)).toBe("poor");
    expect(engine.getHealthLabel(10)).toBe("critical");
  });
});

describe("PredictionEngine", () => {
  const engine = new MockPredictionEngine();

  it("should generate predictions for unhealthy assets", () => {
    const h1 = makeHealth({ assetId: "hvac-001", healthScore: 35, riskScore: 65 });
    const h2 = makeHealth({ assetId: "hvac-002", healthScore: 80, riskScore: 15 });
    const map = new Map<string, AssetHealth>([["hvac-001", h1], ["hvac-002", h2]]);
    const predictions = engine.predict(map);
    const ids = predictions.map((p) => p.assetId);
    expect(ids).toContain("hvac-001");
    // healthy assets with score > 65 should not be predicted
    expect(ids).not.toContain("hvac-002");
  });

  it("predictions should have required fields", () => {
    const h = makeHealth({ assetId: "hvac-001", healthScore: 30 });
    const map = new Map<string, AssetHealth>([["hvac-001", h]]);
    const predictions = engine.predict(map);
    for (const p of predictions) {
      expect(p.assetId).toBeTruthy();
      expect(p.failureMode).toBeTruthy();
      expect(p.probability).toBeGreaterThanOrEqual(10);
      expect(p.probability).toBeLessThanOrEqual(99);
      expect(p.predictedDays).toBeGreaterThan(0);
      expect(p.confidence).toBeGreaterThanOrEqual(78);
      expect(p.confidence).toBeLessThanOrEqual(96);
    }
  });

  it("should return RUL strings correctly", () => {
    expect(engine.getRUL(makeHealth({ healthScore: 90 }))).toBe(">12 months");
    expect(engine.getRUL(makeHealth({ healthScore: 70 }))).toBe("6-12 months");
    expect(engine.getRUL(makeHealth({ healthScore: 50 }))).toBe("3-6 months");
    expect(engine.getRUL(makeHealth({ healthScore: 30 }))).toBe("1-3 months");
    expect(engine.getRUL(makeHealth({ healthScore: 10 }))).toBe("<30 days");
  });
});

describe("MaintenanceEngine", () => {
  const engine = new MockMaintenanceEngine();

  it("should calculate due maintenance count", () => {
    const h1 = makeHealth({ assetId: "a", healthScore: 30, maintenanceStatus: "overdue" });
    const h2 = makeHealth({ assetId: "b", healthScore: 70, maintenanceStatus: "none" });
    const h3 = makeHealth({ assetId: "c", healthScore: 45, maintenanceStatus: "scheduled" });
    const map = new Map<string, AssetHealth>([["a", h1], ["b", h2], ["c", h3]]);
    const due = engine.calculateDue(map);
    expect(due).toBeGreaterThanOrEqual(2);
  });

  it("should return compliance rate in valid range", () => {
    const rate = engine.calculateCompliance();
    expect(rate).toBeGreaterThanOrEqual(72);
    expect(rate).toBeLessThanOrEqual(92);
  });

  it("should determine maintenance status", () => {
    expect(engine.getMaintenanceStatus(makeHealth({ healthScore: 15, maintenanceStatus: "overdue" }))).toBe("critical");
    expect(engine.getMaintenanceStatus(makeHealth({ healthScore: 35, maintenanceStatus: "scheduled" }))).toBe("overdue");
    expect(engine.getMaintenanceStatus(makeHealth({ healthScore: 50, maintenanceStatus: "none" }))).toBe("due_soon");
    expect(engine.getMaintenanceStatus(makeHealth({ healthScore: 80, maintenanceStatus: "none" }))).toBe("on_track");
  });
});

describe("WorkOrderEngine", () => {
  const engine = new MockWorkOrderEngine();

  it("should generate work orders for unhealthy assets", () => {
    const h1 = makeHealth({ assetId: "hvac-001", assetName: "HVAC 1", type: "hvac", healthScore: 25, riskScore: 70 });
    const h2 = makeHealth({ assetId: "hvac-002", assetName: "HVAC 2", type: "hvac", healthScore: 80, riskScore: 15 });
    const map = new Map<string, AssetHealth>([["hvac-001", h1], ["hvac-002", h2]]);
    const assets: MaintenanceAsset[] = [{ id: "hvac-001", name: "HVAC 1", type: "hvac", zone: "east", installDate: "2022-01-01", manufacturer: "Test", model: "M1", criticality: "high" }];
    const orders = engine.generate(map, assets);
    const ids = orders.map((o) => o.assetId);
    expect(ids).toContain("hvac-001");
  });

  it("work orders should have correct priority based on health", () => {
    const h = makeHealth({ assetId: "a", assetName: "A", type: "hvac", healthScore: 10, riskScore: 90 });
    const map = new Map<string, AssetHealth>([["a", h]]);
    const assets: MaintenanceAsset[] = [{ id: "a", name: "A", type: "hvac", zone: "east", installDate: "2022-01-01", manufacturer: "Test", model: "M1", criticality: "high" }];
    const orders = engine.generate(map, assets);
    expect(orders.some((o) => o.priority === "emergency")).toBe(true);
  });

  it("should complete a work order", () => {
    const orders = [
      { id: "wo-1", assetId: "a", assetName: "A", title: "Test", description: "", priority: "high" as const, status: "open" as const, requiredSkills: [], estimatedRepairMin: 60, requiredParts: [], safetyInstructions: [], aiReasoning: "", businessImpact: "", createdAt: new Date().toISOString(), completedAt: null, assignedTeam: null },
    ];
    const completed = engine.complete("wo-1", orders);
    expect(completed[0]!.status).toBe("completed");
    expect(completed[0]!.completedAt).toBeTruthy();
  });

  it("should filter by priority", () => {
    const orders = [
      { id: "wo-1", assetId: "a", assetName: "A", title: "Test1", description: "", priority: "emergency" as const, status: "open" as const, requiredSkills: [], estimatedRepairMin: 60, requiredParts: [], safetyInstructions: [], aiReasoning: "", businessImpact: "", createdAt: new Date().toISOString(), completedAt: null, assignedTeam: null },
      { id: "wo-2", assetId: "b", assetName: "B", title: "Test2", description: "", priority: "low" as const, status: "open" as const, requiredSkills: [], estimatedRepairMin: 30, requiredParts: [], safetyInstructions: [], aiReasoning: "", businessImpact: "", createdAt: new Date().toISOString(), completedAt: null, assignedTeam: null },
    ];
    const emergency = engine.getByPriority(orders, "emergency");
    expect(emergency.length).toBe(1);
    expect(emergency[0]!.id).toBe("wo-1");
  });
});

describe("SimulationEngine", () => {
  const engine = new MockSimulationEngine();

  it("should return 10 scenarios", () => {
    const scenarios = engine.getScenarios();
    expect(scenarios.length).toBe(10);
  });

  it("should run simulation and return result", () => {
    const h = makeHealth({ assetId: "hvac-001", assetName: "HVAC 1", type: "hvac", healthScore: 25, riskScore: 70, criticality: "critical" });
    const map = new Map<string, AssetHealth>([["hvac-001", h]]);
    const predictions = [{ assetId: "hvac-001", assetName: "HVAC 1", failureMode: "overheating" as const, probability: 85, predictedDays: 5, confidence: 90, reasoning: [], contributingFactors: [], recommendedAction: "Fix", estimatedCostImpact: "$5,000", operationalImpact: "Impact", timestamp: new Date().toISOString() }];
    const result = engine.run(map, predictions, [], "heatwave");
    expect(result.scenarioId).toBe("heatwave");
    expect(result.predictedDowntime).toBeGreaterThan(0);
    expect(result.mitigatedDowntime).toBeGreaterThan(0);
    expect(result.costSavings).toBeGreaterThan(0);
    expect(result.assetsInScope.length).toBeGreaterThan(0);
  });

  it("should return recommended actions", () => {
    const map = new Map<string, AssetHealth>();
    const result = engine.run(map, [], [], "match-day");
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });
});

describe("AnalyticsEngine", () => {
  const engine = new MockAnalyticsEngine();

  it("should compute summary from health map data", () => {
    const h1 = makeHealth({ healthScore: 80, riskScore: 15, status: "healthy" });
    const h2 = makeHealth({ assetId: "b", assetName: "B", type: "lighting", healthScore: 25, riskScore: 75, status: "critical" });
    const map = new Map<string, AssetHealth>([["a", h1], ["b", h2]]);
    const summary = engine.computeSummary(map, [], []);
    expect(summary.totalAssets).toBe(2);
    expect(summary.averageHealthScore).toBe(52);
    expect(summary.criticalAssets).toBe(1);
    expect(summary.highRiskAssets).toBe(1);
  });

  it("should compute 30-day trends", () => {
    const map = new Map<string, AssetHealth>([["a", makeHealth()]]);
    const trends = engine.computeTrends(map);
    expect(trends.length).toBe(30);
    for (const t of trends) {
      expect(t.date).toBeTruthy();
      expect(t.avgHealthScore).toBeGreaterThan(0);
      expect(t.avgRiskScore).toBeGreaterThan(0);
    }
  });

  it("should compute asset type breakdown", () => {
    const h1 = makeHealth({ type: "hvac", healthScore: 80 });
    const h2 = makeHealth({ assetId: "b", assetName: "B", type: "hvac", healthScore: 60 });
    const h3 = makeHealth({ assetId: "c", assetName: "C", type: "lighting", healthScore: 90 });
    const map = new Map<string, AssetHealth>([["a", h1], ["b", h2], ["c", h3]]);
    const breakdown = engine.computeAssetTypeBreakdown(map);
    const hvacType = breakdown.find((b) => b.type === "hvac");
    expect(hvacType).toBeDefined();
    expect(hvacType!.count).toBe(2);
    expect(hvacType!.avgHealth).toBe(70);
  });
});

describe("AlertEngine", () => {
  const engine = new MockAlertEngine();

  it("should generate alerts for unhealthy assets", () => {
    const h = makeHealth({ healthScore: 15, riskScore: 90 });
    const map = new Map<string, AssetHealth>([["a", h]]);
    const alerts = engine.generate(map, [], []);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.some((a) => a.severity === "critical")).toBe(true);
  });

  it("should not generate alerts for healthy assets", () => {
    const h = makeHealth({ healthScore: 85, riskScore: 10 });
    const map = new Map<string, AssetHealth>([["a", h]]);
    const alerts = engine.generate(map, [], []);
    const criticalOrSevere = alerts.filter((a) => a.severity === "critical" || a.severity === "severe");
    expect(criticalOrSevere.length).toBe(0);
  });

  it("should acknowledge an alert", () => {
    const alerts = [
      { id: "alert-1", assetId: "a", assetName: "A", severity: "warning" as const, category: "system" as const, title: "Test", message: "Test", suggestedAction: null, requiresImmediateAction: false, acknowledged: false, predictionRelated: false, createdAt: new Date().toISOString(), acknowledgedAt: null },
    ];
    const result = engine.acknowledge("alert-1", alerts);
    expect(result[0]!.acknowledged).toBe(true);
    expect(result[0]!.acknowledgedAt).toBeTruthy();
  });

  it("should filter active (unacknowledged) alerts", () => {
    const alerts = [
      { id: "a1", assetId: "a", assetName: "A", severity: "warning" as const, category: "system" as const, title: "T1", message: "M1", suggestedAction: null, requiresImmediateAction: false, acknowledged: false, predictionRelated: false, createdAt: new Date().toISOString(), acknowledgedAt: null },
      { id: "a2", assetId: "b", assetName: "B", severity: "info" as const, category: "system" as const, title: "T2", message: "M2", suggestedAction: null, requiresImmediateAction: false, acknowledged: true, predictionRelated: false, createdAt: new Date().toISOString(), acknowledgedAt: new Date().toISOString() },
    ];
    const active = engine.getActive(alerts);
    expect(active.length).toBe(1);
    expect(active[0]!.id).toBe("a1");
  });
});

describe("PredictiveMaintenanceService", () => {
  it("should initialize full state from scratch", () => {
    const state = predictiveMaintenanceService.initialize();
    expect(state.assets.length).toBe(30);
    expect(state.healthMap.size).toBe(30);
    expect(state.predictions.length).toBeGreaterThan(0);
    expect(state.workOrders.length).toBeGreaterThan(0);
    expect(state.alerts.length).toBeGreaterThan(0);
    expect(state.summary).not.toBeNull();
    expect(state.trends.length).toBe(30);
    expect(state.assetTypeBreakdown.length).toBeGreaterThan(0);
    expect(state.lastUpdated).toBeTruthy();
  });

  it("should refresh with updated health values", () => {
    const state = predictiveMaintenanceService.initialize();
    const firstHealth = Array.from(state.healthMap.values()).map((h) => h.healthScore);
    const refreshed = predictiveMaintenanceService.refresh(state);
    const secondHealth = Array.from(refreshed.healthMap.values()).map((h) => h.healthScore);
    expect(firstHealth).not.toEqual(secondHealth);
    expect(refreshed.lastUpdated).not.toBe(state.lastUpdated);
  });

  it("should run simulation scenario", () => {
    const state = predictiveMaintenanceService.initialize();
    const withSim = predictiveMaintenanceService.simulateScenario(state, "heatwave");
    expect(withSim.simulationResult).not.toBeNull();
    expect(withSim.simulationResult!.scenarioId).toBe("heatwave");
  });

  it("should acknowledge an alert by id", () => {
    const state = predictiveMaintenanceService.initialize();
    const alertId = state.alerts[0]!.id;
    const acked = predictiveMaintenanceService.acknowledgeAlert(state, alertId);
    const alert = acked.alerts.find((a) => a.id === alertId);
    expect(alert!.acknowledged).toBe(true);
  });

  it("should complete a work order by id", () => {
    const state = predictiveMaintenanceService.initialize();
    const woId = state.workOrders[0]!.id;
    const completed = predictiveMaintenanceService.completeWorkOrder(state, woId);
    const order = completed.workOrders.find((o) => o.id === woId);
    expect(order!.status).toBe("completed");
  });
});

describe("Constants", () => {
  it("should have 30 assets configured", () => {
    expect(ASSETS.length).toBe(30);
  });

  it("should have 10 simulation scenarios", () => {
    expect(SIMULATION_SCENARIOS.length).toBe(10);
  });

  it("should have valid threshold values", () => {
    expect(ALERT_THRESHOLDS.HEALTH_WARNING).toBe(60);
    expect(ALERT_THRESHOLDS.HEALTH_CRITICAL).toBe(30);
    expect(ALERT_THRESHOLDS.RISK_WARNING).toBe(50);
    expect(ALERT_THRESHOLDS.RISK_CRITICAL).toBe(75);
  });
});

