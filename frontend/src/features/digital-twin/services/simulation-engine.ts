import type { SimulationScenario, StadiumZone, ZoneLiveStatus, LiveAnalytics, DigitalIncident, TimelineSnapshot } from "../types";
import { STADIUM_ZONES, ZONE_CAPACITIES, SCENARIO_CONFIGS } from "../constants";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export interface ISimulationEngine {
  applyScenario(scenario: SimulationScenario, zones: StadiumZone[], currentStatuses: Map<string, ZoneLiveStatus>): Map<string, ZoneLiveStatus>;
  generateSnapshot(statuses: Map<string, ZoneLiveStatus>, label: string): TimelineSnapshot;
}

export class MockSimulationEngine implements ISimulationEngine {
  applyScenario(scenario: SimulationScenario, zones: StadiumZone[], currentStatuses: Map<string, ZoneLiveStatus>): Map<string, ZoneLiveStatus> {
    const updated = new Map(currentStatuses);
    const config = SCENARIO_CONFIGS[scenario];

    for (const zone of zones) {
      const current = updated.get(zone.id);
      if (!current) continue;

      switch (scenario) {
        case "heavy_rain":
          updated.set(zone.id, { ...current, temperature: 14, occupancyPercent: Math.min(100, current.occupancyPercent * 0.85), queueTimeMinutes: current.queueTimeMinutes + 8, status: zone.type === "concourse" ? "degraded" : current.status });
          break;
        case "power_failure":
          updated.set(zone.id, { ...current, status: zone.type === "seating" || zone.type === "concourse" ? "degraded" : current.status, safetyScore: Math.max(0, current.safetyScore - 30), riskScore: Math.min(100, current.riskScore + 25), temperature: current.temperature + 3 });
          break;
        case "medical_emergency":
          if (zone.type === "seating") {
            updated.set(zone.id, { ...current, occupancyPercent: Math.min(100, current.occupancyPercent + 10), riskScore: Math.min(100, current.riskScore + 20), status: current.occupancyPercent > 75 ? "emergency" : current.status });
          }
          break;
        case "crowd_surge":
          updated.set(zone.id, { ...current, occupancyPercent: Math.min(100, current.occupancyPercent + 35), riskScore: Math.min(100, current.riskScore + 40), safetyScore: Math.max(0, current.safetyScore - 35), queueTimeMinutes: current.queueTimeMinutes + 15, status: "emergency" });
          break;
        case "fire":
          updated.set(zone.id, { ...current, status: zone.type === "seating" || zone.type === "concourse" ? "emergency" : current.status, safetyScore: Math.max(0, current.safetyScore - 50), riskScore: Math.min(100, current.riskScore + 50), temperature: Math.min(50, current.temperature + 12) });
          break;
        case "network_failure":
          updated.set(zone.id, { ...current, riskScore: Math.min(100, current.riskScore + 15), safetyScore: Math.max(0, current.safetyScore - 15) });
          break;
        case "parking_overflow":
          if (zone.id.startsWith("park-")) {
            updated.set(zone.id, { ...current, occupancyPercent: 98, riskScore: 80, queueTimeMinutes: 35, status: "emergency" });
          }
          break;
        case "vip_arrival":
          if (zone.type === "gate_entry" || zone.type === "vip") {
            updated.set(zone.id, { ...current, occupancyPercent: Math.min(100, current.occupancyPercent + 20), queueTimeMinutes: current.queueTimeMinutes + 5, safetyScore: Math.min(100, current.safetyScore + 10) });
          }
          break;
        case "final_match_crowd":
          updated.set(zone.id, { ...current, occupancyPercent: Math.min(100, current.occupancyPercent * 1.3), queueTimeMinutes: current.queueTimeMinutes + 12, temperature: current.temperature + 4 });
          break;
        case "weather_delay":
          updated.set(zone.id, { ...current, queueTimeMinutes: current.queueTimeMinutes + 20, occupancyPercent: Math.min(100, current.occupancyPercent * 1.15), temperature: 16 });
          break;
      }
    }

    return updated;
  }

  generateSnapshot(statuses: Map<string, ZoneLiveStatus>, label: string): TimelineSnapshot {
    return {
      timestamp: new Date().toISOString(),
      label,
      zones: Array.from(statuses.values()),
      entities: [],
      incidents: [],
      analytics: {} as LiveAnalytics,
    };
  }
}

export const simulationEngine = new MockSimulationEngine();

