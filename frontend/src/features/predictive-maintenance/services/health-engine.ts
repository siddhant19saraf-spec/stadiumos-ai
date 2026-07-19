import type { AssetHealth } from "../types";

export interface IHealthEngine {
  calculateZoneHealth(healthMap: Map<string, AssetHealth>): Map<string, { avgHealth: number; avgRisk: number; count: number }>;
  getRiskLabel(riskScore: number): string;
  getHealthLabel(healthScore: number): string;
}

export class MockHealthEngine implements IHealthEngine {
  calculateZoneHealth(healthMap: Map<string, AssetHealth>): Map<string, { avgHealth: number; avgRisk: number; count: number }> {
    const zones = new Map<string, { totalHealth: number; totalRisk: number; count: number }>();
    for (const [, h] of healthMap) {
      const key = h.assetId.split("-")[0] ?? "unknown";
      const existing = zones.get(key) ?? { totalHealth: 0, totalRisk: 0, count: 0 };
      existing.totalHealth += h.healthScore;
      existing.totalRisk += h.riskScore;
      existing.count++;
      zones.set(key, existing);
    }
    const result = new Map<string, { avgHealth: number; avgRisk: number; count: number }>();
    for (const [key, val] of zones) {
      result.set(key, {
        avgHealth: Math.round(val.totalHealth / val.count),
        avgRisk: Math.round(val.totalRisk / val.count),
        count: val.count,
      });
    }
    return result;
  }

  getRiskLabel(riskScore: number): string {
    if (riskScore >= 75) return "critical";
    if (riskScore >= 50) return "high";
    if (riskScore >= 25) return "medium";
    return "low";
  }

  getHealthLabel(healthScore: number): string {
    if (healthScore >= 80) return "excellent";
    if (healthScore >= 60) return "good";
    if (healthScore >= 40) return "fair";
    if (healthScore >= 20) return "poor";
    return "critical";
  }
}

export const healthEngine = new MockHealthEngine();
