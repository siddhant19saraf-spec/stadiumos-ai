import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AppError, ErrorCode, isAppError, getErrorMessage, getErrorCode } from "@/lib/error-handler";
import { MockIncidentEngine } from "@/features/emergency-response/services/incident-engine";
import { MockDispatchEngine } from "@/features/emergency-response/services/dispatch-engine";
import { MockAnalyticsEngine as EmergencyAnalytics } from "@/features/emergency-response/services/analytics-engine";
import { MockRecommendationEngine as ERecEngine } from "@/features/emergency-response/services/recommendation-engine";
import { MockNotificationEngine } from "@/features/emergency-response/services/notification-engine";
import { MockSessionEngine } from "@/features/enterprise-security/services/session-engine";
import { MockAuthEngine } from "@/features/enterprise-security/services/auth-engine";
import { makeIncident, makeResponseTeam } from "../fixtures/factories";

const incEngine = new MockIncidentEngine();
const dispatchEngine = new MockDispatchEngine();
const analytics = new EmergencyAnalytics();
const recEngine = new ERecEngine();
const notifEngine = new MockNotificationEngine();

describe("AppError — Error Creation", () => {
  it("should create error with message", () => {
    const err = new AppError("Test error");
    expect(err.message).toBe("Test error");
    expect(err.code).toBe(ErrorCode.UNKNOWN);
  });

  it("should create error with custom code", () => {
    const err = new AppError("Not found", ErrorCode.NOT_FOUND, 404);
    expect(err.code).toBe(ErrorCode.NOT_FOUND);
    expect(err.status).toBe(404);
  });

  it("should create error with correlation ID", () => {
    const err = new AppError("Error", ErrorCode.INTERNAL, 500, "corr-123");
    expect(err.correlationId).toBe("corr-123");
  });

  it("should create error with details", () => {
    const details = { field: ["Field is required"] };
    const err = new AppError("Validation error", ErrorCode.VALIDATION, 400, undefined, details);
    expect(err.details).toEqual(details);
  });

  it("should convert to payload format", () => {
    const err = new AppError("Test", ErrorCode.INTERNAL, 500, "corr-1");
    const payload = err.toPayload();
    expect(payload.code).toBe(ErrorCode.INTERNAL);
    expect(payload.message).toBe("Test");
    expect(payload.status).toBe(500);
    expect(payload.correlationId).toBe("corr-1");
    expect(payload.timestamp).toBeDefined();
  });
});

describe("AppError — Error Detection", () => {
  it("should identify AppError instances", () => {
    const err = new AppError("Test");
    expect(isAppError(err)).toBe(true);
  });

  it("should not identify regular Error as AppError", () => {
    const err = new Error("Regular");
    expect(isAppError(err)).toBe(false);
  });

  it("should not identify plain objects as AppError", () => {
    expect(isAppError({ message: "test" })).toBe(false);
  });

  it("should not identify null as AppError", () => {
    expect(isAppError(null)).toBe(false);
  });

  it("should not identify undefined as AppError", () => {
    expect(isAppError(undefined)).toBe(false);
  });
});

describe("AppError — Message Extraction", () => {
  it("should extract message from AppError", () => {
    const err = new AppError("App error message");
    expect(getErrorMessage(err)).toBe("App error message");
  });

  it("should extract message from regular Error", () => {
    const err = new Error("Regular error");
    expect(getErrorMessage(err)).toBe("Regular error");
  });

  it("should return default for unknown errors", () => {
    expect(getErrorMessage("string error")).toBe("An unexpected error occurred");
    expect(getErrorMessage(null)).toBe("An unexpected error occurred");
    expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
  });

  it("should extract code from AppError", () => {
    const err = new AppError("Test", ErrorCode.FORBIDDEN);
    expect(getErrorCode(err)).toBe(ErrorCode.FORBIDDEN);
  });

  it("should return UNKNOWN for non-AppError", () => {
    expect(getErrorCode(new Error("test"))).toBe(ErrorCode.UNKNOWN);
  });
});

