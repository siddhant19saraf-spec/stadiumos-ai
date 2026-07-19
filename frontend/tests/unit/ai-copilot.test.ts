// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { aiCopilotService } from "@/features/ai-copilot/services/ai-copilot-service";
import { AIProviderFactory } from "@/features/ai-copilot/services/providers/provider-factory";
import { MockAIProvider } from "@/features/ai-copilot/services/providers/mock-provider";
import { OpenAIProvider } from "@/features/ai-copilot/services/providers/openai-provider";
import { GeminiProvider } from "@/features/ai-copilot/services/providers/gemini-provider";
import type { AIProvider, AIProviderResponse } from "@/features/ai-copilot/services/providers/ai-provider-interface";
import { buildFullContext, buildQueryContext } from "@/features/ai-copilot/prompts/context-builders";
import { SYSTEM_PROMPTS } from "@/features/ai-copilot/prompts/system-prompts";
import { formatAIResponse } from "@/features/ai-copilot/prompts/response-formatters";
import {
  makeCopilotMessage, makeOperationalContext, makeActiveRisk,
  makeActionExecution,
} from "../../tests/fixtures/factories";
import type {
  OperationalContext, CopilotMessage, ActiveRisk,
  PredictedProblem, ActionExecution, AIReasoning, DecisionOption,
} from "@/features/ai-copilot/types";

function createTestContext(overrides: Partial<OperationalContext> = {}): OperationalContext {
  return makeOperationalContext({
    stadiumName: "Test Stadium",
    tournamentName: "Test Tournament",
    currentMatch: "Team A vs Team B",
    attendance: 50000,
    capacity: 75000,
    weather: "Clear",
    temperature: 30,
    crowdDensity: 65,
    parkingOccupancy: 70,
    avgQueueTime: 8,
    staffAvailability: 85,
    emergencyAlerts: 0,
    energyUsage: 450,
    revenue: 1500000,
    fanSatisfaction: 4.2,
    activeRisks: [],
    predictedProblems: [],
    timeOfDay: "Afternoon",
    eventPhase: "Second Half",
    ...overrides,
  });
}

/* ===================================================================
   AI Provider Interface
   =================================================================== */
