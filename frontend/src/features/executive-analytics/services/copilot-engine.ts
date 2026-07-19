import type { CopilotQueryResult, ExecutiveSummary, DecisionRecommendation, RiskAssessment, ExecutiveKpi, TimelineEvent } from "../types";
import { KPI_CATEGORY_LABELS } from "../constants";

export interface ICopilotEngine {
  query(question: string, summary: ExecutiveSummary, decisions: DecisionRecommendation[], risks: RiskAssessment[], kpis: ExecutiveKpi[], timeline: TimelineEvent[]): CopilotQueryResult;
  getSuggestedQuestions(): string[];
  generateBriefing(summary: ExecutiveSummary, decisions: DecisionRecommendation[], risks: RiskAssessment[]): string;
}

export class MockCopilotEngine implements ICopilotEngine {
  query(question: string, summary: ExecutiveSummary, decisions: DecisionRecommendation[], risks: RiskAssessment[], kpis: ExecutiveKpi[], _timeline: TimelineEvent[]): CopilotQueryResult {
    const q = question.toLowerCase();
    let answer = "";
    const relevantKpis: string[] = [];
    const dataPoints: { label: string; value: string }[] = [];

    if (q.includes("risk") || q.includes("threat") || q.includes("danger")) {
      const topRisks = risks.slice(0, 3);
      answer = `Based on current operational data, the top risks are:\n\n${topRisks.map((r) => `• ${r.title} (${r.level} risk, score: ${r.riskScore}) — ${r.description.substring(0, 100)}`).join("\n")}\n\nOverall risk score: ${summary.executiveRiskScore}%. The highest priority concern is ${topRisks[0]?.title ?? "none"}.`;
      relevantKpis.push("risk-score");
      dataPoints.push({ label: "Executive Risk Score", value: `${summary.executiveRiskScore}%` });
      risks.forEach((r) => dataPoints.push({ label: r.title, value: `${r.riskScore} (${r.level})` }));
    } else if (q.includes("health") || q.includes("status") || q.includes("overview")) {
      answer = `Stadium operations health summary:\n\n• Operational Health: ${summary.operationalHealthScore}% (${summary.operationalHealthScore >= 60 ? "meets threshold" : "below threshold"})\n• Safety Score: ${summary.safetyScore}%\n• Infrastructure Health: ${summary.infrastructureHealth}%\n• Crowd Health: ${summary.crowdHealthScore}%\n• Energy Efficiency: ${summary.energyEfficiency}%\n\nThere are ${summary.activeDecisions} active decisions requiring attention. Match day status: ${summary.matchDayStatus}.`;
      relevantKpis.push("op-health", "safety-score", "infra-health");
      dataPoints.push({ label: "Operational Health", value: `${summary.operationalHealthScore}%` });
      dataPoints.push({ label: "Safety Score", value: `${summary.safetyScore}%` });
      dataPoints.push({ label: "Emergency Status", value: summary.emergencyStatus });
    } else if (q.includes("incident") || q.includes("emergency")) {
      answer = `Emergency status: ${summary.emergencyStatus.toUpperCase()}. There are ${summary.activeIncidents} active incidents out of ${summary.totalIncidents} total. ${summary.criticalAlerts > 0 ? `${summary.criticalAlerts} critical alerts require immediate executive attention.` : "No critical alerts at this time."} ${summary.emergencyStatus === "critical" ? "⚠️ Recommend immediate executive review and potential protocol activation." : ""}`;
      relevantKpis.push("safety-score", "risk-score");
      dataPoints.push({ label: "Active Incidents", value: `${summary.activeIncidents}` });
      dataPoints.push({ label: "Emergency Status", value: summary.emergencyStatus });
    } else if (q.includes("decision") || q.includes("recommend") || q.includes("action")) {
      const topDecisions = decisions.slice(0, 3);
      answer = `Top AI-generated decisions requiring attention:\n\n${topDecisions.map((d) => `• ${d.title} (priority: ${d.priority}, confidence: ${d.confidence}%) — ${d.description.substring(0, 80)}`).join("\n")}\n\n${decisions[0]?.requiresAuthorization ? `\n⚠️ "${decisions[0]!.title}" requires executive authorization.` : ""}`;
      relevantKpis.push(...decisions.slice(0, 3).map(() => "op-health"));
      decisions.slice(0, 3).forEach((d) => dataPoints.push({ label: d.title, value: `P${d.priority} · ${d.confidence}% confidence` }));
    } else if (q.includes("energy") || q.includes("sustainability") || q.includes("carbon")) {
      answer = `Energy & Sustainability overview:\n• Energy Efficiency: ${summary.energyEfficiency}%\n• Carbon Score: ${summary.carbonScore}%\n• Overall health: ${summary.operationalHealthScore >= 65 ? "Meeting sustainability targets" : "Below sustainability targets"}\n\nRecommendation: ${summary.energyEfficiency < 65 ? "Energy optimization is recommended — consider load shifting and HVAC scheduling." : "Energy performance is on track."}`;
      relevantKpis.push("energy-eff", "carbon-score");
      dataPoints.push({ label: "Energy Efficiency", value: `${summary.energyEfficiency}%` });
      dataPoints.push({ label: "Carbon Score", value: `${summary.carbonScore}%` });
    } else {
      answer = `Here is the current executive summary for StadiumOS AI:\n\n• Overall Operational Health: ${summary.operationalHealthScore}%\n• Safety: ${summary.safetyScore}%\n• Infrastructure: ${summary.infrastructureHealth}%\n• Emergency Status: ${summary.emergencyStatus}\n• Match Day: ${summary.matchDayStatus}\n\nThere are ${summary.activeDecisions} active decisions and ${summary.unacknowledgedAlerts} unacknowledged alerts. ${summary.criticalAlerts > 0 ? `${summary.criticalAlerts} require immediate attention.` : "Operations are within normal parameters."}`;
      relevantKpis.push("op-health", "safety-score", "risk-score");
      dataPoints.push({ label: "Operational Health", value: `${summary.operationalHealthScore}%` });
      dataPoints.push({ label: "Emergency Status", value: summary.emergencyStatus });
    }

    return {
      answer,
      confidence: Math.round(82 + Math.random() * 15),
      sources: ["Executive Dashboard", "Real-time Operations Data", "AI Analytics Engine"],
      recommendations: decisions.slice(0, 3).map((d) => ({ title: d.title, confidence: d.confidence, priority: d.priority })),
      relevantKpis,
      dataPoints,
      riskFlags: risks.filter((r) => r.level === "critical" || r.level === "high").map((r) => r.title),
    };
  }

