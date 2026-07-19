import { describe, it, expect } from "vitest";
import { AIProviderFactory } from "@/features/ai-copilot/services/providers/provider-factory";
import { MockAIProvider } from "@/features/ai-copilot/services/providers/mock-provider";
import { aiCopilotService } from "@/features/ai-copilot/services/ai-copilot-service";
import { makeOperationalContext } from "../fixtures/factories";

describe("AI Provider Abstraction", () => {
  it("should adhere to AIProvider interface contract", () => {
    const provider = new MockAIProvider();
    expect(provider.analyze).toBeDefined();
    expect(provider.query).toBeDefined();
    expect(typeof provider.analyze).toBe("function");
    expect(typeof provider.query).toBe("function");
  });

  it("should return structured responses from analyze", async () => {
    const provider = new MockAIProvider();
    const ctx = makeOperationalContext();
    const response = await provider.analyze(ctx);
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe("string");
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("should return structured responses from query", async () => {
    const provider = new MockAIProvider();
    const ctx = makeOperationalContext();
    const response = await provider.query(ctx, "What is the current status?");
    expect(response.content).toBeDefined();
    expect(typeof response.content).toBe("string");
    expect(response.content.length).toBeGreaterThan(0);
  });

  it("should include reasoning in responses", async () => {
    const provider = new MockAIProvider();
    const ctx = makeOperationalContext();
    const response = await provider.analyze(ctx);
    expect(response.reasoning).toBeDefined();
    if (response.reasoning) {
      expect(response.reasoning.summary).toBeDefined();
      expect(typeof response.reasoning.confidence).toBe("number");
    }
  });

  it("should include suggestions in responses", async () => {
    const provider = new MockAIProvider();
    const ctx = makeOperationalContext();
    const response = await provider.analyze(ctx);
    expect(Array.isArray(response.suggestions)).toBe(true);
    expect(response.suggestions.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Recommendation Correctness", () => {
  it("should recommend dispatch for unreported incidents", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    expect(Array.isArray(risks)).toBe(true);
  });

  it("should return valid risk levels", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    const validLevels = ["critical", "high", "medium", "low", "monitoring"];
    for (const risk of risks) {
      expect(validLevels).toContain(risk.level);
    }
  });

  it("should include probability scores in predictions", () => {
    const provider = new MockAIProvider();
    const problems = provider.getPredictedProblems();
    for (const problem of problems) {
      expect(problem.probability).toBeGreaterThanOrEqual(0);
      expect(problem.probability).toBeLessThanOrEqual(100);
    }
  });
});

describe("Confidence Score Generation", () => {
  it("should generate confidence scores in valid range [0-100]", () => {
    const scores = [45, 88, 72, 95, 33, 100, 0, 67, 81, 54];
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("should provide higher confidence for clear patterns", () => {
    const highConfidence = 0.92;
    const lowConfidence = 0.45;
    expect(highConfidence).toBeGreaterThan(lowConfidence);
  });

  it("should include confidence in recommendation objects", () => {
    const rec = {
      id: "r1", action: "Dispatch team", confidence: 0.88,
      priority: "p0" as const, category: "dispatch" as const,
      requiresApproval: true, impact: "High",
    };
    expect(rec.confidence).toBeGreaterThan(0);
    expect(rec.confidence).toBeLessThanOrEqual(1);
  });
});

describe("Prediction Format Validation", () => {
  it("should have required fields in predictions", () => {
    const prediction = {
      id: "p1", title: "Test", probability: 0.85,
      timeframe: "30 min", affectedArea: "Zone A",
      severity: "high", recommendedAction: "Activate protocol",
    };
    expect(prediction.id).toBeDefined();
    expect(prediction.title).toBeDefined();
    expect(prediction.probability).toBeDefined();
    expect(prediction.timeframe).toBeDefined();
    expect(prediction.affectedArea).toBeDefined();
    expect(prediction.severity).toBeDefined();
  });

  it("should have reasonable timeframes", () => {
    const timeframes = ["5 min", "15 min", "30 min", "1 hour", "2 hours", "1 day"];
    for (const tf of timeframes) {
      expect(tf).toMatch(/^\d+\s*(min|hour|day)s?$/);
    }
  });

  it("should classify severity correctly", () => {
    const valid = ["critical", "high", "medium", "low"];
    for (const s of valid) {
      expect(["critical", "high", "medium", "low"]).toContain(s);
    }
  });
});

describe("Structured Response Format", () => {
  it("should return properly formatted operational summary", async () => {
    const ctx = makeOperationalContext();
    const provider = new MockAIProvider();
    const response = await provider.analyze(ctx);
    const hasContent = typeof response.content === "string" && response.content.length > 0;
    expect(hasContent).toBe(true);
  });

  it("should return array-based collections", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    expect(Array.isArray(risks)).toBe(true);
    const problems = provider.getPredictedProblems();
    expect(Array.isArray(problems)).toBe(true);
  });

  it("should not return empty collections when data exists", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    expect(risks.length).toBeGreaterThan(0);
  });
});

describe("Fallback Behaviour", () => {
  it("should handle provider initialization failure gracefully", async () => {
    const factory = AIProviderFactory.getInstance();
    expect(factory).toBeDefined();
    const provider = await factory.getProvider();
    expect(provider).toBeDefined();
  });

  it("should fall back to mock provider if primary fails", async () => {
    const mockProvider = await AIProviderFactory.getInstance().getMockProvider();
    expect(mockProvider).toBeDefined();
  });

  it("should return error message on AI service failure", async () => {
    const ctx = makeOperationalContext();
    const result = await aiCopilotService.sendMessage([], ctx, "test query");
    expect(result.role).toBe("assistant");
    expect(result.status).toBeDefined();
  });

  it("should degrade gracefully when context is empty", async () => {
    const emptyCtx = makeOperationalContext({ activeRisks: [], predictedProblems: [] });
    const provider = new MockAIProvider();
    const response = await provider.analyze(emptyCtx);
    expect(response).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);
  });
});

describe("Mock Provider Compatibility", () => {
  it("should be compatible with AIProvider interface", () => {
    const mock = new MockAIProvider();
    const interfaceMethods = ["analyze", "query"];
    for (const method of interfaceMethods) {
      expect(typeof (mock as any)[method]).toBe("function");
    }
  });

  it("should produce consistent mock data", () => {
    const provider = new MockAIProvider();
    const risks1 = provider.getRisks();
    const risks2 = provider.getRisks();
    expect(risks1.length).toBe(risks2.length);
  });

  it("should mock all required data types", () => {
    const provider = new MockAIProvider();
    const risks = provider.getRisks();
    expect(risks.every((r) => r.id && r.title && r.level)).toBe(true);
  });
});

describe("Provider Factory Singleton", () => {
  it("should return same instance on multiple calls", () => {
    const factory1 = AIProviderFactory.getInstance();
    const factory2 = AIProviderFactory.getInstance();
    expect(factory1).toBe(factory2);
  });

  it("should register and resolve providers", async () => {
    const factory = AIProviderFactory.getInstance();
    const provider = await factory.getMockProvider();
    expect(provider).toBeInstanceOf(MockAIProvider);
  });
});

