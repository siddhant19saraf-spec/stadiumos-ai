import type { ExecutiveSummary, ModuleSnapshot, ExecutiveRole } from "../types";
import { ALERT_THRESHOLDS, MODULE_NAMES, EXECUTIVE_ROLES } from "../constants";

function rf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function ri(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface IExecutiveEngine {
  getSummary(role: ExecutiveRole): ExecutiveSummary;
  getModuleSnapshots(): ModuleSnapshot[];
  getKpiValues(role: ExecutiveRole): { id: string; label: string; value: number; previousValue: number; unit: string; category: string; trend: "up" | "down" | "stable"; status: "critical" | "warning" | "healthy" | "neutral"; changePct: number; changeDirection: "increase" | "decrease" | "unchanged"; tooltip: string }[];
}

export class MockExecutiveEngine implements IExecutiveEngine {
  private tick = 0;

  getSummary(role: ExecutiveRole): ExecutiveSummary {
    this.tick++;
    const opHealth = this.operationalHealth();
    const safetyScore = this.safetyScore();
    const crowdHealth = this.crowdHealth();
    const infraHealth = this.infraHealth();
    const energyEff = this.energyEfficiency();
    const carbonScore = this.carbonScore();
    const financial = this.financialPerformance();
    const visitorSat = this.visitorSatisfaction();
    const execRisk = this.executiveRiskScore(opHealth, safetyScore, infraHealth);
    const activeIncidents = ri(0, 3);
    const isMatchDay = role === "tournament_director" || role === "ceo" || Math.random() > 0.6;

    return {
      operationalHealthScore: opHealth,
      safetyScore,
      crowdHealthScore: crowdHealth,
      tournamentProgress: ri(45, 95),
      emergencyStatus: activeIncidents >= ALERT_THRESHOLDS.EMERGENCY_CRITICAL_COUNT ? "critical" : activeIncidents >= ALERT_THRESHOLDS.EMERGENCY_ELEVATED_COUNT ? "elevated" : "normal",
      infrastructureHealth: infraHealth,
      parkingUtilization: ri(40, 95),
      queuePerformance: ri(55, 92),
      energyEfficiency: energyEff,
      carbonScore,
      financialPerformance: financial,
      visitorSatisfaction: visitorSat,
      executiveRiskScore: execRisk,
      activeDecisions: ri(2, 8),
      unacknowledgedAlerts: ri(1, 6),
      criticalAlerts: ri(0, 2),
      totalIncidents: ri(5, 20),
      activeIncidents,
      matchDayStatus: isMatchDay ? "active" : "standby",
      lastUpdated: new Date().toISOString(),
    };
  }

  getModuleSnapshots(): ModuleSnapshot[] {
    return Object.entries(MODULE_NAMES).map(([id, name]) => {
      const health = rf(45, 98);
      return {
        moduleId: id,
        moduleName: name,
        status: health >= ALERT_THRESHOLDS.OPERATIONAL_HEALTH_MIN ? "healthy" : health >= 40 ? "warning" : "critical",
        healthScore: Math.round(health),
        activeAlerts: ri(0, 4),
        summary: `${name} is ${health >= 70 ? "operating normally" : health >= 45 ? "showing signs of strain" : "requiring immediate attention"}`,
        kpis: [
          { label: "Health", value: `${Math.round(health)}%`, status: health >= 70 ? "healthy" : health >= 45 ? "warning" : "critical" },
          { label: "Alerts", value: `${ri(0, 4)}`, status: "healthy" },
        ],
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  getKpiValues(role: ExecutiveRole) {
    const all: Array<{
      id: string; label: string; value: number; category: string; unit: string; tooltip: string;
    }> = [
      { id: "op-health", label: "Operational Health", value: this.operationalHealth(), category: "operations", unit: "%", tooltip: "Overall operational performance across all modules" },
      { id: "safety-score", label: "Safety Score", value: this.safetyScore(), category: "safety", unit: "%", tooltip: "Safety and security compliance rating" },
      { id: "crowd-health", label: "Crowd Health", value: this.crowdHealth(), category: "crowd", unit: "%", tooltip: "Crowd density and flow efficiency" },
      { id: "tournament-progress", label: "Tournament Progress", value: ri(45, 95), category: "tournament", unit: "%", tooltip: "Progress against tournament schedule" },
      { id: "infra-health", label: "Infrastructure Health", value: this.infraHealth(), category: "infrastructure", unit: "%", tooltip: "Facility and equipment health score" },
      { id: "parking-util", label: "Parking Utilization", value: ri(40, 95), category: "parking", unit: "%", tooltip: "Current parking capacity utilization" },
      { id: "queue-perf", label: "Queue Performance", value: ri(55, 92), category: "queue", unit: "%", tooltip: "Queue wait time efficiency" },
      { id: "energy-eff", label: "Energy Efficiency", value: this.energyEfficiency(), category: "energy", unit: "%", tooltip: "Energy consumption efficiency rating" },
      { id: "carbon-score", label: "Carbon Score", value: this.carbonScore(), category: "sustainability", unit: "%", tooltip: "Carbon emission and sustainability score" },
      { id: "financial-perf", label: "Financial Performance", value: this.financialPerformance(), category: "financial", unit: "%", tooltip: "Revenue and cost performance index" },
      { id: "visitor-sat", label: "Visitor Satisfaction", value: this.visitorSatisfaction(), category: "satisfaction", unit: "%", tooltip: "Fan experience satisfaction score" },
      { id: "risk-score", label: "Risk Score", value: this.executiveRiskScore(70, 75, 65), category: "risk", unit: "%", tooltip: "Executive risk assessment score" },
    ];

    const roleCategories = EXECUTIVE_ROLES.find((r) => r.role === role)?.kpiCategories ?? [];
    return all
      .filter((k) => roleCategories.includes(k.category))
      .map((k) => {
        const prev = k.value + rf(-8, 8);
        const change = k.value - prev;
        return {
          ...k,
          previousValue: Math.round(prev),
          trend: change > 2 ? "up" : change < -2 ? "down" : "stable" as const,
          status: k.value >= 70 ? "healthy" as const : k.value >= 50 ? "warning" as const : "critical" as const,
          changePct: parseFloat(((change / Math.max(1, prev)) * 100).toFixed(1)),
          changeDirection: change > 0 ? "increase" as const : change < 0 ? "decrease" as const : "unchanged" as const,
        };
      });
  }

  private operationalHealth(): number { return Math.round(55 + Math.sin(this.tick * 0.05) * 15 + rf(-5, 5)); }
  private safetyScore(): number { return Math.round(65 + Math.sin(this.tick * 0.03) * 10 + rf(-5, 5)); }
  private crowdHealth(): number { return Math.round(60 + Math.sin(this.tick * 0.04 + 1) * 12 + rf(-5, 5)); }
  private infraHealth(): number { return Math.round(58 + Math.sin(this.tick * 0.02 + 2) * 10 + rf(-5, 5)); }
  private energyEfficiency(): number { return Math.round(62 + Math.sin(this.tick * 0.06 + 3) * 8 + rf(-5, 5)); }
  private carbonScore(): number { return Math.round(55 + Math.sin(this.tick * 0.04 + 4) * 10 + rf(-5, 5)); }
  private financialPerformance(): number { return Math.round(65 + Math.sin(this.tick * 0.03 + 5) * 8 + rf(-5, 5)); }
  private visitorSatisfaction(): number { return Math.round(68 + Math.sin(this.tick * 0.05 + 6) * 7 + rf(-5, 5)); }
  private executiveRiskScore(opH: number, saf: number, infH: number): number {
    return Math.round(Math.max(5, 100 - (opH * 0.4 + saf * 0.35 + infH * 0.25)) + rf(-5, 5));
  }
}

export const executiveEngine = new MockExecutiveEngine();