  getSuggestedQuestions(): string[] {
    return [
      "What is the current operational health status?",
      "Show me active risks and threats",
      "Summarize recent incidents and emergency status",
      "What decisions require my attention?",
      "How is energy and sustainability performing?",
      "Generate a briefing for the board",
    ];
  }

  generateBriefing(summary: ExecutiveSummary, decisions: DecisionRecommendation[], risks: RiskAssessment[]): string {
    const topDec = decisions.slice(0, 3);
    const topRisk = risks.slice(0, 3);
    return `EXECUTIVE BRIEFING — ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n` +
      `OPERATIONAL OVERVIEW\nStadium operating at ${summary.operationalHealthScore}% operational health. ${summary.matchDayStatus === "active" ? "Match day protocols are active." : "Facility is in standby mode."} Safety score: ${summary.safetyScore}%. Emergency status: ${summary.emergencyStatus}.\n\n` +
      `KEY METRICS\n• Infrastructure Health: ${summary.infrastructureHealth}%\n• Energy Efficiency: ${summary.energyEfficiency}%\n• Crowd Health: ${summary.crowdHealthScore}%\n• Visitor Satisfaction: ${summary.visitorSatisfaction}%\n• Executive Risk Score: ${summary.executiveRiskScore}%\n\n` +
      `TOP DECISIONS\n${topDec.map((d, i) => `${i + 1}. ${d.title} (Priority: ${d.priority}, Confidence: ${d.confidence}%)`).join("\n")}\n\n` +
      `RISK ASSESSMENT\n${topRisk.map((r, i) => `${i + 1}. ${r.title} — ${r.level} risk (Score: ${r.riskScore})`).join("\n")}\n\n` +
      `SUMMARY\n${summary.criticalAlerts > 0 ? `⚠️ ${summary.criticalAlerts} critical alerts require immediate executive attention.` : "Operations are proceeding within normal parameters."} ${summary.activeDecisions} active decisions. ${summary.activeIncidents} active incidents.`;
  }
}

export const copilotEngine = new MockCopilotEngine();
