import type { EnergyMetrics, EnergyAsset, EnergyPrediction } from "../types";
import { ENERGY_ASSETS, CARBON_FACTORS, UTILITY_RATES } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export interface IEnergyEngine {
  getAssets(): EnergyAsset[];
  getMetrics(assets: EnergyAsset[], tick?: number): EnergyMetrics[];
  predict(metrics: EnergyMetrics[]): EnergyPrediction[];
  getTotalConsumption(metrics: EnergyMetrics[]): number;
  getLiveDemand(metrics: EnergyMetrics[]): number;
  getRenewablePct(metrics: EnergyMetrics[]): number;
}

export class MockEnergyEngine implements IEnergyEngine {
  getAssets(): EnergyAsset[] {
    return ENERGY_ASSETS;
  }

  getMetrics(assets: EnergyAsset[], tick = 0): EnergyMetrics[] {
    return assets.map((a) => {
      const base = a.ratedPowerKw * (a.source === "solar" ? rf(0.6, 0.95) : a.source === "generator" ? rf(0.1, 0.3) : rf(0.4, 0.85));
      const peakFactor = 1 + Math.sin(tick * 0.05 + parseInt(a.id.slice(-3), 36) || 0) * 0.15;
      const noise = rf(-8, 8);
      const demand = Math.max(0.5, parseFloat((base * peakFactor + noise).toFixed(1)));
      const peakDemand = Math.max(demand, a.ratedPowerKw * rf(0.7, 1.0));
      const efficiency = this.baseEfficiency(a.type) + rf(-5, 5);
      const co2Intensity = a.source === "solar" ? CARBON_FACTORS.solarKgCO2PerKwh : a.source === "generator" ? CARBON_FACTORS.generatorKgCO2PerKwh : CARBON_FACTORS.gridElectricityKgCO2PerKwh;

      return {
        assetId: a.id,
        assetName: a.name,
        consumptionKw: demand,
        demandKw: demand,
        peakDemandKw: parseFloat(peakDemand.toFixed(1)),
        voltage: rf(220, 240),
        currentA: parseFloat((demand * 1000 / 230).toFixed(1)),
        powerFactor: rf(0.85, 0.99),
        temperature: a.type === "hvac" ? rf(35, 55) : a.type === "power_distribution" ? rf(30, 50) : rf(20, 40),
        efficiency: Math.min(100, Math.max(10, efficiency)),
        source: a.source,
        co2Intensity,
        costPerKwh: a.source === "solar" ? 0 : a.source === "generator" ? UTILITY_RATES.electricityCostPerKwh * 2 : UTILITY_RATES.electricityCostPerKwh,
        timestamp: new Date().toISOString(),
      };
    });
  }

  predict(metrics: EnergyMetrics[]): EnergyPrediction[] {
    const predictions: EnergyPrediction[] = [];
    const types: EnergyPrediction["type"][] = ["peak_load", "energy_waste", "inefficiency", "power_failure_risk", "demand_forecast"];

    for (const m of metrics) {
      if (m.efficiency < 65 || m.temperature > 45 || m.consumptionKw > m.peakDemandKw * 0.85) {
        const predType = m.efficiency < 60 ? "inefficiency" : m.temperature > 48 ? "power_failure_risk" : m.consumptionKw > m.peakDemandKw * 0.8 ? "peak_load" : pick(types);
        const prob = Math.min(95, Math.max(15, Math.round(100 - m.efficiency + rf(-10, 10))));
        predictions.push({
          id: `ep-${m.assetId}-${Date.now().toString(36)}`,
          assetId: m.assetId,
          assetName: m.assetName,
          type: predType,
          probability: prob,
          predictedValue: parseFloat((m.consumptionKw * (1 + rf(0.05, 0.25))).toFixed(1)),
          unit: "kW",
          timeframe: `${ri(1, 48)} hours`,
          confidence: Math.min(96, Math.round(70 + prob * 0.25)),
          reasoning: this.reasoning(predType, m),
          contributingFactors: this.factors(predType, m),
          recommendedAction: this.action(predType, m),
          estimatedCostSavings: Math.round(prob * rf(50, 200)),
          estimatedCarbonReduction: Math.round(prob * rf(20, 80)),
          operationalImpact: this.impact(predType, m),
          timestamp: new Date().toISOString(),
        });
      }
    }
    return predictions.sort((a, b) => b.probability - a.probability).slice(0, 20);
  }

