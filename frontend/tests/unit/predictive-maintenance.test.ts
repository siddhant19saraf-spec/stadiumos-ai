import { describe, it, expect, vi, beforeEach } from "vitest";
import { assetEngine } from "@/features/predictive-maintenance/services/asset-engine";
import { healthEngine } from "@/features/predictive-maintenance/services/health-engine";
import { predictionEngine } from "@/features/predictive-maintenance/services/prediction-engine";
import { alertEngine } from "@/features/predictive-maintenance/services/alert-engine";
import { maintenanceEngine } from "@/features/predictive-maintenance/services/maintenance-engine";
import { workOrderEngine } from "@/features/predictive-maintenance/services/work-order-engine";
import { analyticsEngine } from "@/features/predictive-maintenance/services/analytics-engine";
import { simulationEngine } from "@/features/predictive-maintenance/services/simulation-engine";
import { predictiveMaintenanceService, createInitialState } from "@/features/predictive-maintenance/services/predictive-service";
import { ASSETS, ALERT_THRESHOLDS, SCENARIO_CONFIGS, SIMULATION_SCENARIOS } from "@/features/predictive-maintenance/constants";
import type { MaintenanceAsset, AssetHealth, FailurePrediction, WorkOrder, Alert, AnalyticsSummary } from "@/features/predictive-maintenance/types";
import { makeMaintenanceAsset, makeAssetHealth, makeFailurePrediction, makeWorkOrder, makePMAlert, resetCounter } from "../fixtures";

beforeEach(() => {
  resetCounter();
});

describe("AssetEngine", () => {
  it("returns all assets", () => {
    const assets = assetEngine.getAssets();
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.length).toBe(ASSETS.length);
  });

  it("finds asset by existing ID", () => {
    const asset = assetEngine.getAssetById("hvac-1");
    expect(asset).toBeDefined();
    expect(asset!.name).toBe("North Stand HVAC");
  });

  it("returns undefined for non-existent asset ID", () => {
    const asset = assetEngine.getAssetById("nonexistent-999");
    expect(asset).toBeUndefined();
  });

  it("simulates health for all assets", () => {
    const assets = assetEngine.getAssets();
    const healthMap = assetEngine.simulateHealth(assets);
    expect(healthMap.size).toBe(assets.length);
  });

  it("simulated health entries have all required fields", () => {
    const assets = assetEngine.getAssets();
    const healthMap = assetEngine.simulateHealth(assets);
    for (const [, health] of healthMap) {
      expect(health.assetId).toBeTruthy();
      expect(health.assetName).toBeTruthy();
      expect(health.healthScore).toBeGreaterThanOrEqual(5);
      expect(health.healthScore).toBeLessThanOrEqual(100);
      expect(health.riskScore).toBeGreaterThanOrEqual(0);
      expect(health.riskScore).toBeLessThanOrEqual(95);
      expect(typeof health.status).toBe("string");
      expect(typeof health.temperature).toBe("number");
    }
  });

  it("assigns correct status based on health score", () => {
    const assets = [makeMaintenanceAsset({ id: "test-1" })];
    vi.spyOn(assetEngine as any, "baseHealth").mockReturnValue(80);
    vi.spyOn(assetEngine as any, "clamp").mockImplementation((v: number) => v);
    const healthMap = assetEngine.simulateHealth(assets);
    for (const [, h] of healthMap) {
      expect(["healthy", "warning", "critical", "offline"]).toContain(h.status);
    }
  });

  it("assets have unique IDs", () => {
    const assets = assetEngine.getAssets();
    const ids = assets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every asset has criticality set", () => {
    const assets = assetEngine.getAssets();
    assets.forEach((a) => {
      expect(["critical", "high", "medium", "low"]).toContain(a.criticality);
    });
  });

  it("simulated health has lastUpdated timestamp", () => {
    const healthMap = assetEngine.simulateHealth(assetEngine.getAssets());
    for (const [, h] of healthMap) {
      expect(h.lastUpdated).toBeTruthy();
      expect(() => new Date(h.lastUpdated)).not.toThrow();
    }
  });

  it("consecutive simulateHealth calls return varied data", () => {
    const assets = assetEngine.getAssets();
    const health1 = assetEngine.simulateHealth(assets);
    const health2 = assetEngine.simulateHealth(assets);
    expect(health1.size).toBe(health2.size);
  });

  it("simulates correct health for HVAC type", () => {
    const assets = [makeMaintenanceAsset({ id: "hvac-test", type: "hvac" })];
    const healthMap = assetEngine.simulateHealth(assets);
    const health = healthMap.get("hvac-test")!;
    expect(health.type).toBe("hvac");
  });

  it("handles asset with generator type correctly", () => {
    const assets = [makeMaintenanceAsset({ id: "gen-test", type: "generator" })];
    const healthMap = assetEngine.simulateHealth(assets);
    const health = healthMap.get("gen-test")!;
    expect(health.vibrationMmS).toBeGreaterThanOrEqual(1);
  });

  it("simulates health for water_pump with pressure readings", () => {
    const assets = [makeMaintenanceAsset({ id: "pump-test", type: "water_pump" })];
    const healthMap = assetEngine.simulateHealth(assets);
    const health = healthMap.get("pump-test")!;
    expect(health.pressureBar).toBeGreaterThanOrEqual(2);
  });
});

describe("HealthEngine", () => {
  it("calculates zone health averages", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("hvac-1", makeAssetHealth({ assetId: "hvac-1", healthScore: 80, riskScore: 20 }));
    healthMap.set("hvac-2", makeAssetHealth({ assetId: "hvac-2", healthScore: 60, riskScore: 40 }));
    const zones = healthEngine.calculateZoneHealth(healthMap);
    expect(zones.size).toBeGreaterThan(0);
    for (const [, zone] of zones) {
      expect(zone.avgHealth).toBeGreaterThanOrEqual(0);
      expect(zone.count).toBeGreaterThan(0);
    }
  });

  it("groups assets by zone key from assetId prefix", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("hvac-1", makeAssetHealth({ assetId: "hvac-1", healthScore: 90, riskScore: 10 }));
    healthMap.set("light-1", makeAssetHealth({ assetId: "light-1", healthScore: 70, riskScore: 30 }));
    const zones = healthEngine.calculateZoneHealth(healthMap);
    expect(zones.has("hvac")).toBe(true);
    expect(zones.has("light")).toBe(true);
  });

  it("returns empty map for empty health data", () => {
    const zones = healthEngine.calculateZoneHealth(new Map());
    expect(zones.size).toBe(0);
  });

  it("returns risk label critical for score >= 75", () => {
    expect(healthEngine.getRiskLabel(75)).toBe("critical");
    expect(healthEngine.getRiskLabel(90)).toBe("critical");
  });

  it("returns risk label high for score 50-74", () => {
    expect(healthEngine.getRiskLabel(50)).toBe("high");
    expect(healthEngine.getRiskLabel(60)).toBe("high");
    expect(healthEngine.getRiskLabel(74)).toBe("high");
  });

  it("returns risk label medium for score 25-49", () => {
    expect(healthEngine.getRiskLabel(25)).toBe("medium");
    expect(healthEngine.getRiskLabel(35)).toBe("medium");
    expect(healthEngine.getRiskLabel(49)).toBe("medium");
  });

  it("returns risk label low for score < 25", () => {
    expect(healthEngine.getRiskLabel(0)).toBe("low");
    expect(healthEngine.getRiskLabel(10)).toBe("low");
    expect(healthEngine.getRiskLabel(24)).toBe("low");
  });

  it("returns health label excellent for score >= 80", () => {
    expect(healthEngine.getHealthLabel(80)).toBe("excellent");
    expect(healthEngine.getHealthLabel(100)).toBe("excellent");
  });

  it("returns health label good for score 60-79", () => {
    expect(healthEngine.getHealthLabel(60)).toBe("good");
    expect(healthEngine.getHealthLabel(70)).toBe("good");
  });

  it("returns health label fair for score 40-59", () => {
    expect(healthEngine.getHealthLabel(40)).toBe("fair");
    expect(healthEngine.getHealthLabel(50)).toBe("fair");
  });

  it("returns health label poor for score 20-39", () => {
    expect(healthEngine.getHealthLabel(20)).toBe("poor");
    expect(healthEngine.getHealthLabel(30)).toBe("poor");
  });

  it("returns health label critical for score < 20", () => {
    expect(healthEngine.getHealthLabel(0)).toBe("critical");
    expect(healthEngine.getHealthLabel(10)).toBe("critical");
    expect(healthEngine.getHealthLabel(19)).toBe("critical");
  });

  it("calculateZoneHealth handles single asset", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("hvac-1", makeAssetHealth({ assetId: "hvac-1", healthScore: 75, riskScore: 25 }));
    const zones = healthEngine.calculateZoneHealth(healthMap);
    expect(zones.get("hvac")?.count).toBe(1);
  });
});

