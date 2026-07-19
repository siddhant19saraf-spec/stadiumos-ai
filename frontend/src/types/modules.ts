import type { BaseEntity, AlertSeverity, MetricValue } from "./common";
import type { UserRole } from "../lib/auth";

export interface Alert extends BaseEntity {
  userId: string;
  eventId?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface AILog extends BaseEntity {
  module: string;
  provider: "openai" | "gemini";
  promptTemplate: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  correlationId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  status: ModuleConnectionStatus;
  category: ModuleCategory;
}

export type ModuleConnectionStatus = "connected" | "disconnected" | "error" | "loading";
export type ModuleCategory =
  | "operations"
  | "intelligence"
  | "safety"
  | "experience"
  | "analytics";

export interface DashboardMetric {
  id: string;
  title: string;
  value: MetricValue;
  trend: "up" | "down" | "stable";
  trendValue: number;
}

