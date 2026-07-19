import type { SimulationScenario, SimulationScenarioId, SimulationResult, EnergyMetrics, WaterMetrics, WasteMetrics, CarbonMetrics } from "../types";
import { SIMULATION_SCENARIOS, UTILITY_RATES } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface ISimulationEngine {
  getScenarios(): SimulationScenario[];
  run(scenarioId: string, energy: EnergyMetrics[], water: WaterMetrics[], waste: WasteMetrics[], carbon: CarbonMetrics): SimulationResult;
}

export class MockSimulationEngine implements ISimulationEngine {
  getScenarios(): SimulationScenario[] {
    return SIMULATION_SCENARIOS;
  }

  run(scenarioId: SimulationScenarioId, energy: EnergyMetrics[], water: WaterMetrics[], waste: WasteMetrics[], _carbon: CarbonMetrics): SimulationResult {
    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
    const mitigationFactor = 0.65;

    const totalEnergy = energy.reduce((s, m) => s + m.consumptionKw, 0) * 24;
    const totalWater = water.reduce((s, m) => s + m.totalConsumptionL, 0);
    const totalWaste = waste.reduce((s, m) => s + m.totalKg, 0);

    const predictedEnergy = totalEnergy * (1 + (scenario?.impactMetrics.energyIncreasePct ?? 0) / 100);
    const predictedWater = totalWater * (1 + (scenario?.impactMetrics.waterIncreasePct ?? 0) / 100);
    const predictedWaste = totalWaste * (1 + (scenario?.impactMetrics.wasteIncreasePct ?? 0) / 100);
    const predictedCO2 = predictedEnergy * 0.425 + rf(-50, 50);
    const predictedCost = (predictedEnergy * UTILITY_RATES.electricityCostPerKwh) + (scenario?.impactMetrics.costImpact ?? 0);

    const mitigatedEnergy = predictedEnergy * (1 - mitigationFactor * 0.4);
    const mitigatedWater = predictedWater * (1 - mitigationFactor * 0.3);
    const mitigatedWaste = predictedWaste * (1 - mitigationFactor * 0.35);
    const mitigatedCO2 = mitigatedEnergy * 0.425 + rf(-30, 30);
    const mitigatedCost = predictedCost * (1 - mitigationFactor * 0.45);

    return {
      id: `sim-${Date.now().toString(36)}`,
      scenarioId,
      scenarioTitle: scenario?.title ?? "Unknown",
      predictedEnergyKwh: Math.round(predictedEnergy),
      predictedWaterL: Math.round(predictedWater),
      predictedWasteKg: Math.round(predictedWaste),
      predictedCO2Kg: Math.round(predictedCO2),
      predictedCost: Math.round(predictedCost),
      mitigatedEnergyKwh: Math.round(mitigatedEnergy),
      mitigatedWaterL: Math.round(mitigatedWater),
      mitigatedWasteKg: Math.round(mitigatedWaste),
      mitigatedCO2Kg: Math.round(mitigatedCO2),
      mitigatedCost: Math.round(mitigatedCost),
      energySavingsPct: Math.round((1 - mitigatedEnergy / predictedEnergy) * 100),
      waterSavingsPct: Math.round((1 - mitigatedWater / predictedWater) * 100),
      carbonSavingsPct: Math.round((1 - mitigatedCO2 / predictedCO2) * 100),
      costSavings: Math.round(predictedCost - mitigatedCost),
      recommendedActions: scenario?.mitigationStrategies ?? [],
      aiStrategies: (scenario?.mitigationStrategies ?? []).slice(0, 4).map((s) => ({
        action: s,
        impact: `${Math.round(mitigationFactor * 100 * rf(0.8, 1.2))}% risk reduction`,
        confidence: Math.round(75 + Math.random() * 20),
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

export const simulationEngine = new MockSimulationEngine();
