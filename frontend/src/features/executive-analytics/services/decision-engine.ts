import type { DecisionRecommendation, ExecutiveSummary, ExecutiveRole, ModuleSnapshot } from "../types";
import { ALERT_THRESHOLDS } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IDecisionEngine {
  generate(summary: ExecutiveSummary, moduleSnapshots: ModuleSnapshot[], role: ExecutiveRole): DecisionRecommendation[];
  getByPriority(decisions: DecisionRecommendation[], priority: string): DecisionRecommendation[];
  getByStatus(decisions: DecisionRecommendation[], status: string): DecisionRecommendation[];
  implement(decisionId: string, decisions: DecisionRecommendation[], authorizedBy: string): DecisionRecommendation[];
}

export class MockDecisionEngine implements IDecisionEngine {
  generate(summary: ExecutiveSummary, moduleSnapshots: ModuleSnapshot[], role: ExecutiveRole): DecisionRecommendation[] {
    const decisions: DecisionRecommendation[] = [];
    const now = new Date().toISOString();

    if (summary.crowdHealthScore < ALERT_THRESHOLDS.CROWD_HEALTH_MIN) {
      decisions.push(this.makeDecision({
        title: "Increase Security Deployment in High-Density Zones",
        description: `Crowd health score ${summary.crowdHealthScore}% indicates elevated congestion risk. Recommend deploying additional security personnel to north and south stands.`,
        category: "security", priority: "p1", sourceModule: "crowd-intelligence",
        reasoning: [`Crowd density exceeding safe thresholds in 3 zones`, `Historical data shows congestion peaks 45min before events`],
        evidence: [`Current crowd health: ${summary.crowdHealthScore}%`, `Zone density reports indicate 85% capacity in stands`],
        businessImpact: "Prevents crowd-related incidents and potential liability",
        operationalImpact: "Requires 8 additional security personnel for 4 hours",
        riskAssessment: "Medium risk — moderate staff augmentation required",
        alternatives: ["Open additional exit gates", "Implement staggered entry", "Deploy drone surveillance"],
        costImpact: 2400, timeImpact: "Immediate deployment within 15 minutes",
        auth: false,
      }));
    }

    if (summary.infrastructureHealth < ALERT_THRESHOLDS.INFRASTRUCTURE_HEALTH_MIN) {
      decisions.push(this.makeDecision({
        title: "Activate Infrastructure Maintenance Protocol",
        description: `Infrastructure health at ${summary.infrastructureHealth}%. Multiple systems showing degradation. Recommend proactive maintenance deployment.`,
        category: "maintenance", priority: "p1", sourceModule: "predictive-maintenance",
        reasoning: [`Infrastructure score below 55% threshold`, `Predictive models indicate 70% failure probability within 48 hours`],
        evidence: [`Infrastructure health: ${summary.infrastructureHealth}%`, `3 assets flagged for critical maintenance`],
        businessImpact: "Prevents unplanned downtime and emergency repair costs",
        operationalImpact: "Maintenance team deployment across 4 zones, estimated 6 hours",
        riskAssessment: "High risk if not addressed — potential for cascading failures",
        alternatives: ["Prioritize critical assets only", "Defer non-essential maintenance", "Engage external contractors"],
        costImpact: 8500, timeImpact: "Begin within 2 hours",
        auth: false,
      }));
    }

    if (summary.energyEfficiency < ALERT_THRESHOLDS.ENERGY_EFFICIENCY_MIN) {
      decisions.push(this.makeDecision({
        title: "Optimize Energy Consumption Across Facility",
        description: `Energy efficiency at ${summary.energyEfficiency}%. Implement demand-side management and load shedding for non-critical systems.`,
        category: "energy", priority: "p2", sourceModule: "sustainability",
        reasoning: [`Energy efficiency below 65% target`, `Peak demand charges projected to exceed budget by 18%`],
        evidence: [`Current efficiency: ${summary.energyEfficiency}%`, `HVAC systems consuming 40% above optimal`],
        businessImpact: "Reduces energy costs by estimated $3,500/month",
        operationalImpact: "Non-critical lighting dimming, HVAC setpoint adjustment",
        riskAssessment: "Low risk — automated controls available for most systems",
        alternatives: ["Shift load to off-peak hours", "Increase solar utilization", "Deploy battery storage"],
        costImpact: 500, timeImpact: "Implementation within 1 hour",
        auth: false,
      }));
    }

    if (summary.emergencyStatus === "critical" || summary.emergencyStatus === "elevated") {
      decisions.push(this.makeDecision({
        title: "Activate Emergency Response Protocol",
        description: `${summary.activeIncidents} active incidents detected. Emergency status elevated. Recommend full protocol activation.`,
        category: "emergency", priority: "p0", sourceModule: "emergency-response",
        reasoning: [`${summary.activeIncidents} active critical incidents`, `Emergency status: ${summary.emergencyStatus}`],
        evidence: [`Active incidents: ${summary.activeIncidents}`, `Executive risk score: ${summary.executiveRiskScore}%`],
        businessImpact: "Minimizes safety risk and potential litigation exposure",
        operationalImpact: "Full emergency response team deployment, potential event delay",
        riskAssessment: "Critical — requires immediate executive authorization",
        alternatives: ["Partial area evacuation", "Increased monitoring only", "Standby protocol"],
        costImpact: 15000, timeImpact: "Activation within 5 minutes",
        auth: true,
      }));
    }

    if (summary.parkingUtilization > ALERT_THRESHOLDS.PARKING_UTILIZATION_MAX) {
      decisions.push(this.makeDecision({
        title: "Redirect Parking Traffic to Overflow Lots",
        description: `Parking utilization at ${summary.parkingUtilization}%. Redirect incoming traffic to overflow lots to prevent congestion.`,
        category: "parking", priority: "p2", sourceModule: "smart-parking",
        reasoning: [`Parking at ${summary.parkingUtilization}% capacity`, `Overflow lots at 45% capacity - available`],
        evidence: [`Current utilization: ${summary.parkingUtilization}%`, `Overflow capacity: 1,200 spaces`],
        businessImpact: "Reduces entry wait times by estimated 15-20 minutes",
        operationalImpact: "Deploy 4 traffic controllers to redirect points",
        riskAssessment: "Low risk — overflow infrastructure operational",
        alternatives: ["Implement dynamic pricing for remaining spaces", "Shuttle service from remote lots"],
        costImpact: 800, timeImpact: "Redirect signage active within 10 minutes",
        auth: false,
      }));
    }

    if (summary.safetyScore < ALERT_THRESHOLDS.SAFETY_SCORE_MIN) {
      decisions.push(this.makeDecision({
        title: "Increase Safety Compliance Monitoring",
        description: `Safety score ${summary.safetyScore}% below threshold. Enhance monitoring and compliance checks across all zones.`,
        category: "safety", priority: "p2", sourceModule: "emergency-response",
        reasoning: [`Safety score ${summary.safetyScore}% — below 70% threshold`, `3 near-miss incidents reported in last 24 hours`],
        evidence: [`Current safety score: ${summary.safetyScore}%`, `Compliance audit flagging 12 items`],
        businessImpact: "Reduces incident probability by estimated 35%",
        operationalImpact: "Additional safety inspectors deployed for next 48 hours",
        riskAssessment: "Medium risk — compliance gaps need addressing",
        alternatives: ["Targeted zone inspections", "Automated monitoring systems", "Staff retraining program"],
        costImpact: 3200, timeImpact: "Enhanced monitoring starts within 30 minutes",
        auth: false,
      }));
    }

    return decisions.sort((a, b) => {
      const pm: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
      return (pm[a.priority] ?? 99) - (pm[b.priority] ?? 99);
    }).slice(0, 10);
  }

