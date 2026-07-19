// @ts-nocheck
import type { ExecutiveAlert, TimelineEvent, ExecutiveSummary, DecisionRecommendation, RiskAssessment } from "../types";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

export interface INotificationEngine {
  generateAlerts(summary: ExecutiveSummary, decisions: DecisionRecommendation[], risks: RiskAssessment[]): ExecutiveAlert[];
  generateTimelineEvents(summary: ExecutiveSummary, decisions: DecisionRecommendation[]): TimelineEvent[];
  acknowledge(alertId: string, alerts: ExecutiveAlert[]): ExecutiveAlert[];
  getUnacknowledged(alerts: ExecutiveAlert[]): ExecutiveAlert[];
  getBySeverity(alerts: ExecutiveAlert[], severity: string): ExecutiveAlert[];
}

export class MockNotificationEngine implements INotificationEngine {
  generateAlerts(summary: ExecutiveSummary, decisions: DecisionRecommendation[], risks: RiskAssessment[]): ExecutiveAlert[] {
    const alerts: ExecutiveAlert[] = [];
    const now = new Date().toISOString();

    if (summary.emergencyStatus === "critical") {
      alerts.push({
        id: uid("alert"), title: "Critical Emergency Situation Detected",
        message: `${summary.activeIncidents} active incidents. Emergency status CRITICAL. Executive protocol activation recommended.`,
        severity: "critical", category: "critical_incident", sourceModule: "emergency-response",
        involvesModules: ["emergency-response", "crowd-intelligence", "medical"],
        timestamp: now, acknowledged: false, acknowledgedAt: null,
        requiresExecutiveAction: true,
        aiSuggestion: "Activate full emergency protocol. Deploy all available response teams. Consider partial evacuation.",
        escalationLevel: "executive",
      });
    }

    if (summary.infrastructureHealth < 50) {
      alerts.push({
        id: uid("alert"), title: "Infrastructure Health Critical",
        message: `Infrastructure health score ${summary.infrastructureHealth}%. Multiple systems below operational thresholds.`,
        severity: "severe", category: "infrastructure_failure", sourceModule: "predictive-maintenance",
        involvesModules: ["predictive-maintenance", "energy", "digital-twin"],
        timestamp: now, acknowledged: false, acknowledgedAt: null,
        requiresExecutiveAction: true,
        aiSuggestion: "Deploy maintenance teams immediately. Activate redundant systems for critical assets.",
        escalationLevel: "executive",
      });
    }

    if (summary.crowdHealthScore < 55) {
      alerts.push({
        id: uid("alert"), title: "Crowd Health Threshold Breached",
        message: `Crowd health score ${summary.crowdHealthScore}%. Multiple zones at elevated density risk.`,
        severity: "high", category: "crowd_safety", sourceModule: "crowd-intelligence",
        involvesModules: ["crowd-intelligence", "emergency-response", "tournament-ops"],
        timestamp: now, acknowledged: false, acknowledgedAt: null,
        requiresExecutiveAction: false,
        aiSuggestion: "Open additional exit gates. Increase security presence in affected zones. Monitor density trends.",
        escalationLevel: "elevated",
      });
    }

    if (summary.energyEfficiency < 55) {
      alerts.push({
        id: uid("alert"), title: "Energy Efficiency Below Threshold",
        message: `Energy efficiency at ${summary.energyEfficiency}%. Peak demand charges projected to exceed budget.`,
        severity: "medium", category: "esg_risk", sourceModule: "sustainability",
        involvesModules: ["sustainability", "energy", "digital-twin"],
        timestamp: now, acknowledged: false, acknowledgedAt: null,
        requiresExecutiveAction: false,
        aiSuggestion: "Implement demand-side management. Shift non-critical loads to off-peak hours.",
        escalationLevel: "normal",
      });
    }

    if (summary.executiveRiskScore > 50) {
      alerts.push({
        id: uid("alert"), title: "Elevated Executive Risk Score",
        message: `Executive risk score ${summary.executiveRiskScore}%. Multiple risk factors require executive attention.`,
        severity: "high", category: "high_risk", sourceModule: "command-center",
        involvesModules: ["command-center", ...risks.slice(0, 2).flatMap((r) => r.affectedModules)],
        timestamp: now, acknowledged: false, acknowledgedAt: null,
        requiresExecutiveAction: true,
        aiSuggestion: "Executive briefing recommended. Review top risks and activate mitigation plans.",
        escalationLevel: "executive",
      });
    }

    const authDecisions = decisions.filter((d) => d.requiresAuthorization && d.status === "active");
    for (const dec of authDecisions) {
      alerts.push({
        id: uid("alert"), title: `Authorization Required: ${dec.title}`,
        message: `${dec.title} requires executive authorization. Estimated cost impact: $${dec.estimatedCostImpact.toLocaleString()}. Risk assessment: ${dec.riskAssessment}`,
        severity: "high", category: "high_risk", sourceModule: dec.sourceModule,
        involvesModules: [dec.sourceModule, "command-center"],
        timestamp: now, acknowledged: false, acknowledgedAt: null,
        requiresExecutiveAction: true,
        aiSuggestion: dec.description.substring(0, 120),
        escalationLevel: "executive",
      });
    }

    return alerts;
  }

  generateTimelineEvents(summary: ExecutiveSummary, decisions: DecisionRecommendation[]): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const now = new Date();
    const dayMs = 86400000;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const isMatchDay = Math.random() > 0.6;

      if (isMatchDay) {
        events.push({
          id: uid("event"), timestamp: new Date(d.getTime() + 7 * 3600000).toISOString(),
          type: "operation", title: "Match Day Operations Active",
          description: "Full stadium operations protocol activated for scheduled event.",
          severity: "positive", category: "operations", module: "tournament-ops",
          acknowledged: true,
        });
      }

      if (Math.random() > 0.7) {
        events.push({
          id: uid("event"), timestamp: new Date(d.getTime() + 10 * 3600000).toISOString(),
          type: "incident", title: "Minor Incident Reported",
          description: "Small medical incident resolved. No escalation required.",
          severity: "info", category: "safety", module: "emergency-response",
          acknowledged: true,
        });
      }
    }

    for (const dec of decisions.slice(0, 3)) {
      events.push({
        id: uid("event"), timestamp: dec.createdAt,
        type: "ai_recommendation", title: `AI Decision: ${dec.title}`,
        description: `Confidence: ${dec.confidence}%. Priority: ${dec.priority}. ${dec.description.substring(0, 100)}`,
        severity: dec.priority === "p0" ? "critical" : dec.priority === "p1" ? "warning" : "info",
        category: dec.category, module: dec.sourceModule,
        associatedDecisionId: dec.id,
        acknowledged: false,
      });
    }

    if (summary.emergencyStatus === "critical" || summary.emergencyStatus === "elevated") {
      events.push({
        id: uid("event"), timestamp: new Date().toISOString(),
        type: "incident", title: `Emergency Status: ${summary.emergencyStatus.toUpperCase()}`,
        description: `${summary.activeIncidents} active incidents requiring coordinated response.`,
        severity: "critical", category: "safety", module: "emergency-response",
        acknowledged: false,
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  acknowledge(alertId: string, alerts: ExecutiveAlert[]) {
    return alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a,
    );
  }

  getUnacknowledged(alerts: ExecutiveAlert[]) {
    return alerts.filter((a) => !a.acknowledged);
  }

  getBySeverity(alerts: ExecutiveAlert[], severity: string) {
    return alerts.filter((a) => a.severity === severity);
  }
}

export const notificationEngine = new MockNotificationEngine();

