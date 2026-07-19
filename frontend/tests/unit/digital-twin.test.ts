// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DigitalTwinEngine } from "@/features/digital-twin/services/digital-twin-engine";
import { MockVisualizationEngine, visualizationEngine } from "@/features/digital-twin/services/visualization-engine";
import { MockMapEngine, mapEngine } from "@/features/digital-twin/services/map-engine";
import {
  STADIUM_ZONES,
  ZONE_CAPACITIES,
  LAYER_CONFIGS,
  SCENARIO_CONFIGS,
  REFRESH_INTERVAL,
} from "@/features/digital-twin/constants";
import type {
  ZoneLiveStatus,
  MapEntity,
  DigitalIncident,
  SimulationScenario,
} from "@/features/digital-twin/types";
import {
  makeDigitalIncident,
  makeZoneLiveStatus,
  resetCounter,
} from "../fixtures/factories";

function makeStatusMap(entries?: Partial<ZoneLiveStatus>[]): Map<string, ZoneLiveStatus> {
  const map = new Map<string, ZoneLiveStatus>();
  const zones = entries ?? [makeZoneLiveStatus()];
  for (const z of zones) {
    const s = makeZoneLiveStatus(z);
    map.set(s.zoneId, s);
  }
  return map;
}

function allScenarios(): SimulationScenario[] {
  return [
    "heavy_rain", "power_failure", "medical_emergency", "crowd_surge",
    "fire", "network_failure", "parking_overflow", "vip_arrival",
    "final_match_crowd", "weather_delay",
  ];
}

