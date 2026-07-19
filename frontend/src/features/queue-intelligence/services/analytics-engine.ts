import type { ConcessionAnalytics, QueuePointStatus, InventoryItem } from "../types";

function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface IAnalyticsEngine {
  compute(statuses: Map<string, QueuePointStatus>, inventory: Map<string, InventoryItem>): ConcessionAnalytics;
  trends(current: ConcessionAnalytics, previous?: ConcessionAnalytics): Record<string, "up" | "down" | "stable">;
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  private previous: ConcessionAnalytics | null = null;

  compute(statuses: Map<string, QueuePointStatus>, inventory: Map<string, InventoryItem>): ConcessionAnalytics {
    const arr = Array.from(statuses.values());
    const invArr = Array.from(inventory.values());

    const totalCustomers = arr.reduce((s, q) => s + q.currentLength, 0);
    const avgService = arr.length > 0 ? arr.reduce((s, q) => s + q.serviceSpeedSec, 0) / arr.length : 0;
    const avgSatisfaction = arr.length > 0 ? arr.reduce((s, q) => s + q.customerSatisfaction, 0) / arr.length : 0;
    const activeStaff = arr.reduce((s, q) => s + q.activeCounters, 0);
    const totalStaff = arr.reduce((s, q) => s + q.totalCounters, 0);
    const staffUtilization = totalStaff > 0 ? (activeStaff / totalStaff) * 100 : 0;

    const totalSales = Math.round(arr.reduce((s, q) => s + q.currentLength * 12, 0) + randf(-200, 500, 0));
    const revenuePerMin = totalSales > 0 ? totalSales / 60 : 0;

    const lowStock = invArr.filter((i) => i.restockPriority === "critical" || i.restockPriority === "high").length;
    const wasteAvg = invArr.length > 0 ? invArr.reduce((s, i) => s + i.wastePercent, 0) / invArr.length : 0;

    const foodCount = invArr.filter((i) => i.category === "food").length;
    const bevCount = invArr.filter((i) => i.category === "beverage").length;
    const merchCount = invArr.filter((i) => i.category === "merchandise").length;
    const popularCat = foodCount >= bevCount && foodCount >= merchCount ? "Food" : bevCount >= merchCount ? "Beverage" : "Merchandise";

    const hour = new Date().getHours();
    const peakHour = `${String(Math.max(10, hour - 1)).padStart(2, "0")}:00`;

    const critical = arr.filter((q) => q.status === "critical").length;
    const congested = arr.filter((q) => q.status === "congested").length;
    const efficiency = this.clamp(100 - critical * 8 - congested * 4 - lowStock * 3, 0, 100);
    const revenueForecast = Math.round(totalSales * 1.15);
    const wasteReduction = this.clamp(15 - wasteAvg, 0, 15);

    const optScore = this.optimizationScore(arr, efficiency, staffUtilization, avgSatisfaction);

    const result: ConcessionAnalytics = {
      totalSales,
      revenuePerMin: parseFloat(revenuePerMin.toFixed(1)),
      avgServiceTimeSec: Math.round(avgService),
      staffUtilization: Math.round(staffUtilization),
      peakHour,
      popularCategory: popularCat,
      revenueForecast,
      customerSatisfactionAvg: parseFloat(avgSatisfaction.toFixed(1)),
      operationalEfficiency: Math.round(efficiency),
      aiOptimizationScore: Math.round(optScore),
      totalCustomersServed: totalCustomers * 4,
      wasteReductionPercent: Math.round(wasteReduction),
    };

    this.previous = result;
    return result;
  }

  trends(current: ConcessionAnalytics, _previous?: ConcessionAnalytics): Record<string, "up" | "down" | "stable"> {
    const prev = _previous ?? this.previous;
    if (!prev) return {};
    const result: Record<string, "up" | "down" | "stable"> = {};
    const keys: (keyof ConcessionAnalytics)[] = [
      "customerSatisfactionAvg", "operationalEfficiency", "aiOptimizationScore",
      "staffUtilization", "revenuePerMin",
    ];
    for (const key of keys) {
      const diff = (current[key] as number) - ((prev?.[key] as number) ?? current[key]);
      result[key] = Math.abs(diff) < 3 ? "stable" : diff > 0 ? "up" : "down";
    }
    return result;
  }

  private optimizationScore(arr: QueuePointStatus[], efficiency: number, staffUtil: number, satisfaction: number): number {
    const avgWait = arr.reduce((s, q) => s + q.estimatedWaitMin, 0) / Math.max(1, arr.length);
    const waitScore = Math.max(0, 100 - avgWait * 2);
    const satScore = (satisfaction / 5) * 30;
    const effScore = efficiency * 0.3;
    return this.clamp(waitScore * 0.3 + satScore + effScore + staffUtil * 0.2, 0, 100);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const analyticsEngine = new MockAnalyticsEngine();
