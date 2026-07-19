import type { ResourceAllocation, Match, Venue, ResourceType } from "../types";
import { RESOURCE_REQUIREMENTS } from "../constants";

export interface IOptimizationEngine {
  optimizeResources(matches: Match[], venues: Venue[]): ResourceAllocation[];
  reallocate(resources: ResourceAllocation[], matchId: string, venueId: string): ResourceAllocation[];
}

export class MockOptimizationEngine implements IOptimizationEngine {
  optimizeResources(matches: Match[], venues: Venue[]): ResourceAllocation[] {
    return (Object.entries(RESOURCE_REQUIREMENTS) as [ResourceType, { base: number; perThousandSpectators: number }][]).map(([type, req]) => {
      let totalRequired = req.base;
      let totalAllocated = 0;
      let totalAvailable = 0;

      for (const match of matches) {
        const venue = venues.find((v) => v.id === match.venueId);
        const capacity = venue?.capacity ?? 50000;
        const spectators = match.attendance || Math.round(capacity * 0.75);
        const matchRequired = req.base + Math.round((spectators / 1000) * req.perThousandSpectators);

        const variance = 0.8 + Math.random() * 0.4;
        const matchAllocated = Math.round(matchRequired * variance);
        const matchAvailable = Math.round(matchRequired * (0.9 + Math.random() * 0.3));

        totalRequired += matchRequired;
        totalAllocated += matchAllocated;
        totalAvailable += matchAvailable;
      }

      const util = totalAvailable > 0 ? (totalAllocated / totalAvailable) * 100 : 0;
      return {
        type,
        required: totalRequired,
        allocated: totalAllocated,
        available: totalAvailable,
        utilizationPercent: Math.round(util),
        status: totalAllocated >= totalRequired ? "sufficient" as const : "shortage" as const,
        teams: [`${type}-pool-1`, `${type}-pool-2`],
      };
    });
  }

  reallocate(resources: ResourceAllocation[], _matchId: string, _venueId: string): ResourceAllocation[] {
    return resources.map((r) => {
      if (r.status === "shortage") {
        const additional = Math.round(r.required * 0.2);
        return {
          ...r,
          allocated: r.allocated + additional,
          available: r.available + additional,
          utilizationPercent: Math.round(((r.allocated + additional) / (r.available + additional)) * 100),
          status: r.allocated + additional >= r.required ? "sufficient" : "shortage",
        };
      }
      return r;
    });
  }
}

export const optimizationEngine = new MockOptimizationEngine();
