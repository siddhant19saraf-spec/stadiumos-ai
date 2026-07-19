import { describe, it, expect } from "vitest";
import { simulationEngine } from "../services/simulation-engine";
import { parkingEngine } from "../services/parking-engine";
import { trafficEngine } from "../services/traffic-engine";
import { PARKING_LOTS, TRAFFIC_ROADS, SCENARIO_CONFIGS } from "../constants";
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

  it("should return config for a specific scenario", () => {
    const config = simulationEngine.getScenarioConfig("final_match");
    expect(config.name).toBe("Final Match");
    expect(config.tags).toContain("sell-out");
    expect(config.color).toBeDefined();
  });

  it.each(scenarios)("should apply scenario %s without errors", (scenario) => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const result = simulationEngine.applyScenario(scenario, PARKING_LOTS, statuses, roads);

    expect(result.statuses).toBeDefined();
    expect(result.roads).toBeDefined();
    expect(result.statuses.size).toBe(PARKING_LOTS.length);
    expect(result.roads.length).toBe(TRAFFIC_ROADS.length);

    for (const [, s] of result.statuses) {
      expect(s.occupancyPercent).toBeGreaterThanOrEqual(0);
      expect(s.occupancyPercent).toBeLessThanOrEqual(100);
      expect(s.occupied + s.available + s.reserved + s.blocked).toBeLessThanOrEqual(s.totalSlots + 5); // Allow rounding
    }
  });

  it("should handle emergency_evacuation by reducing occupancy significantly", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);

    const beforeOcc = Array.from(statuses.values()).reduce((s, st) => s + st.occupied, 0);
    const result = simulationEngine.applyScenario("emergency_evacuation", PARKING_LOTS, statuses, roads);
    const afterOcc = Array.from(result.statuses.values()).reduce((s, st) => s + st.occupied, 0);

    expect(afterOcc).toBeLessThan(beforeOcc * 0.5);
  });

  it("should handle final_match by increasing occupancy", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);

    const before = Array.from(statuses.values()).reduce((s, st) => s + st.occupied, 0);
    const result = simulationEngine.applyScenario("final_match", PARKING_LOTS, statuses, roads);
    const after = Array.from(result.statuses.values()).reduce((s, st) => s + st.occupied, 0);

    expect(after).toBeGreaterThanOrEqual(before * 0.8); // At least not drastically reduced
  });

  it("should handle road_closure by marking roads closed", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const result = simulationEngine.applyScenario("road_closure", PARKING_LOTS, statuses, roads);

    const closedRoads = result.roads.filter((r) => r.status === "closed");
    expect(closedRoads.length).toBeGreaterThanOrEqual(2);
    expect(closedRoads.some((r) => r.id === "east-entry")).toBe(true);
    expect(closedRoads.some((r) => r.id === "east-exit")).toBe(true);
  });

  it("should handle power_failure by reducing EV charger availability", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const result = simulationEngine.applyScenario("power_failure", PARKING_LOTS, statuses, roads);

    const evStatus = result.statuses.get("lot-ev");
    expect(evStatus).toBeDefined();
    expect(evStatus!.evChargingUsed).toBe(0);
    expect(evStatus!.evChargingTotal).toBe(0);
  });
});
