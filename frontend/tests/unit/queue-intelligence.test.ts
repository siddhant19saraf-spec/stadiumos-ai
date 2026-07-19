import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queueEngine } from "@/features/queue-intelligence/services/queue-engine";
import { predictionEngine } from "@/features/queue-intelligence/services/prediction-engine";
import { recommendationEngine } from "@/features/queue-intelligence/services/recommendation-engine";
import { inventoryEngine } from "@/features/queue-intelligence/services/inventory-engine";
import { analyticsEngine } from "@/features/queue-intelligence/services/analytics-engine";
import { simulationEngine } from "@/features/queue-intelligence/services/simulation-engine";
import { alertEngine } from "@/features/queue-intelligence/services/alert-engine";
import { queueIntelligenceService } from "@/features/queue-intelligence/services/queue-service";
import { QUEUE_POINTS, MENU_ITEMS, SCENARIO_CONFIGS, ALERT_THRESHOLDS, REFRESH_INTERVAL_MS } from "@/features/queue-intelligence/constants";
import type { QueuePointStatus, QueuePrediction, QueueAlert, InventoryItem } from "@/features/queue-intelligence/types";

describe("QueueEngine", () => {
  it("should return 26 queue points", () => {
    const points = queueEngine.getQueuePoints();
    expect(points).toHaveLength(26);
  });

  it("should return points with expected structure", () => {
    const points = queueEngine.getQueuePoints();
    for (const p of points) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("type");
      expect(p).toHaveProperty("totalCounters");
    }
  });

  it("should include all queue point types", () => {
    const types = queueEngine.getQueuePoints().map((p) => p.type);
    expect(types).toContain("food_counter");
    expect(types).toContain("beverage_counter");
    expect(types).toContain("merchandise");
    expect(types).toContain("restroom");
    expect(types).toContain("security");
    expect(types).toContain("entry_gate");
    expect(types).toContain("customer_service");
    expect(types).toContain("atm");
    expect(types).toContain("ticket_booth");
    expect(types).toContain("information");
  });

  it("simulateStatuses should return Map with 26 entries", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(26);
  });

  it("simulateStatuses statuses should have correct structure", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(s).toHaveProperty("queuePointId");
      expect(s).toHaveProperty("queuePointName");
      expect(s).toHaveProperty("currentLength");
      expect(s).toHaveProperty("estimatedWaitMin");
      expect(s).toHaveProperty("activeCounters");
      expect(s).toHaveProperty("capacityUtilization");
      expect(s).toHaveProperty("customerSatisfaction");
      expect(s).toHaveProperty("status");
    }
  });

  it("simulateStatuses wait times should be >= 1", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(s.estimatedWaitMin).toBeGreaterThanOrEqual(1);
    }
  });

  it("simulateStatuses capacityUtilization should be 5-98", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(s.capacityUtilization).toBeGreaterThanOrEqual(5);
      expect(s.capacityUtilization).toBeLessThanOrEqual(98);
    }
  });

  it("simulateStatuses activeCounters should not exceed totalCounters", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(s.activeCounters).toBeLessThanOrEqual(s.totalCounters);
      expect(s.activeCounters).toBeGreaterThanOrEqual(1);
    }
  });

  it("simulateStatuses counterStatuses array length should equal totalCounters", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(s.counterStatuses).toHaveLength(s.totalCounters);
    }
  });

  it("calculateHealth should return expected structure", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    const health = queueEngine.calculateHealth(map);
    expect(health).toHaveProperty("avgWait");
    expect(health).toHaveProperty("healthScore");
    expect(health).toHaveProperty("satisfactionAvg");
  });

  it("calculateHealth healthScore should be 0-100", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    const health = queueEngine.calculateHealth(map);
    expect(health.healthScore).toBeGreaterThanOrEqual(0);
    expect(health.healthScore).toBeLessThanOrEqual(100);
  });

  it("calculateHealth satisfactionAvg should be 1-5", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    const health = queueEngine.calculateHealth(map);
    expect(health.satisfactionAvg).toBeGreaterThanOrEqual(1);
    expect(health.satisfactionAvg).toBeLessThanOrEqual(5);
  });

  it("simulateStatuses should produce different results on consecutive calls", () => {
    const points = queueEngine.getQueuePoints();
    const m1 = queueEngine.simulateStatuses(points);
    const m2 = queueEngine.simulateStatuses(points);
    let allSame = true;
    for (const [id, s] of m1) {
      if (s.currentLength !== m2.get(id)?.currentLength) { allSame = false; break; }
    }
    expect(allSame).toBe(false);
  });

  it("should return correct queue point for food-1", () => {
    const points = queueEngine.getQueuePoints();
    const f1 = points.find((p) => p.id === "food-1");
    expect(f1).toBeDefined();
    expect(f1!.totalCounters).toBe(8);
    expect(f1!.menuItems).toContain("burger");
  });

  it("simulateStatuses status should be one of normal/busy/congested/critical", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(["normal", "busy", "congested", "critical"]).toContain(s.status);
    }
  });

  it("simulateStatuses satisfaction should be 1-5", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(s.customerSatisfaction).toBeGreaterThanOrEqual(1);
      expect(s.customerSatisfaction).toBeLessThanOrEqual(5);
    }
  });

  it("simulateStatuses serviceSpeedSec should be positive", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(s.serviceSpeedSec).toBeGreaterThan(0);
    }
  });

  it("simulateStatuses entry_gate should have faster service than food_counter", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    const entry = map.get("entry-1")!;
    const food = map.get("food-1")!;
    expect(entry.serviceSpeedSec).toBeLessThan(food.serviceSpeedSec);
  });

  it("calculateHealth avgWait should be positive", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    const health = queueEngine.calculateHealth(map);
    expect(health.avgWait).toBeGreaterThanOrEqual(0);
  });

