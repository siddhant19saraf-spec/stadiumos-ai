import type { StadiumZone, ZoneLiveStatus, MapEntity, DigitalIncident, LiveAnalytics, AIInsight, ZoneRecommendation } from "../types";
import { STADIUM_ZONES, ZONE_CAPACITIES } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export class DigitalTwinEngine {
  private tick = 0;

  getZones(): StadiumZone[] {
    return STADIUM_ZONES;
  }

  simulateZoneStatuses(): Map<string, ZoneLiveStatus> {
    this.tick++;
    const map = new Map<string, ZoneLiveStatus>();

    for (const zone of STADIUM_ZONES) {
      const capacity = ZONE_CAPACITIES[zone.id] ?? 500;
      const occupancyBase = this.getBaseOccupancy(zone.type);
      const wave = Math.sin(this.tick * 0.08 + parseInt(zone.id.slice(-2), 36)) * 0.08;
      const occupancyPercent = clamp(occupancyBase + wave + randf(-5, 5), 3, 98);
      const currentOccupancy = Math.round((occupancyPercent / 100) * capacity);

      map.set(zone.id, {
        zoneId: zone.id,
        currentOccupancy,
        maxCapacity: capacity,
        occupancyPercent,
        riskScore: clamp(randf(5, 45) + occupancyPercent * 0.3, 0, 100),
        safetyScore: clamp(100 - occupancyPercent * 0.5 + randf(-5, 5), 0, 100),
        queueTimeMinutes: zone.type === "food_court" || zone.type === "gate_entry" ? randf(2, 25, 0) : randf(0, 3, 0),
        temperature: randf(20, 30) + (occupancyPercent > 70 ? 2 : 0),
        status: occupancyPercent > 85 ? "emergency" : occupancyPercent > 70 ? "degraded" : "operational",
        maintenanceStatus: pick(["none", "none", "none", "scheduled", "in_progress"]),
        predictedOccupancy30m: clamp(Math.round(occupancyPercent + randf(-8, 18)), 0, 100),
        energyUsageKw: Math.round(capacity * 0.15 * (1 + occupancyPercent / 200)),
        cleaningStatus: pick(["clean", "clean", "clean", "due", "in_progress"]),
        lastUpdated: new Date().toISOString(),
      });
    }
    return map;
  }

  private getBaseOccupancy(type: string): number {
    const base: Record<string, number> = {
      seating: 72, vip: 55, gate_entry: 40, gate_exit: 35, concourse: 50,
      food_court: 60, parking: 70, medical: 25, security: 40, camera: 100,
      restroom: 30, elevator: 20, emergency_exit: 5, maintenance: 15,
      control_center: 80, broadcast: 75, retail: 45, first_aid: 20,
    };
    return base[type] ?? 40;
  }

  simulateEntities(statuses: Map<string, ZoneLiveStatus>): MapEntity[] {
    const entities: MapEntity[] = [];
    let idx = 0;

    for (const [zoneId, status] of statuses) {
      if (status.riskScore > 60) {
        entities.push({
          id: `entity-inc-${idx++}`, zoneId, type: "incident",
          label: `High Risk: ${zoneId}`,
          coordinates: { x: rand(10, 90), y: rand(10, 80) },
          status: "active", pulse: status.riskScore > 75, layer: "incidents",
        });
      }
      if (idx > 12) break;
    }

    const teamPositions = [
      { label: "Security Unit A", layer: "security_teams" as const },
      { label: "Security Unit B", layer: "security_teams" as const },
      { label: "Medical Team Alpha", layer: "medical_teams" as const },
      { label: "Medical Team Bravo", layer: "medical_teams" as const },
    ];
    for (const t of teamPositions) {
      entities.push({
        id: `entity-team-${idx++}`, zoneId: pick(STADIUM_ZONES).id, type: "team",
        label: t.label, coordinates: { x: rand(15, 85), y: rand(15, 75) },
        status: "available", pulse: false, layer: t.layer,
      });
    }

    return entities;
  }

  simulateIncidents(statuses: Map<string, ZoneLiveStatus>): DigitalIncident[] {
    const incidents: DigitalIncident[] = [];
    const now = new Date().toISOString();
    const highRisk = Array.from(statuses.entries()).filter(([, s]) => s.riskScore > 70);

    if (highRisk.length > 0 && Math.random() < 0.35) {
      const [zoneId, status] = pick(highRisk);
      const zone = STADIUM_ZONES.find((z) => z.id === zoneId);
      incidents.push({
        id: `inc-${Date.now()}-1`,
        type: "medical",
        title: `Medical Attention Required`,
        description: `Spectator in ${zone?.name ?? zoneId} requires medical assistance. Occupancy at ${status.occupancyPercent.toFixed(0)}%.`,
        severity: "high", zoneId, zoneName: zone?.name ?? zoneId,
        timestamp: now, status: "active",
      });
    }

    if (Math.random() < 0.15) {
      const zone = pick(STADIUM_ZONES.filter((z) => z.type === "seating"));
      incidents.push({
        id: `inc-${Date.now()}-2`, type: "security",
        title: "Suspicious Activity Reported",
        description: `Unattended item reported near ${zone.name}. Security dispatched.`,
        severity: "medium", zoneId: zone.id, zoneName: zone.name,
        timestamp: now, status: "active",
      });
    }

    if (Math.random() < 0.1) {
      incidents.push({
        id: `inc-${Date.now()}-3`, type: "lost_child",
        title: "Lost Child Report",
        description: "Child separated from parent near Gate C. Description: blue shirt, age 7.",
        severity: "medium", zoneId: "gate-c", zoneName: "Gate C",
        timestamp: now, status: "active",
      });
    }

    return incidents;
  }

  computeAnalytics(statuses: Map<string, ZoneLiveStatus>, incidents: DigitalIncident[]): LiveAnalytics {
    const statusesArr = Array.from(statuses.values());
    const totalCap = statusesArr.reduce((s, z) => s + z.maxCapacity, 0);
    const totalOcc = statusesArr.reduce((s, z) => s + z.currentOccupancy, 0);
    const avgSafety = statusesArr.reduce((s, z) => s + z.safetyScore, 0) / statusesArr.length;
    const avgTemp = statusesArr.reduce((s, z) => s + z.temperature, 0) / statusesArr.length;
    const degraded = statusesArr.filter((z) => z.status === "degraded" || z.status === "emergency").length;
    const maintenanceIssues = statusesArr.filter((z) => z.maintenanceStatus === "in_progress" || z.maintenanceStatus === "overdue").length;
    const parkingZones = statusesArr.filter((z) => z.zoneId.startsWith("park-"));
    const parkingUtil = parkingZones.length > 0 ? parkingZones.reduce((s, z) => s + z.occupancyPercent, 0) / parkingZones.length : 0;
    const queueZones = statusesArr.filter((z) => z.queueTimeMinutes > 5);
    const queueHealth = Math.max(0, 100 - queueZones.length * 8);

    const healthScore = clamp(100 - degraded * 5 - maintenanceIssues * 3, 0, 100);
    const maintenanceHealth = clamp(100 - maintenanceIssues * 10, 0, 100);
    const resourceUtil = statusesArr.filter((z) => z.status === "operational").length / Math.max(1, statusesArr.length) * 100;

    return {
      operationalHealth: parseFloat(healthScore.toFixed(0)),
      safetyIndex: parseFloat(avgSafety.toFixed(0)),
      energyUsageMw: parseFloat((statusesArr.reduce((s, z) => s + z.energyUsageKw, 0) / 1000).toFixed(1)),
      maintenanceHealth: parseFloat(maintenanceHealth.toFixed(0)),
      parkingUtilization: parseFloat(parkingUtil.toFixed(0)),
      resourceUtilization: parseFloat(resourceUtil.toFixed(0)),
      queueHealth: parseFloat(queueHealth.toFixed(0)),
      totalOccupancy: totalOcc,
      totalCapacity: totalCap,
      activeIncidents: incidents.filter((i) => i.status === "active").length,
      activeTeams: 4,
      avgTemperature: parseFloat(avgTemp.toFixed(1)),
    };
  }

  generateInsights(statuses: Map<string, ZoneLiveStatus>, analytics: LiveAnalytics): AIInsight[] {
    const insights: AIInsight[] = [];
    const now = new Date().toISOString();
    const highDensity = Array.from(statuses.values()).filter((s) => s.occupancyPercent > 75).length;
    const nearCapacity = Array.from(statuses.values()).filter((s) => s.occupancyPercent > 90);

    if (highDensity > 3) {
      insights.push({
        id: `insight-${Date.now()}-1`, type: "warning",
        title: "Crowd Congestion Detected",
        description: `${highDensity} zones exceeding 75% capacity. ${nearCapacity.length} zones near critical. Recommend proactive crowd management.`,
        severity: nearCapacity.length > 0 ? "high" : "medium",
        confidence: randf(82, 95), timestamp: now,
        suggestedAction: "Deploy additional stewards to affected zones. Activate queue management protocols.",
      });
    }

    const parking = statuses.get("park-1") ?? statuses.get("park-2");
    if (parking && parking.occupancyPercent > 85) {
      insights.push({
        id: `insight-${Date.now()}-2`, type: "prediction",
        title: "Parking Nearing Capacity",
        description: `Parking utilization at ${parking.occupancyPercent.toFixed(0)}%. Overflow lots may be required within 30 minutes.`,
        severity: "high", confidence: randf(85, 95), timestamp: now,
        suggestedAction: "Activate overflow parking signage. Deploy traffic management team to main entry roads.",
      });
    }

    const longQueues = Array.from(statuses.values()).filter((s) => s.queueTimeMinutes > 10);
    if (longQueues.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-3`, type: "observation",
        title: "Queue Growth Accelerating",
        description: `${longQueues.length} location(s) with wait times exceeding 10 min: ${longQueues.map((s) => s.zoneId).join(", ")}.`,
        severity: "medium", confidence: randf(78, 92), timestamp: now,
        suggestedAction: "Open additional service points at affected locations. Redeploy staff from low-traffic areas.",
      });
    }

    const understaffed = Array.from(statuses.values()).filter((s) => s.riskScore > 65 && s.safetyScore < 60);
    if (understaffed.length > 1) {
      insights.push({
        id: `insight-${Date.now()}-4`, type: "recommendation",
        title: "Security Coverage Insufficient",
        description: `${understaffed.length} high-risk zones with inadequate safety scores. Security presence should be increased.`,
        severity: "high", confidence: randf(80, 92), timestamp: now,
        suggestedAction: `Redistribute security teams to cover gaps. Priority zones: ${understaffed.map((s) => s.zoneId).join(", ")}.`,
      });
    }

    if (analytics.operationalHealth > 85 && insights.length === 0) {
      insights.push({
        id: `insight-${Date.now()}-5`, type: "observation",
        title: "Operations Normal",
        description: "All zones operating within standard parameters. No interventions required.",
        severity: "low", confidence: randf(92, 98), timestamp: now,
      });
    }

    return insights.slice(0, 5);
  }

  generateZoneRecommendation(zoneId: string, status: ZoneLiveStatus): ZoneRecommendation {
    const zone = STADIUM_ZONES.find((z) => z.id === zoneId);
    const predicted = clamp(status.occupancyPercent + randf(5, 20), 0, 100);
    const recs: string[] = [];

    if (status.occupancyPercent > 70) recs.push("Open additional entry/exit points for this zone");
    if (status.occupancyPercent > 80) recs.push("Deploy crowd management team to this zone");
    if (status.queueTimeMinutes > 10) recs.push("Increase queue capacity — open overflow lanes");
    if (status.queueTimeMinutes > 15) recs.push("Broadcast queue guidance to redirect spectators");
    if (status.safetyScore < 65) recs.push("Increase security presence — safety score below threshold");
    if (status.maintenanceStatus === "in_progress") recs.push("Expedite maintenance — work in progress exceeds schedule");
    if (status.maintenanceStatus === "overdue") recs.push("Escalate maintenance request — overdue status detected");
    if (predicted > 85) recs.push("Proactive crowd redistribution recommended — predicted occupancy critical");
    if (status.riskScore > 70) recs.push("Activate emergency preparedness for this zone");

    if (recs.length === 0) recs.push("Continue monitoring — zone operating within normal parameters");

    return {
      zoneId,
      zoneName: zone?.name ?? zoneId,
      currentOccupancyPercent: status.occupancyPercent,
      predictedOccupancyPercent: predicted,
      timeToPrediction: "12 min",
      riskLevel: predicted > 85 ? "critical" : predicted > 70 ? "high" : predicted > 55 ? "medium" : "low",
      recommendations: recs,
      confidence: randf(82, 96),
    };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export const digitalTwinEngine = new DigitalTwinEngine();
