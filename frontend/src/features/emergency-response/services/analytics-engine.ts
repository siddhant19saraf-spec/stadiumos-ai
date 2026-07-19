import type { EmergencyAnalytics, Incident, ResponseTeam, ResponseTimePoint } from "../types";

export interface IAnalyticsEngine {
  compute(incidents: Incident[], teams: ResponseTeam[], responseTimes: ResponseTimePoint[]): EmergencyAnalytics;
  recordResponseTime(incident: Incident, responseMinutes: number): ResponseTimePoint;
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  compute(incidents: Incident[], teams: ResponseTeam[], responseTimes: ResponseTimePoint[]): EmergencyAnalytics {
    const resolved = incidents.filter((i) => i.status === "resolved");
    const open = incidents.filter((i) => i.status !== "resolved");
    const critical = open.filter((i) => i.severity === "critical");
    const activeTeams = teams.filter((t) => t.status === "dispatched" || t.status === "on_scene").length;

    const avgResponse = responseTimes.length > 0
      ? responseTimes.reduce((s, r) => s + r.responseMinutes, 0) / responseTimes.length
      : 0;

    const avgResolution = resolved.length > 0
      ? resolved.reduce((s, i) => s + i.estimatedResolutionMinutes, 0) / resolved.length
      : 0;

    const readinessScore = Math.max(0, Math.min(100,
      95 - critical.length * 6 - open.length * 2 + teams.filter((t) => t.status === "available").length,
    ));

    const safetyScore = Math.max(0, Math.min(100,
      90 - critical.length * 5 - open.length * 1.5,
    ));

    const criticalPerType: Partial<Record<import("../types").IncidentType, number>> = {};
    for (const inc of critical) {
      const t = inc.type as import("../types").IncidentType;
      criticalPerType[t] = (criticalPerType[t] ?? 0) + 1;
    }

    return {
      averageResponseMinutes: parseFloat(avgResponse.toFixed(1)),
      openIncidents: open.length,
      criticalIncidents: critical.length,
      resolvedIncidents: resolved.length,
      totalIncidents: incidents.length,
      emergencyReadinessScore: parseFloat(readinessScore.toFixed(0)),
      safetyScore: parseFloat(safetyScore.toFixed(0)),
      avgResolutionMinutes: parseFloat(avgResolution.toFixed(1)),
      activeTeams,
      availableTeams: teams.length - activeTeams,
      escalationRate: parseFloat((critical.length / Math.max(1, incidents.length) * 100).toFixed(1)),
      criticalPerType,
      responseTimeHistory: responseTimes,
      evacuationStatus: critical.length > 2 ? "partial" : critical.length > 0 ? "standby" : "none",
      affectedZones: [...new Set(open.map((i) => i.zoneId))],
      resourceUtilization: parseFloat((teams.length > 0 ? (activeTeams / teams.length) * 100 : 0).toFixed(0)),
      communicationStatus: open.some((i) => i.type === "network_failure") ? "degraded" : "operational",
    };
  }

  recordResponseTime(incident: Incident, responseMinutes: number): ResponseTimePoint {
    return {
      incidentId: incident.id,
      incidentType: incident.type,
      responseMinutes,
      timestamp: new Date().toISOString(),
      severity: incident.severity,
    };
  }
}

export const analyticsEngine = new MockAnalyticsEngine();