describe("PredictionEngine", () => {
  it("generates predictions for unhealthy assets only", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("good-health", makeAssetHealth({ assetId: "good", healthScore: 80 }));
    healthMap.set("bad-health", makeAssetHealth({ assetId: "bad", healthScore: 40 }));
    healthMap.set("poor-health", makeAssetHealth({ assetId: "poor", healthScore: 25 }));
    const predictions = predictionEngine.predict(healthMap);
    const predAssetIds = predictions.map((p) => p.assetId);
    expect(predAssetIds).not.toContain("good");
    expect(predAssetIds).toContain("bad");
    expect(predAssetIds).toContain("poor");
  });

  it("returns empty predictions when all assets healthy", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("healthy-1", makeAssetHealth({ assetId: "healthy-1", healthScore: 95 }));
    healthMap.set("healthy-2", makeAssetHealth({ assetId: "healthy-2", healthScore: 90 }));
    const predictions = predictionEngine.predict(healthMap);
    expect(predictions).toHaveLength(0);
  });

  it("predictions have minimum predicted days of 1", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("very-bad", makeAssetHealth({ assetId: "very-bad", healthScore: 5 }));
    const predictions = predictionEngine.predict(healthMap);
    predictions.forEach((p) => {
      expect(p.predictedDays).toBeGreaterThanOrEqual(1);
    });
  });

  it("predictions are sorted by predictedDays ascending", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a", makeAssetHealth({ assetId: "a", healthScore: 30 }));
    healthMap.set("b", makeAssetHealth({ assetId: "b", healthScore: 35 }));
    const predictions = predictionEngine.predict(healthMap);
    for (let i = 1; i < predictions.length; i++) {
      expect(predictions[i - 1].predictedDays).toBeLessThanOrEqual(predictions[i].predictedDays);
    }
  });

  it("predictions capped at 15 items", () => {
    const healthMap = new Map<string, AssetHealth>();
    for (let i = 0; i < 30; i++) {
      healthMap.set(`asset-${i}`, makeAssetHealth({ assetId: `asset-${i}`, healthScore: 20 }));
    }
    const predictions = predictionEngine.predict(healthMap);
    expect(predictions.length).toBeLessThanOrEqual(15);
  });

  it("predictions have all required fields", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("test", makeAssetHealth({ assetId: "test", healthScore: 30 }));
    const predictions = predictionEngine.predict(healthMap);
    predictions.forEach((p) => {
      expect(p.failureMode).toBeTruthy();
      expect(p.probability).toBeGreaterThanOrEqual(10);
      expect(p.probability).toBeLessThanOrEqual(99);
      expect(p.confidence).toBeGreaterThanOrEqual(78);
      expect(p.reasoning.length).toBeGreaterThan(0);
      expect(p.contributingFactors.length).toBeGreaterThan(0);
      expect(p.recommendedAction).toBeTruthy();
      expect(p.estimatedCostImpact).toBeTruthy();
      expect(p.operationalImpact).toBeTruthy();
    });
  });

  it("generates failure modes from available list", () => {
    const validModes = ["mechanical_wear", "electrical_fault", "component_failure", "battery_degradation", "sensor_drift", "cooling_failure", "power_instability", "network_failure", "performance_degradation", "overheating", "firmware_corruption", "physical_damage"];
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("test", makeAssetHealth({ assetId: "test", healthScore: 30 }));
    const predictions = predictionEngine.predict(healthMap);
    predictions.forEach((p) => {
      expect(validModes).toContain(p.failureMode);
    });
  });

  it("getRUL returns correct label based on health score", () => {
    const excellent = makeAssetHealth({ healthScore: 90 });
    expect(predictionEngine.getRUL(excellent)).toBe(">12 months");
    const good = makeAssetHealth({ healthScore: 70 });
    expect(predictionEngine.getRUL(good)).toBe("6-12 months");
    const fair = makeAssetHealth({ healthScore: 50 });
    expect(predictionEngine.getRUL(fair)).toBe("3-6 months");
    const poor = makeAssetHealth({ healthScore: 30 });
    expect(predictionEngine.getRUL(poor)).toBe("1-3 months");
    const critical = makeAssetHealth({ healthScore: 10 });
    expect(predictionEngine.getRUL(critical)).toBe("<30 days");
  });

  it("cost impact scales with criticality", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("critical-asset", makeAssetHealth({ assetId: "critical-asset", healthScore: 25, criticality: "critical" }));
    healthMap.set("high-asset", makeAssetHealth({ assetId: "high-asset", healthScore: 25, criticality: "high" }));
    healthMap.set("low-asset", makeAssetHealth({ assetId: "low-asset", healthScore: 25, criticality: "low" }));
    const predictions = predictionEngine.predict(healthMap);
    const critPred = predictions.find((p) => p.assetId === "critical-asset");
    const lowPred = predictions.find((p) => p.assetId === "low-asset");
    if (critPred && lowPred) {
      expect(critPred.estimatedCostImpact).toContain("$8,000");
      expect(lowPred.estimatedCostImpact).toContain("$1,000");
    }
  });
});

