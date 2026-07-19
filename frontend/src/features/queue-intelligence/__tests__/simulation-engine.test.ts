import { describe, it, expect } from "vitest";
import { simulationEngine } from "../services/simulation-engine";
import { queueEngine } from "../services/queue-engine";
import { QUEUE_POINTS, SCENARIO_CONFIGS } from "../constants";
import type { SimulationScenario } from "../types";

describe("SimulationEngine", () => {
  const scenarios = Object.keys(SCENARIO_CONFIGS) as SimulationScenario[];

  it("should return all available scenarios", () => {
    const available = simulationEngine.getAvailableScenarios();
    expect(available.length).toBe(scenarios.length);
    for (const s of available) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
      expect(s).toHaveProperty("description");
      expect(s).toHaveProperty("icon");
      expect(s).toHaveProperty("color");
      expect(s).toHaveProperty("tags");
    }
  });

  it.each(scenarios)("should apply scenario %s without errors", (scenario) => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const result = simulationEngine.applyScenario(scenario, QUEUE_POINTS, statuses);
    expect(result.size).toBe(QUEUE_POINTS.length);

    for (const [, s] of result) {
      expect(s.estimatedWaitMin).toBeGreaterThanOrEqual(1);
      expect(s.estimatedWaitMin).toBeLessThanOrEqual(60);
      expect(s.currentLength).toBeGreaterThanOrEqual(0);
      expect(s.currentLength).toBeLessThanOrEqual(500);
      expect(s.activeCounters).toBeGreaterThanOrEqual(1);
      expect(s.customerSatisfaction).toBeGreaterThanOrEqual(0);
      expect(s.customerSatisfaction).toBeLessThanOrEqual(5);
      expect(["normal", "busy", "congested", "critical"]).toContain(s.status);
    }
  });

  it("should handle halftime_rush by increasing food queue lengths", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const foodPoint = QUEUE_POINTS.find((p) => p.type === "food_counter")!;
    const before = statuses.get(foodPoint.id)!;
    const result = simulationEngine.applyScenario("halftime_rush", QUEUE_POINTS, statuses);
    const after = result.get(foodPoint.id)!;
    expect(after.currentLength).toBeGreaterThanOrEqual(before.currentLength);
    expect(after.estimatedWaitMin).toBeGreaterThanOrEqual(before.estimatedWaitMin);
  });

  it("should handle counter_failure by reducing active counters", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const foodPoint = QUEUE_POINTS.find((p) => p.type === "food_counter")!;
    const before = statuses.get(foodPoint.id)!;
    const result = simulationEngine.applyScenario("counter_failure", QUEUE_POINTS, statuses);
    const after = result.get(foodPoint.id)!;
    expect(after.activeCounters).toBeLessThanOrEqual(before.activeCounters);
    expect(after.counterStatuses.filter((c) => c === "breakdown").length).toBeGreaterThan(0);
  });

  it("should handle emergency_evacuation by reducing all queue lengths", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const beforeTotal = Array.from(statuses.values()).reduce((s, q) => s + q.currentLength, 0);
    const result = simulationEngine.applyScenario("emergency_evacuation", QUEUE_POINTS, statuses);
    const afterTotal = Array.from(result.values()).reduce((s, q) => s + q.currentLength, 0);
    expect(afterTotal).toBeLessThan(beforeTotal * 0.2);
  });

  it("should handle merchandise_drop by increasing merchandise queues", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const merchPoint = QUEUE_POINTS.find((p) => p.type === "merchandise")!;
    const before = statuses.get(merchPoint.id)!;
    const result = simulationEngine.applyScenario("merchandise_drop", QUEUE_POINTS, statuses);
    const after = result.get(merchPoint.id)!;
    expect(after.currentLength).toBeGreaterThanOrEqual(before.currentLength);
  });
});
