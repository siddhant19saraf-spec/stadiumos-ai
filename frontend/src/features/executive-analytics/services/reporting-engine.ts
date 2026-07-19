// @ts-nocheck
import type { BoardReport, ExecutiveSummary, DecisionRecommendation } from "../types";
import type { ExecutiveKpi } from "../types";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IReportingEngine {
  generateBoardReport(summary: ExecutiveSummary, kpis: ExecutiveKpi[], decisions: DecisionRecommendation[], esgKpis: ESGKPI[]): BoardReport;
  getReportHistory(): { id: string; title: string; period: string; generatedAt: string }[];
}

export interface ESGKPI {
  category: string;
  metric: string;
  value: number;
  target: number;
  unit: string;
  status: string;
  trend: string;
}

export class MockReportingEngine implements IReportingEngine {
  generateBoardReport(summary: ExecutiveSummary, kpis: ExecutiveKpi[], decisions: DecisionRecommendation[], esgKpis: ESGKPI[]): BoardReport {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${lastMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })} — ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;

    const scorecards = this.buildScorecards(kpis);

    return {
      id: `br-${Date.now().toString(36)}`,
      title: "Executive Board Report — StadiumOS AI",
      period,
      generatedAt: now.toISOString(),
      executiveSummary: `StadiumOS AI operations performed at ${summary.operationalHealthScore}% operational health over the reporting period. Safety compliance maintained at ${summary.safetyScore}%. ${summary.activeIncidents > 0 ? `${summary.activeIncidents} incidents were managed with zero critical outcomes.` : "No incidents were recorded."} Sustainability metrics show ${summary.energyEfficiency}% energy efficiency with a carbon score of ${summary.carbonScore}%. Visitor satisfaction at ${summary.visitorSatisfaction}%.`,
      operationalOverview: `The stadium operated at ${summary.operationalHealthScore}% overall health. Match day status: ${summary.matchDayStatus}. Infrastructure health: ${summary.infrastructureHealth}%. Parking utilization averaged ${summary.parkingUtilization}%. Queue performance at ${summary.queuePerformance}%. ${summary.activeDecisions} AI-generated decisions were active during the period.`,
      kpiScorecards: scorecards,
      incidentSummary: `${summary.totalIncidents} total incidents were logged. ${summary.activeIncidents} remained active at period end. ${summary.criticalAlerts} critical alerts were triggered. Emergency status: ${summary.emergencyStatus}. All incidents were managed according to established protocols.`,
      resourceUtilization: `Staffing levels maintained at optimal capacity. Security deployment: ${summary.safetyScore >= 70 ? "Full coverage" : "Augmented coverage required"}. Energy resources: ${summary.energyEfficiency}% utilization efficiency. Parking: ${summary.parkingUtilization}% utilization.`,
      infrastructureHealth: `Overall infrastructure health: ${summary.infrastructureHealth}%. Predictive maintenance systems identified ${decisions.filter((d) => d.category === "maintenance").length} maintenance requirements. Critical systems operating at ${summary.infrastructureHealth >= 60 ? "acceptable" : "elevated risk"} levels.`,
      riskAnalysis: `Executive risk score: ${summary.executiveRiskScore}%. ${summary.executiveRiskScore > 40 ? "Risk levels elevated — mitigation actions recommended." : "Risk within acceptable parameters."} Primary risk factors: ${summary.crowdHealthScore < 60 ? "crowd density" : ""} ${summary.infrastructureHealth < 55 ? "infrastructure degradation" : ""} ${summary.emergencyStatus !== "normal" ? "active emergencies" : ""}.`,
      financialOverview: `Financial performance index: ${summary.financialPerformance}%. ${decisions.filter((d) => d.estimatedCostImpact > 0).reduce((s, d) => s + d.estimatedCostImpact, 0) > 0 ? `Estimated cost impact of active decisions: $${decisions.filter((d) => d.estimatedCostImpact > 0).reduce((s, d) => s + d.estimatedCostImpact, 0).toLocaleString()}.` : "No significant financial impacts from active decisions."}`,
      sustainabilityOverview: `Energy efficiency: ${summary.energyEfficiency}%. Carbon score: ${summary.carbonScore}%. ${esgKpis.filter((e) => e.status === "behind").length > 0 ? `${esgKpis.filter((e) => e.status === "behind").length} ESG targets are behind schedule.` : "All ESG targets on track."} Net-zero progress aligned with 2035 target.`,
      topRecommendations: decisions.slice(0, 5),
      strategicRoadmap: `Near-term priorities:\n1. ${decisions[0]?.title ?? "Maintain operational stability"}\n2. ${decisions[1]?.title ?? "Optimize resource allocation"}\n3. ${decisions[2]?.title ?? "Enhance sustainability performance"}\n\nMid-term: AI-driven predictive operations, enhanced automation, sustainability acceleration toward net-zero 2035.`,
      forecastSummary: `Projected operational health: ${Math.min(100, summary.operationalHealthScore + ri(2, 8))}%. Energy efficiency improvement target: ${Math.min(100, summary.energyEfficiency + ri(3, 7))}%. Risk score reduction target: ${Math.max(5, summary.executiveRiskScore - ri(5, 15))}%.`,
    };
  }

  getReportHistory() {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        id: `br-hist-${i}`,
        title: "Executive Board Report — StadiumOS AI",
        period: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        generatedAt: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
      };
    });
  }

  private buildScorecards(kpis: ExecutiveKpi[]) {
    const grouped = new Map<string, ExecutiveKpi[]>();
    for (const kpi of kpis) {
      const existing = grouped.get(kpi.category) ?? [];
      existing.push(kpi);
      grouped.set(kpi.category, existing);
    }
    return Array.from(grouped.entries()).map(([category, categoryKpis]) => ({
      category: category as any,
      kpis: categoryKpis,
    }));
  }
}

export const reportingEngine = new MockReportingEngine();

