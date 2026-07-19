import { describe, it, expect } from "vitest";
import { inventoryEngine } from "../services/inventory-engine";
import { queueEngine } from "../services/queue-engine";
import { MENU_ITEMS, QUEUE_POINTS } from "../constants";

describe("InventoryEngine", () => {
  it("should simulate inventory for all menu items", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    expect(inventory.size).toBe(MENU_ITEMS.length);

    for (const [, item] of inventory) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("currentStock");
      expect(item).toHaveProperty("maxStock");
      expect(item).toHaveProperty("reorderPoint");
      expect(item).toHaveProperty("dailyDemand");
      expect(item).toHaveProperty("wastePercent");
      expect(item).toHaveProperty("restockPriority");

      expect(item.currentStock).toBeGreaterThanOrEqual(0);
      expect(item.currentStock).toBeLessThanOrEqual(item.maxStock);
      expect(item.maxStock).toBeGreaterThan(0);
      expect(item.dailyDemand).toBeGreaterThan(0);
      expect(item.wastePercent).toBeGreaterThanOrEqual(0);
      expect(["critical", "high", "medium", "low"]).toContain(item.restockPriority);
    }
  });

  it("should forecast demand based on hour", () => {
    const forecast = inventoryEngine.forecastDemand(MENU_ITEMS, 12);
    expect(forecast.size).toBe(MENU_ITEMS.length);
    for (const [, demand] of forecast) {
      expect(demand).toBeGreaterThan(0);
    }

    const offPeak = inventoryEngine.forecastDemand(MENU_ITEMS, 3);
    for (const [key, demand] of forecast) {
      const offDemand = offPeak.get(key) ?? 0;
      expect(demand).toBeGreaterThanOrEqual(offDemand);
    }
  });

  it("should identify shortages correctly", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const shortages = inventoryEngine.identifyShortages(inventory);

    for (const item of shortages) {
      expect(item.restockPriority === "critical" || item.restockPriority === "high").toBe(true);
    }

    const sorted = [...shortages];
    for (let i = 1; i < sorted.length; i++) {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      expect((order[sorted[i - 1].restockPriority] ?? 4) <= (order[sorted[i].restockPriority] ?? 4)).toBe(true);
    }
  });

  it("should include all menu item categories", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const cats = new Set(Array.from(inventory.values()).map((i) => i.category));
    expect(cats.has("food")).toBe(true);
    expect(cats.has("beverage")).toBe(true);
    expect(cats.has("merchandise")).toBe(true);
  });
});
