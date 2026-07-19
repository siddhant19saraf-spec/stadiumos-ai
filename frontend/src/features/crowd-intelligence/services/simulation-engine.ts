// @ts-nocheck
import type {
  StadiumZone, CrowdAnalytics, CrowdTimelinePoint, GateUtilization,
  QueueGrowthPoint, CrowdAlert, AIInsight, ZoneStatus,
} from "../types";
import { STADIUM_ZONES, DENSITY_THRESHOLDS } from "../constants";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randf(min: number, max: number, d = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d));
}
function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const eventPhases = ["pregame", "entry", "first_half", "half_time", "second_half", "final", "exit"] as const;
type EventPhase = (typeof eventPhases)[number];

class SimulationEngine {
  private phase: EventPhase = "second_half";
  private totalCapacity = STADIUM_ZONES.reduce((s, z) => s + z.capacity, 0);
  private baseOccupancy = 0.78;
  private tick = 0;

  private getPhaseMultiplier(phase: EventPhase): number {
    const multipliers: Record<EventPhase, number> = {
      pregame: 0.1, entry: 0.6, first_half: 0.85, half_time: 0.95,
      second_half: 0.88, final: 0.7, exit: 0.4,
    };
    return multipliers[phase] ?? 0.7;
  }

  simulateZones(): StadiumZone[] {
    this.tick++;
    if (this.tick % 20 === 0) {
      this.phase = eventPhases[(eventPhases.indexOf(this.phase) + 1) % eventPhases.length]!;
    }

    const phaseMul = this.getPhaseMultiplier(this.phase);
    const wave = Math.sin(this.tick * 0.1) * 0.05;

    return STADIUM_ZONES.map((base) => {
      const targetDensity = clamp((phaseMul + wave + randf(-0.08, 0.08)) * 100, 5, 98);
      const density = clamp(
        base.currentCount > 0
          ? base.densityPercent + (targetDensity - base.densityPercent) * 0.15 + randf(-2, 2)
          : targetDensity + randf(-5, 5),
        0, 100,
      );
      const currentCount = Math.round((density / 100) * base.capacity);
      const status = this.getStatus(density);

      return {
        ...base,
        currentCount: clamp(currentCount, 0, base.capacity),
        densityPercent: density,
        status,
        safetyScore: clamp(100 - density * (base.type === "concourse" ? 0.9 : 0.7) + randf(-5, 5), 0, 100),
        waitTimeMinutes: Math.round(clamp(density * 0.25 + randf(-1, 3), 0, 45)),
        movementSpeed: clamp(randf(0.3, 1.8) * (1 - density / 120), 0.1, 2.0),
        trend: density > (base.currentCount > 0 ? base.densityPercent : density) ? "increasing" : density < (base.currentCount > 0 ? base.densityPercent : density) ? "decreasing" : "stable",
        prediction30m: Math.round(clamp(density + randf(-10, 20), 0, 100)),
      } as StadiumZone;
    });
  }

  private getStatus(density: number): ZoneStatus {
    if (density >= DENSITY_THRESHOLDS.critical.max) return "critical";
    if (density >= DENSITY_THRESHOLDS.congested.max) return "congested";
    if (density >= DENSITY_THRESHOLDS.moderate.max) return "moderate";
    return "normal";
  }

  computeAnalytics(zones: StadiumZone[]): CrowdAnalytics {
    const totalOccupancy = zones.reduce((s, z) => s + z.currentCount, 0);
    const capacityPercent = (totalOccupancy / this.totalCapacity) * 100;
    const congestionZones = zones.filter((z) => z.status === "congested" || z.status === "critical").length;
    const totalSafety = zones.reduce((s, z) => s + z.safetyScore, 0) / zones.length;
    const avgSpeed = zones.reduce((s, z) => s + z.movementSpeed, 0) / zones.length;

    return {
      totalVisitors: totalOccupancy,
      currentOccupancy: totalOccupancy,
      capacityPercent,
      visitorsPerMinute: rand(40, 180),
      congestionScore: clamp(congestionZones * 12 + randf(-5, 5), 0, 100),
      riskScore: clamp((100 - totalSafety) * 0.8 + randf(-3, 3), 0, 100),
      safetyIndex: clamp(totalSafety + randf(-2, 2), 0, 100),
      avgMovementSpeed: avgSpeed,
      heatIndex: clamp(capacityPercent * 0.5 + randf(-5, 5), 0, 100),
      peakForecast: Math.round(88000 * (0.85 + randf(-0.05, 0.1))),
      peakTime: `${rand(12, 15)}:${String(rand(0, 59)).padStart(2, "0")}`,
    };
  }

