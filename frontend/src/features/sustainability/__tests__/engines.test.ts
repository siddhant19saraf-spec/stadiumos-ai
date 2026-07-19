// @ts-nocheck
import { describe, it, expect } from "vitest";
import type { EnergyAsset, WaterAsset, WasteAsset, CarbonMetrics, EnergyMetrics, WaterMetrics, WasteMetrics } from "../types";
import { ENERGY_ASSETS, WATER_ASSETS, WASTE_ASSETS, SIMULATION_SCENARIOS, ALERT_THRESHOLDS, SUSTAINABILITY_TARGETS, CARBON_FACTORS, UTILITY_RATES } from "../constants";
import { MockEnergyEngine } from "../services/energy-engine";
import { MockWaterEngine } from "../services/water-engine";
import { MockWasteEngine } from "../services/waste-engine";
import { MockCarbonEngine } from "../services/carbon-engine";
import { MockRecommendationEngine } from "../services/recommendation-engine";
import { MockAnalyticsEngine } from "../services/analytics-engine";
import { MockSimulationEngine } from "../services/simulation-engine";
import { MockReportingEngine } from "../services/reporting-engine";
import { sustainabilityService } from "../services/sustainability-service";

function makeEnergyMetrics(overrides: Partial<EnergyMetrics> = {}): EnergyMetrics {
  return {
    assetId: "hvac-north", assetName: "North Stand HVAC", consumptionKw: 320, demandKw: 340,
    peakDemandKw: 400, voltage: 230, currentA: 1391, powerFactor: 0.92, temperature: 38,
    efficiency: 72, source: "grid", co2Intensity: 0.425, costPerKwh: 0.12,
    timestamp: new Date().toISOString(), ...overrides,
  };
}

function makeWaterMetrics(overrides: Partial<WaterMetrics> = {}): WaterMetrics {
  return {
    assetId: "rest-north", assetName: "North Stand Restrooms", flowRateLmin: 45,
    totalConsumptionL: 2700, pressureBar: 3.5, temperature: 20, ph: 7.2,
    turbidity: 0.5, leakProbability: 2, backflowRisk: 1, timestamp: new Date().toISOString(), ...overrides,
  };
}

function makeWasteMetrics(overrides: Partial<WasteMetrics> = {}): WasteMetrics {
  return {
    assetId: "waste-food-1", assetName: "North Concourse Food Waste", fillLevelPct: 45,
    totalKg: 180, recyclablePct: 10, organicPct: 70, hazardousPct: 0,
    temperature: 22, lastCollection: new Date().toISOString(), nextCollection: new Date(Date.now() + 86400000).toISOString(),
    overflowRisk: 15, timestamp: new Date().toISOString(), ...overrides,
  };
}

function makeCarbonMetrics(overrides: Partial<CarbonMetrics> = {}): CarbonMetrics {
  return {
    scope1: 850, scope2: 12500, scope3: 4200, totalCO2: 17550,
    co2PerKwh: 0.425, renewablePct: 28, carbonOffset: 1200, netCO2: 16350,
    timestamp: new Date().toISOString(), ...overrides,
  };
}

