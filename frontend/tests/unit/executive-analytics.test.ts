import { describe, it, expect, vi, beforeEach } from "vitest";
import { executiveEngine } from "@/features/executive-analytics/services/executive-engine";
import { analyticsEngine } from "@/features/executive-analytics/services/analytics-engine";
import { decisionEngine } from "@/features/executive-analytics/services/decision-engine";
import { riskEngine } from "@/features/executive-analytics/services/risk-engine";
import { copilotEngine } from "@/features/executive-analytics/services/copilot-engine";
import { reportingEngine } from "@/features/executive-analytics/services/reporting-engine";
import { notificationEngine } from "@/features/executive-analytics/services/notification-engine";
import { executiveService, createState } from "@/features/executive-analytics/services/executive-service";
import {
  EXECUTIVE_ROLES, ALERT_THRESHOLDS, KPI_CATEGORY_LABELS,
  KPI_CATEGORY_ICONS, MODULE_NAMES,
} from "@/features/executive-analytics/constants";
import type {
  ExecutiveRole, ExecutiveSummary, ExecutiveKpi, ModuleSnapshot,
  RiskAssessment, DecisionRecommendation, ExecutiveAlert,
} from "@/features/executive-analytics/types";
import { makeExecutiveKPI, makeDecision, makeRiskAssessment } from "../../tests/fixtures/factories";

/* ===================================================================
   Constants
   =================================================================== */
