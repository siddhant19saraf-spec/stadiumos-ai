import type { ScenarioDefinition, SimulationResult, FailurePrediction, WorkOrder, AssetHealth } from "../types";
import { SIMULATION_SCENARIOS } from "../constants";

export interface ISimulationEngine {
  getScenarios(): ScenarioDefinition[];
  run(healthMap: Map<string, AssetHealth>, predictions: FailurePrediction[], orders: WorkOrder[], scenarioId: string): SimulationResult;
}

export class MockSimulationEngine implements ISimulationEngine {
  getScenarios(): ScenarioDefinition[] {
    return SIMULATION_SCENARIOS;
  }

  run(healthMap: Map<string, AssetHealth>, predictions: FailurePrediction[], orders: WorkOrder[], scenarioId: string): SimulationResult {
    const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
    const baseCost = 0;
    const scenarios: string[] = [];
    const downtime = { predicted: 0, mitigated: 0 };
    const costImpact = { predicted: 0, mitigated: 0 };
    const assetsAtRisk: { assetId: string; assetName: string; riskReduction: string }[] = [];

    const mitigationFactor = scenario?.mitigationFactor ?? 0.7;
    const title = scenario?.title ?? "Default simulation";

    for (const p of predictions) {
      const h = healthMap.get(p.assetId);
      if (!h) continue;

      const severity = p.probability / 100;
      const assetDowntime = Math.round(severity * 24 * 60);
      const assetCost = Math.round(assetDowntime * (h.healthScore < 20 ? 150 : 75) * (h.criticality === "critical" ? 2 : 1));

      downtime.predicted += assetDowntime;
      costImpact.predicted += assetCost;

      const mitigatedDowntime = Math.round(assetDowntime * (1 - mitigationFactor));
      const mitigatedCost = Math.round(assetCost * (1 - mitigationFactor * 0.8));

      downtime.mitigated += mitigatedDowntime;
      costImpact.mitigated += mitigatedCost;

      const riskReduction = `${Math.round(mitigationFactor * 100)}%`;
      assetsAtRisk.push({ assetId: p.assetId, assetName: p.assetName, riskReduction });

      scenarios.push(`${p.assetName}: ${this.scenarioDetail(scenarioId, p)}`);
      scenarios.push(`Without action: ${assetDowntime}min downtime, $${assetCost.toLocaleString()} impact`);
      scenarios.push(`With mitigation: ${mitigatedDowntime}min downtime, $${mitigatedCost.toLocaleString()} impact`);
    }

    return {
      id: `sim-${Date.now().toString(36)}`,
      scenarioId,
      scenarioTitle: title,
      assetsInScope: assetsAtRisk,
      predictedDowntime: downtime.predicted,
      mitigatedDowntime: downtime.mitigated,
      downtimeAverted: downtime.predicted - downtime.mitigated,
      predictedCostImpact: costImpact.predicted,
      mitigatedCostImpact: costImpact.mitigated,
      costSavings: costImpact.predicted - costImpact.mitigated,
      recommendedActions: this.recommendedActions(assetsAtRisk),
      scenarioSteps: scenarios.slice(0, Math.min(scenarios.length, 30)),
      timestamp: new Date().toISOString(),
    };
  }

  private scenarioDetail(scenarioId: string, p: FailurePrediction): string {
    const details: Record<string, string> = {
      "heatwave": `Elevated temperatures accelerate ${p.failureMode} in ${p.assetName}. Failure probability: ${p.probability}% within ${p.predictedDays} days.`,
      "match-day": `${p.assetName} at peak load. ${p.failureMode} risk increases during high utilization.`,
      "power-outage": `${p.assetName} on backup power. ${p.failureMode} risk elevated under sustained battery operation.`,
      "flooding": `Water exposure risk for ${p.assetName}. ${p.failureMode} probability: ${p.probability}%.`,
      "cyber": `${p.assetName} potentially affected. ${p.failureMode} due to network instability.`,
    };
    return details[scenarioId] ?? `${p.assetName} impacted by scenario conditions. Failure mode: ${p.failureMode}.`;
  }

  private recommendedActions(assets: { assetId: string; assetName: string; riskReduction: string }[]): string[] {
    return [
      `Schedule proactive maintenance for ${assets.length} at-risk assets before the next match day`,
      `Stock critical spare parts for: ${assets.slice(0, 4).map((a) => a.assetName).join(", ")}${assets.length > 4 ? " +" + (assets.length - 4) + " more" : ""}`,
      `Implement condition-based monitoring for ${assets.slice(0, 3).map((a) => a.assetName).join(", ")}`,
      `Reduce operational load by 30% on HVAC and power systems during peak hours`,
      `Brief maintenance team on ${assets.length} priority work orders for this scenario`,
    ];
  }
}

export const simulationEngine = new MockSimulationEngine();