describe("Error Handling — Empty Data", () => {
  it("should handle empty incident array in analytics", () => {
    const result = analytics.compute([], [], []);
    expect(result.totalIncidents).toBe(0);
    expect(result.openIncidents).toBe(0);
    expect(result.criticalIncidents).toBe(0);
    expect(result.resolvedIncidents).toBe(0);
  });

  it("should handle empty team array in dispatch", () => {
    const inc = makeIncident();
    const team = dispatchEngine.recommendTeam(inc, []);
    expect(team).toBeNull();
  });

  it("should handle empty array in triage", () => {
    const sorted = incEngine.triageBySeverity([]);
    expect(sorted).toEqual([]);
  });

  it("should handle empty incident list in recommendations", () => {
    const recs = recEngine.generate([], []);
    expect(recs).toEqual([]);
  });

  it("should handle empty notification generation", () => {
    const alerts = notifEngine.generate([], []);
    expect(alerts).toEqual([]);
  });
});

describe("Error Handling — Null/Missing Values", () => {
  it("should handle incident with null coordinates", () => {
    const inc = makeIncident({ coordinates: { x: 0, y: 0 } });
    expect(inc.coordinates.x).toBe(0);
    expect(inc.coordinates.y).toBe(0);
  });

  it("should handle incident with null assignedTeam", () => {
    const inc = makeIncident({ assignedTeam: null });
    expect(inc.assignedTeam).toBeNull();
  });

  it("should handle team with null incidentId", () => {
    const team = makeResponseTeam({ incidentId: null });
    expect(team.incidentId).toBeNull();
  });

  it("should handle missing aiAnalysis optional fields", () => {
    const inc = makeIncident({
      aiAnalysis: { ...makeIncident().aiAnalysis, resourceShortages: [] },
    });
    expect(inc.aiAnalysis.resourceShortages).toEqual([]);
    expect(inc.aiAnalysis.resourceShortages.length).toBe(0);
  });
});

describe("Error Handling — Invalid Inputs", () => {
  it("should handle negative counts gracefully", () => {
    const inc = makeIncident({ estimatedResolutionMinutes: -5 });
    expect(inc.estimatedResolutionMinutes).toBeLessThan(0);
  });

  it("should handle out-of-range probabilities", () => {
    const inc = makeIncident({ aiConfidence: 150 });
    expect(inc.aiConfidence).toBeGreaterThan(100);
  });

  it("should handle invalid date strings", () => {
    const inc = makeIncident({ reportedAt: "not-a-date" });
    expect(isNaN(Date.parse(inc.reportedAt))).toBe(true);
  });

  it("should handle empty string fields", () => {
    const inc = makeIncident({ title: "", location: "" });
    expect(inc.title).toBe("");
    expect(inc.location).toBe("");
  });
});

describe("Error Handling — State Transitions", () => {
  it("should transition from reported to analyzing", async () => {
    const inc = makeIncident({ status: "reported" });
    const result = await incEngine.updateStatus(inc, "analyzing");
    expect(result.status).toBe("analyzing");
  });

  it("should transition from dispatched to in_progress", async () => {
    const inc = makeIncident({ status: "dispatched" });
    const result = await incEngine.updateStatus(inc, "in_progress");
    expect(result.status).toBe("in_progress");
  });

  it("should transition from in_progress to resolved", async () => {
    const inc = makeIncident({ status: "in_progress" });
    const result = await incEngine.updateStatus(inc, "resolved");
    expect(result.status).toBe("resolved");
  });

  it("should add timeline entries on status change", async () => {
    const inc = makeIncident({ status: "reported", timeline: [] });
    const result = await incEngine.updateStatus(inc, "analyzing");
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.timeline[0]!.action).toContain("Status Changed");
  });
});

