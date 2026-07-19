export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "sending" | "streaming" | "complete" | "error";
export type Priority = "critical" | "high" | "medium" | "low";
export type RiskLevel = "critical" | "high" | "medium" | "low" | "monitoring";
export type ActionCategory = "crowd" | "security" | "parking" | "staff" | "energy" | "maintenance" | "emergency" | "operations";

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  reasoning?: AIReasoning;
  suggestions?: string[];
}

export interface AIReasoning {
  summary: string;
  evidence: string[];
  confidence: number;
  priority: Priority;
  recommendedAction: string;
  expectedOutcome: string;
  alternatives?: DecisionOption[];
}

export interface DecisionOption {
  label: string;
  action: string;
  expectedReduction?: string;
  implementationCost: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  requiredStaff?: number;
  implementationTime: string;
  confidence: number;
}

export interface ActiveRisk {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  location?: string;
  module: string;
  timestamp: string;
  trend: "increasing" | "stable" | "decreasing";
  probability: number;
}

export interface PredictedProblem {
  id: string;
  title: string;
  detail: string;
  timeToOccur: string;
  probability: number;
  severity: Priority;
  affectedArea: string;
  recommendedAction: string;
}

export interface RecommendedDecision {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  businessImpact: string;
  confidence: number;
  category: ActionCategory;
  options: DecisionOption[];
  requiresConfirmation: boolean;
}

export interface OperationalSummary {
  overallStatus: "healthy" | "moderate" | "critical";
  activeIncidents: number;
  totalVisitors: number;
  capacityUsed: number;
  staffOnDuty: number;
  systemHealth: number;
  highlights: string[];
  lastUpdated: string;
}

export interface OperationalContext {
  stadiumName: string;
  tournamentName: string;
  currentMatch: string;
  attendance: number;
  capacity: number;
  weather: string;
  temperature: number;
  crowdDensity: number;
  parkingOccupancy: number;
  avgQueueTime: number;
  staffAvailability: number;
  emergencyAlerts: number;
  energyUsage: number;
  revenue: number;
  fanSatisfaction: number;
  activeRisks: ActiveRisk[];
  predictedProblems: PredictedProblem[];
  timeOfDay: string;
  eventPhase: string;
}

export interface ActionExecution {
  id: string;
  action: string;
  status: "pending" | "confirmed" | "executing" | "completed" | "failed";
  result?: string;
  timestamp: string;
}

export interface AIProviderConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  apiKey?: string;
}

export interface AIProviderResponse {
  content: string;
  reasoning: AIReasoning;
  suggestions: string[];
  raw: string;
}

export interface AIProvider {
  readonly name: string;
  analyze(context: OperationalContext): Promise<AIProviderResponse>;
  query(context: OperationalContext, question: string): Promise<AIProviderResponse>;
  generateAlert(context: OperationalContext, trigger: string): Promise<AIProviderResponse>;
  compareDecisions(context: OperationalContext, scenario: string, options: string[]): Promise<{ recommendation: string; reasoning: AIReasoning }>;
  summarize(context: OperationalContext): Promise<AIProviderResponse>;
  isAvailable(): Promise<boolean>;
}

export interface CopilotState {
  messages: CopilotMessage[];
  isProcessing: boolean;
  activeRisks: ActiveRisk[];
  predictedProblems: PredictedProblem[];
  operationalSummary: OperationalSummary | null;
  recentActions: ActionExecution[];
  context: OperationalContext | null;
}
