import { describe, it, expect } from "vitest";
import { trafficEngine } from "../services/traffic-engine";
import { TRAFFIC_ROADS } from "../constants";
import { parkingEngine } from "../services/parking-engine";
import { PARKING_LOTS } from "../constants";

describe("TrafficEngine", () => {
  it("should return all roads", () => {
    const roads = trafficEngine.getRoads();
    expect(roads.length).toBeGreaterThanOrEqual(8);
    expect(roads[0]).toHaveProperty("id");
    expect(roads[0]).toHaveProperty("direction");
    expect(roads[0]).toHaveProperty("status");
    expect(roads[0]).toHaveProperty("currentSpeedKmph");
    expect(roads[0]).toHaveProperty("freeFlowSpeedKmph");
    expect(roads[0]).toHaveProperty("congestionLevel");
  });

  it("should simulate traffic conditions", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    expect(roads.length).toBe(TRAFFIC_ROADS.length);

    for (const road of roads) {
      expect(road.currentSpeedKmph).toBeGreaterThanOrEqual(2);
      expect(road.currentSpeedKmph).toBeLessThanOrEqual(road.freeFlowSpeedKmph);
      expect(road.queueLengthMeters).toBeGreaterThanOrEqual(0);
      expect(road.vehicleCount).toBeGreaterThanOrEqual(5);
      expect(road.gateCongestionPercent).toBeGreaterThanOrEqual(0);
      expect(road.gateCongestionPercent).toBeLessThanOrEqual(100);
      expect(["low", "moderate", "high", "severe"]).toContain(road.congestionLevel);
    }
  });

  it("should compute traffic health metrics", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const health = trafficEngine.computeTrafficHealth(roads);

    expect(health).toHaveProperty("totalVehicles");
    expect(health).toHaveProperty("activeRoads");
    expect(health).toHaveProperty("blockedRoads");
    expect(health).toHaveProperty("congestedRoads");
    expect(health).toHaveProperty("avgSpeed");
    expect(health).toHaveProperty("avgQueueLength");
    expect(health).toHaveProperty("trafficHealthScore");
    expect(health).toHaveProperty("gateCongestionAvg");

    expect(health.trafficHealthScore).toBeGreaterThanOrEqual(0);
    expect(health.trafficHealthScore).toBeLessThanOrEqual(100);
    expect(health.activeRoads + health.blockedRoads).toBe(roads.length);
    expect(health.avgSpeed).toBeGreaterThan(0);
  });

  it("should classify congestion levels correctly", () => {
    expect(trafficEngine.getCongestionLabel(10)).toBe("low");
    expect(trafficEngine.getCongestionLabel(30)).toBe("moderate");
    expect(trafficEngine.getCongestionLabel(55)).toBe("high");
    expect(trafficEngine.getCongestionLabel(75)).toBe("severe");
    expect(trafficEngine.getCongestionLabel(90)).toBe("severe");
  });

  it("should estimate delay based on speed and queue", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);

    for (const road of roads) {
      const delay = trafficEngine.estimateDelay(road);
      expect(delay).toBeGreaterThanOrEqual(0);
      if (road.status === "closed") expect(delay).toBe(999);
    }
  });

  it("should mark roads as congested above threshold", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);

    const congested = roads.filter((r) => r.status === "congested");
    for (const road of congested) {
      expect(road.congestionLevel).toMatch(/high|severe/);
    }
  });
});
