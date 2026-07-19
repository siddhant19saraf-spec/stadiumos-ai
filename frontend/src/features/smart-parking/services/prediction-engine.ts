import type { ParkingPrediction, TrafficPrediction, ParkingLot, ParkingLotStatus, TrafficRoad, CongestionLevel } from "../types";
import { PARKING_LOTS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface IPredictionEngine {
  predictOccupancy(lots: ParkingLot[], statuses: Map<string, ParkingLotStatus>): ParkingPrediction[];
  predictTraffic(roads: TrafficRoad[], statuses: Map<string, ParkingLotStatus>): TrafficPrediction[];
  predictOverflowProbability(lots: ParkingLot[], statuses: Map<string, ParkingLotStatus>): Map<string, number>;
  predictPeakTime(statuses: Map<string, ParkingLotStatus>): string;
}

export class MockPredictionEngine implements IPredictionEngine {
  private tick = 0;

  predictOccupancy(lots: ParkingLot[], statuses: Map<string, ParkingLotStatus>): ParkingPrediction[] {
    this.tick++;
    const now = new Date().toISOString();
    const hour = new Date().getHours();
    const eventFactor = hour >= 10 && hour <= 21 ? 1 : 0.4;

    return lots.map((lot) => {
      const current = statuses.get(lot.id);
      const base = current ? current.occupancyPercent : 50;
      const trend = this.getTrend(lot.id, base);
      const delta = trend * randf(2, 10);

      const pred30 = this.clamp(base + delta * 0.5 + randf(-3, 3), 2, 100);
      const pred60 = this.clamp(base + delta * 1.2 + randf(-5, 5), 2, 100);
      const pred120 = this.clamp(base + delta * 2.0 + randf(-8, 8), 2, 100);
      const arrivalRate = this.arrivalRate(lot.type, hour, eventFactor);
      const departureRate = this.departureRate(lot.type, hour, eventFactor);

      return {
        lotId: lot.id,
        predictedOccupancy30m: Math.round(pred30),
        predictedOccupancy60m: Math.round(pred60),
        predictedOccupancy120m: Math.round(pred120),
        arrivalRatePerMin: arrivalRate,
        departureRatePerMin: departureRate,
        peakOccupancyTime: this.predictPeakTimeFrom(base, hour),
        overflowProbability: this.calcOverflowProb(lot, pred60),
        evDemandPercent: lot.type === "ev_charging" ? randf(60, 95, 0) : randf(10, 35, 0),
        accessibleDemandPercent: lot.type === "accessible" ? randf(50, 85, 0) : randf(5, 20, 0),
        confidence: randf(78, 96, 0),
        timestamp: now,
      };
    });
  }

  predictTraffic(roads: TrafficRoad[], statuses: Map<string, ParkingLotStatus>): TrafficPrediction[] {
    const now = new Date().toISOString();
    const totalOcc = Array.from(statuses.values()).reduce((s, st) => s + st.occupied, 0);
    const totalCap = Array.from(statuses.values()).reduce((s, st) => s + st.totalSlots, 0);
    const occRatio = totalCap > 0 ? totalOcc / totalCap : 0;

    return roads.map((road) => {
      const baseCongestion = occRatio * 70;
      const wave = Math.sin(this.tick * 0.04 + parseInt(road.id.slice(-3), 36)) * 10;
      const congestion30 = this.clamp(baseCongestion + wave + randf(-5, 10), 5, 98);
      const speed30 = Math.round(road.freeFlowSpeedKmph * (1 - (congestion30 / 100) * 0.65));
      const queue30 = Math.round(congestion30 * 3.5 + rand(-10, 15));

      return {
        roadId: road.id,
        predictedCongestion30m: this.toCongestionLabel(congestion30),
        predictedSpeed30m: Math.max(2, speed30),
        predictedQueue30m: Math.max(0, queue30),
        surgeProbability: randf(5, 45, 0),
        estimatedClearTime: congestion30 > 70 ? `${rand(30, 90)} min` : null,
        confidence: randf(75, 93, 0),
        timestamp: now,
      };
    });
  }

  predictOverflowProbability(lots: ParkingLot[], statuses: Map<string, ParkingLotStatus>): Map<string, number> {
    const probs = new Map<string, number>();
    for (const lot of lots) {
      const s = statuses.get(lot.id);
      if (!s) { probs.set(lot.id, 0); continue; }
      const prob = this.calcOverflowProb(lot, s.occupancyPercent + 10);
      probs.set(lot.id, prob);
    }
    return probs;
  }

  predictPeakTime(statuses: Map<string, ParkingLotStatus>): string {
    const hour = new Date().getHours();
    const avgOcc = Array.from(statuses.values()).reduce((s, st) => s + st.occupancyPercent, 0) / Math.max(1, statuses.size);
    if (avgOcc < 40) return `${hour + 2}:00`;
    if (avgOcc < 65) return `${hour + 1}:00`;
    return `${Math.min(23, hour)}:30`;
  }

  private getTrend(lotId: string, base: number): number {
    if (lotId.startsWith("lot-overflow")) return base > 40 ? 0.8 : 0.3;
    if (lotId.startsWith("lot-vip")) return 0.2;
    if (lotId.startsWith("lot-ev")) return 0.5;
    return base < 30 ? 0.7 : base > 80 ? -0.3 : 0.4;
  }

  private arrivalRate(type: string, hour: number, eventFactor: number): number {
    const base: Record<string, number> = {
      general: 8, vip: 3, staff: 4, accessible: 2, ev_charging: 4,
      overflow: 2, media: 3, bus: 1, rental: 2, rideshare: 5,
    };
    const peakBoost = hour >= 10 && hour <= 12 ? 6 : hour >= 17 && hour <= 19 ? 8 : 0;
    return Math.max(0.5, (base[type] ?? 4) * eventFactor + peakBoost + randf(-1, 2, 0));
  }

  private departureRate(type: string, hour: number, eventFactor: number): number {
    const base: Record<string, number> = {
      general: 3, vip: 2, staff: 5, accessible: 2, ev_charging: 3,
      overflow: 4, media: 3, bus: 1, rental: 4, rideshare: 15,
    };
    const peakBoost = hour >= 20 && hour <= 22 ? 6 : 0;
    return Math.max(0.5, (base[type] ?? 3) * eventFactor + peakBoost + randf(-1, 2, 0));
  }

  private calcOverflowProb(lot: ParkingLot, projectedOcc: number): number {
    if (lot.type === "overflow") return projectedOcc > 60 ? 75 : 20;
    return Math.max(0, Math.min(100, (projectedOcc - 75) * 3 + randf(-5, 10, 0)));
  }

  private predictPeakTimeFrom(occ: number, hour: number): string {
    if (occ > 80) return `${hour}:${String(rand(0, 59)).padStart(2, "0")}`;
    const peakDelta = occ > 50 ? rand(30, 90) : rand(90, 180);
    const totalMin = hour * 60 + peakDelta;
    const ph = Math.floor(totalMin / 60) % 24;
    return `${String(ph).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
  }

  private toCongestionLabel(pct: number): CongestionLevel {
    if (pct >= 75) return "severe";
    if (pct >= 55) return "high";
    if (pct >= 30) return "moderate";
    return "low";
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const predictionEngine = new MockPredictionEngine();

