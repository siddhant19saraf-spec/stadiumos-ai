// @ts-nocheck
import type { Match, ScheduleSlot, Conflict, Venue, Team } from "../types";
import { VENUES, TEAMS } from "../constants";

export interface ISchedulingEngine {
  generateSchedule(matches: Match[]): ScheduleSlot[];
  detectConflicts(slots: ScheduleSlot[], matches: Match[], venues: Venue[]): Conflict[];
  resolveConflict(conflict: Conflict): string;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export class MockSchedulingEngine implements ISchedulingEngine {
  generateSchedule(matches: Match[]): ScheduleSlot[] {
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

  detectConflicts(slots: ScheduleSlot[], matches: Match[], venues: Venue[]): Conflict[] {
    const conflicts: Conflict[] = [];

    const venueSlots: Record<string, ScheduleSlot[]> = {};
    for (const slot of slots) {
      if (!venueSlots[slot.venueId]) venueSlots[slot.venueId] = [];
      venueSlots[slot.venueId]!.push(slot);
    }

    for (const [venueId, venueSlotsList] of Object.entries(venueSlots)) {
      for (let i = 0; i < venueSlotsList.length; i++) {
        for (let j = i + 1; j < venueSlotsList.length; j++) {
          const a = venueSlotsList[i]!;
          const b = venueSlotsList[j]!;
          if (a.date !== b.date) continue;

          const aStart = timeToMinutes(a.startTime);
          const aEnd = timeToMinutes(a.endTime);
          const bStart = timeToMinutes(b.startTime);

          if (Math.abs(aStart - bStart) < 180) {
            const venue = venues.find((v) => v.id === venueId);
            conflicts.push({
              id: uid("conf"),
              type: "time_overlap",
              severity: "high",
              title: `Time Overlap at ${venue?.name ?? venueId}`,
              description: `Matches scheduled too close together at ${venue?.name ?? venueId}. Gap: ${Math.abs(aStart - bStart)} min.`,
              affectedIds: [a.matchId, b.matchId],
              affectedVenues: [venueId],
              aiResolution: `Reschedule one match to a different time slot. Minimum 3-hour gap required between matches at same venue.`,
              aiConfidence: 92,
              resolved: false,
              detectedAt: new Date().toISOString(),
              resolvedAt: null,
            });
          }
        }
      }
    }

    for (const team of TEAMS.slice(0, 8)) {
      const teamMatches = matches.filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id);
      for (let i = 0; i < teamMatches.length; i++) {
        for (let j = i + 1; j < teamMatches.length; j++) {
          const a = new Date(teamMatches[i]!.scheduledDate).getTime();
          const b = new Date(teamMatches[j]!.scheduledDate).getTime();
          const daysDiff = Math.abs((b - a) / 86400000);
          if (daysDiff < 2 && daysDiff > 0) {
            conflicts.push({
              id: uid("conf"),
              type: "team_rest_violation",
              severity: "critical",
              title: `Insufficient Rest for ${team.name}`,
              description: `${team.name} has only ${Math.round(daysDiff)} days between matches. Minimum 3 days rest required.`,
              affectedIds: [teamMatches[i]!.id, teamMatches[j]!.id],
              affectedVenues: [teamMatches[i]!.venueId, teamMatches[j]!.venueId],
              aiResolution: `Reschedule ${teamMatches[j]!.id} to allow 3+ days rest. Priority: ${team.name}'s rest period.`,
              aiConfidence: 95,
              resolved: false,
              detectedAt: new Date().toISOString(),
              resolvedAt: null,
            });
          }
        }
      }
    }

    return conflicts;
  }

  resolveConflict(conflict: Conflict): string {
    return conflict.aiResolution;
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export const schedulingEngine = new MockSchedulingEngine();