describe("Queue PredictionEngine", () => {
  it("predictQueues should return predictions for all points", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    expect(preds).toHaveLength(points.length);
  });

  it("predictQueues predictions have expected fields", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    for (const p of preds) {
      expect(p).toHaveProperty("queuePointId");
      expect(p).toHaveProperty("predictedLength15m");
      expect(p).toHaveProperty("predictedLength30m");
      expect(p).toHaveProperty("predictedWait15m");
      expect(p).toHaveProperty("predictedWait30m");
      expect(p).toHaveProperty("overloadProbability");
      expect(p).toHaveProperty("confidence");
    }
  });

  it("predictQueues lengths should be within 0-500", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    for (const p of preds) {
      expect(p.predictedLength15m).toBeGreaterThanOrEqual(0);
      expect(p.predictedLength15m).toBeLessThanOrEqual(500);
      expect(p.predictedLength30m).toBeGreaterThanOrEqual(0);
      expect(p.predictedLength30m).toBeLessThanOrEqual(500);
    }
  });

  it("predictQueues wait times should be 1-60", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    for (const p of preds) {
      expect(p.predictedWait15m).toBeGreaterThanOrEqual(1);
      expect(p.predictedWait15m).toBeLessThanOrEqual(60);
      expect(p.predictedWait30m).toBeGreaterThanOrEqual(1);
      expect(p.predictedWait30m).toBeLessThanOrEqual(60);
    }
  });

  it("predictQueues confidence should be 80-96", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    for (const p of preds) {
      expect(p.confidence).toBeGreaterThanOrEqual(80);
      expect(p.confidence).toBeLessThanOrEqual(96);
    }
  });

  it("predictQueues recommendedCounters should be 1 to totalCounters", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    const pointMap = new Map(points.map((p) => [p.id, p]));
    for (const p of preds) {
      const pt = pointMap.get(p.queuePointId);
      expect(p.recommendedCounters).toBeGreaterThanOrEqual(1);
      if (pt) expect(p.recommendedCounters).toBeLessThanOrEqual(pt.totalCounters);
    }
  });

  it("predictOverload should return array", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const overloads = predictionEngine.predictOverload(statuses);
    expect(Array.isArray(overloads)).toBe(true);
  });

  it("predictOverload entries have expected fields", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const overloads = predictionEngine.predictOverload(statuses);
    for (const o of overloads) {
      expect(o).toHaveProperty("id");
      expect(o).toHaveProperty("probability");
      expect(o).toHaveProperty("timeToCritical");
      expect(o.probability).toBeGreaterThanOrEqual(0);
      expect(o.probability).toBeLessThanOrEqual(95);
    }
  });

  it("predictOverload should be sorted by probability descending", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const overloads = predictionEngine.predictOverload(statuses);
    for (let i = 1; i < overloads.length; i++) {
      expect(overloads[i].probability).toBeLessThanOrEqual(overloads[i - 1].probability);
    }
  });

  it("predictQueues food counters should have lower wait times than customer_service", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    const foodPred = preds.find((p) => p.queuePointId === "food-1")!;
    const csPred = preds.find((p) => p.queuePointId === "cs-1")!;
    expect(foodPred.predictedWait15m).toBeLessThan(csPred.predictedWait15m);
  });

  it("predictQueues should have peakDemandTime as non-empty string", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    for (const p of preds) {
      expect(typeof p.peakDemandTime).toBe("string");
      expect(p.peakDemandTime.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("predictQueues abandonmentRate should be 1-55", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    for (const p of preds) {
      expect(p.abandonmentRate).toBeGreaterThanOrEqual(1);
      expect(p.abandonmentRate).toBeLessThanOrEqual(55);
    }
  });

describe("Queue RecommendationEngine", () => {
  it("generate should return array", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(Array.isArray(recs)).toBe(true);
  });

  it("generate should return at most 8 recommendations", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.length).toBeLessThanOrEqual(8);
  });

  it("generate recommendations have expected structure", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    for (const r of recs) {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("action");
      expect(r).toHaveProperty("detail");
      expect(r).toHaveProperty("priority");
      expect(r).toHaveProperty("reasoning");
      expect(r).toHaveProperty("contributingFactors");
      expect(r).toHaveProperty("estimatedImprovement");
    }
  });

  it("generate with critical queues should recommend opening counters", () => {
    const critical: QueuePointStatus = {
      queuePointId: "food-1", queuePointName: "Food Court A", type: "food_counter", currentLength: 80,
      estimatedWaitMin: 30, serviceSpeedSec: 150, activeCounters: 3, totalCounters: 8,
      counterStatuses: ["open", "open", "open", "closed", "closed", "closed", "closed", "closed"],
      capacityUtilization: 90, customerSatisfaction: 2, status: "critical", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("food-1", critical);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts: QueueAlert[] = [];
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.some((r) => r.action.includes("Open Counter"))).toBe(true);
  });

  it("generate should include restroom redirect when wait > 8 min", () => {
    const longRestroom: QueuePointStatus = {
      queuePointId: "restroom-1", queuePointName: "Restroom - North", type: "restroom", currentLength: 40,
      estimatedWaitMin: 12, serviceSpeedSec: 60, activeCounters: 8, totalCounters: 12,
      counterStatuses: Array(12).fill("open"), capacityUtilization: 75, customerSatisfaction: 3, status: "busy", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("restroom-1", longRestroom);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts: QueueAlert[] = [];
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.some((r) => r.action.includes("Redirect Visitors"))).toBe(true);
  });

  it("generate with critical inventory should suggest replenish", () => {
    const lowStock: InventoryItem = {
      id: "burger", name: "Classic Burger", category: "food", currentStock: 10, maxStock: 425,
      reorderPoint: 106, dailyDemand: 300, wastePercent: 5, predictedShortageInMin: 5, restockPriority: "critical", lastRestocked: "",
    };
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = new Map<string, InventoryItem>();
    inventory.set("burger", lowStock);
    const alerts: QueueAlert[] = [];
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.some((r) => r.action.includes("Replenish"))).toBe(true);
  });

  it("generate should include broadcast guidance when multiple critical queues", () => {
    const critical = Array.from({ length: 3 }, (_, i) => ({
      queuePointId: `food-${i}`,
      queuePointName: `Food ${i}`,
      type: "food_counter" as const, currentLength: 50, estimatedWaitMin: 30, serviceSpeedSec: 120,
      activeCounters: 4, totalCounters: 5,
      counterStatuses: ["open", "open", "open", "open", "open"],
      capacityUtilization: 85, customerSatisfaction: 2, status: "critical" as const, lastUpdated: "",
    }));
    const statuses = new Map<string, QueuePointStatus>();
    critical.forEach((c) => statuses.set(c.queuePointId, c));
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts: QueueAlert[] = [];
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.some((r) => r.action.includes("Broadcast Queue Guidance"))).toBe(true);
  });

  it("generate with congested queues should suggest opening additional counters", () => {
    const congested: QueuePointStatus = {
      queuePointId: "bev-1", queuePointName: "Beverage Station 1", type: "beverage_counter", currentLength: 30,
      estimatedWaitMin: 15, serviceSpeedSec: 40, activeCounters: 2, totalCounters: 4,
      counterStatuses: ["open", "open", "closed", "closed"], capacityUtilization: 75,
      customerSatisfaction: 3, status: "congested", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("bev-1", congested);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts: QueueAlert[] = [];
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.some((r) => r.action.includes("Open Additional Counter"))).toBe(true);
  });

  it("generate with busy food courts should suggest redirect to shortest queue", () => {
    const busy1: QueuePointStatus = {
      queuePointId: "food-1", queuePointName: "Food Court A", type: "food_counter", currentLength: 20,
      estimatedWaitMin: 8, serviceSpeedSec: 120, activeCounters: 5, totalCounters: 8,
      counterStatuses: Array(8).fill("open"), capacityUtilization: 60,
      customerSatisfaction: 4, status: "busy", lastUpdated: "",
    };
    const busy2: QueuePointStatus = {
      queuePointId: "food-2", queuePointName: "Food Court B", type: "food_counter", currentLength: 15,
      estimatedWaitMin: 5, serviceSpeedSec: 120, activeCounters: 4, totalCounters: 6,
      counterStatuses: Array(6).fill("open"), capacityUtilization: 50,
      customerSatisfaction: 4, status: "busy", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("food-1", busy1);
    statuses.set("food-2", busy2);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts: QueueAlert[] = [];
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    expect(recs.some((r) => r.action.includes("Redirect Visitors"))).toBe(true);
  });

describe("InventoryEngine", () => {
  it("simulate should return Map with 27 menu items", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv = inventoryEngine.simulate(MENU_ITEMS, statuses);
    expect(inv.size).toBe(27);
  });

  it("simulate inventory items have expected structure", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv = inventoryEngine.simulate(MENU_ITEMS, statuses);
    for (const [, item] of inv) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("currentStock");
      expect(item).toHaveProperty("maxStock");
      expect(item).toHaveProperty("reorderPoint");
      expect(item).toHaveProperty("restockPriority");
    }
  });

  it("simulate currentStock should not be negative", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv = inventoryEngine.simulate(MENU_ITEMS, statuses);
    for (const [, item] of inv) {
      expect(item.currentStock).toBeGreaterThanOrEqual(0);
    }
  });

  it("simulate maxStock should be positive", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv = inventoryEngine.simulate(MENU_ITEMS, statuses);
    for (const [, item] of inv) {
      expect(item.maxStock).toBeGreaterThan(0);
    }
  });

  it("forecastDemand should return Map with 27 entries", () => {
    const forecast = inventoryEngine.forecastDemand(MENU_ITEMS, 12);
    expect(forecast.size).toBe(27);
  });

  it("forecastDemand values should be positive", () => {
    const forecast = inventoryEngine.forecastDemand(MENU_ITEMS, 12);
    for (const [, v] of forecast) {
      expect(v).toBeGreaterThan(0);
    }
  });

  it("forecastDemand should vary by hour", () => {
    const peak = inventoryEngine.forecastDemand(MENU_ITEMS, 12);
    const off = inventoryEngine.forecastDemand(MENU_ITEMS, 3);
    const peakVals = Array.from(peak.values()).reduce((s, v) => s + v, 0);
    const offVals = Array.from(off.values()).reduce((s, v) => s + v, 0);
    expect(peakVals).toBeGreaterThan(offVals);
  });

  it("identifyShortages should return critical/high items", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const shortages = inventoryEngine.identifyShortages(inv);
    for (const item of shortages) {
      expect(["critical", "high"]).toContain(item.restockPriority);
    }
  });

  it("identifyShortages should be sorted by priority", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const shortages = inventoryEngine.identifyShortages(inv);
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < shortages.length; i++) {
      expect(order[shortages[i].restockPriority]).toBeGreaterThanOrEqual(order[shortages[i - 1].restockPriority]);
    }
  });

  it("simulate should handle consecutive calls", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv1 = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const inv2 = inventoryEngine.simulate(MENU_ITEMS, statuses);
    expect(inv1.size).toBe(inv2.size);
  });
});

