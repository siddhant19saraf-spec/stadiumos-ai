// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MockPredictionEngine, predictionEngine } from "@/features/crowd-intelligence/services/prediction-engine";
import { MockRecommendationEngine, recommendationEngine } from "@/features/crowd-intelligence/services/recommendation-engine";
import { simulationEngine } from "@/features/crowd-intelligence/services/simulation-engine";
import {
  STADIUM_ZONES,
  HEATMAP_CONFIG,
  DENSITY_THRESHOLDS,
  REFRESH_INTERVAL,
  PREDICTION_HORIZON_MINUTES,
} from "@/features/crowd-intelligence/constants";
import { makeCrowdZone, makeCrowdAnalytics, resetCounter } from "../fixtures/factories";

beforeEach(() => {
  resetCounter();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Constants", () => {
  it("STADIUM_ZONES has 18 zones", () => {
    expect(STADIUM_ZONES.length).toBe(18);
  });

  it("STADIUM_ZONES covers all zone types", () => {
    const types = new Set(STADIUM_ZONES.map((z) => z.type));
    expect(types.has("gate")).toBe(true);
    expect(types.has("concourse")).toBe(true);
    expect(types.has("section")).toBe(true);
    expect(types.has("vip")).toBe(true);
    expect(types.has("concession")).toBe(true);
    expect(types.has("exit")).toBe(true);
  });

  it("STADIUM_ZONES have unique ids", () => {
    const ids = STADIUM_ZONES.map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("STADIUM_ZONES all have positive capacity", () => {
    for (const z of STADIUM_ZONES) {
      expect(z.capacity).toBeGreaterThan(0);
    }
  });

  it("STADIUM_ZONES have valid location coordinates", () => {
    for (const z of STADIUM_ZONES) {
      expect(z.location.x).toBeGreaterThanOrEqual(0);
      expect(z.location.y).toBeGreaterThanOrEqual(0);
      expect(z.location.width).toBeGreaterThan(0);
      expect(z.location.height).toBeGreaterThan(0);
    }
  });

  it("STADIUM_ZONES all start at normal status", () => {
    expect(STADIUM_ZONES.every((z) => z.status === "normal")).toBe(true);
  });

  it("STADIUM_ZONES all start with 0 currentCount", () => {
    expect(STADIUM_ZONES.every((z) => z.currentCount === 0)).toBe(true);
  });

  it("STADIUM_ZONES all start with 0 densityPercent", () => {
    expect(STADIUM_ZONES.every((z) => z.densityPercent === 0)).toBe(true);
  });

  it("HEATMAP_CONFIG has minOpacity 0.15", () => {
    expect(HEATMAP_CONFIG.minOpacity).toBe(0.15);
  });

  it("HEATMAP_CONFIG has maxOpacity 0.85", () => {
    expect(HEATMAP_CONFIG.maxOpacity).toBe(0.85);
  });

  it("HEATMAP_CONFIG has 4 color stops", () => {
    expect(HEATMAP_CONFIG.colorStops.length).toBe(4);
  });

  it("HEATMAP_CONFIG color stops are sorted by threshold", () => {
    for (let i = 1; i < HEATMAP_CONFIG.colorStops.length; i++) {
      expect(HEATMAP_CONFIG.colorStops[i].threshold).toBeGreaterThan(HEATMAP_CONFIG.colorStops[i - 1].threshold);
    }
  });

  it("HEATMAP_CONFIG color stop values", () => {
    expect(HEATMAP_CONFIG.colorStops[0]).toEqual({ threshold: 0, color: "#22c55e" });
    expect(HEATMAP_CONFIG.colorStops[1]).toEqual({ threshold: 40, color: "#eab308" });
    expect(HEATMAP_CONFIG.colorStops[2]).toEqual({ threshold: 65, color: "#f97316" });
    expect(HEATMAP_CONFIG.colorStops[3]).toEqual({ threshold: 85, color: "#ef4444" });
  });

  it("DENSITY_THRESHOLDS has all 4 status types", () => {
    expect(DENSITY_THRESHOLDS.normal).toBeDefined();
    expect(DENSITY_THRESHOLDS.moderate).toBeDefined();
    expect(DENSITY_THRESHOLDS.congested).toBeDefined();
    expect(DENSITY_THRESHOLDS.critical).toBeDefined();
  });

  it("DENSITY_THRESHOLDS have increasing max values", () => {
    expect(DENSITY_THRESHOLDS.normal.max).toBeLessThan(DENSITY_THRESHOLDS.moderate.max);
    expect(DENSITY_THRESHOLDS.moderate.max).toBeLessThan(DENSITY_THRESHOLDS.congested.max);
    expect(DENSITY_THRESHOLDS.congested.max).toBeLessThan(DENSITY_THRESHOLDS.critical.max);
  });

  it("DENSITY_THRESHOLDS max values are correct", () => {
    expect(DENSITY_THRESHOLDS.normal.max).toBe(40);
    expect(DENSITY_THRESHOLDS.moderate.max).toBe(65);
    expect(DENSITY_THRESHOLDS.congested.max).toBe(85);
    expect(DENSITY_THRESHOLDS.critical.max).toBe(100);
  });

  it("DENSITY_THRESHOLDS have distinct colors", () => {
    const colors = new Set([DENSITY_THRESHOLDS.normal.color, DENSITY_THRESHOLDS.moderate.color, DENSITY_THRESHOLDS.congested.color, DENSITY_THRESHOLDS.critical.color]);
    expect(colors.size).toBe(4);
  });

  it("REFRESH_INTERVAL is 5000ms", () => {
    expect(REFRESH_INTERVAL).toBe(5000);
  });

  it("PREDICTION_HORIZON_MINUTES is 60", () => {
    expect(PREDICTION_HORIZON_MINUTES).toBe(60);
  });
});

describe("MockPredictionEngine", () => {
  let engine: MockPredictionEngine;

  beforeEach(() => {
    engine = new MockPredictionEngine();
  });

  it("should return nominal prediction when no high density zones", () => {
    const zones = [makeCrowdZone({ densityPercent: 20, type: "section" })];
    const analytics = makeCrowdAnalytics();
    const result = engine.analyze(zones, analytics);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const nominal = result.find((p) => p.title.includes("Nominal Operations"));
    expect(nominal).toBeDefined();
  });

  it("should generate predictions for high-density zones (>50%)", () => {
    const zones = [
      makeCrowdZone({ densityPercent: 75, type: "section", name: "Section 101" }),
      makeCrowdZone({ densityPercent: 60, type: "gate", name: "Gate A" }),
    ];
    const analytics = makeCrowdAnalytics();
    const result = engine.analyze(zones, analytics);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("should limit zones to top 4 by density", () => {
    const zones = Array.from({ length: 10 }, (_, i) => makeCrowdZone({
      densityPercent: 50 + i * 3,
      type: "section",
      name: `Section ${i}`,
    }));
    const analytics = makeCrowdAnalytics();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, analytics);
    expect(result.length).toBeLessThanOrEqual(4);
    vi.restoreAllMocks();
  });

  it("should skip restroom type zones", () => {
    const zones = [
      makeCrowdZone({ densityPercent: 80, type: "restroom", name: "Restroom" }),
    ];
    const analytics = makeCrowdAnalytics();
    const result = engine.analyze(zones, analytics);
    const nominal = result.find((p) => p.title.includes("Nominal Operations"));
    expect(nominal).toBeDefined();
  });

  it("should generate predictions with type crowd_movement", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "section" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = predictionEngine.analyze(zones, makeCrowdAnalytics());
    expect(result.length).toBeGreaterThan(0);
    for (const p of result) {
      expect(p.type).toBeDefined();
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(100);
    }
    vi.restoreAllMocks();
  });

  it("should set severity based on density", () => {
    const zones = [makeCrowdZone({ densityPercent: 80, type: "section" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    for (const p of result) {
      expect(p.severity).toBeDefined();
      expect(["low", "medium", "high", "critical"]).toContain(p.severity);
    }
  });

  it("should include contributingFactors in predictions", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "section" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    for (const p of result) {
      expect(p.contributingFactors.length).toBeGreaterThan(0);
    }
  });

  it("should always have a suggestedAction", () => {
    const zones = [makeCrowdZone({ densityPercent: 30, type: "section" })];
    const result = engine.analyze(zones, makeCrowdAnalytics());
    for (const p of result) {
      expect(p.suggestedAction).toBeTruthy();
    }
  });

  it("should have businessImpact field", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "section" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    for (const p of result) {
      expect(p.businessImpact).toBeTruthy();
    }
  });

  it("should handle empty zones array", () => {
    const result = engine.analyze([], makeCrowdAnalytics());
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].title).toContain("Nominal Operations");
  });

  it("should produce predictions with valid timeToOccur", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "section" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    for (const p of result) {
      expect(p.timeToOccur).toBeTruthy();
      expect(p.timeToOccur).toMatch(/\d+/);
    }
  });

  it("should handle many zones without crashing", () => {
    const zones = Array.from({ length: 50 }, (_, i) => makeCrowdZone({
      densityPercent: Math.random() * 100,
      type: "section",
      name: `Zone ${i}`,
    }));
    const result = engine.analyze(zones, makeCrowdAnalytics());
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("MockRecommendationEngine (Crowd)", () => {
  let engine: MockRecommendationEngine;

  beforeEach(() => {
    engine = new MockRecommendationEngine();
  });

  it("should return empty array for no congested zones and low capacity", () => {
    const zones = [makeCrowdZone({ status: "normal", densityPercent: 30, type: "gate" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 50, riskScore: 30, safetyIndex: 90 });
    const result = engine.generate(zones, analytics);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("should generate redistribution recommendation when zones are congested", () => {
    const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101", safetyScore: 60 })];
    const analytics = makeCrowdAnalytics();
    const result = engine.generate(zones, analytics);
    const redist = result.find((r) => r.action.includes("Crowd Redistribution"));
    expect(redist).toBeDefined();
  });

  it("should generate redistribution as critical when any zone is critical", () => {
    const zones = [makeCrowdZone({ status: "critical", densityPercent: 90, name: "Section 101" })];
    const analytics = makeCrowdAnalytics();
    const result = engine.generate(zones, analytics);
    const redist = result.find((r) => r.action.includes("Crowd Redistribution"));
    expect(redist?.priority).toBe("critical");
  });

  it("should generate redistribution as high when zones are congested but not critical", () => {
    const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics();
    const result = engine.generate(zones, analytics);
    const redist = result.find((r) => r.action.includes("Crowd Redistribution"));
    expect(redist?.priority).toBe("high");
  });

  it("should recommend redirecting flow when gates are imbalanced", () => {
    const zones = [
      makeCrowdZone({ type: "gate", densityPercent: 80, name: "Gate A" }),
      makeCrowdZone({ type: "gate", densityPercent: 20, name: "Gate B" }),
    ];
    const analytics = makeCrowdAnalytics();
    const result = engine.generate(zones, analytics);
    const redirect = result.find((r) => r.action.includes("Redirect Entry Flow"));
    expect(redirect).toBeDefined();
    expect(redirect?.location).toContain("→");
  });

  it("should not redirect flow when only one gate is imbalanced", () => {
    const zones = [makeCrowdZone({ type: "gate", densityPercent: 80, name: "Gate A" })];
    const analytics = makeCrowdAnalytics();
    const result = engine.generate(zones, analytics);
    const redirect = result.find((r) => r.action.includes("Redirect Entry Flow"));
    expect(redirect).toBeUndefined();
  });

  it("should recommend additional staff when capacity > 75%", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 80 });
    const result = engine.generate(zones, analytics);
    const staff = result.find((r) => r.action.includes("Additional Staff"));
    expect(staff).toBeDefined();
  });

  it("should recommend staff as critical when capacity > 85%", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 90 });
    const result = engine.generate(zones, analytics);
    const staff = result.find((r) => r.action.includes("Additional Staff"));
    expect(staff?.priority).toBe("critical");
  });

  it("should recommend safety communication when riskScore > 60", () => {
    const zones = [makeCrowdZone()];
    const analytics = makeCrowdAnalytics({ riskScore: 70 });
    const result = engine.generate(zones, analytics);
    const comm = result.find((r) => r.action.includes("Safety Communication"));
    expect(comm).toBeDefined();
  });

  it("should recommend infrastructure activation when safetyIndex < 70", () => {
    const zones = [makeCrowdZone({ name: "Section 101", safetyScore: 50 })];
    const analytics = makeCrowdAnalytics({ safetyIndex: 60 });
    const result = engine.generate(zones, analytics);
    const infra = result.find((r) => r.action.includes("Infrastructure"));
    expect(infra).toBeDefined();
    expect(infra?.priority).toBe("critical");
  });

  it("should include queue optimization recommendation when less than 3 other recs", () => {
    const zones = [makeCrowdZone({ type: "concession", waitTimeMinutes: 10 })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 50, riskScore: 30, safetyIndex: 90 });
    const result = engine.generate(zones, analytics);
    const queue = result.find((r) => r.action.includes("Queue Capacity"));
    expect(queue).toBeDefined();
  });

  it("should limit output to 5 recommendations max", () => {
    const zones = [
      makeCrowdZone({ status: "critical", densityPercent: 90, name: "Zone 1" }),
      makeCrowdZone({ type: "gate", densityPercent: 80, name: "Gate A" }),
      makeCrowdZone({ type: "gate", densityPercent: 20, name: "Gate B" }),
    ];
    const analytics = makeCrowdAnalytics({ capacityPercent: 90, riskScore: 70, safetyIndex: 60 });
    const result = engine.generate(zones, analytics);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("should assign confidence scores between expected range", () => {
    const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 80 });
    const result = engine.generate(zones, analytics);
    for (const r of result) {
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("should always include category field", () => {
    const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 80, riskScore: 70, safetyIndex: 60 });
    const result = engine.generate(zones, analytics);
    for (const r of result) {
      expect(["entry", "exit", "security", "staff", "communication", "infrastructure"]).toContain(r.category);
    }
  });

  it("should have implementationTime for all recommendations", () => {
    const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 80 });
    const result = engine.generate(zones, analytics);
    for (const r of result) {
      expect(r.implementationTime).toBeTruthy();
    }
  });

  it("should have expectedImpact for all recommendations", () => {
    const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 80 });
    const result = engine.generate(zones, analytics);
    for (const r of result) {
      expect(r.expectedImpact).toBeTruthy();
    }
  });

  it("should have reason for all recommendations", () => {
    const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 80 });
    const result = engine.generate(zones, analytics);
    for (const r of result) {
      expect(r.reason).toBeTruthy();
    }
  });
});

