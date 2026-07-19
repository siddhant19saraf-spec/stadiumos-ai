import type { ParkingAlert, ParkingLotStatus, TrafficRoad, AlertType, AlertSeverity } from "../types";
import { PARKING_LOTS, ALERT_THRESHOLDS } from "../constants";

function uid(): string {
  return `alert-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export interface IAlertEngine {
  evaluate(statuses: Map<string, ParkingLotStatus>, roads: TrafficRoad[]): ParkingAlert[];
  acknowledge(alertId: string): ParkingAlert | null;
  shouldNotify(alert: ParkingAlert): boolean;
}

export class MockAlertEngine implements IAlertEngine {
  private acknowledged = new Set<string>();

  evaluate(statuses: Map<string, ParkingLotStatus>, roads: TrafficRoad[]): ParkingAlert[] {
    const alerts: ParkingAlert[] = [];
    const now = new Date().toISOString();

    for (const [, status] of statuses) {
      if (status.occupancyPercent >= ALERT_THRESHOLDS.PARKING_FULL && !this.acknowledged.has(`full-${status.lotId}`)) {
        alerts.push(this.createAlert("parking_full", `${status.lotName} at ${status.occupancyPercent}% capacity`, `Lot ${status.lotName} has ${status.available} spaces remaining. Consider redirecting incoming traffic.`, status.occupancyPercent >= 98 ? "critical" : "high", status.lotId, status.lotName));
        this.acknowledged.add(`full-${status.lotId}`);
      }
    }

    for (const road of roads) {
      if (road.congestionLevel === "severe" || road.congestionLevel === "high") {
        const alertKey = `congestion-${road.id}-${road.congestionLevel}`;
        if (!this.acknowledged.has(alertKey)) {
          alerts.push(this.createAlert("traffic_congestion", `${road.congestionLevel.charAt(0).toUpperCase() + road.congestionLevel.slice(1)} congestion on ${road.name}`, `Speed: ${road.currentSpeedKmph} km/h. Queue: ${road.queueLengthMeters}m. ${road.gateCongestionPercent}% gate congestion.`, road.congestionLevel === "severe" ? "critical" : "high", road.id, road.name));
          this.acknowledged.add(alertKey);
        }
      }

      if (road.status === "closed" && !this.acknowledged.has(`closed-${road.id}`)) {
        alerts.push(this.createAlert("road_blocked", `${road.name} is CLOSED`, `Road closed due to incident or construction. ${road.queueLengthMeters}m queue building. Reroute all traffic.`, "critical", road.id, road.name));
        this.acknowledged.add(`closed-${road.id}`);
      }
    }

    const evStatus = statuses.get("lot-ev");
    if (evStatus && evStatus.evChargingUsed >= evStatus.evChargingTotal * (ALERT_THRESHOLDS.EV_FULL / 100) && !this.acknowledged.has("ev-full")) {
      alerts.push(this.createAlert("ev_chargers_full", "EV Chargers at capacity", `${evStatus.evChargingUsed}/${evStatus.evChargingTotal} chargers in use. Incoming EVs may experience wait times.`, "high", "lot-ev", "EV Charging Station"));
      this.acknowledged.add("ev-full");
    }

    const vipStatus = statuses.get("lot-vip");
    if (vipStatus && vipStatus.occupancyPercent > 80 && !this.acknowledged.has("vip-full")) {
      alerts.push(this.createAlert("vip_arrival", "VIP Lot near capacity", `VIP lot at ${vipStatus.occupancyPercent}%. ${vipStatus.available} spaces remaining. Prepare for VIP arrivals.`, "high", "lot-vip", "VIP Parking"));
      this.acknowledged.add("vip-full");
    }

    const overflowStatus = statuses.get("lot-overflow");
    if (overflowStatus && overflowStatus.occupancyPercent > ALERT_THRESHOLDS.OVERFLOW_TRIGGER && !this.acknowledged.has("overflow-active")) {
      alerts.push(this.createAlert("overflow_activated", "Overflow Lot Activated", `${overflowStatus.lotName} at ${overflowStatus.occupancyPercent}% with ${overflowStatus.available} spaces remaining. Shuttle operations may be needed.`, "medium", "lot-overflow", "Overflow Lot"));
      this.acknowledged.add("overflow-active");
    }

    for (const road of roads) {
      if (road.queueLengthMeters > ALERT_THRESHOLDS.QUEUE_CRITICAL * 2 && !this.acknowledged.has(`queue-${road.id}`)) {
        alerts.push(this.createAlert("queue_threshold", `Critical queue on ${road.name}`, `Queue length: ${road.queueLengthMeters}m. Gate congestion: ${road.gateCongestionPercent}%. Immediate intervention required.`, "high", road.id, road.name));
        this.acknowledged.add(`queue-${road.id}`);
      }
    }

    const generalLots = Array.from(statuses.values()).filter((s) => s.type === "general");
    const exiting = generalLots.filter((s) => s.vehicleTurnoverRate > 2.5).length;
    if (exiting >= 3 && !this.acknowledged.has("exit-surge")) {
      alerts.push(this.createAlert("event_exit_surge", "Post-event exit surge detected", `${exiting} lots in high turnover mode. Exit roads may experience gridlock. Prepare for departure wave.`, "medium", "parking-system", "System"));
      this.acknowledged.add("exit-surge");
    }

    return alerts;
  }

  acknowledge(alertId: string): ParkingAlert | null {
    this.acknowledged.add(alertId);
    return null;
  }

  shouldNotify(alert: ParkingAlert): boolean {
    return alert.severity === "critical" || alert.severity === "high" || !alert.acknowledged;
  }

  private createAlert(type: AlertType, title: string, description: string, severity: AlertSeverity, locationId: string, locationName: string): ParkingAlert {
    return {
      id: uid(),
      type,
      title,
      description,
      severity,
      locationId,
      locationName,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      autoResolved: false,
    };
  }
}

export const alertEngine = new MockAlertEngine();

