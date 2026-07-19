import type { AssetHealth } from "../types";
import { ALERT_THRESHOLDS } from "../constants";

export interface IMaintenanceEngine {
  calculateDue(healthMap: Map<string, AssetHealth>): number;
  calculateCompliance(): number;
  getMaintenanceStatus(health: AssetHealth): "on_track" | "due_soon" | "overdue" | "critical";
}

export class MockMaintenanceEngine implements IMaintenanceEngine {
  calculateDue(healthMap: Map<string, AssetHealth>): number {
    let due = 0;
    for (const [, h] of healthMap) {
      if (h.maintenanceStatus === "overdue" || h.maintenanceStatus === "scheduled" || h.healthScore < 50) {
        due++;
      }
    }
    return due;
  }

  calculateCompliance(): number {
    return Math.round(72 + Math.random() * 20);
  }

  getMaintenanceStatus(health: AssetHealth): "on_track" | "due_soon" | "overdue" | "critical" {
    if (health.maintenanceStatus === "overdue" || health.healthScore < 20) return "critical";
    if (health.maintenanceStatus === "scheduled" || health.healthScore < 40) return "overdue";
    if (health.healthScore < 60) return "due_soon";
    return "on_track";
  }
}

export const maintenanceEngine = new MockMaintenanceEngine();

