import { describe, it, expect } from "vitest";
import { analyticsEngine } from "../services/analytics-engine";
import { parkingEngine } from "../services/parking-engine";
import { trafficEngine } from "../services/traffic-engine";
import { PARKING_LOTS, TRAFFIC_ROADS } from "../constants";

describe("AnalyticsEngine", () => {
  it("should compute analytics from statuses and traffic", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const traffic = trafficEngine.computeTrafficHealth(roads);
    const analytics = analyticsEngine.compute(statuses, traffic);

    expect(analytics).toHaveProperty("avgOccupancyPercent");
    expect(analytics).toHaveProperty("peakUtilizationPercent");
    expect(analytics).toHaveProperty("avgParkingDurationMin");
    expect(analytics).toHaveProperty("vehicleTurnoverAvg");
    expect(analytics).toHaveProperty("trafficDelayMin");
    expect(analytics).toHaveProperty("aiOptimizationScore");
    expect(analytics).toHaveProperty("totalVehiclesProcessed");
    expect(analytics).toHaveProperty("avgEvChargerUsage");
    expect(analytics).toHaveProperty("accessibleUtilization");
    expect(analytics).toHaveProperty("overflowUtilization");
    expect(analytics).toHaveProperty("queueHealthIndex");

    expect(analytics.avgOccupancyPercent).toBeGreaterThanOrEqual(10);
    expect(analytics.avgOccupancyPercent).toBeLessThanOrEqual(95);
    expect(analytics.peakUtilizationPercent).toBeGreaterThanOrEqual(analytics.avgOccupancyPercent - 20);
    expect(analytics.avgParkingDurationMin).toBeGreaterThan(0);
    expect(analytics.vehicleTurnoverAvg).toBeGreaterThan(0);
    expect(analytics.aiOptimizationScore).toBeGreaterThanOrEqual(0);
    expect(analytics.aiOptimizationScore).toBeLessThanOrEqual(100);
    expect(analytics.totalVehiclesProcessed).toBeGreaterThan(0);
    expect(analytics.queueHealthIndex).toBeGreaterThanOrEqual(0);
    expect(analytics.queueHealthIndex).toBeLessThanOrEqual(100);
  });

  it("should produce consistent analytics across calls", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const traffic = trafficEngine.computeTrafficHealth(roads);
    const a1 = analyticsEngine.compute(statuses, traffic);
    const a2 = analyticsEngine.compute(statuses, traffic);

    expect(a1.avgOccupancyPercent).toBe(a2.avgOccupancyPercent);
    expect(a1.aiOptimizationScore).toBe(a2.aiOptimizationScore);
  });

  it("should compute trend direction from two analytics snapshots", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const traffic = trafficEngine.computeTrafficHealth(roads);
    const current = analyticsEngine.compute(statuses, traffic);
    const trends = analyticsEngine.trend(current, current);

    for (const [, direction] of Object.entries(trends)) {
      expect(["up", "down", "stable"]).toContain(direction);
    }
  });

  it("should have all numeric values within expected ranges", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const traffic = trafficEngine.computeTrafficHealth(roads);
    const a = analyticsEngine.compute(statuses, traffic);

    expect(a.avgEvChargerUsage).toBeGreaterThanOrEqual(0);
    expect(a.avgEvChargerUsage).toBeLessThanOrEqual(100);
    expect(a.accessibleUtilization).toBeGreaterThanOrEqual(0);
    expect(a.accessibleUtilization).toBeLessThanOrEqual(100);
    expect(a.overflowUtilization).toBeGreaterThanOrEqual(0);
    expect(a.overflowUtilization).toBeLessThanOrEqual(100);
    expect(a.trafficDelayMin).toBeGreaterThanOrEqual(0);
  });
});
