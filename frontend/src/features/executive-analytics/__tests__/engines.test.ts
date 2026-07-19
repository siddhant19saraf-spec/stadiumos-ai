// @ts-nocheck
import { describe, it, expect } from "vitest";
import { executiveEngine } from "../services/executive-engine";
import { analyticsEngine } from "../services/analytics-engine";
import { decisionEngine } from "../services/decision-engine";
import { riskEngine } from "../services/risk-engine";
import { copilotEngine } from "../services/copilot-engine";
import { reportingEngine } from "../services/reporting-engine";
import { notificationEngine } from "../services/notification-engine";
import { executiveService, createState } from "../services/executive-service";
import { EXECUTIVE_ROLES, ALERT_THRESHOLDS, KPI_CATEGORY_LABELS, MODULE_NAMES } from "../constants";
import type { ExecutiveRole, ExecutiveSummary, ExecutiveKpi, ModuleSnapshot } from "../types";

/* ===================================================================
   Constants
   =================================================================== */
describe("Constants", () => {
  it("should define all 8 executive roles", () => {
    expect(EXECUTIVE_ROLES).toHaveLength(8);
    const roles = EXECUTIVE_ROLES.map((r) => r.role);
    expect(roles).toContain("ceo");
    expect(roles).toContain("coo");
    expect(roles).toContain("tournament_director");
    expect(roles).toContain("security_director");
    expect(roles).toContain("operations_manager");
    expect(roles).toContain("maintenance_manager");
    expect(roles).toContain("energy_manager");
    expect(roles).toContain("medical_coordinator");
  });

  it("should have valid role configs with labels and descriptions", () => {
    for (const role of EXECUTIVE_ROLES) {
      expect(role.label).toBeTruthy();
      expect(role.description).toBeTruthy();
      expect(role.kpiCategories.length).toBeGreaterThan(0);
      expect(role.priorityModules.length).toBeGreaterThan(0);
      expect(role.defaultView).toBe("overview");
    }
  });

  it("should define all alert thresholds", () => {
    expect(ALERT_THRESHOLDS.OPERATIONAL_HEALTH_MIN).toBe(60);
    expect(ALERT_THRESHOLDS.SAFETY_SCORE_MIN).toBe(70);
    expect(ALERT_THRESHOLDS.RISK_SCORE_MAX).toBe(40);
    expect(ALERT_THRESHOLDS.INFRASTRUCTURE_HEALTH_MIN).toBe(55);
    expect(ALERT_THRESHOLDS.CROWD_HEALTH_MIN).toBe(65);
  });

  it("should define KPI category labels for all categories", () => {
    const expected = ["operations", "safety", "crowd", "tournament", "emergency",
      "infrastructure", "parking", "queue", "energy", "sustainability",
      "financial", "satisfaction", "risk"];
    for (const cat of expected) {
      expect(KPI_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it("should define module names for all expected modules", () => {
    const expectedModules = ["command-center", "crowd-intelligence", "emergency-response",
      "smart-parking", "queue-intelligence", "energy", "sustainability",
      "predictive-maintenance", "digital-twin", "fan-experience",
      "staff-allocation", "tournament-ops", "incidents"];
    for (const mod of expectedModules) {
      expect(MODULE_NAMES[mod]).toBeTruthy();
    }
  });
});

/* ===================================================================
   ExecutiveEngine
   =================================================================== */
describe("ExecutiveEngine", () => {
  const roles: ExecutiveRole[] = ["ceo", "coo", "tournament_director", "security_director",
    "operations_manager", "maintenance_manager", "energy_manager", "medical_coordinator"];

  it("should return a valid ExecutiveSummary for each role", () => {
    for (const role of roles) {
      const summary = executiveEngine.getSummary(role);
      expect(summary).toHaveProperty("operationalHealthScore");
      expect(summary).toHaveProperty("safetyScore");
      expect(summary).toHaveProperty("crowdHealthScore");
      expect(summary).toHaveProperty("executiveRiskScore");
      expect(summary.operationalHealthScore).toBeGreaterThanOrEqual(0);
      expect(summary.operationalHealthScore).toBeLessThanOrEqual(100);
      expect(summary.safetyScore).toBeGreaterThanOrEqual(0);
      expect(summary.safetyScore).toBeLessThanOrEqual(100);
      expect(summary.lastUpdated).toBeTruthy();
      expect(["active", "preparing", "standby"]).toContain(summary.matchDayStatus);
      expect(["normal", "elevated", "critical"]).toContain(summary.emergencyStatus);
    }
  });

  it("should produce different summaries on successive calls (non-deterministic)", () => {
    const s1 = executiveEngine.getSummary("ceo");
    const s2 = executiveEngine.getSummary("ceo");
    // At least one value should differ due to random simulation
    const changed = (Object.keys(s1) as (keyof typeof s1)[]).some((k) => s1[k] !== s2[k]);
    expect(changed).toBe(true);
  });

  it("should return module snapshots for all modules", () => {
    const snapshots = executiveEngine.getModuleSnapshots();
    expect(snapshots.length).toBeGreaterThanOrEqual(12);
    for (const snap of snapshots) {
      expect(snap).toHaveProperty("moduleId");
      expect(snap).toHaveProperty("moduleName");
      expect(snap).toHaveProperty("healthScore");
      expect(snap).toHaveProperty("status");
      expect(snap.healthScore).toBeGreaterThanOrEqual(0);
      expect(snap.healthScore).toBeLessThanOrEqual(100);
      expect(["healthy", "warning", "critical", "offline"]).toContain(snap.status);
      expect(snap.kpis.length).toBeGreaterThan(0);
      expect(snap.lastUpdated).toBeTruthy();
    }
  });

  it("should return role-filtered KPI values", () => {
    for (const role of roles) {
      const kpis = executiveEngine.getKpiValues(role);
      expect(kpis.length).toBeGreaterThan(0);
      for (const kpi of kpis) {
        expect(kpi).toHaveProperty("id");
        expect(kpi).toHaveProperty("label");
        expect(kpi).toHaveProperty("value");
        expect(kpi).toHaveProperty("unit");
        expect(kpi).toHaveProperty("category");
        expect(kpi).toHaveProperty("trend");
        expect(kpi).toHaveProperty("status");
        expect(["up", "down", "stable"]).toContain(kpi.trend);
        expect(["critical", "warning", "healthy", "neutral"]).toContain(kpi.status);
      }
    }
  });

  it("should filter different KPI counts by role", () => {
    const ceoKpis = executiveEngine.getKpiValues("ceo");
    const energyKpis = executiveEngine.getKpiValues("energy_manager");
    // CEO should see more categories than energy_manager
    expect(ceoKpis.length).toBeGreaterThanOrEqual(energyKpis.length);
  });
});

/* ===================================================================
   AnalyticsEngine
   =================================================================== */
describe("AnalyticsEngine", () => {
  it("should aggregate KPIs by category", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const aggregated = analyticsEngine.aggregateKpis(summary, kpis);
    expect(aggregated.length).toBeGreaterThan(0);
    for (const item of aggregated) {
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("score");
      expect(item).toHaveProperty("trend");
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(100);
      expect(["improving", "stable", "declining"]).toContain(item.trend);
    }
  });

  it("should return empty aggregation when no KPIs", () => {
    const summary = executiveEngine.getSummary("ceo");
    const result = analyticsEngine.aggregateKpis(summary, []);
    expect(result).toHaveLength(0);
  });

  it("should compute health summary counts", () => {
    const kpis = executiveEngine.getKpiValues("ceo");
    const health = analyticsEngine.computeHealthSummary(kpis);
    expect(health).toHaveProperty("healthy");
    expect(health).toHaveProperty("warning");
    expect(health).toHaveProperty("critical");
    expect(health).toHaveProperty("total");
    expect(health.healthy + health.warning + health.critical).toBe(health.total);
  });

  it("should return financial projection with valid values", () => {
    const proj = analyticsEngine.getFinancialProjection();
    expect(proj).toHaveProperty("revenue");
    expect(proj).toHaveProperty("costs");
    expect(proj).toHaveProperty("profit");
    expect(proj).toHaveProperty("variance");
    expect(proj.revenue).toBeGreaterThan(0);
    expect(proj.costs).toBeGreaterThan(0);
    expect(proj.profit).toBe(proj.revenue - proj.costs);
  });

  it("should return category breakdown for a role", () => {
    const breakdown = analyticsEngine.getCategoryBreakdown("ceo");
    expect(breakdown.length).toBeGreaterThan(0);
    for (const item of breakdown) {
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("value");
      expect(item).toHaveProperty("label");
      expect(item.value).toBeGreaterThanOrEqual(0);
      expect(item.value).toBeLessThanOrEqual(100);
    }
  });
});

/* ===================================================================
   DecisionEngine
   =================================================================== */
describe("DecisionEngine", () => {
  it("should generate decisions based on summary thresholds", () => {
    // Use a low-health summary to trigger many decisions
    const lowSummary: ExecutiveSummary = {
      operationalHealthScore: 45, safetyScore: 50, crowdHealthScore: 50,
      tournamentProgress: 50, emergencyStatus: "critical",
      infrastructureHealth: 40, parkingUtilization: 90,
      queuePerformance: 50, energyEfficiency: 50,
      carbonScore: 50, financialPerformance: 50, visitorSatisfaction: 50,
      executiveRiskScore: 60, activeDecisions: 5, unacknowledgedAlerts: 3,
      criticalAlerts: 2, totalIncidents: 10, activeIncidents: 3,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(lowSummary, snapshots, "ceo");
    expect(decisions.length).toBeGreaterThan(0);
    // Should include emergency protocol (p0) due to critical emergency status
    expect(decisions.some((d) => d.priority === "p0")).toBe(true);
  });

  it("should return fewer decisions for healthy summary", () => {
    const healthySummary: ExecutiveSummary = {
      operationalHealthScore: 85, safetyScore: 88, crowdHealthScore: 82,
      tournamentProgress: 80, emergencyStatus: "normal",
      infrastructureHealth: 78, parkingUtilization: 60,
      queuePerformance: 80, energyEfficiency: 78,
      carbonScore: 75, financialPerformance: 82, visitorSatisfaction: 85,
      executiveRiskScore: 20, activeDecisions: 1, unacknowledgedAlerts: 0,
      criticalAlerts: 0, totalIncidents: 2, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(healthySummary, snapshots, "ceo");
    // Healthy profile should trigger fewer decisions
    expect(decisions.length).toBeLessThanOrEqual(3);
  });

  it("should sort decisions by priority (p0 first)", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    if (decisions.length >= 2) {
      const pm: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
      for (let i = 0; i < decisions.length - 1; i++) {
        expect(pm[decisions[i].priority]).toBeLessThanOrEqual(pm[decisions[i + 1].priority]);
      }
    }
  });

  it("should filter by priority", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const p1 = decisionEngine.getByPriority(decisions, "p1");
    expect(p1.every((d) => d.priority === "p1")).toBe(true);
  });

  it("should filter by status", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const active = decisionEngine.getByStatus(decisions, "active");
    expect(active.every((d) => d.status === "active")).toBe(true);
  });

  it("should implement a decision and update its status", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    if (decisions.length > 0) {
      const targetId = decisions[0].id;
      const updated = decisionEngine.implement(targetId, decisions, "ceo");
      const implemented = updated.find((d) => d.id === targetId);
      expect(implemented?.status).toBe("implemented");
      expect(implemented?.authorizedBy).toBe("ceo");
      expect(implemented?.implementedAt).toBeTruthy();
    }
  });

  it("should limit to 10 decisions max", () => {
    // Force all thresholds to be breached
    const criticalSummary: ExecutiveSummary = {
      operationalHealthScore: 30, safetyScore: 40, crowdHealthScore: 35,
      tournamentProgress: 40, emergencyStatus: "critical",
      infrastructureHealth: 30, parkingUtilization: 95,
      queuePerformance: 35, energyEfficiency: 35,
      carbonScore: 30, financialPerformance: 35, visitorSatisfaction: 35,
      executiveRiskScore: 75, activeDecisions: 10, unacknowledgedAlerts: 5,
      criticalAlerts: 3, totalIncidents: 20, activeIncidents: 5,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(criticalSummary, snapshots, "ceo");
    expect(decisions.length).toBeLessThanOrEqual(10);
  });
});

/* ===================================================================
   RiskEngine
   =================================================================== */
describe("RiskEngine", () => {
  it("should assess risks from summary and module snapshots", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    expect(risks.length).toBeGreaterThanOrEqual(0);
    for (const risk of risks) {
      expect(risk).toHaveProperty("id");
      expect(risk).toHaveProperty("category");
      expect(risk).toHaveProperty("title");
      expect(risk).toHaveProperty("level");
      expect(risk).toHaveProperty("riskScore");
      expect(risk).toHaveProperty("probability");
      expect(risk).toHaveProperty("impact");
      expect(["critical", "high", "medium", "low"]).toContain(risk.level);
      expect(risk.riskScore).toBeGreaterThanOrEqual(0);
      expect(risk.riskScore).toBeLessThanOrEqual(100);
      expect(risk.affectedModules.length).toBeGreaterThan(0);
      expect(risk.mitigationActions.length).toBeGreaterThan(0);
    }
  });

  it("should generate crowd risk when crowd health is low", () => {
    const lowCrowd: ExecutiveSummary = {
      operationalHealthScore: 70, safetyScore: 70, crowdHealthScore: 50,
      tournamentProgress: 70, emergencyStatus: "normal",
      infrastructureHealth: 70, parkingUtilization: 60,
      queuePerformance: 70, energyEfficiency: 70,
      carbonScore: 70, financialPerformance: 70, visitorSatisfaction: 70,
      executiveRiskScore: 30, activeDecisions: 2, unacknowledgedAlerts: 1,
      criticalAlerts: 0, totalIncidents: 3, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(lowCrowd, snapshots);
    expect(risks.some((r) => r.category === "crowd_safety")).toBe(true);
  });

  it("should not generate crowd risk when crowd health is high", () => {
    const highCrowd: ExecutiveSummary = {
      operationalHealthScore: 80, safetyScore: 80, crowdHealthScore: 80,
      tournamentProgress: 80, emergencyStatus: "normal",
      infrastructureHealth: 80, parkingUtilization: 50,
      queuePerformance: 80, energyEfficiency: 80,
      carbonScore: 80, financialPerformance: 80, visitorSatisfaction: 80,
      executiveRiskScore: 20, activeDecisions: 1, unacknowledgedAlerts: 0,
      criticalAlerts: 0, totalIncidents: 1, activeIncidents: 0,
      matchDayStatus: "standby", lastUpdated: new Date().toISOString(),
    };
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(highCrowd, snapshots);
    expect(risks.some((r) => r.category === "crowd_safety")).toBe(false);
  });

  it("should return overall risk score and level", () => {
    const summary = executiveEngine.getSummary("ceo");
    const overall = riskEngine.getOverallRisk(summary);
    expect(overall).toHaveProperty("score");
    expect(overall).toHaveProperty("level");
    expect(overall).toHaveProperty("trend");
    expect(overall.score).toBeGreaterThanOrEqual(0);
    expect(overall.score).toBeLessThanOrEqual(100);
    expect(["critical", "high", "medium", "low"]).toContain(overall.level);
    expect(["improving", "stable", "worsening"]).toContain(overall.trend);
  });

  it("should filter risks by category", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const risks = riskEngine.assess(summary, snapshots);
    const safetyRisks = riskEngine.getRiskByCategory(risks, "safety");
    expect(safetyRisks.every((r) => r.category === "safety")).toBe(true);
  });
});

/* ===================================================================
   CopilotEngine
   =================================================================== */
describe("CopilotEngine", () => {
  it("should answer risk-related queries", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("What are the top risks?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
    expect(result.answer.toLowerCase()).toContain("risk");
    expect(result.confidence).toBeGreaterThan(80);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.relevantKpis).toContain("risk-score");
  });

  it("should answer health/status queries", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("What is the operational health?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
    expect(result.answer).toContain("%");
    expect(result.dataPoints.length).toBeGreaterThan(0);
  });

  it("should answer incident/emergency queries", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("Are there any incidents?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
  });

  it("should answer decision/recommendation queries", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("What decisions need my attention?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("should answer energy/sustainability queries", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("How is our energy efficiency?", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
    expect(result.relevantKpis).toContain("energy-eff");
  });

  it("should provide a general answer for unrecognized queries", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);
    const result = copilotEngine.query("Tell me about the stadium", summary, decisions, risks, kpis, timeline);
    expect(result.answer).toBeTruthy();
    expect(result.answer).toContain("StadiumOS AI");
  });

  it("should return suggested questions", () => {
    const questions = copilotEngine.getSuggestedQuestions();
    expect(questions.length).toBe(6);
    for (const q of questions) {
      expect(typeof q).toBe("string");
      expect(q.length).toBeGreaterThan(5);
    }
  });

  it("should generate an executive briefing", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const briefing = copilotEngine.generateBriefing(summary, decisions, risks);
    expect(briefing).toContain("EXECUTIVE BRIEFING");
    expect(briefing).toContain("OPERATIONAL OVERVIEW");
    expect(briefing).toContain("KEY METRICS");
    expect(briefing).toContain("RISK ASSESSMENT");
  });
});

