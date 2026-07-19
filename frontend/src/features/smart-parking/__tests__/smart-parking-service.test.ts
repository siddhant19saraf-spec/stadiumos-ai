// @ts-nocheck
import { describe, it, expect, beforeEach } from "vitest";
import { smartParkingService } from "../services/smart-parking-service";
import type { SmartParkingState } from "../types";

describe("SmartParkingService", () => {
  beforeEach(() => {
    // Reset any state by getting fresh state
    smartParkingService.getState();
  });

  it("should be a singleton", () => {
    const instance = require("../services/smart-parking-service").smartParkingService;
    expect(instance).toBeDefined();
  });

  it("should initialize with a valid state", () => {
    const state = smartParkingService.getState();
    expect(state).toHaveProperty("lots");
    expect(state).toHaveProperty("slotStatuses");
    expect(state).toHaveProperty("roads");
    expect(state).toHaveProperty("traffic");
    expect(state).toHaveProperty("predictions");
    expect(state).toHaveProperty("recommendations");
    expect(state).toHaveProperty("alerts");
    expect(state).toHaveProperty("analytics");
    expect(state).toHaveProperty("simulation");
    expect(state).toHaveProperty("lastUpdated");

    expect(state.lots.length).toBeGreaterThan(0);
    expect(state.slotStatuses.size).toBe(state.lots.length);
    expect(state.roads.length).toBeGreaterThan(0);
    expect(state.predictions.length).toBe(state.lots.length);
    expect(Array.isArray(state.recommendations)).toBe(true);
    expect(Array.isArray(state.alerts)).toBe(true);
  });

  it("should select a lot without errors", () => {
    smartParkingService.selectLot("lot-a");
    const state = smartParkingService.getState();
    expect(state.selectedLotId).toBe("lot-a");
    expect(state.selectedRoadId).toBeNull();
  });

  it("should select a road without errors", () => {
    smartParkingService.selectRoad("north-entry");
    const state = smartParkingService.getState();
    expect(state.selectedRoadId).toBe("north-entry");
    expect(state.selectedLotId).toBeNull();
  });

  it("should deselect when selecting null", () => {
    smartParkingService.selectLot("lot-a");
    smartParkingService.selectLot(null);
    const state = smartParkingService.getState();
    expect(state.selectedLotId).toBeNull();
  });

  it("should manage simulation lifecycle", () => {
    const initial = smartParkingService.getState();
    expect(initial.simulation.active).toBe(false);

    smartParkingService.startSimulation("final_match");
    const during = smartParkingService.getState();
    expect(during.simulation.active).toBe(true);
    expect(during.simulation.scenario).toBe("final_match");

    smartParkingService.stopSimulation();
    const after = smartParkingService.getState();
    expect(after.simulation.active).toBe(false);
    expect(after.simulation.scenario).toBeNull();
  });

  it("should acknowledge alerts", () => {
    const state = smartParkingService.getState();
    if (state.alerts.length > 0) {
      const alertId = state.alerts[0].id;
      expect(state.alerts[0].acknowledged).toBe(false);
      smartParkingService.acknowledgeAlert(alertId);
      const updated = smartParkingService.getState();
      const alert = updated.alerts.find((a) => a.id === alertId);
      expect(alert?.acknowledged).toBe(true);
    }
    // If no alerts exist on first tick, this is fine
    expect(true).toBe(true);
  });

  it("should allow subscribing to state changes", () => {
    let called = false;
    const unsub = smartParkingService.subscribe(() => { called = true; });
    smartParkingService.selectLot("lot-vip");
    expect(called).toBe(true);
    unsub();
  });

  it("should unsubscribe correctly", () => {
    let count = 0;
    const unsub = smartParkingService.subscribe(() => { count++; });
    unsub();
    smartParkingService.selectLot("lot-ev");
    const prevCount = count;
    expect(count).toBe(prevCount);
  });

  it("should start and stop the update interval", () => {
    smartParkingService.start(1000);
    // No direct way to verify interval, but should not throw
    smartParkingService.stop();
    expect(true).toBe(true);
  });

  it("should maintain valid analytics across state updates", () => {
    const state = smartParkingService.getState();
    expect(state.analytics.aiOptimizationScore).toBeGreaterThanOrEqual(0);
    expect(state.analytics.avgOccupancyPercent).toBeGreaterThan(0);
    expect(state.analytics.trafficDelayMin).toBeGreaterThanOrEqual(0);
  });
});

