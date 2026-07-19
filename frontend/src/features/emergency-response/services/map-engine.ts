import type { MapEntity, Incident, ResponseTeam } from "../types";
import { EVACUATION_EXITS, RALLY_POINTS } from "../constants";

export interface IMapEngine {
  buildEntities(incidents: Incident[], teams: ResponseTeam[]): MapEntity[];
  getBlockedAreas(incidents: Incident[]): MapEntity[];
}

export class MockMapEngine implements IMapEngine {
  buildEntities(incidents: Incident[], teams: ResponseTeam[]): MapEntity[] {
    const entities: MapEntity[] = [...EVACUATION_EXITS, ...RALLY_POINTS];

    for (const inc of incidents) {
      if (inc.status === "resolved") continue;
      entities.push({
        id: `map-inc-${inc.id}`,
        type: "incident",
        label: inc.title,
        coordinates: inc.coordinates,
        severity: inc.severity,
        status: inc.status,
        pulse: inc.severity === "critical",
      });
    }

    for (const team of teams) {
      const type = this.teamToMapType(team.type);
      entities.push({
        id: `map-team-${team.id}`,
        type,
        label: `${team.name} (${team.status.replace(/_/g, " ")})`,
        coordinates: team.coordinates,
        status: team.status,
        pulse: team.status === "dispatched",
      });
    }

    return entities;
  }

  getBlockedAreas(incidents: Incident[]): MapEntity[] {
    return incidents
      .filter((i) => (i.type === "fire" || i.type === "infrastructure_failure") && i.status !== "resolved")
      .map((i) => ({
        id: `blocked-${i.id}`,
        type: "blocked_area" as const,
        label: `Blocked: ${i.location}`,
        coordinates: i.coordinates,
        severity: i.severity,
        pulse: false,
      }));
  }

  private teamToMapType(teamType: string): MapEntity["type"] {
    const map: Record<string, MapEntity["type"]> = {
      medical_alpha: "medical_team",
      medical_bravo: "medical_team",
      security_alpha: "security_team",
      security_bravo: "security_team",
      fire_response: "fire_team",
      hazmat: "fire_team",
      evacuation: "rally_point",
      engineering: "command_post",
      vip_protection: "security_team",
      crowd_management: "security_team",
      communications: "command_post",
      command: "command_post",
    };
    return map[teamType] ?? "rally_point";
  }
}

export const mapEngine = new MockMapEngine();
