import { describe, it, expect } from "vitest";
import { recommendationEngine } from "../services/recommendation-engine";
import { parkingEngine } from "../services/parking-engine";
import { trafficEngine } from "../services/traffic-engine";
import { alertEngine } from "../services/alert-engine";
import { PARKING_LOTS, TRAFFIC_ROADS } from "../constants";

describe("RecommendationEngine", () => {
  it("should generate recommendations for current situation", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const alerts = alertEngine.evaluate(statuses, roads);
    const recommendations = recommendationEngine.generate({ statuses, roads, alerts });

    expect(Array.isArray(recommendations)).toBe(true);
    for (const rec of recommendations) {
      expect(rec).toHaveProperty("id");
      expect(rec).toHaveProperty("action");
      expect(rec).toHaveProperty("detail");
      expect(rec).toHaveProperty("priority");
      expect(rec).toHaveProperty("impact");
      expect(rec).toHaveProperty("locationId");
      expect(rec).toHaveProperty("reasoning");
      expect(rec).toHaveProperty("confidence");
      expect(rec).toHaveProperty("timestamp");

      expect(["urgent", "high", "medium", "low"]).toContain(rec.priority);
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
      expect(rec.reasoning.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should return at most 8 recommendations", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const alerts = alertEngine.evaluate(statuses, roads);
    const recommendations = recommendationEngine.generate({ statuses, roads, alerts });

    expect(recommendations.length).toBeLessThanOrEqual(8);
  });

  it("should generate recommendations with valid reasoning chains", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const alerts = alertEngine.evaluate(statuses, roads);
    const recommendations = recommendationEngine.generate({ statuses, roads, alerts });

    for (const rec of recommendations) {
      for (const reason of rec.reasoning) {
        expect(typeof reason).toBe("string");
        expect(reason.length).toBeGreaterThan(5);
      }
    }
  });

  it("should return proper priority labels", () => {
    expect(recommendationEngine.getPriorityLabel("urgent")).toBe("Immediate Action");
    expect(recommendationEngine.getPriorityLabel("high")).toBe("High Priority");
    expect(recommendationEngine.getPriorityLabel("medium")).toBe("Standard");
    expect(recommendationEngine.getPriorityLabel("low")).toBe("Informational");
    expect(recommendationEngine.getPriorityLabel("unknown")).toBe("Standard");
  });
});
