import type { QueuePrediction, QueuePoint, QueuePointStatus } from "../types";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}

export interface IPredictionEngine {
  predictQueues(points: QueuePoint[], statuses: Map<string, QueuePointStatus>): QueuePrediction[];
  predictOverload(statuses: Map<string, QueuePointStatus>): Array<{ id: string; probability: number; timeToCritical: string }>;
}

export class MockPredictionEngine implements IPredictionEngine {
  private tick = 0;

  predictQueues(points: QueuePoint[], statuses: Map<string, QueuePointStatus>): QueuePrediction[] {
    this.tick++;
    const now = new Date().toISOString();
    const hour = new Date().getHours();

    return points.map((point) => {
      const current = statuses.get(point.id);
      const baseLength = current?.currentLength ?? 50;
      const baseWait = current?.estimatedWaitMin ?? 10;
      const growthTrend = this.growthTrend(point.type, hour);
      const wave15 = Math.sin(this.tick * 0.08 + parseInt(point.id.slice(-3), 36)) * 0.1;
      const wave30 = Math.sin(this.tick * 0.05 + parseInt(point.id.slice(-3), 36)) * 0.15;

      const length15 = this.clamp(Math.round(baseLength * (1 + growthTrend * 0.3 + wave15) + rand(-3, 5)), 0, 500);
      const length30 = this.clamp(Math.round(baseLength * (1 + growthTrend * 0.6 + wave30) + rand(-5, 10)), 0, 500);
      const wait15 = this.clamp(Math.round(baseWait * (1 + growthTrend * 0.25 + wave15)), 1, 60);
      const wait30 = this.clamp(Math.round(baseWait * (1 + growthTrend * 0.5 + wave30)), 1, 60);
      const overloadProb = this.overloadProbability(current, growthTrend);
      const abandonment = this.abandonmentRate(baseWait, point.type);

      return {
        queuePointId: point.id,
        predictedLength15m: length15,
        predictedLength30m: length30,
        predictedWait15m: wait15,
        predictedWait30m: wait30,
        peakDemandTime: this.peakTime(hour, point.type),
        overloadProbability: overloadProb,
        abandonmentRate: abandonment,
        recommendedCounters: this.recommendedCounters(point.totalCounters, length30, point.type),
        confidence: randf(80, 96, 0),
        timestamp: now,
      };
    });
  }

  predictOverload(statuses: Map<string, QueuePointStatus>): Array<{ id: string; probability: number; timeToCritical: string }> {
    const result: Array<{ id: string; probability: number; timeToCritical: string }> = [];
    for (const [id, s] of statuses) {
      if (s.status === "congested" || s.status === "critical") {
        const prob = Math.min(95, s.capacityUtilization * 0.8 + randf(5, 15, 0));
        const min = s.estimatedWaitMin > 20 ? rand(5, 15) : rand(15, 30);
        result.push({ id, probability: Math.round(prob), timeToCritical: `${min} min` });
      }
    }
    return result.sort((a, b) => b.probability - a.probability);
  }

  private growthTrend(type: string, hour: number): number {
    if (hour >= 11 && hour <= 13) return type === "food_counter" ? 0.8 : type === "beverage_counter" ? 0.6 : 0.3;
    if (hour >= 18 && hour <= 20) return type === "food_counter" ? 0.7 : type === "beverage_counter" ? 0.7 : 0.4;
    if (hour >= 7 && hour <= 9) return type === "entry_gate" || type === "security" ? 0.9 : 0.2;
    if (hour >= 21 && hour <= 23) return type === "merchandise" ? 0.3 : -0.1;
    return 0.1;
  }

  private overloadProbability(current: QueuePointStatus | undefined, growth: number): number {
    if (!current) return 5;
    const base = current.capacityUtilization;
    const overload = this.clamp((base / 100) * 60 + growth * 30 + randf(-5, 10, 0), 0, 98);
    return Math.round(overload);
  }

  private abandonmentRate(waitMin: number, type: string): number {
    const tolerance: Record<string, number> = {
      food_counter: 15, beverage_counter: 6, merchandise: 12, restroom: 5,
      security: 10, entry_gate: 8, customer_service: 20, atm: 3,
      ticket_booth: 12, information: 8,
    };
    const tol = tolerance[type] ?? 10;
    if (waitMin <= tol) return randf(1, 5, 0);
    if (waitMin <= tol * 1.5) return randf(5, 15, 0);
    if (waitMin <= tol * 2) return randf(15, 30, 0);
    return randf(30, 55, 0);
  }

  private peakTime(hour: number, type: string): string {
    const offsets: Record<string, number> = {
      food_counter: 60, beverage_counter: 45, merchandise: 30,
      restroom: 20, security: -10, entry_gate: -20,
    };
    const offset = offsets[type] ?? 30;
    const peakMin = hour * 60 + 30 + offset;
    const h = Math.floor(peakMin / 60) % 24;
    return `${String(h).padStart(2, "0")}:${String(peakMin % 60).padStart(2, "0")}`;
  }

  private recommendedCounters(total: number, predictedLength: number, type: string): number {
    const perCounter = type === "food_counter" ? 15 : type === "beverage_counter" ? 30 : type === "merchandise" ? 12 : 20;
    const needed = Math.ceil(predictedLength / perCounter);
    return this.clamp(needed, 1, total);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const predictionEngine = new MockPredictionEngine();