describe("Constants", () => {
  it("should have 29 energy assets", () => {
    expect(ENERGY_ASSETS.length).toBe(29);
  });

  it("each energy asset should have required fields", () => {
    for (const a of ENERGY_ASSETS) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.type).toBeTruthy();
      expect(a.ratedPowerKw).toBeGreaterThan(0);
    }
  });

  it("should have 18 water assets", () => {
    expect(WATER_ASSETS.length).toBe(18);
  });

  it("should have 12 waste assets", () => {
    expect(WASTE_ASSETS.length).toBe(12);
  });

  it("should have 8 simulation scenarios", () => {
    expect(SIMULATION_SCENARIOS.length).toBe(8);
  });

  it("should have valid threshold values", () => {
    expect(ALERT_THRESHOLDS.POWER_SPIKE_PCT).toBe(25);
    expect(ALERT_THRESHOLDS.WASTE_OVERFLOW_PCT).toBe(85);
    expect(ALERT_THRESHOLDS.EMISSION_BREACH_CO2_KG).toBe(1000);
  });

  it("should have carbon factors configured", () => {
    expect(CARBON_FACTORS.gridElectricityKgCO2PerKwh).toBe(0.425);
    expect(CARBON_FACTORS.solarKgCO2PerKwh).toBe(0.05);
  });

  it("should have utility rates configured", () => {
    expect(UTILITY_RATES.electricityCostPerKwh).toBe(0.12);
    expect(UTILITY_RATES.waterCostPerLiter).toBe(0.002);
  });

  it("should have sustainability targets", () => {
    expect(SUSTAINABILITY_TARGETS.carbonNeutralYear).toBe(2035);
    expect(SUSTAINABILITY_TARGETS.renewablePctTarget).toBe(50);
  });
});

describe("EnergyEngine", () => {
  const engine = new MockEnergyEngine();

  it("should return all energy assets", () => {
    expect(engine.getAssets().length).toBe(29);
  });

  it("should generate metrics for all assets", () => {
    const metrics = engine.getMetrics(engine.getAssets());
    expect(metrics.length).toBe(29);
    for (const m of metrics) {
      expect(m.consumptionKw).toBeGreaterThan(0);
      expect(m.efficiency).toBeGreaterThan(0);
      expect(m.efficiency).toBeLessThanOrEqual(100);
      expect(m.timestamp).toBeTruthy();
    }
  });

  it("should produce different metrics on different ticks", () => {
    const first = engine.getMetrics(engine.getAssets(), 0);
    const second = engine.getMetrics(engine.getAssets(), 100);
    expect(first[0]!.consumptionKw).not.toBe(second[0]!.consumptionKw);
  });

  it("should generate predictions for inefficient assets", () => {
    const metrics = [makeEnergyMetrics({ efficiency: 45, temperature: 52 })];
    const predictions = engine.predict(metrics);
    expect(predictions.length).toBeGreaterThan(0);
  });

  it("should not generate predictions for efficient assets", () => {
    const metrics = [makeEnergyMetrics({ efficiency: 92, temperature: 25 })];
    const predictions = engine.predict(metrics);
    expect(predictions.length).toBe(0);
  });

  it("predictions should include all required fields", () => {
    const metrics = [makeEnergyMetrics({ efficiency: 40 })];
    const predictions = engine.predict(metrics);
    for (const p of predictions) {
      expect(p.assetId).toBeTruthy();
      expect(p.type).toBeTruthy();
      expect(p.probability).toBeGreaterThanOrEqual(15);
      expect(p.confidence).toBeGreaterThanOrEqual(70);
      expect(p.recommendedAction).toBeTruthy();
      expect(p.estimatedCostSavings).toBeGreaterThan(0);
      expect(p.estimatedCarbonReduction).toBeGreaterThan(0);
    }
  });

  it("should calculate total consumption", () => {
    const metrics = [makeEnergyMetrics({ consumptionKw: 100 }), makeEnergyMetrics({ assetId: "b", assetName: "B", consumptionKw: 200 })];
    expect(engine.getTotalConsumption(metrics)).toBe(300);
  });

  it("should calculate live demand", () => {
    const metrics = [makeEnergyMetrics({ demandKw: 150 }), makeEnergyMetrics({ assetId: "b", assetName: "B", demandKw: 250 })];
    expect(engine.getLiveDemand(metrics)).toBe(400);
  });

  it("should calculate renewable percentage", () => {
    const metrics = [
      makeEnergyMetrics({ assetId: "a", assetName: "A", consumptionKw: 100, source: "grid" }),
      makeEnergyMetrics({ assetId: "b", assetName: "B", consumptionKw: 100, source: "solar" }),
    ];
    expect(engine.getRenewablePct(metrics)).toBe(50);
  });
});