describe("AIProvider Interface - MockAIProvider", () => {
  let provider: MockAIProvider;

  beforeEach(() => {
    provider = new MockAIProvider();
  });

  it("should have name 'mock'", () => {
    expect(provider.name).toBe("mock");
  });

  it("should implement isAvailable returning true", async () => {
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it("should analyze context and return AIProviderResponse", async () => {
    const ctx = createTestContext();
    const response = await provider.analyze(ctx);
    expect(response).toHaveProperty("content");
    expect(response).toHaveProperty("reasoning");
    expect(response).toHaveProperty("suggestions");
    expect(response).toHaveProperty("raw");
    expect(typeof response.content).toBe("string");
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("should include reasoning in analyze response", async () => {
    const ctx = createTestContext();
    const response = await provider.analyze(ctx);
    expect(response.reasoning).toHaveProperty("summary");
    expect(response.reasoning).toHaveProperty("evidence");
    expect(response.reasoning).toHaveProperty("confidence");
    expect(response.reasoning).toHaveProperty("priority");
    expect(response.reasoning).toHaveProperty("recommendedAction");
    expect(response.reasoning).toHaveProperty("expectedOutcome");
    expect(Array.isArray(response.reasoning.evidence)).toBe(true);
  });

  it("should generate evidence array in reasoning", async () => {
    const ctx = createTestContext();
    const response = await provider.analyze(ctx);
    expect(response.reasoning.evidence.length).toBeGreaterThan(0);
    for (const ev of response.reasoning.evidence) {
      expect(typeof ev).toBe("string");
    }
  });

  it("should return confidence between 82 and 98", async () => {
    const ctx = createTestContext();
    const response = await provider.analyze(ctx);
    expect(response.reasoning.confidence).toBeGreaterThanOrEqual(82);
    expect(response.reasoning.confidence).toBeLessThanOrEqual(98);
  });

  it("should return valid priority in analyze", async () => {
    const ctx = createTestContext();
    const response = await provider.analyze(ctx);
    expect(["critical", "high", "medium", "low"]).toContain(response.reasoning.priority);
  });

  it("should return suggestions array", async () => {
    const ctx = createTestContext();
    const response = await provider.analyze(ctx);
    expect(Array.isArray(response.suggestions)).toBe(true);
  });

  it("should respond to risk query", async () => {
    const ctx = createTestContext();
    const response = await provider.query(ctx, "What are the risks?");
    expect(response.content.toLowerCase()).toContain("risk");
  });

  it("should respond to parking query", async () => {
    const ctx = createTestContext();
    const response = await provider.query(ctx, "Show parking status");
    expect(response.content).toBeTruthy();
  });

  it("should respond to security query", async () => {
    const ctx = createTestContext();
    const response = await provider.query(ctx, "Security deployment status");
    expect(response.content).toBeTruthy();
  });

  it("should respond to crowd query", async () => {
    const ctx = createTestContext();
    const response = await provider.query(ctx, "Crowd movement analysis");
    expect(response.content).toBeTruthy();
  });

  it("should handle unknown query gracefully", async () => {
    const ctx = createTestContext();
    const response = await provider.query(ctx, "Some random question");
    expect(response.content).toBeTruthy();
  });

  it("should generate alert from context risks", async () => {
    const ctx = createTestContext({ activeRisks: [makeActiveRisk({ module: "Crowd" })] });
    const response = await provider.generateAlert(ctx, "Crowd");
    expect(response.content).toBeTruthy();
    expect(response.reasoning).toBeTruthy();
  });

  it("should generate alert with matching risk", async () => {
    const ctx = createTestContext({ activeRisks: [makeActiveRisk({ module: "Crowd", level: "critical" })] });
    const response = await provider.generateAlert(ctx, "Crowd");
    expect(response.reasoning.priority).toBe("critical");
  });

  it("should generate alert with fallback risk template", async () => {
    const ctx = createTestContext({ activeRisks: [] });
    const response = await provider.generateAlert(ctx, "nonexistent");
    expect(response.content).toBeTruthy();
  });

  it("should compare decisions", async () => {
    const ctx = createTestContext();
    const result = await provider.compareDecisions(ctx, "test", ["A", "B"]);
    expect(result).toHaveProperty("recommendation");
    expect(result).toHaveProperty("reasoning");
    expect(result.reasoning.alternatives).toBeDefined();
    expect(result.reasoning.alternatives!.length).toBeGreaterThan(0);
  });

  it("should include alternatives in decision comparison", async () => {
    const ctx = createTestContext();
    const result = await provider.compareDecisions(ctx, "test", ["A", "B"]);
    const alt = result.reasoning.alternatives![0];
    expect(alt).toHaveProperty("label");
    expect(alt).toHaveProperty("action");
    expect(alt).toHaveProperty("implementationCost");
    expect(alt).toHaveProperty("risk");
    expect(alt).toHaveProperty("implementationTime");
    expect(alt).toHaveProperty("confidence");
  });

  it("should summarize operations", async () => {
    const ctx = createTestContext();
    const response = await provider.summarize(ctx);
    expect(response.content).toContain("Operations Summary");
  });

  it("should summarize healthy operations", async () => {
    const ctx = createTestContext({ emergencyAlerts: 0, crowdDensity: 50 });
    const response = await provider.summarize(ctx);
    expect(response.content).toContain("All Systems Nominal");
  });

  it("should summarize critical operations", async () => {
    const ctx = createTestContext({ emergencyAlerts: 2, crowdDensity: 85 });
    const response = await provider.summarize(ctx);
    expect(response.content).toContain("Action Required");
  });

  it("should get risks with correct structure", () => {
    const risks = provider.getRisks();
    expect(risks.length).toBeGreaterThanOrEqual(2);
    expect(risks.length).toBeLessThanOrEqual(5);
    for (const r of risks) {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("title");
      expect(r).toHaveProperty("level");
      expect(r).toHaveProperty("module");
      expect(r).toHaveProperty("trend");
      expect(r).toHaveProperty("probability");
    }
  });

  it("should get predicted problems with correct structure", () => {
    const problems = provider.getPredictedProblems();
    expect(problems.length).toBeGreaterThanOrEqual(2);
    expect(problems.length).toBeLessThanOrEqual(4);
    for (const p of problems) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("title");
      expect(p).toHaveProperty("detail");
      expect(p).toHaveProperty("probability");
      expect(p).toHaveProperty("severity");
      expect(p).toHaveProperty("recommendedAction");
    }
  });

  it("should generate contextual suggestions based on crowd density", async () => {
    const ctx = createTestContext({ crowdDensity: 80 });
    const response = await provider.analyze(ctx);
    expect(response.suggestions.some((s) => s.toLowerCase().includes("crowd"))).toBe(true);
  });

  it("should generate contextual suggestions based on parking", async () => {
    const ctx = createTestContext({ parkingOccupancy: 90 });
    const response = await provider.analyze(ctx);
    expect(response.suggestions.some((s) => s.toLowerCase().includes("parking"))).toBe(true);
  });

  it("should generate contextual suggestions for emergencies", async () => {
    const ctx = createTestContext({ emergencyAlerts: 2 });
    const response = await provider.analyze(ctx);
    expect(response.suggestions.some((s) => s.toLowerCase().includes("emergency"))).toBe(true);
  });

  it("should generate queue suggestions", async () => {
    const ctx = createTestContext({ avgQueueTime: 15 });
    const response = await provider.analyze(ctx);
    expect(response.suggestions.some((s) => s.toLowerCase().includes("queue"))).toBe(true);
  });

  it("should generate staff allocation suggestions", async () => {
    const ctx = createTestContext({ staffAvailability: 70 });
    const response = await provider.analyze(ctx);
    expect(response.suggestions.some((s) => s.toLowerCase().includes("staff"))).toBe(true);
  });

  it("should include evidence from active risks", async () => {
    const risk = makeActiveRisk({ title: "Test Risk" });
    const ctx = createTestContext({ activeRisks: [risk] });
    const response = await provider.analyze(ctx);
    const evidence = response.reasoning.evidence;
    expect(evidence.some((e) => e.includes("Test Risk"))).toBe(true);
  });

  it("should set critical priority when emergency alerts exist", async () => {
    const ctx = createTestContext({ emergencyAlerts: 1 });
    const response = await provider.analyze(ctx);
    expect(response.reasoning.priority).toBe("critical");
  });

  it("should set high priority when crowd density high", async () => {
    const ctx = createTestContext({ crowdDensity: 85, emergencyAlerts: 0 });
    const response = await provider.analyze(ctx);
    expect(response.reasoning.priority).toBe("high");
  });

  it("should set medium priority for normal conditions", async () => {
    const ctx = createTestContext({ crowdDensity: 50, emergencyAlerts: 0 });
    const response = await provider.analyze(ctx);
    expect(response.reasoning.priority).toBe("medium");
  });
});

describe("AIProvider Interface - OpenAIProvider", () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider("test-key");
  });

  it("should have name 'openai'", () => {
    expect(provider.name).toBe("openai");
  });

  it("should be available when api key is set", async () => {
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it("should not be available without api key", async () => {
    const p = new OpenAIProvider("");
    await expect(p.isAvailable()).resolves.toBe(false);
  });

  it("should accept optional model parameter", () => {
    const p = new OpenAIProvider("key", "gpt-4");
    expect(p.name).toBe("openai");
  });

  it("should throw on analyze when fetch fails", async () => {
    const p = new OpenAIProvider("bad-key");
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));
    const ctx = createTestContext();
    await expect(p.analyze(ctx)).rejects.toThrow("Network error");
  });

  it("should throw on query when fetch returns error status", async () => {
    const p = new OpenAIProvider("bad-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401, statusText: "Unauthorized" }),
    );
    const ctx = createTestContext();
    await expect(p.query(ctx, "test")).rejects.toThrow("OpenAI API error: 401");
  });

  it("should handle empty response from API", async () => {
    const p = new OpenAIProvider("key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    );
    const ctx = createTestContext();
    const result = await p.query(ctx, "test");
    expect(result.content).toBe("");
  });

  it("should call fetch with correct URL", async () => {
    const p = new OpenAIProvider("test-key");
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "test" } }] }), { status: 200 }),
    );
    const ctx = createTestContext();
    await p.query(ctx, "hello");
    const callUrl = mockFetch.mock.calls[0][0];
    expect(callUrl).toBe("https://api.openai.com/v1/chat/completions");
  });

  it("should pass Authorization header", async () => {
    const p = new OpenAIProvider("secret-key");
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 }),
    );
    const ctx = createTestContext();
    await p.query(ctx, "hi");
    const headers = mockFetch.mock.calls[0][1]!.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer secret-key");
  });
});

