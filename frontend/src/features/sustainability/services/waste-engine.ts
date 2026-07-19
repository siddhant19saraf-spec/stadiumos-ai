// @ts-nocheck
import type { WasteMetrics, WasteAsset, WastePrediction } from "../types";
import { WASTE_ASSETS } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export interface IWasteEngine {
  getAssets(): WasteAsset[];
  getMetrics(assets: WasteAsset[], tick?: number): WasteMetrics[];
  predict(metrics: WasteMetrics[]): WastePrediction[];
  getTotalWaste(metrics: WasteMetrics[]): number;
}

export class MockWasteEngine implements IWasteEngine {
  getAssets(): WasteAsset[] {
    return WASTE_ASSETS;
  }

  getMetrics(assets: WasteAsset[], tick = 0): WasteMetrics[] {
    return assets.map((a) => {
      const base = a.capacityKg * rf(0.15, 0.7);
      const eventMultiplier = 1 + Math.sin(tick * 0.03 + parseInt(a.id.slice(-3), 36) || 0) * 0.3;
      const fill = Math.min(100, Math.max(5, base * eventMultiplier + rf(-5, 10)));
      const recyclable = a.type === "recyclable" ? rf(60, 95) : a.type === "plastic" ? rf(40, 70) : a.type === "paper" ? rf(50, 80) : rf(5, 20);
      const organic = a.type === "organic" || a.type === "food_waste" ? rf(50, 90) : rf(2, 10);
      const hazardous = a.type === "hazardous" ? rf(60, 95) : rf(0, 3);

      return {
        assetId: a.id,
        assetName: a.name,
        fillLevelPct: Math.round(fill),
        totalKg: Math.round(a.capacityKg * fill / 100),
        recyclablePct: Math.round(recyclable),
        organicPct: Math.round(organic),
        hazardousPct: Math.round(hazardous),
        temperature: a.type === "food_waste" || a.type === "organic" ? rf(20, 40) : rf(15, 25),
        lastCollection: new Date(Date.now() - ri(1, 7) * 86400000).toISOString(),
        nextCollection: new Date(Date.now() + ri(1, 7) * 86400000).toISOString(),
        overflowRisk: fill > 75 ? Math.round(fill * 0.8 + rf(-5, 10)) : Math.round(fill * 0.3 + rf(-5, 5)),
        timestamp: new Date().toISOString(),
      };
    });
  }

  predict(metrics: WasteMetrics[]): WastePrediction[] {
    const predictions: WastePrediction[] = [];
    const types: WastePrediction["type"][] = ["overflow_risk", "collection_schedule", "generation_forecast", "recycling_efficiency"];

    for (const m of metrics) {
      if (m.fillLevelPct > 50 || m.overflowRisk > 40) {
        const predType = m.overflowRisk > 60 ? "overflow_risk" : m.recyclablePct < 30 ? "recycling_efficiency" : pick(types);
        const prob = Math.min(95, Math.max(10, Math.round(m.overflowRisk + rf(-10, 10))));
        predictions.push({
          id: `wp-${m.assetId}-${Date.now().toString(36)}`,
          assetId: m.assetId,
          assetName: m.assetName,
          type: predType,
          probability: prob,
          predictedValue: parseFloat((m.totalKg * (1 + rf(0.05, 0.3))).toFixed(0)),
          unit: "kg",
          timeframe: predType === "overflow_risk" ? `${ri(4, 24)} hours` : `${ri(1, 7)} days`,
          confidence: Math.min(94, Math.round(60 + prob * 0.3)),
          reasoning: this.reasoning(predType, m),
          contributingFactors: this.factors(predType, m),
          recommendedAction: this.action(predType, m),
          estimatedCostSavings: Math.round(prob * rf(5, 40)),
          estimatedCarbonReduction: Math.round(prob * rf(1, 10)),
          operationalImpact: this.impact(predType, m),
          timestamp: new Date().toISOString(),
        });
      }
    }
    return predictions.sort((a, b) => b.probability - a.probability).slice(0, 12);
  }

  getTotalWaste(metrics: WasteMetrics[]): number {
    return metrics.reduce((s, m) => s + m.totalKg, 0);
  }

  private reasoning(type: string, m: WasteMetrics): string[] {
    return [
      `Fill level: ${m.fillLevelPct}% — ${type.replace(/_/g, " ")} risk assessed`,
      `Overflow risk: ${m.overflowRisk}% — ${m.overflowRisk > 50 ? "critical" : "elevated"}`,
      `Composition: ${m.recyclablePct}% recyclable, ${m.organicPct}% organic`,
    ];
  }

  private factors(type: string, m: WasteMetrics): string[] {
    const f = [`Waste type: ${m.assetId.split("-")[1]}`, `Current volume: ${m.totalKg}kg`];
    if (m.temperature > 30 && (m.assetId.includes("food") || m.assetId.includes("organic"))) {
      f.push("Elevated temperature accelerates decomposition — odor and pest risk");
    }
    if (m.recyclablePct < 20) f.push("Low recyclable percentage — contamination可能在 reducing recycling value");
    return f;
  }

  private action(type: string, m: WasteMetrics): string {
    const actions: Record<string, string> = {
      overflow_risk: `Schedule immediate collection for ${m.assetName}. Projected overflow within ${ri(2, 8)} hours.`,
      collection_schedule: `Optimize collection schedule for ${m.assetName}. Recommend frequency increase to ${m.fillLevelPct > 70 ? "daily" : "every 2 days"}.`,
      generation_forecast: `Increase waste sorting capacity for ${m.assetName}. Event-day generation projected to increase ${Math.round(rf(30, 60))}%.`,
      recycling_efficiency: `Improve sorting education at ${m.assetName}. Install clear signage for recyclable vs. general waste.`,
    };
    return actions[type] ?? `Optimize ${m.assetName} waste management.`;
  }

  private impact(type: string, m: WasteMetrics): string {
    const impacts: Record<string, string> = {
      overflow_risk: "Overflow event would result in cleanup costs of $500-$2,000 and potential compliance fines.",
      collection_schedule: "Suboptimal collection increases operational costs by 15-25% on current route.",
      generation_forecast: `Projected ${Math.round(m.totalKg * 1.4)}kg on next event day — ${Math.round(m.totalKg * 0.4)}kg above normal.`,
      recycling_efficiency: `${100 - m.recyclablePct}% contamination rate reduces recycling value and increases disposal costs.`,
    };
    return impacts[type] ?? `Waste management impact assessed for ${m.assetName}.`;
  }
}

export const wasteEngine = new MockWasteEngine();