beforeEach(() => {
  resetCounter();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Constants", () => {
  it("STADIUM_ZONES has 52 zones", () => {
    expect(STADIUM_ZONES.length).toBe(52);
  });

  it("STADIUM_ZONES covers all expected zone types", () => {
    const types = new Set(STADIUM_ZONES.map((z) => z.type));
    expect(types.has("seating")).toBe(true);
    expect(types.has("gate_entry")).toBe(true);
    expect(types.has("vip")).toBe(true);
    expect(types.has("concourse")).toBe(true);
    expect(types.has("food_court")).toBe(true);
    expect(types.has("parking")).toBe(true);
    expect(types.has("medical")).toBe(true);
    expect(types.has("security")).toBe(true);
    expect(types.has("emergency_exit")).toBe(true);
    expect(types.has("restroom")).toBe(true);
    expect(types.has("elevator")).toBe(true);
    expect(types.has("maintenance")).toBe(true);
    expect(types.has("control_center")).toBe(true);
    expect(types.has("broadcast")).toBe(true);
    expect(types.has("camera")).toBe(true);
    expect(types.has("retail")).toBe(true);
    expect(types.has("first_aid")).toBe(true);
  });

  it("STADIUM_ZONES have unique ids", () => {
    const ids = STADIUM_ZONES.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("STADIUM_ZONES all have valid coordinates", () => {
    for (const z of STADIUM_ZONES) {
      expect(z.coordinates.x).toBeGreaterThanOrEqual(0);
      expect(z.coordinates.x).toBeLessThanOrEqual(100);
      expect(z.coordinates.y).toBeGreaterThanOrEqual(0);
      expect(z.coordinates.y).toBeLessThanOrEqual(100);
      expect(z.coordinates.width).toBeGreaterThan(0);
      expect(z.coordinates.height).toBeGreaterThan(0);
    }
  });

  it("STADIUM_ZONES have valid levels", () => {
    for (const z of STADIUM_ZONES) {
      expect(z.level).toBeGreaterThanOrEqual(0);
    }
  });

  it("ZONE_CAPACITIES covers many zone IDs", () => {
    const keys = Object.keys(ZONE_CAPACITIES);
    expect(keys.length).toBeGreaterThan(20);
  });

  it("ZONE_CAPACITIES all have positive values", () => {
    for (const [, cap] of Object.entries(ZONE_CAPACITIES)) {
      expect(cap).toBeGreaterThan(0);
      expect(Number.isInteger(cap)).toBe(true);
    }
  });

  it("LAYER_CONFIGS has 12 layers", () => {
    expect(LAYER_CONFIGS.length).toBe(12);
  });

  it("LAYER_CONFIGS have unique ids", () => {
    const ids = LAYER_CONFIGS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("LAYER_CONFIGS: crowd_density is enabled by default", () => {
    const crowdDensity = LAYER_CONFIGS.find((l) => l.id === "crowd_density");
    expect(crowdDensity?.enabled).toBe(true);
  });

  it("LAYER_CONFIGS: maintenance is disabled by default", () => {
    const maintenance = LAYER_CONFIGS.find((l) => l.id === "maintenance");
    expect(maintenance?.enabled).toBe(false);
  });

  it("LAYER_CONFIGS: incidents layer has opacity 0.9", () => {
    const incidents = LAYER_CONFIGS.find((l) => l.id === "incidents");
    expect(incidents?.opacity).toBe(0.9);
  });

  it("LAYER_CONFIGS all have non-empty labels", () => {
    for (const l of LAYER_CONFIGS) {
      expect(l.label).toBeTruthy();
      expect(l.icon).toBeTruthy();
      expect(l.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("SCENARIO_CONFIGS covers all 10 scenarios", () => {
    const scenarios = allScenarios();
    for (const s of scenarios) {
      expect(SCENARIO_CONFIGS[s]).toBeDefined();
      expect(SCENARIO_CONFIGS[s].label).toBeTruthy();
      expect(SCENARIO_CONFIGS[s].description).toBeTruthy();
      expect(SCENARIO_CONFIGS[s].icon).toBeTruthy();
    }
  });

  it("SCENARIO_CONFIGS scenario count matches", () => {
    expect(Object.keys(SCENARIO_CONFIGS).length).toBe(10);
  });

  it("REFRESH_INTERVAL is 3000ms", () => {
    expect(REFRESH_INTERVAL).toBe(3000);
  });
});

describe("DigitalTwinEngine", () => {
  let engine: DigitalTwinEngine;

  beforeEach(() => {
    engine = new DigitalTwinEngine();
  });

  describe("getZones", () => {
    it("should return all STADIUM_ZONES", () => {
      const result = engine.getZones();
      expect(result).toBe(STADIUM_ZONES);
    });
  });

  describe("simulateZoneStatuses", () => {
    it("should return statuses for all zones", () => {
      const result = engine.simulateZoneStatuses();
      expect(result.size).toBe(STADIUM_ZONES.length);
    });

    it("should have all required fields in each status", () => {
      const result = engine.simulateZoneStatuses();
      for (const [zoneId, status] of result) {
        expect(status.zoneId).toBe(zoneId);
        expect(status.currentOccupancy).toBeGreaterThanOrEqual(0);
        expect(status.maxCapacity).toBeGreaterThan(0);
        expect(status.occupancyPercent).toBeGreaterThanOrEqual(0);
        expect(status.occupancyPercent).toBeLessThanOrEqual(100);
        expect(status.riskScore).toBeGreaterThanOrEqual(0);
        expect(status.riskScore).toBeLessThanOrEqual(100);
        expect(status.safetyScore).toBeGreaterThanOrEqual(0);
        expect(status.safetyScore).toBeLessThanOrEqual(100);
        expect(status.queueTimeMinutes).toBeGreaterThanOrEqual(0);
        expect(status.temperature).toBeGreaterThan(0);
        expect(["operational", "degraded", "offline", "emergency"]).toContain(status.status);
        expect(status.predictedOccupancy30m).toBeGreaterThanOrEqual(0);
        expect(status.predictedOccupancy30m).toBeLessThanOrEqual(100);
        expect(status.energyUsageKw).toBeGreaterThan(0);
        expect(["clean", "due", "in_progress"]).toContain(status.cleaningStatus);
        expect(status.lastUpdated).toBeTruthy();
      }
    });

    it("should set status to emergency when occupancy > 85%", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const result = engine.simulateZoneStatuses();
      vi.restoreAllMocks();
      for (const [, status] of result) {
        if (status.occupancyPercent > 85) {
          expect(status.status).toBe("emergency");
        }
      }
    });

    it("should set status to degraded when occupancy 70-85%", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const result = engine.simulateZoneStatuses();
      vi.restoreAllMocks();
      for (const [, status] of result) {
        if (status.occupancyPercent > 70 && status.occupancyPercent <= 85) {
          expect(status.status).toBe("degraded");
        }
      }
    });

    it("should set status to operational when occupancy <= 70%", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const result = engine.simulateZoneStatuses();
      vi.restoreAllMocks();
      for (const [, status] of result) {
        if (status.occupancyPercent <= 70) {
          expect(status.status).toBe("operational");
        }
      }
    });

    it("should have higher temperature when occupancy > 70%", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const result = engine.simulateZoneStatuses();
      vi.restoreAllMocks();
      for (const [, status] of result) {
        if (status.occupancyPercent > 70) {
          expect(status.temperature).toBeGreaterThanOrEqual(22);
        }
      }
    });

    it("should produce different results on consecutive calls", () => {
      const r1 = engine.simulateZoneStatuses();
      const r2 = engine.simulateZoneStatuses();
      const diff = Array.from(r1.keys()).some((key) => r1.get(key)?.currentOccupancy !== r2.get(key)?.currentOccupancy);
      expect(diff).toBe(true);
    });
  });

  describe("simulateEntities", () => {
    it("should return entities for high-risk zones", () => {
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 80 }]);
      const result = engine.simulateEntities(status);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include team entities", () => {
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 10 }]);
      const result = engine.simulateEntities(status);
      const teams = result.filter((e) => e.type === "team");
      expect(teams.length).toBe(4);
    });

    it("should create incident entities for riskScore > 60", () => {
      const status = makeStatusMap([
        { zoneId: "section-101", riskScore: 80 },
        { zoneId: "section-102", riskScore: 70 },
      ]);
      const result = engine.simulateEntities(status);
      const incidents = result.filter((e) => e.type === "incident");
      expect(incidents.length).toBeGreaterThanOrEqual(1);
    });

    it("should set pulse true when riskScore > 75", () => {
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 90 }]);
      const result = engine.simulateEntities(status);
      const incident = result.find((e) => e.type === "incident");
      if (incident) {
        expect(incident.pulse).toBe(true);
      }
    });

    it("should set pulse false when riskScore <= 75", () => {
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 65 }]);
      const result = engine.simulateEntities(status);
      const incident = result.find((e) => e.type === "incident");
      if (incident) {
        expect(incident.pulse).toBe(false);
      }
    });

    it("should limit incident entities to 13 max", () => {
      const status = new Map<string, ZoneLiveStatus>();
      for (let i = 0; i < 30; i++) {
        const s = makeZoneLiveStatus({ zoneId: `zone-${i}`, riskScore: 80 + (i % 20) });
        status.set(`zone-${i}`, s);
      }
      const result = engine.simulateEntities(status);
      const incidents = result.filter((e) => e.type === "incident");
      expect(incidents.length).toBeLessThanOrEqual(13);
    });

    it("should assign valid layers to all entities", () => {
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 80 }]);
      const result = engine.simulateEntities(status);
      for (const e of result) {
        expect(["crowd_density", "parking", "security_teams", "medical_teams", "incidents", "maintenance", "weather", "energy", "queues", "cleaning", "broadcast", "iot_sensors"]).toContain(e.layer);
      }
    });

    it("should have coordinates for all entities", () => {
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 80 }]);
      const result = engine.simulateEntities(status);
      for (const e of result) {
        expect(e.coordinates.x).toBeGreaterThanOrEqual(0);
        expect(e.coordinates.y).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("simulateIncidents", () => {
    it("should return empty array for low risk zones", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 10 }]);
      const result = engine.simulateIncidents(status);
      expect(result.length).toBe(0);
      vi.restoreAllMocks();
    });

    it("should generate medical incident for high risk zones", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.3);
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 80 }]);
      const result = engine.simulateIncidents(status);
      vi.restoreAllMocks();
      const medical = result.find((i) => i.type === "medical");
      expect(medical).toBeDefined();
    });

    it("should generate security incident randomly", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.1);
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 10 }]);
      const result = engine.simulateIncidents(status);
      vi.restoreAllMocks();
      const security = result.find((i) => i.type === "security");
      expect(security).toBeDefined();
    });

    it("should generate lost child incident rarely", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.05);
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 10 }]);
      const result = engine.simulateIncidents(status);
      vi.restoreAllMocks();
      const lost = result.find((i) => i.type === "lost_child");
      expect(lost).toBeDefined();
    });

    it("should set incident severity correctly", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.3);
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 80 }]);
      const result = engine.simulateIncidents(status);
      vi.restoreAllMocks();
      const medical = result.find((i) => i.type === "medical");
      expect(medical?.severity).toBe("high");
    });

    it("should set incident status to active", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.3);
      const status = makeStatusMap([{ zoneId: "section-101", riskScore: 80 }]);
      const result = engine.simulateIncidents(status);
      vi.restoreAllMocks();
      for (const inc of result) {
        expect(inc.status).toBe("active");
      }
    });
  });

  describe("computeAnalytics", () => {
    it("should compute analytics from statuses and incidents", () => {
      const status = makeStatusMap([
        { zoneId: "section-101", maxCapacity: 1000, currentOccupancy: 500, safetyScore: 90, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 100, occupancyPercent: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 55 },
        { zoneId: "section-102", maxCapacity: 1000, currentOccupancy: 700, safetyScore: 80, temperature: 26, status: "operational", riskScore: 20, queueTimeMinutes: 3, energyUsageKw: 120, occupancyPercent: 70, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 75 },
      ]);
      const incidents: DigitalIncident[] = [];
      const result = engine.computeAnalytics(status, incidents);
      expect(result.totalOccupancy).toBe(1200);
      expect(result.totalCapacity).toBe(2000);
      expect(result.operationalHealth).toBeGreaterThanOrEqual(0);
      expect(result.operationalHealth).toBeLessThanOrEqual(100);
      expect(result.safetyIndex).toBe(85);
    });

    it("should count active incidents correctly", () => {
      const status = makeStatusMap([{ zoneId: "section-101", maxCapacity: 1000, currentOccupancy: 500, safetyScore: 90, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 100, occupancyPercent: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 55 }]);
      const incidents = [
        makeDigitalIncident({ status: "active" }),
        makeDigitalIncident({ status: "active" }),
        makeDigitalIncident({ status: "resolved" }),
      ];
      const result = engine.computeAnalytics(status, incidents);
      expect(result.activeIncidents).toBe(2);
    });

    it("should compute queueHealth based on zones with long queues", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("food-a", makeZoneLiveStatus({ zoneId: "food-a", queueTimeMinutes: 15, maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, energyUsageKw: 50, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
      status.set("gate-a", makeZoneLiveStatus({ zoneId: "gate-a", queueTimeMinutes: 20, maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, energyUsageKw: 50, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
      const incidents: DigitalIncident[] = [];
      const result = engine.computeAnalytics(status, incidents);
      expect(result.queueHealth).toBeLessThan(100);
    });

    it("should compute energyUsageMw correctly", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("zone-1", makeZoneLiveStatus({ zoneId: "zone-1", energyUsageKw: 500, maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
      status.set("zone-2", makeZoneLiveStatus({ zoneId: "zone-2", energyUsageKw: 1500, maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
      const incidents: DigitalIncident[] = [];
      const result = engine.computeAnalytics(status, incidents);
      expect(result.energyUsageMw).toBe(2.0);
    });

    it("should compute parkingUtilization from parking zones", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("park-1", makeZoneLiveStatus({ zoneId: "park-1", occupancyPercent: 80, maxCapacity: 500, currentOccupancy: 400, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 85 }));
      status.set("park-2", makeZoneLiveStatus({ zoneId: "park-2", occupancyPercent: 60, maxCapacity: 500, currentOccupancy: 300, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 65 }));
      const incidents: DigitalIncident[] = [];
      const result = engine.computeAnalytics(status, incidents);
      expect(result.parkingUtilization).toBe(70);
    });

    it("should handle empty statuses", () => {
      const status = new Map<string, ZoneLiveStatus>();
      const incidents: DigitalIncident[] = [];
      const result = engine.computeAnalytics(status, incidents);
      expect(result.totalOccupancy).toBe(0);
      expect(result.totalCapacity).toBe(0);
      expect(result.operationalHealth).toBe(100);
      expect(result.avgTemperature).toBe(0);
    });
  });

  describe("generateInsights", () => {
    it("should generate warning when many zones have high density", () => {
      const status = new Map<string, ZoneLiveStatus>();
      for (let i = 0; i < 10; i++) {
        status.set(`zone-${i}`, makeZoneLiveStatus({ zoneId: `zone-${i}`, occupancyPercent: 80, maxCapacity: 500, currentOccupancy: 400, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 85 }));
      }
      const analytics = makeLiveAnalytics({ operationalHealth: 80 });
      const result = engine.generateInsights(status, analytics);
      const congestion = result.find((i) => i.title.includes("Crowd Congestion"));
      expect(congestion).toBeDefined();
    });

    it("should generate parking insight when parking is near cap", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("park-1", makeZoneLiveStatus({ zoneId: "park-1", occupancyPercent: 90, maxCapacity: 500, currentOccupancy: 450, safetyScore: 80, temperature: 25, status: "degraded", riskScore: 20, queueTimeMinutes: 5, energyUsageKw: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 92 }));
      const analytics = makeLiveAnalytics();
      const result = engine.generateInsights(status, analytics);
      const parking = result.find((i) => i.title.includes("Parking"));
      expect(parking).toBeDefined();
    });

    it("should generate queue insight when wait times exceed 10 min", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("food-a", makeZoneLiveStatus({ zoneId: "food-a", queueTimeMinutes: 15, maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, energyUsageKw: 50, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
      const analytics = makeLiveAnalytics();
      const result = engine.generateInsights(status, analytics);
      const queue = result.find((i) => i.title.includes("Queue Growth"));
      expect(queue).toBeDefined();
    });

    it("should generate security insight when multiple zones have high risk and low safety", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("zone-1", makeZoneLiveStatus({ zoneId: "zone-1", riskScore: 70, safetyScore: 55, maxCapacity: 500, currentOccupancy: 300, temperature: 25, status: "degraded", queueTimeMinutes: 5, energyUsageKw: 50, occupancyPercent: 60, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 65 }));
      status.set("zone-2", makeZoneLiveStatus({ zoneId: "zone-2", riskScore: 70, safetyScore: 55, maxCapacity: 500, currentOccupancy: 300, temperature: 25, status: "degraded", queueTimeMinutes: 5, energyUsageKw: 50, occupancyPercent: 60, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 65 }));
      const analytics = makeLiveAnalytics();
      const result = engine.generateInsights(status, analytics);
      const security = result.find((i) => i.title.includes("Security Coverage"));
      expect(security).toBeDefined();
    });

    it("should limit insights to 5 max", () => {
      const status = new Map<string, ZoneLiveStatus>();
      for (let i = 0; i < 20; i++) {
        status.set(`zone-${i}`, makeZoneLiveStatus({ zoneId: `zone-${i}`, occupancyPercent: 85, riskScore: 80, safetyScore: 50, queueTimeMinutes: 15, maxCapacity: 500, currentOccupancy: 400, temperature: 26, status: "degraded", energyUsageKw: 100, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 90 }));
      }
      const analytics = makeLiveAnalytics();
      const result = engine.generateInsights(status, analytics);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should generate observation when operations are normal", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("zone-1", makeZoneLiveStatus({ zoneId: "zone-1", occupancyPercent: 40, maxCapacity: 500, currentOccupancy: 200, safetyScore: 90, temperature: 23, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
      const analytics = makeLiveAnalytics({ operationalHealth: 90 });
      const result = engine.generateInsights(status, analytics);
      const normal = result.find((i) => i.title.includes("Operations Normal"));
      expect(normal).toBeDefined();
    });
  });

  describe("generateZoneRecommendation", () => {
    it("should generate recommendation with basic fields", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50 });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.zoneId).toBe("section-101");
      expect(result.currentOccupancyPercent).toBe(50);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should include open entry/exit rec when occupancy > 70%", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 75 });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("entry/exit"))).toBe(true);
    });

    it("should include crowd management rec when occupancy > 80%", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 85 });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("crowd management"))).toBe(true);
    });

    it("should include queue capacity rec when queueTime > 10 min", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", queueTimeMinutes: 12 });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("overflow lanes"))).toBe(true);
    });

    it("should include queue guidance rec when queueTime > 15 min", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", queueTimeMinutes: 18 });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("redirect spectators"))).toBe(true);
    });

    it("should include security rec when safetyScore < 65", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", safetyScore: 60 });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("security presence"))).toBe(true);
    });

    it("should include maintenance rec when maintenance in progress", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", maintenanceStatus: "in_progress" });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("Expedite maintenance"))).toBe(true);
    });

    it("should escalate maintenance when overdue", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", maintenanceStatus: "overdue" });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("Escalate maintenance"))).toBe(true);
    });

    it("should include proactive redist rec when predicted > 85%", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 70 });
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const result = engine.generateZoneRecommendation("section-101", status);
      vi.restoreAllMocks();
      const hasProactive = result.recommendations.some((r) => r.includes("Proactive crowd redistribution"));
      expect(hasProactive || result.predictedOccupancyPercent > 85).toBe(true);
    });

    it("should include emergency rec when riskScore > 70", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", riskScore: 75 });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("emergency preparedness"))).toBe(true);
    });

    it("should include monitoring rec when no other triggers", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 30, queueTimeMinutes: 2, safetyScore: 90, riskScore: 10, maintenanceStatus: "none" });
      const result = engine.generateZoneRecommendation("section-101", status);
      expect(result.recommendations.some((r) => r.includes("monitoring"))).toBe(true);
    });

    it("should set riskLevel based on predicted percent", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 30 });
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const result = engine.generateZoneRecommendation("section-101", status);
      vi.restoreAllMocks();
      if (result.predictedOccupancyPercent > 85) {
        expect(result.riskLevel).toBe("critical");
      } else if (result.predictedOccupancyPercent > 70) {
        expect(result.riskLevel).toBe("high");
      }
    });
  });
});

