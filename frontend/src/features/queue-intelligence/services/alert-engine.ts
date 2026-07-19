import type { QueueAlert, QueuePointStatus, InventoryItem, AlertType, AlertSeverity } from "../types";
import { ALERT_THRESHOLDS } from "../constants";

function uid(): string {
  return `alert-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export interface IAlertEngine {
  evaluate(statuses: Map<string, QueuePointStatus>, inventory: Map<string, InventoryItem>): QueueAlert[];
  acknowledge(alertId: string): void;
}

export class MockAlertEngine implements IAlertEngine {
  private ackSet = new Set<string>();

  evaluate(statuses: Map<string, QueuePointStatus>, inventory: Map<string, InventoryItem>): QueueAlert[] {
    const alerts: QueueAlert[] = [];
    for (const [, s] of statuses) {
      const ackKey = `queue-${s.queuePointId}`;
      if (s.estimatedWaitMin >= ALERT_THRESHOLDS.CRITICAL_QUEUE_MIN && !this.ackSet.has(ackKey + "-critical")) {
        alerts.push(this.createAlert("long_queue", `Critical queue at ${s.queuePointName}`, `${s.queuePointName} wait time: ${s.estimatedWaitMin} min. Queue length: ${s.currentLength}. All counters at capacity.`, "critical", s.queuePointId, s.queuePointName, s.estimatedWaitMin, ALERT_THRESHOLDS.CRITICAL_QUEUE_MIN));
        this.ackSet.add(ackKey + "-critical");
      } else if (s.estimatedWaitMin >= ALERT_THRESHOLDS.LONG_QUEUE_MIN && !this.ackSet.has(ackKey + "-long")) {
        alerts.push(this.createAlert("long_queue", `Long queue at ${s.queuePointName}`, `Wait time: ${s.estimatedWaitMin} min. Active counters: ${s.activeCounters}/${s.totalCounters}. Satisfaction: ${s.customerSatisfaction}/5.`, "high", s.queuePointId, s.queuePointName, s.estimatedWaitMin, ALERT_THRESHOLDS.LONG_QUEUE_MIN));
        this.ackSet.add(ackKey + "-long");
      }

      if (s.counterStatuses.filter((c) => c === "breakdown").length >= 2 && !this.ackSet.has(ackKey + "-breakdown")) {
        alerts.push(this.createAlert("equipment_failure", `Equipment failure at ${s.queuePointName}`, `${s.counterStatuses.filter((c) => c === "breakdown").length} counters in breakdown. Impact: ${s.estimatedWaitMin + 10} min estimated wait.`, "high", s.queuePointId, s.queuePointName, s.counterStatuses.filter((c) => c === "breakdown").length, 2));
        this.ackSet.add(ackKey + "-breakdown");
      }

      if (s.customerSatisfaction < ALERT_THRESHOLDS.SATISFACTION_MIN && !this.ackSet.has(ackKey + "-sat")) {
        alerts.push(this.createAlert("satisfaction_drop", `Customer satisfaction drop at ${s.queuePointName}`, `Satisfaction: ${s.customerSatisfaction}/5. Wait time: ${s.estimatedWaitMin} min. Service speed: ${s.serviceSpeedSec}s.`, "high", s.queuePointId, s.queuePointName, s.customerSatisfaction, ALERT_THRESHOLDS.SATISFACTION_MIN));
        this.ackSet.add(ackKey + "-sat");
      }
    }

    for (const [, item] of inventory) {
      const invKey = `inv-${item.id}`;
      if (item.predictedShortageInMin !== null && item.predictedShortageInMin <= 15 && !this.ackSet.has(invKey + "-short")) {
        alerts.push(this.createAlert("inventory_shortage", `Inventory shortage: ${item.name}`, `Stock: ${item.currentStock}/${item.maxStock}. Estimated shortage in ${item.predictedShortageInMin} min. Reorder point: ${item.reorderPoint}.`, "critical", "inventory", item.name, item.currentStock, item.reorderPoint));
        this.ackSet.add(invKey + "-short");
      } else if (item.restockPriority === "high" && !this.ackSet.has(invKey + "-restock")) {
        alerts.push(this.createAlert("restock_needed", `Restock needed: ${item.name}`, `${item.name} at ${item.currentStock}/${item.maxStock}. Daily demand: ${item.dailyDemand}.`, "medium", "inventory", item.name, item.currentStock, item.reorderPoint));
        this.ackSet.add(invKey + "-restock");
      }
    }

    return alerts;
  }

  acknowledge(alertId: string) {
    this.ackSet.add(alertId);
  }

  private createAlert(type: AlertType, title: string, description: string, severity: AlertSeverity, locationId: string, locationName: string, metricValue: number, threshold: number): QueueAlert {
    return {
      id: uid(), type, title, description, severity, locationId, locationName,
      timestamp: new Date().toISOString(), acknowledged: false, autoResolved: false,
      metricValue, threshold,
    };
  }
}

export const alertEngine = new MockAlertEngine();