describe("Constants - Role Configs", () => {
  it("should define 8 roles with unique labels", () => {
    expect(EXECUTIVE_ROLES).toHaveLength(8);
    const labels = EXECUTIVE_ROLES.map((r) => r.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(8);
  });

  it("should have CEO with 5 KPI categories", () => {
    const ceo = EXECUTIVE_ROLES.find((r) => r.role === "ceo");
    expect(ceo!.kpiCategories).toContain("operations");
    expect(ceo!.kpiCategories).toContain("financial");
    expect(ceo!.kpiCategories).toContain("sustainability");
    expect(ceo!.kpiCategories).toContain("satisfaction");
    expect(ceo!.kpiCategories).toContain("risk");
    expect(ceo!.kpiCategories).toHaveLength(5);
  });

  it("should have COO with 5 operational categories", () => {
    const coo = EXECUTIVE_ROLES.find((r) => r.role === "coo");
    expect(coo!.kpiCategories).not.toContain("risk");
    expect(coo!.kpiCategories).toContain("queue");
    expect(coo!.kpiCategories).toContain("parking");
  });

  it("should have security_director with safety, emergency, risk, crowd", () => {
    const sd = EXECUTIVE_ROLES.find((r) => r.role === "security_director");
    expect(sd!.kpiCategories).toContain("safety");
    expect(sd!.kpiCategories).toContain("emergency");
    expect(sd!.kpiCategories).toContain("risk");
    expect(sd!.kpiCategories).toContain("crowd");
  });

  it("should have medical_coordinator with safety, emergency, crowd", () => {
    const mc = EXECUTIVE_ROLES.find((r) => r.role === "medical_coordinator");
    expect(mc!.kpiCategories).toEqual(["safety", "emergency", "crowd"]);
  });

  it("should have energy_manager with energy, sustainability, financial", () => {
    const em = EXECUTIVE_ROLES.find((r) => r.role === "energy_manager");
    expect(em!.kpiCategories).toContain("energy");
    expect(em!.kpiCategories).toContain("sustainability");
    expect(em!.kpiCategories).toContain("financial");
  });

  it("every role should have default view 'overview'", () => {
    for (const r of EXECUTIVE_ROLES) {
      expect(r.defaultView).toBe("overview");
    }
  });

  it("every role should have at least 2 priority modules", () => {
    for (const r of EXECUTIVE_ROLES) {
      expect(r.priorityModules.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("Constants - Alert Thresholds", () => {
  it("should have OPERATIONAL_HEALTH_MIN of 60", () => {
    expect(ALERT_THRESHOLDS.OPERATIONAL_HEALTH_MIN).toBe(60);
  });

  it("should have SAFETY_SCORE_MIN of 70", () => {
    expect(ALERT_THRESHOLDS.SAFETY_SCORE_MIN).toBe(70);
  });

  it("should have RISK_SCORE_MAX of 40", () => {
    expect(ALERT_THRESHOLDS.RISK_SCORE_MAX).toBe(40);
  });

  it("should have PARKING_UTILIZATION_MAX of 85", () => {
    expect(ALERT_THRESHOLDS.PARKING_UTILIZATION_MAX).toBe(85);
  });

  it("should have CROWD_HEALTH_MIN of 65", () => {
    expect(ALERT_THRESHOLDS.CROWD_HEALTH_MIN).toBe(65);
  });

  it("should have EMERGENCY_CRITICAL_COUNT of 1", () => {
    expect(ALERT_THRESHOLDS.EMERGENCY_CRITICAL_COUNT).toBe(1);
  });
});

describe("Constants - Labels & Icons", () => {
  it("should have labels for all 13 KPI categories", () => {
    const categories = ["operations", "safety", "crowd", "tournament", "emergency",
      "infrastructure", "parking", "queue", "energy", "sustainability",
      "financial", "satisfaction", "risk"];
    for (const cat of categories) {
      expect(KPI_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("should have icons for all categories", () => {
    const categories = Object.keys(KPI_CATEGORY_LABELS);
    for (const cat of categories) {
      expect(KPI_CATEGORY_ICONS[cat]).toBeTruthy();
    }
  });

  it("should have MODULE_NAMES for all expected keys", () => {
    expect(MODULE_NAMES["command-center"]).toBe("Command Center");
    expect(MODULE_NAMES["tournament-ops"]).toBe("Tournament Operations");
    expect(MODULE_NAMES["crowd-intelligence"]).toBe("Crowd Intelligence");
    expect(MODULE_NAMES["energy"]).toBe("Energy Management");
  });

  it("MODULE_NAMES should have at least 10 entries", () => {
    expect(Object.keys(MODULE_NAMES).length).toBeGreaterThanOrEqual(10);
  });
});

/* ===================================================================
   Executive Engine - Expanded
   =================================================================== */
describe("ExecutiveEngine - Summary Generation", () => {
  it("should produce summary with all numeric fields", () => {
    const summary = executiveEngine.getSummary("ceo");
    const numericFields = ["operationalHealthScore", "safetyScore", "crowdHealthScore",
      "tournamentProgress", "infrastructureHealth", "parkingUtilization",
      "queuePerformance", "energyEfficiency", "carbonScore",
      "financialPerformance", "visitorSatisfaction", "executiveRiskScore"];
    for (const field of numericFields) {
      expect(typeof summary[field as keyof typeof summary]).toBe("number");
      expect(summary[field as keyof typeof summary]).toBeGreaterThanOrEqual(0);
      expect(summary[field as keyof typeof summary]).toBeLessThanOrEqual(100);
    }
  });

  it("should produce emergencyStatus of normal, elevated, or critical", () => {
    for (const role of EXECUTIVE_ROLES.map((r) => r.role)) {
      const summary = executiveEngine.getSummary(role);
      expect(["normal", "elevated", "critical"]).toContain(summary.emergencyStatus);
    }
  });

  it("should produce matchDayStatus of active or standby", () => {
    for (const role of EXECUTIVE_ROLES.map((r) => r.role)) {
      const summary = executiveEngine.getSummary(role);
      expect(["active", "preparing", "standby"]).toContain(summary.matchDayStatus);
    }
  });

  it("should mark tournament_director and ceo role summaries as matchday active", () => {
    const td = executiveEngine.getSummary("tournament_director");
    expect(td.matchDayStatus).toBe("active");
  });

  it("should return lastUpdated as valid ISO string", () => {
    const summary = executiveEngine.getSummary("ceo");
    expect(new Date(summary.lastUpdated).getTime()).not.toBeNaN();
  });

  it("should have different values from different role summaries", () => {
    const s1 = executiveEngine.getSummary("ceo");
    const s2 = executiveEngine.getSummary("energy_manager");
    expect(s1).not.toEqual(s2);
  });

  it("should include activeDecisions between 2 and 8", () => {
    const summary = executiveEngine.getSummary("ceo");
    expect(summary.activeDecisions).toBeGreaterThanOrEqual(2);
    expect(summary.activeDecisions).toBeLessThanOrEqual(8);
  });

  it("should include totalIncidents between 5 and 20", () => {
    const summary = executiveEngine.getSummary("ceo");
    expect(summary.totalIncidents).toBeGreaterThanOrEqual(5);
    expect(summary.totalIncidents).toBeLessThanOrEqual(20);
  });
});

describe("ExecutiveEngine - Module Snapshots", () => {
  it("should return snapshots for all modules", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    expect(snapshots.length).toBe(Object.keys(MODULE_NAMES).length);
  });

  it("each snapshot should have valid status", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    for (const s of snapshots) {
      expect(["healthy", "warning", "critical", "offline"]).toContain(s.status);
    }
  });

  it("each snapshot should have healthScore in range", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    for (const s of snapshots) {
      expect(s.healthScore).toBeGreaterThanOrEqual(0);
      expect(s.healthScore).toBeLessThanOrEqual(100);
    }
  });

  it("each snapshot should have kpis array", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    for (const s of snapshots) {
      expect(s.kpis.length).toBeGreaterThan(0);
    }
  });

  it("each snapshot should have lastUpdated", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    for (const s of snapshots) {
      expect(s.lastUpdated).toBeTruthy();
    }
  });

  it("each snapshot should have summary text", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    for (const s of snapshots) {
      expect(s.summary.length).toBeGreaterThan(0);
    }
  });

  it("should include activeAlerts count", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    for (const s of snapshots) {
      expect(s.activeAlerts).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("ExecutiveEngine - KPI Values", () => {
  it("should return filtered KPIs per role", () => {
    for (const role of EXECUTIVE_ROLES.map((r) => r.role)) {
      const kpis = executiveEngine.getKpiValues(role);
      expect(kpis.length).toBeGreaterThan(0);
      const roleCats = EXECUTIVE_ROLES.find((r) => r.role === role)!.kpiCategories;
      for (const kpi of kpis) {
        expect(roleCats).toContain(kpi.category);
      }
    }
  });

  it("should return KPIs with all required fields", () => {
    const kpis = executiveEngine.getKpiValues("ceo");
    for (const kpi of kpis) {
      expect(kpi).toHaveProperty("id");
      expect(kpi).toHaveProperty("label");
      expect(kpi).toHaveProperty("value");
      expect(kpi).toHaveProperty("previousValue");
      expect(kpi).toHaveProperty("unit");
      expect(kpi).toHaveProperty("category");
      expect(kpi).toHaveProperty("trend");
      expect(kpi).toHaveProperty("status");
      expect(kpi).toHaveProperty("changePct");
      expect(kpi).toHaveProperty("changeDirection");
      expect(kpi).toHaveProperty("tooltip");
    }
  });

  it("should return valid trend values", () => {
    const kpis = executiveEngine.getKpiValues("ceo");
    for (const kpi of kpis) {
      expect(["up", "down", "stable"]).toContain(kpi.trend);
    }
  });

  it("should return valid status values", () => {
    const kpis = executiveEngine.getKpiValues("ceo");
    for (const kpi of kpis) {
      expect(["critical", "warning", "healthy", "neutral"]).toContain(kpi.status);
    }
  });

  it("should return valid changeDirection values", () => {
    const kpis = executiveEngine.getKpiValues("ceo");
    for (const kpi of kpis) {
      expect(["increase", "decrease", "unchanged"]).toContain(kpi.changeDirection);
    }
  });

  it("each KPI should have tooltip text", () => {
    const kpis = executiveEngine.getKpiValues("ceo");
    for (const kpi of kpis) {
      expect(kpi.tooltip.length).toBeGreaterThan(0);
    }
  });

  it("energy_manager should not see crowd or safety KPIs", () => {
    const kpis = executiveEngine.getKpiValues("energy_manager");
    const categories = kpis.map((k) => k.category);
    expect(categories).not.toContain("crowd");
    expect(categories).not.toContain("safety");
  });

  it("CEO gets more KPIs than energy_manager", () => {
    const ceo = executiveEngine.getKpiValues("ceo");
    const energy = executiveEngine.getKpiValues("energy_manager");
    expect(ceo.length).toBeGreaterThan(energy.length);
  });
});

/* ===================================================================
   Analytics Engine - Expanded
   =================================================================== */
describe("AnalyticsEngine - KPI Aggregation", () => {
  it("should aggregate KPIs by category", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const aggregated = analyticsEngine.aggregateKpis(summary, kpis);
    for (const item of aggregated) {
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("score");
      expect(item).toHaveProperty("trend");
    }
  });

  it("should compute average score per category", () => {
    const kpis: ExecutiveKpi[] = [
      { id: "1", label: "A", value: 80, previousValue: 75, unit: "%", category: "operations", trend: "up", status: "healthy", changePct: 6.7, changeDirection: "increase", tooltip: "T" },
      { id: "2", label: "B", value: 90, previousValue: 85, unit: "%", category: "operations", trend: "up", status: "healthy", changePct: 5.9, changeDirection: "increase", tooltip: "T" },
    ];
    const summary = executiveEngine.getSummary("ceo");
    const agg = analyticsEngine.aggregateKpis(summary, kpis);
    const ops = agg.find((a) => a.category === "operations");
    expect(ops!.score).toBe(85);
  });

  it("should return empty aggregation for empty KPIs", () => {
    const summary = executiveEngine.getSummary("ceo");
    expect(analyticsEngine.aggregateKpis(summary, [])).toEqual([]);
  });

  it("should compute health summary with correct totals", () => {
    const kpis: ExecutiveKpi[] = [
      { id: "1", label: "A", value: 80, previousValue: 75, unit: "%", category: "operations", trend: "up", status: "healthy", changePct: 6.7, changeDirection: "increase", tooltip: "T" },
      { id: "2", label: "B", value: 50, previousValue: 55, unit: "%", category: "safety", trend: "down", status: "warning", changePct: -9.1, changeDirection: "decrease", tooltip: "T" },
      { id: "3", label: "C", value: 30, previousValue: 45, unit: "%", category: "risk", trend: "down", status: "critical", changePct: -33.3, changeDirection: "decrease", tooltip: "T" },
    ];
    const health = analyticsEngine.computeHealthSummary(kpis);
    expect(health.healthy).toBe(1);
    expect(health.warning).toBe(1);
    expect(health.critical).toBe(1);
    expect(health.total).toBe(3);
  });

  it("should compute health summary with all healthy", () => {
    const kpis: ExecutiveKpi[] = [
      { id: "1", label: "A", value: 85, previousValue: 80, unit: "%", category: "operations", trend: "up", status: "healthy", changePct: 6.3, changeDirection: "increase", tooltip: "T" },
      { id: "2", label: "B", value: 90, previousValue: 88, unit: "%", category: "safety", trend: "up", status: "healthy", changePct: 2.3, changeDirection: "increase", tooltip: "T" },
    ];
    const health = analyticsEngine.computeHealthSummary(kpis);
    expect(health.healthy).toBe(2);
    expect(health.warning).toBe(0);
    expect(health.critical).toBe(0);
  });

  it("should provide category breakdown for any role", () => {
    for (const role of EXECUTIVE_ROLES.map((r) => r.role)) {
      const breakdown = analyticsEngine.getCategoryBreakdown(role);
      expect(breakdown.length).toBeGreaterThan(0);
    }
  });

  it("category breakdown values should be between 0 and 100", () => {
    const breakdown = analyticsEngine.getCategoryBreakdown("ceo");
    for (const item of breakdown) {
      expect(item.value).toBeGreaterThanOrEqual(0);
      expect(item.value).toBeLessThanOrEqual(100);
    }
  });

  it("should provide financial projection", () => {
    const proj = analyticsEngine.getFinancialProjection();
    expect(proj.revenue).toBeGreaterThan(0);
    expect(proj.costs).toBeGreaterThan(0);
    expect(proj.profit).toBe(proj.revenue - proj.costs);
    expect(typeof proj.variance).toBe("number");
  });

  it("financial projection should have reasonable values", () => {
    const proj = analyticsEngine.getFinancialProjection();
    expect(proj.revenue).toBeGreaterThan(200000);
    expect(proj.revenue).toBeLessThan(300000);
    expect(proj.costs).toBeGreaterThan(150000);
    expect(proj.costs).toBeLessThan(210000);
  });

  it("category breakdown should include labels for all", () => {
    const breakdown = analyticsEngine.getCategoryBreakdown("ceo");
    for (const item of breakdown) {
      expect(item.label).toBeTruthy();
    }
  });
});

/* ===================================================================
   Decision Engine - Expanded
   =================================================================== */
describe("DecisionEngine - Generation", () => {
  it("should generate emergency protocol for critical emergency", () => {
    const critical: ExecutiveSummary = {
      operationalHealthScore: 50, safetyScore: 50, crowdHealthScore: 50,
      tournamentProgress: 50, emergencyStatus: "critical",
      infrastructureHealth: 50, parkingUtilization: 60,
      queuePerformance: 50, energyEfficiency: 50,
      carbonScore: 50, financialPerformance: 50, visitorSatisfaction: 50,
      executiveRiskScore: 60, activeDecisions: 3, unacknowledgedAlerts: 2,
      criticalAlerts: 1, totalIncidents: 10, activeIncidents: 2,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(critical, snapshots, "ceo");
    expect(decisions.some((d) => d.priority === "p0")).toBe(true);
  });

  it("should generate parking decision when utilization high", () => {
    const highParking: ExecutiveSummary = {
      operationalHealthScore: 70, safetyScore: 70, crowdHealthScore: 70,
      tournamentProgress: 70, emergencyStatus: "normal",
      infrastructureHealth: 70, parkingUtilization: 95,
      queuePerformance: 70, energyEfficiency: 70,
      carbonScore: 70, financialPerformance: 70, visitorSatisfaction: 70,
      executiveRiskScore: 25, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 5, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(highParking, snapshots, "ceo");
    expect(decisions.some((d) => d.category === "parking")).toBe(true);
  });

  it("should generate safety decision when score low", () => {
    const lowSafety: ExecutiveSummary = {
      operationalHealthScore: 70, safetyScore: 55, crowdHealthScore: 70,
      tournamentProgress: 70, emergencyStatus: "normal",
      infrastructureHealth: 70, parkingUtilization: 60,
      queuePerformance: 70, energyEfficiency: 70,
      carbonScore: 70, financialPerformance: 70, visitorSatisfaction: 70,
      executiveRiskScore: 25, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 5, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(lowSafety, snapshots, "ceo");
    expect(decisions.some((d) => d.category === "safety")).toBe(true);
  });

  it("should generate infrastructure decision when health low", () => {
    const lowInfra: ExecutiveSummary = {
      operationalHealthScore: 70, safetyScore: 70, crowdHealthScore: 70,
      tournamentProgress: 70, emergencyStatus: "normal",
      infrastructureHealth: 45, parkingUtilization: 60,
      queuePerformance: 70, energyEfficiency: 70,
      carbonScore: 70, financialPerformance: 70, visitorSatisfaction: 70,
      executiveRiskScore: 25, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(lowInfra, snapshots, "ceo");
    expect(decisions.some((d) => d.category === "maintenance")).toBe(true);
  });

  it("should generate energy decision when efficiency low", () => {
    const lowEnergy: ExecutiveSummary = {
      operationalHealthScore: 70, safetyScore: 70, crowdHealthScore: 70,
      tournamentProgress: 70, emergencyStatus: "normal",
      infrastructureHealth: 70, parkingUtilization: 60,
      queuePerformance: 70, energyEfficiency: 50,
      carbonScore: 70, financialPerformance: 70, visitorSatisfaction: 70,
      executiveRiskScore: 25, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(lowEnergy, snapshots, "ceo");
    expect(decisions.some((d) => d.category === "energy")).toBe(true);
  });

  it("should generate decisions with confidence scores", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    for (const d of decisions) {
      expect(d.confidence).toBeGreaterThanOrEqual(78);
      expect(d.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("each decision should have reasoning array", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    for (const d of decisions) {
      expect(d.reasoning.length).toBeGreaterThan(0);
    }
  });

  it("each decision should have supportingEvidence array", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    for (const d of decisions) {
      expect(d.supportingEvidence.length).toBeGreaterThan(0);
    }
  });

  it("each decision should have alternativeOptions", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    for (const d of decisions) {
      expect(d.alternativeOptions.length).toBeGreaterThan(0);
    }
  });

  it("each decision should have estimatedCostImpact", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    for (const d of decisions) {
      expect(typeof d.estimatedCostImpact).toBe("number");
    }
  });

  it("each decision should have estimatedTimeImpact", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    for (const d of decisions) {
      expect(typeof d.estimatedTimeImpact).toBe("string");
      expect(d.estimatedTimeImpact.length).toBeGreaterThan(0);
    }
  });

  it("should filter decisions by status", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const active = decisionEngine.getByStatus(decisions, "active");
    expect(active.every((d) => d.status === "active")).toBe(true);
    const implemented = decisionEngine.getByStatus(decisions, "implemented");
    expect(implemented).toHaveLength(0);
  });

  it("should implement a decision and mark timestamp", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    if (decisions.length > 0) {
      const id = decisions[0].id;
      const updated = decisionEngine.implement(id, decisions, "ceo");
      const impl = updated.find((d) => d.id === id);
      expect(impl!.status).toBe("implemented");
      expect(impl!.authorizedBy).toBe("ceo");
      expect(impl!.implementedAt).toBeTruthy();
    }
  });

  it("should implement only the specified decision", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    if (decisions.length > 1) {
      const id = decisions[0].id;
      const updated = decisionEngine.implement(id, decisions, "ceo");
      expect(updated.find((d) => d.id === id)!.status).toBe("implemented");
      const others = updated.filter((d) => d.id !== id);
      expect(others.every((d) => d.status === "active")).toBe(true);
    }
  });

  it("should generate decisions with sourceModule", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    for (const d of decisions) {
      expect(d.sourceModule).toBeTruthy();
    }
  });

  it("should limit decisions to maximum 10", () => {
    const worst: ExecutiveSummary = {
      operationalHealthScore: 25, safetyScore: 25, crowdHealthScore: 25,
      tournamentProgress: 25, emergencyStatus: "critical",
      infrastructureHealth: 25, parkingUtilization: 99,
      queuePerformance: 25, energyEfficiency: 25,
      carbonScore: 25, financialPerformance: 25, visitorSatisfaction: 25,
      executiveRiskScore: 85, activeDecisions: 10, unacknowledgedAlerts: 5,
      criticalAlerts: 3, totalIncidents: 20, activeIncidents: 5,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(worst, snapshots, "ceo");
    expect(decisions.length).toBeLessThanOrEqual(10);
  });
});

/* ===================================================================
   Risk Engine - Expanded
   =================================================================== */
describe("RiskEngine - Assessment", () => {
  it("should generate crowd risk when crowd health low", () => {
    const lowCrowd: ExecutiveSummary = {
      operationalHealthScore: 75, safetyScore: 75, crowdHealthScore: 50,
      tournamentProgress: 75, emergencyStatus: "normal",
      infrastructureHealth: 75, parkingUtilization: 60,
      queuePerformance: 75, energyEfficiency: 75,
      carbonScore: 75, financialPerformance: 75, visitorSatisfaction: 75,
      executiveRiskScore: 20, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(lowCrowd, snapshots);
    expect(risks.some((r) => r.category === "crowd_safety")).toBe(true);
  });

  it("should generate infrastructure risk when health low", () => {
    const lowInfra: ExecutiveSummary = {
      operationalHealthScore: 75, safetyScore: 75, crowdHealthScore: 75,
      tournamentProgress: 75, emergencyStatus: "normal",
      infrastructureHealth: 45, parkingUtilization: 60,
      queuePerformance: 75, energyEfficiency: 75,
      carbonScore: 75, financialPerformance: 75, visitorSatisfaction: 75,
      executiveRiskScore: 20, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(lowInfra, snapshots);
    expect(risks.some((r) => r.category === "infrastructure")).toBe(true);
  });

  it("should generate emergency risk when status elevated", () => {
    const elevated: ExecutiveSummary = {
      operationalHealthScore: 75, safetyScore: 75, crowdHealthScore: 75,
      tournamentProgress: 75, emergencyStatus: "elevated",
      infrastructureHealth: 75, parkingUtilization: 60,
      queuePerformance: 75, energyEfficiency: 75,
      carbonScore: 75, financialPerformance: 75, visitorSatisfaction: 75,
      executiveRiskScore: 20, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 5, activeIncidents: 2,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(elevated, snapshots);
    expect(risks.some((r) => r.category === "safety" && r.title.includes("Emergency"))).toBe(true);
  });

  it("should generate executive risk when score high", () => {
    const highRisk: ExecutiveSummary = {
      operationalHealthScore: 50, safetyScore: 50, crowdHealthScore: 50,
      tournamentProgress: 50, emergencyStatus: "normal",
      infrastructureHealth: 50, parkingUtilization: 60,
      queuePerformance: 50, energyEfficiency: 50,
      carbonScore: 50, financialPerformance: 50, visitorSatisfaction: 50,
      executiveRiskScore: 65, activeDecisions: 3, unacknowledgedAlerts: 2,
      criticalAlerts: 0, totalIncidents: 5, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(highRisk, snapshots);
    expect(risks.some((r) => r.category === "operations" && r.title.includes("Executive Risk"))).toBe(true);
  });

  it("each risk should have mitigationActions", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    for (const r of risks) {
      expect(r.mitigationActions.length).toBeGreaterThan(0);
    }
  });

  it("each risk should have an owner assigned", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    for (const r of risks) {
      expect(r.owner).toBeTruthy();
    }
  });

  it("each risk should have affectedModules array", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    for (const r of risks) {
      expect(r.affectedModules.length).toBeGreaterThan(0);
    }
  });

  it("each risk should have lastUpdated", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    for (const r of risks) {
      expect(new Date(r.lastUpdated).getTime()).not.toBeNaN();
    }
  });

  it("should filter risks by category", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    const safetyRisks = riskEngine.getRiskByCategory(risks, "safety");
    expect(safetyRisks.every((r) => r.category === "safety")).toBe(true);
  });

  it("should return empty array for unknown category filter", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    const filtered = riskEngine.getRiskByCategory(risks, "nonexistent");
    expect(filtered).toEqual([]);
  });

  it("should return risk score and level from overall risk", () => {
    const summary = executiveEngine.getSummary("ceo");
    const overall = riskEngine.getOverallRisk(summary);
    expect(overall.score).toBe(summary.executiveRiskScore);
    expect(["critical", "high", "medium", "low"]).toContain(overall.level);
    expect(["improving", "stable", "worsening"]).toContain(overall.trend);
  });

  it("overall risk should be critical when score >= 60", () => {
    const summary: ExecutiveSummary = {
      operationalHealthScore: 30, safetyScore: 30, crowdHealthScore: 30,
      tournamentProgress: 30, emergencyStatus: "critical",
      infrastructureHealth: 30, parkingUtilization: 60,
      queuePerformance: 30, energyEfficiency: 30,
      carbonScore: 30, financialPerformance: 30, visitorSatisfaction: 30,
      executiveRiskScore: 75, activeDecisions: 5, unacknowledgedAlerts: 3,
      criticalAlerts: 2, totalIncidents: 10, activeIncidents: 3,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const overall = riskEngine.getOverallRisk(summary);
    expect(overall.level).toBe("critical");
    expect(overall.trend).toBe("worsening");
  });
});

/* ===================================================================
   Copilot Engine - Expanded
   =================================================================== */
describe("CopilotEngine - Query Handling", () => {
  it("should handle risk query with detailed response", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("What are the top risks?", summary, decisions, risks, kpis, timeline);
    expect(result.answer.toLowerCase()).toContain("risk");
    expect(result.relevantKpis).toContain("risk-score");
    expect(result.dataPoints.length).toBeGreaterThan(0);
  });

  it("should handle health query with operational data", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("What is the operational health?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toContain("%");
    expect(result.dataPoints.length).toBeGreaterThan(0);
  });

  it("should handle emergency query with incident data", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("Are there any incidents?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
    expect(result.answer.toLowerCase()).toContain("incident");
  });

  it("should handle decision query with recommendations", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("What decisions need my attention?", summary, decisions, risks, kpis, timeline);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should handle energy query", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("How is our energy efficiency?", summary, decisions, risks, kpis, timeline);
    expect(result.relevantKpis).toContain("energy-eff");
  });

  it("should handle sustainability query", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("How is our carbon score?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toContain("Carbon");
  });

  it("should handle generic query gracefully", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("Tell me about the stadium operations", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toContain("StadiumOS AI");
    expect(result.dataPoints.length).toBeGreaterThan(0);
  });

  it("should handle empty query string", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
  });

  it("should return confidence between 82 and 97", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("test", summary, decisions, risks, kpis, timeline);
    expect(result.confidence).toBeGreaterThanOrEqual(82);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("should return sources array", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("test", summary, decisions, risks, kpis, timeline);
    expect(result.sources.length).toBeGreaterThanOrEqual(3);
  });

  it("should return risk flags array", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("test", summary, decisions, risks, kpis, timeline);
    expect(Array.isArray(result.riskFlags)).toBe(true);
  });

  it("should return 6 suggested questions", () => {
    const questions = copilotEngine.getSuggestedQuestions();
    expect(questions).toHaveLength(6);
    for (const q of questions) {
      expect(q.endsWith("?")).toBe(true);
    }
  });

  it("should generate executive briefing with all sections", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const briefing = copilotEngine.generateBriefing(summary, decisions, risks);
    expect(briefing).toContain("EXECUTIVE BRIEFING");
    expect(briefing).toContain("OPERATIONAL OVERVIEW");
    expect(briefing).toContain("KEY METRICS");
    expect(briefing).toContain("TOP DECISIONS");
    expect(briefing).toContain("RISK ASSESSMENT");
    expect(briefing).toContain("SUMMARY");
  });

  it("briefing should reference critical alerts count", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const briefing = copilotEngine.generateBriefing(summary, decisions, risks);
    expect(briefing).toContain(`${summary.criticalAlerts}`);
  });
});

/* ===================================================================
   Reporting Engine - Expanded
   =================================================================== */
describe("ReportingEngine - Board Report", () => {
  it("should generate report with all required fields", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    const required = ["id", "title", "period", "generatedAt", "executiveSummary",
      "operationalOverview", "kpiScorecards", "incidentSummary", "resourceUtilization",
      "infrastructureHealth", "riskAnalysis", "financialOverview", "sustainabilityOverview",
      "topRecommendations", "strategicRoadmap", "forecastSummary"];
    for (const field of required) {
      expect(report).toHaveProperty(field);
    }
  });

  it("should group KPIs by category in scorecards", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    for (const sc of report.kpiScorecards) {
      expect(sc).toHaveProperty("category");
      expect(sc).toHaveProperty("kpis");
      expect(sc.kpis.length).toBeGreaterThan(0);
      for (const kpi of sc.kpis) {
        expect(kpi.category).toBe(sc.category);
      }
    }
  });

  it("should include period in report", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    expect(report.period).toContain("—");
  });

  it("should include top recommendations limited to 5", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    expect(report.topRecommendations.length).toBeLessThanOrEqual(5);
  });

  it("should include strategic roadmap with 3 items", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    expect(report.strategicRoadmap).toContain("1.");
    expect(report.strategicRoadmap).toContain("2.");
    expect(report.strategicRoadmap).toContain("3.");
  });

  it("should include ESG KPIs when provided", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const esgKpis = [
      { category: "energy", metric: "Efficiency", value: 80, target: 85, unit: "%", status: "on_track", trend: "improving" },
    ];
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, esgKpis);
    expect(report.sustainabilityOverview).toBeTruthy();
  });

  it("report history should contain 6 entries", () => {
    const history = reportingEngine.getReportHistory();
    expect(history).toHaveLength(6);
  });

  it("report history entries should have all fields", () => {
    const history = reportingEngine.getReportHistory();
    for (const entry of history) {
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("title");
      expect(entry).toHaveProperty("period");
      expect(entry).toHaveProperty("generatedAt");
      expect(entry.title).toContain("Executive Board Report");
    }
  });
});