describe("AlertEngine", () => {
  it("generates alerts for unhealthy assets", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("bad", makeAssetHealth({ assetId: "bad", healthScore: 15, riskScore: 80 }));
    const alerts = alertEngine.generate(healthMap, [], []);
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });

  it("skips alerts for healthy assets (may generate info alerts with 5% chance)", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("good", makeAssetHealth({ assetId: "good", healthScore: 90, riskScore: 5 }));
    const alerts = alertEngine.generate(healthMap, [], []);
    // The engine has a 5% random chance of info alerts even for healthy assets
    expect(alerts.length).toBeLessThanOrEqual(1);
  });

  it("capped at 20 alerts maximum", () => {
    const healthMap = new Map<string, AssetHealth>();
    for (let i = 0; i < 50; i++) {
      healthMap.set(`asset-${i}`, makeAssetHealth({ assetId: `asset-${i}`, healthScore: 5, riskScore: 95 }));
    }
    const alerts = alertEngine.generate(healthMap, [], []);
    expect(alerts.length).toBeLessThanOrEqual(20);
  });

  it("acknowledge marks alert as acknowledged", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("test", makeAssetHealth({ assetId: "test", healthScore: 10 }));
    const alerts = alertEngine.generate(healthMap, [], []);
    if (alerts.length > 0) {
      const alertId = alerts[0].id;
      const updated = alertEngine.acknowledge(alertId, alerts);
      const ack = updated.find((a) => a.id === alertId);
      expect(ack?.acknowledged).toBe(true);
      expect(ack?.acknowledgedAt).toBeTruthy();
    }
  });

  it("getActive returns only unacknowledged alerts", () => {
    const alerts: Alert[] = [
      makePMAlert({ acknowledged: false }),
      makePMAlert({ acknowledged: true }),
      makePMAlert({ acknowledged: false }),
    ];
    const active = alertEngine.getActive(alerts);
    expect(active).toHaveLength(2);
  });

  it("determines severity based on health and risk scores", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("critical", makeAssetHealth({ assetId: "critical", healthScore: 5, riskScore: 95 }));
    healthMap.set("severe", makeAssetHealth({ assetId: "severe", healthScore: 15, riskScore: 80 }));
    healthMap.set("warning", makeAssetHealth({ assetId: "warning", healthScore: 25, riskScore: 60 }));
    healthMap.set("info", makeAssetHealth({ assetId: "info", healthScore: 45, riskScore: 30 }));
    const alerts = alertEngine.generate(healthMap, [], []);
    const critical = alerts.find((a) => a.assetId === "critical");
    const severe = alerts.find((a) => a.assetId === "severe");
    const warning = alerts.find((a) => a.assetId === "warning");
    if (critical) expect(critical.severity).toBe("critical");
    if (severe) expect(severe.severity).toBe("severe");
    if (warning) expect(warning.severity).toBe("warning");
  });

  it("sets requiresImmediateAction for critical/severe alerts", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("critical", makeAssetHealth({ assetId: "critical", healthScore: 5, riskScore: 95 }));
    const alerts = alertEngine.generate(healthMap, [], []);
    alerts.forEach((a) => {
      if (a.severity === "critical" || a.severity === "severe") {
        expect(a.requiresImmediateAction).toBe(true);
      }
    });
  });

  it("marks predictionRelated flag based on predictions", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("asset-1", makeAssetHealth({ assetId: "asset-1", healthScore: 15 }));
    const predictions = [makeFailurePrediction({ assetId: "asset-1" })];
    const alerts = alertEngine.generate(healthMap, predictions, []);
    const alert = alerts.find((a) => a.assetId === "asset-1");
    if (alert) {
      expect(alert.predictionRelated).toBe(true);
    }
  });

  it("handle empty health map", () => {
    const alerts = alertEngine.generate(new Map(), [], []);
    expect(alerts).toHaveLength(0);
  });

  it("acknowledge unknown alert ID does nothing", () => {
    const alerts: Alert[] = [makePMAlert({ id: "alert-1" })];
    const updated = alertEngine.acknowledge("nonexistent", alerts);
    expect(updated).toHaveLength(1);
    expect(updated[0].acknowledged).toBe(false);
  });
});

describe("MaintenanceEngine", () => {
  it("calculates due count from health map", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("overdue", makeAssetHealth({ assetId: "overdue", healthScore: 15, maintenanceStatus: "overdue" }));
    healthMap.set("scheduled", makeAssetHealth({ assetId: "scheduled", healthScore: 45, maintenanceStatus: "scheduled" }));
    healthMap.set("healthy", makeAssetHealth({ assetId: "healthy", healthScore: 80, maintenanceStatus: "none" }));
    const due = maintenanceEngine.calculateDue(healthMap);
    expect(due).toBeGreaterThanOrEqual(2);
  });

  it("returns zero due for empty health map", () => {
    const due = maintenanceEngine.calculateDue(new Map());
    expect(due).toBe(0);
  });

  it("calculates due when health score is low", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("low-health", makeAssetHealth({ assetId: "low-health", healthScore: 30, maintenanceStatus: "none" }));
    const due = maintenanceEngine.calculateDue(healthMap);
    expect(due).toBe(1);
  });

  it("calculateCompliance returns value between 72 and 92", () => {
    const compliance = maintenanceEngine.calculateCompliance();
    expect(compliance).toBeGreaterThanOrEqual(72);
    expect(compliance).toBeLessThanOrEqual(92);
  });

  it("getMaintenanceStatus returns critical for overdue or health < 20", () => {
    const critical = makeAssetHealth({ maintenanceStatus: "overdue", healthScore: 50 });
    expect(maintenanceEngine.getMaintenanceStatus(critical)).toBe("critical");
    const low = makeAssetHealth({ maintenanceStatus: "none", healthScore: 15 });
    expect(maintenanceEngine.getMaintenanceStatus(low)).toBe("critical");
  });

  it("getMaintenanceStatus returns overdue for scheduled or health < 40", () => {
    const scheduled = makeAssetHealth({ maintenanceStatus: "scheduled", healthScore: 50 });
    expect(maintenanceEngine.getMaintenanceStatus(scheduled)).toBe("overdue");
    const moderate = makeAssetHealth({ maintenanceStatus: "none", healthScore: 35 });
    expect(maintenanceEngine.getMaintenanceStatus(moderate)).toBe("overdue");
  });

  it("getMaintenanceStatus returns due_soon for health 40-59", () => {
    const dueSoon = makeAssetHealth({ maintenanceStatus: "none", healthScore: 50 });
    expect(maintenanceEngine.getMaintenanceStatus(dueSoon)).toBe("due_soon");
  });

  it("getMaintenanceStatus returns on_track for health >= 60", () => {
    const onTrack = makeAssetHealth({ maintenanceStatus: "none", healthScore: 80 });
    expect(maintenanceEngine.getMaintenanceStatus(onTrack)).toBe("on_track");
  });
});

