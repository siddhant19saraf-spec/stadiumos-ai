import type { SimulationScenario, ParkingLot, ParkingLotStatus, TrafficRoad } from "../types";
import { SCENARIO_CONFIGS } from "../constants";

export interface ISimulationEngine {
  getScenarioConfig(scenario: SimulationScenario): { name: string; description: string; details: string; icon: string; color: string; tags: string[] };
  applyScenario(scenario: SimulationScenario, lots: ParkingLot[], statuses: Map<string, ParkingLotStatus>, roads: TrafficRoad[]): { statuses: Map<string, ParkingLotStatus>; roads: TrafficRoad[] };
  getAvailableScenarios(): Array<{ id: SimulationScenario; name: string; description: string; details: string; icon: string; color: string; tags: string[] }>;
}

export class MockSimulationEngine implements ISimulationEngine {
  getScenarioConfig(scenario: SimulationScenario) {
    return SCENARIO_CONFIGS[scenario];
  }

  getAvailableScenarios() {
    return (Object.keys(SCENARIO_CONFIGS) as SimulationScenario[]).map((id) => ({
      id,
      ...SCENARIO_CONFIGS[id],
    }));
  }

  applyScenario(
    scenario: SimulationScenario,
    lots: ParkingLot[],
    statuses: Map<string, ParkingLotStatus>,
    roads: TrafficRoad[],
  ): { statuses: Map<string, ParkingLotStatus>; roads: TrafficRoad[] } {
    const updatedStatuses = new Map(statuses);
    const updatedRoads = roads.map((r) => ({ ...r }));

    for (const lot of lots) {
      const s = updatedStatuses.get(lot.id);
      if (!s) continue;

      switch (scenario) {
        case "heavy_rain":
          updatedStatuses.set(lot.id, {
            ...s, occupancyPercent: Math.min(95, s.occupancyPercent - 15),
            occupied: Math.max(0, s.occupied - Math.round(s.occupied * 0.15)),
            available: s.available + Math.round(s.occupied * 0.15),
            avgParkingDurationMin: s.avgParkingDurationMin + 30,
            vehicleTurnoverRate: Math.max(0.1, s.vehicleTurnoverRate - 0.3),
          });
          break;
        case "vip_arrival":
          if (lot.type === "vip") {
            updatedStatuses.set(lot.id, {
              ...s, occupancyPercent: 92, occupied: Math.round(s.totalSlots * 0.92),
              reserved: s.reserved + 10, available: Math.max(0, s.available - 10),
            });
          }
          break;
        case "final_match":
          updatedStatuses.set(lot.id, {
            ...s, occupancyPercent: this.clamp(s.occupancyPercent + 25, 0, 98),
            occupied: Math.min(s.totalSlots, s.occupied + Math.round(s.totalSlots * 0.25)),
            available: Math.max(0, s.available - Math.round(s.totalSlots * 0.25)),
            avgParkingDurationMin: s.avgParkingDurationMin + 45,
            vehicleTurnoverRate: Math.min(3, s.vehicleTurnoverRate + 0.5),
          });
          break;
        case "power_failure":
          if (lot.type === "ev_charging") {
            updatedStatuses.set(lot.id, {
              ...s, evChargingUsed: 0, evChargingTotal: 0,
              occupancyPercent: Math.max(20, s.occupancyPercent - 30),
              blocked: s.blocked + Math.round(s.totalSlots * 0.5),
            });
          } else {
            updatedStatuses.set(lot.id, {
              ...s, occupancyPercent: Math.max(15, s.occupancyPercent - 10),
              blocked: s.blocked + Math.round(s.totalSlots * 0.1),
            });
          }
          break;
        case "overflow_parking":
          if (lot.type === "overflow") {
            updatedStatuses.set(lot.id, {
              ...s, occupancyPercent: Math.min(90, s.occupancyPercent + 60),
              occupied: Math.round(s.totalSlots * 0.85),
              available: Math.round(s.totalSlots * 0.1),
            });
          } else if (lot.type === "general") {
            updatedStatuses.set(lot.id, {
              ...s, occupancyPercent: Math.min(95, s.occupancyPercent + 10),
              blocked: s.blocked + 5,
            });
          }
          break;
        case "emergency_evacuation":
          updatedStatuses.set(lot.id, {
            ...s, occupancyPercent: Math.max(5, s.occupancyPercent - 60),
            occupied: Math.round(s.totalSlots * 0.08),
            available: s.totalSlots - Math.round(s.totalSlots * 0.08) - s.reserved - s.blocked,
            vehicleTurnoverRate: 4.0,
            avgParkingDurationMin: 5,
          });
          break;
        case "road_closure":
          break;
        case "event_exit_surge":
          updatedStatuses.set(lot.id, {
            ...s, occupancyPercent: Math.max(10, s.occupancyPercent - 40),
            vehicleTurnoverRate: 3.5,
            avgParkingDurationMin: Math.max(5, s.avgParkingDurationMin - 60),
          });
          break;
        case "peak_traffic":
          if (lot.type !== "overflow" && lot.type !== "rental") {
            updatedStatuses.set(lot.id, {
              ...s, occupancyPercent: Math.min(97, s.occupancyPercent + 20),
              occupied: Math.min(s.totalSlots, s.occupied + Math.round(s.totalSlots * 0.2)),
              available: Math.max(0, s.available - Math.round(s.totalSlots * 0.2)),
              avgParkingDurationMin: s.avgParkingDurationMin + 15,
            });
          }
          break;
        case "holiday_event":
          if (lot.type === "accessible") {
            updatedStatuses.set(lot.id, {
              ...s, occupancyPercent: Math.min(95, s.occupancyPercent + 20),
              reserved: s.reserved + 5,
            });
          } else {
            updatedStatuses.set(lot.id, {
              ...s, occupancyPercent: Math.min(95, s.occupancyPercent + 8),
              avgParkingDurationMin: s.avgParkingDurationMin + 20,
            });
          }
          break;
      }
    }

    switch (scenario) {
      case "heavy_rain":
        updatedRoads.forEach((r) => {
          r.currentSpeedKmph = Math.round(r.currentSpeedKmph * 0.5);
          r.congestionLevel = "moderate";
          r.queueLengthMeters += 80;
        });
        break;
      case "vip_arrival":
        updatedRoads.forEach((r) => {
          if (r.id === "north-entry") { r.status = "congested"; r.currentSpeedKmph = 10; r.congestionLevel = "high"; r.queueLengthMeters = 300; }
        });
        break;
      case "final_match":
        updatedRoads.forEach((r) => {
          if (r.direction === "entry") {
            r.congestionLevel = "severe"; r.currentSpeedKmph = Math.round(r.currentSpeedKmph * 0.3);
            r.queueLengthMeters += 200; r.gateCongestionPercent = Math.min(100, r.gateCongestionPercent + 30);
          }
        });
        break;
      case "power_failure":
        updatedRoads.forEach((r) => {
          r.gateCongestionPercent = Math.min(100, r.gateCongestionPercent + 20);
          r.currentSpeedKmph = Math.round(r.currentSpeedKmph * 0.7);
        });
        break;
      case "emergency_evacuation":
        updatedRoads.forEach((r) => {
          if (r.direction === "exit") { r.status = "open"; r.congestionLevel = "high"; r.vehicleCount += 500; r.queueLengthMeters = 350; }
          if (r.direction === "entry") { r.status = "closed"; r.congestionLevel = "low"; r.vehicleCount = 0; }
        });
        break;
      case "road_closure":
        updatedRoads.forEach((r) => {
          if (r.id === "east-entry" || r.id === "east-exit") {
            r.status = "closed"; r.congestionLevel = "severe"; r.currentSpeedKmph = 0; r.queueLengthMeters = 0;
          }
          if (r.id === "north-entry" || r.id === "south-entry") {
            r.queueLengthMeters += 250; r.congestionLevel = "severe"; r.gateCongestionPercent = Math.min(100, r.gateCongestionPercent + 40);
          }
        });
        break;
      case "event_exit_surge":
        updatedRoads.forEach((r) => {
          if (r.direction === "exit") {
            r.congestionLevel = "severe"; r.currentSpeedKmph = Math.round(r.currentSpeedKmph * 0.25);
            r.queueLengthMeters += 300; r.vehicleCount += 400; r.gateCongestionPercent = Math.min(100, r.gateCongestionPercent + 50);
          }
        });
        break;
      case "peak_traffic":
        updatedRoads.forEach((r) => {
          if (r.direction === "entry") {
            r.vehicleCount += 200; r.queueLengthMeters += 150; r.gateCongestionPercent = Math.min(100, r.gateCongestionPercent + 25);
          }
        });
        break;
      case "holiday_event":
        updatedRoads.forEach((r) => {
          r.queueLengthMeters += 40;
          r.vehicleCount += 50;
        });
        break;
    }

    return { statuses: updatedStatuses, roads: updatedRoads };
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }
}

export const simulationEngine = new MockSimulationEngine();