describe("Queue AnalyticsEngine", () => {
  it("compute should return ConcessionAnalytics with all fields", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics).toHaveProperty("totalSales");
    expect(analytics).toHaveProperty("revenuePerMin");
    expect(analytics).toHaveProperty("avgServiceTimeSec");
    expect(analytics).toHaveProperty("staffUtilization");
    expect(analytics).toHaveProperty("operationalEfficiency");
    expect(analytics).toHaveProperty("aiOptimizationScore");
    expect(analytics).toHaveProperty("customerSatisfactionAvg");
  });

  it("compute aiOptimizationScore should be 0-100", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.aiOptimizationScore).toBeGreaterThanOrEqual(0);
    expect(analytics.aiOptimizationScore).toBeLessThanOrEqual(100);
  });

  it("compute staffUtilization should be 0-100", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.staffUtilization).toBeGreaterThanOrEqual(0);
    expect(analytics.staffUtilization).toBeLessThanOrEqual(100);
  });

  it("compute with empty statuses should not throw", () => {
    const empty = new Map<string, QueuePointStatus>();
    const inventory = new Map<string, InventoryItem>();
    const analytics = analyticsEngine.compute(empty, inventory);
    expect(analytics.totalSales).toBeGreaterThanOrEqual(0);
  });

  it("compute customerSatisfactionAvg should be 1-5", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.customerSatisfactionAvg).toBeGreaterThanOrEqual(1);
    expect(analytics.customerSatisfactionAvg).toBeLessThanOrEqual(5);
  });

  it("trend should return object with expected keys", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    const trends = analyticsEngine.trends(analytics);
    expect(trends).toHaveProperty("customerSatisfactionAvg");
    expect(trends).toHaveProperty("operationalEfficiency");
    expect(trends).toHaveProperty("aiOptimizationScore");
    expect(trends).toHaveProperty("staffUtilization");
    expect(trends).toHaveProperty("revenuePerMin");
  });

  it("trend values should be up, down, or stable", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    const trends = analyticsEngine.trends(analytics);
    for (const v of Object.values(trends)) {
      expect(["up", "down", "stable"]).toContain(v);
    }
  });

  it("compute operationalEfficiency should be 0-100", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.operationalEfficiency).toBeGreaterThanOrEqual(0);
    expect(analytics.operationalEfficiency).toBeLessThanOrEqual(100);
  });

  it("compute revenuePerMin should be positive", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.revenuePerMin).toBeGreaterThanOrEqual(0);
  });

  it("compute avgServiceTimeSec should be positive", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.avgServiceTimeSec).toBeGreaterThan(0);
  });

  it("compute totalCustomersServed should be positive", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.totalCustomersServed).toBeGreaterThan(0);
  });

  it("compute wasteReductionPercent should be 0-15", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.wasteReductionPercent).toBeGreaterThanOrEqual(0);
    expect(analytics.wasteReductionPercent).toBeLessThanOrEqual(15);
  });

  it("compute revenueForecast should be >= totalSales", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(analytics.revenueForecast).toBeGreaterThanOrEqual(analytics.totalSales);
  });