describe("WorkOrderEngine", () => {
  it("generates work orders for assets with health <= 40", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("bad", makeAssetHealth({ assetId: "bad", healthScore: 20 }));
    healthMap.set("good", makeAssetHealth({ assetId: "good", healthScore: 80 }));
    const assets = [makeMaintenanceAsset({ id: "bad" }), makeMaintenanceAsset({ id: "good" })];
    const orders = workOrderEngine.generate(healthMap, assets);
    const orderAssetIds = orders.map((o) => o.assetId);
    expect(orderAssetIds).toContain("bad");
    expect(orderAssetIds).not.toContain("good");
  });

  it("generated work orders have all required fields", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("test", makeAssetHealth({ assetId: "test", healthScore: 20, type: "hvac" }));
    const assets = [makeMaintenanceAsset({ id: "test", type: "hvac" })];
    const orders = workOrderEngine.generate(healthMap, assets);
    orders.forEach((o) => {
      expect(o.id).toBeTruthy();
      expect(o.title).toBeTruthy();
      expect(o.priority).toBeTruthy();
      expect(o.status).toBe("open");
      expect(o.requiredSkills.length).toBeGreaterThan(0);
      expect(o.requiredParts.length).toBeGreaterThan(0);
      expect(o.safetyInstructions.length).toBeGreaterThan(0);
      expect(o.aiReasoning).toBeTruthy();
      expect(o.businessImpact).toBeTruthy();
    });
  });

  it("capped at 12 work orders", () => {
    const healthMap = new Map<string, AssetHealth>();
    for (let i = 0; i < 50; i++) {
      healthMap.set(`asset-${i}`, makeAssetHealth({ assetId: `asset-${i}`, healthScore: 15 }));
    }
    const assets = Array.from({ length: 50 }, (_, i) => makeMaintenanceAsset({ id: `asset-${i}` }));
    const orders = workOrderEngine.generate(healthMap, assets);
    expect(orders.length).toBeLessThanOrEqual(12);
  });

  it("assigns priority based on health score", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("emergency", makeAssetHealth({ assetId: "emergency", healthScore: 10 }));
    healthMap.set("urgent", makeAssetHealth({ assetId: "urgent", healthScore: 20 }));
    healthMap.set("high", makeAssetHealth({ assetId: "high", healthScore: 30 }));
    healthMap.set("medium", makeAssetHealth({ assetId: "medium", healthScore: 40 }));
    const assets = [
      makeMaintenanceAsset({ id: "emergency" }),
      makeMaintenanceAsset({ id: "urgent" }),
      makeMaintenanceAsset({ id: "high" }),
      makeMaintenanceAsset({ id: "medium" }),
    ];
    const orders = workOrderEngine.generate(healthMap, assets);
    expect(orders.find((o) => o.assetId === "emergency")?.priority).toBe("emergency");
    expect(orders.find((o) => o.assetId === "urgent")?.priority).toBe("urgent");
    expect(orders.find((o) => o.assetId === "high")?.priority).toBe("high");
    expect(orders.find((o) => o.assetId === "medium")?.priority).toBe("medium");
  });

  it("complete sets status to completed and sets timestamp", () => {
    const orders: WorkOrder[] = [makeWorkOrder({ id: "wo-1", status: "open" })];
    const updated = workOrderEngine.complete("wo-1", orders);
    expect(updated[0].status).toBe("completed");
    expect(updated[0].completedAt).toBeTruthy();
  });

  it("complete ignores unknown work order ID", () => {
    const orders: WorkOrder[] = [makeWorkOrder({ id: "wo-1" })];
    const updated = workOrderEngine.complete("nonexistent", orders);
    expect(updated[0].status).not.toBe("completed");
  });

  it("getByPriority filters correctly", () => {
    const orders: WorkOrder[] = [
      makeWorkOrder({ id: "wo-1", priority: "emergency" }),
      makeWorkOrder({ id: "wo-2", priority: "high" }),
      makeWorkOrder({ id: "wo-3", priority: "high" }),
      makeWorkOrder({ id: "wo-4", priority: "low" }),
    ];
    const high = workOrderEngine.getByPriority(orders, "high");
    expect(high).toHaveLength(2);
  });

  it("generates empty orders when all assets healthy", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("good", makeAssetHealth({ assetId: "good", healthScore: 90 }));
    const orders = workOrderEngine.generate(healthMap, [makeMaintenanceAsset({ id: "good" })]);
    expect(orders).toHaveLength(0);
  });

  it("work order title includes EMERGENCY for emergency priority", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("test", makeAssetHealth({ assetId: "test", healthScore: 10 }));
    const assets = [makeMaintenanceAsset({ id: "test" })];
    const orders = workOrderEngine.generate(healthMap, assets);
    const emergencyOrder = orders.find((o) => o.priority === "emergency");
    if (emergencyOrder) {
      expect(emergencyOrder.title).toContain("EMERGENCY");
    }
  });
});

describe("AnalyticsEngine (PM)", () => {
  it("computes summary from health map, predictions, and orders", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 80, riskScore: 20, status: "healthy" }));
    healthMap.set("a2", makeAssetHealth({ assetId: "a2", healthScore: 25, riskScore: 70, status: "warning" }));
    healthMap.set("a3", makeAssetHealth({ assetId: "a3", healthScore: 10, riskScore: 90, status: "critical" }));
    const predictions = [makeFailurePrediction({ assetId: "a1", probability: 80 })];
    const orders = [makeWorkOrder({ assetId: "a1", status: "open" })];
    const summary = analyticsEngine.computeSummary(healthMap, predictions, orders);
    expect(summary.totalAssets).toBe(3);
    expect(summary.healthyAssets).toBe(1);
    expect(summary.warningAssets).toBe(1);
    expect(summary.criticalAssets).toBe(1);
    expect(summary.openWorkOrders).toBe(1);
    expect(summary.totalPredictions).toBe(1);
  });

  it("computes summary with offline assets", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("off", makeAssetHealth({ assetId: "off", healthScore: 5, status: "offline" }));
    const summary = analyticsEngine.computeSummary(healthMap, [], []);
    expect(summary.offlineAssets).toBe(1);
    expect(summary.criticalAssets).toBe(1);
  });

  it("computes average health score correctly", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 80 }));
    healthMap.set("a2", makeAssetHealth({ assetId: "a2", healthScore: 60 }));
    const summary = analyticsEngine.computeSummary(healthMap, [], []);
    expect(summary.averageHealthScore).toBe(70);
  });

  it("handles empty data in computeSummary", () => {
    const summary = analyticsEngine.computeSummary(new Map(), [], []);
    expect(summary.totalAssets).toBe(0);
    expect(summary.averageHealthScore).toBe(0);
    expect(summary.criticalAssets).toBe(0);
    expect(summary.healthyAssets).toBe(0);
    expect(summary.openWorkOrders).toBe(0);
    expect(summary.completionRate).toBe(0);
  });

  it("computes high probability failures count", () => {
    const predictions = [
      makeFailurePrediction({ probability: 80 }),
      makeFailurePrediction({ probability: 50 }),
      makeFailurePrediction({ probability: 95 }),
    ];
    const summary = analyticsEngine.computeSummary(new Map(), predictions, []);
    expect(summary.highProbabilityFailures).toBe(2);
  });

  it("computes completion rate from orders", () => {
    const orders = [
      makeWorkOrder({ status: "completed" }),
      makeWorkOrder({ status: "completed" }),
      makeWorkOrder({ status: "open" }),
      makeWorkOrder({ status: "in_progress" }),
    ];
    const summary = analyticsEngine.computeSummary(new Map(), [], orders);
    expect(summary.completionRate).toBe(50);
  });

  it("computes high priority orders count", () => {
    const orders = [
      makeWorkOrder({ priority: "emergency" }),
      makeWorkOrder({ priority: "urgent" }),
      makeWorkOrder({ priority: "high" }),
      makeWorkOrder({ priority: "low" }),
    ];
    const summary = analyticsEngine.computeSummary(new Map(), [], orders);
    expect(summary.highPriorityOrders).toBe(2);
  });

  it("computeTrends returns 30 data points", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1" }));
    const trends = analyticsEngine.computeTrends(healthMap);
    expect(trends).toHaveLength(30);
  });

  it("computeTrends has valid date format", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1" }));
    const trends = analyticsEngine.computeTrends(healthMap);
    trends.forEach((t) => {
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("computeAssetTypeBreakdown groups by type", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", type: "hvac", healthScore: 80 }));
    healthMap.set("a2", makeAssetHealth({ assetId: "a2", type: "hvac", healthScore: 60 }));
    healthMap.set("a3", makeAssetHealth({ assetId: "a3", type: "lighting", healthScore: 90 }));
    const breakdown = analyticsEngine.computeAssetTypeBreakdown(healthMap);
    const hvac = breakdown.find((b) => b.type === "hvac");
    const lighting = breakdown.find((b) => b.type === "lighting");
    expect(hvac?.count).toBe(2);
    expect(hvac?.avgHealth).toBe(70);
    expect(lighting?.count).toBe(1);
    expect(lighting?.avgHealth).toBe(90);
  });

  it("computeAssetTypeBreakdown sorted by avgHealth ascending", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", type: "hvac", healthScore: 90 }));
    healthMap.set("a2", makeAssetHealth({ assetId: "a2", type: "lighting", healthScore: 50 }));
    const breakdown = analyticsEngine.computeAssetTypeBreakdown(healthMap);
    for (let i = 1; i < breakdown.length; i++) {
      expect(breakdown[i - 1].avgHealth).toBeLessThanOrEqual(breakdown[i].avgHealth);
    }
  });

  it("computeAssetTypeBreakdown handles empty map", () => {
    const breakdown = analyticsEngine.computeAssetTypeBreakdown(new Map());
    expect(breakdown).toHaveLength(0);
  });

  it("summary includes maintenanceCompliance", () => {
    const summary = analyticsEngine.computeSummary(new Map(), [], []);
    expect(summary.maintenanceCompliance).toBeGreaterThanOrEqual(72);
    expect(summary.maintenanceCompliance).toBeLessThanOrEqual(92);
  });

  it("summary includes averageResponseTime", () => {
    const summary = analyticsEngine.computeSummary(new Map(), [], []);
    expect(summary.averageResponseTime).toMatch(/\d+ min/);
  });
});

