// @ts-nocheck
import type { ZoneRecommendation, ZoneLiveStatus, StadiumZone } from "../types";
import { digitalTwinEngine } from "./digital-twin-engine";

export interface IRecommendationEngine {
  getForZone(zoneId: string, status: ZoneLiveStatus): ZoneRecommendation;
  getForAllHighRisk(statuses: Map<string, ZoneLiveStatus>, threshold?: number): ZoneRecommendation[];
}

export class MockRecommendationEngine implements IRecommendationEngine {
  getForZone(zoneId: string, status: ZoneLiveStatus): ZoneRecommendation {
    return digitalTwinEngine.generateZoneRecommendation(zoneId, status);
  }

  getForAllHighRisk(statuses: Map<string, ZoneLiveStatus>, threshold = 70): ZoneRecommendation[] {
    const recs: ZoneRecommendation[] = [];
    for (const [id, status] of statuses) {
      if (status.riskScore > threshold || status.occupancyPercent > 75) {
        recs.push(this.getForZone(id, status));
      }
    }
    return recs.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.riskLevel] - order[b.riskLevel];
    }).slice(0, 8);
  }
}

export const recommendationEngine = new MockRecommendationEngine();