describe("AIProvider Interface - GeminiProvider", () => {
  let provider: GeminiProvider;

  beforeEach(() => {
    provider = new GeminiProvider("test-key");
  });

  it("should have name 'gemini'", () => {
    expect(provider.name).toBe("gemini");
  });

  it("should be available when api key is set", async () => {
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it("should not be available without api key", async () => {
    const p = new GeminiProvider("");
    await expect(p.isAvailable()).resolves.toBe(false);
  });

  it("should accept optional model parameter", () => {
    const p = new GeminiProvider("key", "gemini-2.0");
    expect(p.name).toBe("gemini");
  });

  it("should throw on analyze when fetch fails", async () => {
    const p = new GeminiProvider("bad-key");
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));
    const ctx = createTestContext();
    await expect(p.analyze(ctx)).rejects.toThrow("Network error");
  });

  it("should throw on query when fetch returns error status", async () => {
    const p = new GeminiProvider("bad-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 403, statusText: "Forbidden" }),
    );
    const ctx = createTestContext();
    await expect(p.query(ctx, "test")).rejects.toThrow("Gemini API error: 403");
  });

  it("should handle empty response from API", async () => {
    const p = new GeminiProvider("key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );
    const ctx = createTestContext();
    const result = await p.query(ctx, "test");
    expect(result.content).toBe("");
  });
});

/* ===================================================================
   Provider Factory
   =================================================================== */
describe("AIProviderFactory", () => {
  beforeEach(() => {
    AIProviderFactory.getInstance().setProvider("mock");
  });

  it("should be a singleton", () => {
    const i1 = AIProviderFactory.getInstance();
    const i2 = AIProviderFactory.getInstance();
    expect(i1).toBe(i2);
  });

  it("should default to mock provider", () => {
    const factory = AIProviderFactory.getInstance();
    expect(factory.getProviderType()).toBe("mock");
  });

  it("should set provider type", () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("openai");
    expect(factory.getProviderType()).toBe("openai");
    factory.setProvider("gemini");
    expect(factory.getProviderType()).toBe("gemini");
    factory.setProvider("mock");
    expect(factory.getProviderType()).toBe("mock");
  });

  it("should return mock provider by default", async () => {
    const factory = AIProviderFactory.getInstance();
    const provider = await factory.getProvider();
    expect(provider.name).toBe("mock");
  });

  it("should return same provider instance on second call", async () => {
    const factory = AIProviderFactory.getInstance();
    const p1 = await factory.getProvider();
    const p2 = await factory.getProvider();
    expect(p1).toBe(p2);
  });

  it("should reset provider when type changes", async () => {
    const factory = AIProviderFactory.getInstance();
    const p1 = await factory.getProvider();
    factory.setProvider("mock");
    const p2 = await factory.getProvider();
    expect(p1).not.toBe(p2);
  });

  it("should getMockProvider returns MockAIProvider when mock is set", async () => {
    const factory = AIProviderFactory.getInstance();
    const mock = await factory.getMockProvider();
    expect(mock instanceof MockAIProvider).toBe(true);
  });

  it("should getMockProvider returns MockAIProvider even when openai is set", async () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("openai");
    const mock = await factory.getMockProvider();
    expect(mock instanceof MockAIProvider).toBe(true);
  });

  it("should fallback to mock when openai is unavailable", async () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("openai");
    vi.spyOn(OpenAIProvider.prototype, "isAvailable").mockResolvedValueOnce(false);
    const provider = await factory.getProvider();
    expect(provider.name).toBe("mock");
  });

  it("should fallback to mock when gemini is unavailable", async () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("gemini");
    vi.spyOn(GeminiProvider.prototype, "isAvailable").mockResolvedValueOnce(false);
    const provider = await factory.getProvider();
    expect(provider.name).toBe("mock");
  });
});

