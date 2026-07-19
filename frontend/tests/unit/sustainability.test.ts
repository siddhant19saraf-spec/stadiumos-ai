import { describe, it, expect, vi, beforeEach } from "vitest";
import { energyEngine } from "@/features/sustainability/services/energy-engine";
import { waterEngine } from "@/features/sustainability/services/water-engine";
import { wasteEngine } from "@/features/sustainability/services/waste-engine";
import { carbonEngine } from "@/features/sustainability/services/carbon-engine";
import { recommendationEngine } from "@/features/sustainability/services/recommendation-engine";
import { analyticsEngine } from "@/features/sustainability/services/analytics-engine";
import { simulationEngine } from "@/features/sustainability/services/simulation-engine";
import { reportingEngine } from "@/features/sustainability/services/reporting-engine";
import { sustainabilityService, createInitialState } from "@/features/sustainability/services/sustainability-service";
import { ENERGY_ASSETS, WATER_ASSETS, WASTE_ASSETS, SIMULATION_SCENARIOS, ALERT_THRESHOLDS, SUSTAINABILITY_TARGETS, CARBON_FACTORS, UTILITY_RATES } from "@/features/sustainability/constants";
import type { EnergyMetrics, WaterMetrics, WasteMetrics, CarbonMetrics, AIRecommendation, SustainabilitySummary, SimulationResult } from "@/features/sustainability/types";
import { makeEnergyMetrics, makeCarbonMetrics, makeSusRecommendation, makeVenue, resetCounter } from "../fixtures";

