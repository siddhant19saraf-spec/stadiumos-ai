import { describe, it, expect } from "vitest";
import { queueEngine } from "../services/queue-engine";
import { QUEUE_POINTS } from "../constants";

describe("QueueEngine", () => {
  it("should return all queue points", () => {
    const points = queueEngine.getQueuePoints();
    expect(points.length).toBeGreaterThanOrEqual(20);
    expect(points[0]).toHaveProperty("id");
    expect(points[0]).toHaveProperty("type");
    expect(points[0]).toHaveProperty("totalCounters");
    expect(points[0]).toHaveProperty("coordinates");
  });

  it("should simulate statuses for all points", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    expect(statuses.size).toBe(QUEUE_POINTS.length);

    for (const [, s] of statuses) {
      expect(s).toHaveProperty("queuePointId");
      expect(s).toHaveProperty("currentLength");
      expect(s).toHaveProperty("estimatedWaitMin");
      expect(s).toHaveProperty("activeCounters");
      expect(s).toHaveProperty("totalCounters");
      expect(s).toHaveProperty("customerSatisfaction");
      expect(s).toHaveProperty("status");
      expect(s.currentLength).toBeGreaterThanOrEqual(0);
      expect(s.estimatedWaitMin).toBeGreaterThanOrEqual(1);
      expect(s.activeCounters).toBeGreaterThanOrEqual(1);
      expect(s.activeCounters).toBeLessThanOrEqual(s.totalCounters);
      expect(s.customerSatisfaction).toBeGreaterThanOrEqual(0);
      expect(s.customerSatisfaction).toBeLessThanOrEqual(5);
      expect(["normal", "busy", "congested", "critical"]).toContain(s.status);
    }
  });

  it("should include all queue point types", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const types = new Set(Array.from(statuses.values()).map((s) => s.type));
    expect(types.has("food_counter")).toBe(true);
    expect(types.has("beverage_counter")).toBe(true);
    expect(types.has("merchandise")).toBe(true);
    expect(types.has("restroom")).toBe(true);
    expect(types.has("security")).toBe(true);
    expect(types.has("entry_gate")).toBe(true);
  });

  it("should calculate health metrics correctly", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const health = queueEngine.calculateHealth(statuses);
    expect(health).toHaveProperty("avgWait");
    expect(health).toHaveProperty("healthScore");
    expect(health).toHaveProperty("satisfactionAvg");
    expect(health.avgWait).toBeGreaterThanOrEqual(1);
    expect(health.healthScore).toBeGreaterThanOrEqual(0);
    expect(health.healthScore).toBeLessThanOrEqual(100);
    expect(health.satisfactionAvg).toBeGreaterThan(0);
  });

  it("should assign valid counter statuses", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    for (const [, s] of statuses) {
      expect(s.counterStatuses.length).toBe(s.totalCounters);
      for (const cs of s.counterStatuses) {
        expect(["open", "closed", "limited", "breakdown"]).toContain(cs);
      }
    }
  });
});