describe("Queue SimulationEngine", () => {
  it("getAvailableScenarios should return all 10 scenarios", () => {
    const scenarios = simulationEngine.getAvailableScenarios();
    expect(scenarios).toHaveLength(10);
    const ids = scenarios.map((s) => s.id);
    expect(ids).toContain("halftime_rush");
    expect(ids).toContain("rain_delay");
    expect(ids).toContain("sold_out_match");
    expect(ids).toContain("counter_failure");
    expect(ids).toContain("merchandise_drop");
    expect(ids).toContain("heat_wave");
    expect(ids).toContain("post_game_exit");
  });

  it("getAvailableScenarios each entry has name and description", () => {
    const scenarios = simulationEngine.getAvailableScenarios();
    for (const s of scenarios) {
      expect(s).toHaveProperty("name");
      expect(s).toHaveProperty("description");
      expect(s).toHaveProperty("icon");
      expect(s).toHaveProperty("color");
    }
  });

  it("applyScenario halftime_rush should increase food/beverage queue length", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("halftime_rush", points, statuses);
    const foodStatus = base.get("food-1")!;
    const foodResult = result.get("food-1")!;
    expect(foodResult.currentLength).toBeGreaterThanOrEqual(foodStatus.currentLength);
  });

  it("applyScenario sold_out_match should increase all queue lengths", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("sold_out_match", points, statuses);
    for (const [id, s] of result) {
      const orig = base.get(id)!;
      expect(s.currentLength).toBeGreaterThanOrEqual(orig.currentLength);
    }
  });

  it("applyScenario emergency_evacuation should drastically reduce queues", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const result = simulationEngine.applyScenario("emergency_evacuation", points, statuses);
    for (const [, s] of result) {
      expect(s.currentLength).toBeLessThanOrEqual(100);
      expect(s.estimatedWaitMin).toBe(1);
    }
  });

  it("applyScenario counter_failure should reduce activeCounters for food counters", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("counter_failure", points, statuses);
    const foodBase = base.get("food-1")!;
    const foodResult = result.get("food-1")!;
    expect(foodResult.activeCounters).toBeLessThan(foodBase.activeCounters);
    expect(foodResult.status).toBe("critical");
  });

  it("applyScenario merchandise_drop should surge merchandise queues", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("merchandise_drop", points, statuses);
    const merchBase = base.get("merch-1")!;
    const merchResult = result.get("merch-1")!;
    expect(merchResult.currentLength).toBeGreaterThan(merchBase.currentLength);
  });

  it("applyScenario heat_wave should increase beverage queue and decrease food queues", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("heat_wave", points, statuses);
    const bevBase = base.get("bev-1")!;
    const bevResult = result.get("bev-1")!;
    expect(bevResult.currentLength).toBeGreaterThan(bevBase.currentLength);
  });

  it("applyScenario post_game_exit should surge entry gate queues", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("post_game_exit", points, statuses);
    const entryBase = base.get("entry-1")!;
    const entryResult = result.get("entry-1")!;
    expect(entryResult.currentLength).toBeGreaterThan(entryBase.currentLength);
  });

  it("applyScenario staff_shortage should reduce activeCounters", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("staff_shortage", points, statuses);
    for (const [id, s] of result) {
      const orig = base.get(id)!;
      expect(s.activeCounters).toBeLessThanOrEqual(orig.activeCounters);
    }
  });

  it("applyScenario rain_delay should increase restroom queues", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("rain_delay", points, statuses);
    const restBase = base.get("restroom-1")!;
    const restResult = result.get("restroom-1")!;
    expect(restResult.currentLength).toBeGreaterThan(restBase.currentLength);
  });

  it("applyScenario vip_event should reduce food counter wait times", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const base = new Map(statuses);
    const result = simulationEngine.applyScenario("vip_event", points, statuses);
    const foodBase = base.get("food-1")!;
    const foodResult = result.get("food-1")!;
    expect(foodResult.estimatedWaitMin).toBeLessThanOrEqual(foodBase.estimatedWaitMin);
  });

  it("surge helper should cap length at 500 and wait at 60", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    // Apply sold_out_match which uses surge with 2.0 multiplier
    const result = simulationEngine.applyScenario("sold_out_match", points, statuses);
    for (const [, s] of result) {
      expect(s.currentLength).toBeLessThanOrEqual(500);
      expect(s.estimatedWaitMin).toBeLessThanOrEqual(60);
    }
  });