describe("MockAnalyticsEngine (Digital Twin)", () => {
  let engine: MockAnalyticsEngine;

  beforeEach(() => {
    engine = new MockAnalyticsEngine();
  });

  describe("compute", () => {
    it("should compute from statuses and incidents", () => {
      const status = makeStatusMap([{ zoneId: "section-101", maxCapacity: 1000, currentOccupancy: 500, safetyScore: 90, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 100, occupancyPercent: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 55 }]);
      const incidents: DigitalIncident[] = [];
      const result = engine.compute(status, incidents);
      expect(result.operationalHealth).toBeGreaterThanOrEqual(0);
      expect(result.safetyIndex).toBe(90);
      expect(result.totalOccupancy).toBe(500);
    });

    it("should handle empty map", () => {
      const result = engine.compute(new Map(), []);
      expect(result.operationalHealth).toBe(100);
      expect(result.safetyIndex).toBe(100);
      expect(result.avgTemperature).toBe(22);
      expect(result.totalOccupancy).toBe(0);
    });

    it("should count active incidents correctly", () => {
      const status = makeStatusMap([{ zoneId: "section-101", maxCapacity: 1000, currentOccupancy: 500, safetyScore: 90, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 100, occupancyPercent: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 55 }]);
      const incidents = [
        makeDigitalIncident({ status: "active" }),
        makeDigitalIncident({ status: "resolved" }),
      ];
      const result = engine.compute(status, incidents);
      expect(result.activeIncidents).toBe(1);
    });
  });

  describe("trends", () => {
    it("should return stable for all keys on first call", () => {
      const current = makeLiveAnalytics();
      const result = engine.trends(current, current);
      expect(result.operationalHealth).toBe("stable");
      expect(result.safetyIndex).toBe("stable");
    });

    it("should detect up trend", () => {
      const previous = makeLiveAnalytics({ operationalHealth: 70 });
      const current = makeLiveAnalytics({ operationalHealth: 80 });
      const engine2 = new MockAnalyticsEngine();
      engine2.trends(previous, previous);
      const result = engine2.trends(current, current);
      expect(result.operationalHealth).toBe("up");
    });

    it("should detect down trend", () => {
      const previous = makeLiveAnalytics({ operationalHealth: 80 });
      const current = makeLiveAnalytics({ operationalHealth: 70 });
      const engine2 = new MockAnalyticsEngine();
      engine2.trends(previous, previous);
      const result = engine2.trends(current, current);
      expect(result.operationalHealth).toBe("down");
    });
  });
});