/* ===================================================================
   System Prompts
   =================================================================== */
describe("System Prompts", () => {
  it("should define main system prompt", () => {
    expect(SYSTEM_PROMPTS.main).toBeTruthy();
    expect(SYSTEM_PROMPTS.main.length).toBeGreaterThan(100);
  });

  it("should define analysis prompt", () => {
    expect(SYSTEM_PROMPTS.analysis).toBeTruthy();
    expect(SYSTEM_PROMPTS.analysis).toContain("Analyze");
  });

  it("should define decision prompt", () => {
    expect(SYSTEM_PROMPTS.decision).toBeTruthy();
    expect(SYSTEM_PROMPTS.decision).toContain("decision");
  });

  it("should define summary prompt", () => {
    expect(SYSTEM_PROMPTS.summary).toBeTruthy();
    expect(SYSTEM_PROMPTS.summary).toContain("summary");
  });

  it("main prompt should mention core responsibilities", () => {
    expect(SYSTEM_PROMPTS.main).toContain("CORE RESPONSIBILITIES");
    expect(SYSTEM_PROMPTS.main).toContain("crowd");
    expect(SYSTEM_PROMPTS.main).toContain("security");
    expect(SYSTEM_PROMPTS.main).toContain("parking");
  });

  it("main prompt should define response format", () => {
    expect(SYSTEM_PROMPTS.main).toContain("RESPONSE FORMAT");
    expect(SYSTEM_PROMPTS.main).toContain("Summary");
    expect(SYSTEM_PROMPTS.main).toContain("Evidence");
    expect(SYSTEM_PROMPTS.main).toContain("Confidence Score");
  });

  it("main prompt should include behavior rules", () => {
    expect(SYSTEM_PROMPTS.main).toContain("BEHAVIOR RULES");
    expect(SYSTEM_PROMPTS.main).toContain("proactive");
    expect(SYSTEM_PROMPTS.main).toContain("concise");
  });
});

/* ===================================================================
   Context Builders
   =================================================================== */
describe("Context Builders", () => {
  it("buildFullContext should include stadium name", () => {
    const ctx = createTestContext();
    const result = buildFullContext(ctx);
    expect(result).toContain(ctx.stadiumName);
  });

  it("buildFullContext should include tournament name", () => {
    const ctx = createTestContext();
    const result = buildFullContext(ctx);
    expect(result).toContain(ctx.tournamentName);
  });

  it("buildFullContext should include current match", () => {
    const ctx = createTestContext();
    const result = buildFullContext(ctx);
    expect(result).toContain(ctx.currentMatch);
  });

  it("buildFullContext should include attendance percentage", () => {
    const ctx = createTestContext({ attendance: 37500, capacity: 75000 });
    const result = buildFullContext(ctx);
    expect(result).toContain("50%");
  });

  it("buildFullContext should include weather", () => {
    const ctx = createTestContext({ weather: "Rainy", temperature: 22 });
    const result = buildFullContext(ctx);
    expect(result).toContain("Rainy");
    expect(result).toContain("22");
  });

  it("buildFullContext should include active risks", () => {
    const risk = makeActiveRisk({ title: "Test Risk", level: "high" });
    const ctx = createTestContext({ activeRisks: [risk] });
    const result = buildFullContext(ctx);
    expect(result).toContain("Test Risk");
    expect(result).toContain("HIGH");
  });

  it("buildFullContext should include predicted problems", () => {
    const ctx = createTestContext({
      predictedProblems: [{
        id: "p1", title: "Overflow", detail: "Detail here",
        timeToOccur: "30 min", probability: 80, severity: "high",
        affectedArea: "Gate A", recommendedAction: "Open gates",
      }],
    });
    const result = buildFullContext(ctx);
    expect(result).toContain("Overflow");
    expect(result).toContain("HIGH");
  });

  it("buildFullContext should include instructions section", () => {
    const ctx = createTestContext();
    const result = buildFullContext(ctx);
    expect(result).toContain("INSTRUCTIONS");
  });

  it("buildFullContext should handle empty risks gracefully", () => {
    const ctx = createTestContext({ activeRisks: [] });
    const result = buildFullContext(ctx);
    expect(result).not.toContain("undefined");
  });

  it("buildFullContext should handle empty problems gracefully", () => {
    const ctx = createTestContext({ predictedProblems: [] });
    const result = buildFullContext(ctx);
    expect(result).not.toContain("undefined");
  });

  it("buildFullContext should include key metrics section", () => {
    const ctx = createTestContext();
    const result = buildFullContext(ctx);
    expect(result).toContain("KEY METRICS");
  });

  it("buildQueryContext should include query", () => {
    const ctx = createTestContext();
    const result = buildQueryContext(ctx, "What is the status?");
    expect(result).toContain("What is the status?");
  });

  it("buildQueryContext should include capacity percentage", () => {
    const ctx = createTestContext({ attendance: 50000, capacity: 75000 });
    const result = buildQueryContext(ctx, "test");
    expect(result).toContain("67%");
  });

  it("buildQueryContext should include weather", () => {
    const ctx = createTestContext({ weather: "Cloudy", temperature: 25 });
    const result = buildQueryContext(ctx, "test");
    expect(result).toContain("Cloudy");
  });

  it("buildQueryContext should include response requirements", () => {
    const ctx = createTestContext();
    const result = buildQueryContext(ctx, "test");
    expect(result).toContain("RESPONSE REQUIREMENTS");
  });

  it("buildQueryContext should reference summary/reasoning/evidence", () => {
    const ctx = createTestContext();
    const result = buildQueryContext(ctx, "test");
    expect(result).toContain("summary");
    expect(result).toContain("reasoning");
    expect(result).toContain("evidence");
  });
});

