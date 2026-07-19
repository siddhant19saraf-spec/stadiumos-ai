import type { TrafficRoad, TrafficCondition, ParkingLotStatus, CongestionLevel, RoadStatus } from "../types";
import { TRAFFIC_ROADS, ALERT_THRESHOLDS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface ITrafficEngine {
  getRoads(): TrafficRoad[];
  simulateConditions(roads: TrafficRoad[], statuses: Map<string, ParkingLotStatus>): TrafficRoad[];
  computeTrafficHealth(roads: TrafficRoad[]): TrafficCondition;
  getCongestionLabel(pct: number): CongestionLevel;
  estimateDelay(road: TrafficRoad): number;
}

export class MockTrafficEngine implements ITrafficEngine {
  private tick = 0;

  getRoads(): TrafficRoad[] {
    return TRAFFIC_ROADS;
  }

  simulateConditions(roads: TrafficRoad[], statuses: Map<string, ParkingLotStatus>): TrafficRoad[] {
    this.tick++;
    const totalOcc = Array.from(statuses.values()).reduce((s, st) => s + st.occupied, 0);
    const totalCap = Array.from(statuses.values()).reduce((s, st) => s + st.totalSlots, 0);
    const occRatio = totalCap > 0 ? totalOcc / totalCap : 0;

    return roads.map((road) => {
      const hourFactor = this.hourFactor();
      const congestionBase = occRatio * 70 + hourFactor;
      const wave = Math.sin(this.tick * 0.05 + parseInt(road.id.slice(-3), 36)) * 8;
      const congestionPct = this.clamp(congestionBase + wave + randf(-5, 5), 5, 98);

      const speedRatio = 1 - (congestionPct / 100) * 0.7;
      const speed = Math.round(road.freeFlowSpeedKmph * speedRatio);
      const queue = Math.round(congestionPct * 3 + rand(-10, 20));
      const vehicles = Math.round(occRatio * 300 + congestionPct * 2 + rand(-30, 30));

      return {
        ...road,
        currentSpeedKmph: Math.max(2, speed),
        queueLengthMeters: Math.max(0, queue),
        congestionLevel: this.getCongestionLabel(congestionPct),
        vehicleCount: Math.max(5, vehicles),
        gateCongestionPercent: Math.round(congestionPct),
        status: road.status === "closed" ? "closed" : congestionPct > 85 ? "congested" : "open",
      };
    });
  }

  computeTrafficHealth(roads: TrafficRoad[]): TrafficCondition {
    const total = roads.length;
    const blocked = roads.filter((r) => r.status === "closed").length;
    const congested = roads.filter((r) => r.congestionLevel === "high" || r.congestionLevel === "severe").length;
    const avgSpeed = roads.reduce((s, r) => s + r.currentSpeedKmph, 0) / Math.max(1, total);
    const avgQueue = roads.reduce((s, r) => s + r.queueLengthMeters, 0) / Math.max(1, total);
    const avgGate = roads.reduce((s, r) => s + r.gateCongestionPercent, 0) / Math.max(1, total);
    const totalVeh = roads.reduce((s, r) => s + r.vehicleCount, 0);

    const speedScore = avgSpeed / 80 * 35;
    const queuePenalty = Math.min(30, avgQueue / 10);
    const congestionPenalty = (congested / Math.max(1, total)) * 25;
    const gatePenalty = (avgGate / 100) * 15;
    const health = this.clamp(100 - queuePenalty - congestionPenalty - gatePenalty + speedScore, 0, 100);

    return {
      totalVehicles: totalVeh,
      activeRoads: total - blocked,
      blockedRoads: blocked,
      congestedRoads: congested,
      avgSpeed: Math.round(avgSpeed),
      avgQueueLength: Math.round(avgQueue),
      trafficHealthScore: Math.round(health),
      gateCongestionAvg: Math.round(avgGate),
      lastUpdated: new Date().toISOString(),
    };
  }

  getCongestionLabel(pct: number): CongestionLevel {
    if (pct >= 75) return "severe";
    if (pct >= 55) return "high";
    if (pct >= 30) return "moderate";
    return "low";
  }

  estimateDelay(road: TrafficRoad): number {
    if (road.status === "closed") return 999;
    const ratio = road.currentSpeedKmph / Math.max(1, road.freeFlowSpeedKmph);
    return Math.round((1 - ratio) * 30 + road.queueLengthMeters / 50);
  }

  private hourFactor(): number {
    const h = new Date().getHours();
    if (h >= 7 && h <= 9) return 15;
    if (h >= 16 && h <= 19) return 20;
    if (h >= 22) return -5;
    if (h >= 0 && h <= 5) return -10;
    return 0;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const trafficEngine = new MockTrafficEngine();
