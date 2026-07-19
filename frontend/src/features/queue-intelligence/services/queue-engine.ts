import type { QueuePoint, QueuePointStatus, QueueStatus, CounterStatus } from "../types";
import { QUEUE_POINTS, MENU_ITEMS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export interface IQueueEngine {
  getQueuePoints(): QueuePoint[];
  simulateStatuses(points: QueuePoint[]): Map<string, QueuePointStatus>;
  calculateHealth(statuses: Map<string, QueuePointStatus>): { avgWait: number; healthScore: number; satisfactionAvg: number };
}

export class MockQueueEngine implements IQueueEngine {
  private tick = 0;

  getQueuePoints(): QueuePoint[] {
    return QUEUE_POINTS;
  }

  simulateStatuses(points: QueuePoint[]): Map<string, QueuePointStatus> {
    this.tick++;
    const now = new Date().toISOString();
    const hour = new Date().getHours();
    const isEventWindow = hour >= 8 && hour <= 23;
    const eventPhase = this.eventPhase(hour);
    const map = new Map<string, QueuePointStatus>();

    for (const point of points) {
      const baseLoad = this.baseLoad(point.type, eventPhase);
      const wave = Math.sin(this.tick * 0.07 + parseInt(point.id.slice(-3), 36)) * 0.12;
      const noise = randf(-6, 6);
      const loadPct = this.clamp(baseLoad + wave * 100 + noise, 5, 98);
      const active = this.activeCounters(point.totalCounters, loadPct);
      const statuses = this.counterStatuses(active, point.totalCounters);

      const currentLength = Math.round((loadPct / 100) * point.totalCounters * rand(8, 18));
      const serviceSpeed = this.serviceSpeed(point.type, loadPct);
      const waitMin = Math.round((currentLength * serviceSpeed) / 60);

      map.set(point.id, {
        queuePointId: point.id,
        queuePointName: point.name,
        type: point.type,
        currentLength,
        estimatedWaitMin: Math.max(1, waitMin),
        serviceSpeedSec: serviceSpeed,
        activeCounters: active,
        totalCounters: point.totalCounters,
        counterStatuses: statuses,
        capacityUtilization: Math.round(loadPct),
        customerSatisfaction: this.satisfaction(waitMin, point.type),
        status: this.statusLabel(waitMin),
        lastUpdated: now,
      });
    }

    return map;
  }

  calculateHealth(statuses: Map<string, QueuePointStatus>): { avgWait: number; healthScore: number; satisfactionAvg: number } {
    const arr = Array.from(statuses.values());
    const avgWait = arr.reduce((s, q) => s + q.estimatedWaitMin, 0) / Math.max(1, arr.length);
    const avgSatisfaction = arr.reduce((s, q) => s + q.customerSatisfaction, 0) / Math.max(1, arr.length);
    const critical = arr.filter((q) => q.status === "critical").length;
    const congested = arr.filter((q) => q.status === "congested").length;
    const healthScore = this.clamp(100 - critical * 12 - congested * 5 - avgWait * 0.5, 0, 100);
    return { avgWait: Math.round(avgWait), healthScore: Math.round(healthScore), satisfactionAvg: parseFloat(avgSatisfaction.toFixed(1)) };
  }

  private eventPhase(hour: number): "pre" | "peak" | "mid" | "post" | "off" {
    if (hour >= 10 && hour <= 11) return "pre";
    if (hour >= 12 && hour <= 14) return "peak";
    if (hour >= 15 && hour <= 18) return "mid";
    if (hour >= 19 && hour <= 22) return "post";
    return "off";
  }

  private baseLoad(type: string, phase: string): number {
    const loads: Record<string, Record<string, number>> = {
      food_counter: { pre: 35, peak: 75, mid: 50, post: 60, off: 10 },
      beverage_counter: { pre: 30, peak: 70, mid: 45, post: 55, off: 8 },
      merchandise: { pre: 25, peak: 55, mid: 40, post: 50, off: 5 },
      restroom: { pre: 20, peak: 65, mid: 35, post: 45, off: 10 },
      security: { pre: 60, peak: 80, mid: 55, post: 50, off: 15 },
      entry_gate: { pre: 70, peak: 85, mid: 40, post: 30, off: 10 },
      customer_service: { pre: 25, peak: 40, mid: 30, post: 50, off: 8 },
      atm: { pre: 30, peak: 45, mid: 35, post: 55, off: 5 },
      ticket_booth: { pre: 55, peak: 70, mid: 35, post: 25, off: 5 },
      information: { pre: 30, peak: 50, mid: 25, post: 35, off: 5 },
    };
    return loads[type]?.[phase] ?? 30;
  }

  private activeCounters(total: number, loadPct: number): number {
    const needed = Math.ceil(total * (loadPct / 100) * 1.1);
    return this.clamp(needed, 1, total);
  }

  private counterStatuses(active: number, total: number): CounterStatus[] {
    const statuses: CounterStatus[] = [];
    for (let i = 0; i < total; i++) {
      if (i < active) statuses.push("open");
      else if (Math.random() < 0.05) statuses.push("breakdown");
      else statuses.push("closed");
    }
    return statuses.sort(() => Math.random() - 0.5);
  }

  private serviceSpeed(type: string, loadPct: number): number {
    const base: Record<string, number> = {
      food_counter: 120, beverage_counter: 30, merchandise: 45, restroom: 60,
      security: 25, entry_gate: 15, customer_service: 180, atm: 45,
      ticket_booth: 90, information: 60,
    };
    const speedPenalty = loadPct > 70 ? 1.4 : loadPct > 50 ? 1.15 : 1;
    return Math.round((base[type] ?? 60) * speedPenalty);
  }

  private satisfaction(waitMin: number, type: string): number {
    const tolerance: Record<string, number> = {
      food_counter: 15, beverage_counter: 8, merchandise: 12, restroom: 8,
      security: 10, entry_gate: 10, customer_service: 20, atm: 5,
      ticket_booth: 15, information: 10,
    };
    const tol = tolerance[type] ?? 10;
    if (waitMin <= tol) return randf(4.0, 5.0, 0);
    if (waitMin <= tol * 1.5) return randf(3.0, 4.0, 0);
    if (waitMin <= tol * 2) return randf(2.0, 3.0, 0);
    return randf(1.0, 2.0, 0);
  }

  private statusLabel(waitMin: number): QueueStatus {
    if (waitMin >= ALERT_THRESHOLDS.CRITICAL_QUEUE_MIN) return "critical";
    if (waitMin >= ALERT_THRESHOLDS.LONG_QUEUE_MIN) return "congested";
    if (waitMin >= 8) return "busy";
    return "normal";
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

const ALERT_THRESHOLDS = { LONG_QUEUE_MIN: 15, CRITICAL_QUEUE_MIN: 25 };

export const queueEngine = new MockQueueEngine();