describe("WaterEngine", () => {
  const engine = new MockWaterEngine();

  it("should return all water assets", () => {
    expect(engine.getAssets().length).toBe(18);
  });

  it("should generate metrics for all assets", () => {
    const metrics = engine.getMetrics(engine.getAssets());
    expect(metrics.length).toBe(18);
    for (const m of metrics) {
      expect(m.totalConsumptionL).toBeGreaterThanOrEqual(0);
      expect(m.leakProbability).toBeGreaterThanOrEqual(0);
    }
  });

  it("should generate predictions for high leak probability", () => {
    const metrics = [makeWaterMetrics({ leakProbability: 35 })];
    const predictions = engine.predict(metrics);
    expect(predictions.length).toBeGreaterThan(0);
  });

  it("should calculate total consumption", () => {
    const metrics = [makeWaterMetrics({ totalConsumptionL: 5000 }), makeWaterMetrics({ assetId: "b", assetName: "B", totalConsumptionL: 3000 })];
    expect(engine.getTotalConsumption(metrics)).toBe(8000);
  });
});

describe("WasteEngine", () => {
  const engine = new MockWasteEngine();

  it("should return all waste assets", () => {
    expect(engine.getAssets().length).toBe(12);
  });

  it("should generate metrics for all assets", () => {
    const metrics = engine.getMetrics(engine.getAssets());
    expect(metrics.length).toBe(12);
    for (const m of metrics) {
      expect(m.fillLevelPct).toBeGreaterThanOrEqual(5);
      expect(m.fillLevelPct).toBeLessThanOrEqual(100);
    }
  });

  it("should generate predictions for high fill level", () => {
    const metrics = [makeWasteMetrics({ fillLevelPct: 80, overflowRisk: 65 })];
    const predictions = engine.predict(metrics);
    expect(predictions.length).toBeGreaterThan(0);
  });

  it("should calculate total waste", () => {
    const metrics = [makeWasteMetrics({ totalKg: 200 }), makeWasteMetrics({ assetId: "b", assetName: "B", totalKg: 150 })];
    expect(engine.getTotalWaste(metrics)).toBe(350);
  });
});

describe("CarbonEngine", () => {
  const engine = new MockCarbonEngine();

  it("should calculate carbon metrics from energy and waste data", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 1000, source: "grid" })];
    const waste = [makeWasteMetrics({ totalKg: 100, recyclablePct: 50, organicPct: 20 })];
    const carbon = engine.calculate(energy, waste, 10000);
    expect(carbon.totalCO2).toBeGreaterThan(0);
    expect(carbon.scope1).toBeGreaterThanOrEqual(0);
    expect(carbon.scope2).toBeGreaterThan(0);
    expect(carbon.scope3).toBeGreaterThan(0);
    expect(carbon.renewablePct).toBeGreaterThanOrEqual(0);
    expect(carbon.timestamp).toBeTruthy();
  });

  it("should calculate scope 1 emissions from generators", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, source: "generator" })];
    const scope1 = engine.getScope1(energy);
    expect(scope1).toBeCloseTo(100 * 0.85, 1);
  });

  it("should calculate scope 2 emissions from grid", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, source: "grid" })];
    const scope2 = engine.getScope2(energy);
    expect(scope2).toBeCloseTo(100 * 0.425, 1);
  });

  it("should return net-zero progress", () => {
    const carbon = makeCarbonMetrics({ netCO2: 12000 });
    const progress = engine.getNetZeroProgress(carbon);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThanOrEqual(100);
  });

  it("should generate carbon forecast", () => {
    const carbon = makeCarbonMetrics();
    const forecast = engine.getForecast(carbon, 12);
    expect(forecast.length).toBe(12);
    for (const f of forecast) {
      expect(f.month).toBeTruthy();
      expect(f.co2Kg).toBeGreaterThan(0);
    }
  });
});

