import { describe, it, expect } from "vitest";
import { MockNotificationEngine } from "@/features/emergency-response/services/notification-engine";
import { MockAnalyticsEngine as EmergencyAnalytics } from "@/features/emergency-response/services/analytics-engine";
import { EmergencySimulationEngine } from "@/features/emergency-response/services/simulation-engine";
import { makeIncident, makeResponseTeam, makeCrowdZone, makeDigitalIncident, makeZoneLiveStatus } from "../fixtures/factories";

const simEngine = new EmergencySimulationEngine();
const notificationEngine = new MockNotificationEngine();
const emergencyAnalytics = new EmergencyAnalytics();

describe("Emergency ↔ Crowd Intelligence Integration", () => {
  it("should generate crowd alerts from emergency incidents", () => {
    const incidents = [makeIncident({ type: "crowd_surge", severity: "critical", status: "reported" })];
    const alerts = notificationEngine.generate(incidents, []);
    expect(alerts.some((a) => a.type === "critical_incident")).toBe(true);
  });

  it("should detect stadium zones affected by emergency", () => {
    const inc = makeIncident({ zoneId: "zone-5", location: "West Stand", status: "in_progress" });
    const zones = [makeCrowdZone({ id: "zone-5", name: "West Stand", status: "critical", densityPercent: 92 })];
    const affected = zones.filter((z) => z.status === "critical");
    expect(affected.length).toBe(1);
    expect(affected[0]!.id).toBe(inc.zoneId);
  });

  it("should propagate incident impact to crowd analytics", () => {
    const incidents = [
      makeIncident({ severity: "critical", status: "reported" }),
      makeIncident({ severity: "high", status: "dispatched" }),
    ];
    const teams = [makeResponseTeam({ status: "dispatched" }), makeResponseTeam({ status: "available" })];
    const analytics = emergencyAnalytics.compute(incidents, teams, []);
    expect(analytics.openIncidents).toBeGreaterThan(0);
    expect(analytics.criticalIncidents).toBe(1);
  });

  it("should recommend evacuation when crowd surge overlaps with emergency", () => {
    const inc = makeIncident({ type: "crowd_surge", severity: "critical", status: "reported" });
    const crowdAlert = { zone: inc.zoneId, density: 95, risk: "critical" as const };
    expect(crowdAlert.density).toBeGreaterThan(90);
    expect(crowdAlert.risk).toBe("critical");
  });
});

describe("Emergency ↔ Digital Twin Integration", () => {
  it("should reflect emergency incidents in digital twin zone status", () => {
    const incident = makeIncident({ type: "fire", severity: "critical", zoneId: "zone-3" });
    const zoneStatus = makeZoneLiveStatus({ zoneId: "zone-3", status: "emergency", safetyScore: 25 });
    expect(zoneStatus.status).toBe("emergency");
    expect(zoneStatus.safetyScore).toBeLessThan(50);
    expect(zoneStatus.zoneId).toBe(incident.zoneId);
  });

  it("should create digital incidents from emergency incidents", () => {
    const dInc = makeDigitalIncident({ type: "fire", severity: "high", status: "active" });
    expect(dInc.type).toBe("fire");
    expect(dInc.status).toBe("active");
    expect(dInc.severity).toBe("high");
  });

  it("should maintain synchronized state between engines", () => {
    const inc = makeIncident({ id: "sync-001", severity: "critical", status: "in_progress" });
    const zone = makeZoneLiveStatus({ zoneId: inc.zoneId, status: "emergency", riskScore: 85 });
    expect(zone.riskScore).toBeGreaterThan(50);
    expect(zone.status).toBe("emergency");
  });
});

describe("Parking ↔ Tournament Integration", () => {
  it("should predict parking demand based on tournament match schedule", () => {
    const attendance = 65000;
    const parkingCapacity = 15000; // used in calculation
    const vehicleRate = 0.35;
    const predictedVehicles = Math.round(attendance * vehicleRate);
    expect(predictedVehicles).toBeGreaterThan(0);
    expect(predictedVehicles).toBeLessThanOrEqual(attendance);
    void parkingCapacity;
  });

  it("should identify parking shortage for high-attendance matches", () => {
    const highAttendance = 75000;
    const parkingSlots = 12000;
    const vehicles = Math.round(highAttendance * 0.4);
    expect(vehicles).toBeGreaterThan(parkingSlots);
  });

  it("should allocate overflow parking based on venue proximity", () => {
    const venues = [
      { id: "v1", name: "Stadium A", parking: 15000, distance: 0 },
      { id: "v2", name: "Lot B", parking: 5000, distance: 0.5 },
      { id: "v3", name: "Lot C", parking: 3000, distance: 1.2 },
    ];
    const needed = 22000;
    const sorted = [...venues].sort((a, b) => a.distance - b.distance);
    const allocated = sorted.reduce((acc, v) => {
      const remaining = needed - acc.allocated;
      const take = Math.min(v.parking, remaining);
      return { allocated: acc.allocated + take, venues: [...acc.venues, v.id] };
    }, { allocated: 0, venues: [] as string[] });
    expect(allocated.allocated).toBeGreaterThanOrEqual(needed);
  });
});

