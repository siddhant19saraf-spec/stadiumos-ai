import type { RiskAssessment, ExecutiveSummary, ModuleSnapshot, ExecutiveRole } from "../types";
import { ALERT_THRESHOLDS } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IRiskEngine {
  assess(summary: ExecutiveSummary, moduleSnapshots: ModuleSnapshot[]): RiskAssessment[];
  getOverallRisk(summary: ExecutiveSummary): { score: number; level: string; trend: string };
  getRiskByCategory(risks: RiskAssessment[], category: string): RiskAssessment[];
}

export class MockRiskEngine implements IRiskEngine {
  assess(summary: ExecutiveSummary, moduleSnapshots: ModuleSnapshot[]): RiskAssessment[] {
    const risks: RiskAssessment[] = [];
    const now = new Date().toISOString();

    if (summary.crowdHealthScore < ALERT_THRESHOLDS.CROWD_HEALTH_MIN) {
      risks.push({
        id: `risk-crowd-${ri(100, 999)}`, category: "crowd_safety", title: "Crowd Congestion Risk",
        description: `Crowd health score of ${summary.crowdHealthScore}% indicates elevated congestion risk in multiple zones.`,
        level: summary.crowdHealthScore < 50 ? "high" : "medium",
        probability: Math.round(100 - summary.crowdHealthScore),
        impact: 75, riskScore: Math.round((100 - summary.crowdHealthScore) * 0.75),
        affectedModules: ["crowd-intelligence", "emergency-response", "tournament-ops"],
        mitigationActions: ["Open additional exit gates", "Deploy crowd control personnel", "Activate real-time density monitoring"],
        owner: "Security Director", status: "active", trend: "worsening", lastUpdated: now,
      });
    }

    if (summary.infrastructureHealth < ALERT_THRESHOLDS.INFRASTRUCTURE_HEALTH_MIN) {
      risks.push({
        id: `risk-infra-${ri(100, 999)}`, category: "infrastructure", title: "Infrastructure Failure Risk",
        description: `Infrastructure health at ${summary.infrastructureHealth}%. Critical systems at risk of cascading failure.`,
        level: summary.infrastructureHealth < 45 ? "critical" : "high",
        probability: Math.round(100 - summary.infrastructureHealth),
        impact: 90, riskScore: Math.round((100 - summary.infrastructureHealth) * 0.9),
        affectedModules: ["predictive-maintenance", "energy", "digital-twin"],
        mitigationActions: ["Deploy maintenance teams proactively", "Activate redundant systems", "Prioritize critical asset repairs"],
        owner: "Maintenance Manager", status: "active", trend: "worsening", lastUpdated: now,
      });
    }

    if (summary.emergencyStatus === "elevated" || summary.emergencyStatus === "critical") {
      risks.push({
        id: `risk-emerg-${ri(100, 999)}`, category: "safety", title: "Active Emergency Incident Risk",
        description: `${summary.activeIncidents} active incidents. Emergency status ${summary.emergencyStatus}. Potential for escalation.`,
        level: summary.emergencyStatus === "critical" ? "critical" : "high",
        probability: Math.min(95, 50 + summary.activeIncidents * 15),
        impact: 95, riskScore: Math.min(95, (50 + summary.activeIncidents * 15) * 0.95),
        affectedModules: ["emergency-response", "crowd-intelligence", "medical"],
        mitigationActions: ["Activate full emergency protocol", "Deploy all available response teams", "Establish incident command post"],
        owner: "Security Director", status: "active", trend: "worsening", lastUpdated: now,
      });
    }

    const unhealthyModules = moduleSnapshots.filter((m) => m.status === "warning" || m.status === "critical");
    if (unhealthyModules.length >= 2) {
      risks.push({
        id: `risk-module-${ri(100, 999)}`, category: "operations", title: "Multi-Module Degradation Risk",
        description: `${unhealthyModules.length} modules in warning/critical state. Increased operational fragility.`,
        level: unhealthyModules.filter((m) => m.status === "critical").length > 0 ? "high" : "medium",
        probability: Math.min(85, 30 + unhealthyModules.length * 10),
        impact: 70,
        riskScore: Math.min(80, (30 + unhealthyModules.length * 10) * 0.7),
        affectedModules: unhealthyModules.map((m) => m.moduleId),
        mitigationActions: ["Assign dedicated monitoring to each affected module", "Activate cross-module contingency plans"],
        owner: "COO", status: "active", trend: "worsening", lastUpdated: now,
      });
    }

    if (summary.executiveRiskScore > ALERT_THRESHOLDS.RISK_SCORE_MAX) {
      risks.push({
        id: `risk-exec-${ri(100, 999)}`, category: "operations", title: "Elevated Executive Risk Score",
        description: `Executive risk score at ${summary.executiveRiskScore}% — exceeding ${ALERT_THRESHOLDS.RISK_SCORE_MAX}% threshold.`,
        level: summary.executiveRiskScore > 60 ? "critical" : "high",
        probability: summary.executiveRiskScore,
        impact: 80,
        riskScore: Math.round(summary.executiveRiskScore * 0.8),
        affectedModules: ["command-center", ...unhealthyModules.map((m) => m.moduleId)],
        mitigationActions: ["Executive briefing required", "Implement risk mitigation plan", "Increase monitoring frequency"],
        owner: "CEO", status: "active", trend: "worsening", lastUpdated: now,
      });
    }

    return risks;
  }

  getOverallRisk(summary: ExecutiveSummary) {
    const score = summary.executiveRiskScore;
    return {
      score,
      level: score >= 60 ? "critical" : score >= 40 ? "high" : score >= 25 ? "medium" : "low",
      trend: score > 45 ? "worsening" : score > 35 ? "stable" : "improving",
    };
  }

  getRiskByCategory(risks: RiskAssessment[], category: string) {
    return risks.filter((r) => r.category === category);
  }
}

export const riskEngine = new MockRiskEngine();