describe("RecommendationEngine", () => {
  const engine = new MockRecommendationEngine();

  it("should generate recommendations from energy and water data", () => {
    const energy = [makeEnergyMetrics({ efficiency: 48 })];
    const water = [makeWaterMetrics({ leakProbability: 28 })];
    const waste = [makeWasteMetrics({ fillLevelPct: 50 })];
    const recs = engine.generate(energy, water, waste);
    expect(recs.length).toBeGreaterThan(0);
  });

  it("recommendations should include all required fields", () => {
    const energy = [makeEnergyMetrics({ efficiency: 45 })];
    const recs = engine.generate(energy, [], []);
    for (const r of recs) {
      expect(r.id).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.category).toBeTruthy();
      expect(r.priority).toBeTruthy();
      expect(r.estimatedCostSavings).toBeGreaterThanOrEqual(0);
      expect(r.estimatedCarbonReduction).toBeGreaterThanOrEqual(0);
      expect(r.suggestedAction).toBeTruthy();
    }
  });

  it("should sort by priority", () => {
    const energy = [makeEnergyMetrics({ efficiency: 45 })];
    const recs = engine.generate(energy, [], []);
    for (let i = 1; i < recs.length; i++) {
      const priorityOrder: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
      expect(priorityOrder[recs[i]!.priority] ?? 99).toBeGreaterThanOrEqual(priorityOrder[recs[i - 1]!.priority] ?? 0);
    }
  });

  it("should filter by priority", () => {
    const recs = [
      { id: "r1", priority: "p0" as const, title: "T1", description: "", category: "energy" as const, status: "active" as const, domain: "energy" as const, assetId: "a", assetName: "A", estimatedSavingsKwh: 0, estimatedWaterSavingsL: 0, estimatedCostSavings: 0, estimatedCarbonReduction: 0, implementationCost: 0, roi: 0, paybackDays: 0, reasoning: [], contributingFactors: [], suggestedAction: "", automationPossible: false, timestamp: "" },
      { id: "r2", priority: "p2" as const, title: "T2", description: "", category: "water" as const, status: "active" as const, domain: "water" as const, assetId: "b", assetName: "B", estimatedSavingsKwh: 0, estimatedWaterSavingsL: 0, estimatedCostSavings: 0, estimatedCarbonReduction: 0, implementationCost: 0, roi: 0, paybackDays: 0, reasoning: [], contributingFactors: [], suggestedAction: "", automationPossible: false, timestamp: "" },
    ];
    const p0 = engine.getByPriority(recs, "p0");
    expect(p0.length).toBe(1);
    expect(p0[0]!.id).toBe("r1");
  });

  it("should filter by category", () => {
    const recs = [
      { id: "r1", priority: "p0" as const, title: "T1", description: "", category: "energy" as const, status: "active" as const, domain: "energy" as const, assetId: "a", assetName: "A", estimatedSavingsKwh: 0, estimatedWaterSavingsL: 0, estimatedCostSavings: 0, estimatedCarbonReduction: 0, implementationCost: 0, roi: 0, paybackDays: 0, reasoning: [], contributingFactors: [], suggestedAction: "", automationPossible: false, timestamp: "" },
      { id: "r2", priority: "p2" as const, title: "T2", description: "", category: "water" as const, status: "active" as const, domain: "water" as const, assetId: "b", assetName: "B", estimatedSavingsKwh: 0, estimatedWaterSavingsL: 0, estimatedCostSavings: 0, estimatedCarbonReduction: 0, implementationCost: 0, roi: 0, paybackDays: 0, reasoning: [], contributingFactors: [], suggestedAction: "", automationPossible: false, timestamp: "" },
    ];
    const water = engine.getByCategory(recs, "water");
    expect(water.length).toBe(1);
    expect(water[0]!.id).toBe("r2");
  });
});

