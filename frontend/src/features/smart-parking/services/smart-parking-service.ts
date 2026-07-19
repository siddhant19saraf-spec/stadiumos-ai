import type { SmartParkingState, SimulationScenario } from "../types";
import { PARKING_LOTS, TRAFFIC_ROADS } from "../constants";
import { parkingEngine } from "./parking-engine";
import { trafficEngine } from "./traffic-engine";
import { predictionEngine } from "./prediction-engine";
import { simulationEngine } from "./simulation-engine";
import { recommendationEngine } from "./recommendation-engine";
import { analyticsEngine } from "./analytics-engine";
import { alertEngine } from "./alert-engine";

class SmartParkingService {
  private static instance: SmartParkingService;
  private subscribers = new Set<(state: SmartParkingState) => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: SmartParkingState;
  private active = false;

  private constructor() {
    this.state = this.initialState();
  }

  static getInstance(): SmartParkingService {
    if (!SmartParkingService.instance) SmartParkingService.instance = new SmartParkingService();
    return SmartParkingService.instance;
  }

  private initialState(): SmartParkingState {
    const statuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    const roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, statuses);
    const traffic = trafficEngine.computeTrafficHealth(roads);
    const predictions = predictionEngine.predictOccupancy(PARKING_LOTS, statuses);
    const trafficPredictions = predictionEngine.predictTraffic(roads, statuses);
    const alerts = alertEngine.evaluate(statuses, roads);
    const recommendations = recommendationEngine.generate({ statuses, roads, alerts });
    const analytics = analyticsEngine.compute(statuses, traffic);

    return {
      lots: PARKING_LOTS,
      slotStatuses: statuses,
      roads,
      traffic,
      predictions,
      trafficPredictions,
      recommendations,
      alerts,
      analytics,
      simulation: { active: false, scenario: null, speed: 1, startedAt: null, elapsedMs: 0 },
      selectedLotId: null,
      selectedRoadId: null,
      lastUpdated: new Date().toISOString(),
    };
  }

  subscribe(cb: (state: SmartParkingState) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    this.state.lastUpdated = new Date().toISOString();
    this.subscribers.forEach((cb) => cb(this.state));
  }

  start(refreshMs: number) {
    if (this.intervalId) return;
    this.tick();
    this.intervalId = setInterval(() => this.tick(), refreshMs);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  getState(): SmartParkingState {
    return this.state;
  }

  selectLot(lotId: string | null) {
    this.state.selectedLotId = lotId;
    this.state.selectedRoadId = null;
    this.notify();
  }

  selectRoad(roadId: string | null) {
    this.state.selectedRoadId = roadId;
    this.state.selectedLotId = null;
    this.notify();
  }

  startSimulation(scenario: SimulationScenario) {
    this.state.simulation = { active: true, scenario, speed: 1, startedAt: new Date().toISOString(), elapsedMs: 0 };
    const result = simulationEngine.applyScenario(scenario, PARKING_LOTS, this.state.slotStatuses, this.state.roads);
    this.state.slotStatuses = result.statuses;
    this.state.roads = result.roads;
    this.state.traffic = trafficEngine.computeTrafficHealth(this.state.roads);
    this.state.analytics = analyticsEngine.compute(this.state.slotStatuses, this.state.traffic);
    this.state.alerts = alertEngine.evaluate(this.state.slotStatuses, this.state.roads);
    this.notify();
  }

  stopSimulation() {
    this.state.simulation = { active: false, scenario: null, speed: 1, startedAt: null, elapsedMs: 0 };
    this.state.slotStatuses = parkingEngine.simulateStatuses(PARKING_LOTS);
    this.state.roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, this.state.slotStatuses);
    this.state.traffic = trafficEngine.computeTrafficHealth(this.state.roads);
    this.state.analytics = analyticsEngine.compute(this.state.slotStatuses, this.state.traffic);
    this.state.alerts = alertEngine.evaluate(this.state.slotStatuses, this.state.roads);
    this.notify();
  }

  acknowledgeAlert(alertId: string) {
    this.state.alerts = this.state.alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true } : a,
    );
    this.state.recommendations = recommendationEngine.generate({
      statuses: this.state.slotStatuses, roads: this.state.roads, alerts: this.state.alerts,
    });
    this.notify();
  }

  private tick() {
    if (this.active) return;
    this.active = true;

    try {
      if (!this.state.simulation.active) {
        this.state.slotStatuses = parkingEngine.simulateStatuses(PARKING_LOTS);
        this.state.roads = trafficEngine.simulateConditions(TRAFFIC_ROADS, this.state.slotStatuses);
      }
      this.state.traffic = trafficEngine.computeTrafficHealth(this.state.roads);
      this.state.predictions = predictionEngine.predictOccupancy(PARKING_LOTS, this.state.slotStatuses);
      this.state.trafficPredictions = predictionEngine.predictTraffic(this.state.roads, this.state.slotStatuses);
      this.state.alerts = alertEngine.evaluate(this.state.slotStatuses, this.state.roads);
      this.state.recommendations = recommendationEngine.generate({
        statuses: this.state.slotStatuses, roads: this.state.roads, alerts: this.state.alerts,
      });
      this.state.analytics = analyticsEngine.compute(this.state.slotStatuses, this.state.traffic);

      this.notify();
    } finally {
      this.active = false;
    }
  }
}

export const smartParkingService = SmartParkingService.getInstance();
