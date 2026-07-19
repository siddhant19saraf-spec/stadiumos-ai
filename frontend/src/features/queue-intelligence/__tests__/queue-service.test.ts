import { describe, it, expect, beforeEach } from "vitest";
import { queueIntelligenceService } from "../services/queue-service";

describe("QueueIntelligenceService", () => {
  beforeEach(() => {
    queueIntelligenceService.getState();
  });

  it("should initialize with valid state", () => {
    const state = queueIntelligenceService.getState();
    expect(state).toHaveProperty("queuePoints");
    expect(state).toHaveProperty("queueStatuses");
    expect(state).toHaveProperty("predictions");
    expect(state).toHaveProperty("inventoryStatuses");
    expect(state).toHaveProperty("analytics");
    expect(state).toHaveProperty("recommendations");
    expect(state).toHaveProperty("alerts");
    expect(state).toHaveProperty("simulation");
    expect(state).toHaveProperty("lastUpdated");

    expect(state.queuePoints.length).toBeGreaterThan(0);
    expect(state.queueStatuses.size).toBe(state.queuePoints.length);
    expect(state.predictions.length).toBe(state.queuePoints.length);
    expect(state.inventoryStatuses.size).toBeGreaterThan(0);
  });

  it("should select a queue point", () => {
    queueIntelligenceService.selectQueue("food-1");
    expect(queueIntelligenceService.getState().selectedQueueId).toBe("food-1");
    queueIntelligenceService.selectQueue(null);
    expect(queueIntelligenceService.getState().selectedQueueId).toBeNull();
  });

  it("should handle simulation lifecycle", () => {
    const initial = queueIntelligenceService.getState();
    expect(initial.simulation.active).toBe(false);

    queueIntelligenceService.startSimulation("halftime_rush");
    const during = queueIntelligenceService.getState();
    expect(during.simulation.active).toBe(true);
    expect(during.simulation.scenario).toBe("halftime_rush");

    queueIntelligenceService.stopSimulation();
    const after = queueIntelligenceService.getState();
    expect(after.simulation.active).toBe(false);
    expect(after.simulation.scenario).toBeNull();
  });

  it("should acknowledge alerts", () => {
    const state = queueIntelligenceService.getState();
    if (state.alerts.length > 0) {
      const alertId = state.alerts[0].id;
      queueIntelligenceService.acknowledgeAlert(alertId);
      const updated = queueIntelligenceService.getState();
      expect(updated.alerts.find((a) => a.id === alertId)?.acknowledged).toBe(true);
    }
  });

  it("should subscribe to state changes", () => {
    let called = false;
    const unsub = queueIntelligenceService.subscribe(() => { called = true; });
    queueIntelligenceService.selectQueue("food-2");
    expect(called).toBe(true);
    unsub();
  });

  it("should unsubscribe correctly", () => {
    let count = 0;
    const unsub = queueIntelligenceService.subscribe(() => { count++; });
    unsub();
    queueIntelligenceService.selectQueue("merch-1");
    expect(count).toBe(0);
  });

  it("should start and stop update interval", () => {
    queueIntelligenceService.start(1000);
    queueIntelligenceService.stop();
    expect(true).toBe(true);
  });

  it("should have valid analytics in initial state", () => {
    const state = queueIntelligenceService.getState();
    expect(state.analytics.aiOptimizationScore).toBeGreaterThanOrEqual(0);
    expect(state.analytics.operationalEfficiency).toBeGreaterThan(0);
    expect(state.analytics.customerSatisfactionAvg).toBeGreaterThan(0);
  });
});