describe("AnalyticsEngine", () => {
  const engine = new MockAnalyticsEngine();

  it("should compute sustainability summary", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 1000, demandKw: 1100, efficiency: 75, source: "grid" })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 200 })];
    const carbon = makeCarbonMetrics({ totalCO2: 17550, renewablePct: 28, netCO2: 16350 });
    const summary = engine.computeSummary(energy, water, waste, carbon);
    expect(summary.totalEnergyKwh).toBe(1000);
    expect(summary.livePowerDemandKw).toBe(1100);
    expect(summary.totalWaterL).toBe(5000);
    expect(summary.wasteGeneratedKg).toBe(200);
    expect(summary.sustainabilityScore).toBeGreaterThan(0);
    expect(summary.sustainabilityScore).toBeLessThanOrEqual(100);
    expect(summary.esgComplianceScore).toBeGreaterThan(0);
    expect(summary.netZeroProgress).toBeGreaterThanOrEqual(0);
  });

  it("should compute 90-day trends", () => {
    const trends = engine.computeTrends();
    expect(trends.length).toBe(90);
    for (const t of trends) {
      expect(t.date).toBeTruthy();
      expect(t.energyKwh).toBeGreaterThan(0);
      expect(t.waterL).toBeGreaterThan(0);
    }
  });

  it("should compute ESG KPIs", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 1000, efficiency: 72 })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 300 })];
    const carbon = makeCarbonMetrics({ totalCO2: 17550, renewablePct: 28, netCO2: 16350 });
    const summary = engine.computeSummary(energy, water, waste, carbon);
    const kpis = engine.computeESGKpis(summary);
    expect(kpis.length).toBeGreaterThan(0);
    for (const kpi of kpis) {
      expect(kpi.category).toBeTruthy();
      expect(kpi.metric).toBeTruthy();
      expect(kpi.target).toBeGreaterThan(0);
      expect(["on_track", "at_risk", "behind", "achieved"]).toContain(kpi.status);
      expect(["improving", "stable", "declining"]).toContain(kpi.trend);
    }
  });

  it("should compute cost savings", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, efficiency: 72 })];
    const savings = engine.computeCostSavings(energy);
    expect(savings).toBeGreaterThan(0);
  });

  it("should compute carbon reduction", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, efficiency: 72 })];
    const reduction = engine.computeCarbonReduction(energy);
    expect(reduction).toBeGreaterThan(0);
  });
});

describe("SimulationEngine", () => {
  const engine = new MockSimulationEngine();

  it("should return all scenarios", () => {
    const scenarios = engine.getScenarios();
    expect(scenarios.length).toBe(8);
  });

  it("each scenario should have required fields", () => {
    for (const s of engine.getScenarios()) {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.impactMetrics.energyIncreasePct).toBeDefined();
      expect(s.mitigationStrategies.length).toBeGreaterThan(0);
    }
  });

  it("should run simulation and return result", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 1000 })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 200 })];
    const carbon = makeCarbonMetrics();
    const result = engine.run("heatwave", energy, water, waste, carbon);
    expect(result.scenarioId).toBe("heatwave");
    expect(result.predictedEnergyKwh).toBeGreaterThan(0);
    expect(result.mitigatedEnergyKwh).toBeGreaterThan(0);
    expect(result.costSavings).toBeGreaterThan(0);
    expect(result.recommendedActions.length).toBeGreaterThan(0);
    expect(result.aiStrategies.length).toBeGreaterThan(0);
  });

  it("should produce different results for different scenarios", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 1000 })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 200 })];
    const carbon = makeCarbonMetrics();
    const heatwave = engine.run("heatwave", energy, water, waste, carbon);
    const outage = engine.run("power_outage", energy, water, waste, carbon);
    expect(heatwave.predictedEnergyKwh).not.toBe(outage.predictedEnergyKwh);
  });
});

