export type WCAGLevel = "A" | "AA" | "AAA";
export type IssueStatus = "open" | "fixed" | "wont_fix" | "in_progress";
export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type ModuleName =
  | "executive-dashboard" | "ai-copilot" | "crowd-intelligence" | "emergency-response"
  | "tournament-ops" | "digital-twin" | "smart-parking" | "queue-intelligence"
  | "predictive-maintenance" | "energy-sustainability" | "security-center"
  | "settings" | "reports" | "authentication" | "performance-center" | "qa-dashboard";

export interface WCAGCriteria {
  id: string;
  name: string;
  level: WCAGLevel;
  description: string;
  status: "pass" | "fail" | "partial" | "not_applicable";
  notes?: string;
}

export interface A11yIssue {
  id: string;
  module: ModuleName;
  wcagCriteria: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  impact: string;
  recommendation: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface A11yModuleScore {
  module: ModuleName;
  totalChecks: number;
  passed: number;
  failed: number;
  partial: number;
  score: number;
  issues: number;
  resolved: number;
}

export interface A11ySummary {
  overallScore: number;
  totalIssues: number;
  resolvedIssues: number;
  openIssues: number;
  moduleScores: A11yModuleScore[];
  criteriaResults: WCAGCriteria[];
  recentIssues: A11yIssue[];
  contrastScore: number;
  keyboardScore: number;
  screenReaderScore: number;
  responsiveScore: number;
  motionScore: number;
  formsScore: number;
  dataVizScore: number;
  lastAudit: string;
}

export interface ContrastPair {
  foreground: string;
  background: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  usage: string;
}
