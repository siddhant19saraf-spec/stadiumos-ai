import type { Incident, ResponseTeam, SmartAlert, AIRecommendation, EmergencyAnalytics, MapEntity, DispatchAction, ResponseTimePoint } from "../types";
import { simulationEngine } from "./simulation-engine";
import { incidentEngine } from "./incident-engine";
import { dispatchEngine } from "./dispatch-engine";
import { recommendationEngine } from "./recommendation-engine";
import { notificationEngine } from "./notification-engine";
import { analyticsEngine } from "./analytics-engine";
import { mapEngine } from "./map-engine";
import { TEAM_CONFIGS } from "../constants";

export interface EmergencyState {
  incidents: Incident[];
  teams: ResponseTeam[];
  alerts: SmartAlert[];
  recommendations: AIRecommendation[];
  analytics: EmergencyAnalytics;
  mapEntities: MapEntity[];
  dispatchLog: DispatchAction[];
  responseTimeHistory: ResponseTimePoint[];
  lastUpdated: string;
}

class EmergencyService {
  private static instance: EmergencyService;
  private subscribers = new Set<(state: EmergencyState) => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: EmergencyState = this.initialState();

  private constructor() {}

  static getInstance(): EmergencyService {
    if (!EmergencyService.instance) EmergencyService.instance = new EmergencyService();
    return EmergencyService.instance;
  }

  private initialState(): EmergencyState {
    return {
      incidents: [],
      teams: TEAM_CONFIGS.map((t) => ({ ...t })),
      alerts: [],
      recommendations: [],
      analytics: {
        averageResponseMinutes: 0, openIncidents: 0, criticalIncidents: 0,
        resolvedIncidents: 0, totalIncidents: 0, emergencyReadinessScore: 100,
        safetyScore: 100, avgResolutionMinutes: 0, activeTeams: 0, availableTeams: 12,
        escalationRate: 0, criticalPerType: {}, responseTimeHistory: [],
        evacuationStatus: "none", affectedZones: [], resourceUtilization: 0,
        communicationStatus: "operational",
      },
      mapEntities: [],
      dispatchLog: [],
      responseTimeHistory: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  subscribe(cb: (state: EmergencyState) => void): () => void {
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

  getState(): EmergencyState {
    return this.state;
  }

  async executeCommand(type: string, incidentId: string, params: Record<string, string>): Promise<void> {
    const incident = this.state.incidents.find((i) => i.id === incidentId);
    if (!incident) return;

    switch (type) {
      case "dispatch": {
        const team = this.state.teams.find((t) => t.id === params.teamId);
        if (!team) return;
        const result = await dispatchEngine.dispatch(incident, team);
        this.updateAfterDispatch(result.incident, result.team, result.log);
        break;
      }
      case "resolve": {
        const resTeam = this.state.teams.find((t) => t.id === incident.assignedTeam);
        if (!resTeam) return;
        const result = await dispatchEngine.resolve(incident, resTeam);
        this.updateAfterDispatch(result.incident, result.team, result.log);
        const responseTime = analyticsEngine.recordResponseTime(result.incident, 0);
        this.state.responseTimeHistory.push(responseTime);
        break;
      }
      case "escalate": {
        const escalated = await incidentEngine.updateStatus(incident, "assessing");
        this.state.incidents = this.state.incidents.map((i) => i.id === incidentId ? escalated : i);
        break;
      }
      default: {
        console.warn(`Unhandled command type: ${type} for incident ${incidentId}`);
        break;
      }
    }

    this.notify();
  }

  private updateAfterDispatch(incident: Incident, team: ResponseTeam, log: DispatchAction) {
    this.state.incidents = this.state.incidents.map((i) => i.id === incident.id ? incident : i);
    this.state.teams = this.state.teams.map((t) => t.id === team.id ? team : t);
    this.state.dispatchLog = [...this.state.dispatchLog, log];
  }

  acknowledgeAlert(alertId: string) {
    this.state.alerts = this.state.alerts.map((a) => a.id === alertId ? { ...a, acknowledged: true } : a);
    this.notify();
  }

  private active = false;

  private tick() {
    if (this.active) return;
    this.active = true;

    try {
      const newIncident = simulationEngine.generateIncident(
        this.state.incidents.filter((i) => i.status !== "resolved").length,
      );

      if (newIncident) {
        incidentEngine.processNew(newIncident).then((processed) => {
          if (this.intervalId) {
            this.state.incidents.push(processed);
          }
        });
      }

      this.simulateTeamMovements();
      this.simulateStatusProgressions();

      const activeIncidents = this.state.incidents.filter((i) => i.status !== "resolved");

      const existingAlertKeys = new Set(this.state.alerts.map((a) => `${a.incidentId}-${a.type}`));
      const newAlerts = [
        ...notificationEngine.generate(activeIncidents, this.state.alerts),
        ...simulationEngine.generateSmartAlerts(activeIncidents),
      ].filter((a) => !existingAlertKeys.has(`${a.incidentId}-${a.type}`) && !this.state.alerts.some((e) => e.id === a.id));

      this.state.alerts = [...notificationEngine.clearExpired(this.state.alerts), ...newAlerts];
      this.state.recommendations = recommendationEngine.generate(activeIncidents, this.state.teams);
      this.state.mapEntities = mapEngine.buildEntities(this.state.incidents, this.state.teams);
      this.state.analytics = analyticsEngine.compute(this.state.incidents, this.state.teams, this.state.responseTimeHistory);

      this.notify();
    } finally {
      this.active = false;
    }
  }

  private simulateTeamMovements() {
    this.state.teams = this.state.teams.map((team) => {
      if (team.status === "dispatched") {
        const progress = Math.random();
        if (progress < 0.3) {
          return { ...team, status: "on_scene" as const, estimatedArrivalMinutes: 0 };
        }
        return { ...team, estimatedArrivalMinutes: Math.max(0, team.estimatedArrivalMinutes - 1) };
      }
      if (team.status === "returning" && Math.random() < 0.2) {
        return { ...team, status: "available" as const };
      }
      return team;
    });
  }

  private simulateStatusProgressions() {
    this.state.incidents = this.state.incidents.map((inc) => {
      if (inc.status === "reported" && Math.random() < 0.4) {
        return { ...inc, status: "analyzing" as const, lastUpdated: new Date().toISOString() };
      }
      if (inc.status === "analyzing" && Math.random() < 0.5) {
        return { ...inc, status: "assessing" as const, lastUpdated: new Date().toISOString() };
      }
      return inc;
    });
  }
}

export const emergencyService = EmergencyService.getInstance();