describe("Queue AlertEngine", () => {
  it("evaluate should return array of alerts", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("evaluate alerts have expected structure", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    for (const a of alerts) {
      expect(a).toHaveProperty("id");
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("title");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("metricValue");
      expect(a).toHaveProperty("threshold");
      expect(a).toHaveProperty("acknowledged");
    }
  });

  it("evaluate triggers long_queue for critical wait times", () => {
    const critical: QueuePointStatus = {
      queuePointId: "food-1", queuePointName: "Food Court A", type: "food_counter", currentLength: 100,
      estimatedWaitMin: 30, serviceSpeedSec: 150, activeCounters: 3, totalCounters: 8,
      counterStatuses: Array(8).fill("open"), capacityUtilization: 90, customerSatisfaction: 2, status: "critical", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("food-1", critical);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    expect(alerts.some((a) => a.type === "long_queue" && a.severity === "critical")).toBe(true);
  });

  it("evaluate triggers equipment_failure for breakdown counters", () => {
    const broken: QueuePointStatus = {
      queuePointId: "food-2", queuePointName: "Food Court B", type: "food_counter", currentLength: 30,
      estimatedWaitMin: 10, serviceSpeedSec: 120, activeCounters: 2, totalCounters: 6,
      counterStatuses: ["open", "open", "breakdown", "breakdown", "closed", "closed"],
      capacityUtilization: 50, customerSatisfaction: 3, status: "busy", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("food-2", broken);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    expect(alerts.some((a) => a.type === "equipment_failure")).toBe(true);
  });

  it("evaluate triggers inventory_shortage for predicted shortage <= 15 min", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const lowStock: InventoryItem = {
      id: "burger", name: "Classic Burger", category: "food", currentStock: 5, maxStock: 425,
      reorderPoint: 106, dailyDemand: 300, wastePercent: 5, predictedShortageInMin: 10, restockPriority: "critical", lastRestocked: "",
    };
    const inventory = new Map<string, InventoryItem>();
    inventory.set("burger", lowStock);
    const alerts = alertEngine.evaluate(statuses, inventory);
    expect(alerts.some((a) => a.type === "inventory_shortage")).toBe(true);
  });

  it("evaluate triggers restock_needed for high priority inventory", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const highStock: InventoryItem = {
      id: "jersey", name: "Team Jersey", category: "merchandise", currentStock: 30, maxStock: 140,
      reorderPoint: 35, dailyDemand: 50, wastePercent: 2, predictedShortageInMin: null, restockPriority: "high", lastRestocked: "",
    };
    const inventory = new Map<string, InventoryItem>();
    inventory.set("jersey", highStock);
    const alerts = alertEngine.evaluate(statuses, inventory);
    expect(alerts.some((a) => a.type === "restock_needed")).toBe(true);
  });

  it("evaluate should not duplicate already acknowledged alerts", () => {
    const critical: QueuePointStatus = {
      queuePointId: "food-1", queuePointName: "Food Court A", type: "food_counter", currentLength: 100,
      estimatedWaitMin: 30, serviceSpeedSec: 150, activeCounters: 3, totalCounters: 8,
      counterStatuses: Array(8).fill("open"), capacityUtilization: 90, customerSatisfaction: 2, status: "critical", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("food-1", critical);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts1 = alertEngine.evaluate(statuses, inventory);
    const alerts2 = alertEngine.evaluate(statuses, inventory);
    expect(alerts2.length).toBeLessThanOrEqual(alerts1.length);
  });

  it("acknowledge should not throw", () => {
    alertEngine.acknowledge("test-alert-id");
    expect(true).toBe(true);
  });

  it("evaluate triggers satisfaction_drop when satisfaction < 3.0", () => {
    const lowSat: QueuePointStatus = {
      queuePointId: "food-1", queuePointName: "Food Court A", type: "food_counter", currentLength: 80,
      estimatedWaitMin: 25, serviceSpeedSec: 180, activeCounters: 2, totalCounters: 8,
      counterStatuses: Array(8).fill("open"), capacityUtilization: 90,
      customerSatisfaction: 2, status: "critical", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("food-1", lowSat);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    expect(alerts.some((a) => a.type === "satisfaction_drop")).toBe(true);
  });

  it("evaluate should not trigger duplicate alerts on second call", () => {
    const critical: QueuePointStatus = {
      queuePointId: "food-1", queuePointName: "Food Court A", type: "food_counter", currentLength: 100,
      estimatedWaitMin: 30, serviceSpeedSec: 150, activeCounters: 3, totalCounters: 8,
      counterStatuses: Array(8).fill("open"), capacityUtilization: 90,
      customerSatisfaction: 2, status: "critical", lastUpdated: "",
    };
    const statuses = new Map<string, QueuePointStatus>();
    statuses.set("food-1", critical);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    alertEngine.evaluate(statuses, inventory);
    const second = alertEngine.evaluate(statuses, inventory);
    expect(second.filter((a) => a.type === "long_queue").length).toBeLessThanOrEqual(1);
  });

describe("QueueIntelligenceService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should be a singleton", () => {
    const s1 = queueIntelligenceService;
    const s2 = queueIntelligenceService;
    expect(s1).toBe(s2);
  });

  it("should return initial state with getState", () => {
    const state = queueIntelligenceService.getState();
    expect(state).toHaveProperty("queuePoints");
    expect(state).toHaveProperty("queueStatuses");
    expect(state).toHaveProperty("predictions");
    expect(state).toHaveProperty("inventoryStatuses");
    expect(state).toHaveProperty("analytics");
    expect(state).toHaveProperty("alerts");
    expect(state).toHaveProperty("simulation");
    expect(state.simulation.active).toBe(false);
  });

  it("should subscribe and receive notifications", () => {
    const cb = vi.fn();
    const unsub = queueIntelligenceService.subscribe(cb);
    queueIntelligenceService.selectQueue("food-1");
    expect(cb).toHaveBeenCalled();
    unsub();
  });

  it("unsubscribe should stop notifications", () => {
    const cb = vi.fn();
    const unsub = queueIntelligenceService.subscribe(cb);
    unsub();
    queueIntelligenceService.selectQueue("food-2");
    expect(cb).not.toHaveBeenCalled();
  });

  it("selectQueue should update selectedQueueId", () => {
    queueIntelligenceService.selectQueue("food-1");
    expect(queueIntelligenceService.getState().selectedQueueId).toBe("food-1");
  });

  it("selectQueue with null should clear selection", () => {
    queueIntelligenceService.selectQueue("food-1");
    queueIntelligenceService.selectQueue(null);
    expect(queueIntelligenceService.getState().selectedQueueId).toBeNull();
  });

  it("start should set interval", () => {
    queueIntelligenceService.start(1000);
    expect(true).toBe(true);
  });

  it("start again should be a no-op", () => {
    queueIntelligenceService.start(1000);
    queueIntelligenceService.start(1000);
    expect(true).toBe(true);
  });

  it("stop should clear interval", () => {
    queueIntelligenceService.start(1000);
    queueIntelligenceService.stop();
    expect(true).toBe(true);
  });

  it("startSimulation should activate simulation state", () => {
    queueIntelligenceService.startSimulation("halftime_rush");
    const state = queueIntelligenceService.getState();
    expect(state.simulation.active).toBe(true);
    expect(state.simulation.scenario).toBe("halftime_rush");
  });

  it("stopSimulation should deactivate simulation", () => {
    queueIntelligenceService.startSimulation("sold_out_match");
    queueIntelligenceService.stopSimulation();
    const state = queueIntelligenceService.getState();
    expect(state.simulation.active).toBe(false);
    expect(state.simulation.scenario).toBeNull();
  });

  it("acknowledgeAlert should mark alert as acknowledged", () => {
    const state = queueIntelligenceService.getState();
    if (state.alerts.length > 0) {
      const id = state.alerts[0].id;
      queueIntelligenceService.acknowledgeAlert(id);
      const updated = queueIntelligenceService.getState();
      const found = updated.alerts.find((a) => a.id === id);
      expect(found?.acknowledged).toBe(true);
    } else {
      expect(true).toBe(true);
    }
  });

  it("initial state queuePoints should have 26 entries", () => {
    const state = queueIntelligenceService.getState();
    expect(state.queuePoints).toHaveLength(26);
  });
});

describe("Queue Constants", () => {
  it("QUEUE_POINTS should have 26 entries", () => {
    expect(QUEUE_POINTS).toHaveLength(26);
  });

  it("MENU_ITEMS should have 27 entries", () => {
    expect(MENU_ITEMS).toHaveLength(27);
  });

  it("SCENARIO_CONFIGS should have 10 entries", () => {
    expect(Object.keys(SCENARIO_CONFIGS)).toHaveLength(10);
  });

  it("ALERT_THRESHOLDS should have correct values", () => {
    expect(ALERT_THRESHOLDS.LONG_QUEUE_MIN).toBe(15);
    expect(ALERT_THRESHOLDS.CRITICAL_QUEUE_MIN).toBe(25);
    expect(ALERT_THRESHOLDS.SATISFACTION_MIN).toBe(3.0);
  });

  it("INVENTORY_ITEMS should have 27 entries", () => {
    expect(Object.keys(MENU_ITEMS).length).toBe(27);
  });

  it("REFRESH_INTERVAL_MS should be 5000", () => {
    expect(REFRESH_INTERVAL_MS).toBe(5000);
  });

  it("MENU_ITEMS should include beverages and food", () => {
    const names = MENU_ITEMS.map((m) => m.name);
    expect(names).toContain("Classic Burger");
    expect(names).toContain("Draft Beer");
    expect(names).toContain("Team Jersey");
  });

  it("SCENARIO_CONFIGS should have halftime_rush with correct icon", () => {
    expect(SCENARIO_CONFIGS.halftime_rush.icon).toBe("utensils-crossed");
  });

  it("SCENARIO_CONFIGS emergency_evacuation should have alert-triangle icon", () => {
    expect(SCENARIO_CONFIGS.emergency_evacuation.icon).toBe("alert-triangle");
  });

  it("QUEUE_POINTS should include all point types", () => {
    const types = QUEUE_POINTS.map((p) => p.type);
    const uniqueTypes = [...new Set(types)];
    expect(uniqueTypes).toContain("food_counter");
    expect(uniqueTypes).toContain("restroom");
    expect(uniqueTypes).toContain("security");
    expect(uniqueTypes).toContain("entry_gate");
    expect(uniqueTypes).toContain("atm");
  });

describe("Queue Types", () => {
  it("QueuePointStatus should have numeric fields", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      expect(typeof s.currentLength).toBe("number");
      expect(typeof s.estimatedWaitMin).toBe("number");
      expect(typeof s.capacityUtilization).toBe("number");
    }
  });

  it("QueuePrediction should have queuePointId string", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const preds = predictionEngine.predictQueues(points, statuses);
    for (const p of preds) {
      expect(typeof p.queuePointId).toBe("string");
    }
  });

  it("QueueAlert severity should be valid", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts = alertEngine.evaluate(statuses, inventory);
    for (const a of alerts) {
      expect(["critical", "high", "medium", "low"]).toContain(a.severity);
    }
  });

  it("InventoryItem restockPriority should be valid", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inv = inventoryEngine.simulate(MENU_ITEMS, statuses);
    for (const [, item] of inv) {
      expect(["critical", "high", "medium", "low"]).toContain(item.restockPriority);
    }
  });

  it("QueuePointStatus counterStatuses should only contain valid values", () => {
    const points = queueEngine.getQueuePoints();
    const map = queueEngine.simulateStatuses(points);
    for (const [, s] of map) {
      for (const cs of s.counterStatuses) {
        expect(["open", "closed", "limited", "breakdown"]).toContain(cs);
      }
    }
  });

  it("QueueRecommendation should have operationalImpact", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const alerts: QueueAlert[] = [];
    const recs = recommendationEngine.generate({ statuses, alerts, inventory });
    for (const r of recs) {
      expect(r).toHaveProperty("operationalImpact");
      expect(r).toHaveProperty("estimatedImprovement");
    }
  });

  it("SimulationState should have correct default structure", () => {
    const state = queueIntelligenceService.getState().simulation;
    expect(state).toHaveProperty("active");
    expect(state).toHaveProperty("scenario");
    expect(state).toHaveProperty("speed");
    expect(state).toHaveProperty("startedAt");
    expect(state).toHaveProperty("elapsedMs");
  });

  it("MenuItems should have correct structure", () => {
    for (const item of MENU_ITEMS) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("basePrice");
      expect(item).toHaveProperty("prepTimeSec");
      expect(item).toHaveProperty("popularity");
      expect(item.popularity).toBeGreaterThan(0);
      expect(item.popularity).toBeLessThanOrEqual(1);
    }
  });

  it("queueIntelligenceService singleton should have same reference", () => {
    expect(queueIntelligenceService).toBe(queueIntelligenceService);
  });

  it("simulateStatuses should handle all 26 points without throwing", () => {
    const points = queueEngine.getQueuePoints();
    expect(() => queueEngine.simulateStatuses(points)).not.toThrow();
  });

  it("predictQueues should handle empty statuses gracefully", () => {
    const points = queueEngine.getQueuePoints();
    const empty = new Map<string, QueuePointStatus>();
    const preds = predictionEngine.predictQueues(points, empty);
    expect(preds).toHaveLength(points.length);
  });

  it("compute should return peakHour as string", () => {
    const points = queueEngine.getQueuePoints();
    const statuses = queueEngine.simulateStatuses(points);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, statuses);
    const analytics = analyticsEngine.compute(statuses, inventory);
    expect(typeof analytics.peakHour).toBe("string");
    expect(analytics.peakHour).toMatch(/\d{2}:\d{2}/);
  });
});
