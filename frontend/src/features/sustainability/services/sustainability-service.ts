import type { SustainabilityState, SimulationScenarioId } from "../types";
import { energyEngine } from "./energy-engine";
import { waterEngine } from "./water-engine";
import { wasteEngine } from "./waste-engine";
import { carbonEngine } from "./carbon-engine";
import { recommendationEngine } from "./recommendation-engine";
import { analyticsEngine } from "./analytics-engine";
import { simulationEngine } from "./simulation-engine";
import { reportingEngine } from "./reporting-engine";

export function createInitialState(): SustainabilityState {
  return {
    summary: null,
    energyMetrics: [],
    waterMetrics: [],
    wasteMetrics: [],
    carbonMetrics: null,
    energyPredictions: [],
    waterPredictions: [],
    wastePredictions: [],
    recommendations: [],
    alerts: [],
    trends: [],
    esgKpis: [],
    simulationResult: null,
    lastReport: null,
    loading: false,
    lastUpdated: null,
  };
}

export interface ISustainabilityService {
  initialize(): SustainabilityState;
  refresh(state: SustainabilityState): SustainabilityState;
  runSimulation(state: SustainabilityState, scenarioId: SimulationScenarioId): SustainabilityState;
  acknowledgeAlert(state: SustainabilityState, alertId: string): SustainabilityState;
  generateReport(state: SustainabilityState): SustainabilityState;
}

export const sustainabilityService: ISustainabilityService = {
  initialize(): SustainabilityState {
    const assets = energyEngine.getAssets();
    const tick = 0;
    const energyMetrics = energyEngine.getMetrics(assets, tick);
    const waterMetrics = waterEngine.getMetrics(waterEngine.getAssets(), tick);
    const wasteMetrics = wasteEngine.getMetrics(wasteEngine.getAssets(), tick);
    const carbonMetrics = carbonEngine.calculate(energyMetrics, wasteMetrics, waterEngine.getTotalConsumption(waterMetrics));
    const energyPredictions = energyEngine.predict(energyMetrics);
    const waterPredictions = waterEngine.predict(waterMetrics);
    const wastePredictions = wasteEngine.predict(wasteMetrics);
    const recommendations = recommendationEngine.generate(energyMetrics, waterMetrics, wasteMetrics);
    const summary = analyticsEngine.computeSummary(energyMetrics, waterMetrics, wasteMetrics, carbonMetrics);
    const trends = analyticsEngine.computeTrends();
    const esgKpis = analyticsEngine.computeESGKpis(summary);

    const alerts = generateAlerts(energyMetrics, waterMetrics, wasteMetrics, carbonMetrics);

    return {
      summary,
      energyMetrics,
      waterMetrics,
      wasteMetrics,
      carbonMetrics,
      energyPredictions,
      waterPredictions,
      wastePredictions,
      recommendations,
      alerts,
      trends,
      esgKpis,
      simulationResult: null,
      lastReport: null,
      loading: false,
      lastUpdated: new Date().toISOString(),
    };
  },

  refresh(state: SustainabilityState): SustainabilityState {
    const tick = Date.now() / 1000;
    const energyMetrics = energyEngine.getMetrics(energyEngine.getAssets(), tick);
    const waterMetrics = waterEngine.getMetrics(waterEngine.getAssets(), tick);
    const wasteMetrics = wasteEngine.getMetrics(wasteEngine.getAssets(), tick);
    const carbonMetrics = carbonEngine.calculate(energyMetrics, wasteMetrics, waterEngine.getTotalConsumption(waterMetrics));
    const energyPredictions = energyEngine.predict(energyMetrics);
    const waterPredictions = waterEngine.predict(waterMetrics);
    const wastePredictions = wasteEngine.predict(wasteMetrics);
    const recommendations = recommendationEngine.generate(energyMetrics, waterMetrics, wasteMetrics);
    const summary = analyticsEngine.computeSummary(energyMetrics, waterMetrics, wasteMetrics, carbonMetrics);
    const trends = analyticsEngine.computeTrends();
    const esgKpis = analyticsEngine.computeESGKpis(summary);
    const alerts = generateAlerts(energyMetrics, waterMetrics, wasteMetrics, carbonMetrics);

    return {
      ...state,
      energyMetrics,
      waterMetrics,
      wasteMetrics,
      carbonMetrics,
      energyPredictions,
      waterPredictions,
      wastePredictions,
      recommendations,
      alerts,
      summary,
      trends,
      esgKpis,
      loading: false,
      lastUpdated: new Date().toISOString(),
    };
  },

  runSimulation(state: SustainabilityState, scenarioId: SimulationScenarioId): SustainabilityState {
    const result = simulationEngine.run(scenarioId, state.energyMetrics, state.waterMetrics, state.wasteMetrics, state.carbonMetrics!);
    return { ...state, simulationResult: result, loading: false };
  },

  acknowledgeAlert(state: SustainabilityState, alertId: string): SustainabilityState {
    return {
      ...state,
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a,
      ),
    };
  },

  generateReport(state: SustainabilityState): SustainabilityState {
    if (!state.summary) return state;
    const report = reportingEngine.generate(state.summary, state.esgKpis, state.recommendations, state.trends);
    return { ...state, lastReport: report };
  },
};

