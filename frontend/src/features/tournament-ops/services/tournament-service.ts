// @ts-nocheck
import type {
  Tournament, Venue, Team, Match, ScheduleSlot, Conflict, AIRecommendation,
  TournamentAnalytics, OperationalTimelineEntry, PredictiveInsight, ResourceAllocation, TournamentState,
} from "../types";
import { TOURNAMENT, VENUES, TEAMS } from "../constants";
import { simulationEngine } from "./simulation-engine";
import { schedulingEngine } from "./scheduling-engine";
import { conflictEngine } from "./conflict-engine";
import { recommendationEngine } from "./recommendation-engine";
import { analyticsEngine } from "./analytics-engine";
import { optimizationEngine } from "./optimization-engine";
import { reportingEngine } from "./reporting-engine";

class TournamentService {
  private static instance: TournamentService;
  private subscribers = new Set<(state: TournamentState) => void>();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private state: TournamentState;

  private constructor() {
    this.state = this.initialState();
  }

  static getInstance(): TournamentService {
    if (!TournamentService.instance) TournamentService.instance = new TournamentService();
    return TournamentService.instance;
  }

  private initialState(): TournamentState {
    const matches = simulationEngine.simulateMatches();
    const schedule = schedulingEngine.generateSchedule(matches);
    const venues = VENUES.map((v) => ({ ...v }));
    const teams = TEAMS.map((t) => ({ ...t }));
    const resources = simulationEngine.simulateResources();

    return {
      tournament: { ...TOURNAMENT },
      venues,
      teams,
      matches,
      schedule,
      conflicts: [],
      recommendations: [],
      analytics: {} as TournamentAnalytics,
      timeline: simulationEngine.simulateTimeline(matches),
      predictions: simulationEngine.simulatePredictions(),
      resourceAllocations: resources,
      lastUpdated: new Date().toISOString(),
    };
  }

  subscribe(cb: (state: TournamentState) => void): () => void {
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

  getState(): TournamentState {
    return this.state;
  }

  private active = false;

  private tick() {
    if (this.active) return;
    this.active = true;

    try {
      const newMatches = simulationEngine.simulateMatches();
      this.state.matches = this.state.matches.map(
        (old) => newMatches.find((m) => m.id === old.id) ?? old,
      );
      if (newMatches.length > this.state.matches.length) {
        this.state.matches.push(...newMatches.slice(this.state.matches.length));
      }

      this.state.schedule = schedulingEngine.generateSchedule(this.state.matches);
      this.state.conflicts = conflictEngine.detectAll(this.state.schedule, this.state.matches, this.state.venues);
      this.state.resourceAllocations = optimizationEngine.optimizeResources(this.state.matches, this.state.venues);
      this.state.analytics = analyticsEngine.compute(this.state.matches, this.state.venues, this.state.conflicts);
      this.state.recommendations = recommendationEngine.generate(this.state.conflicts, this.state.matches, this.state.analytics);
      this.state.timeline = simulationEngine.simulateTimeline(this.state.matches);

      this.notify();
    } finally {
      this.active = false;
    }
  }

  generateReport(type: "executive" | "venue" | "match" | "conflict", entityId?: string): string {
    switch (type) {
      case "executive": return reportingEngine.generateExecutiveSummary(this.state);
      case "venue": {
        const venue = this.state.venues.find((v) => v.id === entityId);
        return venue ? reportingEngine.generateVenueReport(venue) : "Venue not found";
      }
      case "match": {
        const match = this.state.matches.find((m) => m.id === entityId);
        return match ? reportingEngine.generateMatchReport(match) : "Match not found";
      }
      case "conflict": return reportingEngine.generateConflictReport(this.state.conflicts);
      default: return "Unknown report type";
    }
  }

  acknowledgeRecommendation(recId: string) {
    this.state.recommendations = this.state.recommendations.map((r) =>
      r.id === recId ? { ...r, implemented: true } : r,
    );
    this.notify();
  }
}

export const tournamentService = TournamentService.getInstance();