describe("MockPredictionEngine (Digital Twin)", () => {
  let engine: MockPredictionEngine;

  beforeEach(() => {
    engine = new MockPredictionEngine();
  });

  describe("predict30m", () => {
    it("should update predictedOccupancy30m for all zones", () => {
      const status = makeStatusMap([{ zoneId: "section-101", occupancyPercent: 50, maxCapacity: 500, currentOccupancy: 250, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 55 }]);
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101");
      const result = engine.predict30m(status, zones);
      expect(result.get("section-101")?.predictedOccupancy30m).toBeGreaterThanOrEqual(0);
      expect(result.get("section-101")?.predictedOccupancy30m).toBeLessThanOrEqual(100);
    });

    it("should preserve other status fields", () => {
      const status = makeStatusMap([{ zoneId: "section-101", occupancyPercent: 50, maxCapacity: 500, currentOccupancy: 250, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 55 }]);
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101");
      const result = engine.predict30m(status, zones);
      const updated = result.get("section-101");
      expect(updated?.zoneId).toBe("section-101");
      expect(updated?.occupancyPercent).toBe(50);
      expect(updated?.status).toBe("operational");
    });
  });

  describe("predictZone", () => {
    it("should return occupancy30m, risk30m, and confidence", () => {
      const status = makeZoneLiveStatus({ occupancyPercent: 50, riskScore: 20 });
      const result = engine.predictZone("section-101", status);
      expect(result.occupancy30m).toBeGreaterThanOrEqual(0);
      expect(result.occupancy30m).toBeLessThanOrEqual(100);
      expect(result.risk30m).toBeGreaterThanOrEqual(0);
      expect(result.risk30m).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThanOrEqual(85);
    });
  });
});

describe("MockRecommendationEngine (Digital Twin)", () => {
  let engine: MockRecommendationEngine;

  beforeEach(() => {
    engine = new MockRecommendationEngine();
  });

  describe("getForZone", () => {
    it("should return recommendation for a zone", () => {
      const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50 });
      const result = engine.getForZone("section-101", status);
      expect(result.zoneId).toBe("section-101");
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe("getForAllHighRisk", () => {
    it("should return recommendations for high risk zones", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", riskScore: 80, occupancyPercent: 80 }));
      status.set("section-102", makeZoneLiveStatus({ zoneId: "section-102", riskScore: 30, occupancyPercent: 40 }));
      const result = engine.getForAllHighRisk(status, 60);
      expect(result.length).toBeGreaterThanOrEqual(1);
      const ids = result.map((r) => r.zoneId);
      expect(ids).toContain("section-101");
    });

    it("should return recs for zones with occupancy > 75 even if risk is low", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", riskScore: 30, occupancyPercent: 80 }));
      const result = engine.getForAllHighRisk(status, 70);
      expect(result.some((r) => r.zoneId === "section-101")).toBe(true);
    });

    it("should sort by riskLevel (critical first)", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("zone-low", makeZoneLiveStatus({ zoneId: "zone-low", riskScore: 80, occupancyPercent: 50 }));
      status.set("zone-high", makeZoneLiveStatus({ zoneId: "zone-high", riskScore: 90, occupancyPercent: 90 }));
      const result = engine.getForAllHighRisk(status, 60);
      if (result.length >= 2) {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        expect(order[result[0].riskLevel]).toBeLessThanOrEqual(order[result[1].riskLevel]);
      }
    });

    it("should limit to 8 results", () => {
      const status = new Map<string, ZoneLiveStatus>();
      for (let i = 0; i < 20; i++) {
        status.set(`zone-${i}`, makeZoneLiveStatus({ zoneId: `zone-${i}`, riskScore: 80, occupancyPercent: 80 }));
      }
      const result = engine.getForAllHighRisk(status, 60);
      expect(result.length).toBeLessThanOrEqual(8);
    });

    it("should return empty array for no risk", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("zone-1", makeZoneLiveStatus({ zoneId: "zone-1", riskScore: 10, occupancyPercent: 30 }));
      const result = engine.getForAllHighRisk(status, 70);
      expect(result.length).toBe(0);
    });
  });
});