  generateTimeline(points = 30): CrowdTimelinePoint[] {
    const now = Date.now();
    return Array.from({ length: points }, (_, i) => {
      const minutesAgo = (points - i) * 2;
      const actual = rand(15000, 35000) + Math.sin(i * 0.3) * 5000;
      const predicted = actual + rand(-2000, 2000);
      return {
        timestamp: new Date(now - minutesAgo * 60000).toISOString(),
        actual,
        predicted,
        upperBound: predicted + rand(1000, 3000),
        lowerBound: Math.max(0, predicted - rand(1000, 3000)),
      };
    });
  }

  generateGateUtilization(): GateUtilization[] {
    return [
      { gateName: "Gate A", currentRate: rand(80, 200), capacity: 250, utilizationPercent: randf(32, 85), waitTime: rand(3, 18), trend: pick(["increasing", "stable", "decreasing"]) },
      { gateName: "Gate B", currentRate: rand(60, 180), capacity: 250, utilizationPercent: randf(24, 72), waitTime: rand(2, 12), trend: pick(["increasing", "stable", "decreasing"]) },
      { gateName: "Gate C", currentRate: rand(100, 240), capacity: 250, utilizationPercent: randf(40, 96), waitTime: rand(5, 25), trend: pick(["increasing", "stable", "decreasing"]) },
      { gateName: "Gate D", currentRate: rand(40, 120), capacity: 200, utilizationPercent: randf(20, 60), waitTime: rand(1, 8), trend: pick(["increasing", "stable", "decreasing"]) },
    ];
  }

  generateQueueGrowth(): QueueGrowthPoint[] {
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => ({
      timestamp: new Date(now - (12 - i) * 300000).toISOString(),
      location: pick(["Food Court A", "Food Court B", "Gate A", "Gate C", "Concession 3"]),
      currentLength: rand(5, 45),
      predictedLength30m: rand(10, 65),
      growthRate: randf(-3, 8, 1),
    }));
  }

  generateAlerts(zones: StadiumZone[]): CrowdAlert[] {
    const critical = zones.filter((z) => z.status === "critical" || z.densityPercent > 80);
    if (critical.length === 0) return [];

    return critical.slice(0, 3).map((z) => ({
      id: `alert-${Date.now()}-${z.id}`,
      type: z.densityPercent > 85 ? "high_density" : "elevated_density",
      title: z.densityPercent > 85 ? `Critical Density at ${z.name}` : `Elevated Density at ${z.name}`,
      message: `${z.name} at ${z.densityPercent.toFixed(0)}% capacity. ${z.densityPercent > 85 ? "Immediate attention required." : "Monitor closely."}`,
      severity: z.densityPercent > 85 ? "critical" : z.densityPercent > 70 ? "high" : "medium",
      zone: z.name,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    }));
  }

  generateInsights(zones: StadiumZone[], analytics: CrowdAnalytics): AIInsight[] {
    const insights: AIInsight[] = [];
    const congested = zones.filter((z) => z.status === "congested" || z.status === "critical");

    if (congested.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-1`,
        title: "Congestion Pattern Detected",
        detail: `${congested.length} zone(s) at elevated density. Main bottleneck at ${congested[0]!.name} with ${congested[0]!.densityPercent.toFixed(0)}% occupancy.`,
        type: "warning",
        timestamp: new Date().toISOString(),
        confidence: rand(82, 96),
      });
    }

    const gates = zones.filter((z) => z.type === "gate");
    const busyGates = gates.filter((g) => g.densityPercent > 60);
    if (busyGates.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        title: "Gate Distribution Imbalance",
        detail: `${busyGates[0]!.name} at ${busyGates[0]!.densityPercent.toFixed(0)}% while ${gates.find((g) => g.densityPercent < 40)?.name ?? "other gates"} are underutilized. Recommend redirecting flow.`,
        type: "recommendation",
        timestamp: new Date().toISOString(),
        confidence: rand(85, 95),
      });
    }

    if (analytics.riskScore > 50) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        title: "Safety Risk Escalation",
        detail: `Risk score at ${analytics.riskScore.toFixed(0)}/100. Contributing factors: high density in ${congested.length} zone(s), reduced movement speed (${analytics.avgMovementSpeed.toFixed(1)} m/s).`,
        type: "prediction",
        timestamp: new Date().toISOString(),
        confidence: rand(75, 90),
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: `insight-${Date.now()}-4`,
        title: "Operations Normal",
        detail: "All zones operating within normal parameters. No intervention required.",
        type: "observation",
        timestamp: new Date().toISOString(),
        confidence: rand(90, 99),
      });
    }

    return insights;
  }

  getCurrentPhase(): EventPhase {
    return this.phase;
  }

  getTotalCapacity(): number {
    return this.totalCapacity;
  }
}

export const simulationEngine = new SimulationEngine();