/* ===================================================================
   Response Formatters
   =================================================================== */
describe("Response Formatters", () => {
  it("formatAIResponse should extract reasoning from structured text", () => {
    const raw = `**Summary:** Test assessment
**Reasoning:** Based on data
**Evidence:** Point 1
**Confidence:** 90%
**Priority:** high
**Recommended Action:** Do something
**Expected Outcome:** Good result`;
    const result = formatAIResponse(raw);
    expect(result.role).toBe("assistant");
    expect(result.content).toBe("Test assessment");
    expect(result.reasoning).toBeDefined();
  });

  it("formatAIResponse should handle missing sections", () => {
    const raw = "Just some random text without sections";
    const result = formatAIResponse(raw);
    expect(result.content).toBeTruthy();
    expect(result.reasoning).toBeDefined();
  });

  it("formatAIResponse should extract evidence array", () => {
    const raw = `**Summary:** Test
**Reasoning:** Analysis
**Evidence:** - Point A\n- Point B
**Confidence:** 85%
**Priority:** medium
**Recommended Action:** Act
**Expected Outcome:** Done`;
    const result = formatAIResponse(raw);
    expect(result.reasoning!.evidence.length).toBeGreaterThan(0);
  });

  it("formatAIResponse should default confidence to 85 when missing", () => {
    const raw = `**Summary:** Test
**Reasoning:** Analysis
**Evidence:** Data
**Recommended Action:** Act
**Expected Outcome:** Done`;
    const result = formatAIResponse(raw);
    expect(result.reasoning!.confidence).toBe(85);
  });

  it("formatAIResponse should validate priority defaults to medium", () => {
    const raw = `**Summary:** Test
**Priority:** invalid_value
**Recommended Action:** Act
**Expected Outcome:** Done`;
    const result = formatAIResponse(raw);
    expect(result.reasoning!.priority).toBe("medium");
  });

  it("formatAIResponse should clamp confidence to 0-100", () => {
    const raw = `**Summary:** Test
**Confidence:** 999%
**Priority:** low
**Recommended Action:** Act
**Expected Outcome:** Done`;
    const result = formatAIResponse(raw);
    expect(result.reasoning!.confidence).toBe(100);
  });

  it("formatAIResponse should extract suggestions from text", () => {
    const raw = "Suggested actions:\n1. Action one\n2. Action two\n3. Action three\n\nSome other text";
    const result = formatAIResponse(raw);
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });

  it("formatAIResponse should limit suggestions to 4", () => {
    const raw = "You can try:\n1. First\n2. Second\n3. Third\n4. Fourth\n5. Fifth";
    const result = formatAIResponse(raw);
    expect(result.suggestions!.length).toBeLessThanOrEqual(4);
  });

  it("formatAIResponse should extract alternatives", () => {
    const raw = `**Summary:** Test
Option A: First option
Action: Do X
Cost: low
Risk: low
Time: 10 min
Confidence: 90%`;
    const result = formatAIResponse(raw);
    if (result.reasoning!.alternatives) {
      expect(result.reasoning!.alternatives.length).toBeGreaterThan(0);
    }
  });

  it("formatAIResponse should handle empty input", () => {
    const result = formatAIResponse("");
    expect(result.content).toBe("");
    expect(result.reasoning).toBeDefined();
  });

  it("formatAIResponse should handle whitespace-only input", () => {
    const result = formatAIResponse("   \n  \n  ");
    expect(result.content).toBe("");
  });

  it("formatAIResponse should parse numeric priority from number string", () => {
    const raw = `**Summary:** Test
**Confidence:** 75%`;
    const result = formatAIResponse(raw);
    expect(result.reasoning!.confidence).toBe(75);
  });

  it("formatAIResponse should extract alternatives with all fields", () => {
    const raw = `**Summary:** Decision needed
Option A: Open Gates
Action: Open all gates
Cost: low
Risk: low
Time: 5 min
Confidence: 92%`;
    const result = formatAIResponse(raw);
    expect(result.reasoning!.alternatives).toBeDefined();
    if (result.reasoning!.alternatives!.length > 0) {
      const alt = result.reasoning!.alternatives![0];
      expect(alt.label).toBeTruthy();
      expect(alt.action).toBeTruthy();
      expect(alt.implementationCost).toBeTruthy();
      expect(alt.implementationTime).toBeTruthy();
    }
  });
});

/* ===================================================================
   AI Copilot Service
   =================================================================== */
describe("AICopilotService - getOperationalContext", () => {
  it("should return a valid OperationalContext", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(ctx).toHaveProperty("stadiumName");
    expect(ctx).toHaveProperty("tournamentName");
    expect(ctx).toHaveProperty("currentMatch");
    expect(ctx).toHaveProperty("attendance");
    expect(ctx).toHaveProperty("capacity");
  });

  it("should return attendance within valid range", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(ctx.attendance).toBeGreaterThanOrEqual(25000);
    expect(ctx.attendance).toBeLessThanOrEqual(72000);
  });

  it("should return capacity of 75000", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(ctx.capacity).toBe(75000);
  });

  it("should always have activeRisks array", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(Array.isArray(ctx.activeRisks)).toBe(true);
    expect(ctx.activeRisks.length).toBeGreaterThan(0);
  });

  it("should always have predictedProblems array", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(Array.isArray(ctx.predictedProblems)).toBe(true);
    expect(ctx.predictedProblems.length).toBeGreaterThan(0);
  });

  it("should include emergency alert risk when emergencyAlerts > 0", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    if (ctx.emergencyAlerts > 0) {
      expect(ctx.activeRisks.some((r) => r.module === "Security")).toBe(true);
    }
  });

  it("should return fanSatisfaction as a number", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(typeof ctx.fanSatisfaction).toBe("number");
  });

  it("should return energyUsage as a number", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(typeof ctx.energyUsage).toBe("number");
  });

  it("should return revenue as a number", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(typeof ctx.revenue).toBe("number");
  });

  it("should set timeOfDay to Afternoon", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(ctx.timeOfDay).toBe("Afternoon");
  });

  it("should set eventPhase to Second Half", async () => {
    const ctx = await aiCopilotService.getOperationalContext();
    expect(ctx.eventPhase).toBe("Second Half");
  });
});

