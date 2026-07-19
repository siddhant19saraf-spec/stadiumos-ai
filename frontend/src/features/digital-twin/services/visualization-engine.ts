import type { ZoneLiveStatus } from "../types";

export interface IVisualizationEngine {
  getHeatmapColor(percent: number): string;
  getZoneOpacity(percent: number): number;
  getMetricTrend(current: number, previous: number): "up" | "down" | "stable";
  formatLayerData(layerId: string, statuses: Map<string, ZoneLiveStatus>): Record<string, number>;
}

export class MockVisualizationEngine implements IVisualizationEngine {
  getHeatmapColor(percent: number): string {
    if (percent >= 85) return "#ef4444";
    if (percent >= 70) return "#f97316";
    if (percent >= 55) return "#eab308";
    return "#22c55e";
  }

  getZoneOpacity(percent: number): number {
    return 0.2 + (percent / 100) * 0.65;
  }

  getMetricTrend(current: number, previous: number): "up" | "down" | "stable" {
    const diff = current - previous;
    if (Math.abs(diff) < 2) return "stable";
    return diff > 0 ? "up" : "down";
  }

  formatLayerData(layerId: string, statuses: Map<string, ZoneLiveStatus>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, status] of statuses) {
      switch (layerId) {
        case "crowd_density": result[id] = status.occupancyPercent; break;
        case "queues": result[id] = status.queueTimeMinutes; break;
        case "energy": result[id] = status.energyUsageKw; break;
        case "parking": if (id.startsWith("park-")) result[id] = status.occupancyPercent; break;
        case "maintenance": result[id] = status.maintenanceStatus === "overdue" ? 100 : status.maintenanceStatus === "in_progress" ? 60 : status.maintenanceStatus === "scheduled" ? 30 : 0; break;
        case "cleaning": result[id] = status.cleaningStatus === "due" ? 50 : status.cleaningStatus === "in_progress" ? 80 : 10; break;
        default: result[id] = status.occupancyPercent;
      }
    }
    return result;
  }
}

export const visualizationEngine = new MockVisualizationEngine();

