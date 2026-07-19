import { describe, it, expect } from "vitest";
import { recommendationEngine } from "../services/recommendation-engine";
import { queueEngine } from "../services/queue-engine";
import { inventoryEngine } from "../services/inventory-engine";
import { alertEngine } from "../services/alert-engine";
import { QUEUE_POINTS, MENU_ITEMS } from "../constants";

describe("RecommendationEngine", () => {
  it("should generate recommendations with full AI explainability", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });

    expect(Array.isArray(recs)).toBe(true);
    for (const rec of recs) {
      expect(rec).toHaveProperty("id");
      expect(rec).toHaveProperty("action");
      expect(rec).toHaveProperty("detail");
      expect(rec).toHaveProperty("priority");
      expect(rec).toHaveProperty("reasoning");
      expect(rec).toHaveProperty("contributingFactors");
      expect(rec).toHaveProperty("operationalImpact");
      expect(rec).toHaveProperty("estimatedImprovement");
      expect(rec).toHaveProperty("confidence");
      expect(rec).toHaveProperty("timestamp");

      expect(rec.reasoning.length).toBeGreaterThanOrEqual(1);
      expect(rec.contributingFactors.length).toBeGreaterThanOrEqual(1);
      expect(rec.confidence).toBeGreaterThanOrEqual(75);
      expect(rec.confidence).toBeLessThanOrEqual(100);
      expect(["urgent", "high", "medium", "low"]).toContain(rec.priority);
    }
  });

  it("should return at most 8 recommendations", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.length).toBeLessThanOrEqual(8);
  });

  it("should include operational impact and estimated improvement", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });

    for (const rec of recs) {
      expect(typeof rec.operationalImpact).toBe("string");
      expect(rec.operationalImpact.length).toBeGreaterThan(5);
      expect(typeof rec.estimatedImprovement).toBe("string");
      expect(rec.estimatedImprovement.length).toBeGreaterThan(5);
    }
  });
});