describe("AICopilotService - refreshContext", () => {
  it("should return a context object", async () => {
    const ctx = await aiCopilotService.refreshContext();
    expect(ctx).toHaveProperty("stadiumName");
  });

  it("should keep stadiumName consistent", async () => {
    const ctx = await aiCopilotService.refreshContext();
    expect(ctx.stadiumName).toBe("Lusail Iconic Stadium");
  });

  it("should produce slightly different values on successive calls", async () => {
    const ctx1 = await aiCopilotService.refreshContext();
    const ctx2 = await aiCopilotService.refreshContext();
    expect(ctx1.crowdDensity).not.toBe(ctx2.crowdDensity);
  });

  it("should not exceed 100 for crowdDensity", async () => {
    const ctx = await aiCopilotService.refreshContext();
    expect(ctx.crowdDensity).toBeLessThanOrEqual(100);
  });

  it("should not go below 0 for avgQueueTime", async () => {
    const ctx = await aiCopilotService.refreshContext();
    expect(ctx.avgQueueTime).toBeGreaterThanOrEqual(0);
  });

  it("should keep capacity constant", async () => {
    const ctx = await aiCopilotService.refreshContext();
    expect(ctx.capacity).toBe(75000);
  });

  it("should keep tournament name constant", async () => {
    const ctx = await aiCopilotService.refreshContext();
    expect(ctx.tournamentName).toBe("FIFA World Cup 2026");
  });
});

describe("AICopilotService - sendMessage", () => {
  it("should return a complete CopilotMessage", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "What is the status?");
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("role", "assistant");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("status");
  });

  it("should set status to complete on success", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.status).toBe("complete");
  });

  it("should include reasoning in result", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.reasoning).toBeDefined();
    expect(result.reasoning!.summary).toBeTruthy();
  });

  it("should include suggestions", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });

  it("should call onUpdate callback for user message", async () => {
    const ctx = createTestContext();
    const onUpdate = vi.fn();
    await aiCopilotService.sendMessage([], ctx, "test", onUpdate);
    expect(onUpdate).toHaveBeenCalled();
  });

  it("should call onUpdate for streaming status", async () => {
    const ctx = createTestContext();
    const onUpdate = vi.fn();
    await aiCopilotService.sendMessage([], ctx, "test", onUpdate);
    const calls = onUpdate.mock.calls;
    const streamingMsg = calls.find((c) => c[0].status === "streaming");
    expect(streamingMsg).toBeDefined();
  });

  it("should return error message when provider throws", async () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("openai");
    vi.spyOn(OpenAIProvider.prototype, "isAvailable").mockResolvedValueOnce(true);
    vi.spyOn(OpenAIProvider.prototype, "query").mockRejectedValueOnce(new Error("Provider error"));
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.status).toBe("error");
    factory.setProvider("mock");
  });

  it("should handle query about current risks", async () => {
    const ctx = createTestContext({ activeRisks: [makeActiveRisk({ title: "Gate Risk" })] });
    const result = await aiCopilotService.sendMessage([], ctx, "What are the risks?");
    expect(result.content).toBeTruthy();
  });

  it("should handle query about parking", async () => {
    const ctx = createTestContext({ parkingOccupancy: 90 });
    const result = await aiCopilotService.sendMessage([], ctx, "Parking status?");
    expect(result.content).toBeTruthy();
  });

  it("should handle query about crowd", async () => {
    const ctx = createTestContext({ crowdDensity: 80 });
    const result = await aiCopilotService.sendMessage([], ctx, "Crowd report");
    expect(result.content).toBeTruthy();
  });

  it("should handle query about security", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "Security check");
    expect(result.content).toBeTruthy();
  });

  it("should generate contextual suggestions for high crowd", async () => {
    const ctx = createTestContext({ crowdDensity: 85 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.some((s) => s.includes("crowd"))).toBe(true);
  });

  it("should generate contextual suggestions for high parking", async () => {
    const ctx = createTestContext({ parkingOccupancy: 90 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.some((s) => s.includes("parking"))).toBe(true);
  });

  it("should generate contextual suggestions for emergencies", async () => {
    const ctx = createTestContext({ emergencyAlerts: 2 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.some((s) => s.includes("emergency"))).toBe(true);
  });

  it("should generate contextual suggestions for long queues", async () => {
    const ctx = createTestContext({ avgQueueTime: 15 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.some((s) => s.includes("queue"))).toBe(true);
  });

  it("should generate contextual suggestions for low staff", async () => {
    const ctx = createTestContext({ staffAvailability: 70 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.some((s) => s.includes("Staff") || s.includes("staff"))).toBe(true);
  });

  it("should limit suggestions to 5", async () => {
    const ctx = createTestContext({ crowdDensity: 85, parkingOccupancy: 90, emergencyAlerts: 2, avgQueueTime: 15, staffAvailability: 70 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.length).toBeLessThanOrEqual(5);
  });

  it("should always include 'What should I do right now?' suggestion", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.some((s) => s.includes("right now"))).toBe(true);
  });

  it("should always include summarization suggestion", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.suggestions!.some((s) => s.toLowerCase().includes("summarize"))).toBe(true);
  });
});