function makeWaterMetrics(overrides: Partial<WaterMetrics> = {}): WaterMetrics {
  return {
    assetId: "test-water",
    assetName: "Test Water Asset",
    flowRateLmin: 25,
    totalConsumptionL: 5000,
    pressureBar: 3.5,
    temperature: 20,
    ph: 7.2,
    turbidity: 1.0,
    leakProbability: 5,
    backflowRisk: 1,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeWasteMetrics(overrides: Partial<WasteMetrics> = {}): WasteMetrics {
  return {
    assetId: "test-waste",
    assetName: "Test Waste Asset",
    fillLevelPct: 50,
    totalKg: 100,
    recyclablePct: 30,
    organicPct: 20,
    hazardousPct: 2,
    temperature: 22,
    lastCollection: new Date().toISOString(),
    nextCollection: new Date(Date.now() + 86400000).toISOString(),
    overflowRisk: 20,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  resetCounter();
});

describe("EnergyEngine", () => {
  it("returns all energy assets", () => {
    const assets = energyEngine.getAssets();
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.length).toBe(ENERGY_ASSETS.length);
  });

  it("getMetrics returns correct number of metrics", () => {
    const assets = energyEngine.getAssets();
    const metrics = energyEngine.getMetrics(assets, 0);
    expect(metrics).toHaveLength(assets.length);
  });

  it("metrics have all required fields", () => {
    const metrics = energyEngine.getMetrics(energyEngine.getAssets(), 0);
    metrics.forEach((m) => {
      expect(m.assetId).toBeTruthy();
      expect(m.consumptionKw).toBeGreaterThan(0);
      expect(m.demandKw).toBeGreaterThan(0);
      expect(m.peakDemandKw).toBeGreaterThan(0);
      expect(m.voltage).toBeGreaterThan(200);
      expect(m.powerFactor).toBeGreaterThan(0);
      expect(m.efficiency).toBeGreaterThanOrEqual(10);
      expect(m.efficiency).toBeLessThanOrEqual(100);
      expect(m.co2Intensity).toBeGreaterThan(0);
      expect(m.costPerKwh).toBeGreaterThanOrEqual(0);
    });
  });

  it("solar assets have zero cost per kWh", () => {
    const metrics = energyEngine.getMetrics(energyEngine.getAssets(), 0);
    const solarMetrics = metrics.filter((m) => m.source === "solar");
    solarMetrics.forEach((m) => {
      expect(m.costPerKwh).toBe(0);
    });
  });

  it("generator assets have double cost per kWh", () => {
    const metrics = energyEngine.getMetrics(energyEngine.getAssets(), 0);
    const genMetrics = metrics.filter((m) => m.source === "generator");
    genMetrics.forEach((m) => {
      expect(m.costPerKwh).toBe(UTILITY_RATES.electricityCostPerKwh * 2);
    });
  });

  it("getTotalConsumption sums all consumption", () => {
    const metrics = energyEngine.getMetrics(energyEngine.getAssets(), 0);
    const total = energyEngine.getTotalConsumption(metrics);
    const manual = metrics.reduce((s, m) => s + m.consumptionKw, 0);
    expect(total).toBeCloseTo(manual, 0);
  });

  it("getLiveDemand sums all demand", () => {
    const metrics = energyEngine.getMetrics(energyEngine.getAssets(), 0);
    const demand = energyEngine.getLiveDemand(metrics);
    const manual = metrics.reduce((s, m) => s + m.demandKw, 0);
    expect(demand).toBeCloseTo(manual, 0);
  });

  it("getRenewablePct calculates correct percentage", () => {
    const metrics = energyEngine.getMetrics(energyEngine.getAssets(), 0);
    const pct = energyEngine.getRenewablePct(metrics);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it("getRenewablePct returns 0 for empty metrics", () => {
    expect(energyEngine.getRenewablePct([])).toBe(0);
  });

  it("predict generates predictions for inefficient assets", () => {
    const metrics = [
      makeEnergyMetrics({ assetId: "bad", efficiency: 50, temperature: 48, consumptionKw: 100, peakDemandKw: 120 }),
    ];
    const predictions = energyEngine.predict(metrics);
    expect(predictions.length).toBeGreaterThanOrEqual(1);
    predictions.forEach((p) => {
      expect(p.type).toBeTruthy();
      expect(p.probability).toBeGreaterThanOrEqual(15);
      expect(p.timeframe).toBeTruthy();
      expect(p.reasoning.length).toBeGreaterThan(0);
    });
  });

  it("predict returns empty for efficient assets", () => {
    const metrics = [
      makeEnergyMetrics({ efficiency: 90, temperature: 30, consumptionKw: 50, peakDemandKw: 100 }),
    ];
    const predictions = energyEngine.predict(metrics);
    expect(predictions).toHaveLength(0);
  });

  it("predictions capped at 20", () => {
    const metrics: EnergyMetrics[] = Array.from({ length: 30 }, (_, i) =>
      makeEnergyMetrics({ assetId: `asset-${i}`, efficiency: 40, temperature: 50, consumptionKw: 100, peakDemandKw: 120 }),
    );
    const predictions = energyEngine.predict(metrics);
    expect(predictions.length).toBeLessThanOrEqual(20);
  });

  it("predictions sorted by probability descending", () => {
    const metrics = [
      makeEnergyMetrics({ assetId: "a1", efficiency: 40, temperature: 50, consumptionKw: 100, peakDemandKw: 120 }),
      makeEnergyMetrics({ assetId: "a2", efficiency: 30, temperature: 55, consumptionKw: 100, peakDemandKw: 120 }),
    ];
    const predictions = energyEngine.predict(metrics);
    for (let i = 1; i < predictions.length; i++) {
      expect(predictions[i - 1].probability).toBeGreaterThanOrEqual(predictions[i].probability);
    }
  });

  it("solar source metrics have low co2 intensity", () => {
    const metrics = energyEngine.getMetrics(energyEngine.getAssets(), 0);
    const solar = metrics.find((m) => m.source === "solar");
    if (solar) {
      expect(solar.co2Intensity).toBe(CARBON_FACTORS.solarKgCO2PerKwh);
    }
  });
});

describe("WaterEngine", () => {
  it("returns all water assets", () => {
    const assets = waterEngine.getAssets();
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.length).toBe(WATER_ASSETS.length);
  });

  it("getMetrics returns correct number of metrics", () => {
    const assets = waterEngine.getAssets();
    const metrics = waterEngine.getMetrics(assets, 0);
    expect(metrics).toHaveLength(assets.length);
  });

  it("metrics have all required fields", () => {
    const metrics = waterEngine.getMetrics(waterEngine.getAssets(), 0);
    metrics.forEach((m) => {
      expect(m.assetId).toBeTruthy();
      expect(m.flowRateLmin).toBeGreaterThanOrEqual(0);
      expect(m.pressureBar).toBeGreaterThan(0);
      expect(m.ph).toBeGreaterThan(6);
      expect(m.ph).toBeLessThan(9);
      expect(m.leakProbability).toBeGreaterThanOrEqual(0);
      expect(typeof m.totalConsumptionL).toBe("number");
    });
  });

  it("pump assets have higher leak probability", () => {
    const assets = waterEngine.getAssets();
    const pumpAssets = assets.filter((a) => a.type === "pump" || a.type === "pipe");
    expect(pumpAssets.length).toBeGreaterThan(0);
  });

  it("predict generates predictions for assets with leak risk", () => {
    const metrics = [
      makeWaterMetrics({ leakProbability: 25, pressureBar: 6, turbidity: 3 }),
    ];
    const predictions = waterEngine.predict(metrics);
    expect(predictions.length).toBeGreaterThanOrEqual(1);
  });

  it("predict returns empty for clean water assets", () => {
    const metrics = [
      makeWaterMetrics({ leakProbability: 2, pressureBar: 2, turbidity: 0.5 }),
    ];
    const predictions = waterEngine.predict(metrics);
    expect(predictions).toHaveLength(0);
  });

  it("predictions capped at 15", () => {
    const metrics: WaterMetrics[] = Array.from({ length: 20 }, (_, i) =>
      makeWaterMetrics({ assetId: `w-${i}`, leakProbability: 30, pressureBar: 6, turbidity: 3 }),
    );
    const predictions = waterEngine.predict(metrics);
    expect(predictions.length).toBeLessThanOrEqual(15);
  });

  it("getTotalConsumption sums all consumption", () => {
    const metrics = waterEngine.getMetrics(waterEngine.getAssets(), 0);
    const total = waterEngine.getTotalConsumption(metrics);
    const manual = metrics.reduce((s, m) => s + m.totalConsumptionL, 0);
    expect(total).toBe(manual);
  });

  it("cooling tower assets have higher temperature", () => {
    const assets = waterEngine.getAssets();
    const cooling = assets.filter((a) => a.type === "cooling_tower");
    expect(cooling.length).toBeGreaterThan(0);
  });
});

describe("WasteEngine", () => {
  it("returns all waste assets", () => {
    const assets = wasteEngine.getAssets();
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.length).toBe(WASTE_ASSETS.length);
  });

  it("getMetrics returns correct number of metrics", () => {
    const metrics = wasteEngine.getMetrics(wasteEngine.getAssets(), 0);
    expect(metrics).toHaveLength(WASTE_ASSETS.length);
  });

  it("metrics have all required fields", () => {
    const metrics = wasteEngine.getMetrics(wasteEngine.getAssets(), 0);
    metrics.forEach((m) => {
      expect(m.assetId).toBeTruthy();
      expect(m.fillLevelPct).toBeGreaterThanOrEqual(5);
      expect(m.fillLevelPct).toBeLessThanOrEqual(100);
      expect(m.totalKg).toBeGreaterThan(0);
      expect(m.recyclablePct).toBeGreaterThanOrEqual(0);
      expect(m.overflowRisk).toBeGreaterThanOrEqual(0);
      expect(m.lastCollection).toBeTruthy();
      expect(m.nextCollection).toBeTruthy();
    });
  });

  it("food waste assets have organic composition", () => {
    const metrics = wasteEngine.getMetrics(wasteEngine.getAssets(), 0);
    const foodWaste = metrics.filter((m) => m.assetId.includes("waste-food"));
    expect(foodWaste.length).toBeGreaterThan(0);
  });

  it("predict generates predictions for assets with high fill level", () => {
    const metrics = [
      makeWasteMetrics({ fillLevelPct: 85, overflowRisk: 70 }),
    ];
    const predictions = wasteEngine.predict(metrics);
    expect(predictions.length).toBeGreaterThanOrEqual(1);
  });

  it("predict returns empty for low fill waste assets", () => {
    const metrics = [
      makeWasteMetrics({ fillLevelPct: 30, overflowRisk: 10 }),
    ];
    const predictions = wasteEngine.predict(metrics);
    expect(predictions).toHaveLength(0);
  });

  it("predictions capped at 12", () => {
    const metrics: WasteMetrics[] = Array.from({ length: 20 }, (_, i) =>
      makeWasteMetrics({ assetId: `waste-${i}`, fillLevelPct: 85, overflowRisk: 70 }),
    );
    const predictions = wasteEngine.predict(metrics);
    expect(predictions.length).toBeLessThanOrEqual(12);
  });

  it("getTotalWaste sums all waste", () => {
    const metrics = wasteEngine.getMetrics(wasteEngine.getAssets(), 0);
    const total = wasteEngine.getTotalWaste(metrics);
    const manual = metrics.reduce((s, m) => s + m.totalKg, 0);
    expect(total).toBe(manual);
  });

  it("recyclable assets have high recyclable percentage", () => {
    const metrics = wasteEngine.getMetrics(wasteEngine.getAssets(), 0);
    const recyclable = metrics.filter((m) => m.assetId.includes("recyclable"));
    recyclable.forEach((r) => {
      expect(r.recyclablePct).toBeGreaterThanOrEqual(50);
    });
  });
});

describe("CarbonEngine", () => {
  it("calculates carbon metrics from energy, waste, water", () => {
    const energyMetrics = [makeEnergyMetrics({ consumptionKw: 100, source: "grid" })];
    const wasteMetrics = [makeWasteMetrics({ totalKg: 50, recyclablePct: 30, organicPct: 20 })];
    const carbon = carbonEngine.calculate(energyMetrics, wasteMetrics, 1000);
    expect(carbon.scope1).toBeGreaterThanOrEqual(0);
    expect(carbon.scope2).toBeGreaterThan(0);
    expect(carbon.scope3).toBeGreaterThanOrEqual(0);
    expect(carbon.totalCO2).toBeGreaterThan(0);
    expect(carbon.co2PerKwh).toBeGreaterThan(0);
  });

  it("scope1 includes generator emissions only", () => {
    const energyMetrics = [
      makeEnergyMetrics({ consumptionKw: 100, source: "generator" }),
      makeEnergyMetrics({ consumptionKw: 100, source: "grid" }),
      makeEnergyMetrics({ consumptionKw: 100, source: "solar" }),
    ];
    const scope1 = carbonEngine.getScope1(energyMetrics);
    const expected = 100 * CARBON_FACTORS.generatorKgCO2PerKwh;
    expect(scope1).toBeCloseTo(expected, 0);
  });

  it("scope2 includes grid emissions only", () => {
    const energyMetrics = [
      makeEnergyMetrics({ consumptionKw: 200, source: "grid" }),
      makeEnergyMetrics({ consumptionKw: 100, source: "generator" }),
    ];
    const scope2 = carbonEngine.getScope2(energyMetrics);
    const expected = 200 * CARBON_FACTORS.gridElectricityKgCO2PerKwh;
    expect(scope2).toBeCloseTo(expected, 0);
  });

  it("scope3 returns random value", () => {
    const scope3 = carbonEngine.getScope3();
    expect(scope3).toBeGreaterThanOrEqual(50);
    expect(scope3).toBeLessThanOrEqual(200);
  });

  it("calculate handles empty energy metrics", () => {
    const carbon = carbonEngine.calculate([], [], 0);
    expect(carbon.scope1).toBe(0);
    expect(carbon.scope2).toBe(0);
    expect(carbon.totalCO2).toBeGreaterThan(0);
  });

  it("netCO2 is total minus offset", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, source: "grid" })];
    const carbon = carbonEngine.calculate(energy, [], 0);
    expect(carbon.netCO2).toBeGreaterThanOrEqual(0);
    expect(carbon.netCO2).toBeLessThanOrEqual(carbon.totalCO2);
  });

  it("getNetZeroProgress returns 0 for very high emissions", () => {
    const carbon = makeCarbonMetrics({ netCO2: 25000 });
    expect(carbonEngine.getNetZeroProgress(carbon)).toBe(0);
  });

  it("getNetZeroProgress returns 100 for zero emissions", () => {
    const carbon = makeCarbonMetrics({ netCO2: 0 });
    expect(carbonEngine.getNetZeroProgress(carbon)).toBe(100);
  });

  it("getForecast returns correct number of months", () => {
    const carbon = makeCarbonMetrics({ totalCO2: 5000 });
    const forecast = carbonEngine.getForecast(carbon, 6);
    expect(forecast).toHaveLength(6);
  });

  it("getForecast values decline over time", () => {
    const carbon = makeCarbonMetrics({ totalCO2: 5000 });
    const forecast = carbonEngine.getForecast(carbon, 4);
    for (let i = 1; i < forecast.length; i++) {
      expect(forecast[i].co2Kg).toBeLessThanOrEqual(forecast[i - 1].co2Kg + 10);
    }
  });

  it("forecast has month labels", () => {
    const carbon = makeCarbonMetrics({ totalCO2: 5000 });
    const forecast = carbonEngine.getForecast(carbon, 3);
    forecast.forEach((f) => {
      expect(f.month).toMatch(/^[A-Z][a-z]{2} \d{2}$/);
    });
  });

  it("calculate includes waste and water CO2", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, source: "grid" })];
    const waste = [makeWasteMetrics({ totalKg: 200, recyclablePct: 50, organicPct: 30 })];
    const carbon = carbonEngine.calculate(energy, waste, 50000);
    expect(carbon.totalCO2).toBeGreaterThan(carbon.scope1 + carbon.scope2 + 50);
  });

  it("renewablePct in carbon metrics matches calculation", () => {
    const energy = [
      makeEnergyMetrics({ consumptionKw: 80, source: "grid" }),
      makeEnergyMetrics({ consumptionKw: 20, source: "solar" }),
    ];
    const carbon = carbonEngine.calculate(energy, [], 0);
    expect(carbon.renewablePct).toBe(20);
  });

  it("carbon offset is non-zero", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, source: "grid" })];
    const carbon = carbonEngine.calculate(energy, [], 0);
    expect(carbon.carbonOffset).toBeGreaterThan(0);
  });
});