function generateAlerts(energy: import("../types").EnergyMetrics[], water: import("../types").WaterMetrics[], waste: import("../types").WasteMetrics[], carbon: import("../types").CarbonMetrics): import("../types").SmartAlert[] {
  const alerts: import("../types").SmartAlert[] = [];
  const now = new Date().toISOString();

  for (const m of energy) {
    if (m.efficiency < 50) {
      alerts.push({
        id: `alert-energy-${m.assetId}-${Date.now().toString(36)}`,
        title: `Energy Waste — ${m.assetName}`,
        message: `${m.assetName} operating at ${m.efficiency}% efficiency. Potential waste of ${Math.round(m.consumptionKw * 0.2)}kW.`,
        severity: "high",
        category: "energy_waste",
        domain: "energy",
        assetId: m.assetId,
        assetName: m.assetName,
        currentValue: m.efficiency,
        thresholdValue: 65,
        unit: "%",
        acknowledged: false,
        acknowledgedAt: null,
        aiSuggestion: `Reduce load by 15% and schedule maintenance for ${m.assetName}.`,
        requiresAction: m.efficiency < 40,
        createdAt: now,
      });
    }
    if (m.temperature > 50) {
      alerts.push({
        id: `alert-heat-${m.assetId}-${Date.now().toString(36)}`,
        title: `Power Spike Risk — ${m.assetName}`,
        message: `${m.assetName} temperature at ${m.temperature}°C. Risk of thermal runaway in ${Math.round((55 - m.temperature) / 2)} hours.`,
        severity: "critical",
        category: "power_spike",
        domain: "energy",
        assetId: m.assetId,
        assetName: m.assetName,
        currentValue: m.temperature,
        thresholdValue: 45,
        unit: "°C",
        acknowledged: false,
        acknowledgedAt: null,
        aiSuggestion: `Immediate load reduction for ${m.assetName}. Activate backup cooling.`,
        requiresAction: true,
        createdAt: now,
      });
    }
  }

  for (const m of water) {
    if (m.leakProbability > 25) {
      alerts.push({
        id: `alert-leak-${m.assetId}-${Date.now().toString(36)}`,
        title: `Water Leak Detected — ${m.assetName}`,
        message: `Leak probability: ${m.leakProbability}% in ${m.assetName}. Estimated loss: ${Math.round(m.flowRateLmin * 60 * 24 * 0.2)}L/day.`,
        severity: m.leakProbability > 30 ? "critical" : "high",
        category: "water_leak",
        domain: "water",
        assetId: m.assetId,
        assetName: m.assetName,
        currentValue: m.leakProbability,
        thresholdValue: 15,
        unit: "%",
        acknowledged: false,
        acknowledgedAt: null,
        aiSuggestion: `Deploy acoustic sensors to ${m.assetName}. Isolate section and schedule repair.`,
        requiresAction: m.leakProbability > 30,
        createdAt: now,
      });
    }
  }

  for (const m of waste) {
    if (m.overflowRisk > 70) {
      alerts.push({
        id: `alert-waste-${m.assetId}-${Date.now().toString(36)}`,
        title: `Waste Overflow Risk — ${m.assetName}`,
        message: `${m.assetName} at ${m.fillLevelPct}% capacity. Overflow projected within ${Math.round((100 - m.fillLevelPct) / 5)} hours.`,
        severity: "high",
        category: "waste_overflow",
        domain: "waste",
        assetId: m.assetId,
        assetName: m.assetName,
        currentValue: m.fillLevelPct,
        thresholdValue: 85,
        unit: "%",
        acknowledged: false,
        acknowledgedAt: null,
        aiSuggestion: `Schedule immediate collection for ${m.assetName}. Increase collection frequency.`,
        requiresAction: true,
        createdAt: now,
      });
    }
  }

  if (carbon.totalCO2 > 25000) {
    alerts.push({
      id: `alert-carbon-${Date.now().toString(36)}`,
      title: "High Carbon Emissions",
      message: `Total CO₂: ${Math.round(carbon.totalCO2)}kg. Exceeds daily threshold of 25,000kg. Scope 1 emissions elevated.`,
      severity: "high",
      category: "high_carbon",
      domain: "carbon",
      assetId: "pwr-main",
      assetName: "Main Power Distribution",
      currentValue: Math.round(carbon.totalCO2),
      thresholdValue: 25000,
      unit: "kg",
      acknowledged: false,
      acknowledgedAt: null,
      aiSuggestion: "Increase solar utilization. Reduce generator runtime. Activate battery storage for peak shaving.",
      requiresAction: carbon.totalCO2 > 30000,
      createdAt: now,
    });
  }

  return alerts.slice(0, 15);
}
