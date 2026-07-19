// @ts-nocheck
import type {
  CopilotMessage,
  OperationalContext,
  ActiveRisk,
  PredictedProblem,
  OperationalSummary,
  ActionExecution,
  AIReasoning,
} from "../types";
import { AIProviderFactory } from "./providers/provider-factory";
import { MockAIProvider } from "./providers/mock-provider";

function generateId(): string {
  return `copilot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class AICopilotService {
  private providerFactory = AIProviderFactory.getInstance();
  private mockContext: OperationalContext | null = null;

  private buildDefaultContext(): OperationalContext {
    const attendance = randomInt(25000, 72000);
    const capacity = 75000;
    const crowdDensity = randomInt(35, 92);
    const parkingOccupancy = randomInt(45, 97);
    const avgQueueTime = randomFloat(3, 22);
    const staffAvailability = randomFloat(65, 100);
    const emergencyAlerts = Math.random() > 0.6 ? randomInt(1, 3) : 0;
    const energyUsage = randomFloat(250, 800);
    const revenue = randomInt(200000, 2200000);
    const fanSatisfaction = randomFloat(3.5, 4.9);

    const riskLevels: ActiveRisk["level"][] = ["critical", "high", "medium", "low", "monitoring"];
    const activeRisks: ActiveRisk[] = [
      {
        id: generateId(),
        title: "East Gate Congestion",
        description: `Crowd density at East Gate has reached ${crowdDensity + randomInt(0, 8)}%, approaching critical threshold`,
        level: crowdDensity > 75 ? "high" : "medium",
        location: "East Gate",
        module: "Crowd",
        trend: crowdDensity > 70 ? "increasing" : "stable",
        probability: randomInt(75, 95),
        timestamp: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: "Parking Lot C Near Capacity",
        description: `Parking Lot C is at ${parkingOccupancy + randomInt(0, 5)}% occupancy. Overflow expected within 25 minutes`,
        level: parkingOccupancy > 85 ? "high" : "medium",
        location: "Parking Lot C",
        module: "Parking",
        trend: "increasing",
        probability: randomInt(80, 95),
        timestamp: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: "Food Court B Queue Spiking",
        description: `Queue at Food Court B has grown to ${avgQueueTime + randomInt(2, 8)} minutes`,
        level: avgQueueTime > 12 ? "medium" : "low",
        location: "Food Court B",
        module: "Queue",
        trend: avgQueueTime > 10 ? "increasing" : "stable",
        probability: randomInt(65, 85),
        timestamp: new Date().toISOString(),
      },
    ];

    if (emergencyAlerts > 0) {
      activeRisks.unshift({
        id: generateId(),
        title: "Active Security Incident",
        description: `${emergencyAlerts} active incident(s) requiring coordination`,
        level: "high",
        location: "Multiple zones",
        module: "Security",
        trend: "stable",
        probability: 90,
        timestamp: new Date().toISOString(),
      });
    }

    const predictedProblems: PredictedProblem[] = [
      {
        id: generateId(),
        title: "Parking Overflow",
        detail: `Parking Lot C will reach 100% capacity in ${randomInt(15, 30)} minutes`,
        timeToOccur: `${randomInt(15, 30)} min`,
        probability: randomInt(75, 95),
        severity: parkingOccupancy > 85 ? "high" : "medium",
        affectedArea: "Parking Lot C",
        recommendedAction: "Activate overflow protocol, redirect to Lot E",
      },
      {
        id: generateId(),
        title: "Halftime Queue Surge",
        detail: "Concession queues predicted to spike during halftime",
        timeToOccur: `${randomInt(15, 25)} min`,
        probability: randomInt(80, 95),
        severity: "high",
        affectedArea: "All Food Courts",
        recommendedAction: "Activate standby counters, deploy additional staff",
      },
      {
        id: generateId(),
        title: "Crowd Congestion at West Concourse",
        detail: "West Concourse approaching capacity with limited exit options",
        timeToOccur: `${randomInt(20, 40)} min`,
        probability: randomInt(60, 85),
        severity: crowdDensity > 80 ? "high" : "medium",
        affectedArea: "West Concourse",
        recommendedAction: "Open auxiliary exits, redirect flow to North Concourse",
      },
    ];

    const matchTeams = [
      ["FC Barcelona", "Real Madrid"],
      ["Manchester City", "Bayern Munich"],
      ["Paris Saint-Germain", "Liverpool FC"],
      ["Juventus", "AC Milan"],
    ];
    const matchPair = matchTeams[randomInt(0, matchTeams.length - 1)] ?? matchTeams[0]!;
    const weatherConditions = ["Clear", "Partly Cloudy", "Sunny", "Light Rain", "Cloudy"];

    this.mockContext = {
      stadiumName: "Lusail Iconic Stadium",
      tournamentName: "FIFA World Cup 2026",
      currentMatch: `${matchPair[0]} vs ${matchPair[1]}`,
      attendance,
      capacity,
      weather: weatherConditions[randomInt(0, weatherConditions.length - 1)] ?? "Clear",
      temperature: randomInt(26, 38),
      crowdDensity,
      parkingOccupancy,
      avgQueueTime,
      staffAvailability,
      emergencyAlerts,
      energyUsage,
      revenue,
      fanSatisfaction,
      activeRisks,
      predictedProblems,
      timeOfDay: "Afternoon",
      eventPhase: "Second Half",
    };

    return this.mockContext;
  }

  async getOperationalContext(): Promise<OperationalContext> {
    return this.buildDefaultContext();
  }

  async refreshContext(): Promise<OperationalContext> {
    // Simulate data refresh with slight variations
    const base = this.mockContext ?? this.buildDefaultContext();
    return {
      ...base,
      crowdDensity: Math.min(100, base.crowdDensity + randomInt(-5, 5)),
      parkingOccupancy: Math.min(100, base.parkingOccupancy + randomInt(-3, 5)),
      avgQueueTime: Math.max(0, base.avgQueueTime + randomFloat(-2, 3)),
      staffAvailability: Math.min(100, base.staffAvailability + randomFloat(-3, 2)),
      energyUsage: Math.max(0, base.energyUsage + randomFloat(-30, 30)),
      revenue: base.revenue + randomInt(-10000, 15000),
    };
  }

  async sendMessage(
    messages: CopilotMessage[],
    context: OperationalContext,
    query: string,
    onUpdate?: (message: CopilotMessage) => void,
  ): Promise<CopilotMessage> {
    const provider = await this.providerFactory.getProvider();
    const messageId = generateId();

    const userMessage: CopilotMessage = {
      id: `user-${messageId}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
      status: "complete",
    };

    const assistantMessage: CopilotMessage = {
      id: messageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      status: "streaming",
    };

    onUpdate?.(userMessage);
    onUpdate?.(assistantMessage);

    try {
      const response = await provider.query(context, query);
      const mockProvider = await this.providerFactory.getMockProvider();

      const completeMessage: CopilotMessage = {
        id: messageId,
        role: "assistant",
        content: response.content,
        timestamp: new Date().toISOString(),
        status: "complete",
        reasoning: response.reasoning,
        suggestions: mockProvider instanceof MockAIProvider
          ? generateContextualSuggestions(context)
          : response.suggestions,
      };

      onUpdate?.(completeMessage);
      return completeMessage;
    } catch (error) {
      const errorMessage: CopilotMessage = {
        id: messageId,
        role: "assistant",
        content: "I encountered an error analyzing the operational data. Please try again or check system connectivity.",
        timestamp: new Date().toISOString(),
        status: "error",
        reasoning: {
          summary: "AI analysis unavailable due to system error",
          evidence: [`Error: ${error instanceof Error ? error.message : "Unknown error"}`],
          confidence: 0,
          priority: "low",
          recommendedAction: "Retry the query or contact system administrator",
          expectedOutcome: "System functionality restored after retry",
        },
      };

      onUpdate?.(errorMessage);
      return errorMessage;
    }
  }

  async getInitialAnalysis(): Promise<{
    message: CopilotMessage;
    summary: OperationalSummary;
    risks: ActiveRisk[];
    problems: PredictedProblem[];
    context: OperationalContext;
  }> {
    const context = await this.getOperationalContext();
    const provider = await this.providerFactory.getProvider();
    const mockProvider = await this.providerFactory.getMockProvider();

    const response = await provider.analyze(context);
    const messageId = generateId();

    const risks = mockProvider instanceof MockAIProvider
      ? mockProvider.getRisks()
      : context.activeRisks;

    const problems = mockProvider instanceof MockAIProvider
      ? mockProvider.getPredictedProblems()
      : context.predictedProblems;

    const message: CopilotMessage = {
      id: messageId,
      role: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
      status: "complete",
      reasoning: response.reasoning,
      suggestions: generateContextualSuggestions(context),
    };

    const incidentCount = risks.filter((r) => r.level === "critical" || r.level === "high").length;

    const summary: OperationalSummary = {
      overallStatus: incidentCount > 2 ? "critical" : incidentCount > 0 ? "moderate" : "healthy",
      activeIncidents: incidentCount,
      totalVisitors: context.attendance,
      capacityUsed: Math.round((context.attendance / context.capacity) * 100),
      staffOnDuty: Math.round(context.staffAvailability * 10),
      systemHealth: Math.round(Math.random() * 10 + 90),
      highlights: [
        `Crowd density at ${context.crowdDensity}%`,
        `Parking at ${context.parkingOccupancy}% capacity`,
        `Queue times averaging ${context.avgQueueTime} minutes`,
        ...(incidentCount > 0 ? [`${incidentCount} active high-priority incidents`] : ["No critical incidents"]),
      ],
      lastUpdated: new Date().toISOString(),
    };

    return { message, summary, risks, problems, context };
  }

  async executeAction(
    action: string,
    _context: OperationalContext,
  ): Promise<ActionExecution> {
    const id = generateId();
    const exec: ActionExecution = {
      id,
      action,
      status: "executing",
      timestamp: new Date().toISOString(),
    };

    await new Promise((r) => setTimeout(r, 1500));

    return {
      ...exec,
      status: "completed",
      result: `Successfully executed: ${action}. All systems responding as expected.`,
    };
  }
}

function generateContextualSuggestions(context: OperationalContext): string[] {
  const s: string[] = [];
  if (context.crowdDensity > 70) s.push("Show crowd heatmap and pinch points");
  if (context.parkingOccupancy > 80) s.push("Where should I redirect parking?");
  if (context.emergencyAlerts > 0) s.push("Show emergency status");
  if (context.avgQueueTime > 10) s.push("How can I reduce queue times?");
  if (context.staffAvailability < 80) s.push("Optimize staff allocation");
  s.push("What should I do right now?");
  s.push("Summarize today's operations");
  return s.slice(0, 5);
}

function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

export const aiCopilotService = new AICopilotService();

