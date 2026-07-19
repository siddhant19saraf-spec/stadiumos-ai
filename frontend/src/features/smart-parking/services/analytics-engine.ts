// @ts-nocheck
import type { ParkingAnalytics, ParkingLotStatus, TrafficRoad, TrafficCondition } from "../types";

function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface IAnalyticsEngine {
  compute(statuses: Map<string, ParkingLotStatus>, traffic: TrafficCondition): ParkingAnalytics;
  trend(current: ParkingAnalytics, previous?: ParkingAnalytics): Record<string, "up" | "down" | "stable">;
}

export class MockAnalyticsEngine implements IAnalyticsEngine {
  private previous: ParkingAnalytics | null = null;

  compute(statuses: Map<string, ParkingLotStatus>, traffic: TrafficCondition): ParkingAnalytics {
    const arr = Array.from(statuses.values());
    const avgOcc = arr.length > 0 ? arr.reduce((s, st) => s + st.occupancyPercent, 0) / arr.length : 0;
    const peakOcc = arr.length > 0 ? Math.max(...arr.map((s) => s.occupancyPercent)) : 0;
    const avgDuration = arr.length > 0 ? arr.reduce((s, st) => s + st.avgParkingDurationMin, 0) / arr.length : 0;
    const avgTurnover = arr.length > 0 ? arr.reduce((s, st) => s + st.vehicleTurnoverRate, 0) / arr.length : 0;
    const avgEvUsage = arr.filter((s) => s.evChargingTotal > 0)
      .reduce((s, st) => s + (st.evChargingTotal > 0 ? st.evChargingUsed / st.evChargingTotal * 100 : 0), 0) / Math.max(1, arr.filter((s) => s.evChargingTotal > 0).length);
    const accessibleStatus = statuses.get("lot-accessible");
    const accessibleUtil = accessibleStatus ? accessibleStatus.occupancyPercent : 0;
    const overflowStatus = statuses.get("lot-overflow");
    const overflowUtil = overflowStatus ? overflowStatus.occupancyPercent : 0;

    const congestedCount = arr.filter((s) => s.occupancyPercent > 80).length;
    const queueHealth = Math.max(0, 100 - congestedCount * 8);

    const totalVehicles = arr.reduce((s, st) => s + st.occupied, 0);
    const optimizationScore = this.computeOptimizationScore(arr, traffic);

    const peakHour = new Date().getHours();
    const peakTime = `${String(Math.max(10, peakHour - 2)).padStart(2, "0")}:00 - ${String(peakHour).padStart(2, "0")}:00`;

    const result: ParkingAnalytics = {
      avgOccupancyPercent: Math.round(avgOcc),
      peakUtilizationPercent: Math.round(peakOcc),
      peakTime,
      avgParkingDurationMin: Math.round(avgDuration),
      vehicleTurnoverAvg: parseFloat(avgTurnover.toFixed(1)),
      trafficDelayMin: Math.round(traffic.avgQueueLength / 30 * 5),
      aiOptimizationScore: Math.round(optimizationScore),
      totalVehiclesProcessed: totalVehicles,
      avgEvChargerUsage: Math.round(avgEvUsage),
      accessibleUtilization: Math.round(accessibleUtil),
      overflowUtilization: Math.round(overflowUtil),
      queueHealthIndex: Math.round(queueHealth),
    };

    this.previous = result;
    return result;
  }

  trend(current: ParkingAnalytics, _previous?: ParkingAnalytics): Record<string, "up" | "down" | "stable"> {
    const prev = _previous ?? this.previous;
    if (!prev) return {};
    const result: Record<string, "up" | "down" | "stable"> = {};
    const keys: (keyof ParkingAnalytics)[] = [
      "avgOccupancyPercent", "vehicleTurnoverAvg", "aiOptimizationScore",
      "queueHealthIndex", "avgEvChargerUsage",
    ];
    for (const key of keys) {
      const diff = (current[key] as number) - ((prev?.[key] as number) ?? current[key]);
      result[key] = Math.abs(diff) < 3 ? "stable" : diff > 0 ? "up" : "down";
    }
    return result;
  }

  private computeOptimizationScore(arr: ParkingLotStatus[], traffic: TrafficCondition): number {
    const occScore = Math.max(0, 100 - Math.abs(60 - arr.reduce((s, st) => s + st.occupancyPercent, 0) / Math.max(1, arr.length)) * 0.5);
    const turnoverScore = Math.min(30, arr.reduce((s, st) => s + st.vehicleTurnoverRate, 0) / Math.max(1, arr.length) * 10);
    const queuePenalty = Math.min(20, traffic.avgQueueLength / 20);
    const healthScore = traffic.trafficHealthScore * 0.3;
    return this.clamp(occScore + turnoverScore + healthScore - queuePenalty, 0, 100);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const analyticsEngine = new MockAnalyticsEngine();

