import type { AIProvider } from "./ai-provider-interface";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import { GeminiProvider } from "./gemini-provider";

type ProviderType = "mock" | "openai" | "gemini";

export class AIProviderFactory {
  private static instance: AIProviderFactory;
  private provider: AIProvider | null = null;
  private providerType: ProviderType = "mock";

  private constructor() {}

  static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }

  setProvider(type: ProviderType): void {
    this.providerType = type;
    this.provider = null;
  }

  getProviderType(): ProviderType {
    return this.providerType;
  }

  async getProvider(): Promise<AIProvider> {
    if (this.provider) return this.provider;

    switch (this.providerType) {
      case "openai":
        this.provider = new OpenAIProvider();
        if (!(await this.provider.isAvailable())) {
          console.warn("OpenAI provider not available (missing API key). Falling back to mock.");
          this.provider = new MockAIProvider();
        }
        break;

      case "gemini":
        this.provider = new GeminiProvider();
        if (!(await this.provider.isAvailable())) {
          console.warn("Gemini provider not available (missing API key). Falling back to mock.");
          this.provider = new MockAIProvider();
        }
        break;

      case "mock":
      default:
        this.provider = new MockAIProvider();
        break;
    }

    return this.provider;
  }

  async getMockProvider(): Promise<MockAIProvider> {
    const provider = await this.getProvider();
    if (provider instanceof MockAIProvider) return provider;
    return new MockAIProvider();
  }
}
