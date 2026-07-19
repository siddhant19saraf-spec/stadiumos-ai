import type { DigitalTwinState, StadiumZone, ZoneLiveStatus, MapEntity, DigitalIncident, LiveAnalytics, AIInsight, ZoneRecommendation, LayerConfig, SimulationScenario, TimelineSnapshot } from "../types";
import { STADIUM_ZONES, LAYER_CONFIGS } from "../constants";
import { digitalTwinEngine } from "./digital-twin-engine";
import { simulationEngine } from "./simulation-engine";
import { mapEngine } from "./map-engine";
import { predictionEngine } from "./prediction-engine";
import { recommendationEngine } from "./recommendation-engine";
import { analyticsEngine } from "./analytics-engine";

class DigitalTwinService {
  private static instance: DigitalTwinService;
  private subscribers = new Set<(state: DigitalTwinState) => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: DigitalTwinState;
  private snapshotInterval: ReturnType<typeof setInterval> | null = null;
  private snapshotCount = 0;

  private constructor() {
    this.state = this.initialState();
  }

  static getInstance(): DigitalTwinService {
    if (!DigitalTwinService.instance) DigitalTwinService.instance = new DigitalTwinService();
    return DigitalTwinService.instance;
  }

  private initialState(): DigitalTwinState {
    const zones = digitalTwinEngine.getZones();
    const statuses = digitalTwinEngine.simulateZoneStatuses();
    const incidents = digitalTwinEngine.simulateIncidents(statuses);
    const entities = digitalTwinEngine.simulateEntities(statuses);
    const analytics = digitalTwinEngine.computeAnalytics(statuses, incidents);
    const insights = digitalTwinEngine.generateInsights(statuses, analytics);

    return {
      zones,
      zoneStatuses: statuses,
      layers: LAYER_CONFIGS.map((l) => ({ ...l })),
      entities,
      incidents,
      analytics,
      insights,
      recommendations: new Map(),
      simulation: { active: false, scenario: null, speed: 1, elapsedMs: 0, startTime: null },
      timeTravel: { active: false, currentTimestamp: new Date().toISOString(), speed: 1, direction: "paused", availableRange: { start: new Date().toISOString(), end: new Date().toISOString() } },
      selectedZoneId: null,
      highlightedAssetId: null,
      snapshots: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  subscribe(cb: (state: DigitalTwinState) => void): () => void {
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
    this.snapshotInterval = setInterval(() => this.captureSnapshot(), 30000);
  }

  stop() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.snapshotInterval) { clearInterval(this.snapshotInterval); this.snapshotInterval = null; }
  }

  getState(): DigitalTwinState {
    return this.state;
  }

  selectZone(zoneId: string | null) {
    this.state.selectedZoneId = zoneId;
    if (zoneId) {
      const status = this.state.zoneStatuses.get(zoneId);
      if (status) {
        const rec = recommendationEngine.getForZone(zoneId, status);
        this.state.recommendations.set(zoneId, rec);
      }
    }
    this.notify();
  }

  highlightAsset(assetId: string | null) {
    this.state.highlightedAssetId = assetId;
    this.notify();
  }

  toggleLayer(layerId: string) {
    this.state.layers = this.state.layers.map((l) =>
      l.id === layerId ? { ...l, enabled: !l.enabled } : l,
    );
    this.notify();
  }

  setLayerOpacity(layerId: string, opacity: number) {
    this.state.layers = this.state.layers.map((l) =>
      l.id === layerId ? { ...l, opacity } : l,
    );
    this.notify();
  }

  startSimulation(scenario: SimulationScenario) {
    this.state.simulation = { active: true, scenario, speed: 1, elapsedMs: 0, startTime: new Date().toISOString() };
    this.state.zoneStatuses = simulationEngine.applyScenario(scenario, this.state.zones, this.state.zoneStatuses);
    this.state.analytics = digitalTwinEngine.computeAnalytics(this.state.zoneStatuses, this.state.incidents);
    this.state.insights = digitalTwinEngine.generateInsights(this.state.zoneStatuses, this.state.analytics);
    this.notify();
  }

  stopSimulation() {
    this.state.simulation = { active: false, scenario: null, speed: 1, elapsedMs: 0, startTime: null };
    this.state.zoneStatuses = digitalTwinEngine.simulateZoneStatuses();
    this.state.analytics = digitalTwinEngine.computeAnalytics(this.state.zoneStatuses, this.state.incidents);
    this.notify();
  }

  startTimeTravel() {
    if (this.state.snapshots.length === 0) return;
    this.state.timeTravel = {
      ...this.state.timeTravel,
      active: true,
      direction: "forward",
      currentTimestamp: this.state.snapshots[0]!.timestamp,
    };
    this.notify();
  }

  stopTimeTravel() {
    this.state.timeTravel = { ...this.state.timeTravel, active: false, direction: "paused" };
    this.notify();
  }

  searchZones(query: string): StadiumZone[] {
    return mapEngine.search(query, this.state.zones);
  }

  private active = false;

  private tick() {
    if (this.active || this.state.timeTravel.active) return;
    this.active = true;

    try {
      if (!this.state.simulation.active) {
        this.state.zoneStatuses = digitalTwinEngine.simulateZoneStatuses();
        this.state.zoneStatuses = predictionEngine.predict30m(this.state.zoneStatuses, this.state.zones);
      }
      this.state.incidents = digitalTwinEngine.simulateIncidents(this.state.zoneStatuses);
      this.state.entities = digitalTwinEngine.simulateEntities(this.state.zoneStatuses);
      this.state.analytics = digitalTwinEngine.computeAnalytics(this.state.zoneStatuses, this.state.incidents);
      this.state.insights = digitalTwinEngine.generateInsights(this.state.zoneStatuses, this.state.analytics);

      if (this.state.selectedZoneId) {
        const status = this.state.zoneStatuses.get(this.state.selectedZoneId);
        if (status) {
          this.state.recommendations.set(this.state.selectedZoneId, recommendationEngine.getForZone(this.state.selectedZoneId, status));
        }
      }

      this.notify();
    } finally {
      this.active = false;
    }
  }

  private captureSnapshot() {
    if (this.state.timeTravel.active) return;
    this.snapshotCount++;
    const snapshot = simulationEngine.generateSnapshot(
      this.state.zoneStatuses,
      `Snapshot ${this.snapshotCount}`,
    );
    snapshot.entities = this.state.entities;
    snapshot.incidents = this.state.incidents;
    snapshot.analytics = this.state.analytics;

    this.state.snapshots = [...this.state.snapshots, snapshot].slice(-50);
    const end = snapshot.timestamp;
    const start = this.state.snapshots[0]?.timestamp ?? end;
    this.state.timeTravel.availableRange = { start, end };
  }
}

export const digitalTwinService = DigitalTwinService.getInstance();
