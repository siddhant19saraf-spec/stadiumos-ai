import type { QueueIntelligenceState, SimulationScenario } from "../types";
import { QUEUE_POINTS, MENU_ITEMS } from "../constants";
import { queueEngine } from "./queue-engine";
import { predictionEngine } from "./prediction-engine";
import { recommendationEngine } from "./recommendation-engine";
import { inventoryEngine } from "./inventory-engine";
import { analyticsEngine } from "./analytics-engine";
import { simulationEngine } from "./simulation-engine";
import { alertEngine } from "./alert-engine";

class QueueIntelligenceService {
  private static instance: QueueIntelligenceService;
  private subscribers = new Set<(state: QueueIntelligenceState) => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: QueueIntelligenceState;
  private active = false;

  private constructor() {
    this.state = this.initialState();
  }

  static getInstance(): QueueIntelligenceService {
    if (!QueueIntelligenceService.instance) QueueIntelligenceService.instance = new QueueIntelligenceService();
    return QueueIntelligenceService.instance;
  }

  private initialState(): QueueIntelligenceState {
    const queueStatuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    const inventory = inventoryEngine.simulate(MENU_ITEMS, queueStatuses);
    const predictions = predictionEngine.predictQueues(QUEUE_POINTS, queueStatuses);
    const alerts = alertEngine.evaluate(queueStatuses, inventory);
    const recommendations = recommendationEngine.generate({ statuses: queueStatuses, alerts, inventory });
    const analytics = analyticsEngine.compute(queueStatuses, inventory);

    return {
      queuePoints: QUEUE_POINTS,
      queueStatuses,
      predictions,
      inventory: [],
      inventoryStatuses: inventory,
      analytics,
      recommendations,
      alerts,
      simulation: { active: false, scenario: null, speed: 1, startedAt: null, elapsedMs: 0 },
      selectedQueueId: null,
      lastUpdated: new Date().toISOString(),
    };
  }

  subscribe(cb: (state: QueueIntelligenceState) => void): () => void {
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

  getState(): QueueIntelligenceState {
    return this.state;
  }

  selectQueue(queueId: string | null) {
    this.state.selectedQueueId = queueId;
    this.notify();
  }

  startSimulation(scenario: SimulationScenario) {
    this.state.simulation = { active: true, scenario, speed: 1, startedAt: new Date().toISOString(), elapsedMs: 0 };
    this.state.queueStatuses = simulationEngine.applyScenario(scenario, QUEUE_POINTS, this.state.queueStatuses);
    this.state.analytics = analyticsEngine.compute(this.state.queueStatuses, this.state.inventoryStatuses);
    this.state.alerts = alertEngine.evaluate(this.state.queueStatuses, this.state.inventoryStatuses);
    this.notify();
  }

  stopSimulation() {
    this.state.simulation = { active: false, scenario: null, speed: 1, startedAt: null, elapsedMs: 0 };
    this.state.queueStatuses = queueEngine.simulateStatuses(QUEUE_POINTS);
    this.state.analytics = analyticsEngine.compute(this.state.queueStatuses, this.state.inventoryStatuses);
    this.state.alerts = alertEngine.evaluate(this.state.queueStatuses, this.state.inventoryStatuses);
    this.notify();
  }

  acknowledgeAlert(alertId: string) {
    this.state.alerts = this.state.alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true } : a,
    );
    this.state.recommendations = recommendationEngine.generate({
      statuses: this.state.queueStatuses, alerts: this.state.alerts, inventory: this.state.inventoryStatuses,
    });
    this.notify();
  }

  private tick() {
    if (this.active) return;
    this.active = true;
    try {
      if (!this.state.simulation.active) {
        this.state.queueStatuses = queueEngine.simulateStatuses(QUEUE_POINTS);
      }
      this.state.inventoryStatuses = inventoryEngine.simulate(MENU_ITEMS, this.state.queueStatuses);
      this.state.predictions = predictionEngine.predictQueues(QUEUE_POINTS, this.state.queueStatuses);
      this.state.alerts = alertEngine.evaluate(this.state.queueStatuses, this.state.inventoryStatuses);
      this.state.recommendations = recommendationEngine.generate({
        statuses: this.state.queueStatuses, alerts: this.state.alerts, inventory: this.state.inventoryStatuses,
      });
      this.state.analytics = analyticsEngine.compute(this.state.queueStatuses, this.state.inventoryStatuses);
      this.notify();
    } finally {
      this.active = false;
    }
  }
}

export const queueIntelligenceService = QueueIntelligenceService.getInstance();