describe("MockSimulationEngine (Digital Twin)", () => {
  let engine: MockSimulationEngine;

  beforeEach(() => {
    engine = new MockSimulationEngine();
  });

  describe("applyScenario", () => {
    it("should apply heavy_rain scenario correctly", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "conc-n" || z.id === "section-101");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("conc-n", makeZoneLiveStatus({ zoneId: "conc-n", type: "concourse" as any, temperature: 25, occupancyPercent: 50, queueTimeMinutes: 5 }));
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", type: "seating" as any, temperature: 25, occupancyPercent: 50, queueTimeMinutes: 3 }));
      const result = engine.applyScenario("heavy_rain", zones, status);
      const concourse = result.get("conc-n");
      expect(concourse?.temperature).toBe(14);
      expect(concourse?.queueTimeMinutes).toBe(13);
    });

    it("should apply power_failure scenario correctly", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101" || z.id === "park-1");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", safetyScore: 90, riskScore: 10, temperature: 25, status: "operational" }));
      status.set("park-1", makeZoneLiveStatus({ zoneId: "park-1", safetyScore: 90, riskScore: 10, temperature: 25, status: "operational" }));
      const result = engine.applyScenario("power_failure", zones, status);
      expect(result.get("section-101")?.safetyScore).toBe(60);
      expect(result.get("section-101")?.riskScore).toBe(35);
    });

    it("should apply crowd_surge scenario making all zones emergency", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50, riskScore: 10, safetyScore: 90, queueTimeMinutes: 2, temperature: 25, status: "operational" }));
      const result = engine.applyScenario("crowd_surge", zones, status);
      expect(result.get("section-101")?.status).toBe("emergency");
      expect(result.get("section-101")?.occupancyPercent).toBe(85);
      expect(result.get("section-101")?.safetyScore).toBe(55);
    });

    it("should apply fire scenario with emergency status for seating/concourse", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", safetyScore: 90, riskScore: 10, temperature: 25, status: "operational" }));
      const result = engine.applyScenario("fire", zones, status);
      expect(result.get("section-101")?.status).toBe("emergency");
      expect(result.get("section-101")?.temperature).toBe(37);
    });

    it("should apply parking_overflow to parking zones only", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "park-1" || z.id === "section-101");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("park-1", makeZoneLiveStatus({ zoneId: "park-1", occupancyPercent: 60, riskScore: 10, queueTimeMinutes: 5 }));
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50, riskScore: 10, queueTimeMinutes: 2 }));
      const result = engine.applyScenario("parking_overflow", zones, status);
      expect(result.get("park-1")?.occupancyPercent).toBe(98);
      expect(result.get("park-1")?.riskScore).toBe(80);
      expect(result.get("park-1")?.queueTimeMinutes).toBe(35);
      expect(result.get("section-101")?.occupancyPercent).toBe(50);
    });

    it("should apply vip_arrival to gate_entry and vip zones", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "gate-a" || z.id === "vip-east" || z.id === "section-101");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("gate-a", makeZoneLiveStatus({ zoneId: "gate-a", occupancyPercent: 40, queueTimeMinutes: 5, safetyScore: 80 }));
      status.set("vip-east", makeZoneLiveStatus({ zoneId: "vip-east", occupancyPercent: 50, queueTimeMinutes: 3, safetyScore: 85 }));
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50, queueTimeMinutes: 2, safetyScore: 80 }));
      const result = engine.applyScenario("vip_arrival", zones, status);
      expect(result.get("gate-a")?.occupancyPercent).toBe(60);
      expect(result.get("vip-east")?.occupancyPercent).toBe(70);
      expect(result.get("section-101")?.occupancyPercent).toBe(50);
    });

    it("should apply final_match_crowd to all zones", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101" || z.id === "gate-a");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50, queueTimeMinutes: 5, temperature: 25 }));
      status.set("gate-a", makeZoneLiveStatus({ zoneId: "gate-a", occupancyPercent: 50, queueTimeMinutes: 3, temperature: 24 }));
      const result = engine.applyScenario("final_match_crowd", zones, status);
      expect(result.get("section-101")?.occupancyPercent).toBe(65);
      expect(result.get("gate-a")?.occupancyPercent).toBe(65);
      expect(result.get("section-101")?.temperature).toBe(29);
    });

    it("should apply weather_delay with increased queue times", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", queueTimeMinutes: 5, occupancyPercent: 50, temperature: 25 }));
      const result = engine.applyScenario("weather_delay", zones, status);
      expect(result.get("section-101")?.queueTimeMinutes).toBe(25);
      expect(result.get("section-101")?.temperature).toBe(16);
    });

    it("should apply network_failure with risk and safety impact", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "section-101");
      const status = new Map<string, ZoneLiveStatus>();
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", riskScore: 10, safetyScore: 90 }));
      const result = engine.applyScenario("network_failure", zones, status);
      expect(result.get("section-101")?.riskScore).toBe(25);
      expect(result.get("section-101")?.safetyScore).toBe(75);
    });

    it("should handle unknown zone gracefully", () => {
      const zones = STADIUM_ZONES.filter((z) => z.id === "unknown-id");
      const status = new Map<string, ZoneLiveStatus>();
      const result = engine.applyScenario("fire", zones, status);
      expect(result.size).toBe(0);
    });
  });

  describe("generateSnapshot", () => {
    it("should create a snapshot with label", () => {
      const status = makeStatusMap();
      const result = engine.generateSnapshot(status, "Test Snapshot");
      expect(result.label).toBe("Test Snapshot");
      expect(result.timestamp).toBeTruthy();
    });

    it("should include zones in snapshot", () => {
      const status = makeStatusMap([{ zoneId: "test-zone" }]);
      const result = engine.generateSnapshot(status, "Test");
      expect(result.zones.length).toBe(1);
      expect(result.zones[0].zoneId).toBe("test-zone");
    });

    it("should initialize entities and incidents as empty", () => {
      const status = makeStatusMap();
      const result = engine.generateSnapshot(status, "Test");
      expect(result.entities).toEqual([]);
      expect(result.incidents).toEqual([]);
    });
  });
});

