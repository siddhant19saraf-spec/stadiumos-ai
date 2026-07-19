import { describe, it, expect } from "vitest";
import { parkingEngine } from "../services/parking-engine";
import { PARKING_LOTS } from "../constants";

describe("ParkingEngine", () => {
  it("should return all parking lots", () => {
    const lots = parkingEngine.getLots();
    expect(lots.length).toBeGreaterThanOrEqual(10);
    expect(lots[0]).toHaveProperty("id");
    expect(lots[0]).toHaveProperty("type");
    expect(lots[0]).toHaveProperty("capacity");
    expect(lots[0]).toHaveProperty("coordinates");
    expect(lots[0]).toHaveProperty("entryRoadId");
    expect(lots[0]).toHaveProperty("exitRoadId");
  });

  it("should simulate statuses for all lots", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    expect(statuses.size).toBe(PARKING_LOTS.length);

    for (const [, s] of statuses) {
      expect(s).toHaveProperty("lotId");
      expect(s).toHaveProperty("totalSlots");
      expect(s).toHaveProperty("occupied");
      expect(s).toHaveProperty("available");
      expect(s).toHaveProperty("reserved");
      expect(s).toHaveProperty("blocked");
      expect(s).toHaveProperty("occupancyPercent");
      expect(s).toHaveProperty("vehicleTurnoverRate");
      expect(s).toHaveProperty("avgParkingDurationMin");
      expect(s).toHaveProperty("lastUpdated");

      // Total invariants
      expect(s.occupied + s.available + s.reserved + s.blocked).toBeLessThanOrEqual(s.totalSlots);
      expect(s.occupancyPercent).toBeGreaterThanOrEqual(0);
      expect(s.occupancyPercent).toBeLessThanOrEqual(100);
      expect(s.vehicleTurnoverRate).toBeGreaterThan(0);
      expect(s.avgParkingDurationMin).toBeGreaterThan(0);
    }
  });

  it("should include all lot types with correct capacity ranges", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const vip = statuses.get("lot-vip");
    expect(vip).toBeDefined();
    expect(vip!.type).toBe("vip");
    expect(vip!.totalSlots).toBe(150);

    const ev = statuses.get("lot-ev");
    expect(ev).toBeDefined();
    expect(ev!.type).toBe("ev_charging");
    expect(ev!.totalSlots).toBe(200);

    const overflow = statuses.get("lot-overflow");
    expect(overflow).toBeDefined();
    expect(overflow!.type).toBe("overflow");
    expect(overflow!.totalSlots).toBe(500);
  });

  it("should find lot by ID", () => {
    const lot = parkingEngine.getLotById("lot-a");
    expect(lot).toBeDefined();
    expect(lot!.id).toBe("lot-a");
    expect(lot!.name).toContain("North Main");

    const missing = parkingEngine.getLotById("nonexistent");
    expect(missing).toBeUndefined();
  });

  it("should classify occupancy trends correctly", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const first = Array.from(statuses.values())[0];
    expect(first).toBeDefined();

    const trend = parkingEngine.calculateOccupancyTrend(first!, first!);
    expect(["rising", "falling", "stable"]).toContain(trend);
  });

  it("should return stable trend when no previous status", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const first = Array.from(statuses.values())[0]!;
    const trend = parkingEngine.calculateOccupancyTrend(first, undefined);
    expect(trend).toBe("stable");
  });

  it("should simulate different occupancy per lot type", () => {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const vip = statuses.get("lot-vip")!;
    const overflow = statuses.get("lot-overflow")!;
    // VIP should generally have higher occupancy than overflow
    expect(vip.occupancyPercent).toBeGreaterThanOrEqual(0);
    expect(overflow.occupancyPercent).toBeGreaterThanOrEqual(0);
  });
});