  getByPriority(decisions: DecisionRecommendation[], priority: string) {
    return decisions.filter((d) => d.priority === priority);
  }

  getByStatus(decisions: DecisionRecommendation[], status: string) {
    return decisions.filter((d) => d.status === status);
  }

  implement(decisionId: string, decisions: DecisionRecommendation[], authorizedBy: string) {
    return decisions.map((d) =>
      d.id === decisionId
        ? { ...d, status: "implemented" as const, authorizedBy, implementedAt: new Date().toISOString() }
        : d,
    );
  }

  private makeDecision(data: {
    title: string; description: string; category: string; priority: "p0" | "p1" | "p2" | "p3";
    sourceModule: string; reasoning: string[]; evidence: string[];
    businessImpact: string; operationalImpact: string; riskAssessment: string;
    alternatives: string[]; costImpact: number; timeImpact: string; auth: boolean;
  }): DecisionRecommendation {
    return {
      id: `dec-${Date.now().toString(36)}-${ri(100, 999)}`,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: "active",
      reasoning: data.reasoning,
      confidence: Math.round(78 + Math.random() * 18),
      supportingEvidence: data.evidence,
      businessImpact: data.businessImpact,
      operationalImpact: data.operationalImpact,
      riskAssessment: data.riskAssessment,
      alternativeOptions: data.alternatives,
      sourceModule: data.sourceModule,
      estimatedCostImpact: data.costImpact,
      estimatedTimeImpact: data.timeImpact,
      requiresAuthorization: data.auth,
      authorizedBy: null,
      createdAt: new Date().toISOString(),
      implementedAt: null,
    };
  }
}

export const decisionEngine = new MockDecisionEngine();
