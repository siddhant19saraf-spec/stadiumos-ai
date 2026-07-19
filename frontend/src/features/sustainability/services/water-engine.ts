import type { WaterMetrics, WaterAsset, WaterPrediction } from "../types";
import { WATER_ASSETS } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export interface IWaterEngine {
  getAssets(): WaterAsset[];
  getMetrics(assets: WaterAsset[], tick?: number): WaterMetrics[];
  predict(metrics: WaterMetrics[]): WaterPrediction[];
  getTotalConsumption(metrics: WaterMetrics[]): number;
}

export class MockWaterEngine implements IWaterEngine {
  getAssets(): WaterAsset[] {
    return WATER_ASSETS;
  }

  getMetrics(assets: WaterAsset[], tick = 0): WaterMetrics[] {
    return assets.map((a) => {
      const base = a.capacityLiters * rf(0.02, 0.15);
      const peak = 1 + Math.sin(tick * 0.04 + parseInt(a.id.slice(-3), 36) || 0) * 0.25;
      const flow = parseFloat((base * peak + rf(-10, 10)).toFixed(1));
      const leakP = a.type === "pipe" || a.type === "pump" ? rf(1, 30) : rf(0.1, 5);
      const temp = a.type === "cooling_tower" ? rf(28, 40) : rf(15, 25);

      return {
        assetId: a.id,
        assetName: a.name,
        flowRateLmin: Math.max(0, flow),
        totalConsumptionL: Math.round(flow * 60 * ri(1, 4)),
        pressureBar: rf(2, 6),
        temperature: temp,
        ph: rf(6.5, 8.5),
        turbidity: rf(0.1, 3),
        leakProbability: parseFloat(leakP.toFixed(1)),
        backflowRisk: rf(0.1, 5),
        timestamp: new Date().toISOString(),
      };
    });
  }

  predict(metrics: WaterMetrics[]): WaterPrediction[] {
    const predictions: WaterPrediction[] = [];
    const types: WaterPrediction["type"][] = ["demand_forecast", "leak_probability", "waste_water", "maintenance_required"];

    for (const m of metrics) {
      if (m.leakProbability > 10 || m.pressureBar > 5 || m.turbidity > 2) {
        const predType = m.leakProbability > 20 ? "leak_probability" : m.turbidity > 2.5 ? "maintenance_required" : pick(types);
        const prob = Math.min(92, Math.max(10, Math.round(m.leakProbability * 2 + rf(-5, 10))));
        predictions.push({
          id: `wp-${m.assetId}-${Date.now().toString(36)}`,
          assetId: m.assetId,
          assetName: m.assetName,
          type: predType,
          probability: prob,
          predictedValue: parseFloat((m.totalConsumptionL * (1 + rf(0.05, 0.2))).toFixed(0)),
          unit: "liters",
          timeframe: `${ri(1, 72)} hours`,
          confidence: Math.min(95, Math.round(65 + prob * 0.3)),
          reasoning: this.reasoning(predType, m),
          contributingFactors: this.factors(predType, m),
          recommendedAction: this.action(predType, m),
          estimatedCostSavings: Math.round(prob * rf(10, 80)),
          estimatedCarbonReduction: Math.round(prob * rf(2, 15)),
          operationalImpact: this.impact(predType, m),
          timestamp: new Date().toISOString(),
        });
      }
    }
    return predictions.sort((a, b) => b.probability - a.probability).slice(0, 15);
  }

  getTotalConsumption(metrics: WaterMetrics[]): number {
    return metrics.reduce((s, m) => s + m.totalConsumptionL, 0);
  }

  private reasoning(type: string, m: WaterMetrics): string[] {
    return [
      `Flow rate: ${m.flowRateLmin} L/min — ${type.replace(/_/g, " ")} risk assessed`,
      `Leak probability: ${m.leakProbability}% — ${m.leakProbability > 15 ? "elevated" : "normal"}`,
      `Pressure: ${m.pressureBar} bar — ${m.pressureBar > 5 ? "above threshold" : "within range"}`,
    ];
  }

  private factors(type: string, m: WaterMetrics): string[] {
    const f = [`Asset type: ${m.assetId.split("-")[0]}`, `Usage: ${m.totalConsumptionL.toLocaleString()}L`];
    if (m.turbidity > 2) f.push("Elevated turbidity indicates potential contamination");
    if (m.pressureBar > 5.5) f.push("High pressure increases leak and pipe fatigue risk");
    if (m.backflowRisk > 3) f.push("Backflow risk elevated — check valve inspection needed");
    return f;
  }

  private action(type: string, m: WaterMetrics): string {
    const actions: Record<string, string> = {
      demand_forecast: `Pre-charge storage tanks ahead of peak demand period for ${m.assetName}.`,
      leak_probability: `Inspect ${m.assetName} for leaks. Deploy acoustic sensors for pinpoint detection.`,
      waste_water: `Reduce flow rate to ${m.assetName} by 20%. Install flow restrictors.`,
      maintenance_required: `Schedule maintenance for ${m.assetName}. Replace seals, check valves.`,
    };
    return actions[type] ?? `Optimize ${m.assetName} water consumption.`;
  }

  private impact(type: string, m: WaterMetrics): string {
    const impacts: Record<string, string> = {
      demand_forecast: `Peak demand expected to reach ${Math.round(m.totalConsumptionL * 1.3).toLocaleString()}L during next event.`,
      leak_probability: "Undetected leak could waste 5,000-15,000L per day at current pressure.",
      waste_water: `${Math.round(m.totalConsumptionL * 0.2).toLocaleString()}L of water currently being wasted daily.`,
      maintenance_required: "Deferred maintenance risk: $2,000-$8,000 in potential water damage costs.",
    };
    return impacts[type] ?? `Water efficiency impact assessed for ${m.assetName}.`;
  }
}

export const waterEngine = new MockWaterEngine();
