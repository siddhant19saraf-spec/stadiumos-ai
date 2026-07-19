import type { CrowdAnalytics, StadiumZone, CrowdPrediction, CrowdRecommendation, CrowdAlert, AIInsight, CrowdTimelinePoint, GateUtilization, QueueGrowthPoint } from "../types";
import { simulationEngine } from "./simulation-engine";
import { predictionEngine } from "./prediction-engine";
import { recommendationEngine } from "./recommendation-engine";

export interface CrowdState {
  zones: StadiumZone[];
  analytics: CrowdAnalytics;
  predictions: CrowdPrediction[];
  recommendations: CrowdRecommendation[];
  alerts: CrowdAlert[];
  insights: AIInsight[];
  timeline: CrowdTimelinePoint[];
  gateUtilization: GateUtilization[];
  queueGrowth: QueueGrowthPoint[];
  eventPhase: string;
  lastUpdated: string;
}

class CrowdService {
  private static instance: CrowdService;
  private subscribers = new Set<(state: CrowdState) => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: CrowdState = this.initialState();

  private constructor() {}

  static getInstance(): CrowdService {
    if (!CrowdService.instance) CrowdService.instance = new CrowdService();
    return CrowdService.instance;
  }

  private initialState(): CrowdState {
    return {
      zones: [],
      analytics: {} as CrowdAnalytics,
      predictions: [],
      recommendations: [],
      alerts: [],
      insights: [],
      timeline: [],
      gateUtilization: [],
      queueGrowth: [],
      eventPhase: "second_half",
      lastUpdated: new Date().toISOString(),
    };
  }

  subscribe(cb: (state: CrowdState) => void): () => void {
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
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getState(): CrowdState {
    return this.state;
  }

  private tick() {
    const zones = simulationEngine.simulateZones();
    const analytics = simulationEngine.computeAnalytics(zones);
    const predictions = predictionEngine.analyze(zones, analytics);
    const recommendations = recommendationEngine.generate(zones, analytics);
    const alerts = simulationEngine.generateAlerts(zones);
    const insights = simulationEngine.generateInsights(zones, analytics);

    this.state = {
      zones,
      analytics,
      predictions,
      recommendations,
      alerts,
      insights,
      timeline: this.state.timeline.length === 0 ? simulationEngine.generateTimeline() : this.state.timeline,
      gateUtilization: this.state.gateUtilization.length === 0 ? simulationEngine.generateGateUtilization() : this.state.gateUtilization,
      queueGrowth: this.state.queueGrowth.length === 0 ? simulationEngine.generateQueueGrowth() : this.state.queueGrowth,
      eventPhase: simulationEngine.getCurrentPhase(),
      lastUpdated: new Date().toISOString(),
    };

    this.notify();
  }
}

export const crowdService = CrowdService.getInstance();