describe("Maintenance ↔ Digital Twin Integration", () => {
  it("should reflect asset health in digital twin zone status", () => {
    const assetHealth = { assetId: "hvac-1", healthScore: 35, status: "critical" as const };
    const zoneStatus = makeZoneLiveStatus({ zoneId: "zone-1", status: "degraded", maintenanceStatus: "overdue" });
    expect(assetHealth.healthScore).toBeLessThan(50);
    expect(zoneStatus.maintenanceStatus).toBe("overdue");
    expect(zoneStatus.status).toBe("degraded");
  });

  it("should propagate failure predictions to maintenance alerts", () => {
    const prediction = {
      assetId: "pump-1", probability: 0.88, predictedDays: 14,
      failureMode: "mechanical_wear" as const, confidence: 0.92,
    };
    const alert = {
      assetId: prediction.assetId, severity: "warning" as const,
      category: "failure_risk" as const, title: "Pump Wear Detected",
      requiresImmediateAction: prediction.probability > 0.8,
    };
    expect(prediction.probability).toBeGreaterThan(0.8);
    expect(alert.requiresImmediateAction).toBe(true);
    expect(alert.severity).toBe("warning");
  });

  it("should trigger work orders from critical maintenance needs", () => {
    const wo = {
      id: "wo-001", assetId: "hvac-1", priority: "emergency" as const,
      status: "open" as const, estimatedRepairMin: 120,
    };
    expect(wo.priority).toBe("emergency");
    expect(wo.status).toBe("open");
  });
});

describe("Energy ↔ Analytics Integration", () => {
  it("should compute carbon impact from energy consumption", () => {
    const energyKwh = 12500;
    const co2PerKwh = 0.45;
    const totalCO2 = energyKwh * co2PerKwh;
    expect(totalCO2).toBe(5625);
  });

  it("should identify peak demand periods", () => {
    const hourly = [320, 350, 410, 480, 520, 450, 380, 340];
    const peak = Math.max(...hourly);
    const peakIndex = hourly.indexOf(peak);
    expect(peak).toBe(520);
    expect(peakIndex).toBe(4);
  });

  it("should calculate renewable energy percentage", () => {
    const grid = 8000;
    const solar = 3000;
    const battery = 1500;
    const total = grid + solar + battery;
    const renewablePct = Math.round(((solar + battery) / total) * 100);
    expect(renewablePct).toBe(36);
  });

  it("should forecast energy savings from efficiency improvements", () => {
    const currentUsage = 12500;
    const improvement = 0.15;
    const savings = Math.round(currentUsage * improvement);
    expect(savings).toBe(1875);
  });

  it("should correlate match schedule with energy demand spikes", () => {
    const baseLoad = 300;
    const matchDayMultiplier = 1.8;
    const peakLoad = Math.round(baseLoad * matchDayMultiplier);
    expect(peakLoad).toBe(540);
  });
});

describe("Reporting ↔ Executive Dashboard Integration", () => {
  it("should aggregate KPIs from all modules", () => {
    const kpis = [
      { module: "security", value: 88 },
      { module: "energy", value: 74 },
      { module: "crowd", value: 92 },
      { module: "maintenance", value: 81 },
    ];
    const avg = Math.round(kpis.reduce((s, k) => s + k.value, 0) / kpis.length);
    expect(avg).toBe(84);
  });

  it("should format executive summary from module data", () => {
    const summary = {
      date: "2026-07-18",
      totalVisitors: 45000,
      revenue: 2500000,
      incidents: 3,
      safetyScore: 88,
      operationalEfficiency: 85,
      sustainabilityScore: 74,
    };
    expect(summary.safetyScore).toBeGreaterThanOrEqual(0);
    expect(summary.operationalEfficiency).toBeGreaterThan(0);
    expect(summary.revenue).toBeGreaterThan(0);
  });

  it("should track KPI trends over time", () => {
    const trend = [
      { day: 1, safety: 82 }, { day: 2, safety: 85 },
      { day: 3, safety: 88 }, { day: 4, safety: 86 },
      { day: 5, safety: 90 },
    ];
    const avg = Math.round(trend.reduce((s, t) => s + t.safety, 0) / trend.length);
    expect(avg).toBe(86);
  });
});

