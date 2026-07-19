export type TestStatus = "passed" | "failed" | "skipped" | "running";
export type ModuleName =
  | "ai-copilot" | "command-center" | "crowd-intelligence" | "digital-twin"
  | "emergency-response" | "energy" | "enterprise-security" | "executive-analytics"
  | "maintenance" | "parking" | "performance" | "queue-intelligence"
  | "sustainability" | "tournament-ops" | "smart-parking";
export type TestType = "unit" | "integration" | "e2e" | "api" | "security" | "performance" | "accessibility" | "error-handling" | "ai-validation";

export interface QAModuleStatus {
  module: ModuleName;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  lastRun: string;
  status: TestStatus;
}

export interface QATestResult {
  id: string;
  module: ModuleName;
  type: TestType;
  name: string;
  status: TestStatus;
  durationMs: number;
  error?: string;
  timestamp: string;
}

export interface QASummary {
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  passRate: number;
  coverage: number;
  branchCoverage: number;
  functionCoverage: number;
  overallQuality: number;
  lastRun: string;
  buildStatus: "passing" | "failing" | "building";
  moduleStatuses: QAModuleStatus[];
  recentResults: QATestResult[];
  performance: {
    avgTestDurationMs: number;
    slowestModule: string;
    fastestModule: string;
    totalDurationMs: number;
  };
  securityScore: number;
  accessibilityScore: number;
  performanceScore: number;
}

export interface QABuildConfig {
  lintEnabled: boolean;
  typeCheckEnabled: boolean;
  unitTestsEnabled: boolean;
  integrationTestsEnabled: boolean;
  e2eTestsEnabled: boolean;
  securityTestsEnabled: boolean;
  accessibilityTestsEnabled: boolean;
  performanceTestsEnabled: boolean;
  coverageThreshold: number;
  minPassRate: number;
  failBuildOnThresholdViolation: boolean;
  parallelExecution: boolean;
  maxParallelJobs: number;
}
