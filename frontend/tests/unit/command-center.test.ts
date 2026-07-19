import { describe, it, expect, vi } from "vitest";
import { commandCenterService } from "@/features/command-center/services/command-center-service";
import type { CommandCenterData, AIProviderStatus, AIRecommendation, KPIMetric, ActivityEvent, Incident, ChartDataPoint } from "@/features/command-center/types";
import { MODULES, MODULE_CATEGORIES, SIDEBAR_ITEMS } from "@/constants/modules";
import { buildSuccessResponse, buildErrorResponse, isApiError } from "@/lib/response-wrapper";
import { createLogger, logger } from "@/lib/logger";
import { cn, formatDate, formatDateTime, formatTime, formatNumber, formatPercentage, truncate, debounce, generateId, pluralize, clamp } from "@/lib/utils";

describe("CommandCenterService", () => {
  it("getData should return CommandCenterData with all sections", async () => {
    const data = await commandCenterService.getData();
    expect(data).toHaveProperty("stadium");
    expect(data).toHaveProperty("tournament");
    expect(data).toHaveProperty("match");
    expect(data).toHaveProperty("hero");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("kpis");
    expect(data).toHaveProperty("recommendations");
    expect(data).toHaveProperty("incidents");
    expect(data).toHaveProperty("activityFeed");
    expect(data).toHaveProperty("attendanceTimeline");
    expect(data).toHaveProperty("crowdDensityTrend");
    expect(data).toHaveProperty("parkingOccupancy");
    expect(data).toHaveProperty("queueForecast");
    expect(data).toHaveProperty("incidentTimeline");
    expect(data).toHaveProperty("energyUsage");
    expect(data).toHaveProperty("revenueTrend");
  });

  it("stadium info should be correct", async () => {
    const data = await commandCenterService.getData();
    expect(data.stadium.name).toBe("Lusail Iconic Stadium");
    expect(data.stadium.capacity).toBe(75000);
    expect(data.stadium.location).toBe("Lusail, Qatar");
  });

  it("tournament should be FIFA World Cup 2026", async () => {
    const data = await commandCenterService.getData();
    expect(data.tournament.name).toBe("FIFA World Cup 2026");
  });

  it("match should have valid status", async () => {
    const data = await commandCenterService.getData();
    expect(["pregame", "first_half", "half_time", "second_half", "final"]).toContain(data.match.status);
  });

  it("match should have home and away teams", async () => {
    const data = await commandCenterService.getData();
    expect(data.match.homeTeam).toBeTruthy();
    expect(data.match.awayTeam).toBeTruthy();
  });

  it("match minute should be between 5 and 90", async () => {
    const data = await commandCenterService.getData();
    expect(data.match.minute).toBeGreaterThanOrEqual(5);
    expect(data.match.minute).toBeLessThanOrEqual(90);
  });

  it("attendance should be between 25000 and 72000", async () => {
    const data = await commandCenterService.getData();
    expect(data.hero.attendance).toBeGreaterThanOrEqual(25000);
    expect(data.hero.attendance).toBeLessThanOrEqual(72000);
  });

  it("capacityPercent should be derived from attendance", async () => {
    const data = await commandCenterService.getData();
    const expected = parseFloat(((data.hero.attendance / data.hero.capacity) * 100).toFixed(1));
    expect(data.hero.capacityPercent).toBe(expected);
  });

  it("weather should have condition, temperature, icon", async () => {
    const data = await commandCenterService.getData();
    expect(data.hero.weather).toHaveProperty("condition");
    expect(data.hero.weather).toHaveProperty("temperature");
    expect(data.hero.weather).toHaveProperty("icon");
    expect(data.hero.weather.temperature).toBeGreaterThanOrEqual(26);
    expect(data.hero.weather.temperature).toBeLessThanOrEqual(38);
  });

  it("aiHealthScore should be 92-100", async () => {
    const data = await commandCenterService.getData();
    expect(data.hero.aiHealthScore).toBeGreaterThanOrEqual(92);
    expect(data.hero.aiHealthScore).toBeLessThanOrEqual(100);
  });

  it("kpis should have 9 entries", async () => {
    const data = await commandCenterService.getData();
    expect(data.kpis).toHaveLength(9);
  });

  it("kpis should include all expected IDs", async () => {
    const data = await commandCenterService.getData();
    const ids = data.kpis.map((k) => k.id);
    expect(ids).toContain("total-visitors");
    expect(ids).toContain("crowd-density");
    expect(ids).toContain("emergency-alerts");
    expect(ids).toContain("parking-usage");
    expect(ids).toContain("avg-queue-time");
    expect(ids).toContain("staff-availability");
    expect(ids).toContain("energy-consumption");
    expect(ids).toContain("revenue");
    expect(ids).toContain("fan-satisfaction");
  });

  it("kpi values should be in expected ranges", async () => {
    const data = await commandCenterService.getData();
    for (const kpi of data.kpis) {
      expect(typeof kpi.value).toBe("number");
      expect(kpi.trend).toBeInstanceOf(Array);
      expect(kpi).toHaveProperty("changeType");
      expect(["increase", "decrease", "neutral"]).toContain(kpi.changeType);
    }
  });

  it("recommendations should have 6 entries", async () => {
    const data = await commandCenterService.getData();
    expect(data.recommendations).toHaveLength(6);
  });

  it("recommendations should have valid structure", async () => {
    const data = await commandCenterService.getData();
    for (const rec of data.recommendations) {
      expect(rec).toHaveProperty("id");
      expect(rec).toHaveProperty("action");
      expect(rec).toHaveProperty("reason");
      expect(rec).toHaveProperty("confidence");
      expect(rec).toHaveProperty("priority");
      expect(rec).toHaveProperty("category");
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(100);
    }
  });

  it("recommendations should cover all categories", async () => {
    const data = await commandCenterService.getData();
    const cats = data.recommendations.map((r) => r.category);
    expect(cats).toContain("crowd");
    expect(cats).toContain("security");
    expect(cats).toContain("parking");
    expect(cats).toContain("staff");
    expect(cats).toContain("operations");
  });

  it("incidents should be sorted by severity (critical first)", async () => {
    const data = await commandCenterService.getData();
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    for (let i = 1; i < data.incidents.length; i++) {
      expect(order[data.incidents[i].severity]).toBeGreaterThanOrEqual(order[data.incidents[i - 1].severity]);
    }
  });

  it("incidents should have valid statuses", async () => {
    const data = await commandCenterService.getData();
    for (const inc of data.incidents) {
      expect(["open", "dispatched", "resolved", "monitoring"]).toContain(inc.status);
    }
  });

  it("activityFeed should have 12 events", async () => {
    const data = await commandCenterService.getData();
    expect(data.activityFeed).toHaveLength(12);
  });

  it("activityFeed should be sorted by timestamp descending", async () => {
    const data = await commandCenterService.getData();
    for (let i = 1; i < data.activityFeed.length; i++) {
      expect(new Date(data.activityFeed[i].timestamp).getTime())
        .toBeLessThanOrEqual(new Date(data.activityFeed[i - 1].timestamp).getTime());
    }
  });

  it("activityFeed events should have valid types", async () => {
    const data = await commandCenterService.getData();
    for (const evt of data.activityFeed) {
      expect(["alert", "action", "system", "ai"]).toContain(evt.type);
    }
  });

  it("timelines should have 24 data points each", async () => {
    const data = await commandCenterService.getData();
    expect(data.attendanceTimeline).toHaveLength(24);
    expect(data.crowdDensityTrend).toHaveLength(24);
    expect(data.parkingOccupancy).toHaveLength(24);
    expect(data.queueForecast).toHaveLength(24);
    expect(data.incidentTimeline).toHaveLength(24);
    expect(data.energyUsage).toHaveLength(24);
    expect(data.revenueTrend).toHaveLength(24);
  });

  it("timeline points should have timestamp and value", async () => {
    const data = await commandCenterService.getData();
    for (const point of data.attendanceTimeline) {
      expect(point).toHaveProperty("timestamp");
      expect(point).toHaveProperty("value");
    }
  });

  it("summary should have generatedAt", async () => {
    const data = await commandCenterService.getData();
    expect(data.summary).toHaveProperty("generatedAt");
    expect(data.summary).toHaveProperty("summary");
    expect(data.summary).toHaveProperty("highlights");
  });

  it("summary highlights should have correct types", async () => {
    const data = await commandCenterService.getData();
    for (const h of data.summary.highlights) {
      expect(["positive", "warning", "critical", "info"]).toContain(h.type);
    }
  });

  it("getAIProviderStatus should return valid status", async () => {
    const status = await commandCenterService.getAIProviderStatus();
    expect(["operational", "degraded", "down"]).toContain(status);
  });

  it("getActivityUpdates should return 1-3 events", async () => {
    const updates = await commandCenterService.getActivityUpdates();
    expect(updates.length).toBeGreaterThanOrEqual(1);
    expect(updates.length).toBeLessThanOrEqual(3);
  });

  it("getActivityUpdates events should have id and timestamp", async () => {
    const updates = await commandCenterService.getActivityUpdates();
    for (const u of updates) {
      expect(u).toHaveProperty("id");
      expect(u).toHaveProperty("timestamp");
      expect(u).toHaveProperty("message");
    }
  });

  it("data should have riskLevel based on alerts", async () => {
    const data = await commandCenterService.getData();
    expect(["low", "medium", "high"]).toContain(data.hero.riskLevel);
  });
});