  getTotalConsumption(metrics: EnergyMetrics[]): number {
    return parseFloat(metrics.reduce((s, m) => s + m.consumptionKw, 0).toFixed(1));
  }

  getLiveDemand(metrics: EnergyMetrics[]): number {
    return parseFloat(metrics.reduce((s, m) => s + m.demandKw, 0).toFixed(1));
  }

  getRenewablePct(metrics: EnergyMetrics[]): number {
    const total = metrics.reduce((s, m) => s + m.consumptionKw, 0);
    const renewable = metrics.filter((m) => m.source === "solar").reduce((s, m) => s + m.consumptionKw, 0);
    return total > 0 ? Math.round((renewable / total) * 100) : 0;
  }

  private baseEfficiency(type: string): number {
    const map: Record<string, number> = {
      hvac: 72, lighting: 85, scoreboard: 78, video_wall: 80, kitchen: 65,
      ev_charger: 90, networking: 88, security: 85, generator: 55, power_distribution: 92,
      solar_panel: 82, battery_storage: 88,
    };
    return map[type] ?? 75;
  }

  private reasoning(type: string, m: EnergyMetrics): string[] {
    const r = [`Health score ${m.efficiency}% — ${type.replace(/_/g, " ")} risk assessed`];
    if (m.temperature > 45) r.push(`Operating temperature ${m.temperature}°C exceeds safe threshold`);
    if (m.powerFactor < 0.9) r.push(`Power factor ${m.powerFactor} indicates reactive power inefficiency`);
    if (m.source === "grid" && m.efficiency < 70) r.push("Grid-sourced energy with below-target efficiency");
    return r;
  }

  private factors(type: string, m: EnergyMetrics): string[] {
    const f = [`Load: ${m.consumptionKw}kW / ${m.peakDemandKw}kW peak`, `Source: ${m.source}`];
    if (m.temperature > 42) f.push("Elevated operating temperature suggests cooling inefficiency");
    if (m.powerFactor < 0.88) f.push("Low power factor indicates inductive load issues");
    if (m.efficiency < 65) f.push("Efficiency degradation detected — maintenance recommended");
    return f;
  }

  private action(type: string, m: EnergyMetrics): string {
    const actions: Record<string, string> = {
      peak_load: `Shift ${m.assetName} load to off-peak hours. Consider battery dispatch during peak.`,
      energy_waste: `Reduce ${m.assetName} output by 15%. Implement schedule optimization.`,
      inefficiency: `Schedule maintenance for ${m.assetName}. Clean filters, check calibration.`,
      power_failure_risk: `Immediate inspection required for ${m.assetName}. Risk of unplanned outage.`,
      demand_forecast: `Increase grid draw during off-peak for ${m.assetName}. Pre-cool/pre-heat strategy.`,
    };
    return actions[type] ?? `Optimize ${m.assetName} operation for efficiency.`;
  }

  private impact(type: string, m: EnergyMetrics): string {
    const impacts: Record<string, string> = {
      peak_load: `Peak demand charges estimated at $${Math.round(m.consumptionKw * 2)} per hour above threshold.`,
      energy_waste: `${Math.round(m.consumptionKw * 0.15)}kW of avoidable consumption identified.`,
      inefficiency: `Efficiency loss of ${Math.round(100 - m.efficiency)}% translates to $${Math.round(m.consumptionKw * 0.12 * 24 * 0.15)}/day waste.`,
      power_failure_risk: "Unplanned downtime cost estimated at $5,000-$15,000 per hour.",
      demand_forecast: `Next 24h demand projected at ${Math.round(m.consumptionKw * 1.15)}kW during peak window.`,
    };
    return impacts[type] ?? `Operational efficiency impact assessed for ${m.assetName}.`;
  }
}

export const energyEngine = new MockEnergyEngine();

