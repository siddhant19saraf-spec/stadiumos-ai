// @ts-nocheck
import type { AssetHealth, WorkOrder, FailurePrediction, AnalyticsSummary, TrendData, AssetType } from "../types";

function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IAnalyticsEngine {
  computeSummary(healthMap: Map<string, AssetHealth>, predictions: FailurePrediction[], orders: WorkOrder[]): AnalyticsSummary;
  computeTrends(healthMap: Map<string, AssetHealth>): TrendData[];
  computeAssetTypeBreakdown(healthMap: Map<string, AssetHealth>): { type: AssetType; count: number; avgHealth: number }[];
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  computeSummary(healthMap: Map<string, AssetHealth>, predictions: FailurePrediction[], orders: WorkOrder[]): AnalyticsSummary {
    let totalHealth = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let healthyCount = 0;
    let offlineCount = 0;
    let highRiskCount = 0;

    for (const [, h] of healthMap) {
      totalHealth += h.healthScore;
      if (h.riskScore >= 75) highRiskCount++;
      if (h.status === "critical" || h.status === "offline") criticalCount++;
      else if (h.status === "warning") warningCount++;
      else if (h.status === "healthy") healthyCount++;
      if (h.status === "offline") offlineCount++;
    }

    const openOrders = orders.filter((o) => o.status !== "completed").length;
    const completionRate = orders.length > 0 ? Math.round((orders.filter((o) => o.status === "completed").length / orders.length) * 100) : 0;
    const highPriorityOrders = orders.filter((o) => o.priority === "emergency" || o.priority === "urgent").length;

    return {
      totalAssets: healthMap.size,
      averageHealthScore: Math.round(totalHealth / Math.max(1, healthMap.size)),
      criticalAssets: criticalCount,
      warningAssets: warningCount,
      healthyAssets: healthyCount,
      offlineAssets: offlineCount,
      highRiskAssets: highRiskCount,
      totalPredictions: predictions.length,
      highProbabilityFailures: predictions.filter((p) => p.probability >= 75).length,
      openWorkOrders: openOrders,
      highPriorityOrders,
      completionRate,
      maintenanceCompliance: Math.round(72 + Math.random() * 20),
      averageResponseTime: `${rand(15, 45)} min`,
      lastUpdated: new Date().toISOString(),
    };
  }

  computeTrends(healthMap: Map<string, AssetHealth>): TrendData[] {
    const trends: TrendData[] = [];
    const dates: string[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]!);
    }

    let health = 78;
    let risk = 22;
    let failures = 3;

    for (const date of dates) {
      health += randf(-6, 6, 0);
      health = Math.min(100, Math.max(10, health));
      risk = Math.min(95, Math.max(5, 100 - health + randf(-5, 5, 1)));
      failures = Math.max(1, Math.round(10 - health / 12 + rand(-3, 5)));

      trends.push({
        date,
        avgHealthScore: parseFloat(health.toFixed(1)),
        avgRiskScore: parseFloat(risk.toFixed(1)),
        predictedFailures: Math.round(failures),
      });
    }

    return trends;
  }

  computeAssetTypeBreakdown(healthMap: Map<string, AssetHealth>): { type: AssetType; count: number; avgHealth: number }[] {
    const groups = new Map<string, { total: number; count: number }>();
    for (const [, h] of healthMap) {
      const existing = groups.get(h.type) ?? { total: 0, count: 0 };
      existing.total += h.healthScore;
      existing.count++;
      groups.set(h.type, existing);
    }

    return Array.from(groups.entries())
      .map(([type, val]) => ({ type: type as AssetType, count: val.count, avgHealth: Math.round(val.total / val.count) }))
      .sort((a, b) => a.avgHealth - b.avgHealth);
  }
}

export const analyticsEngine = new MockAnalyticsEngine();