describe("ReportingEngine", () => {
  const engine = new MockReportingEngine();

  it("should generate executive report", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 1000, efficiency: 72 })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 300 })];
    const carbon = makeCarbonMetrics({ totalCO2: 17550, renewablePct: 28, netCO2: 16350 });
    const analytics = new MockAnalyticsEngine();
    const summary = analytics.computeSummary(energy, water, waste, carbon);
    const kpis = analytics.computeESGKpis(summary);
    const trends = analytics.computeTrends();
    const recommendations = new MockRecommendationEngine().generate(energy, water, waste);
    const report = engine.generate(summary, kpis, recommendations, trends);
    expect(report.id).toBeTruthy();
    expect(report.title).toBe("Sustainability Executive Report");
    expect(report.period).toBeTruthy();
    expect(report.summary.totalEnergyKwh).toBe(1000);
    expect(report.energyKpis.length).toBeGreaterThan(0);
    expect(report.waterKpis.length).toBeGreaterThan(0);
    expect(report.wasteKpis.length).toBeGreaterThan(0);
    expect(report.carbonKpis.length).toBeGreaterThan(0);
    expect(report.esgScorecard.length).toBeGreaterThan(0);
    expect(report.topRecommendations.length).toBeGreaterThan(0);
    expect(report.forecast.netZeroProjectedDate).toBeTruthy();
  });

  it("should return report history", () => {
    const history = engine.getReportHistory();
    expect(history.length).toBe(6);
    for (const h of history) {
      expect(h.id).toBeTruthy();
      expect(h.title).toBeTruthy();
    }
  });
});

describe("SustainabilityService", () => {
  it("should initialize full state", () => {
    const state = sustainabilityService.initialize();
    expect(state.summary).not.toBeNull();
    expect(state.energyMetrics.length).toBe(29);
    expect(state.waterMetrics.length).toBe(18);
    expect(state.wasteMetrics.length).toBe(12);
    expect(state.carbonMetrics).not.toBeNull();
    expect(state.energyPredictions.length).toBeGreaterThan(0);
    expect(state.waterPredictions.length).toBeGreaterThan(0);
    expect(state.recommendations.length).toBeGreaterThan(0);
    expect(state.alerts.length).toBeGreaterThan(0);
    expect(state.trends.length).toBe(90);
    expect(state.esgKpis.length).toBeGreaterThan(0);
    expect(state.lastUpdated).toBeTruthy();
  });

  it("should refresh with updated metrics", () => {
    const state = sustainabilityService.initialize();
    const firstEnergy = state.energyMetrics[0]!.consumptionKw;
    const refreshed = sustainabilityService.refresh(state);
    const secondEnergy = refreshed.energyMetrics[0]!.consumptionKw;
    expect(firstEnergy).not.toBe(secondEnergy);
    expect(refreshed.lastUpdated).not.toBe(state.lastUpdated);
  });

  it("should run simulation and store result", () => {
    const state = sustainabilityService.initialize();
    const withSim = sustainabilityService.runSimulation(state, "heatwave");
    expect(withSim.simulationResult).not.toBeNull();
    expect(withSim.simulationResult!.scenarioId).toBe("heatwave");
  });

  it("should acknowledge an alert", () => {
    const state = sustainabilityService.initialize();
    const alertId = state.alerts[0]!.id;
    const acked = sustainabilityService.acknowledgeAlert(state, alertId);
    const alert = acked.alerts.find((a) => a.id === alertId);
    expect(alert!.acknowledged).toBe(true);
    expect(alert!.acknowledgedAt).toBeTruthy();
  });

  it("should generate report", () => {
    const state = sustainabilityService.initialize();
    const withReport = sustainabilityService.generateReport(state);
    expect(withReport.lastReport).not.toBeNull();
    expect(withReport.lastReport!.title).toBe("Sustainability Executive Report");
  });
});

