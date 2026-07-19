// @ts-nocheck
import type { SimulationScenario, QueuePoint, QueuePointStatus, CounterStatus } from "../types";
import { SCENARIO_CONFIGS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export interface ISimulationEngine {
  getAvailableScenarios(): Array<{ id: SimulationScenario; name: string; description: string; details: string; icon: string; color: string; tags: string[] }>;
  applyScenario(scenario: SimulationScenario, points: QueuePoint[], statuses: Map<string, QueuePointStatus>): Map<string, QueuePointStatus>;
}

export class MockSimulationEngine implements ISimulationEngine {
  getAvailableScenarios() {
    return (Object.keys(SCENARIO_CONFIGS) as SimulationScenario[]).map((id) => ({ id, ...SCENARIO_CONFIGS[id] }));
  }

  applyScenario(scenario: SimulationScenario, _points: QueuePoint[], statuses: Map<string, QueuePointStatus>): Map<string, QueuePointStatus> {
    const updated = new Map(statuses);

    for (const [id, s] of updated) {
      let modified = { ...s };

      switch (scenario) {
        case "halftime_rush":
          if (s.type === "food_counter" || s.type === "beverage_counter") {
            modified = this.surge(modified, 2.8, 1.3);
          }
          break;
        case "rain_delay":
          if (s.type === "restroom" || s.type === "merchandise") {
            modified = this.surge(modified, 1.8, 1.15);
          } else if (s.type === "food_counter") {
            modified = this.surge(modified, 1.3, 1.1);
          }
          break;
        case "vip_event":
          if (s.type === "food_counter") {
            modified = { ...modified, currentLength: Math.round(modified.currentLength * 0.7), estimatedWaitMin: Math.round(modified.estimatedWaitMin * 0.6) };
          }
          break;
        case "sold_out_match":
          modified = this.surge(modified, 2.0, 1.25);
          modified.customerSatisfaction = Math.max(1, modified.customerSatisfaction - 0.5);
          break;
        case "counter_failure":
          if (s.type === "food_counter" || s.type === "beverage_counter") {
            const failed = Math.max(1, Math.floor(modified.totalCounters * 0.3));
            modified.activeCounters = Math.max(1, modified.activeCounters - failed);
            modified.currentLength = Math.round(modified.currentLength * 1.5);
            modified.estimatedWaitMin = Math.round(modified.estimatedWaitMin * 1.6);
            modified.serviceSpeedSec = Math.round(modified.serviceSpeedSec * 1.2);
            modified.status = "critical";
            const cs: CounterStatus[] = [];
            for (let i = 0; i < modified.totalCounters; i++) {
              cs.push(i < modified.activeCounters ? "open" : i < modified.activeCounters + failed ? "breakdown" : "closed");
            }
            modified.counterStatuses = cs;
          }
          break;
        case "staff_shortage":
          const reduction = Math.max(1, Math.floor(modified.totalCounters * 0.25));
          modified.activeCounters = Math.max(1, modified.activeCounters - reduction);
          modified.currentLength = Math.round(modified.currentLength * 1.3);
          modified.estimatedWaitMin = Math.round(modified.estimatedWaitMin * 1.4);
          modified.serviceSpeedSec = Math.round(modified.serviceSpeedSec * 1.15);
          break;
        case "emergency_evacuation":
          modified.currentLength = Math.round(modified.currentLength * 0.1);
          modified.estimatedWaitMin = 1;
          modified.activeCounters = Math.max(1, Math.floor(modified.totalCounters * 0.15));
          modified.status = "normal";
          modified.customerSatisfaction = Math.max(1, modified.customerSatisfaction - 2);
          break;
        case "merchandise_drop":
          if (s.type === "merchandise") {
            modified = this.surge(modified, 3.5, 1.4);
          }
          break;
        case "heat_wave":
          if (s.type === "beverage_counter") {
            modified = this.surge(modified, 2.5, 1.2);
          } else if (s.type === "food_counter") {
            modified.currentLength = Math.round(modified.currentLength * 0.7);
            modified.estimatedWaitMin = Math.round(modified.estimatedWaitMin * 0.7);
          }
          break;
        case "post_game_exit":
          if (s.type === "entry_gate") {
            modified = this.surge(modified, 2.5, 1.3);
          } else if (s.type === "restroom") {
            modified = this.surge(modified, 1.8, 1.1);
          } else if (s.type === "merchandise") {
            modified = this.surge(modified, 1.4, 1.1);
          } else if (s.type === "customer_service") {
            modified = this.surge(modified, 2.0, 1.2);
          }
          break;
      }

      updated.set(id, modified);
    }

    return updated;
  }

  private surge(s: QueuePointStatus, lengthMult: number, waitMult: number): QueuePointStatus {
    const newLength = Math.min(500, Math.round(s.currentLength * lengthMult));
    const newWait = Math.min(60, Math.round(s.estimatedWaitMin * waitMult));
    const satisfactionDrop = s.customerSatisfaction - 0.3 * (waitMult - 1) * 2;
    return {
      ...s,
      currentLength: newLength,
      estimatedWaitMin: newWait,
      capacityUtilization: Math.min(100, s.capacityUtilization + 20),
      customerSatisfaction: Math.max(1, parseFloat(satisfactionDrop.toFixed(1))),
      status: newWait >= 25 ? "critical" : newWait >= 15 ? "congested" : s.status,
      serviceSpeedSec: Math.round(s.serviceSpeedSec * (1 + (waitMult - 1) * 0.5)),
    };
  }
}

export const simulationEngine = new MockSimulationEngine();