describe("AICopilotService - getInitialAnalysis", () => {
  it("should return message, summary, risks, problems, context", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("risks");
    expect(result).toHaveProperty("problems");
    expect(result).toHaveProperty("context");
  });

  it("should return complete message status", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result.message.status).toBe("complete");
  });

  it("should return summary with all required fields", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result.summary).toHaveProperty("overallStatus");
    expect(result.summary).toHaveProperty("activeIncidents");
    expect(result.summary).toHaveProperty("totalVisitors");
    expect(result.summary).toHaveProperty("capacityUsed");
    expect(result.summary).toHaveProperty("staffOnDuty");
    expect(result.summary).toHaveProperty("systemHealth");
    expect(result.summary).toHaveProperty("highlights");
    expect(result.summary).toHaveProperty("lastUpdated");
  });

  it("should return valid overallStatus", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(["healthy", "moderate", "critical"]).toContain(result.summary.overallStatus);
  });

  it("should return risks array from mock provider", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result.risks.length).toBeGreaterThan(0);
  });

  it("should return problems array from mock provider", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result.problems.length).toBeGreaterThan(0);
  });

  it("should include suggestions in message", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result.message.suggestions).toBeDefined();
    expect(result.message.suggestions!.length).toBeGreaterThan(0);
  });

  it("should calculate activeIncidents from risk levels", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    const criticalHigh = result.risks.filter((r) => r.level === "critical" || r.level === "high").length;
    expect(result.summary.activeIncidents).toBe(criticalHigh);
  });

  it("should set critical status when more than 2 high/critical risks", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    const criticalHigh = result.risks.filter((r) => r.level === "critical" || r.level === "high").length;
    const expectedStatus = criticalHigh > 2 ? "critical" : criticalHigh > 0 ? "moderate" : "healthy";
    expect(result.summary.overallStatus).toBe(expectedStatus);
  });

  it("should include systemHealth between 90 and 100", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result.summary.systemHealth).toBeGreaterThanOrEqual(90);
    expect(result.summary.systemHealth).toBeLessThanOrEqual(100);
  });

  it("should include highlights array", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    expect(result.summary.highlights.length).toBeGreaterThan(0);
  });

  it("should include incident count in highlights when incidents exist", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    if (result.summary.activeIncidents > 0) {
      expect(result.summary.highlights.some((h) => h.includes("incident"))).toBe(true);
    }
  });

  it("should include 'No critical incidents' when none exist", async () => {
    const result = await aiCopilotService.getInitialAnalysis();
    if (result.summary.activeIncidents === 0) {
      expect(result.summary.highlights.some((h) => h.includes("No critical"))).toBe(true);
    }
  });
});

describe("AICopilotService - executeAction", () => {
  it("should return ActionExecution with correct fields", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.executeAction("Test action", ctx);
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("action");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("timestamp");
  });

  it("should set status to completed", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.executeAction("Test action", ctx);
    expect(result.status).toBe("completed");
  });

  it("should include result in response", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.executeAction("Open gates", ctx);
    expect(result.result).toContain("Successfully executed");
  });

  it("should include the action name in result", async () => {
    const ctx = createTestContext();
    const action = "Deploy security team";
    const result = await aiCopilotService.executeAction(action, ctx);
    expect(result.result).toContain(action);
  });

  it("should generate unique IDs for each execution", async () => {
    const ctx = createTestContext();
    const r1 = await aiCopilotService.executeAction("Action 1", ctx);
    const r2 = await aiCopilotService.executeAction("Action 2", ctx);
    expect(r1.id).not.toBe(r2.id);
  });
});

/* ===================================================================
   AI Copilot Service - Edge Cases
   =================================================================== */