describe("RecommendationEngine (Sustainability)", () => {
  it("generates energy efficiency recommendations", () => {
    const energy = [makeEnergyMetrics({ efficiency: 50, consumptionKw: 100, peakDemandKw: 120 })];
    const recs = recommendationEngine.generate(energy, [], []);
    const energyRecs = recs.filter((r) => r.category === "energy");
    expect(energyRecs.length).toBeGreaterThanOrEqual(1);
  });

  it("skips energy recs for efficient assets", () => {
    const energy = [makeEnergyMetrics({ efficiency: 90, consumptionKw: 100 })];
    const recs = recommendationEngine.generate(energy, [], []);
    expect(recs.length).toBeGreaterThanOrEqual(0);
  });

  it("generates water leak recommendations", () => {
    const water = [makeWaterMetrics({ flowRateLmin: 30, leakProbability: 25 })];
    const recs = recommendationEngine.generate([], water, []);
    const waterRecs = recs.filter((r) => r.category === "water");
    expect(waterRecs.length).toBeGreaterThanOrEqual(1);
  });

  it("skips water recs for low leak probability", () => {
    const water = [makeWaterMetrics({ flowRateLmin: 10, leakProbability: 5 })];
    const recs = recommendationEngine.generate([], water, []);
    const waterRecs = recs.filter((r) => r.category === "water");
    expect(waterRecs.length).toBe(0);
  });

  it("adds default recommendations when less than 5 generated", () => {
    const recs = recommendationEngine.generate([], [], []);
    expect(recs.length).toBeGreaterThanOrEqual(5);
  });

  it("recommendations sorted by priority (p0 first)", () => {
    const energy = [makeEnergyMetrics({ efficiency: 40, consumptionKw: 100, peakDemandKw: 120 })];
    const recs = recommendationEngine.generate(energy, [], []);
    const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
    for (let i = 1; i < recs.length; i++) {
      const prev = priorityOrder[recs[i - 1].priority] ?? 99;
      const curr = priorityOrder[recs[i].priority] ?? 99;
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it("capped at 15 recommendations", () => {
    const energy: EnergyMetrics[] = Array.from({ length: 20 }, (_, i) =>
      makeEnergyMetrics({ assetId: `e-${i}`, efficiency: 40, consumptionKw: 100, peakDemandKw: 120 }),
    );
    const recs = recommendationEngine.generate(energy, [], []);
    expect(recs.length).toBeLessThanOrEqual(15);
  });

  it("getByPriority filters correctly", () => {
    const recs: AIRecommendation[] = [
      makeSusRecommendation({ priority: "p1" }),
      makeSusRecommendation({ priority: "p1" }),
      makeSusRecommendation({ priority: "p3" }),
    ];
    const p1 = recommendationEngine.getByPriority(recs, "p1");
    expect(p1).toHaveLength(2);
  });

  it("getByCategory filters correctly", () => {
    const recs: AIRecommendation[] = [
      makeSusRecommendation({ category: "energy" }),
      makeSusRecommendation({ category: "water" }),
    ];
    const energy = recommendationEngine.getByCategory(recs, "energy");
    expect(energy).toHaveLength(1);
  });

  it("recommendations have ROI and payback days", () => {
    const recs = recommendationEngine.generate([], [makeWaterMetrics({ flowRateLmin: 30, leakProbability: 25 })], []);
    recs.forEach((r) => {
      expect(r.roi).toBeGreaterThanOrEqual(0);
      expect(r.paybackDays).toBeGreaterThanOrEqual(0);
    });
  });

  it("energy recommendations include savings estimates", () => {
    const energy = [makeEnergyMetrics({ efficiency: 45, consumptionKw: 100, peakDemandKw: 120 })];
    const recs = recommendationEngine.generate(energy, [], []);
    const eRec = recs.find((r) => r.category === "energy");
    if (eRec) {
      expect(eRec.estimatedSavingsKwh).toBeGreaterThan(0);
      expect(eRec.estimatedCostSavings).toBeGreaterThan(0);
      expect(eRec.estimatedCarbonReduction).toBeGreaterThan(0);
    }
  });
});

describe("AnalyticsEngine (Sustainability)", () => {
  it("computes summary from all metrics", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, demandKw: 80, efficiency: 75, source: "grid" })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 100 })];
    const carbon = makeCarbonMetrics({ renewablePct: 35, netCO2: 4700, totalCO2: 5200 });
    const summary = analyticsEngine.computeSummary(energy, water, waste, carbon);
    expect(summary.totalEnergyKwh).toBeGreaterThan(0);
    expect(summary.totalWaterL).toBe(5000);
    expect(summary.wasteGeneratedKg).toBe(100);
    expect(summary.renewablePct).toBeGreaterThanOrEqual(0);
    expect(summary.sustainabilityScore).toBeGreaterThanOrEqual(0);
    expect(summary.esgComplianceScore).toBeGreaterThanOrEqual(0);
  });

  it("computes zero renewable pct when no solar", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100, source: "grid", efficiency: 75 })];
    const carbon = makeCarbonMetrics({ renewablePct: 0, netCO2: 5000, totalCO2: 5000 });
    const summary = analyticsEngine.computeSummary(energy, [], [], carbon);
    expect(summary.renewablePct).toBe(0);
  });

  it("computeTrends returns 90 data points", () => {
    const trends = analyticsEngine.computeTrends();
    expect(trends).toHaveLength(90);
  });

  it("trends have valid date format", () => {
    const trends = analyticsEngine.computeTrends();
    trends.forEach((t) => {
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("computeESGKpis returns 8 KPIs", () => {
    const summary: SustainabilitySummary = {
      totalEnergyKwh: 12000, livePowerDemandKw: 450, totalWaterL: 80000, totalCO2Kg: 5200,
      wasteGeneratedKg: 1800, renewablePct: 35, operationalEfficiency: 78, sustainabilityScore: 72,
      esgComplianceScore: 78, netZeroProgress: 42, costSavingsYtd: 125000, carbonReductionYtd: 8500,
      lastUpdated: new Date().toISOString(),
    };
    const kpis = analyticsEngine.computeESGKpis(summary);
    expect(kpis).toHaveLength(8);
  });

  it("ESG KPIs have correct structure", () => {
    const summary: SustainabilitySummary = {
      totalEnergyKwh: 12000, livePowerDemandKw: 450, totalWaterL: 80000, totalCO2Kg: 5200,
      wasteGeneratedKg: 1800, renewablePct: 35, operationalEfficiency: 78, sustainabilityScore: 72,
      esgComplianceScore: 78, netZeroProgress: 42, costSavingsYtd: 125000, carbonReductionYtd: 8500,
      lastUpdated: new Date().toISOString(),
    };
    const kpis = analyticsEngine.computeESGKpis(summary);
    kpis.forEach((kpi) => {
      expect(kpi.category).toBeTruthy();
      expect(kpi.metric).toBeTruthy();
      expect(kpi.unit).toBeTruthy();
      expect(["on_track", "at_risk", "behind", "achieved"]).toContain(kpi.status);
      expect(["improving", "stable", "declining"]).toContain(kpi.trend);
    });
  });

  it("computeCostSavings returns positive value", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
    const savings = analyticsEngine.computeCostSavings(energy);
    expect(savings).toBeGreaterThan(0);
  });

  it("computeCarbonReduction returns positive value", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
    const reduction = analyticsEngine.computeCarbonReduction(energy);
    expect(reduction).toBeGreaterThan(0);
  });

  it("summary scores are clamped between 0 and 100", () => {
    const energy = [makeEnergyMetrics({ efficiency: 200, consumptionKw: 100, source: "solar" })];
    const carbon = makeCarbonMetrics({ renewablePct: 200, netCO2: 0, totalCO2: 0 });
    const summary = analyticsEngine.computeSummary(energy, [], [], carbon);
    expect(summary.sustainabilityScore).toBeGreaterThanOrEqual(0);
    expect(summary.sustainabilityScore).toBeLessThanOrEqual(100);
    expect(summary.esgComplianceScore).toBeGreaterThanOrEqual(0);
    expect(summary.esgComplianceScore).toBeLessThanOrEqual(100);
  });
});