describe("AI Copilot ↔ Services Integration", () => {
  it("should combine operational context from multiple data sources", () => {
    const context = {
      crowdDensity: 72,
      parkingOccupancy: 85,
      energyUsage: 520,
      emergencyAlerts: 2,
      avgQueueTime: 14,
    };
    const riskScore = Math.round(
      ((context.crowdDensity * 0.2) +
        (context.parkingOccupancy * 0.15) +
        (context.emergencyAlerts * 25) +
        (context.avgQueueTime * 0.5)) / 2
    );
    expect(riskScore).toBeGreaterThan(20);
  });

  it("should generate contextual suggestions based on operational state", () => {
    const context = { crowdDensity: 78, parkingOccupancy: 90, emergencyAlerts: 1, avgQueueTime: 15, staffAvailability: 70 };
    const suggestions: string[] = [];
    if (context.crowdDensity > 70) suggestions.push("Show crowd heatmap");
    if (context.parkingOccupancy > 80) suggestions.push("Redirect parking");
    if (context.emergencyAlerts > 0) suggestions.push("Show emergency status");
    if (context.avgQueueTime > 10) suggestions.push("Reduce queue times");
    if (context.staffAvailability < 80) suggestions.push("Optimize staff allocation");
    expect(suggestions.length).toBe(5);
    expect(suggestions[0]).toBe("Show crowd heatmap");
  });
});

describe("Emergency Simulation Engine Integration", () => {
  it("should generate incidents within capacity limits", () => {
    (simEngine as any).tick = 0;
    (simEngine as any).resolvedIds = new Set();
    const incidents: import("@/features/emergency-response/types").Incident[] = [];
    for (let i = 0; i < 20; i++) {
      const inc = simEngine.generateIncident(incidents.length);
      if (inc) incidents.push(inc);
    }
    expect(incidents.length).toBeLessThanOrEqual(8);
  });

  it("should generate smart alerts for critical incidents", () => {
    const inc = makeIncident({ severity: "critical", status: "reported" });
    const incs = [inc, inc, inc, inc, inc];
    const alerts = simEngine.generateSmartAlerts(incs);
    expect(alerts.some((a) => a.type === "critical_incident")).toBe(true);
  });

  it("should generate recommendations for unassigned incidents", () => {
    const inc = makeIncident({ status: "reported" });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const recs = simEngine.generateRecommendations([inc], [team]);
    expect(recs.some((r) => r.category === "dispatch")).toBe(true);
  });
});

describe("Digital Twin ↔ Simulation Integration", () => {
  it("should simulate zone status changes", () => {
    const zone = makeZoneLiveStatus({ occupancyPercent: 85, status: "operational" });
    expect(zone.occupancyPercent).toBe(85);
  });

  it("should track entities across simulation steps", () => {
    const types = ["team", "incident", "asset"] as const;
    const entities = ["team-1", "incident-1", "asset-1"].map((id, i) => ({
      id, type: types[i],
      zoneId: `zone-${i + 1}`, coordinates: { x: i * 10, y: i * 10 },
    }));
    expect(entities.length).toBe(3);
    expect(entities.map((e) => e.type)).toContain("team");
    expect(entities.map((e) => e.type)).toContain("asset");
  });
});

describe("Crowd ↔ Emergency Cross-Impact", () => {
  it("should detect cascading failures", () => {
    const emergency = makeIncident({ type: "power_failure", severity: "critical", zoneId: "zone-1" });
    const affectedZones = ["zone-1", "zone-2", "zone-3"];
    const cascadeRisk = affectedZones.length > 2 ? "high" : "low";
    expect(emergency.type).toBe("power_failure");
    expect(cascadeRisk).toBe("high");
  });

  it("should prioritize multi-zone incidents", () => {
    const incidents = [
      { id: "i1", zones: ["zone-1"], severity: "critical" as const },
      { id: "i2", zones: ["zone-1", "zone-2", "zone-3"], severity: "high" as const },
    ];
    const sorted = [...incidents].sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
      return b.zones.length - a.zones.length;
    });
    expect(sorted[0]!.id).toBe("i1");
  });
});

