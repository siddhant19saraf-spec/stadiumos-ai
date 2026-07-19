import type { Incident, IncidentStatus, Severity } from "../types";

export interface IIncidentEngine {
  processNew(incident: Incident): Promise<Incident>;
  updateStatus(incident: Incident, status: IncidentStatus): Promise<Incident>;
  triageBySeverity(incidents: Incident[]): Incident[];
}

export class MockIncidentEngine implements IIncidentEngine {
  async processNew(incident: Incident): Promise<Incident> {
    const enriched = {
      ...incident,
      status: "analyzing" as IncidentStatus,
      lastUpdated: new Date().toISOString(),
      timeline: [
        ...incident.timeline,
        {
          id: `${incident.id}-tl-process`,
          action: "Incident Processing Started",
          actor: "Incident Engine",
          timestamp: new Date().toISOString(),
          detail: "Incident classified and routed for AI analysis.",
        },
      ],
    };
    return enriched;
  }

  async updateStatus(incident: Incident, status: IncidentStatus): Promise<Incident> {
    return {
      ...incident,
      status,
      lastUpdated: new Date().toISOString(),
      timeline: [
        ...incident.timeline,
        {
          id: `${incident.id}-tl-${Date.now()}`,
          action: `Status Changed to ${status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
          actor: "Incident Engine",
          timestamp: new Date().toISOString(),
          detail: `Incident status updated from ${incident.status} to ${status}.`,
        },
      ],
    };
  }

  triageBySeverity(incidents: Incident[]): Incident[] {
    const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...incidents].sort((a, b) => {
      const sevDiff = order[a.severity] - order[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
    });
  }
}

export const incidentEngine = new MockIncidentEngine();
