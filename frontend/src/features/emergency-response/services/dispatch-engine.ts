import type { DispatchAction, Incident, ResponseTeam, IncidentStatus, TeamType } from "../types";

export interface IDispatchEngine {
  recommendTeam(incident: Incident, available: ResponseTeam[]): ResponseTeam | null;
  dispatch(incident: Incident, team: ResponseTeam): Promise<{ incident: Incident; team: ResponseTeam; log: DispatchAction }>;
  resolve(incident: Incident, team: ResponseTeam): Promise<{ incident: Incident; team: ResponseTeam; log: DispatchAction }>;
}

export class MockDispatchEngine implements IDispatchEngine {
  private teamDistance(team: ResponseTeam, incident: Incident): number {
    return Math.sqrt(
      Math.pow(team.coordinates.x - incident.coordinates.x, 2) +
      Math.pow(team.coordinates.y - incident.coordinates.y, 2),
    );
  }

  recommendTeam(incident: Incident, available: ResponseTeam[]): ResponseTeam | null {
    const suitable = available
      .filter((t) => t.status === "available" && t.type === incident.aiAnalysis.recommendedTeam)
      .sort((a, b) => this.teamDistance(a, incident) - this.teamDistance(b, incident));

    if (suitable.length > 0) return suitable[0]!;

    const anyAvailable = available
      .filter((t) => t.status === "available")
      .sort((a, b) => this.teamDistance(a, incident) - this.teamDistance(b, incident));
    return anyAvailable[0] ?? null;
  }

  async dispatch(
    incident: Incident,
    team: ResponseTeam,
  ): Promise<{ incident: Incident; team: ResponseTeam; log: DispatchAction }> {
    const now = new Date().toISOString();
    const log: DispatchAction = {
      id: `dispatch-${incident.id}-${Date.now()}`,
      incidentId: incident.id,
      action: `Dispatch ${team.name}`,
      teamId: team.id,
      timestamp: now,
      authorizedBy: null,
      status: "executed",
      result: `${team.name} dispatched to ${incident.location}. ETA: ${team.estimatedArrivalMinutes} minutes.`,
    };

    return {
      incident: {
        ...incident,
        status: "dispatched" as IncidentStatus,
        assignedTeam: team.id,
        assignedTeamType: team.type as TeamType,
        lastUpdated: now,
        estimatedResolutionMinutes: incident.estimatedResolutionMinutes,
        timeline: [
          ...incident.timeline,
          {
            id: `${incident.id}-tl-dispatch-${Date.now()}`,
            action: `Team Dispatched`,
            actor: "Dispatch Engine",
            timestamp: now,
            detail: `${team.name} (${team.members} members, ${team.leader}) dispatched to ${incident.location}. ETA ${team.estimatedArrivalMinutes} min.`,
          },
        ],
      },
      team: {
        ...team,
        status: "dispatched" as const,
        incidentId: incident.id,
        estimatedArrivalMinutes: team.estimatedArrivalMinutes,
      },
      log,
    };
  }

  async resolve(
    incident: Incident,
    team: ResponseTeam,
  ): Promise<{ incident: Incident; team: ResponseTeam; log: DispatchAction }> {
    const now = new Date().toISOString();
    const log: DispatchAction = {
      id: `resolve-${incident.id}-${Date.now()}`,
      incidentId: incident.id,
      action: `Resolve Incident`,
      teamId: team.id,
      timestamp: now,
      authorizedBy: "Command Operator",
      status: "executed",
      result: `Incident ${incident.id} resolved by ${team.name}. Post-incident report generated.`,
    };

    return {
      incident: {
        ...incident,
        status: "resolved" as IncidentStatus,
        lastUpdated: now,
        timeline: [
          ...incident.timeline,
          {
            id: `${incident.id}-tl-resolve-${Date.now()}`,
            action: "Incident Resolved",
            actor: team.leader,
            timestamp: now,
            detail: `${team.name} resolved the incident. Area secured and normal operations resuming.`,
          },
        ],
      },
      team: {
        ...team,
        status: "returning" as const,
        incidentId: null,
      },
      log,
    };
  }
}

export const dispatchEngine = new MockDispatchEngine();
