import type { Conflict, Match, ScheduleSlot, Venue } from "../types";

export interface IConflictEngine {
  detectAll(slots: ScheduleSlot[], matches: Match[], venues: Venue[]): Conflict[];
  prioritize(conflicts: Conflict[]): Conflict[];
  suggestResolution(conflict: Conflict): string;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export class MockConflictEngine implements IConflictEngine {
  detectAll(slots: ScheduleSlot[], matches: Match[], venues: Venue[]): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const venue of venues) {
      const venueSlots = slots.filter((s) => s.venueId === venue.id);
      for (let i = 0; i < venueSlots.length; i++) {
        for (let j = i + 1; j < venueSlots.length; j++) {
          const a = venueSlots[i]!;
          const b = venueSlots[j]!;
          if (a.date !== b.date) continue;

          const aEnd = timeToMinutes(a.endTime);
          const bStart = timeToMinutes(b.startTime);
          const gap = bStart - aEnd;

          if (gap < 180) {
            const severity = gap < 60 ? "critical" : gap < 120 ? "high" : "medium";
            conflicts.push({
              id: uid("conf"), type: "time_overlap", severity,
              title: `Time Overlap at ${venue.name}`,
              description: `Only ${gap} min gap between matches at ${venue.name}. Minimum 180 min required.`,
              affectedIds: [a.matchId, b.matchId],
              affectedVenues: [venue.id],
              aiResolution: `Adjust kickoff times to ensure ${180 - gap} min recovery buffer.`,
              aiConfidence: 90, resolved: false,
              detectedAt: new Date().toISOString(), resolvedAt: null,
            });
          }
        }
      }
    }

    const venueIdsByDate: Record<string, Record<string, number>> = {};
    for (const slot of slots) {
      if (!venueIdsByDate[slot.date]) venueIdsByDate[slot.date] = {};
      venueIdsByDate[slot.date]![slot.venueId] = (venueIdsByDate[slot.date]![slot.venueId] ?? 0) + 1;
    }

    for (const [date, vCounts] of Object.entries(venueIdsByDate)) {
      const venuesWithMultiple = Object.entries(vCounts).filter(([, count]) => count > 1);
      for (const [venueId] of venuesWithMultiple) {
        const venue = venues.find((v) => v.id === venueId);
        conflicts.push({
          id: uid("conf"), type: "venue_double_booked", severity: "high",
          title: `Venue Overbooking at ${venue?.name ?? venueId}`,
          description: `${venue?.name ?? venueId} has multiple events on ${date}. Maximum 1 match per venue per day.`,
          affectedIds: [venueId],
          affectedVenues: [venueId],
          aiResolution: `Relocate one match to alternative venue. Suggested: ${venues.filter((v) => v.id !== venueId && v.status === "ready").map((v) => v.name).join(", ") || "none available"}`,
          aiConfidence: 85, resolved: false,
          detectedAt: new Date().toISOString(), resolvedAt: null,
        });
      }
    }

    for (const venue of venues.filter((v) => v.status === "maintenance")) {
      const venueSlots = slots.filter((s) => s.venueId === venue.id);
      if (venueSlots.length > 0) {
        conflicts.push({
          id: uid("conf"), type: "maintenance_conflict", severity: "critical",
          title: `Maintenance Conflict at ${venue.name}`,
          description: `${venue.name} is under maintenance but has ${venueSlots.length} match(es) scheduled.`,
          affectedIds: venueSlots.map((s) => s.matchId),
          affectedVenues: [venue.id],
          aiResolution: `Relocate matches from ${venue.name} to ${venues.filter((v) => v.id !== venue.id && v.status === "ready").map((v) => v.name).join(", ") || "backup venue"}.`,
          aiConfidence: 93, resolved: false,
          detectedAt: new Date().toISOString(), resolvedAt: null,
        });
      }
    }

    return conflicts;
  }

  prioritize(conflicts: Conflict[]): Conflict[] {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...conflicts].sort((a, b) => order[a.severity] - order[b.severity]);
  }

  suggestResolution(conflict: Conflict): string {
    return conflict.aiResolution;
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export const conflictEngine = new MockConflictEngine();