/* ===================================================================
   Notification Engine - Expanded
   =================================================================== */
describe("NotificationEngine - Alert Generation", () => {
  it("should generate critical alert for critical emergency", () => {
    const critical: ExecutiveSummary = {
      operationalHealthScore: 30, safetyScore: 30, crowdHealthScore: 30,
      tournamentProgress: 30, emergencyStatus: "critical",
      infrastructureHealth: 30, parkingUtilization: 60,
      queuePerformance: 30, energyEfficiency: 30,
      carbonScore: 30, financialPerformance: 30, visitorSatisfaction: 30,
      executiveRiskScore: 80, activeDecisions: 5, unacknowledgedAlerts: 3,
      criticalAlerts: 2, totalIncidents: 10, activeIncidents: 3,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const alerts = notificationEngine.generateAlerts(critical, [], []);
    expect(alerts.some((a) => a.severity === "critical")).toBe(true);
    expect(alerts.some((a) => a.category === "critical_incident")).toBe(true);
  });

  it("should generate infrastructure alert when health below 50", () => {
    const lowInfra: ExecutiveSummary = {
      operationalHealthScore: 50, safetyScore: 50, crowdHealthScore: 50,
      tournamentProgress: 50, emergencyStatus: "normal",
      infrastructureHealth: 40, parkingUtilization: 60,
      queuePerformance: 50, energyEfficiency: 50,
      carbonScore: 50, financialPerformance: 50, visitorSatisfaction: 50,
      executiveRiskScore: 30, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const alerts = notificationEngine.generateAlerts(lowInfra, [], []);
    expect(alerts.some((a) => a.category === "infrastructure_failure")).toBe(true);
  });

  it("should generate crowd alert when crowd health below 55", () => {
    const lowCrowd: ExecutiveSummary = {
      operationalHealthScore: 50, safetyScore: 50, crowdHealthScore: 45,
      tournamentProgress: 50, emergencyStatus: "normal",
      infrastructureHealth: 50, parkingUtilization: 60,
      queuePerformance: 50, energyEfficiency: 50,
      carbonScore: 50, financialPerformance: 50, visitorSatisfaction: 50,
      executiveRiskScore: 30, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const alerts = notificationEngine.generateAlerts(lowCrowd, [], []);
    expect(alerts.some((a) => a.category === "crowd_safety")).toBe(true);
  });

  it("should generate energy alert when efficiency below 55", () => {
    const lowEnergy: ExecutiveSummary = {
      operationalHealthScore: 50, safetyScore: 50, crowdHealthScore: 50,
      tournamentProgress: 50, emergencyStatus: "normal",
      infrastructureHealth: 50, parkingUtilization: 60,
      queuePerformance: 50, energyEfficiency: 45,
      carbonScore: 50, financialPerformance: 50, visitorSatisfaction: 50,
      executiveRiskScore: 30, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const alerts = notificationEngine.generateAlerts(lowEnergy, [], []);
    expect(alerts.some((a) => a.category === "esg_risk")).toBe(true);
  });

  it("should generate executive risk alert when score above 50", () => {
    const highRisk: ExecutiveSummary = {
      operationalHealthScore: 50, safetyScore: 50, crowdHealthScore: 50,
      tournamentProgress: 50, emergencyStatus: "normal",
      infrastructureHealth: 50, parkingUtilization: 60,
      queuePerformance: 50, energyEfficiency: 50,
      carbonScore: 50, financialPerformance: 50, visitorSatisfaction: 50,
      executiveRiskScore: 65, activeDecisions: 3, unacknowledgedAlerts: 2,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const alerts = notificationEngine.generateAlerts(highRisk, [], []);
    expect(alerts.some((a) => a.category === "high_risk")).toBe(true);
  });

  it("should generate authorization alerts for decisions", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const alerts = notificationEngine.generateAlerts(summary, decisions, []);
    const authAlerts = alerts.filter((a) => a.title.includes("Authorization Required"));
    expect(authAlerts.length).toBeGreaterThanOrEqual(0);
  });

  it("each alert should have aiSuggestion", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const alerts = notificationEngine.generateAlerts(summary, decisions, risks);
    for (const a of alerts) {
      expect(a.aiSuggestion).toBeTruthy();
    }
  });

  it("each alert should have involvesModules array", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const alerts = notificationEngine.generateAlerts(summary, decisions, risks);
    for (const a of alerts) {
      expect(a.involvesModules.length).toBeGreaterThan(0);
    }
  });

  it("should generate timeline events with 7 days of history", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const events = notificationEngine.generateTimelineEvents(summary, decisions);
    expect(events.length).toBeGreaterThanOrEqual(3);
  });

  it("timeline events should be sorted chronologically descending", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const events = notificationEngine.generateTimelineEvents(summary, decisions);
    for (let i = 0; i < events.length - 1; i++) {
      const current = new Date(events[i].timestamp).getTime();
      const next = new Date(events[i + 1].timestamp).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it("should acknowledge an alert", () => {
    const summary = executiveEngine.getSummary("ceo");
    const alerts = notificationEngine.generateAlerts(summary, [], []);
    if (alerts.length > 0) {
      const id = alerts[0].id;
      const updated = notificationEngine.acknowledge(id, alerts);
      const acked = updated.find((a) => a.id === id);
      expect(acked!.acknowledged).toBe(true);
      expect(acked!.acknowledgedAt).toBeTruthy();
    }
  });

  it("acknowledge should not modify other alerts", () => {
    const summary = executiveEngine.getSummary("ceo");
    const alerts = notificationEngine.generateAlerts(summary, [], []);
    if (alerts.length > 1) {
      const id = alerts[0].id;
      const updated = notificationEngine.acknowledge(id, alerts);
      const other = updated.find((a) => a.id === alerts[1].id);
      expect(other!.acknowledged).toBe(false);
    }
  });

  it("should filter unacknowledged alerts", () => {
    const summary = executiveEngine.getSummary("ceo");
    const alerts = notificationEngine.generateAlerts(summary, [], []);
    if (alerts.length > 0) {
      const withAcked = notificationEngine.acknowledge(alerts[0].id, alerts);
      const unacked = notificationEngine.getUnacknowledged(withAcked);
      for (const a of unacked) {
        expect(a.acknowledged).toBe(false);
      }
    }
  });

  it("should filter alerts by severity", () => {
    const summary = executiveEngine.getSummary("ceo");
    const alerts = notificationEngine.generateAlerts(summary, [], []);
    const critical = notificationEngine.getBySeverity(alerts, "critical");
    for (const a of critical) {
      expect(a.severity).toBe("critical");
    }
  });
});

/* ===================================================================
   Executive Service - Expanded
   =================================================================== */
describe("ExecutiveService - Orchestration", () => {
  it("should initialize with default CEO role", () => {
    const state = executiveService.initialize();
    expect(state.selectedRole).toBe("ceo");
    expect(state.kpis.length).toBeGreaterThan(0);
    expect(state.moduleSnapshots.length).toBeGreaterThan(0);
  });

  it("should initialize with specified role", () => {
    const state = executiveService.initialize("energy_manager");
    expect(state.selectedRole).toBe("energy_manager");
  });

  it("should refresh state with updated data", () => {
    const state = executiveService.initialize("ceo");
    const refreshed = executiveService.refresh(state);
    expect(refreshed.summary).toBeTruthy();
    expect(refreshed.lastUpdated).toBeTruthy();
    expect(refreshed.lastUpdated).not.toBe(state.lastUpdated);
  });

  it("should switch role and reinitialize all data", () => {
    const state = executiveService.initialize("ceo");
    const switched = executiveService.switchRole(state, "security_director");
    expect(switched.selectedRole).toBe("security_director");
    const switchedCats = switched.kpis.map((k) => k.category);
    expect(switchedCats).toContain("safety");
    expect(switchedCats).toContain("emergency");
  });

  it("should query copilot and add to history", () => {
    const state = executiveService.initialize("ceo");
    const { state: newState, result } = executiveService.queryCopilot(state, "What are the risks?");
    expect(result.answer).toBeTruthy();
    expect(newState.copilotHistory).toHaveLength(2);
    expect(newState.copilotHistory[0].role).toBe("user");
    expect(newState.copilotHistory[1].role).toBe("assistant");
  });

  it("should accumulate copilot history across queries", () => {
    let state = executiveService.initialize("ceo");
    const { state: s1 } = executiveService.queryCopilot(state, "Q1");
    const { state: s2 } = executiveService.queryCopilot(s1, "Q2");
    expect(s2.copilotHistory).toHaveLength(4);
  });

  it("should implement a decision", () => {
    const state = executiveService.initialize("ceo");
    if (state.decisions.length > 0) {
      const id = state.decisions[0].id;
      const updated = executiveService.implementDecision(state, id, "ceo");
      const d = updated.decisions.find((dec) => dec.id === id);
      expect(d!.status).toBe("implemented");
      expect(d!.authorizedBy).toBe("ceo");
    }
  });

  it("should acknowledge an alert", () => {
    const state = executiveService.initialize("ceo");
    if (state.alerts.length > 0) {
      const id = state.alerts[0].id;
      const updated = executiveService.acknowledgeAlert(state, id);
      const a = updated.alerts.find((al) => al.id === id);
      expect(a!.acknowledged).toBe(true);
    }
  });

  it("should generate a board report", () => {
    const state = executiveService.initialize("ceo");
    const withReport = executiveService.generateReport(state);
    expect(withReport.lastReport).toBeTruthy();
    expect(withReport.lastReport!.title).toContain("Executive Board Report");
  });

  it("should keep selected role across refresh", () => {
    const state = executiveService.initialize("maintenance_manager");
    const refreshed = executiveService.refresh(state);
    expect(refreshed.selectedRole).toBe("maintenance_manager");
  });

  it("createState should return empty state", () => {
    const state = createState();
    expect(state.summary).toBeNull();
    expect(state.kpis).toEqual([]);
    expect(state.decisions).toEqual([]);
    expect(state.alerts).toEqual([]);
    expect(state.timeline).toEqual([]);
    expect(state.risks).toEqual([]);
    expect(state.copilotHistory).toEqual([]);
    expect(state.lastReport).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("should generate report with ESG KPIs from state", () => {
    const state = executiveService.initialize("ceo");
    const withReport = executiveService.generateReport(state);
    expect(withReport.lastReport).toBeTruthy();
    expect(withReport.lastReport!.sustainabilityOverview).toBeTruthy();
  });
});
