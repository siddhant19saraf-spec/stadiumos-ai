// @ts-nocheck
import type { FailurePrediction, MaintenanceAsset, AssetHealth, FailureMode } from "../types";
import { ASSETS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IPredictionEngine {
  predict(healthMap: Map<string, AssetHealth>): FailurePrediction[];
  getRUL(health: AssetHealth): string;
}

export class MockPredictionEngine implements IPredictionEngine {
  predict(healthMap: Map<string, AssetHealth>): FailurePrediction[] {
    const predictions: FailurePrediction[] = [];
    const now = new Date().toISOString();

    for (const [, health] of healthMap) {
      if (health.healthScore > 65) continue;

      const asset = ASSETS.find((a) => a.id === health.assetId);
      const failureMode = this.predictFailureMode(health);
      const probability = this.clamp(Math.round((100 - health.healthScore) * 0.85 + rand(-5, 10)), 10, 99);
      const predictedDays = Math.round((100 - health.healthScore) * 1.2 + rand(-5, 10));

      predictions.push({
        assetId: health.assetId,
        assetName: health.assetName,
        failureMode,
        probability,
        predictedDays: Math.max(1, predictedDays),
        confidence: Math.round(78 + Math.random() * 18),
        reasoning: this.reasoning(failureMode, health),
        contributingFactors: this.factors(health, failureMode),
        recommendedAction: this.recommendedAction(failureMode, health),
        estimatedCostImpact: this.costImpact(failureMode, health),
        operationalImpact: this.operationalImpact(failureMode, health.assetName),
        timestamp: now,
      });
    }

    return predictions.sort((a, b) => a.predictedDays - b.predictedDays).slice(0, 15);
  }

  getRUL(health: AssetHealth): string {
    if (health.healthScore >= 80) return ">12 months";
    if (health.healthScore >= 60) return "6-12 months";
    if (health.healthScore >= 40) return "3-6 months";
    if (health.healthScore >= 20) return "1-3 months";
    return "<30 days";
  }

  private predictFailureMode(health: AssetHealth): FailureMode {
    const modes: FailureMode[] = ["mechanical_wear", "electrical_fault", "component_failure", "battery_degradation", "sensor_drift", "cooling_failure", "power_instability", "network_failure", "performance_degradation", "overheating", "firmware_corruption", "physical_damage"];
    const idx = Math.floor(Math.random() * modes.length);
    return modes[idx]!;
  }

  private reasoning(mode: FailureMode, health: AssetHealth): string[] {
    const base = [
      `Health score declined to ${health.healthScore} (threshold: 60)`,
      `Risk score elevated to ${health.riskScore}`,
      `Temperature at ${health.temperature}°C`,
    ];
    if (health.vibrationMmS > 5) base.push(`Vibration reading ${health.vibrationMmS} mm/s exceeds threshold`);
    if (health.pressureBar > 6) base.push(`Pressure ${health.pressureBar} bar above normal range`);
    return base;
  }

  private factors(health: AssetHealth, mode: FailureMode): string[] {
    const factors = [`Asset type: ${health.type}`, `Utilization: ${health.utilization}%`];
    if (health.temperature > 45) factors.push("Operating above recommended temperature range");
    if (health.powerUsageKw > 20) factors.push("Power consumption elevated 18% above baseline");
    if (health.vibrationMmS > 6) factors.push("Vibration analysis indicates bearing wear pattern");
    if (mode === "battery_degradation") factors.push("Charge cycle count approaching EOL threshold");
    if (mode === "mechanical_wear") factors.push("Run hours since last overhaul: >5,000 hours");
    return factors;
  }

  private recommendedAction(mode: FailureMode, health: AssetHealth): string {
    const actions: Record<string, string> = {
      mechanical_wear: "Schedule bearing replacement and lubrication service",
      electrical_fault: "Inspect wiring, test insulation resistance, replace faulty components",
      component_failure: "Replace failed component with OEM-approved part",
      battery_degradation: "Replace battery unit and test charging circuit",
      sensor_drift: "Re-calibrate sensor and verify readings against reference",
      cooling_failure: "Clean cooling fins, check refrigerant level, service fan motor",
      power_instability: "Install power conditioning equipment, check UPS system",
      network_failure: "Reboot switch, update firmware, check fiber connectivity",
      performance_degradation: "Run diagnostic suite, optimize configuration, clean air filters",
      overheating: "Improve ventilation, reduce load, check thermal paste application",
      firmware_corruption: "Re-flash firmware from verified backup, verify checksum",
      physical_damage: "Inspect for physical damage, replace housing, test operation",
    };
    return actions[mode] ?? "Schedule detailed inspection and diagnostic testing";
  }

  private costImpact(mode: FailureMode, health: AssetHealth): string {
    if (health.criticality === "critical") return "$8,000 - $15,000";
    if (health.criticality === "high") return "$4,000 - $8,000";
    return "$1,000 - $4,000";
  }

  private operationalImpact(mode: FailureMode, assetName: string): string {
    const impacts: Record<string, string> = {
      mechanical_wear: `Reduced efficiency of ${assetName}. Increased energy consumption.`,
      electrical_fault: `Potential shutdown of ${assetName}. Fire risk elevated.`,
      battery_degradation: `Backup power duration reduced by 60% for ${assetName}.`,
      overheating: `${assetName} output derated by 40%. Comfort impact in affected zone.`,
      network_failure: `Network-dependent systems in ${assetName}'s zone may lose connectivity.`,
    };
    return impacts[mode] ?? `${assetName} requires immediate attention to prevent unplanned downtime.`;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const predictionEngine = new MockPredictionEngine();