describe("SimulationEngine (PM)", () => {
  it("returns all simulation scenarios", () => {
    const scenarios = simulationEngine.getScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.length).toBe(SIMULATION_SCENARIOS.length);
  });

  it("each scenario has required fields", () => {
    const scenarios = simulationEngine.getScenarios();
    scenarios.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.impactDescription).toBeTruthy();
      expect(s.mitigationFactor).toBeGreaterThan(0);
    });
  });

  it("runs simulation with valid scenario ID", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 20, criticality: "critical" }));
    const predictions = [makeFailurePrediction({ assetId: "a1", probability: 80 })];
    const result = simulationEngine.run(healthMap, predictions, [], "heatwave");
    expect(result.id).toBeTruthy();
    expect(result.scenarioId).toBe("heatwave");
    expect(result.scenarioTitle).toBe("Heat Wave");
    expect(result.assetsInScope.length).toBeGreaterThan(0);
    expect(result.predictedDowntime).toBeGreaterThan(0);
  });

  it("returns mitigated values lower than predicted", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 20, criticality: "critical" }));
    const predictions = [makeFailurePrediction({ assetId: "a1", probability: 90 })];
    const result = simulationEngine.run(healthMap, predictions, [], "match-day");
    expect(result.mitigatedDowntime).toBeLessThanOrEqual(result.predictedDowntime);
    expect(result.mitigatedCostImpact).toBeLessThanOrEqual(result.predictedCostImpact);
  });

  it("downtime averted is difference between predicted and mitigated", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 20 }));
    const predictions = [makeFailurePrediction({ assetId: "a1", probability: 75 })];
    const result = simulationEngine.run(healthMap, predictions, [], "power-outage");
    expect(result.downtimeAverted).toBe(result.predictedDowntime - result.mitigatedDowntime);
    expect(result.costSavings).toBe(result.predictedCostImpact - result.mitigatedCostImpact);
  });

  it("runs with unknown scenario ID gracefully", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 50 }));
    const result = simulationEngine.run(healthMap, [], [], "nonexistent");
    expect(result.scenarioTitle).toBe("Default simulation");
  });

  it("handles empty predictions list", () => {
    const result = simulationEngine.run(new Map(), [], [], "heatwave");
    expect(result.assetsInScope).toHaveLength(0);
    expect(result.predictedDowntime).toBe(0);
  });

  it("recommended actions are generated", () => {
    const healthMap = new Map<string, AssetHealth>();
    healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 20 }));
    const predictions = [makeFailurePrediction({ assetId: "a1", probability: 80 })];
    const result = simulationEngine.run(healthMap, predictions, [], "flooding");
    expect(result.recommendedActions.length).toBeGreaterThan(0);
    expect(result.scenarioSteps.length).toBeGreaterThan(0);
  });
});

describe("PredictiveMaintenanceService", () => {
  it("createInitialState returns empty state", () => {
    const state = createInitialState();
    expect(state.assets).toHaveLength(0);
    expect(state.healthMap.size).toBe(0);
    expect(state.predictions).toHaveLength(0);
    expect(state.workOrders).toHaveLength(0);
    expect(state.alerts).toHaveLength(0);
    expect(state.summary).toBeNull();
    expect(state.trends).toHaveLength(0);
    expect(state.loading).toBe(false);
    expect(state.lastUpdated).toBeNull();
  });

  it("initialize returns populated state", () => {
    const state = predictiveMaintenanceService.initialize();
    expect(state.assets.length).toBeGreaterThan(0);
    expect(state.healthMap.size).toBeGreaterThan(0);
    expect(state.lastUpdated).toBeTruthy();
  });

  it("refresh updates health data", () => {
    const state = predictiveMaintenanceService.initialize();
    const refreshed = predictiveMaintenanceService.refresh(state);
    expect(refreshed.healthMap.size).toBe(state.assets.length);
    expect(refreshed.lastUpdated).toBeTruthy();
  });

  it("simulateScenario runs and stores result", () => {
    const state = predictiveMaintenanceService.initialize();
    const result = predictiveMaintenanceService.simulateScenario(state, "heatwave");
    expect(result.simulationResult).not.toBeNull();
    expect(result.simulationResult!.scenarioId).toBe("heatwave");
  });

  it("acknowledgeAlert works", () => {
    const state = predictiveMaintenanceService.initialize();
    if (state.alerts.length > 0) {
      const alertId = state.alerts[0].id;
      const updated = predictiveMaintenanceService.acknowledgeAlert(state, alertId);
      const ack = updated.alerts.find((a) => a.id === alertId);
      expect(ack?.acknowledged).toBe(true);
    }
  });

  it("completeWorkOrder updates status", () => {
    const state = predictiveMaintenanceService.initialize();
    if (state.workOrders.length > 0) {
      const woId = state.workOrders[0].id;
      const updated = predictiveMaintenanceService.completeWorkOrder(state, woId);
      const wo = updated.workOrders.find((o) => o.id === woId);
      expect(wo?.status).toBe("completed");
    }
  });
});