/* ===================================================================
   ReportingEngine
   =================================================================== */
describe("ReportingEngine", () => {
  it("should generate a complete board report", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    expect(report).toHaveProperty("id");
    expect(report).toHaveProperty("title");
    expect(report).toHaveProperty("period");
    expect(report).toHaveProperty("executiveSummary");
    expect(report).toHaveProperty("operationalOverview");
    expect(report).toHaveProperty("incidentSummary");
    expect(report).toHaveProperty("resourceUtilization");
    expect(report).toHaveProperty("infrastructureHealth");
    expect(report).toHaveProperty("riskAnalysis");
    expect(report).toHaveProperty("financialOverview");
    expect(report).toHaveProperty("sustainabilityOverview");
    expect(report).toHaveProperty("topRecommendations");
    expect(report).toHaveProperty("strategicRoadmap");
    expect(report).toHaveProperty("forecastSummary");
    expect(report).toHaveProperty("kpiScorecards");
    expect(report.title).toContain("Executive Board Report");
    expect(report.generatedAt).toBeTruthy();
  });

  it("should include KPI scorecards grouped by category", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    expect(report.kpiScorecards.length).toBeGreaterThan(0);
    for (const sc of report.kpiScorecards) {
      expect(sc).toHaveProperty("category");
      expect(sc).toHaveProperty("kpis");
      expect(sc.kpis.length).toBeGreaterThan(0);
    }
  });

  it("should include top recommendations from decisions", () => {
    const summary = executiveEngine.getSummary("ceo");
    const kpis = executiveEngine.getKpiValues("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const report = reportingEngine.generateBoardReport(summary, kpis, decisions, []);
    expect(report.topRecommendations.length).toBeLessThanOrEqual(5);
    if (decisions.length > 0) {
      expect(report.topRecommendations.length).toBeGreaterThan(0);
    }
  });

  it("should return report history", () => {
    const history = reportingEngine.getReportHistory();
    expect(history.length).toBe(6);
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
   NotificationEngine
   =================================================================== */
describe("NotificationEngine", () => {
  it("should generate alerts based on summary thresholds", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const risks = riskEngine.assess(summary, snapshots);
    const alerts = notificationEngine.generateAlerts(summary, decisions, risks);
    for (const alert of alerts) {
      expect(alert).toHaveProperty("id");
      expect(alert).toHaveProperty("title");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("category");
      expect(alert).toHaveProperty("sourceModule");
      expect(["critical", "severe", "high", "medium", "low"]).toContain(alert.severity);
      expect(alert.acknowledged).toBe(false);
      expect(alert.aiSuggestion).toBeTruthy();
    }
  });

  it("should generate critical alert for critical emergency", () => {
    const criticalSummary: ExecutiveSummary = {
      operationalHealthScore: 40, safetyScore: 40, crowdHealthScore: 40,
      tournamentProgress: 40, emergencyStatus: "critical",
      infrastructureHealth: 40, parkingUtilization: 60,
      queuePerformance: 40, energyEfficiency: 40,
      carbonScore: 40, financialPerformance: 40, visitorSatisfaction: 40,
      executiveRiskScore: 70, activeDecisions: 5, unacknowledgedAlerts: 3,
      criticalAlerts: 2, totalIncidents: 10, activeIncidents: 3,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const alerts = notificationEngine.generateAlerts(criticalSummary, [], []);
    expect(alerts.some((a) => a.severity === "critical")).toBe(true);
  });

  it("should generate timeline events with 7 days of history plus decisions", () => {
    const summary = executiveEngine.getSummary("ceo");
    const snapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, snapshots, "ceo");
    const events = notificationEngine.generateTimelineEvents(summary, decisions);
    expect(events.length).toBeGreaterThanOrEqual(3);
    for (const event of events) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("timestamp");
      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("severity");
      expect(["incident", "operation", "maintenance", "ai_recommendation", "executive_decision", "milestone"]).toContain(event.type);
      expect(["positive", "info", "warning", "critical"]).toContain(event.severity);
    }
  });

  it("should acknowledge an alert", () => {
    const summary: ExecutiveSummary = {
      operationalHealthScore: 30, safetyScore: 30, crowdHealthScore: 30,
      tournamentProgress: 30, emergencyStatus: "critical",
      infrastructureHealth: 30, parkingUtilization: 60,
      queuePerformance: 30, energyEfficiency: 30,
      carbonScore: 30, financialPerformance: 30, visitorSatisfaction: 30,
      executiveRiskScore: 80, activeDecisions: 5, unacknowledgedAlerts: 5,
      criticalAlerts: 3, totalIncidents: 15, activeIncidents: 4,
      matchDayStatus: "active", lastUpdated: new Date().toISOString(),
    };
    const alerts = notificationEngine.generateAlerts(summary, [], []);
    if (alerts.length > 0) {
      const targetId = alerts[0].id;
      const updated = notificationEngine.acknowledge(targetId, alerts);
      const acked = updated.find((a) => a.id === targetId);
      expect(acked?.acknowledged).toBe(true);
      expect(acked?.acknowledgedAt).toBeTruthy();
    }
  });

  it("should filter unacknowledged alerts", () => {
    const summary = executiveEngine.getSummary("ceo");
    const alerts = notificationEngine.generateAlerts(summary, [], []);
    const unacked = notificationEngine.getUnacknowledged(alerts);
    expect(unacked.every((a) => !a.acknowledged)).toBe(true);
  });

  it("should filter alerts by severity", () => {
    const summary = executiveEngine.getSummary("ceo");
    const alerts = notificationEngine.generateAlerts(summary, [], []);
    const critical = notificationEngine.getBySeverity(alerts, "critical");
    expect(critical.every((a) => a.severity === "critical")).toBe(true);
  });
});

/* ===================================================================
   ExecutiveService (Orchestrator)
   =================================================================== */
describe("ExecutiveService", () => {
  it("should initialize state with a given role", () => {
    const state = executiveService.initialize("coo");
    expect(state).toHaveProperty("summary");
    expect(state).toHaveProperty("kpis");
    expect(state).toHaveProperty("decisions");
    expect(state).toHaveProperty("alerts");
    expect(state).toHaveProperty("timeline");
    expect(state).toHaveProperty("risks");
    expect(state).toHaveProperty("moduleSnapshots");
    expect(state).toHaveProperty("selectedRole", "coo");
    expect(state.kpis.length).toBeGreaterThan(0);
    expect(state.moduleSnapshots.length).toBeGreaterThan(0);
    expect(state.lastUpdated).toBeTruthy();
  });

  it("should default to CEO role", () => {
    const state = executiveService.initialize();
    expect(state.selectedRole).toBe("ceo");
  });

  it("should create a fresh initial state", () => {
    const state = createState();
    expect(state.summary).toBeNull();
    expect(state.kpis).toEqual([]);
    expect(state.decisions).toEqual([]);
    expect(state.alerts).toEqual([]);
    expect(state.timeline).toEqual([]);
    expect(state.risks).toEqual([]);
    expect(state.moduleSnapshots).toEqual([]);
    expect(state.copilotHistory).toEqual([]);
    expect(state.lastReport).toBeNull();
    expect(state.selectedRole).toBe("ceo");
    expect(state.loading).toBe(false);
  });

  it("should refresh state with updated data", () => {
    const state = executiveService.initialize("ceo");
    const refreshed = executiveService.refresh(state);
    expect(refreshed.summary).toBeTruthy();
    expect(refreshed.kpis.length).toBeGreaterThan(0);
    expect(refreshed.lastUpdated).toBeTruthy();
  });

  it("should switch roles and reinitialize", () => {
    const state = executiveService.initialize("ceo");
    const switched = executiveService.switchRole(state, "energy_manager");
    expect(switched.selectedRole).toBe("energy_manager");
  });

  it("should process a copilot query and return result with history", () => {
    const state = executiveService.initialize("ceo");
    const { state: newState, result } = executiveService.queryCopilot(state, "What is the risk level?");
    expect(result).toHaveProperty("answer");
    expect(result).toHaveProperty("confidence");
    expect(newState.copilotHistory.length).toBe(2);
    expect(newState.copilotHistory[0].role).toBe("user");
    expect(newState.copilotHistory[1].role).toBe("assistant");
  });

  it("should implement a decision", () => {
    const state = executiveService.initialize("ceo");
    if (state.decisions.length > 0) {
      const targetId = state.decisions[0].id;
      const updated = executiveService.implementDecision(state, targetId, "ceo");
      const decision = updated.decisions.find((d) => d.id === targetId);
      expect(decision?.status).toBe("implemented");
    }
  });

  it("should acknowledge an alert", () => {
    const state = executiveService.initialize("ceo");
    if (state.alerts.length > 0) {
      const targetId = state.alerts[0].id;
      const updated = executiveService.acknowledgeAlert(state, targetId);
      const alert = updated.alerts.find((a) => a.id === targetId);
      expect(alert?.acknowledged).toBe(true);
    }
  });

  it("should generate a board report", () => {
    const state = executiveService.initialize("ceo");
    const withReport = executiveService.generateReport(state);
    expect(withReport.lastReport).toBeTruthy();
    expect(withReport.lastReport?.title).toContain("Executive Board Report");
  });
});