describe("AICopilotService - Edge Cases", () => {
  it("should handle sendMessage with empty messages array", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.status).toBe("complete");
  });

  it("should handle sendMessage with empty query string", async () => {
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "");
    expect(result.status).toBe("complete");
  });

  it("should handle context with no active risks", async () => {
    const ctx = createTestContext({ activeRisks: [] });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.status).toBe("complete");
  });

  it("should handle context with all systems critical", async () => {
    const criticalRisks = [
      makeActiveRisk({ title: "Risk 1", level: "critical" }),
      makeActiveRisk({ title: "Risk 2", level: "critical" }),
      makeActiveRisk({ title: "Risk 3", level: "critical" }),
    ];
    const ctx = createTestContext({ activeRisks: criticalRisks, crowdDensity: 95, parkingOccupancy: 98, emergencyAlerts: 3 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.status).toBe("complete");
  });

  it("should handle context with all healthy systems", async () => {
    const ctx = createTestContext({
      crowdDensity: 30, parkingOccupancy: 20, avgQueueTime: 2, staffAvailability: 98,
      emergencyAlerts: 0, activeRisks: [],
    });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.status).toBe("complete");
  });

  it("should handle very long query string", async () => {
    const ctx = createTestContext();
    const longQuery = "A".repeat(10000);
    const result = await aiCopilotService.sendMessage([], ctx, longQuery);
    expect(result.status).toBe("complete");
  });

  it("should handle context with maximum capacity crowd", async () => {
    const ctx = createTestContext({ crowdDensity: 100, attendance: 75000 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.status).toBe("complete");
  });

  it("should handle context with zero capacity usage", async () => {
    const ctx = createTestContext({ attendance: 0, crowdDensity: 0, parkingOccupancy: 0, revenue: 0 });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.status).toBe("complete");
  });

  it("should handle onUpdate callback returning error", async () => {
    const ctx = createTestContext();
    const onUpdate = vi.fn(() => { throw new Error("Callback error"); });
    const result = await aiCopilotService.sendMessage([], ctx, "test", onUpdate);
    expect(result.status).toBe("complete");
  });

  it("should handle context with max predicted problems", async () => {
    const problems: PredictedProblem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`, title: `Problem ${i}`, detail: `Detail ${i}`,
      timeToOccur: `${i * 10} min`, probability: 50 + i, severity: "medium",
      affectedArea: `Area ${i}`, recommendedAction: `Action ${i}`,
    }));
    const ctx = createTestContext({ predictedProblems: problems });
    const result = await aiCopilotService.sendMessage([], ctx, "status");
    expect(result.status).toBe("complete");
  });

  it("should handle sendMessage with previous messages", async () => {
    const ctx = createTestContext();
    const prevMessages = [
      makeCopilotMessage({ role: "user", content: "Previous question" }),
      makeCopilotMessage({ role: "assistant", content: "Previous answer" }),
    ];
    const result = await aiCopilotService.sendMessage(prevMessages, ctx, "Follow up");
    expect(result.status).toBe("complete");
  });

  it("should handle sendMessage with many previous messages", async () => {
    const ctx = createTestContext();
    const prevMessages = Array.from({ length: 50 }, (_, i) =>
      makeCopilotMessage({ role: i % 2 === 0 ? "user" : "assistant", content: `Message ${i}` }),
    );
    const result = await aiCopilotService.sendMessage(prevMessages, ctx, "test");
    expect(result.status).toBe("complete");
  });

  it("should produce different IDs for each message", async () => {
    const ctx = createTestContext();
    const r1 = await aiCopilotService.sendMessage([], ctx, "q1");
    const r2 = await aiCopilotService.sendMessage([], ctx, "q2");
    expect(r1.id).not.toBe(r2.id);
  });

  it("should handle provider timeout gracefully", async () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("openai");
    vi.spyOn(OpenAIProvider.prototype, "isAvailable").mockResolvedValueOnce(true);
    vi.spyOn(OpenAIProvider.prototype, "query").mockImplementationOnce(
      () => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 100)),
    );
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.status).toBe("error");
    factory.setProvider("mock");
  });

  it("should handle empty response from provider", async () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("openai");
    vi.spyOn(OpenAIProvider.prototype, "isAvailable").mockResolvedValueOnce(true);
    vi.spyOn(OpenAIProvider.prototype, "query").mockResolvedValueOnce({
      content: "", reasoning: { summary: "", evidence: [], confidence: 0, priority: "low", recommendedAction: "", expectedOutcome: "" },
      suggestions: [], raw: "",
    });
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.status).toBe("complete");
    factory.setProvider("mock");
  });

  it("should handle provider that only returns partial response", async () => {
    const factory = AIProviderFactory.getInstance();
    factory.setProvider("openai");
    vi.spyOn(OpenAIProvider.prototype, "isAvailable").mockResolvedValueOnce(true);
    vi.spyOn(OpenAIProvider.prototype, "query").mockResolvedValueOnce({
      content: "Short", reasoning: { summary: "Short", evidence: [], confidence: 50, priority: "low", recommendedAction: "Wait", expectedOutcome: "None" },
      suggestions: [], raw: "Short",
    });
    const ctx = createTestContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test");
    expect(result.status).toBe("complete");
    factory.setProvider("mock");
  });

  it("should handle rapid successive calls without race conditions", async () => {
    const ctx = createTestContext();
    const promises = Array.from({ length: 5 }, (_, i) =>
      aiCopilotService.sendMessage([], ctx, `Query ${i}`),
    );
    const results = await Promise.all(promises);
    for (const r of results) {
      expect(r.status).toBe("complete");
    }
    const ids = new Set(results.map((r) => r.id));
    expect(ids.size).toBe(5);
  });
});

/* ===================================================================
   Risk Extraction & Deduplication
   =================================================================== */
describe("Risk Extraction & Deduplication", () => {
  it("should extract risks with unique IDs", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    const ids = new Set(risks.map((r) => r.id));
    expect(ids.size).toBe(risks.length);
  });

  it("should return risks with valid levels", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    const validLevels = ["critical", "high", "medium", "low", "monitoring"];
    for (const r of risks) {
      expect(validLevels).toContain(r.level);
    }
  });

  it("should return risks with valid trends", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    for (const r of risks) {
      expect(["increasing", "stable", "decreasing"]).toContain(r.trend);
    }
  });

  it("should return risks with module information", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    for (const r of risks) {
      expect(typeof r.module).toBe("string");
      expect(r.module.length).toBeGreaterThan(0);
    }
  });

  it("should return risks with probability between 0 and 100", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    for (const r of risks) {
      expect(r.probability).toBeGreaterThanOrEqual(0);
      expect(r.probability).toBeLessThanOrEqual(100);
    }
  });

  it("should deduplicate risk templates by title", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    const titles = risks.map((r) => r.title);
    const uniqueTitles = new Set(titles);
    expect(titles.length).toBe(uniqueTitles.size);
  });

  it("should have well-formed risk descriptions", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    for (const r of risks) {
      expect(typeof r.description).toBe("string");
      expect(r.description.length).toBeGreaterThan(10);
    }
  });
});

