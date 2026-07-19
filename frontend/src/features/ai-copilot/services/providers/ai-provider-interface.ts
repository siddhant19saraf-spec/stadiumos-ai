import type { OperationalContext, AIReasoning, CopilotMessage } from "../../types";

export interface AIProviderResponse {
  content: string;
  reasoning: AIReasoning;
  suggestions: string[];
  raw: string;
}

export interface AIProvider {
  readonly name: string;

  /** Analyze full operational context and return insights */
  analyze(context: OperationalContext): Promise<AIProviderResponse>;

  /** Answer a specific operator query within context */
  query(context: OperationalContext, question: string): Promise<AIProviderResponse>;

  /** Generate a proactive alert based on detected anomalies */
  generateAlert(context: OperationalContext, trigger: string): Promise<AIProviderResponse>;

  /** Compare decision options for a given scenario */
  compareDecisions(
    context: OperationalContext,
    scenario: string,
    options: string[],
  ): Promise<{ recommendation: string; reasoning: AIReasoning }>;

  /** Generate an executive summary */
  summarize(context: OperationalContext): Promise<AIProviderResponse>;

  /** Check if the provider is available */
  isAvailable(): Promise<boolean>;
}