describe("Response Wrapper", () => {
  it("buildSuccessResponse should return ApiResponse with success:true", () => {
    const res = buildSuccessResponse({ id: 1, name: "test" }, "Created");
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: 1, name: "test" });
    expect(res.message).toBe("Created");
  });

  it("buildSuccessResponse should include pagination", () => {
    const pagination = { page: 1, pageSize: 10, total: 100, totalPages: 10, hasNext: true, hasPrevious: false };
    const res = buildSuccessResponse([], "OK", "corr-1", pagination);
    expect(res.pagination).toEqual(pagination);
    expect(res.correlationId).toBe("corr-1");
  });

  it("buildSuccessResponse should have timestamp", () => {
    const res = buildSuccessResponse(null);
    expect(res.timestamp).toBeTruthy();
    expect(() => new Date(res.timestamp)).not.toThrow();
  });

  it("buildErrorResponse should return ApiError with success:false", () => {
    const err = buildErrorResponse("NOT_FOUND", "Resource not found", 404);
    expect(err.success).toBe(false);
    expect(err.error).toBe("NOT_FOUND");
    expect(err.message).toBe("Resource not found");
    expect(err.statusCode).toBe(404);
  });

  it("buildErrorResponse should include details", () => {
    const details = { name: ["Name is required"], email: ["Invalid email"] };
    const err = buildErrorResponse("VALIDATION", "Validation failed", 422, "corr-2", details);
    expect(err.details).toEqual(details);
    expect(err.correlationId).toBe("corr-2");
  });

  it("buildErrorResponse should have timestamp", () => {
    const err = buildErrorResponse("ERR", "msg", 500);
    expect(err.timestamp).toBeTruthy();
    expect(() => new Date(err.timestamp)).not.toThrow();
  });

  it("isApiError should return true for error response", () => {
    const err = buildErrorResponse("ERR", "msg", 500);
    expect(isApiError(err)).toBe(true);
  });

  it("isApiError should return false for success response", () => {
    const res = buildSuccessResponse([]);
    expect(isApiError(res)).toBe(false);
  });
});

