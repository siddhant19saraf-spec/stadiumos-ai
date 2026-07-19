// @ts-nocheck
import type { ParkingLot, ParkingLotStatus, ParkingLotType } from "../types";
import { PARKING_LOTS, LOT_CAPACITY_DETAILS, ALERT_THRESHOLDS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface IParkingEngine {
  getLots(): ParkingLot[];
  simulateStatuses(lots: ParkingLot[]): Map<string, ParkingLotStatus>;
  getLotById(lotId: string): ParkingLot | undefined;
  calculateOccupancyTrend(current: ParkingLotStatus, previous?: ParkingLotStatus): "rising" | "falling" | "stable";
}

export class MockParkingEngine implements IParkingEngine {
  private tick = 0;
  private previousStatuses = new Map<string, ParkingLotStatus>();

  getLots(): ParkingLot[] {
    return PARKING_LOTS;
  }

  simulateStatuses(lots: ParkingLot[]): Map<string, ParkingLotStatus> {
    this.tick++;
    const now = new Date().toISOString();
    const map = new Map<string, ParkingLotStatus>();
    const isEventHour = this.isEventWindow();
    const hourFactor = this.hourFactor();

    for (const lot of lots) {
      const detail = LOT_CAPACITY_DETAILS[lot.id];
      const prev = this.previousStatuses.get(lot.id);
      const totalSlots = lot.capacity;
      const baseOcc = this.getBaseOccupancy(lot.type, isEventHour);
      const wave = Math.sin(this.tick * 0.06 + parseInt(lot.id.slice(-3), 36)) * 0.06;
      const noise = randf(-3, 3);
      const occPct = this.clamp(baseOcc + wave * 100 + noise + hourFactor, 3, 99);
      const occupied = Math.round((occPct / 100) * totalSlots);
      const reserved = lot.type === "vip" ? rand(10, 30) : lot.type === "accessible" ? rand(5, 15) : rand(2, 8);
      const blocked = rand(0, Math.max(1, Math.round(totalSlots * 0.02)));

      const status: ParkingLotStatus = {
        lotId: lot.id,
        lotName: lot.name,
        type: lot.type,
        totalSlots,
        occupied: Math.min(occupied, totalSlots - reserved - blocked),
        available: Math.max(0, totalSlots - occupied - reserved - blocked),
        reserved: Math.min(reserved, totalSlots - occupied - blocked),
        blocked: Math.min(blocked, totalSlots - occupied - reserved),
        occupancyPercent: Math.round(occPct),
        evChargingUsed: lot.type === "ev_charging" ? rand(40, 180) : rand(0, Math.round(totalSlots * 0.12)),
        evChargingTotal: lot.type === "ev_charging" ? 200 : Math.round(totalSlots * 0.15),
        vehicleTurnoverRate: randf(0.3, 2.5, 1),
        avgParkingDurationMin: lot.type === "vip" ? rand(90, 180) : lot.type === "rideshare" ? rand(5, 20) : rand(45, 240),
        predictedFullTime: occPct > 80 ? `${rand(15, 45)} min` : null,
        lastUpdated: now,
      };

      map.set(lot.id, status);
    }

    this.previousStatuses = map;
    return map;
  }

  getLotById(lotId: string): ParkingLot | undefined {
    return PARKING_LOTS.find((l) => l.id === lotId);
  }

  calculateOccupancyTrend(current: ParkingLotStatus, previous?: ParkingLotStatus): "rising" | "falling" | "stable" {
    if (!previous) return "stable";
    const diff = current.occupancyPercent - previous.occupancyPercent;
    if (Math.abs(diff) < 3) return "stable";
    return diff > 0 ? "rising" : "falling";
  }

  private isEventWindow(): boolean {
    const h = new Date().getHours();
    return h >= 8 && h <= 23;
  }

  private hourFactor(): number {
    const h = new Date().getHours();
    if (h >= 10 && h <= 12) return 8;
    if (h >= 17 && h <= 20) return 12;
    if (h >= 21 && h <= 23) return -5;
    if (h >= 0 && h <= 6) return -15;
    return 0;
  }

  private getBaseOccupancy(type: ParkingLotType, isEvent: boolean): number {
    const base: Record<string, number> = {
      general: 58, vip: 65, staff: 60, accessible: 45, ev_charging: 55,
      overflow: 15, media: 50, bus: 40, rental: 35, rideshare: 55,
    };
    const eventBoost: Record<string, number> = {
      general: 20, vip: 15, staff: 10, accessible: 25, ev_charging: 18,
      overflow: 30, media: 25, bus: 20, rental: 10, rideshare: 15,
    };
    const b = base[type] ?? 50;
    return isEvent ? b + (eventBoost[type] ?? 10) : b;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const parkingEngine = new MockParkingEngine();

