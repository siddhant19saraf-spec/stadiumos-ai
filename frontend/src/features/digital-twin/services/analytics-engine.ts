import type { LiveAnalytics, ZoneLiveStatus, DigitalIncident } from "../types";

export interface IAnalyticsEngine {
  compute(statuses: Map<string, ZoneLiveStatus>, incidents: DigitalIncident[]): LiveAnalytics;
  trends(current: LiveAnalytics, previous: LiveAnalytics): Record<string, "up" | "down" | "stable">;
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  private previous: LiveAnalytics | null = null;

  compute(statuses: Map<string, ZoneLiveStatus>, incidents: DigitalIncident[]): LiveAnalytics {
    const arr = Array.from(statuses.values());
    const totalCap = arr.reduce((s, z) => s + z.maxCapacity, 0);
    const totalOcc = arr.reduce((s, z) => s + z.currentOccupancy, 0);
    const avgSafety = arr.length > 0 ? arr.reduce((s, z) => s + z.safetyScore, 0) / arr.length : 100;
    const avgTemp = arr.length > 0 ? arr.reduce((s, z) => s + z.temperature, 0) / arr.length : 22;
    const degraded = arr.filter((z) => z.status === "degraded" || z.status === "emergency").length;
    const maintenanceIssues = arr.filter((z) => z.maintenanceStatus === "overdue").length;
    const parkingZones = arr.filter((z) => z.zoneId.startsWith("park-"));
    const parkingUtil = parkingZones.length > 0 ? parkingZones.reduce((s, z) => s + z.occupancyPercent, 0) / parkingZones.length : 0;
    const longQueueZones = arr.filter((z) => z.queueTimeMinutes > 10);
    const queueHealth = Math.max(0, 100 - longQueueZones.length * 6);
    const health = Math.max(0, Math.min(100, 100 - degraded * 4 - maintenanceIssues * 5));
    const maintHealth = Math.max(0, 100 - maintenanceIssues * 12);

    return {
      operationalHealth: Math.round(health),
      safetyIndex: Math.round(avgSafety),
      energyUsageMw: parseFloat((arr.reduce((s, z) => s + z.energyUsageKw, 0) / 1000).toFixed(1)),
      maintenanceHealth: Math.round(maintHealth),
      parkingUtilization: Math.round(parkingUtil),
      resourceUtilization: Math.round(arr.filter((z) => z.status === "operational").length / Math.max(1, arr.length) * 100),
      queueHealth: Math.round(queueHealth),
      totalOccupancy: totalOcc,
      totalCapacity: totalCap,
      activeIncidents: incidents.filter((i) => i.status === "active").length,
      activeTeams: 4,
      avgTemperature: parseFloat(avgTemp.toFixed(1)),
    };
  }

  trends(current: LiveAnalytics, _previous: LiveAnalytics): Record<string, "up" | "down" | "stable"> {
    const result: Record<string, "up" | "down" | "stable"> = {};
    const keys: (keyof LiveAnalytics)[] = ["operationalHealth", "safetyIndex", "maintenanceHealth", "queueHealth", "parkingUtilization"];
    for (const key of keys) {
      const diff = (current[key] as number) - ((this.previous?.[key] as number) ?? current[key]);
      result[key] = Math.abs(diff) < 2 ? "stable" : diff > 0 ? "up" : "down";
    }
    this.previous = current;
    return result;
  }
}

export const analyticsEngine = new MockAnalyticsEngine();
