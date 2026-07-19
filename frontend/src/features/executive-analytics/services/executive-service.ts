import type { ExecutiveAnalyticsData, ExecutiveRole, CopilotMessage, CopilotQueryResult } from "../types";
import { executiveEngine } from "./executive-engine";
import { decisionEngine } from "./decision-engine";
import { riskEngine } from "./risk-engine";
import { copilotEngine } from "./copilot-engine";
import { reportingEngine } from "./reporting-engine";
import { notificationEngine } from "./notification-engine";

export function createState(): ExecutiveAnalyticsData {
  return {
    summary: null,
    kpis: [],
    decisions: [],
    alerts: [],
    timeline: [],
    risks: [],
    moduleSnapshots: [],
    copilotHistory: [],
    lastReport: null,
    selectedRole: "ceo",
    loading: false,
    lastUpdated: null,
  };
}

export interface IExecutiveService {
  initialize(role?: ExecutiveRole): ExecutiveAnalyticsData;
  refresh(state: ExecutiveAnalyticsData): ExecutiveAnalyticsData;
  switchRole(state: ExecutiveAnalyticsData, role: ExecutiveRole): ExecutiveAnalyticsData;
  queryCopilot(state: ExecutiveAnalyticsData, question: string): { state: ExecutiveAnalyticsData; result: CopilotQueryResult };
  implementDecision(state: ExecutiveAnalyticsData, decisionId: string, authorizedBy: string): ExecutiveAnalyticsData;
  acknowledgeAlert(state: ExecutiveAnalyticsData, alertId: string): ExecutiveAnalyticsData;
  generateReport(state: ExecutiveAnalyticsData): ExecutiveAnalyticsData;
}

export const executiveService: IExecutiveService = {
  initialize(role: ExecutiveRole = "ceo"): ExecutiveAnalyticsData {
    const summary = executiveEngine.getSummary(role);
    const kpis = executiveEngine.getKpiValues(role);
    const moduleSnapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, moduleSnapshots, role);
    const risks = riskEngine.assess(summary, moduleSnapshots);
    const alerts = notificationEngine.generateAlerts(summary, decisions, risks);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);

    return {
      summary,
      kpis,
      decisions,
      alerts,
      timeline,
      risks,
      moduleSnapshots,
      copilotHistory: [],
      lastReport: null,
      selectedRole: role,
      loading: false,
      lastUpdated: new Date().toISOString(),
    };
  },

  refresh(state: ExecutiveAnalyticsData): ExecutiveAnalyticsData {
    const summary = executiveEngine.getSummary(state.selectedRole);
    const kpis = executiveEngine.getKpiValues(state.selectedRole);
    const moduleSnapshots = executiveEngine.getModuleSnapshots();
    const decisions = decisionEngine.generate(summary, moduleSnapshots, state.selectedRole);
    const risks = riskEngine.assess(summary, moduleSnapshots);
    const alerts = notificationEngine.generateAlerts(summary, decisions, risks);
    const timeline = notificationEngine.generateTimelineEvents(summary, decisions);

    return {
      ...state,
      summary,
      kpis,
      decisions,
      alerts,
      timeline,
      risks,
      moduleSnapshots,
      loading: false,
      lastUpdated: new Date().toISOString(),
    };
  },

  switchRole(state: ExecutiveAnalyticsData, role: ExecutiveRole): ExecutiveAnalyticsData {
    return this.initialize(role);
  },

  queryCopilot(state: ExecutiveAnalyticsData, question: string) {
    const result = copilotEngine.query(question, state.summary, state.decisions, state.risks, state.kpis, state.timeline);
    const userMsg: CopilotMessage = {
      id: `msg-${Date.now().toString(36)}-user`,
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    const assistantMsg: CopilotMessage = {
      id: `msg-${Date.now().toString(36)}-assistant`,
      role: "assistant",
      content: result.answer,
      timestamp: new Date().toISOString(),
      confidence: result.confidence,
      sources: result.sources,
      recommendations: result.recommendations,
    };
    return {
      state: { ...state, copilotHistory: [...state.copilotHistory, userMsg, assistantMsg] },
      result,
    };
  },

  implementDecision(state: ExecutiveAnalyticsData, decisionId: string, authorizedBy: string): ExecutiveAnalyticsData {
    const decisions = decisionEngine.implement(decisionId, state.decisions, authorizedBy);
    return { ...state, decisions };
  },

  acknowledgeAlert(state: ExecutiveAnalyticsData, alertId: string): ExecutiveAnalyticsData {
    const alerts = notificationEngine.acknowledge(alertId, state.alerts);
    return { ...state, alerts };
  },

  generateReport(state: ExecutiveAnalyticsData): ExecutiveAnalyticsData {
    const esgKpis = (state.kpis.length > 0 ? state.kpis.map((k) => ({
      category: k.category,
      metric: k.label,
      value: k.value,
      target: k.target ?? 80,
      unit: k.unit,
      status: k.value >= 70 ? "on_track" : k.value >= 50 ? "at_risk" : "behind",
      trend: k.trend === "up" ? "improving" : k.trend === "down" ? "declining" : "stable",
    })) : []);
    const report = reportingEngine.generateBoardReport(state.summary, state.kpis, state.decisions, esgKpis);
    return { ...state, lastReport: report };
  },
};