describe("Logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create logger with module name", () => {
    const log = createLogger("test-module");
    log.info("test message");
    expect(console.info).toHaveBeenCalled();
  });

  it("debug should call console.debug", () => {
    process.env.NEXT_PUBLIC_LOG_LEVEL = "debug";
    const log = createLogger("test");
    log.debug("debug msg");
    expect(console.debug).toHaveBeenCalled();
    delete process.env.NEXT_PUBLIC_LOG_LEVEL;
  });

  it("warn should call console.warn", () => {
    const log = createLogger("test");
    log.warn("warn msg");
    expect(console.warn).toHaveBeenCalled();
  });

  it("error should call console.error", () => {
    const log = createLogger("test");
    log.error("error msg");
    expect(console.error).toHaveBeenCalled();
  });

  it("child should create nested logger", () => {
    const parent = createLogger("parent");
    const child = parent.child("child");
    child.info("test");
    expect(console.info).toHaveBeenCalled();
  });

  it("logger should handle data parameter", () => {
    const log = createLogger("test");
    log.info("with data", { key: "value" });
    expect(console.info).toHaveBeenCalled();
  });

  it("default logger should use module 'app'", () => {
    logger.info("test");
    expect(console.info).toHaveBeenCalled();
  });

  it("log entry should include module name in output", () => {
    const log = createLogger("my-module");
    log.info("hello");
    const call = (console.info as ReturnType<typeof vi.spyOn>).mock.calls[0];
    expect(call[0]).toContain("my-module");
  });
});

