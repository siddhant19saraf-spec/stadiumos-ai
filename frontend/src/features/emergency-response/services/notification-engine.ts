import type { SmartAlert, Incident, AlertType, Severity } from "../types";

export interface INotificationEngine {
  generate(incidents: Incident[], existing: SmartAlert[]): SmartAlert[];
  acknowledge(alert: SmartAlert): Promise<SmartAlert>;
  clearExpired(alerts: SmartAlert[]): SmartAlert[];
}

export class MockNotificationEngine implements INotificationEngine {
  generate(incidents: Incident[], existing: SmartAlert[]): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const now = Date.now();

    for (const inc of incidents) {
      if (inc.status === "resolved") continue;

      if (inc.severity === "critical" && !existing.some((a) => a.incidentId === inc.id && a.type === "critical_incident")) {
        alerts.push({
          id: `notif-critical-${inc.id}`,
          type: "critical_incident",
          title: `CRITICAL: ${inc.title}`,
          message: inc.aiAnalysis.analysisSummary,
          severity: "critical",
          incidentId: inc.id,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          expiresAt: new Date(now + 300000).toISOString(),
        });
      }

      if (inc.aiAnalysis.escalationProbability > 75 && !existing.some((a) => a.incidentId === inc.id && a.type === "escalating_event")) {
        alerts.push({
          id: `notif-escalate-${inc.id}`,
          type: "escalating_event",
          title: `Escalation Risk: ${inc.title}`,
          message: `Escalation probability at ${inc.aiAnalysis.escalationProbability}%. Recommended action: ${inc.aiAnalysis.recommendedActions[0] ?? "Immediate dispatch"}.`,
          severity: "high",
          incidentId: inc.id,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          expiresAt: new Date(now + 240000).toISOString(),
        });
      }

      if (inc.aiAnalysis.resourceShortages.length > 0 && !existing.some((a) => a.incidentId === inc.id && a.type === "resource_shortage")) {
        alerts.push({
          id: `notif-resource-${inc.id}`,
          type: "resource_shortage",
          title: `Resource Gap: ${inc.title}`,
          message: `Missing: ${inc.aiAnalysis.resourceShortages.join(", ")}. Request logistics dispatch.`,
          severity: "medium",
          incidentId: inc.id,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          expiresAt: new Date(now + 360000).toISOString(),
        });
      }
    }

    return alerts;
  }

  async acknowledge(alert: SmartAlert): Promise<SmartAlert> {
    return { ...alert, acknowledged: true };
  }

  clearExpired(alerts: SmartAlert[]): SmartAlert[] {
    const now = Date.now();
    return alerts.filter((a) => new Date(a.expiresAt).getTime() > now);
  }
}

export const notificationEngine = new MockNotificationEngine();