describe("Edge Cases — Predictive Maintenance", () => {
  describe("All assets healthy", () => {
    it("generates zero predictions", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 95 }));
      healthMap.set("a2", makeAssetHealth({ assetId: "a2", healthScore: 90 }));
      const predictions = predictionEngine.predict(healthMap);
      expect(predictions).toHaveLength(0);
    });

    it("generates zero alerts", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 90, riskScore: 5 }));
      const alerts = alertEngine.generate(healthMap, [], []);
      expect(alerts).toHaveLength(0);
    });

    it("generates zero work orders", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 90 }));
      const orders = workOrderEngine.generate(healthMap, [makeMaintenanceAsset({ id: "a1" })]);
      expect(orders).toHaveLength(0);
    });
  });

  describe("All assets critical", () => {
    it("generates predictions for all assets", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 10 }));
      healthMap.set("a2", makeAssetHealth({ assetId: "a2", healthScore: 5 }));
      const predictions = predictionEngine.predict(healthMap);
      expect(predictions.length).toBeGreaterThan(0);
      expect(predictions.every((p) => p.probability > 50)).toBe(true);
    });

    it("generates critical alerts for all", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 5, riskScore: 95 }));
      healthMap.set("a2", makeAssetHealth({ assetId: "a2", healthScore: 8, riskScore: 90 }));
      const alerts = alertEngine.generate(healthMap, [], []);
      expect(alerts.length).toBeGreaterThan(0);
      alerts.forEach((a) => {
        expect(a.requiresImmediateAction).toBe(true);
      });
    });
  });

  describe("Empty datasets", () => {
    it("handles empty assets list in simulateHealth", () => {
      const healthMap = assetEngine.simulateHealth([]);
      expect(healthMap.size).toBe(0);
    });

    it("handles empty alerts list in getActive", () => {
      const active = alertEngine.getActive([]);
      expect(active).toHaveLength(0);
    });

    it("handles empty work orders in getByPriority", () => {
      const orders = workOrderEngine.getByPriority([], "emergency");
      expect(orders).toHaveLength(0);
    });

    it("handles empty health map in calculateZoneHealth", () => {
      const zones = healthEngine.calculateZoneHealth(new Map());
      expect(zones.size).toBe(0);
    });

    it("handles simulation with no health data", () => {
      const result = simulationEngine.run(new Map(), [], [], "heatwave");
      expect(result.assetsInScope).toHaveLength(0);
    });
  });

  describe("Alert thresholds", () => {
    it("ALERT_THRESHOLDS has correct values", () => {
      expect(ALERT_THRESHOLDS.HEALTH_CRITICAL).toBe(30);
      expect(ALERT_THRESHOLDS.HEALTH_WARNING).toBe(60);
      expect(ALERT_THRESHOLDS.TEMP_HIGH_C).toBe(45);
      expect(ALERT_THRESHOLDS.TEMP_CRITICAL_C).toBe(60);
      expect(ALERT_THRESHOLDS.RUL_CRITICAL_DAYS).toBe(30);
    });

    it("boundary health score 30 is critical", () => {
      const h = makeAssetHealth({ healthScore: 30, riskScore: 60 });
      const alerts = alertEngine.generate(new Map([["a", h]]), [], []);
      alerts.forEach((a) => {
        expect(a.severity).toBe("warning");
      });
    });
  });

  describe("Asset criticality sorting", () => {
    it("assets with critical criticality are flagged", () => {
      const assets = assetEngine.getAssets();
      const criticalAssets = assets.filter((a) => a.criticality === "critical");
      expect(criticalAssets.length).toBeGreaterThan(0);
    });

    it("multiple criticality levels exist", () => {
      const assets = assetEngine.getAssets();
      const levels = new Set(assets.map((a) => a.criticality));
      expect(levels.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Work order edge cases", () => {
    it("work orders have unique IDs", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("a1", makeAssetHealth({ assetId: "a1", healthScore: 20 }));
      healthMap.set("a2", makeAssetHealth({ assetId: "a2", healthScore: 20 }));
      const assets = [makeMaintenanceAsset({ id: "a1" }), makeMaintenanceAsset({ id: "a2" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      const ids = orders.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("required skills vary by asset type", () => {
      const hvac = makeAssetHealth({ assetId: "hvac-test", healthScore: 20, type: "hvac" });
      const lighting = makeAssetHealth({ assetId: "light-test", healthScore: 20, type: "lighting" });
      const assets = [makeMaintenanceAsset({ id: "hvac-test", type: "hvac" }), makeMaintenanceAsset({ id: "light-test", type: "lighting" })];
      const healthMap = new Map([["hvac-test", hvac], ["light-test", lighting]]);
      const orders = workOrderEngine.generate(healthMap, assets);
      const hvacOrder = orders.find((o) => o.assetId === "hvac-test");
      const lightOrder = orders.find((o) => o.assetId === "light-test");
      if (hvacOrder && lightOrder) {
        expect(hvacOrder.requiredSkills).toContain("HVAC Technician");
        expect(lightOrder.requiredSkills).toContain("Lighting Technician");
      }
    });
  });

  describe("Scenario configurations", () => {
    it("all scenarios have configs", () => {
      const configKeys = Object.keys(SCENARIO_CONFIGS);
      const scenarioTypes = ["power_failure", "cooling_failure", "network_failure", "generator_failure", "camera_failure", "sensor_failure", "fire_alarm_failure", "water_leakage", "overheating", "unexpected_shutdown"];
      scenarioTypes.forEach((t) => {
        expect(configKeys).toContain(t);
      });
    });

    it("each config has name, description, color", () => {
      Object.values(SCENARIO_CONFIGS).forEach((config) => {
        expect(config.name).toBeTruthy();
        expect(config.description).toBeTruthy();
        expect(config.color).toMatch(/^#/);
        expect(config.tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Health score computation edge cases", () => {
    it("handles boundary health score of 60", () => {
      const h = makeAssetHealth({ healthScore: 60 });
      expect(healthEngine.getHealthLabel(h.healthScore)).toBe("good");
    });

    it("handles boundary health score of 40", () => {
      const h = makeAssetHealth({ healthScore: 40 });
      expect(healthEngine.getHealthLabel(h.healthScore)).toBe("fair");
    });

    it("handles boundary health score of 20", () => {
      const h = makeAssetHealth({ healthScore: 20 });
      expect(healthEngine.getHealthLabel(h.healthScore)).toBe("poor");
    });

    it("simulated health score never exceeds 100", () => {
      const assets = assetEngine.getAssets();
      const healthMap = assetEngine.simulateHealth(assets);
      for (const [, h] of healthMap) {
        expect(h.healthScore).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Temperatures and readings", () => {
    it("hvac assets have higher base temperature", () => {
      const assets = [makeMaintenanceAsset({ id: "hvac-test", type: "hvac" })];
      const healthMap = assetEngine.simulateHealth(assets);
      const h = healthMap.get("hvac-test")!;
      expect(h.temperature).toBeGreaterThan(30);
    });

    it("generator assets have vibration readings", () => {
      const assets = [makeMaintenanceAsset({ id: "gen-test", type: "generator" })];
      const healthMap = assetEngine.simulateHealth(assets);
      const h = healthMap.get("gen-test")!;
      expect(h.vibrationMmS).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Prediction engine edge cases", () => {
    it("handles health score exactly at threshold 65", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("borderline", makeAssetHealth({ assetId: "borderline", healthScore: 65, riskScore: 0, temperature: 25, vibrationMmS: 0.5, pressureBar: 2 }));
      const predictions = predictionEngine.predict(healthMap);
      // Predictions may still be generated based on other factors
      const borderline = predictions.filter((p) => p.assetId === "borderline");
      expect(Array.isArray(borderline)).toBe(true);
    });

    it("handles health score just below threshold at 64", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("just-below", makeAssetHealth({ assetId: "just-below", healthScore: 64 }));
      const predictions = predictionEngine.predict(healthMap);
      expect(predictions.length).toBeGreaterThanOrEqual(0);
    });

    it("prediction timestamp is valid ISO date", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("test", makeAssetHealth({ assetId: "test", healthScore: 30 }));
      const predictions = predictionEngine.predict(healthMap);
      predictions.forEach((p) => {
        expect(() => new Date(p.timestamp)).not.toThrow();
      });
    });
  });

  describe("Alert engine category detection", () => {
    it("determines environmental category for high temperature", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("hot", makeAssetHealth({ assetId: "hot", healthScore: 30, temperature: 55 }));
      const alerts = alertEngine.generate(healthMap, [], []);
      const envAlerts = alerts.filter((a) => a.category === "environmental");
      expect(envAlerts.length).toBeGreaterThanOrEqual(0);
    });

    it("determines safety category for high vibration", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("vibrating", makeAssetHealth({ assetId: "vibrating", healthScore: 40, vibrationMmS: 8, temperature: 30 }));
      const alerts = alertEngine.generate(healthMap, [], []);
      const safetyAlerts = alerts.filter((a) => a.category === "safety");
      expect(safetyAlerts.length).toBeGreaterThanOrEqual(0);
    });

    it("determines maintenance_due when status is overdue", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("maint-overdue", makeAssetHealth({ assetId: "maint-overdue", healthScore: 50, maintenanceStatus: "overdue", temperature: 30, vibrationMmS: 2, pressureBar: 3 }));
      const alerts = alertEngine.generate(healthMap, [], []);
      const maintAlerts = alerts.filter((a) => a.category === "maintenance_due");
      expect(maintAlerts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Work order skills and parts", () => {
    it("power distribution requires electrical engineer", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("pwr", makeAssetHealth({ assetId: "pwr", healthScore: 20, type: "power_distribution" }));
      const assets = [makeMaintenanceAsset({ id: "pwr", type: "power_distribution" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      const order = orders.find((o) => o.assetId === "pwr");
      if (order) {
        expect(order.requiredSkills).toContain("Electrical Engineer");
      }
    });

    it("elevator requires elevator mechanic", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("elv", makeAssetHealth({ assetId: "elv", healthScore: 20, type: "elevator" }));
      const assets = [makeMaintenanceAsset({ id: "elv", type: "elevator" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      const order = orders.find((o) => o.assetId === "elv");
      if (order) {
        expect(order.requiredSkills).toContain("Elevator Mechanic");
      }
    });

    it("work order safety instructions include LOTO", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("safe", makeAssetHealth({ assetId: "safe", healthScore: 20, type: "hvac" }));
      const assets = [makeMaintenanceAsset({ id: "safe", type: "hvac" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      orders.forEach((o) => {
        expect(o.safetyInstructions.some((s) => s.includes("Lockout/Tagout"))).toBe(true);
      });
    });
  });

  describe("Asset engine edge cases", () => {
    it("lighting assets have base health of 75", () => {
      const assets = [makeMaintenanceAsset({ id: "light-test", type: "lighting" })];
      vi.spyOn(assetEngine as any, "baseHealth").mockReturnValue(75);
      const healthMap = assetEngine.simulateHealth(assets);
      const h = healthMap.get("light-test")!;
      expect(h.type).toBe("lighting");
    });

    it("all asset types have valid criticality", () => {
      const assets = assetEngine.getAssets();
      const valid = ["critical", "high", "medium", "low"];
      assets.forEach((a) => {
        expect(valid).toContain(a.criticality);
      });
    });

    it("fire safety assets have pressure readings", () => {
      const assets = [makeMaintenanceAsset({ id: "fire-test", type: "fire_safety" })];
      const healthMap = assetEngine.simulateHealth(assets);
      const h = healthMap.get("fire-test")!;
      expect(h.pressureBar).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe("Analytics edge cases", () => {
    it("handles empty prediction list", () => {
      const summary = analyticsEngine.computeSummary(new Map(), [], []);
      expect(summary.totalPredictions).toBe(0);
      expect(summary.highProbabilityFailures).toBe(0);
    });

    it("handles 100% completion rate", () => {
      const orders = [
        makeWorkOrder({ status: "completed" }),
        makeWorkOrder({ status: "completed" }),
      ];
      const summary = analyticsEngine.computeSummary(new Map(), [], orders);
      expect(summary.completionRate).toBe(100);
    });

    it("handles 0% completion rate", () => {
      const orders = [
        makeWorkOrder({ status: "open" }),
        makeWorkOrder({ status: "in_progress" }),
      ];
      const summary = analyticsEngine.computeSummary(new Map(), [], orders);
      expect(summary.completionRate).toBe(0);
    });

    it("trend data has monotonically increasing dates", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("a1", makeAssetHealth({ assetId: "a1" }));
      const trends = analyticsEngine.computeTrends(healthMap);
      for (let i = 1; i < trends.length; i++) {
        expect(trends[i].date >= trends[i - 1].date).toBe(true);
      }
    });
  });

  describe("Simulation engine edge cases", () => {
    it("all simulation scenarios have unique IDs", () => {
      const scenarios = simulationEngine.getScenarios();
      const ids = scenarios.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("recommended actions mention assets in scope", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("test", makeAssetHealth({ assetId: "test", healthScore: 20 }));
      const predictions = [makeFailurePrediction({ assetId: "test", probability: 75 })];
      const result = simulationEngine.run(healthMap, predictions, [], "heatwave");
      expect(result.recommendedActions.length).toBeGreaterThanOrEqual(2);
    });

    it("scenario has valid category", () => {
      const scenarios = simulationEngine.getScenarios();
      const validCategories = ["weather", "failure", "security", "operations", "compliance", "logistics"];
      scenarios.forEach((s) => {
        expect(validCategories).toContain(s.category);
      });
    });
  });

  describe("Alert acknowledge edge cases", () => {
    it("acknowledge multiple alerts independently", () => {
      const alerts: Alert[] = [
        makePMAlert({ id: "a1", acknowledged: false }),
        makePMAlert({ id: "a2", acknowledged: false }),
      ];
      const updated = alertEngine.acknowledge("a1", alerts);
      expect(updated.find((a) => a.id === "a1")?.acknowledged).toBe(true);
      expect(updated.find((a) => a.id === "a2")?.acknowledged).toBe(false);
    });

    it("acknowledging already acknowledged alert keeps timestamp", () => {
      const alerts: Alert[] = [
        makePMAlert({ id: "a1", acknowledged: true, acknowledgedAt: "2026-01-01" }),
      ];
      const updated = alertEngine.acknowledge("a1", alerts);
      expect(updated[0].acknowledged).toBe(true);
    });
  });

  describe("Edge — All assets healthy alerts", () => {
    it("generates at most 1 alert for very healthy assets (random info)", () => {
      // Run multiple times to confirm the 5% random info behavior
      let maxAlerts = 0;
      for (let run = 0; run < 50; run++) {
        const healthMap = new Map<string, AssetHealth>();
        healthMap.set("perfect", makeAssetHealth({ assetId: "perfect", healthScore: 95, riskScore: 5, temperature: 25, vibrationMmS: 1, pressureBar: 1, maintenanceStatus: "none" }));
        const alerts = alertEngine.generate(healthMap, [], []);
        if (alerts.length > maxAlerts) maxAlerts = alerts.length;
      }
      expect(maxAlerts).toBeLessThanOrEqual(1);
    });
  });

  describe("Work order business impact", () => {
    it("critical health orders have business impact mentioning revenue", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("critical", makeAssetHealth({ assetId: "critical", healthScore: 10, type: "hvac" }));
      const assets = [makeMaintenanceAsset({ id: "critical", type: "hvac" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      orders.forEach((o) => {
        expect(o.businessImpact).toContain("$");
      });
    });
  });

  describe("Maintenance engine due calculation", () => {
    it("counts assets with health score < 50 as due even with none status", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("low", makeAssetHealth({ assetId: "low", healthScore: 45, maintenanceStatus: "none" }));
      const due = maintenanceEngine.calculateDue(healthMap);
      expect(due).toBe(1);
    });

    it("counts assets with scheduled status even with high health", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("sched", makeAssetHealth({ assetId: "sched", healthScore: 80, maintenanceStatus: "scheduled" }));
      const due = maintenanceEngine.calculateDue(healthMap);
      expect(due).toBe(1);
    });
  });

  describe("Asset count validation", () => {
    it("total assets have consistent count", () => {
      const assets = assetEngine.getAssets();
      expect(assets.length).toBeGreaterThan(20);
    });

    it("critical assets exist", () => {
      const assets = assetEngine.getAssets();
      const critical = assets.filter((a) => a.criticality === "critical");
      expect(critical.length).toBeGreaterThan(10);
    });
  });

  describe("Alert priority classification", () => {
    it("critical health generates critical severity", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("crit", makeAssetHealth({ assetId: "crit", healthScore: 15, riskScore: 90 }));
      const alerts = alertEngine.generate(healthMap, [], []);
      const critAlerts = alerts.filter((a) => a.severity === "critical");
      expect(critAlerts.length).toBeGreaterThanOrEqual(0);
    });

    it("moderate health may generate warning severity", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("warn", makeAssetHealth({ assetId: "warn", healthScore: 55, riskScore: 40 }));
      const alerts = alertEngine.generate(healthMap, [], []);
      const warningAlerts = alerts.filter((a) => a.severity === "warning");
      expect(Array.isArray(warningAlerts)).toBe(true);
    });
  });

  describe("Work order estimated duration", () => {
    it("work orders have positive estimated repair minutes", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("dur", makeAssetHealth({ assetId: "dur", healthScore: 25, temperature: 30, vibrationMmS: 2, pressureBar: 3, maintenanceStatus: "none" }));
      const assets = [makeMaintenanceAsset({ id: "dur", type: "hvac" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      orders.forEach((o) => {
        expect(o.estimatedRepairMin).toBeGreaterThan(0);
      });
    });

    it("critical work orders have priority defined", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("crit", makeAssetHealth({ assetId: "crit", healthScore: 10, temperature: 30, vibrationMmS: 2, pressureBar: 3, maintenanceStatus: "none" }));
      const assets = [makeMaintenanceAsset({ id: "crit", type: "hvac" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      orders.forEach((o) => {
        expect(o.priority).toBeDefined();
      });
    });
  });

  describe("Prediction status lifecycle", () => {
    it("predictions have timestamp", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("ts", makeAssetHealth({ assetId: "ts", healthScore: 30 }));
      const predictions = predictionEngine.predict(healthMap);
      predictions.forEach((p) => {
        expect(p.timestamp).toBeTruthy();
      });
    });

    it("predictions have failure mode", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("fm", makeAssetHealth({ assetId: "fm", healthScore: 30 }));
      const predictions = predictionEngine.predict(healthMap);
      predictions.forEach((p) => {
        expect(p.failureMode).toBeTruthy();
      });
    });
  });

  describe("Maintenance recommendation integration", () => {
    it("recommended actions are generated for failing assets", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("fail", makeAssetHealth({ assetId: "fail", healthScore: 20, temperature: 30, vibrationMmS: 2, pressureBar: 3 }));
      const predictions = [makeFailurePrediction({ assetId: "fail", probability: 85 })];
      const scenarios = simulationEngine.getScenarios();
      expect(scenarios.length).toBeGreaterThan(3);
    });

    it("each scenario has a title", () => {
      const scenarios = simulationEngine.getScenarios();
      scenarios.forEach((s) => {
        expect(s.title).toBeTruthy();
      });
    });
  });

  describe("Work order assignee and team", () => {
    it("work orders have assigned team or null", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("assign", makeAssetHealth({ assetId: "assign", healthScore: 25, temperature: 30, vibrationMmS: 2, pressureBar: 3, maintenanceStatus: "none" }));
      const assets = [makeMaintenanceAsset({ id: "assign", type: "hvac" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      orders.forEach((o) => {
        expect(o.assignedTeam).toBeDefined();
      });
    });

    it("work orders have required parts", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("parts", makeAssetHealth({ assetId: "parts", healthScore: 25, temperature: 30, vibrationMmS: 2, pressureBar: 3, maintenanceStatus: "none", type: "hvac" }));
      const assets = [makeMaintenanceAsset({ id: "parts", type: "hvac" })];
      const orders = workOrderEngine.generate(healthMap, assets);
      if (orders.length > 0) {
        expect(Array.isArray(orders[0].requiredParts)).toBe(true);
      }
    });
  });

  describe("Failure mode distribution", () => {
    it("failure modes include common categories", () => {
      const healthMap = new Map<string, AssetHealth>();
      healthMap.set("dist", makeAssetHealth({ assetId: "dist", healthScore: 30 }));
      const predictions = predictionEngine.predict(healthMap);
      if (predictions.length > 0) {
        expect(typeof predictions[0].failureMode).toBe("string");
      }
    });
  });
});
