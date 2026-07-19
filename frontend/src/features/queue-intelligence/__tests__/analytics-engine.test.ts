import { describe, it, expect } from "vitest";
import { analyticsEngine } from "../services/analytics-engine";
import { queueEngine } from "../services/queue-engine";
import { inventoryEngine } from "../services/inventory-engine";
import { QUEUE_POINTS, MENU_ITEMS } from "../constants";

describe("AnalyticsEngine", () => {
  it("should compute comprehensive analytics", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);

    expect(analytics).toHaveProperty("totalSales");
    expect(analytics).toHaveProperty("revenuePerMin");
    expect(analytics).toHaveProperty("avgServiceTimeSec");
    expect(analytics).toHaveProperty("staffUtilization");
    expect(analytics).toHaveProperty("peakHour");
    expect(analytics).toHaveProperty("popularCategory");
    expect(analytics).toHaveProperty("revenueForecast");
    expect(analytics).toHaveProperty("customerSatisfactionAvg");
    expect(analytics).toHaveProperty("operationalEfficiency");
    expect(analytics).toHaveProperty("aiOptimizationScore");
    expect(analytics).toHaveProperty("totalCustomersServed");
    expect(analytics).toHaveProperty("wasteReductionPercent");

    expect(analytics.totalSales).toBeGreaterThanOrEqual(0);
    expect(analytics.avgServiceTimeSec).toBeGreaterThan(0);
    expect(analytics.staffUtilization).toBeGreaterThanOrEqual(0);
    expect(analytics.staffUtilization).toBeLessThanOrEqual(100);
    expect(analytics.customerSatisfactionAvg).toBeGreaterThan(0);
    expect(analytics.customerSatisfactionAvg).toBeLessThanOrEqual(5);
    expect(analytics.operationalEfficiency).toBeGreaterThanOrEqual(0);
    expect(analytics.operationalEfficiency).toBeLessThanOrEqual(100);
    expect(analytics.aiOptimizationScore).toBeGreaterThanOrEqual(0);
    expect(analytics.aiOptimizationScore).toBeLessThanOrEqual(100);
  });

  it("should produce consistent analytics across identical inputs", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const a1 = analyticsEngine.compute(statuses, inventory);
    const a2 = analyticsEngine.compute(statuses, inventory);
    expect(a1.totalSales).toBe(a2.totalSales);
    expect(a1.aiOptimizationScore).toBe(a2.aiOptimizationScore);
  });

  it("should compute trends between analytics snapshots", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const current = analyticsEngine.compute(statuses, inventory);
    const trends = analyticsEngine.trend(current, current);
    for (const [, direction] of Object.entries(trends)) {
      expect(["up", "down", "stable"]).toContain(direction);
    }
  });

  it("should have valid popularCategory", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(["Food", "Beverage", "Merchandise"]).toContain(analytics.popularCategory);
  });
});
