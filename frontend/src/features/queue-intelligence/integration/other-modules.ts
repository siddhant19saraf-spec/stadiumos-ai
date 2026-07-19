import { queueIntelligenceService } from "../services/queue-service";

export interface CopilotQueueSummary {
  totalQueuePoints: number;
  avgWaitMin: number;
  worstQueue: string;
  worstWaitMin: number;
  totalCustomers: number;
  satisfactionAvg: number;
  activeAlerts: number;
  inventoryShortages: number;
  lastUpdated: string;
}

export interface DigitalTwinQueueOverlay {
  pointId: string;
  pointName: string;
  type: string;
  waitMin: number;
  status: string;
  coordinateCenter: { x: number; y: number };
  color: string;
}

export interface EmergencyQueueImpact {
  affectedPoints: string[];
  totalCustomersInQueue: number;
  avgWaitIncrease: number;
  estimatedClearTime: string;
  severity: string;
}

export interface CrowdIntelligenceQueueData {
  totalQueues: number;
  congestedQueues: number;
  avgServiceSpeed: number;
  peakDemandWindow: string;
  recommendedStaff: number;
}

export class QueueIntelligenceIntegration {
  static getCopilotSummary(): CopilotQueueSummary {
    const state = queueIntelligenceService.getState();
    const arr = Array.from(state.queueStatuses.values());
    const avgWait = arr.reduce((s, q) => s + q.estimatedWaitMin, 0) / Math.max(1, arr.length);
    const worst = arr.reduce((a, b) => a.estimatedWaitMin > b.estimatedWaitMin ? a : b, arr[0]);
    return {
      totalQueuePoints: arr.length,
      avgWaitMin: Math.round(avgWait),
      worstQueue: worst?.queuePointName ?? "",
      worstWaitMin: worst?.estimatedWaitMin ?? 0,
      totalCustomers: arr.reduce((s, q) => s + q.currentLength, 0),
      satisfactionAvg: state.analytics.customerSatisfactionAvg,
      activeAlerts: state.alerts.filter((a) => !a.acknowledged).length,
      inventoryShortages: Array.from(state.inventoryStatuses.values()).filter((i) => i.restockPriority === "critical" || i.restockPriority === "high").length,
      lastUpdated: state.lastUpdated,
    };
  }

  static getDigitalTwinOverlay(): DigitalTwinQueueOverlay[] {
    const state = queueIntelligenceService.getState();
    return Array.from(state.queueStatuses.values()).map((q) => {
      const point = state.queuePoints.find((p) => p.id === q.queuePointId);
      return {
        pointId: q.queuePointId,
        pointName: q.queuePointName,
        type: q.type,
        waitMin: q.estimatedWaitMin,
        status: q.status,
        coordinateCenter: point ? { x: point.coordinates.x + point.coordinates.width / 2, y: point.coordinates.y + point.coordinates.height / 2 } : { x: 50, y: 50 },
        color: q.estimatedWaitMin >= 25 ? "#ef4444" : q.estimatedWaitMin >= 15 ? "#f97316" : q.estimatedWaitMin >= 8 ? "#eab308" : "#22c55e",
      };
    });
  }

  static getEmergencyImpact(): EmergencyQueueImpact {
    const state = queueIntelligenceService.getState();
    const critical = Array.from(state.queueStatuses.values()).filter((q) => q.status === "critical");
    return {
      affectedPoints: critical.map((q) => q.queuePointName),
      totalCustomersInQueue: critical.reduce((s, q) => s + q.currentLength, 0),
      avgWaitIncrease: critical.length > 0 ? Math.round(critical.reduce((s, q) => s + q.estimatedWaitMin, 0) / critical.length) : 0,
      estimatedClearTime: critical.length > 0 ? "30-45 min" : "N/A",
      severity: critical.length > 3 ? "high" : critical.length > 0 ? "medium" : "low",
    };
  }

  static getCrowdIntelligenceData(): CrowdIntelligenceQueueData {
    const state = queueIntelligenceService.getState();
    const arr = Array.from(state.queueStatuses.values());
    const congested = arr.filter((q) => q.status === "congested" || q.status === "critical");
    const avgSpeed = arr.reduce((s, q) => s + q.serviceSpeedSec, 0) / Math.max(1, arr.length);
    return {
      totalQueues: arr.length,
      congestedQueues: congested.length,
      avgServiceSpeed: Math.round(avgSpeed),
      peakDemandWindow: state.analytics.peakHour,
      recommendedStaff: congested.length * 2,
    };
  }
}
