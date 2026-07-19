import type {
  Match, ScheduleSlot,
  ResourceAllocation, OperationalTimelineEntry, TimelinePhase, PredictiveInsight,
} from "../types";
import { VENUES, TEAMS, RESOURCE_REQUIREMENTS, WEATHER_SCENARIOS, PHASE_DURATION_MINUTES } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${rand(100, 999)}`;
}

export class TournamentSimulationEngine {
  private tick = 0;

  simulateMatches(): Match[] {
    this.tick++;
    const activeVenues = VENUES.filter((v) => v.status === "ready" || v.currentEvent);
    const matches: Match[] = [];

    for (let i = 0; i < 8; i++) {
      const venue = activeVenues[i % activeVenues.length] ?? pick(VENUES);
      const home = TEAMS[i % TEAMS.length]!;
      const away = TEAMS[(i + 8) % TEAMS.length]!;
      const capacity = venue.capacity;
      const ticketsSold = rand(Math.round(capacity * 0.65), capacity);
      const weather = pick(WEATHER_SCENARIOS);
      const attendance = Math.round(ticketsSold * randf(0.92, 0.99));
      const delayRisk = randf(2, 35, 0);

      const now = new Date();
      now.setHours(rand(14, 22), rand(0, 59), 0, 0);
      const scheduledTime = now.toTimeString().slice(0, 5);

      const phases: import("../types").OperationalPhase[] = [
        "preparation", "security_sweep", "team_arrival", "warmup",
        "match", "half_time_break", "post_match",
      ];

      matches.push({
        id: uid("match"),
        title: `${home.shortName} vs ${away.shortName}`,
        stage: "group_stage",
        status: i < 4 ? "scheduled" : i < 6 ? "preparing" : i < 7 ? "in_progress" : "completed",
        venueId: venue.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        scheduledDate: new Date(Date.now() + rand(0, 86400000 * 3)).toISOString().split("T")[0]!,
        scheduledTime,
        actualStartTime: null,
        actualEndTime: null,
        estimatedDuration: 105,
        attendance,
        capacityPercent: parseFloat(((attendance / capacity) * 100).toFixed(0)),
        crowdDensity: randf(40, 88, 0),
        aiPredictedAttendance: Math.round(capacity * randf(0.7, 0.95)),
        revenue: attendance * rand(45, 120),
        broadcastCoverage: ["BBC", "Sky Sports", "beIN Sports", "ESPN"].slice(0, rand(2, 4)),
        weatherForecast: weather,
        incidents: rand(0, 3),
        securityLevel: delayRisk > 25 ? "elevated" : "normal",
        aiDelayRisk: delayRisk,
        delayMinutes: Math.random() < 0.2 ? rand(5, 25) : 0,
        operationalTimeline: phases.map((phase) => ({
          phase,
          startTime: "",
          endTime: "",
          status: "pending" as const,
          durationMinutes: PHASE_DURATION_MINUTES[phase],
        })),
        ticketsSold,
        ticketsAvailable: capacity - ticketsSold,
      });
    }

    return matches;
  }

  simulateSchedule(matches: Match[]): ScheduleSlot[] {
    return matches.map((match) => ({
      id: uid("slot"),
      matchId: match.id,
      venueId: match.venueId,
      date: match.scheduledDate,
      startTime: match.scheduledTime,
      endTime: `${(parseInt(match.scheduledTime.split(":")[0]!) + 2).toString().padStart(2, "0")}:${match.scheduledTime.split(":")[1]}`,
      phase: "match",
      allocatedResources: [],
      conflicts: [],
    }));
  }

  simulateTimeline(matches: Match[]): OperationalTimelineEntry[] {
    return matches.slice(0, 6).map((match) => {
      const venue = VENUES.find((v) => v.id === match.venueId);
      const now = new Date();
      const phases: TimelinePhase[] = OPERATIONAL_PHASES.map((phase, idx) => ({
        phase,
        startTime: new Date(now.getTime() + idx * 60000).toISOString(),
        endTime: new Date(now.getTime() + (idx + 1) * 60000).toISOString(),
        status: idx < 3 ? "completed" : idx === 3 ? "active" : "pending" as const,
        durationMinutes: PHASE_DURATION_MINUTES[phase],
      }));

      return {
        id: uid("tl"),
        matchId: match.id,
        matchTitle: match.title,
        venueName: venue?.name ?? "Unknown",
        phases,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
      };
    });
  }

  simulateResources(): ResourceAllocation[] {
    return Object.entries(RESOURCE_REQUIREMENTS).map(([type, req]) => {
      const required = req.base + rand(0, 20);
      const allocated = Math.round(required * randf(0.7, 1.05));
      const available = Math.round(required * randf(0.8, 1.2));
      const util = (allocated / Math.max(1, available)) * 100;
      return {
        type: type as import("../types").ResourceType,
        required,
        allocated,
        available,
        utilizationPercent: parseFloat(util.toFixed(0)),
        status: allocated >= required ? "sufficient" : "shortage",
        teams: [`${type}-team-${rand(1, 3)}`],
      };
    });
  }

  simulatePredictions(): PredictiveInsight[] {
    return [
      {
        id: uid("pred"), type: "attendance",
        title: "Attendance Surge Predicted for Finals",
        description: "AI models predict 98% attendance for upcoming quarter-finals. Additional crowd management resources recommended.",
        probability: randf(75, 94, 0), severity: "high",
        affectedEntity: "National Stadium",
        timeframe: "Next 48 hours",
        suggestedAction: "Increase steward allocation by 30% for quarter-final matches.",
        confidence: randf(80, 95, 0),
      },
      {
        id: uid("pred"), type: "weather_impact",
        title: "Weather Disruption Risk — Seville",
        description: "Storm system approaching Seville. Potential impact on Group G matches at La Cartuja.",
        probability: randf(55, 80, 0), severity: "medium",
        affectedEntity: "La Cartuja",
        timeframe: "Next 24 hours",
        suggestedAction: "Activate weather contingency plan. Prepare for potential 2-hour delay.",
        confidence: randf(70, 88, 0),
      },
      {
        id: uid("pred"), type: "resource_shortage",
        title: "Medical Staff Shortage Expected",
        description: "Multiple concurrent matches creating demand spike. Weekend schedule shows 3 matches within 4-hour window.",
        probability: randf(60, 82, 0), severity: "high",
        affectedEntity: "Barcelona venues",
        timeframe: "48-72 hours",
        suggestedAction: "Request mutual aid from Valencia medical reserve. Prioritize critical coverage.",
        confidence: randf(75, 90, 0),
      },
      {
        id: uid("pred"), type: "parking_overflow",
        title: "Parking Capacity Risk — Madrid",
        description: "Concurrent events at National Stadium and Metropolitano creating parking demand exceeding supply by estimated 40%.",
        probability: randf(65, 88, 0), severity: "medium",
        affectedEntity: "Madrid venues",
        timeframe: "Match day +2 hours",
        suggestedAction: "Activate overflow parking at IFEMA. Shuttle service every 5 minutes.",
        confidence: randf(78, 92, 0),
      },
      {
        id: uid("pred"), type: "emergency_probability",
        title: "Elevated Emergency Risk — High Attendance",
        description: "Historical data shows 23% higher incident rate at >90% capacity. Upcoming matches at risk.",
        probability: randf(35, 55, 0), severity: "medium",
        affectedEntity: "All high-capacity venues",
        timeframe: "Ongoing",
        suggestedAction: "Pre-position additional medical teams. Increase patrol frequency.",
        confidence: randf(72, 86, 0),
      },
    ];
  }
}

const OPERATIONAL_PHASES: import("../types").OperationalPhase[] = [
  "preparation", "security_sweep", "team_arrival", "warmup",
  "match", "half_time_break", "post_match", "cleanup", "maintenance",
];

export const simulationEngine = new TournamentSimulationEngine();