describe("MockVisualizationEngine", () => {
  let engine: MockVisualizationEngine;

  beforeEach(() => {
    engine = new MockVisualizationEngine();
  });

  describe("getHeatmapColor", () => {
    it("should return green for < 55%", () => {
      expect(engine.getHeatmapColor(30)).toBe("#22c55e");
      expect(engine.getHeatmapColor(54)).toBe("#22c55e");
    });

    it("should return yellow for 55-69%", () => {
      expect(engine.getHeatmapColor(55)).toBe("#eab308");
      expect(engine.getHeatmapColor(65)).toBe("#eab308");
    });

    it("should return orange for 70-84%", () => {
      expect(engine.getHeatmapColor(70)).toBe("#f97316");
      expect(engine.getHeatmapColor(80)).toBe("#f97316");
    });

    it("should return red for >= 85%", () => {
      expect(engine.getHeatmapColor(85)).toBe("#ef4444");
      expect(engine.getHeatmapColor(95)).toBe("#ef4444");
    });

    it("should handle 0%", () => {
      expect(engine.getHeatmapColor(0)).toBe("#22c55e");
    });

    it("should handle 100%", () => {
      expect(engine.getHeatmapColor(100)).toBe("#ef4444");
    });
  });

  describe("getZoneOpacity", () => {
    it("should return 0.2 for 0%", () => {
      expect(engine.getZoneOpacity(0)).toBe(0.2);
    });

    it("should return 0.85 for 100%", () => {
      expect(engine.getZoneOpacity(100)).toBe(0.85);
    });

    it("should increase opacity with percent", () => {
      const low = engine.getZoneOpacity(20);
      const high = engine.getZoneOpacity(80);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe("getMetricTrend", () => {
    it("should return stable when diff < 2", () => {
      expect(engine.getMetricTrend(50, 51)).toBe("stable");
      expect(engine.getMetricTrend(50, 49)).toBe("stable");
    });

    it("should return up when current > previous by >= 2", () => {
      expect(engine.getMetricTrend(60, 50)).toBe("up");
    });

    it("should return down when current < previous by >= 2", () => {
      expect(engine.getMetricTrend(40, 50)).toBe("down");
    });

    it("should return stable when values are equal", () => {
      expect(engine.getMetricTrend(50, 50)).toBe("stable");
    });
  });

  describe("formatLayerData", () => {
    it("should extract occupancyPercent for crowd_density layer", () => {
      const status = makeStatusMap([{ zoneId: "zone-1", occupancyPercent: 70 }]);
      const result = engine.formatLayerData("crowd_density", status);
      expect(result["zone-1"]).toBe(70);
    });

    it("should extract queueTimeMinutes for queues layer", () => {
      const status = makeStatusMap([{ zoneId: "zone-1", queueTimeMinutes: 15 }]);
      const result = engine.formatLayerData("queues", status);
      expect(result["zone-1"]).toBe(15);
    });

    it("should extract energyUsageKw for energy layer", () => {
      const status = makeStatusMap([{ zoneId: "zone-1", energyUsageKw: 500 }]);
      const result = engine.formatLayerData("energy", status);
      expect(result["zone-1"]).toBe(500);
    });

    it("should only include parking zones for parking layer", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("park-1", makeZoneLiveStatus({ zoneId: "park-1", occupancyPercent: 80 }));
      status.set("section-101", makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50 }));
      const result = engine.formatLayerData("parking", status);
      expect(result["park-1"]).toBe(80);
      expect(result["section-101"]).toBeUndefined();
    });

    it("should encode maintenance status as number", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("zone-1", makeZoneLiveStatus({ zoneId: "zone-1", maintenanceStatus: "overdue" }));
      status.set("zone-2", makeZoneLiveStatus({ zoneId: "zone-2", maintenanceStatus: "in_progress" }));
      status.set("zone-3", makeZoneLiveStatus({ zoneId: "zone-3", maintenanceStatus: "scheduled" }));
      status.set("zone-4", makeZoneLiveStatus({ zoneId: "zone-4", maintenanceStatus: "none" }));
      const result = engine.formatLayerData("maintenance", status);
      expect(result["zone-1"]).toBe(100);
      expect(result["zone-2"]).toBe(60);
      expect(result["zone-3"]).toBe(30);
      expect(result["zone-4"]).toBe(0);
    });

    it("should encode cleaning status as number", () => {
      const status = new Map<string, ZoneLiveStatus>();
      status.set("zone-1", makeZoneLiveStatus({ zoneId: "zone-1", cleaningStatus: "due" }));
      status.set("zone-2", makeZoneLiveStatus({ zoneId: "zone-2", cleaningStatus: "in_progress" }));
      status.set("zone-3", makeZoneLiveStatus({ zoneId: "zone-3", cleaningStatus: "clean" }));
      const result = engine.formatLayerData("cleaning", status);
      expect(result["zone-1"]).toBe(50);
      expect(result["zone-2"]).toBe(80);
      expect(result["zone-3"]).toBe(10);
    });

    it("should fall back to occupancyPercent for unknown layers", () => {
      const status = makeStatusMap([{ zoneId: "zone-1", occupancyPercent: 65 }]);
      const result = engine.formatLayerData("iot_sensors", status);
      expect(result["zone-1"]).toBe(65);
    });

    it("should handle empty status map", () => {
      const result = engine.formatLayerData("crowd_density", new Map());
      expect(result).toEqual({});
    });
  });
});