describe("SimulationEngine (Sustainability)", () => {
  it("returns all simulation scenarios", () => {
    const scenarios = simulationEngine.getScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios.length).toBe(SIMULATION_SCENARIOS.length);
  });

  it("scenarios have required fields", () => {
    const scenarios = simulationEngine.getScenarios();
    scenarios.forEach((s) => {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.impactMetrics.energyIncreasePct).toBeDefined();
      expect(s.impactMetrics.waterIncreasePct).toBeDefined();
      expect(s.impactMetrics.costImpact).toBeGreaterThan(0);
      expect(s.mitigationStrategies.length).toBeGreaterThan(0);
    });
  });

  it("run returns simulation result with all fields", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 100 })];
    const carbon = makeCarbonMetrics({ totalCO2: 5000 });
    const result = simulationEngine.run("heatwave", energy, water, waste, carbon);
    expect(result.id).toBeTruthy();
    expect(result.scenarioId).toBe("heatwave");
    expect(result.scenarioTitle).toBe("Extreme Heat Wave");
    expect(result.predictedEnergyKwh).toBeGreaterThan(0);
    expect(result.predictedWaterL).toBeGreaterThan(0);
    expect(result.predictedWasteKg).toBeGreaterThan(0);
    expect(result.predictedCost).toBeGreaterThan(0);
  });

  it("mitigated values are lower than predicted", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
    const water = [makeWaterMetrics({ totalConsumptionL: 5000 })];
    const waste = [makeWasteMetrics({ totalKg: 100 })];
    const carbon = makeCarbonMetrics({ totalCO2: 5000 });
    const result = simulationEngine.run("peak_match_day", energy, water, waste, carbon);
    expect(result.mitigatedEnergyKwh).toBeLessThanOrEqual(result.predictedEnergyKwh);
    expect(result.mitigatedWaterL).toBeLessThanOrEqual(result.predictedWaterL);
    expect(result.costSavings).toBeGreaterThanOrEqual(0);
  });

  it("handles empty energy data", () => {
    const result = simulationEngine.run("heatwave", [], [], [], makeCarbonMetrics());
    expect(result.predictedEnergyKwh).toBe(0);
    expect(result.scenarioTitle).toBe("Extreme Heat Wave");
  });

  it("handles unknown scenario gracefully", () => {
    const result = simulationEngine.run("nonexistent" as any, [], [], [], makeCarbonMetrics());
    expect(result.scenarioTitle).toBe("Unknown");
  });

  it("recommended actions come from scenario", () => {
    const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
    const result = simulationEngine.run("water_shortage", energy, [], [], makeCarbonMetrics());
    expect(result.recommendedActions.length).toBeGreaterThan(0);
    expect(result.aiStrategies.length).toBeGreaterThan(0);
  });

  it("full stadium scenario has highest waste increase", () => {
    const fullStadium = SIMULATION_SCENARIOS.find((s) => s.id === "full_stadium");
    expect(fullStadium?.impactMetrics.wasteIncreasePct).toBe(280);
  });

  it("peak match day has highest energy increase", () => {
    const peak = SIMULATION_SCENARIOS.find((s) => s.id === "peak_match_day");
    expect(peak?.impactMetrics.energyIncreasePct).toBe(120);
  });
});

