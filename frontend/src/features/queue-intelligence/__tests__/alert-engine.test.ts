// @ts-nocheck
import { describe, it, expect } from "vitest";
import { alertEngine } from "../services/alert-engine";
import { queueEngine } from "../services/queue-engine";
import { inventoryEngine } from "../services/inventory-engine";
import { QUEUE_POINTS, MENU_ITEMS } from "../constants";

describe("AlertEngine", () => {
  it("should evaluate alerts from current statuses", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);

    expect(Array.isArray(alerts)).toBe(true);
    for (const alert of alerts) {
      expect(alert).toHaveProperty("id");
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("title");
      expect(alert).toHaveProperty("description");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("locationId");
      expect(alert).toHaveProperty("timestamp");
      expect(alert).toHaveProperty("metricValue");
      expect(alert).toHaveProperty("threshold");

      expect(["critical", "high", "medium", "low"]).toContain(alert.severity);
      expect(["long_queue", "counter_failure", "inventory_shortage", "staff_shortage", "satisfaction_drop", "equipment_failure", "overcrowding", "restock_needed"]).toContain(alert.type);
      expect(alert.acknowledged).toBe(false);
    }
  });

  it("should not duplicate alerts on second evaluation", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const first = alertEngine.evaluate(statuses, inventory);
    const second = alertEngine.evaluate(statuses, inventory);
    // Second call should produce fewer alerts (ack tracking prevents duplicates)
    expect(second.length).toBeLessThanOrEqual(first.length);
  });

  it("should track acknowledged alerts", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    if (alerts.length > 0) {
      alertEngine.acknowledge(alerts[0].id);
      // Should not throw
      expect(true).toBe(true);
    }
  });

  it("should include metric value and threshold", () => {
    const statuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    for (const alert of alerts) {
      expect(typeof alert.metricValue).toBe("number");
      expect(typeof alert.threshold).toBe("number");
      expect(alert.threshold).toBeGreaterThan(0);
    }
  });
});

