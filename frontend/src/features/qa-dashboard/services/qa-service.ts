import type { QASummary, QAModuleStatus, QATestResult, QABuildConfig, ModuleName, TestType, TestStatus } from "../types";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rands(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

const MODULES: ModuleName[] = [
  "ai-copilot", "command-center", "crowd-intelligence", "digital-twin",
  "emergency-response", "energy", "enterprise-security", "executive-analytics",
  "maintenance", "parking", "performance", "queue-intelligence",
  "sustainability", "tournament-ops", "smart-parking",
];

const TEST_TYPES: TestType[] = [
  "unit", "integration", "e2e", "api", "security", "performance", "accessibility", "error-handling", "ai-validation",
];

function generateModuleStatus(module: ModuleName, index: number): QAModuleStatus {
  const total = rand(80, 250);
  const passed = Math.round(total * rands(0.88, 0.99));
  const failed = Math.round(total * rands(0.01, 0.06));
  const skipped = total - passed - failed;
  const status: TestStatus = failed > total * 0.05 ? "failed" : "passed";
  return {
    module,
    totalTests: total,
    passed,
    failed,
    skipped: Math.max(0, skipped),
    coverage: Math.round(rands(82, 97)),
    lastRun: new Date(Date.now() - rand(0, 3600000)).toISOString(),
    status,
  };
}

function generateTestResults(): QATestResult[] {
  const results: QATestResult[] = [];
  for (let i = 0; i < 50; i++) {
    const module = MODULES[rand(0, MODULES.length - 1)]!;
    const type = TEST_TYPES[rand(0, TEST_TYPES.length - 1)]!;
    const passed = Math.random() > 0.08;
    results.push({
      id: `test-${Date.now().toString(36)}-${i}`,
      module,
      type,
      name: `${module}:${type}:${["should handle edge case", "should compute correctly", "should validate input", "should reject invalid", "should return expected format", "should maintain state", "should recover from error", "should enforce security", "should pass accessibility check"][rand(0, 8)]} #${i + 1}`,
      status: passed ? "passed" : "failed",
      durationMs: rand(5, 1200),
      error: passed ? undefined : `Expected X but got Y (module: ${module})`,
      timestamp: new Date(Date.now() - rand(0, 7200000)).toISOString(),
    });
  }
  return results;
}

export function generateQASummary(): QASummary {
  const moduleStatuses = MODULES.map((m, i) => generateModuleStatus(m, i));
  const totalTests = moduleStatuses.reduce((s, m) => s + m.totalTests, 0);
  const totalPassed = moduleStatuses.reduce((s, m) => s + m.passed, 0);
  const totalFailed = moduleStatuses.reduce((s, m) => s + m.failed, 0);
  const totalSkipped = moduleStatuses.reduce((s, m) => s + m.skipped, 0);
  const avgCoverage = Math.round(moduleStatuses.reduce((s, m) => s + m.coverage, 0) / moduleStatuses.length);
  const durations = moduleStatuses.map((m) => rand(500, 8000));
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  return {
    totalTests,
    totalPassed,
    totalFailed,
    totalSkipped,
    passRate: Math.round((totalPassed / Math.max(1, totalTests)) * 100),
    coverage: avgCoverage,
    branchCoverage: Math.max(70, avgCoverage - rand(3, 8)),
    functionCoverage: Math.max(75, avgCoverage - rand(1, 5)),
    overallQuality: Math.round((avgCoverage * 0.3 + (totalPassed / Math.max(1, totalTests)) * 100 * 0.3 + rands(80, 95) * 0.4)),
    lastRun: new Date().toISOString(),
    buildStatus: totalFailed > totalTests * 0.05 ? "failing" : "passing",
    moduleStatuses,
    recentResults: generateTestResults(),
    performance: {
      avgTestDurationMs: Math.round(durations.reduce((s, d) => s + d, 0) / durations.length),
      slowestModule: MODULES[durations.indexOf(maxDuration)]!,
      fastestModule: MODULES[durations.indexOf(minDuration)]!,
      totalDurationMs: durations.reduce((s, d) => s + d, 0),
    },
    securityScore: rand(82, 96),
    accessibilityScore: rand(85, 98),
    performanceScore: rand(78, 94),
  };
}

export function getDefaultBuildConfig(): QABuildConfig {
  return {
    lintEnabled: true,
    typeCheckEnabled: true,
    unitTestsEnabled: true,
    integrationTestsEnabled: true,
    e2eTestsEnabled: true,
    securityTestsEnabled: true,
    accessibilityTestsEnabled: true,
    performanceTestsEnabled: true,
    coverageThreshold: 80,
    minPassRate: 95,
    failBuildOnThresholdViolation: true,
    parallelExecution: true,
    maxParallelJobs: 4,
  };
}