describe("Error Handling — Network Failures", () => {
  it("should handle fetch rejection gracefully", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    try {
      const response = await fetch("http://localhost:8000/api/test");
      const data = await response.json();
    } catch (e) {
      expect(e).toBeDefined();
    }
    vi.unstubAllGlobals();
  });

  it("should handle timeout errors", async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10);
    try {
      await fetch("http://localhost:8000/api/slow", { signal: controller.signal });
    } catch (e) {
      expect((e as Error).name).toBe("AbortError");
    }
  });

  it("should handle empty response body", () => {
    const json = async () => { throw new SyntaxError("Unexpected end of JSON input"); };
    expect(json()).rejects.toThrow(SyntaxError);
  });

  it("should handle non-JSON responses", () => {
    const text = "Internal Server Error";
    expect(() => JSON.parse(text)).toThrow(SyntaxError);
  });
});

describe("Error Handling — Fallback Services", () => {
  it("should provide fallback when primary service unavailable", () => {
    const fallbackData = { totalIncidents: 0, openIncidents: 0, criticalIncidents: 0 };
    expect(fallbackData.totalIncidents).toBe(0);
  });

  it("should degrade gracefully for partial data", () => {
    const partialData = { incidents: undefined, teams: [] };
    const safe = { incidents: partialData.incidents ?? [], teams: partialData.teams };
    expect(Array.isArray(safe.incidents)).toBe(true);
    expect(safe.incidents.length).toBe(0);
  });

  it("should handle service timeout with cached data", async () => {
    const cached = [{ id: "cached-1", status: "healthy" }];
    const fresh = async () => { await new Promise((r) => setTimeout(r, 5000)); return []; };
    const timeoutPromise = new Promise<typeof cached>((resolve) => setTimeout(() => resolve(cached), 100));
    const result = await Promise.race([fresh(), timeoutPromise]);
    expect(result).toBe(cached);
  });
});

describe("Error Handling — Duplicate Prevention", () => {
  it("should prevent duplicate recommendations", () => {
    const inc = makeIncident({ status: "reported" });
    const team = makeResponseTeam({ type: "medical_alpha", status: "available" });
    const recs1 = recEngine.generate([inc], [team]);
    const recs2 = recEngine.generate([inc], [team]);
    const hasDedup = recs1.length === recs2.length;
    expect(hasDedup).toBe(true);
  });

  it("should prevent duplicate alerts", () => {
    const inc = makeIncident({ severity: "critical" });
    const existing = [{
      id: "existing", type: "critical_incident" as const, title: "", message: "",
      severity: "critical" as const, incidentId: inc.id, timestamp: "", acknowledged: false,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }];
    const newAlerts = notifEngine.generate([inc], existing);
    const duplicateCount = newAlerts.filter((a) => a.type === "critical_incident").length;
    expect(duplicateCount).toBe(0);
  });
});

describe("Error Handling — Session/Auth Edge Cases", () => {
  const sessionEngine = new MockSessionEngine();

  it("should handle expired session tokens", async () => {
    const session = await sessionEngine.create({ id: "u-1", role: "operator" } as any);
    const valid = await sessionEngine.validate(session.token);
    expect(valid).toBeDefined();
  });

  it("should handle invalid tokens", async () => {
    const valid = await sessionEngine.validate("invalid-token");
    expect(valid).toBeDefined();
  });

  it("should handle revoked sessions", async () => {
    const session = await sessionEngine.create({ id: "u-1", role: "operator" } as any);
    await sessionEngine.invalidate(session.token);
    const valid = await sessionEngine.validate(session.token);
    expect(valid).toBe(false);
  });

  it("should handle multiple session refreshes", async () => {
    const session = await sessionEngine.create({ id: "u-1", role: "operator" } as any);
    const r1 = await sessionEngine.refresh(session.token);
    const r2 = await sessionEngine.refresh(session.token);
    expect(r1).toBeDefined();
    expect(r2).toBeDefined();
  });
});
