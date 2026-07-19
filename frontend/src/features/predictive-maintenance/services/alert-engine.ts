import type { Alert, AssetHealth, FailurePrediction, WorkOrder, AlertSeverity, AlertCategory } from "../types";

let alertCounter = 0;
function uid(): string {
  return `alert-${Date.now().toString(36)}-${++alertCounter}`;
}

export interface IAlertEngine {
  generate(healthMap: Map<string, AssetHealth>, predictions: FailurePrediction[], orders: WorkOrder[]): Alert[];
  acknowledge(alertId: string, alerts: Alert[]): Alert[];
  getActive(alerts: Alert[]): Alert[];
}

export class MockAlertEngine implements IAlertEngine {
  generate(healthMap: Map<string, AssetHealth>, predictions: FailurePrediction[], orders: WorkOrder[]): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    for (const [, h] of healthMap) {
      const severity = this.determineSeverity(h);
      if (severity === "none") continue;

      const category = this.determineCategory(h);
      const isPredictionRelated = predictions.some((p) => p.assetId === h.assetId);

      alerts.push({
        id: uid(),
        assetId: h.assetId,
        assetName: h.assetName,
        severity,
        category,
        title: this.generateTitle(severity, category, h.assetName),
        message: this.generateMessage(severity, h),
        suggestedAction: this.suggestedAction(severity, category, h),
        requiresImmediateAction: severity === "critical" || severity === "severe",
        acknowledged: false,
        predictionRelated: isPredictionRelated,
        createdAt: now,
        acknowledgedAt: null,
      });
    }

    return alerts.slice(0, 20);
  }

  acknowledge(alertId: string, alerts: Alert[]): Alert[] {
    return alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a,
    );
  }

  getActive(alerts: Alert[]): Alert[] {
    return alerts.filter((a) => !a.acknowledged);
  }

  private determineSeverity(h: AssetHealth): AlertSeverity | "none" {
    if (h.healthScore < 10 || h.riskScore >= 90) return "critical";
    if (h.healthScore < 20 || h.riskScore >= 75) return "severe";
    if (h.healthScore < 35 || h.riskScore >= 50) return "warning";
    if (h.healthScore < 50) return "info";
    if (Math.random() < 0.05) return "info";
    return "none";
  }

  private determineCategory(h: AssetHealth): AlertCategory {
    if (h.temperature > 50) return "environmental";
    if (h.vibrationMmS > 7) return "safety";
    if (h.healthScore < 25) return "failure_risk";
    if (h.pressureBar > 7) return "operational";
    if (h.maintenanceStatus === "overdue") return "maintenance_due";
    return "system";
  }

  private generateTitle(severity: AlertSeverity, category: AlertCategory, assetName: string): string {
    const titles: Record<string, string> = {
      critical: `CRITICAL: ${assetName} at imminent failure risk`,
      severe: `SEVERE: ${assetName} requires immediate attention`,
      warning: `${assetName} showing early warning signs`,
      info: `${assetName} needs scheduled maintenance`,
    };
    return titles[severity] ?? `${assetName} alert`;
  }

  private generateMessage(severity: AlertSeverity, h: AssetHealth): string {
    const msgs: Record<string, string> = {
      critical: `${h.assetName} health score is critically low at ${h.healthScore}%. Risk score: ${h.riskScore}%. Temperature: ${h.temperature}°C. Failure probability: >90% within 7 days. Immediate intervention required.`,
      severe: `${h.assetName} health score: ${h.healthScore}%, risk score: ${h.riskScore}%. Multiple indicators suggest rapid degradation. Schedule maintenance within 48 hours.`,
      warning: `${h.assetName} health declining (${h.healthScore}%). Vibration: ${h.vibrationMmS} mm/s, Temperature: ${h.temperature}°C. Monitor closely and plan maintenance.`,
      info: `${h.assetName} is due for scheduled maintenance. Health score: ${h.healthScore}%. Last maintenance: ${new Date(h.lastMaintenance).toLocaleDateString()}.`,
    };
    return msgs[severity] ?? `${h.assetName} requires attention.`;
  }

  private suggestedAction(severity: AlertSeverity, category: AlertCategory, h: AssetHealth): string {
    if (severity === "critical" || severity === "severe") {
      return `Immediately dispatch maintenance team to ${h.assetName}. Isolate from connected systems if possible. Consider emergency shutdown if temperature exceeds safe limits.`;
    }
    if (category === "maintenance_due") {
      return `Schedule maintenance for ${h.assetName} within the next 7 days. Required: comprehensive inspection and calibration.`;
    }
    if (category === "environmental") {
      return `Check cooling system for ${h.assetName}. Reduce ambient temperature. Verify airflow is unobstructed.`;
    }
    if (category === "safety") {
      return `Perform safety inspection on ${h.assetName}. Check for loose components and abnormal wear patterns.`;
    }
    return `Schedule inspection for ${h.assetName} within 14 days. Review monitoring data and trend analysis.`;
  }
}

export const alertEngine = new MockAlertEngine();