describe("MockMapEngine (Digital Twin)", () => {
  let engine: MockMapEngine;

  beforeEach(() => {
    engine = new MockMapEngine();
  });

  describe("getVisibleEntities", () => {
    it("should return only entities with enabled layers", () => {
      const entities: MapEntity[] = [
        { id: "e1", zoneId: "z1", type: "team", label: "T1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "security_teams" },
        { id: "e2", zoneId: "z1", type: "incident", label: "I1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "incidents" },
        { id: "e3", zoneId: "z1", type: "team", label: "T2", coordinates: { x: 0, y: 0 }, pulse: false, layer: "maintenance" },
      ];
      const result = engine.getVisibleEntities(entities, ["security_teams", "incidents"]);
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toEqual(["e1", "e2"]);
    });

    it("should return empty array when no layers match", () => {
      const entities: MapEntity[] = [
        { id: "e1", zoneId: "z1", type: "team", label: "T1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "security_teams" },
      ];
      const result = engine.getVisibleEntities(entities, ["crowd_density"]);
      expect(result).toEqual([]);
    });

    it("should return all entities when all layers enabled", () => {
      const entities: MapEntity[] = [
        { id: "e1", zoneId: "z1", type: "team", label: "T1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "security_teams" },
        { id: "e2", zoneId: "z1", type: "incident", label: "I1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "incidents" },
      ];
      const result = engine.getVisibleEntities(entities, ["security_teams", "incidents", "crowd_density"]);
      expect(result).toHaveLength(2);
    });

    it("should return empty array for empty entities", () => {
      const result = engine.getVisibleEntities([], ["security_teams"]);
      expect(result).toEqual([]);
    });
  });

  describe("filterByZone", () => {
    it("should return entities matching zoneId", () => {
      const entities: MapEntity[] = [
        { id: "e1", zoneId: "zone-1", type: "team", label: "T1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "security_teams" },
        { id: "e2", zoneId: "zone-2", type: "team", label: "T2", coordinates: { x: 0, y: 0 }, pulse: false, layer: "medical_teams" },
      ];
      const result = engine.filterByZone(entities, "zone-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("e1");
    });

    it("should return empty array when no match", () => {
      const entities: MapEntity[] = [
        { id: "e1", zoneId: "zone-1", type: "team", label: "T1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "security_teams" },
      ];
      const result = engine.filterByZone(entities, "zone-999");
      expect(result).toEqual([]);
    });
  });

  describe("search", () => {
    it("should find zones by name", () => {
      const result = engine.search("Section 101", STADIUM_ZONES);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toContain("Section 101");
    });

    it("should find zones by id", () => {
      const result = engine.search("section-101", STADIUM_ZONES);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe("section-101");
    });

    it("should find zones by type", () => {
      const result = engine.search("parking", STADIUM_ZONES);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((z) => z.type === "parking")).toBe(true);
    });

    it("should find zones by section", () => {
      const result = engine.search("north", STADIUM_ZONES);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should be case insensitive", () => {
      const result = engine.search("SECTION 101", STADIUM_ZONES);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const result = engine.search("xyznonexistent12345", STADIUM_ZONES);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty query", () => {
      const result = engine.search("", STADIUM_ZONES);
      expect(result).toHaveLength(0);
    });
  });
});

describe("Engine Integration", () => {
  it("all engines should work together in a pipeline", () => {
    const dtEngine = new DigitalTwinEngine();
    const statuses = dtEngine.simulateZoneStatuses();
    const incidents = dtEngine.simulateIncidents(statuses);

    const predEngine = new MockPredictionEngine();
    const updatedStatuses = predEngine.predict30m(statuses, STADIUM_ZONES);

    const analytics = dtEngine.computeAnalytics(updatedStatuses, incidents);
    expect(analytics.totalOccupancy).toBeGreaterThan(0);

    const insights = dtEngine.generateInsights(updatedStatuses, analytics);
    expect(Array.isArray(insights)).toBe(true);

    const recEngine = new MockRecommendationEngine();
    const recs = recEngine.getForAllHighRisk(updatedStatuses, 70);
    expect(Array.isArray(recs)).toBe(true);

    const entities = dtEngine.simulateEntities(updatedStatuses);
    expect(entities.length).toBeGreaterThan(0);

    const visible = mapEngine.getVisibleEntities(entities, ["incidents", "medical_teams"]);
    expect(visible.length).toBeLessThanOrEqual(entities.length);
  });

  it("simulation scenarios can be applied and undone", () => {
    const dtEngine = new DigitalTwinEngine();
    const normalStatuses = dtEngine.simulateZoneStatuses();
    const normalEnergy = dtEngine.computeAnalytics(normalStatuses, []).operationalHealth;

    const zones = STADIUM_ZONES;
    const simEngine = new MockSimulationEngine();
    const emergencyStatuses = simEngine.applyScenario("fire", zones, normalStatuses);
    const emergencyEnergy = dtEngine.computeAnalytics(emergencyStatuses, []).operationalHealth;

    expect(emergencyEnergy).toBeLessThanOrEqual(normalEnergy);
  });

  it("visualization engine can color any zone occupancy", () => {
    for (let pct = 0; pct <= 100; pct += 5) {
      const color = visualizationEngine.getHeatmapColor(pct);
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("zone recommendation boundary conditions", () => {
    const dtEngine = new DigitalTwinEngine();
    const lowRec = dtEngine.generateZoneRecommendation("section-101", makeZoneLiveStatus({ occupancyPercent: 30, queueTimeMinutes: 1, safetyScore: 95, riskScore: 5 }));
    expect(lowRec.recommendations.some((r) => r.includes("monitoring"))).toBe(true);

    const highRec = dtEngine.generateZoneRecommendation("section-101", makeZoneLiveStatus({ occupancyPercent: 90, queueTimeMinutes: 20, safetyScore: 50, riskScore: 80, maintenanceStatus: "overdue" }));
    expect(highRec.recommendations.length).toBeGreaterThan(2);
  });
});

describe("Additional DigitalTwinEngine Edge Cases", () => {
  let engine: DigitalTwinEngine;

  beforeEach(() => {
    engine = new DigitalTwinEngine();
  });

  it("should handle getZones returning same reference", () => {
    const a = engine.getZones();
    const b = engine.getZones();
    expect(a).toBe(b);
  });

  it("should produce statuses with zoneId matching keys", () => {
    const result = engine.simulateZoneStatuses();
    for (const [key, status] of result) {
      expect(status.zoneId).toBe(key);
    }
  });

  it("should maintain lastUpdated field in statuses", () => {
    const result = engine.simulateZoneStatuses();
    for (const [, status] of result) {
      expect(new Date(status.lastUpdated).getTime()).toBeGreaterThan(0);
    }
  });

  it("should set queueTimeMinutes higher for food_court zones", () => {
    const result = engine.simulateZoneStatuses();
    const foodCourts = Array.from(result.entries()).filter(([id]) => id.startsWith("food-"));
    const otherZones = Array.from(result.entries()).filter(([id]) => !id.startsWith("food-") && !id.startsWith("gate-"));
    if (foodCourts.length > 0 && otherZones.length > 0) {
      const foodAvg = foodCourts.reduce((s, [, st]) => s + st.queueTimeMinutes, 0) / foodCourts.length;
      const otherAvg = otherZones.reduce((s, [, st]) => s + st.queueTimeMinutes, 0) / otherZones.length;
      expect(foodAvg).toBeGreaterThanOrEqual(otherAvg);
    }
  });

  it("should not generate entities for all low risk zones", () => {
    const status = new Map<string, ZoneLiveStatus>();
    for (let i = 0; i < 5; i++) {
      const z = makeZoneLiveStatus({ zoneId: `zone-${i}`, riskScore: 10, maxCapacity: 500, currentOccupancy: 200, safetyScore: 90, temperature: 25, status: "operational", queueTimeMinutes: 2, energyUsageKw: 50, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 });
      status.set(`zone-${i}`, z);
    }
    const result = engine.simulateEntities(status);
    const incidents = result.filter((e) => e.type === "incident");
    expect(incidents.length).toBe(0);
  });

  it("should provide team entities with valid layers", () => {
    const status = makeStatusMap([{ zoneId: "section-101", riskScore: 10 }]);
    const result = engine.simulateEntities(status);
    const teams = result.filter((e) => e.type === "team");
    for (const t of teams) {
      expect(t.layer).toMatch(/security_teams|medical_teams/);
    }
  });

  it("should generate incidents with unique IDs", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.3);
    const status = makeStatusMap([{ zoneId: "section-101", riskScore: 80 }]);
    const r1 = engine.simulateIncidents(status);
    const r2 = engine.simulateIncidents(status);
    vi.restoreAllMocks();
    if (r1.length > 0 && r2.length > 0) {
      expect(r1[0].id).not.toBe(r2[0].id);
    }
  });

  it("should assign security incidents medium severity", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const status = makeStatusMap([{ zoneId: "section-101", riskScore: 10 }]);
    const result = engine.simulateIncidents(status);
    vi.restoreAllMocks();
    const sec = result.find((i) => i.type === "security");
    if (sec) {
      expect(sec.severity).toBe("medium");
    }
  });

  it("should assign lost_child incidents with correct zone", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    const status = makeStatusMap([{ zoneId: "section-101", riskScore: 10 }]);
    const result = engine.simulateIncidents(status);
    vi.restoreAllMocks();
    const lost = result.find((i) => i.type === "lost_child");
    if (lost) {
      expect(lost.zoneId).toBe("gate-c");
    }
  });

  it("should compute analytics with mixed emergency and operational zones", () => {
    const status = new Map<string, ZoneLiveStatus>();
    status.set("emergency-zone", makeZoneLiveStatus({ zoneId: "emergency-zone", status: "emergency", maxCapacity: 500, currentOccupancy: 450, safetyScore: 30, temperature: 30, riskScore: 80, queueTimeMinutes: 15, energyUsageKw: 200, occupancyPercent: 90, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 95 }));
    status.set("normal-zone", makeZoneLiveStatus({ zoneId: "normal-zone", status: "operational", maxCapacity: 500, currentOccupancy: 100, safetyScore: 95, temperature: 22, riskScore: 5, queueTimeMinutes: 1, energyUsageKw: 50, occupancyPercent: 20, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 25 }));
    const incidents: DigitalIncident[] = [];
    const result = engine.computeAnalytics(status, incidents);
    expect(result.operationalHealth).toBeLessThan(100);
    expect(result.totalOccupancy).toBe(550);
  });

  it("should generate insights with suggestedAction when appropriate", () => {
    const status = new Map<string, ZoneLiveStatus>();
    for (let i = 0; i < 10; i++) {
      status.set(`zone-${i}`, makeZoneLiveStatus({ zoneId: `zone-${i}`, occupancyPercent: 80, maxCapacity: 500, currentOccupancy: 400, safetyScore: 70, temperature: 26, status: "degraded", riskScore: 30, queueTimeMinutes: 8, energyUsageKw: 100, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 85 }));
    }
    const analytics = makeLiveAnalytics({ operationalHealth: 70 });
    const result = engine.generateInsights(status, analytics);
    for (const insight of result) {
      if (insight.type === "warning" || insight.type === "prediction" || insight.type === "recommendation") {
        expect(insight.suggestedAction).toBeTruthy();
      }
    }
  });

  it("should generateZoneRecommendation with correct zone name", () => {
    const status = makeZoneLiveStatus({ zoneId: "section-101" });
    const result = engine.generateZoneRecommendation("section-101", status);
    expect(result.zoneName).toBe("Section 101");
  });

  it("should generateZoneRecommendation with fallback name for unknown zone", () => {
    const status = makeZoneLiveStatus({ zoneId: "unknown-zone" });
    const result = engine.generateZoneRecommendation("unknown-zone", status);
    expect(result.zoneName).toBe("unknown-zone");
  });

  it("should have timeToPrediction in generated zone recs", () => {
    const status = makeZoneLiveStatus({ zoneId: "section-101", occupancyPercent: 50 });
    const result = engine.generateZoneRecommendation("section-101", status);
    expect(result.timeToPrediction).toMatch(/\d+/);
  });
});

describe("Additional Analytics Engine Edge Cases", () => {
  let engine: MockAnalyticsEngine;

  beforeEach(() => {
    engine = new MockAnalyticsEngine();
  });

  it("should compute maintenanceHealth based on overdue count", () => {
    const status = new Map<string, ZoneLiveStatus>();
    status.set("z1", makeZoneLiveStatus({ zoneId: "z1", maintenanceStatus: "overdue", maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, occupancyPercent: 40, cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
    status.set("z2", makeZoneLiveStatus({ zoneId: "z2", maintenanceStatus: "overdue", maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, occupancyPercent: 40, cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
    const result = engine.compute(status, []);
    expect(result.maintenanceHealth).toBe(76);
  });

  it("should compute queueHealth with decreasing value for more zones > 10min", () => {
    const status = new Map<string, ZoneLiveStatus>();
    status.set("z1", makeZoneLiveStatus({ zoneId: "z1", queueTimeMinutes: 15, maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, status: "operational", riskScore: 10, energyUsageKw: 50, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
    const result = engine.compute(status, []);
    expect(result.queueHealth).toBe(94);
  });

  it("should set activeTeams to 4 always", () => {
    const result = engine.compute(new Map(), []);
    expect(result.activeTeams).toBe(4);
  });

  it("should compute resourceUtilization from operational zones", () => {
    const status = new Map<string, ZoneLiveStatus>();
    status.set("z1", makeZoneLiveStatus({ zoneId: "z1", status: "operational", maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
    status.set("z2", makeZoneLiveStatus({ zoneId: "z2", status: "degraded", maxCapacity: 500, currentOccupancy: 200, safetyScore: 80, temperature: 25, riskScore: 10, queueTimeMinutes: 2, energyUsageKw: 50, occupancyPercent: 40, maintenanceStatus: "none", cleaningStatus: "clean", lastUpdated: new Date().toISOString(), predictedOccupancy30m: 45 }));
    const result = engine.compute(status, []);
    expect(result.resourceUtilization).toBe(50);
  });
});

describe("Additional Visualization Engine Edge Cases", () => {
  let engine: MockVisualizationEngine;

  beforeEach(() => {
    engine = new MockVisualizationEngine();
  });

  it("getHeatmapColor handles exact boundary values", () => {
    expect(engine.getHeatmapColor(55)).toBe("#eab308");
    expect(engine.getHeatmapColor(70)).toBe("#f97316");
    expect(engine.getHeatmapColor(85)).toBe("#ef4444");
  });

  it("getZoneOpacity is monotonic", () => {
    const values = [0, 10, 25, 50, 75, 100];
    for (let i = 1; i < values.length; i++) {
      expect(engine.getZoneOpacity(values[i])).toBeGreaterThan(engine.getZoneOpacity(values[i - 1]));
    }
  });

  it("getMetricTrend handles all trend directions for all metrics", () => {
    expect(engine.getMetricTrend(100, 50)).toBe("up");
    expect(engine.getMetricTrend(50, 100)).toBe("down");
    expect(engine.getMetricTrend(50, 51)).toBe("stable");
    expect(engine.getMetricTrend(51, 50)).toBe("stable");
  });

  it("formatLayerData handles broadcast layer fallback", () => {
    const status = makeStatusMap([{ zoneId: "zone-1", occupancyPercent: 75 }]);
    const result = engine.formatLayerData("broadcast", status);
    expect(result["zone-1"]).toBe(75);
  });

  it("formatLayerData handles weather layer fallback", () => {
    const status = makeStatusMap([{ zoneId: "zone-1", occupancyPercent: 60 }]);
    const result = engine.formatLayerData("weather", status);
    expect(result["zone-1"]).toBe(60);
  });
});

describe("Additional Map Engine Edge Cases", () => {
  let engine: MockMapEngine;

  beforeEach(() => {
    engine = new MockMapEngine();
  });

  it("getVisibleEntities with empty enabled layers returns empty", () => {
    const entities: MapEntity[] = [
      { id: "e1", zoneId: "z1", type: "team", label: "T1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "incidents" },
    ];
    expect(engine.getVisibleEntities(entities, [])).toEqual([]);
  });

  it("filterByZone returns all entities with same zoneId", () => {
    const entities: MapEntity[] = [
      { id: "e1", zoneId: "z1", type: "team", label: "T1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "security_teams" },
      { id: "e2", zoneId: "z1", type: "incident", label: "I1", coordinates: { x: 0, y: 0 }, pulse: false, layer: "incidents" },
    ];
    expect(engine.filterByZone(entities, "z1")).toHaveLength(2);
  });

  it("filterByZone with empty entities returns empty", () => {
    expect(engine.filterByZone([], "z1")).toEqual([]);
  });

  it("search by section finds multiple zones", () => {
    const result = engine.search("North", STADIUM_ZONES);
    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  it("search by type 'seating' finds 12 zones", () => {
    const result = engine.search("seating", STADIUM_ZONES);
    expect(result.length).toBe(12);
  });

  it("search by level substring", () => {
    const result = engine.search("201", STADIUM_ZONES);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("search with partial id prefix returns matches", () => {
    const result = engine.search("gate", STADIUM_ZONES);
    expect(result.length).toBeGreaterThanOrEqual(6);
  });
});