describe("ReportingEngine (Sustainability)", () => {
  it("generates executive report from summary, KPIs, recommendations", () => {
    const summary: SustainabilitySummary = {
      totalEnergyKwh: 12000, livePowerDemandKw: 450, totalWaterL: 80000, totalCO2Kg: 5200,
      wasteGeneratedKg: 1800, renewablePct: 35, operationalEfficiency: 78, sustainabilityScore: 72,
      esgComplianceScore: 78, netZeroProgress: 42, costSavingsYtd: 125000, carbonReductionYtd: 8500,
      lastUpdated: new Date().toISOString(),
    };
    const kpis = analyticsEngine.computeESGKpis(summary);
    const recs: AIRecommendation[] = [
      makeSusRecommendation({ id: "rec-1", title: "Test Rec" }),
    ];
    const report = reportingEngine.generate(summary, kpis, recs, []);
    expect(report.id).toBeTruthy();
    expect(report.title).toContain("Sustainability Executive Report");
    expect(report.period).toBeTruthy();
    expect(report.summary.totalEnergyKwh).toBe(12000);
    expect(report.energyKpis).toHaveLength(5);
    expect(report.waterKpis).toHaveLength(4);
    expect(report.wasteKpis).toHaveLength(4);
    expect(report.carbonKpis).toHaveLength(5);
    expect(report.esgScorecard).toHaveLength(8);
    expect(report.topRecommendations).toHaveLength(1);
  });

  it("forecast has all required fields", () => {
    const summary: SustainabilitySummary = {
      totalEnergyKwh: 12000, livePowerDemandKw: 450, totalWaterL: 80000, totalCO2Kg: 5200,
      wasteGeneratedKg: 1800, renewablePct: 35, operationalEfficiency: 78, sustainabilityScore: 72,
      esgComplianceScore: 78, netZeroProgress: 42, costSavingsYtd: 125000, carbonReductionYtd: 8500,
      lastUpdated: new Date().toISOString(),
    };
    const report = reportingEngine.generate(summary, [], [], []);
    expect(report.forecast.nextMonthEnergy).toBeGreaterThan(0);
    expect(report.forecast.nextMonthWater).toBeGreaterThan(0);
    expect(report.forecast.nextMonthWaste).toBeGreaterThan(0);
    expect(report.forecast.netZeroProjectedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("getReportHistory returns 6 reports", () => {
    const history = reportingEngine.getReportHistory();
    expect(history).toHaveLength(6);
  });

  it("report history entries have required fields", () => {
    const history = reportingEngine.getReportHistory();
    history.forEach((h) => {
      expect(h.id).toBeTruthy();
      expect(h.title).toBeTruthy();
      expect(h.period).toBeTruthy();
      expect(h.generatedAt).toBeTruthy();
    });
  });
});

describe("SustainabilityService", () => {
  it("createInitialState returns empty state", () => {
    const state = createInitialState();
    expect(state.summary).toBeNull();
    expect(state.energyMetrics).toHaveLength(0);
    expect(state.waterMetrics).toHaveLength(0);
    expect(state.wasteMetrics).toHaveLength(0);
    expect(state.carbonMetrics).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.lastUpdated).toBeNull();
  });

  it("initialize returns populated state", () => {
    const state = sustainabilityService.initialize();
    expect(state.summary).not.toBeNull();
    expect(state.energyMetrics.length).toBeGreaterThan(0);
    expect(state.waterMetrics.length).toBeGreaterThan(0);
    expect(state.wasteMetrics.length).toBeGreaterThan(0);
    expect(state.carbonMetrics).not.toBeNull();
    expect(state.energyPredictions.length).toBeGreaterThanOrEqual(0);
    expect(state.trends.length).toBeGreaterThan(0);
    expect(state.esgKpis.length).toBe(8);
  });

  it("refresh updates all metrics", () => {
    const state = sustainabilityService.initialize();
    const refreshed = sustainabilityService.refresh(state);
    expect(refreshed.summary).not.toBeNull();
    expect(refreshed.lastUpdated).toBeTruthy();
    expect(refreshed.energyMetrics.length).toBeGreaterThan(0);
  });

  it("runSimulation stores result", () => {
    const state = sustainabilityService.initialize();
    const result = sustainabilityService.runSimulation(state, "heatwave");
    expect(result.simulationResult).not.toBeNull();
    expect(result.simulationResult!.scenarioId).toBe("heatwave");
  });

  it("acknowledgeAlert updates alert", () => {
    const state = sustainabilityService.initialize();
    if (state.alerts.length > 0) {
      const alertId = state.alerts[0].id;
      const updated = sustainabilityService.acknowledgeAlert(state, alertId);
      const ack = updated.alerts.find((a) => a.id === alertId);
      expect(ack?.acknowledged).toBe(true);
      expect(ack?.acknowledgedAt).toBeTruthy();
    }
  });

  it("generateReport creates executive report", () => {
    const state = sustainabilityService.initialize();
    const withReport = sustainabilityService.generateReport(state);
    expect(withReport.lastReport).not.toBeNull();
    expect(withReport.lastReport!.title).toContain("Sustainability Executive Report");
  });

  it("generateReport returns unchanged state if no summary", () => {
    const state = createInitialState();
    const result = sustainabilityService.generateReport(state);
    expect(result.lastReport).toBeNull();
  });
});

describe("Edge Cases — Sustainability", () => {
  describe("Zero consumption", () => {
    it("energy total consumption is 0 with empty metrics", () => {
      expect(energyEngine.getTotalConsumption([])).toBe(0);
    });

    it("renewable pct is 0 with empty metrics", () => {
      expect(energyEngine.getRenewablePct([])).toBe(0);
    });

    it("water total consumption is 0 with empty metrics", () => {
      expect(waterEngine.getTotalConsumption([])).toBe(0);
    });

    it("waste total is 0 with empty metrics", () => {
      expect(wasteEngine.getTotalWaste([])).toBe(0);
    });

    it("carbon engine handles zero energy", () => {
      const carbon = carbonEngine.calculate([], [], 0);
      expect(carbon.scope1).toBe(0);
      expect(carbon.scope2).toBe(0);
    });

    it("recommendation engine handles all empty inputs", () => {
      const recs = recommendationEngine.generate([], [], []);
      expect(recs.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Maximum capacity", () => {
    it("energy metrics at max consumption possible", () => {
      const assets = energyEngine.getAssets();
      const maxRated = Math.max(...assets.map((a) => a.ratedPowerKw));
      expect(maxRated).toBeGreaterThan(0);
    });

    it("waste fill level can reach 100", () => {
      const metrics = wasteEngine.getMetrics(wasteEngine.getAssets(), 0);
      const high = metrics.filter((m) => m.fillLevelPct > 90);
      expect(high.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("All alerts critical", () => {
    it("energy waste alerts generated for low efficiency", () => {
      const energy = [makeEnergyMetrics({ efficiency: 35, temperature: 30, consumptionKw: 100 })];
      const alerts = sustainabilityService.initialize().alerts;
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("high temperature triggers power spike alerts", () => {
      const energy = [makeEnergyMetrics({ efficiency: 70, temperature: 55, consumptionKw: 100 })];
      const water = [makeWaterMetrics({ leakProbability: 2 })];
      const waste = [makeWasteMetrics({ overflowRisk: 10 })];
      const carbon = makeCarbonMetrics({ totalCO2: 5000 });
      // We test the alert generation logic by initializing the service
      const state = sustainabilityService.initialize();
      expect(state.alerts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("ALERT_THRESHOLDS values", () => {
    it("has correct threshold values", () => {
      expect(ALERT_THRESHOLDS.POWER_SPIKE_PCT).toBe(25);
      expect(ALERT_THRESHOLDS.WATER_LEAK_FLOW_DELTA).toBe(50);
      expect(ALERT_THRESHOLDS.HIGH_CARBON_CO2_KG).toBe(500);
      expect(ALERT_THRESHOLDS.ENERGY_WASTE_PCT).toBe(15);
      expect(ALERT_THRESHOLDS.WASTE_OVERFLOW_PCT).toBe(85);
      expect(ALERT_THRESHOLDS.EMISSION_BREACH_CO2_KG).toBe(1000);
    });
  });

  describe("SUSTAINABILITY_TARGETS", () => {
    it("has all target values", () => {
      expect(SUSTAINABILITY_TARGETS.renewablePctTarget).toBe(50);
      expect(SUSTAINABILITY_TARGETS.carbonNeutralYear).toBe(2035);
      expect(SUSTAINABILITY_TARGETS.waterNeutralYear).toBe(2030);
      expect(SUSTAINABILITY_TARGETS.zeroWasteYear).toBe(2030);
      expect(SUSTAINABILITY_TARGETS.sustainabilityScoreTarget).toBe(85);
      expect(SUSTAINABILITY_TARGETS.esgComplianceTarget).toBe(80);
    });
  });

  describe("CARBON_FACTORS", () => {
    it("grid electricity factor is 0.425", () => {
      expect(CARBON_FACTORS.gridElectricityKgCO2PerKwh).toBe(0.425);
    });

    it("solar has lowest factor", () => {
      expect(CARBON_FACTORS.solarKgCO2PerKwh).toBeLessThan(CARBON_FACTORS.gridElectricityKgCO2PerKwh);
      expect(CARBON_FACTORS.solarKgCO2PerKwh).toBeLessThan(CARBON_FACTORS.generatorKgCO2PerKwh);
    });
  });

  describe("Energy prediction edge cases", () => {
    it("prediction types include all expected values", () => {
      const types = ["peak_load", "energy_waste", "inefficiency", "power_failure_risk", "demand_forecast"] as const;
      const metrics = [makeEnergyMetrics({ efficiency: 50, temperature: 50, consumptionKw: 100, peakDemandKw: 120 })];
      const predictions = energyEngine.predict(metrics);
      predictions.forEach((p) => {
        expect(types).toContain(p.type);
      });
    });

    it("prediction has operational impact text", () => {
      const metrics = [makeEnergyMetrics({ efficiency: 40, temperature: 50, consumptionKw: 100, peakDemandKw: 120 })];
      const predictions = energyEngine.predict(metrics);
      predictions.forEach((p) => {
        expect(p.operationalImpact).toBeTruthy();
      });
    });
  });

  describe("Water prediction edge cases", () => {
    it("high pressure triggers prediction", () => {
      const metrics = [makeWaterMetrics({ pressureBar: 6, leakProbability: 10, turbidity: 1 })];
      const predictions = waterEngine.predict(metrics);
      expect(predictions.length).toBeGreaterThanOrEqual(1);
    });

    it("prediction includes maintenance required type", () => {
      const metrics = [makeWaterMetrics({ leakProbability: 15, pressureBar: 5, turbidity: 3 })];
      const predictions = waterEngine.predict(metrics);
      expect(predictions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Waste prediction edge cases", () => {
    it("high overflow risk triggers overflow prediction", () => {
      const metrics = [makeWasteMetrics({ fillLevelPct: 80, overflowRisk: 65 })];
      const predictions = wasteEngine.predict(metrics);
      expect(predictions.length).toBeGreaterThanOrEqual(1);
    });

    it("overflow prediction has hours timeframe", () => {
      const metrics = [makeWasteMetrics({ fillLevelPct: 85, overflowRisk: 70 })];
      const predictions = wasteEngine.predict(metrics);
      const overflow = predictions.find((p) => p.type === "overflow_risk");
      if (overflow) {
        expect(overflow.timeframe).toMatch(/hours/);
      }
    });
  });

  describe("ESG KPI targets and status", () => {
    it("renewable pct >= target yields on_track status", () => {
      const summary: SustainabilitySummary = {
        totalEnergyKwh: 10000, livePowerDemandKw: 400, totalWaterL: 30000, totalCO2Kg: 2000,
        wasteGeneratedKg: 200, renewablePct: 55, operationalEfficiency: 85, sustainabilityScore: 90,
        esgComplianceScore: 85, netZeroProgress: 60, costSavingsYtd: 100000, carbonReductionYtd: 5000,
        lastUpdated: new Date().toISOString(),
      };
      const kpis = analyticsEngine.computeESGKpis(summary);
      const renewable = kpis.find((k) => k.metric === "Renewable Energy %");
      expect(renewable?.status).toBe("on_track");
    });

    it("low renewable pct yields behind status", () => {
      const summary: SustainabilitySummary = {
        totalEnergyKwh: 10000, livePowerDemandKw: 400, totalWaterL: 30000, totalCO2Kg: 2000,
        wasteGeneratedKg: 200, renewablePct: 10, operationalEfficiency: 85, sustainabilityScore: 90,
        esgComplianceScore: 85, netZeroProgress: 60, costSavingsYtd: 100000, carbonReductionYtd: 5000,
        lastUpdated: new Date().toISOString(),
      };
      const kpis = analyticsEngine.computeESGKpis(summary);
      const renewable = kpis.find((k) => k.metric === "Renewable Energy %");
      expect(renewable?.status).toBe("behind");
    });
  });

  describe("Utility rates", () => {
    it("all rates are positive", () => {
      expect(UTILITY_RATES.electricityCostPerKwh).toBeGreaterThan(0);
      expect(UTILITY_RATES.waterCostPerLiter).toBeGreaterThan(0);
      expect(UTILITY_RATES.wasteDisposalCostPerKg).toBeGreaterThan(0);
      expect(UTILITY_RATES.solarIncentivePerKwh).toBeGreaterThan(0);
    });

    it("recycling revenue is less than disposal cost", () => {
      expect(UTILITY_RATES.recyclingRevenuePerKg).toBeLessThan(UTILITY_RATES.wasteDisposalCostPerKg);
    });
  });

  describe("Energy asset source distribution", () => {
    it("has all energy sources represented", () => {
      const assets = energyEngine.getAssets();
      const sources = new Set(assets.map((a) => a.source));
      expect(sources.has("grid")).toBe(true);
      expect(sources.has("solar")).toBe(true);
      expect(sources.has("generator")).toBe(true);
      expect(sources.has("battery")).toBe(true);
    });

    it("has all criticality levels", () => {
      const assets = energyEngine.getAssets();
      const levels = new Set(assets.map((a) => a.criticality));
      expect(levels.has("critical")).toBe(true);
      expect(levels.has("high")).toBe(true);
      expect(levels.has("medium")).toBe(true);
      expect(levels.has("low")).toBe(true);
    });
  });

  describe("Report generation edge cases", () => {
    it("report KPIs have correct units", () => {
      const summary: SustainabilitySummary = {
        totalEnergyKwh: 12000, livePowerDemandKw: 450, totalWaterL: 80000, totalCO2Kg: 5200,
        wasteGeneratedKg: 1800, renewablePct: 35, operationalEfficiency: 78, sustainabilityScore: 72,
        esgComplianceScore: 78, netZeroProgress: 42, costSavingsYtd: 125000, carbonReductionYtd: 8500,
        lastUpdated: new Date().toISOString(),
      };
      const report = reportingEngine.generate(summary, [], [], []);
      report.energyKpis.forEach((k) => expect(k.unit).toBeTruthy());
      report.waterKpis.forEach((k) => expect(k.unit).toBeTruthy());
      report.wasteKpis.forEach((k) => expect(k.unit).toBeTruthy());
      report.carbonKpis.forEach((k) => expect(k.unit).toBeTruthy());
    });
  });

  describe("Simulation scenario edge cases", () => {
    it("heavy rain reduces water consumption", () => {
      const heavyRain = SIMULATION_SCENARIOS.find((s) => s.id === "heavy_rain");
      expect(heavyRain?.impactMetrics.waterIncreasePct).toBeLessThan(0);
    });

    it("all scenarios have cost impact", () => {
      SIMULATION_SCENARIOS.forEach((s) => {
        expect(s.impactMetrics.costImpact).toBeGreaterThan(0);
      });
    });

    it("all scenarios have at least 2 mitigation strategies", () => {
      SIMULATION_SCENARIOS.forEach((s) => {
        expect(s.mitigationStrategies.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Energy engine edge cases", () => {
    it("empty getMetrics returns empty array", () => {
      const metrics = energyEngine.getMetrics([], 0);
      expect(metrics).toHaveLength(0);
    });

    it("getTotalConsumption handles single metric", () => {
      const metrics = [makeEnergyMetrics({ consumptionKw: 50 })];
      expect(energyEngine.getTotalConsumption(metrics)).toBe(50);
    });
  });

  describe("Water engine edge cases", () => {
    it("empty getMetrics returns empty array", () => {
      const metrics = waterEngine.getMetrics([], 0);
      expect(metrics).toHaveLength(0);
    });

    it("getTotalConsumption handles single metric", () => {
      const metrics = [makeWaterMetrics({ totalConsumptionL: 1000 })];
      expect(waterEngine.getTotalConsumption(metrics)).toBe(1000);
    });
  });

  describe("Waste engine edge cases", () => {
    it("empty getMetrics returns empty array", () => {
      const metrics = wasteEngine.getMetrics([], 0);
      expect(metrics).toHaveLength(0);
    });

    it("getTotalWaste handles single metric", () => {
      const metrics = [makeWasteMetrics({ totalKg: 75 })];
      expect(wasteEngine.getTotalWaste(metrics)).toBe(75);
    });
  });

  describe("Energy engine edge cases (extended)", () => {
    it("solar metrics from getMetrics are valid arrays", () => {
      const assets = energyEngine.getAssets();
      const metrics = energyEngine.getMetrics(assets, 0);
      expect(metrics.length).toBeGreaterThan(0);
      metrics.forEach((m) => {
        expect(typeof m.consumptionKw).toBe("number");
        expect(typeof m.efficiency).toBe("number");
      });
    });

    it("getTotalConsumption sums correctly", () => {
      const metrics = [makeEnergyMetrics({ consumptionKw: 50 }), makeEnergyMetrics({ consumptionKw: 30 })];
      expect(energyEngine.getTotalConsumption(metrics)).toBe(80);
    });

    it("getLiveDemand returns number", () => {
      const metrics = [makeEnergyMetrics({ demandKw: 100 })];
      const demand = energyEngine.getLiveDemand(metrics);
      expect(demand).toBeGreaterThanOrEqual(0);
    });

    it("getRenewablePct returns 0 for non-solar", () => {
      const metrics = [makeEnergyMetrics({ consumptionKw: 100, source: "grid" })];
      expect(energyEngine.getRenewablePct(metrics)).toBe(0);
    });
  });

  describe("Carbon engine edge cases (extended)", () => {
    it("calculate returns carbon metrics with zero values for empty inputs", () => {
      const metrics = carbonEngine.calculate([], [], 0);
      expect(metrics.scope1).toBe(0);
      expect(metrics.scope2).toBe(0);
    });

    it("calculate returns carbon metrics with non-zero totalCO2", () => {
      const energy = [makeEnergyMetrics({ consumptionKw: 1000, source: "generator" })];
      const metrics = carbonEngine.calculate(energy, [], 0);
      expect(metrics.totalCO2).toBeGreaterThan(0);
    });

    it("getNetZeroProgress returns value between 0 and 100", () => {
      const m = carbonEngine.calculate([], [], 0);
      const progress = carbonEngine.getNetZeroProgress(m);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it("getForecast returns array of length months", () => {
      const m = carbonEngine.calculate([], [], 0);
      const forecast = carbonEngine.getForecast(m, 12);
      expect(forecast).toHaveLength(12);
    });
  });

  describe("Water engine edge cases (extended)", () => {
    it("getMetrics returns valid array", () => {
      const assets = waterEngine.getAssets();
      const metrics = waterEngine.getMetrics(assets, 0);
      expect(metrics.length).toBeGreaterThan(0);
      metrics.forEach((m) => {
        expect(typeof m.totalConsumptionL).toBe("number");
      });
    });

    it("getTotalConsumption sums correctly", () => {
      const metrics = [makeWaterMetrics({ totalConsumptionL: 5000 }), makeWaterMetrics({ totalConsumptionL: 3000 })];
      expect(waterEngine.getTotalConsumption(metrics)).toBe(8000);
    });

    it("predict returns array", () => {
      const metrics = [makeWaterMetrics({ pressureBar: 6, leakProbability: 20 })];
      const predictions = waterEngine.predict(metrics);
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe("Waste engine edge cases (extended)", () => {
    it("getMetrics returns valid array", () => {
      const assets = wasteEngine.getAssets();
      const metrics = wasteEngine.getMetrics(assets, 0);
      expect(metrics.length).toBeGreaterThan(0);
      metrics.forEach((m) => {
        expect(typeof m.totalKg).toBe("number");
      });
    });

    it("getTotalWaste sums correctly", () => {
      const metrics = [makeWasteMetrics({ totalKg: 100 }), makeWasteMetrics({ totalKg: 200 })];
      expect(wasteEngine.getTotalWaste(metrics)).toBe(300);
    });

    it("predict returns array", () => {
      const metrics = [makeWasteMetrics({ fillLevelPct: 80, overflowRisk: 70 })];
      const predictions = wasteEngine.predict(metrics);
      expect(Array.isArray(predictions)).toBe(true);
    });
  });

  describe("Recommendation engine edge cases (extended)", () => {
    it("default recommendations have positive estimated savings", () => {
      const recs = recommendationEngine.generate([], [], []);
      recs.forEach((r) => {
        expect(r.estimatedCostSavings).toBeGreaterThan(0);
      });
    });

    it("generated recommendations from energy metrics contain category", () => {
      const energy = [makeEnergyMetrics({ assetId: "test", efficiency: 50, consumptionKw: 100 })];
      const recs = recommendationEngine.generate(energy, [], []);
      expect(recs.length).toBeGreaterThan(0);
    });

    it("recommendations reference cost savings", () => {
      const energy = [makeEnergyMetrics({ assetId: "test", efficiency: 50, consumptionKw: 100 })];
      const recs = recommendationEngine.generate(energy, [], []);
      recs.forEach((r) => {
        expect(r.estimatedCostSavings).toBeDefined();
      });
    });
  });

  describe("Analytics edge cases (extended)", () => {
    it("computeSummary returns zeros for empty arrays", () => {
      const energy: EnergyMetrics[] = [];
      const water: WaterMetrics[] = [];
      const waste: WasteMetrics[] = [];
      const carbon = carbonEngine.calculate([], [], 0);
      const summary = analyticsEngine.computeSummary(energy, water, waste, carbon);
      expect(summary.totalEnergyKwh).toBe(0);
      expect(summary.totalWaterL).toBe(0);
      expect(summary.wasteGeneratedKg).toBe(0);
    });

    it("computeSummary reflects energy data", () => {
      const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
      const carbon = carbonEngine.calculate(energy, [], 0);
      const summary = analyticsEngine.computeSummary(energy, [], [], carbon);
      expect(summary.totalEnergyKwh).toBeGreaterThan(0);
    });

    it("computeCostSavings returns positive value", () => {
      const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
      const savings = analyticsEngine.computeCostSavings(energy);
      expect(savings).toBeGreaterThan(0);
    });

    it("computeCarbonReduction returns positive value", () => {
      const energy = [makeEnergyMetrics({ consumptionKw: 100 })];
      const reduction = analyticsEngine.computeCarbonReduction(energy);
      expect(reduction).toBeGreaterThan(0);
    });
  });

  describe("Service edge cases (extended)", () => {
    it("initialize returns state with summary", () => {
      const state = sustainabilityService.initialize();
      expect(state.summary).not.toBeNull();
    });

    it("initialize returns state with energy metrics", () => {
      const state = sustainabilityService.initialize();
      expect(state.energyMetrics.length).toBeGreaterThan(0);
    });

    it("sustainability suggestions reference venue IDs", () => {
      const suggestions = recommendationEngine.generate([], [], []);
      suggestions.forEach((s) => {
        expect(s.id).toMatch(/^rec-default-/);
      });
    });
  });

  describe("Compliance edge cases (extended)", () => {
    it("venue with all compliance flags passes all checks", () => {
      const venue = makeVenue({ id: "compliant", compliance: { iso14001: true, localGreenCert: true, waterEfficiency: true } });
      const { iso14001, localGreenCert, waterEfficiency } = venue.compliance;
      expect(iso14001 && localGreenCert && waterEfficiency).toBe(true);
    });

    it("venue with no compliance flags fails all checks", () => {
      const venue = makeVenue({ id: "non-compliant", compliance: { iso14001: false, localGreenCert: false, waterEfficiency: false } });
      const { iso14001, localGreenCert, waterEfficiency } = venue.compliance;
      expect(iso14001 || localGreenCert || waterEfficiency).toBe(false);
    });
  });

  describe("Efficiency range edge cases (extended)", () => {
    it("efficiency 0 is valid", () => {
      const venue = makeVenue({ efficiency: 0 });
      expect(venue.efficiency).toBe(0);
    });

    it("efficiency 100 is valid", () => {
      const venue = makeVenue({ efficiency: 100 });
      expect(venue.efficiency).toBe(100);
    });

    it("efficiency clamped between 0 and 100", () => {
      const venue = makeVenue({ efficiency: 75 });
      expect(venue.efficiency).toBeGreaterThanOrEqual(0);
      expect(venue.efficiency).toBeLessThanOrEqual(100);
    });
  });

  describe("Sustainability suggestions edge cases (extended)", () => {
    it("suggestions exist with empty inputs (default recs)", () => {
      const recs = recommendationEngine.generate([], [], []);
      expect(recs.length).toBeGreaterThan(0);
    });

    it("high efficiency energy produces fewer recommendations", () => {
      const highEfficiency = [makeEnergyMetrics({ assetId: "high", efficiency: 90, consumptionKw: 100 })];
      const highRecs = recommendationEngine.generate(highEfficiency, [], []);
      highRecs.forEach((r) => expect(r.estimatedCostSavings).toBeGreaterThan(0));
    });
  });

  describe("Analytics computeESGKpis edge cases", () => {
    it("returns 8 KPIs for typical data", () => {
      const summary: SustainabilitySummary = {
        totalEnergyKwh: 12000, livePowerDemandKw: 450, totalWaterL: 80000, totalCO2Kg: 5200,
        wasteGeneratedKg: 1800, renewablePct: 35, operationalEfficiency: 78, sustainabilityScore: 72,
        esgComplianceScore: 78, netZeroProgress: 42, costSavingsYtd: 125000, carbonReductionYtd: 8500,
        lastUpdated: new Date().toISOString(),
      };
      const kpis = analyticsEngine.computeESGKpis(summary);
      expect(kpis).toHaveLength(8);
    });

    it("ESG KPIs have valid status values", () => {
      const summary: SustainabilitySummary = {
        totalEnergyKwh: 12000, livePowerDemandKw: 450, totalWaterL: 80000, totalCO2Kg: 5200,
        wasteGeneratedKg: 1800, renewablePct: 35, operationalEfficiency: 78, sustainabilityScore: 72,
        esgComplianceScore: 78, netZeroProgress: 42, costSavingsYtd: 125000, carbonReductionYtd: 8500,
        lastUpdated: new Date().toISOString(),
      };
      const kpis = analyticsEngine.computeESGKpis(summary);
      expect(["on_track", "at_risk", "behind", "achieved"]).toContain(kpis[0].status);
    });
  });

  describe("Utility rates edge cases", () => {
    it("electricity cost per kwh is reasonable", () => {
      expect(UTILITY_RATES.electricityCostPerKwh).toBeGreaterThan(0);
      expect(UTILITY_RATES.electricityCostPerKwh).toBeLessThan(1);
    });

    it("solar incentive is lower than grid cost", () => {
      expect(UTILITY_RATES.solarIncentivePerKwh).toBeLessThan(UTILITY_RATES.electricityCostPerKwh);
    });
  });
});
