// @ts-nocheck
import type { ExecutiveKpi, ExecutiveSummary, ExecutiveRole, KpiCategory } from "../types";
import { KPI_CATEGORY_LABELS, KPI_CATEGORY_ICONS } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IAnalyticsEngine {
  aggregateKpis(summary: ExecutiveSummary, kpis: ExecutiveKpi[]): { category: KpiCategory; score: number; trend: "improving" | "stable" | "declining" }[];
  getCategoryBreakdown(role: ExecutiveRole): { category: string; value: number; label: string }[];
  computeHealthSummary(kpis: ExecutiveKpi[]): { healthy: number; warning: number; critical: number; total: number };
  getFinancialProjection(): { revenue: number; costs: number; profit: number; variance: number };
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  aggregateKpis(summary: ExecutiveSummary, kpis: ExecutiveKpi[]) {
    const categories = new Map<KpiCategory, { total: number; count: number }>();
    for (const kpi of kpis) {
      const existing = categories.get(kpi.category) ?? { total: 0, count: 0 };
      existing.total += kpi.value;
      existing.count++;
      categories.set(kpi.category, existing);
    }
    return Array.from(categories.entries()).map(([cat, data]) => ({
      category: cat,
      score: Math.round(data.total / Math.max(1, data.count)),
      trend: (Math.random() > 0.6 ? "improving" : Math.random() > 0.3 ? "stable" : "declining") as "improving" | "stable" | "declining",
    }));
  }

  getCategoryBreakdown(role: ExecutiveRole) {
    return Object.entries(KPI_CATEGORY_LABELS).map(([key, label]) => ({
      category: key,
      value: ri(45, 95),
      label,
    }));
  }

  computeHealthSummary(kpis: ExecutiveKpi[]) {
    return {
      healthy: kpis.filter((k) => k.status === "healthy").length,
      warning: kpis.filter((k) => k.status === "warning").length,
      critical: kpis.filter((k) => k.status === "critical").length,
      total: kpis.length,
    };
  }

  getFinancialProjection() {
    const revenue = 250000 + ri(-25000, 35000);
    const costs = 180000 + ri(-15000, 20000);
    return {
      revenue,
      costs,
      profit: revenue - costs,
      variance: parseFloat(rf(-5, 8).toFixed(1)),
    };
  }
}

export const analyticsEngine = new MockAnalyticsEngine();

