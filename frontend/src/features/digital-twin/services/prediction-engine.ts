import type { ZoneLiveStatus, StadiumZone, ZoneRecommendation } from "../types";

export interface IPredictionEngine {
  predict30m(statuses: Map<string, ZoneLiveStatus>, zones: StadiumZone[]): Map<string, ZoneLiveStatus>;
  predictZone(zoneId: string, status: ZoneLiveStatus): { occupancy30m: number; risk30m: number; confidence: number };
}

export class MockPredictionEngine implements IPredictionEngine {
  predict30m(statuses: Map<string, ZoneLiveStatus>, _zones: StadiumZone[]): Map<string, ZoneLiveStatus> {
    const updated = new Map(statuses);
    for (const [id, status] of updated) {
      const delta = Math.sin(Date.now() * 0.0001 + parseInt(id.slice(-3), 36)) * 8;
      updated.set(id, {
        ...status,
        predictedOccupancy30m: Math.round(Math.min(100, Math.max(0, status.occupancyPercent + delta))),
      });
    }
    return updated;
  }

  predictZone(_zoneId: string, status: ZoneLiveStatus): { occupancy30m: number; risk30m: number; confidence: number } {
    const delta = Math.sin(Date.now() * 0.0001) * 10;
    const occupancy30m = Math.round(Math.min(100, Math.max(0, status.occupancyPercent + delta)));
    const risk30m = Math.round(Math.min(100, Math.max(0, status.riskScore + delta * 0.5)));
    return { occupancy30m, risk30m, confidence: 85 + Math.floor(Math.random() * 12) };
  }
}

export const predictionEngine = new MockPredictionEngine();

