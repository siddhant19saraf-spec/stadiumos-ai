import type { ParkingRecommendation, ParkingLotStatus, TrafficRoad, ParkingAlert } from "../types";
import { PARKING_LOTS, ALERT_THRESHOLDS } from "../constants";

function uid(): string {
  return `rec-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export interface IRecommendationEngine {
  generate(situation: { statuses: Map<string, ParkingLotStatus>; roads: TrafficRoad[]; alerts: ParkingAlert[] }): ParkingRecommendation[];
  getPriorityLabel(priority: string): string;
}

export class MockRecommendationEngine implements IRecommendationEngine {
  generate(situation: { statuses: Map<string, ParkingLotStatus>; roads: TrafficRoad[]; alerts: ParkingAlert[] }): ParkingRecommendation[] {
    const { statuses, roads, alerts } = situation;
    const recommendations: ParkingRecommendation[] = [];
    const now = new Date().toISOString();

    const nearFull = Array.from(statuses.values()).filter((s) => s.occupancyPercent >= ALERT_THRESHOLDS.PARKING_NEAR_FULL);
    const fullLots = Array.from(statuses.values()).filter((s) => s.occupancyPercent >= ALERT_THRESHOLDS.PARKING_FULL);
    const overflowLots = Array.from(statuses.values()).filter((s) => s.type === "overflow");
    const congestedRoads = roads.filter((r) => r.congestionLevel === "high" || r.congestionLevel === "severe");
    const closedRoads = roads.filter((r) => r.status === "closed");
    const highQueue = roads.filter((r) => r.queueLengthMeters > ALERT_THRESHOLDS.QUEUE_CRITICAL);

    if (nearFull.length >= 3) {
      const target = PARKING_LOTS.find((l) => l.type === "overflow");
      const overflowStatus = target ? statuses.get(target.id) : undefined;
      if (target && overflowStatus && overflowStatus.occupancyPercent < 60) {
        recommendations.push(this.makeRec("Open Parking Lot D", `Open ${target.name} — ${target.capacity} spaces available. Current utilization: ${overflowStatus.occupancyPercent}%.`, "high", target.id, target.name, [
          `${nearFull.length} lots near capacity (${nearFull.map((s) => s.occupancyPercent.toFixed(0)).join(", ")}%)`,
          `${target.name} has ${overflowStatus.available} spaces remaining`,
          "Reduces queue buildup on entry roads",
        ]));
      }
    }

    if (congestedRoads.length >= 2) {
      const worst = congestedRoads.sort((a, b) => b.queueLengthMeters - a.queueLengthMeters)[0];
      if (worst) {
        recommendations.push(this.makeRec("Redirect Vehicles", `Redirect inbound traffic from ${worst.name}. Queue: ${worst.queueLengthMeters}m. Speed: ${worst.currentSpeedKmph} km/h.`, "urgent", worst.id, worst.name, [
          `Congestion level: ${worst.congestionLevel}`,
          `Alternate routes: ${roads.filter((r) => r.direction === worst.direction && r.status === "open" && r.id !== worst.id).map((r) => r.name).join(", ") || "none available"}`,
          `Estimated delay: ${Math.round(worst.queueLengthMeters / 30)} min`,
        ]));
      }
    }

    const vipStatus = statuses.get("lot-vip");
    if (vipStatus && vipStatus.occupancyPercent > 75) {
      recommendations.push(this.makeRec("Reserve VIP Parking", "VIP lot nearing capacity. Secure remaining VIP spaces for expected arrivals.", "urgent", "lot-vip", "VIP Parking", [
        `Current: ${vipStatus.occupancyPercent}% occupied (${vipStatus.available} spaces left)`,
        `${vipStatus.reserved} spaces currently reserved`,
        "Activate VIP valet overflow protocol if needed",
      ]));
    }

    const overflowActive = overflowLots.some((s) => s.occupancyPercent > 50);
    if (!overflowActive && fullLots.length >= 2) {
      const target = PARKING_LOTS.find((l) => l.type === "overflow");
      if (target) {
        recommendations.push(this.makeRec("Open Temporary Overflow Area", "Primary lots saturated. Activate overflow parking and deploy signage.", "urgent", target.id, target.name, [
          `${fullLots.length} lots completely full (${fullLots.map((s) => s.lotName).join(", ")})`,
          `${target.name} capacity: ${target.capacity} spaces`,
          "Deploy traffic staff to direct vehicles to overflow",
        ]));
      }
    }

    if (highQueue.length >= 2) {
      recommendations.push(this.makeRec("Delay Vehicle Entry", "Gate queue thresholds exceeded. Implement staggered entry for 15 minutes.", "high", highQueue[0].id, highQueue[0].name, [
        `Queue lengths: ${highQueue.map((r) => `${r.name}: ${r.queueLengthMeters}m`).join(", ")}`,
        "Temporary hold reduces gate congestion by estimated 30%",
        "Broadcast delay via digital signage and mobile app",
      ]));
    }

    if (congestedRoads.length > 0 || closedRoads.length > 0) {
      recommendations.push(this.makeRec("Deploy Traffic Staff", "Multiple roads affected. Deploy traffic management team to critical junctions.", "high", congestedRoads[0]?.id ?? closedRoads[0]?.id ?? "unknown", "Intersections", [
        `${congestedRoads.length} roads congested, ${closedRoads.length} roads closed`,
        "Manual traffic direction at affected gates",
        "Coordinate with security and event operations",
      ]));
    }

    const evStatus = statuses.get("lot-ev");
    if (evStatus && evStatus.evChargingUsed > evStatus.evChargingTotal * 0.85) {
      recommendations.push(this.makeRec("Manage EV Charging Demand", `${evStatus.evChargingUsed}/${evStatus.evChargingTotal} EV chargers in use. Advise incoming EV owners of wait times.`, "medium", "lot-ev", "EV Charging Station", [
        `Current usage: ${(evStatus.evChargingUsed / evStatus.evChargingTotal * 100).toFixed(0)}%`,
        `Estimated wait: ${Math.round((evStatus.evChargingTotal - evStatus.evChargingUsed) * 15)} min`,
        "Consider directing EVs to nearby off-site charging",
      ]));
    }

    const accessibleStatus = statuses.get("lot-accessible");
    if (accessibleStatus && accessibleStatus.occupancyPercent > 75) {
      recommendations.push(this.makeRec("Expand Accessible Parking", "Accessible parking nearing capacity. Convert nearby general spaces to accessible.", "medium", "lot-accessible", "Accessible Parking", [
        `Accessible lot: ${accessibleStatus.occupancyPercent}% full`,
        "Convert 10 general spaces to accessible per ADA guidelines",
        "Notify accessibility assistance team",
      ]));
    }

    const lowUtilLots = Array.from(statuses.values()).filter((s) => s.type === "general" && s.occupancyPercent < 30 && s.available > 100);
    for (const lot of lowUtilLots.slice(0, 2)) {
      recommendations.push(this.makeRec(`Promote ${lot.lotName}`, `${lot.lotName} has ${lot.available} available spaces. Direct incoming traffic via signage.`, "low", lot.lotId, lot.lotName, [
        `Current utilization: ${lot.occupancyPercent}%`,
        `${lot.available} spaces available`,
        "Update digital signage to direct traffic",
      ]));
    }

    if (alerts.filter((a) => !a.acknowledged).length > 3) {
      recommendations.push(this.makeRec("Acknowledge Pending Alerts", `${alerts.filter((a) => !a.acknowledged).length} unacknowledged alerts require review.`, "medium", "parking-system", "System", [
        "Unacknowledged alerts may indicate missed critical events",
        "Review and acknowledge to maintain situational awareness",
      ]));
    }

    return recommendations.slice(0, 8);
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = { urgent: "Immediate Action", high: "High Priority", medium: "Standard", low: "Informational" };
    return labels[priority] ?? "Standard";
  }

  private makeRec(action: string, detail: string, priority: "urgent" | "high" | "medium" | "low", locId: string, locName: string, reasoning: string[]): ParkingRecommendation {
    return {
      id: uid(),
      action,
      detail,
      priority,
      impact: this.estimatedImpact(priority),
      locationId: locId,
      locationName: locName,
      reasoning,
      confidence: Math.round(78 + Math.random() * 18),
      timestamp: new Date().toISOString(),
    };
  }

  private estimatedImpact(priority: string): string {
    const impacts: Record<string, string> = {
      urgent: "Prevents critical operational failure",
      high: "Significantly improves traffic flow",
      medium: "Optimizes resource utilization",
      low: "Minor operational enhancement",
    };
    return impacts[priority] ?? "Operational adjustment";
  }
}

export const recommendationEngine = new MockRecommendationEngine();

