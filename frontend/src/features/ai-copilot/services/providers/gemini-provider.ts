import type { AIProvider, AIProviderResponse, OperationalContext, AIReasoning } from "../../types";
import { SYSTEM_PROMPTS } from "../../prompts/system-prompts";
import { buildFullContext, buildQueryContext } from "../../prompts/context-builders";
import { formatAIResponse } from "../../prompts/response-formatters";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model = "gemini-1.5-pro") {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY ?? "";
    this.model = model;
  }

  async analyze(context: OperationalContext): Promise<AIProviderResponse> {
    const prompt = [
      SYSTEM_PROMPTS.analysis,
      "",
      buildFullContext(context),
    ].join("\n");
    return this.callAPI(prompt);
  }

  async query(context: OperationalContext, question: string): Promise<AIProviderResponse> {
    const prompt = [
      SYSTEM_PROMPTS.main,
      "",
      buildQueryContext(context, question),
    ].join("\n");
    return this.callAPI(prompt);
  }

  async generateAlert(context: OperationalContext, trigger: string): Promise<AIProviderResponse> {
    const prompt = [
      SYSTEM_PROMPTS.main,
      `ALERT TRIGGER: ${trigger}`,
      buildFullContext(context),
      "Generate a proactive alert with specific recommended actions.",
    ].join("\n");
    return this.callAPI(prompt);
  }

  async compareDecisions(
    context: OperationalContext,
    scenario: string,
    options: string[],
  ): Promise<{ recommendation: string; reasoning: AIReasoning }> {
    const prompt = [
      SYSTEM_PROMPTS.decision,
      `SCENARIO: ${scenario}`,
      buildFullContext(context),
      "OPTIONS TO EVALUATE:",
      ...options.map((o, i) => `Option ${String.fromCharCode(65 + i)}: ${o}`),
    ].join("\n");
    const response = await this.callAPI(prompt);
    return { recommendation: response.reasoning.summary, reasoning: response.reasoning };
  }

  async summarize(context: OperationalContext): Promise<AIProviderResponse> {
    const prompt = [SYSTEM_PROMPTS.summary, buildFullContext(context)].join("\n");
    return this.callAPI(prompt);
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  private async callAPI(prompt: string): Promise<AIProviderResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.3,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const json = await response.json() as {
      candidates: Array<{
        content: { parts: Array<{ text: string }> };
      }>;
    };
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const formatted = formatAIResponse(raw);

    return {
      content: formatted.content,
      reasoning: formatted.reasoning ?? {
        summary: raw.slice(0, 200),
        evidence: ["AI analysis complete"],
        confidence: 85,
        priority: "medium",
        recommendedAction: "Review AI assessment",
        expectedOutcome: "Awaiting operator confirmation",
      },
      suggestions: formatted.suggestions ?? [],
      raw,
    };
  }
}