describe("Utils", () => {
  it("cn should merge class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("cn should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("formatDate should format date correctly", () => {
    const result = formatDate(new Date("2026-07-18"));
    expect(result).toContain("2026");
    expect(result).toContain("Jul");
  });

  it("formatDate should handle string input", () => {
    const result = formatDate("2026-07-18");
    expect(result).toContain("2026");
  });

  it("formatDateTime should include time", () => {
    const d = new Date("2026-07-18T14:30:00");
    const result = formatDateTime(d);
    expect(result).toContain("2026");
    expect(result).toContain("Jul");
  });

  it("formatTime should return time string", () => {
    const d = new Date("2026-07-18T14:30:00");
    const result = formatTime(d);
    expect(result).toContain("02");
    expect(result).toContain("30");
  });

  it("formatNumber should format with commas", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formatNumber should respect decimals", () => {
    expect(formatNumber(1234.567, 2)).toBe("1,234.57");
  });

  it("formatPercentage should convert to percent", () => {
    expect(formatPercentage(75.5)).toBe("75.5%");
  });

  it("formatPercentage should handle zero", () => {
    expect(formatPercentage(0)).toBe("0.0%");
  });

  it("truncate should shorten long text", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
  });

  it("truncate should not modify short text", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });

  it("truncate should handle empty string", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("debounce should delay execution", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("debounce should reset on repeated calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("generateId should return a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("pluralize should handle singular", () => {
    expect(pluralize(1, "item")).toBe("item");
  });

  it("pluralize should handle plural", () => {
    expect(pluralize(5, "item")).toBe("items");
  });

  it("pluralize should handle custom plural", () => {
    expect(pluralize(3, "child", "children")).toBe("children");
  });

  it("pluralize should handle zero", () => {
    expect(pluralize(0, "item")).toBe("items");
  });

  it("clamp should constrain values", () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it("clamp should handle edge values", () => {
    expect(clamp(0, 0, 100)).toBe(0);
    expect(clamp(100, 0, 100)).toBe(100);
  });
});

describe("Modules Constants", () => {
  it("MODULES should have 18 entries", () => {
    expect(MODULES).toHaveLength(18);
  });

  it("MODULES should include command-center", () => {
    const cc = MODULES.find((m) => m.id === "command-center");
    expect(cc).toBeDefined();
    expect(cc!.route).toBe("/command-center");
  });

  it("MODULES should have all categories", () => {
    const cats = MODULES.map((m) => m.category);
    expect(cats).toContain("operations");
    expect(cats).toContain("intelligence");
    expect(cats).toContain("safety");
    expect(cats).toContain("experience");
    expect(cats).toContain("analytics");
  });

  it("MODULES each entry should have required fields", () => {
    for (const m of MODULES) {
      expect(m).toHaveProperty("id");
      expect(m).toHaveProperty("name");
      expect(m).toHaveProperty("route");
      expect(m).toHaveProperty("status");
    }
  });

  it("MODULE_CATEGORIES should have 5 entries", () => {
    expect(MODULE_CATEGORIES).toHaveLength(5);
    const ids = MODULE_CATEGORIES.map((c) => c.id);
    expect(ids).toContain("operations");
    expect(ids).toContain("intelligence");
    expect(ids).toContain("safety");
    expect(ids).toContain("experience");
    expect(ids).toContain("analytics");
  });

  it("SIDEBAR_ITEMS should have entries with dividers", () => {
    const dividers = SIDEBAR_ITEMS.filter((item) => "type" in item && item.type === "divider");
    expect(dividers.length).toBeGreaterThanOrEqual(2);
  });

  it("SIDEBAR_ITEMS should include dashboard as first item", () => {
    const first = SIDEBAR_ITEMS[0];
    expect(first).toHaveProperty("id", "dashboard");
  });
});

describe("Command Center Types", () => {
  it("AIRecommendation should have required fields", () => {
    const rec: AIRecommendation = {
      id: "rec-1", action: "Test", location: "Loc", reason: "Why", expectedImpact: "Impact",
      confidence: 85, priority: "high", estimatedResolutionMinutes: 10, category: "crowd",
    };
    expect(rec.id).toBe("rec-1");
    expect(rec.priority).toBe("high");
    expect(rec.confidence).toBe(85);
  });

  it("KPIMetric should have changeType union", () => {
    const kpi: KPIMetric = {
      id: "k1", label: "Test", value: 100, unit: "%", change: 5,
      changeType: "increase", icon: "Test", trend: [1, 2, 3],
    };
    expect(["increase", "decrease", "neutral"]).toContain(kpi.changeType);
  });

  it("ActivityEvent should have type union", () => {
    const evt: ActivityEvent = {
      id: "e1", timestamp: new Date().toISOString(), message: "test",
      type: "system", module: "Security",
    };
    expect(["alert", "action", "system", "ai"]).toContain(evt.type);
  });

  it("Incident should have status union", () => {
    const inc: Incident = {
      id: "i1", time: "10:00", location: "Gate", type: "Security breach",
      severity: "medium", status: "open", assignedTeam: "Team",
      aiRecommendation: "Monitor", description: "Test incident",
    };
    expect(["open", "dispatched", "resolved", "monitoring"]).toContain(inc.status);
  });

  it("ChartDataPoint should have optional label", () => {
    const point: ChartDataPoint = { timestamp: new Date().toISOString(), value: 50 };
    expect(point.value).toBe(50);
    expect(point.label).toBeUndefined();
  });

  it("ChartDataPoint can have secondary value", () => {
    const point: ChartDataPoint = { timestamp: new Date().toISOString(), value: 50, secondary: 30 };
    expect(point.secondary).toBe(30);
  });

  it("CommandCenterData should be constructable", () => {
    const data: CommandCenterData = {
      stadium: { id: "s1", name: "Test", location: "Loc", capacity: 100 },
      tournament: { id: "t1", name: "T", matchDay: 1, totalMatchDays: 5 },
      match: { homeTeam: "A", awayTeam: "B", homeScore: 0, awayScore: 0, minute: 0, status: "pregame", startTime: "" },
      hero: { attendance: 0, capacity: 100, capacityPercent: 0, weather: { condition: "Clear", temperature: 25, icon: "sun" }, riskLevel: "low", aiHealthScore: 95 },
      summary: { summary: "", highlights: [], generatedAt: "" },
      kpis: [], recommendations: [], incidents: [], activityFeed: [],
      attendanceTimeline: [], crowdDensityTrend: [], parkingOccupancy: [],
      queueForecast: [], incidentTimeline: [], energyUsage: [], revenueTrend: [],
    };
    expect(data.stadium.capacity).toBe(100);
  });
});