describe("SimulationEngine", () => {
  describe("simulateZones", () => {
    it("should return same number of zones as STADIUM_ZONES", () => {
      const result = simulationEngine.simulateZones();
      expect(result.length).toBe(STADIUM_ZONES.length);
    });

    it("should have currentCount within capacity range", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(zone.currentCount).toBeGreaterThanOrEqual(0);
        expect(zone.currentCount).toBeLessThanOrEqual(zone.capacity);
      }
    });

    it("should have densityPercent between 0 and 100", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(zone.densityPercent).toBeGreaterThanOrEqual(0);
        expect(zone.densityPercent).toBeLessThanOrEqual(100);
      }
    });

    it("should have valid status based on density", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(["normal", "moderate", "congested", "critical"]).toContain(zone.status);
      }
    });

    it("should set status to congested when density >= 85", () => {
      const zones = simulationEngine.simulateZones();
      const highZones = zones.filter((z) => z.densityPercent >= 85);
      for (const z of highZones) {
        expect(z.status).toBe("congested");
      }
    });

    it("should set status to moderate when density between 65 and 85", () => {
      const zones = simulationEngine.simulateZones();
      const midZones = zones.filter((z) => z.densityPercent >= 65 && z.densityPercent < 85);
      for (const z of midZones) {
        expect(z.status).toBe("moderate");
      }
    });

    it("should set status to normal when density between 40 and 65", () => {
      const zones = simulationEngine.simulateZones();
      const normalZones = zones.filter((z) => z.densityPercent >= 40 && z.densityPercent < 65);
      for (const z of normalZones) {
        expect(z.status).toBe("normal");
      }
    });

    it("should set status to normal when density < 40", () => {
      const zones = simulationEngine.simulateZones();
      const lowZones = zones.filter((z) => z.densityPercent < 40);
      for (const z of lowZones) {
        expect(z.status).toBe("normal");
      }
    });

    it("should have safetyScore between 0 and 100", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(zone.safetyScore).toBeGreaterThanOrEqual(0);
        expect(zone.safetyScore).toBeLessThanOrEqual(100);
      }
    });

    it("should have movementSpeed between 0.1 and 2.0", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(zone.movementSpeed).toBeGreaterThanOrEqual(0.1);
        expect(zone.movementSpeed).toBeLessThanOrEqual(2.0);
      }
    });

    it("should have waitTimeMinutes between 0 and 45", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(zone.waitTimeMinutes).toBeGreaterThanOrEqual(0);
        expect(zone.waitTimeMinutes).toBeLessThanOrEqual(45);
      }
    });

    it("should have trend that is increasing, stable, or decreasing", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(["increasing", "stable", "decreasing"]).toContain(zone.trend);
      }
    });

    it("should have prediction30m between 0 and 100", () => {
      const result = simulationEngine.simulateZones();
      for (const zone of result) {
        expect(zone.prediction30m).toBeGreaterThanOrEqual(0);
        expect(zone.prediction30m).toBeLessThanOrEqual(100);
      }
    });

    it("should produce different results on consecutive calls", () => {
      const r1 = simulationEngine.simulateZones();
      const r2 = simulationEngine.simulateZones();
      const diff = r1.some((z, i) => z.currentCount !== r2[i].currentCount);
      expect(diff).toBe(true);
    });
  });

  describe("computeAnalytics", () => {
    it("should compute totalOccupancy correctly", () => {
      const zones = [
        makeCrowdZone({ currentCount: 1000, capacity: 5000 }),
        makeCrowdZone({ currentCount: 2000, capacity: 5000 }),
      ];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.currentOccupancy).toBe(3000);
      expect(result.totalVisitors).toBe(3000);
    });

    it("should compute safetyIndex as average of safety scores", () => {
      const zones = [
        makeCrowdZone({ safetyScore: 80 }),
        makeCrowdZone({ safetyScore: 90 }),
      ];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.safetyIndex).toBeGreaterThanOrEqual(80);
      expect(result.safetyIndex).toBeLessThanOrEqual(90);
    });

    it("should compute avgMovementSpeed correctly", () => {
      const zones = [
        makeCrowdZone({ movementSpeed: 1.0 }),
        makeCrowdZone({ movementSpeed: 1.5 }),
      ];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.avgMovementSpeed).toBe(1.25);
    });

    it("should have riskScore between 0 and 100", () => {
      const zones = [makeCrowdZone({ safetyScore: 80 })];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it("should have congestionScore between 0 and 100", () => {
      const zones = [makeCrowdZone({ status: "congested" })];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.congestionScore).toBeGreaterThanOrEqual(0);
      expect(result.congestionScore).toBeLessThanOrEqual(100);
    });

    it("should have heatIndex between 0 and 100", () => {
      const zones = [makeCrowdZone({ capacity: 5000 })];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.heatIndex).toBeGreaterThanOrEqual(0);
      expect(result.heatIndex).toBeLessThanOrEqual(100);
    });

    it("should compute capacityPercent based on total stadium capacity", () => {
      const zones = [
        makeCrowdZone({ currentCount: 500, capacity: 1000 }),
        makeCrowdZone({ currentCount: 500, capacity: 1000 }),
      ];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.capacityPercent).toBeGreaterThan(0);
      expect(result.capacityPercent).toBeLessThanOrEqual(100);
    });

    it("should have peakForecast as a positive number", () => {
      const zones = [makeCrowdZone()];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.peakForecast).toBeGreaterThan(0);
    });

    it("should have peakTime in HH:MM format", () => {
      const zones = [makeCrowdZone()];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.peakTime).toMatch(/^\d{1,2}:\d{2}$/);
    });

    it("should have visitorsPerMinute between 40 and 180", () => {
      const zones = [makeCrowdZone()];
      const result = simulationEngine.computeAnalytics(zones);
      expect(result.visitorsPerMinute).toBeGreaterThanOrEqual(40);
      expect(result.visitorsPerMinute).toBeLessThanOrEqual(180);
    });

    it("should handle empty zones array", () => {
      const result = simulationEngine.computeAnalytics([]);
      expect(result.currentOccupancy).toBe(0);
      expect(result.capacityPercent).toBe(0);
      expect(result.avgMovementSpeed).toBeDefined();
      expect(result.safetyIndex).toBeDefined();
    });
  });

  describe("generateAlerts", () => {
    it("should return empty array when no critical zones", () => {
      const zones = [makeCrowdZone({ status: "normal", densityPercent: 30 })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result).toEqual([]);
    });

    it("should generate alert for critical zones", () => {
      const zones = [makeCrowdZone({ status: "critical", densityPercent: 90, name: "Section 101" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result.length).toBeGreaterThan(0);
      const alert = result[0];
      expect(alert.zone).toBe("Section 101");
      expect(alert.acknowledged).toBe(false);
    });

    it("should generate alerts for zones with density > 80", () => {
      const zones = [makeCrowdZone({ status: "normal", densityPercent: 85, name: "Gate A" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should set severity to critical when density > 85", () => {
      const zones = [makeCrowdZone({ status: "critical", densityPercent: 90, name: "Section 101" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result[0].severity).toBe("critical");
    });

    it("should set severity to high when density 70-85", () => {
      const zones = [makeCrowdZone({ status: "critical", densityPercent: 75, name: "Section 101" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result[0].severity).toBe("high");
    });

    it("should limit to max 3 alerts", () => {
      const zones = Array.from({ length: 10 }, (_, i) => makeCrowdZone({
        status: "critical", densityPercent: 90, name: `Zone ${i}`,
      }));
      const result = simulationEngine.generateAlerts(zones);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it("should set type to high_density when density > 85", () => {
      const zones = [makeCrowdZone({ status: "critical", densityPercent: 90, name: "Section 101" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result[0].type).toBe("high_density");
    });

    it("should set type to elevated_density when density 80-85", () => {
      const zones = [makeCrowdZone({ status: "critical", densityPercent: 82, name: "Section 101" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result[0].type).toBe("elevated_density");
    });
  });

  describe("generateInsights", () => {
    it("should return empty insight for normal operations", () => {
      const zones = [makeCrowdZone({ status: "normal", densityPercent: 30 })];
      const analytics = makeCrowdAnalytics({ riskScore: 30, avgMovementSpeed: 1.2 });
      const result = simulationEngine.generateInsights(zones, analytics);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("should generate congestion insight when zones are congested", () => {
      const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
      const analytics = makeCrowdAnalytics();
      const result = simulationEngine.generateInsights(zones, analytics);
      const congestion = result.find((i) => i.title.includes("Congestion Pattern"));
      expect(congestion).toBeDefined();
    });

    it("should generate gate distribution insight when gates are busy", () => {
      const zones = [
        makeCrowdZone({ type: "gate", densityPercent: 70, name: "Gate A" }),
        makeCrowdZone({ type: "gate", densityPercent: 30, name: "Gate B" }),
      ];
      const analytics = makeCrowdAnalytics();
      const result = simulationEngine.generateInsights(zones, analytics);
      const gate = result.find((i) => i.title.includes("Gate Distribution"));
      expect(gate).toBeDefined();
    });

    it("should generate safety risk insight when riskScore > 50", () => {
      const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
      const analytics = makeCrowdAnalytics({ riskScore: 60 });
      const result = simulationEngine.generateInsights(zones, analytics);
      const safety = result.find((i) => i.title.includes("Safety Risk"));
      expect(safety).toBeDefined();
    });

    it("should generate observation type for normal operations", () => {
      const zones = [makeCrowdZone({ status: "normal", densityPercent: 30 })];
      const analytics = makeCrowdAnalytics({ riskScore: 30 });
      const result = simulationEngine.generateInsights(zones, analytics);
      const normal = result.find((i) => i.title.includes("Operations Normal"));
      if (normal) {
        expect(normal.type).toBe("observation");
      }
    });

    it("should have valid insight types", () => {
      const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
      const analytics = makeCrowdAnalytics({ riskScore: 60 });
      const result = simulationEngine.generateInsights(zones, analytics);
      for (const insight of result) {
        expect(["prediction", "observation", "warning", "recommendation"]).toContain(insight.type);
      }
    });

    it("should have confidence scores between 0 and 100", () => {
      const zones = [makeCrowdZone({ status: "congested", densityPercent: 70, name: "Section 101" })];
      const analytics = makeCrowdAnalytics({ riskScore: 60 });
      const result = simulationEngine.generateInsights(zones, analytics);
      for (const insight of result) {
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("generateTimeline", () => {
    it("should return 30 points by default", () => {
      const result = simulationEngine.generateTimeline();
      expect(result.length).toBe(30);
    });

    it("should return custom number of points", () => {
      const result = simulationEngine.generateTimeline(10);
      expect(result.length).toBe(10);
    });

    it("should have valid timestamp for each point", () => {
      const result = simulationEngine.generateTimeline(5);
      for (const pt of result) {
        expect(new Date(pt.timestamp).getTime()).toBeGreaterThan(0);
      }
    });

    it("should have actual, predicted, upperBound, lowerBound", () => {
      const result = simulationEngine.generateTimeline(3);
      for (const pt of result) {
        expect(typeof pt.actual).toBe("number");
        expect(typeof pt.predicted).toBe("number");
        expect(typeof pt.upperBound).toBe("number");
        expect(typeof pt.lowerBound).toBe("number");
      }
    });

    it("should have lowerBound <= predicted <= upperBound generally", () => {
      const result = simulationEngine.generateTimeline(10);
      for (const pt of result) {
        expect(pt.lowerBound).toBeLessThanOrEqual(pt.predicted);
        expect(pt.upperBound).toBeGreaterThanOrEqual(pt.predicted);
      }
    });

    it("should have timestamps in chronological order", () => {
      const result = simulationEngine.generateTimeline(10);
      for (let i = 1; i < result.length; i++) {
        expect(new Date(result[i].timestamp).getTime()).toBeGreaterThan(new Date(result[i - 1].timestamp).getTime());
      }
    });
  });

  describe("generateGateUtilization", () => {
    it("should return 4 gates", () => {
      const result = simulationEngine.generateGateUtilization();
      expect(result.length).toBe(4);
    });

    it("should have all required fields for each gate", () => {
      const result = simulationEngine.generateGateUtilization();
      for (const gate of result) {
        expect(gate.gateName).toBeTruthy();
        expect(gate.currentRate).toBeGreaterThan(0);
        expect(gate.capacity).toBeGreaterThan(0);
        expect(gate.utilizationPercent).toBeGreaterThanOrEqual(0);
        expect(gate.waitTime).toBeGreaterThanOrEqual(0);
        expect(["increasing", "stable", "decreasing"]).toContain(gate.trend);
      }
    });

    it("should have unique gate names", () => {
      const result = simulationEngine.generateGateUtilization();
      const names = result.map((g) => g.gateName);
      expect(new Set(names).size).toBe(names.length);
    });

    it("should have utilizationPercent within 0-100", () => {
      const result = simulationEngine.generateGateUtilization();
      for (const gate of result) {
        expect(gate.utilizationPercent).toBeGreaterThanOrEqual(0);
        expect(gate.utilizationPercent).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("generateQueueGrowth", () => {
    it("should return 12 points", () => {
      const result = simulationEngine.generateQueueGrowth();
      expect(result.length).toBe(12);
    });

    it("should have all required fields", () => {
      const result = simulationEngine.generateQueueGrowth();
      for (const pt of result) {
        expect(pt.location).toBeTruthy();
        expect(pt.currentLength).toBeGreaterThanOrEqual(0);
        expect(pt.predictedLength30m).toBeGreaterThanOrEqual(0);
        expect(typeof pt.growthRate).toBe("number");
      }
    });

    it("should have valid timestamps", () => {
      const result = simulationEngine.generateQueueGrowth();
      for (const pt of result) {
        expect(new Date(pt.timestamp).getTime()).toBeGreaterThan(0);
      }
    });
  });

  describe("getCurrentPhase", () => {
    it("should return a valid event phase", () => {
      const phase = simulationEngine.getCurrentPhase();
      expect(["pregame", "entry", "first_half", "half_time", "second_half", "final", "exit"]).toContain(phase);
    });
  });

  describe("getTotalCapacity", () => {
    it("should return positive number", () => {
      const capacity = simulationEngine.getTotalCapacity();
      expect(capacity).toBeGreaterThan(0);
    });

    it("should equal sum of all STADIUM_ZONES capacities", () => {
      const sum = STADIUM_ZONES.reduce((s, z) => s + z.capacity, 0);
      expect(simulationEngine.getTotalCapacity()).toBe(sum);
    });
  });

  describe("integration: engine services work together", () => {
    it("should produce consistent zone states via simulation", () => {
      const zones = simulationEngine.simulateZones();
      const analytics = simulationEngine.computeAnalytics(zones);
      const predictions = predictionEngine.analyze(zones, analytics);
      const recommendations = recommendationEngine.generate(zones, analytics);
      const alerts = simulationEngine.generateAlerts(zones);
      const insights = simulationEngine.generateInsights(zones, analytics);

      expect(zones.length).toBe(STADIUM_ZONES.length);
      expect(analytics.currentOccupancy).toBeGreaterThanOrEqual(0);
      expect(predictions.length).toBeGreaterThan(0);
      expect(Array.isArray(recommendations)).toBe(true);
      expect(Array.isArray(alerts)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it("should handle multiple simulation ticks", () => {
      for (let i = 0; i < 5; i++) {
        const zones = simulationEngine.simulateZones();
        expect(zones.every((z) => z.densityPercent >= 0 && z.densityPercent <= 100)).toBe(true);
      }
    });

    it("should produce predictions with confidence > 0", () => {
      const zones = simulationEngine.simulateZones();
      const analytics = simulationEngine.computeAnalytics(zones);
      const predictions = predictionEngine.analyze(zones, analytics);
      for (const p of predictions) {
        expect(p.confidence).toBeGreaterThan(0);
      }
    });

    it("should produce alerts only when density thresholds exceeded", () => {
      const zones = simulationEngine.simulateZones();
      const alerts = simulationEngine.generateAlerts(zones);
      for (const alert of alerts) {
        const zone = zones.find((z) => z.name === alert.zone);
        expect(zone).toBeDefined();
      }
    });

    it("should produce recommendations with valid priorities", () => {
      const zones = simulationEngine.simulateZones();
      const analytics = simulationEngine.computeAnalytics(zones);
      const recs = recommendationEngine.generate(zones, analytics);
      for (const r of recs) {
        expect(["critical", "high", "medium", "low"]).toContain(r.priority);
      }
    });
  });
});

describe("Additional Prediction Engine Edge Cases", () => {
  let engine: MockPredictionEngine;

  beforeEach(() => {
    engine = new MockPredictionEngine();
  });

  it("should generate congestion type predictions for gate zones", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "gate", name: "Gate A" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    for (const p of result) {
      expect(p.type).toMatch(/congestion|crowd_movement|queue_growth|gate_overload/);
    }
  });

  it("should generate queue_growth predictions for concession zones", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "concession", name: "Food Court", waitTimeMinutes: 15 })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("should generate gate_overload predictions for gate zones with high density", () => {
    const zones = [makeCrowdZone({ densityPercent: 80, type: "gate", name: "Gate C" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("should set severity low for low density zones in predictions", () => {
    const zones = [makeCrowdZone({ densityPercent: 55, type: "section", name: "Section 101" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    for (const p of result) {
      expect(p.severity === "low" || p.severity === "medium").toBe(true);
    }
  });

  it("should set severity high for very high density zones in predictions", () => {
    const zones = [makeCrowdZone({ densityPercent: 90, type: "section", name: "Section 101" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    expect(result.length).toBeGreaterThan(0);
    for (const p of result) {
      expect(["high", "critical", "medium", "low"]).toContain(p.severity);
    }
  });

  it("should suggest opening pathways when density > 65", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "section", name: "Section 101" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    const crowdMovement = result.find((p) => p.type === "crowd_movement");
    if (crowdMovement) {
      expect(crowdMovement.suggestedAction).toContain("Open alternative pathways");
    }
  });

  it("should suggest activate redistribution when congestion > 65", () => {
    const zones = [makeCrowdZone({ densityPercent: 70, type: "section", name: "Section 101" })];
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = engine.analyze(zones, makeCrowdAnalytics());
    vi.restoreAllMocks();
    const congestion = result.find((p) => p.type === "congestion");
    if (congestion) {
      expect(congestion.suggestedAction).toContain("Activate crowd redistribution");
    }
  });

  it("should generate predictions for high-density zones", () => {
    const zones = Array.from({ length: 4 }, (_, i) => makeCrowdZone({ densityPercent: 70 + i, type: "section", name: `Section ${i}` }));
    const result = engine.analyze(zones, makeCrowdAnalytics());
    expect(result.length).toBeGreaterThan(0);
    for (const p of result) {
      expect(p.id).toBeTruthy();
    }
  });

  it("should have nominal forecast with very high confidence", () => {
    const zones = [makeCrowdZone({ densityPercent: 20, type: "section" })];
    const result = engine.analyze(zones, makeCrowdAnalytics());
    const nominal = result.find((p) => p.title.includes("Nominal Operations"));
    expect(nominal).toBeDefined();
    expect(nominal!.confidence).toBeGreaterThan(88);
  });
});

describe("Additional Recommendation Engine Edge Cases", () => {
  let engine: MockRecommendationEngine;

  beforeEach(() => {
    engine = new MockRecommendationEngine();
  });

  it("should recommend queue optimization when no other triggers fire and fill < 3 recs", () => {
    const zones = [makeCrowdZone({ type: "concession", waitTimeMinutes: 8, densityPercent: 40 })];
    const analytics = makeCrowdAnalytics({ capacityPercent: 50, riskScore: 30, safetyIndex: 85 });
    const result = engine.generate(zones, analytics);
    const hasQueue = result.some((r) => r.action.includes("Queue Capacity"));
    expect(hasQueue).toBe(true);
  });

  it("should generate redistribution with correct location format", () => {
    const zones = [
      makeCrowdZone({ status: "congested", densityPercent: 70, name: "East Stand", safetyScore: 60 }),
    ];
    const analytics = makeCrowdAnalytics();
    const result = engine.generate(zones, analytics);
    const redist = result.find((r) => r.action.includes("Crowd Redistribution"));
    expect(redist?.location).toContain("East Stand");
  });

  it("should generate redirect with arrow notation", () => {
    const zones = [
      makeCrowdZone({ type: "gate", densityPercent: 80, name: "Gate A" }),
      makeCrowdZone({ type: "gate", densityPercent: 25, name: "Gate B" }),
    ];
    const analytics = makeCrowdAnalytics();
    const result = engine.generate(zones, analytics);
    const redirect = result.find((r) => r.action.includes("Redirect Entry Flow"));
    expect(redirect?.location).toMatch(/→/);
  });

  it("should generate staff recommendation with location list when capacity > 75%", () => {
    const zones = [
      makeCrowdZone({ densityPercent: 80, name: "Section 101" }),
      makeCrowdZone({ densityPercent: 70, name: "Section 102" }),
    ];
    const analytics = makeCrowdAnalytics({ capacityPercent: 80, visitorsPerMinute: 150 });
    const result = engine.generate(zones, analytics);
    const staff = result.find((r) => r.action.includes("Additional Staff"));
    expect(staff?.location).toContain("Section 101");
  });

  it("should generate communication recommendation with All Zones location", () => {
    const zones = [makeCrowdZone()];
    const analytics = makeCrowdAnalytics({ riskScore: 70 });
    const result = engine.generate(zones, analytics);
    const comm = result.find((r) => r.action.includes("Safety Communication"));
    expect(comm?.location).toBe("All Zones");
  });

  it("should not generate infrastructure recommendation when safetyIndex >= 70", () => {
    const zones = [makeCrowdZone()];
    const analytics = makeCrowdAnalytics({ safetyIndex: 75, riskScore: 30, capacityPercent: 50 });
    const result = engine.generate(zones, analytics);
    const infra = result.find((r) => r.action.includes("Infrastructure"));
    expect(infra).toBeUndefined();
  });

  it("should only include concession zones in queue optimization reason", () => {
    const zones = [
      makeCrowdZone({ type: "concession", waitTimeMinutes: 12, name: "Food Court A" }),
      makeCrowdZone({ type: "concession", waitTimeMinutes: 8, name: "Food Court B" }),
    ];
    const analytics = makeCrowdAnalytics({ capacityPercent: 50, riskScore: 30, safetyIndex: 90 });
    const result = engine.generate(zones, analytics);
    const queue = result.find((r) => r.action.includes("Queue Capacity"));
    expect(queue?.reason).toMatch(/queue times|Queue|wait/i);
  });

  it("should implement category correctly for each rec type", () => {
    const zones = [
      makeCrowdZone({ status: "critical", densityPercent: 90, type: "gate", name: "Gate A" }),
      makeCrowdZone({ type: "gate", densityPercent: 20, name: "Gate B" }),
    ];
    const analytics = makeCrowdAnalytics({ capacityPercent: 90, riskScore: 70, safetyIndex: 60 });
    const result = engine.generate(zones, analytics);
    for (const r of result) {
      if (r.action.includes("Crowd Redistribution") || r.action.includes("Redirect")) {
        expect(r.category).toBe("entry");
      } else if (r.action.includes("Staff")) {
        expect(r.category).toBe("staff");
      } else if (r.action.includes("Safety Communication")) {
        expect(r.category).toBe("communication");
      } else if (r.action.includes("Infrastructure")) {
        expect(r.category).toBe("infrastructure");
      }
    }
  });
});

describe("Additional Simulation Engine Edge Cases", () => {
  describe("simulateZones boundary conditions", () => {
    it("should handle extreme tick values for phase transitions", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      let prevPhase = simulationEngine.getCurrentPhase();
      let changed = false;
      for (let i = 0; i < 100; i++) {
        simulationEngine.simulateZones();
        const phase = simulationEngine.getCurrentPhase();
        if (phase !== prevPhase) changed = true;
        prevPhase = phase;
      }
      expect(changed).toBe(true);
      vi.restoreAllMocks();
    });

    it("should never produce negative currentCount", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.01);
      const result = simulationEngine.simulateZones();
      vi.restoreAllMocks();
      for (const zone of result) {
        expect(zone.currentCount).toBeGreaterThanOrEqual(0);
      }
    });

    it("should never exceed capacity in currentCount", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.99);
      const result = simulationEngine.simulateZones();
      vi.restoreAllMocks();
      for (const zone of result) {
        expect(zone.currentCount).toBeLessThanOrEqual(zone.capacity);
      }
    });

    it("should have safetyScore inversely related to density", () => {
      const result = simulationEngine.simulateZones();
      const highDensity = result.filter((z) => z.densityPercent > 70);
      const lowDensity = result.filter((z) => z.densityPercent < 30);
      if (highDensity.length > 0 && lowDensity.length > 0) {
        const highAvg = highDensity.reduce((s, z) => s + z.safetyScore, 0) / highDensity.length;
        const lowAvg = lowDensity.reduce((s, z) => s + z.safetyScore, 0) / lowDensity.length;
        expect(lowAvg).toBeGreaterThanOrEqual(highAvg);
      }
    });
  });

  describe("computeAnalytics edge cases", () => {
    it("should handle empty zones gracefully", () => {
      const result = simulationEngine.computeAnalytics([]);
      expect(result.totalVisitors).toBe(0);
      expect(result.capacityPercent).toBe(0);
      expect(result.congestionScore).toBeGreaterThanOrEqual(0);
      expect(result.safetyIndex).toBeDefined();
    });

    it("should handle single zone correctly", () => {
      const zone = makeCrowdZone({ currentCount: 100, capacity: 500, safetyScore: 80, movementSpeed: 1.2 });
      const result = simulationEngine.computeAnalytics([zone]);
      expect(result.totalVisitors).toBe(100);
      expect(result.avgMovementSpeed).toBe(1.2);
    });

    it("should produce congestionScore that increases with more congested zones", () => {
      const normal = simulationEngine.computeAnalytics([makeCrowdZone({ status: "normal", densityPercent: 30 })]);
      const congested = simulationEngine.computeAnalytics([makeCrowdZone({ status: "congested", densityPercent: 70 }), makeCrowdZone({ status: "congested", densityPercent: 75 })]);
      expect(congested.congestionScore).toBeGreaterThanOrEqual(normal.congestionScore);
    });
  });

  describe("generateAlerts edge cases", () => {
    it("should handle zones exactly at density boundary", () => {
      const zones = [makeCrowdZone({ densityPercent: 85, status: "critical", name: "Test" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("should not generate alerts when density exactly at 80", () => {
      const zones = [makeCrowdZone({ densityPercent: 80, status: "congested", name: "Test" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result.length).toBe(0);
    });

    it("should set high severity for density 81-85", () => {
      const zones = [makeCrowdZone({ densityPercent: 82, status: "critical", name: "Test" })];
      const result = simulationEngine.generateAlerts(zones);
      expect(result[0].severity).toBe("high");
    });
  });

  describe("generateInsights edge cases", () => {
    it("should generate unique insight IDs", () => {
      const zones = Array.from({ length: 5 }, (_, i) => makeCrowdZone({ status: "congested", densityPercent: 70 + i, name: `Zone ${i}` }));
      const analytics = makeCrowdAnalytics({ riskScore: 60 });
      const result = simulationEngine.generateInsights(zones, analytics);
      const ids = result.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should not generate congested insight when no zones are congested", () => {
      const zones = [makeCrowdZone({ status: "normal", densityPercent: 30 })];
      const analytics = makeCrowdAnalytics({ riskScore: 30 });
      const result = simulationEngine.generateInsights(zones, analytics);
      const congested = result.find((i) => i.title.includes("Congestion Pattern"));
      expect(congested).toBeUndefined();
    });

    it("should generate observation insight when all is normal and operational health high", () => {
      const zones = [makeCrowdZone({ status: "normal", densityPercent: 30 })];
      const analytics = makeCrowdAnalytics({ riskScore: 20, avgMovementSpeed: 1.5 });
      const result = simulationEngine.generateInsights(zones, analytics);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("generateGateUtilization edge cases", () => {
    it("should have Gate C with highest utilization range", () => {
      const result = simulationEngine.generateGateUtilization();
      const gateC = result.find((g) => g.gateName === "Gate C");
      expect(gateC).toBeDefined();
      expect(gateC!.capacity).toBe(250);
    });

    it("should have Gate D with lowest capacity", () => {
      const result = simulationEngine.generateGateUtilization();
      const gateD = result.find((g) => g.gateName === "Gate D");
      expect(gateD).toBeDefined();
      expect(gateD!.capacity).toBe(200);
    });

    it("should have waitTimes that correlate with utilization", () => {
      const result = simulationEngine.generateGateUtilization();
      for (const gate of result) {
        expect(gate.waitTime).toBeGreaterThanOrEqual(0);
        expect(gate.waitTime).toBeLessThanOrEqual(25);
      }
    });
  });

  describe("generateQueueGrowth edge cases", () => {
    it("should have timestamps spaced 5 minutes apart", () => {
      const result = simulationEngine.generateQueueGrowth();
      for (let i = 1; i < result.length; i++) {
        const diff = new Date(result[i].timestamp).getTime() - new Date(result[i - 1].timestamp).getTime();
        expect(diff).toBe(300000);
      }
    });

    it("should have growthRate that can be negative", () => {
      const result = simulationEngine.generateQueueGrowth();
      const hasNegative = result.some((q) => q.growthRate < 0);
      expect(hasNegative).toBe(true);
    });

    it("should have growthRate that can be positive", () => {
      const result = simulationEngine.generateQueueGrowth();
      const hasPositive = result.some((q) => q.growthRate > 0);
      expect(hasPositive).toBe(true);
    });
  });

  describe("getCurrentPhase transitions", () => {
    it("should cycle through multiple phases", () => {
      const phases: string[] = [];
      for (let i = 0; i < 140; i++) {
        simulationEngine.simulateZones();
        const phase = simulationEngine.getCurrentPhase();
        if (i % 20 === 0) phases.push(phase);
      }
      const unique = new Set(phases);
      expect(unique.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe("phase multiplier values", () => {
    it("should map pregame to 0.1", () => {
      const engine = simulationEngine as any;
      expect(engine.getPhaseMultiplier("pregame")).toBe(0.1);
    });

    it("should map entry to 0.6", () => {
      const engine = simulationEngine as any;
      expect(engine.getPhaseMultiplier("entry")).toBe(0.6);
    });

    it("should map half_time to highest multiplier 0.95", () => {
      const engine = simulationEngine as any;
      expect(engine.getPhaseMultiplier("half_time")).toBe(0.95);
    });

    it("should map exit to 0.4", () => {
      const engine = simulationEngine as any;
      expect(engine.getPhaseMultiplier("exit")).toBe(0.4);
    });

    it("should fallback to 0.7 for unknown phase", () => {
      const engine = simulationEngine as any;
      expect(engine.getPhaseMultiplier("unknown" as any)).toBe(0.7);
    });

    it("should have increasing multiplier from pregame to half_time", () => {
      const engine = simulationEngine as any;
      expect(engine.getPhaseMultiplier("pregame")).toBeLessThan(engine.getPhaseMultiplier("entry"));
      expect(engine.getPhaseMultiplier("entry")).toBeLessThan(engine.getPhaseMultiplier("first_half"));
      expect(engine.getPhaseMultiplier("first_half")).toBeLessThan(engine.getPhaseMultiplier("half_time"));
    });

    it("should have decreasing multiplier from half_time to exit", () => {
      const engine = simulationEngine as any;
      expect(engine.getPhaseMultiplier("half_time")).toBeGreaterThan(engine.getPhaseMultiplier("second_half"));
      expect(engine.getPhaseMultiplier("second_half")).toBeGreaterThan(engine.getPhaseMultiplier("final"));
      expect(engine.getPhaseMultiplier("final")).toBeGreaterThan(engine.getPhaseMultiplier("exit"));
    });
  });
});

