import type { A11ySummary, A11yModuleScore, A11yIssue, ModuleName } from "../types";

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MODULES: ModuleName[] = [
  "executive-dashboard", "ai-copilot", "crowd-intelligence", "emergency-response",
  "tournament-ops", "digital-twin", "smart-parking", "queue-intelligence",
  "predictive-maintenance", "energy-sustainability", "security-center",
  "settings", "reports", "authentication", "performance-center", "qa-dashboard",
];

const WCAG_CRITERIA: Array<{ id: string; name: string; level: "A" | "AA" | "AAA"; description: string }> = [
  { id: "1.1.1", name: "Non-text Content", level: "A", description: "All non-text content has text alternatives" },
  { id: "1.4.1", name: "Use of Color", level: "A", description: "Color is not the only means of conveying information" },
  { id: "1.4.3", name: "Contrast Minimum", level: "AA", description: "Text contrast ratio of at least 4.5:1" },
  { id: "1.4.4", name: "Resize Text", level: "AA", description: "Text can be resized up to 200% without loss of content" },
  { id: "1.4.10", name: "Reflow", level: "AA", description: "Content can be presented without loss of information at 320px" },
  { id: "1.4.11", name: "Non-text Contrast", level: "AA", description: "UI components have 3:1 contrast ratio" },
  { id: "1.4.12", name: "Text Spacing", level: "AA", description: "No loss of content when text spacing adjusted" },
  { id: "2.1.1", name: "Keyboard", level: "A", description: "All functionality available via keyboard" },
  { id: "2.1.2", name: "No Keyboard Trap", level: "A", description: "No keyboard traps in content" },
  { id: "2.4.1", name: "Bypass Blocks", level: "A", description: "Skip links provided to bypass repeated content" },
  { id: "2.4.3", name: "Focus Order", level: "A", description: "Focus order preserves meaningful sequence" },
  { id: "2.4.4", name: "Link Purpose", level: "A", description: "Link purpose is determinable from link text alone" },
  { id: "2.4.6", name: "Headings and Labels", level: "AA", description: "Headings and labels describe topic or purpose" },
  { id: "2.4.7", name: "Focus Visible", level: "AA", description: "Keyboard focus indicator is visible" },
  { id: "2.5.3", name: "Label in Name", level: "A", description: "Accessible name contains visible label text" },
  { id: "2.5.7", name: "Dragging Movements", level: "AA", description: "Dragging alternatives provided" },
  { id: "3.1.1", name: "Language of Page", level: "A", description: "Page language is programmatically determinable" },
  { id: "3.2.1", name: "On Focus", level: "A", description: "Focus does not initiate unexpected context changes" },
  { id: "3.2.2", name: "On Input", level: "A", description: "Input does not initiate unexpected context changes" },
  { id: "3.3.1", name: "Error Identification", level: "A", description: "Errors are identified and described in text" },
  { id: "3.3.2", name: "Labels or Instructions", level: "A", description: "Labels or instructions provided for input" },
  { id: "3.3.3", name: "Error Suggestion", level: "AA", description: "Suggestions provided for input errors" },
  { id: "3.3.4", name: "Error Prevention", level: "AA", description: "Reversible, checked, or confirmed submissions" },
  { id: "4.1.2", name: "Name, Role, Value", level: "A", description: "All UI elements have name, role, and value" },
  { id: "4.1.3", name: "Status Messages", level: "AA", description: "Status messages announced by assistive tech" },
];

const ISSUE_TEMPLATES: Array<{ wcag: string; desc: string; sev: "critical" | "high" | "medium" | "low" }> = [
  { wcag: "1.4.3", desc: "Text color insufficient contrast against dark background", sev: "high" },
  { wcag: "2.4.7", desc: "Focus indicator missing on interactive elements", sev: "high" },
  { wcag: "2.1.1", desc: "Dropdown not keyboard accessible", sev: "critical" },
  { wcag: "1.4.1", desc: "Status indicators use color only", sev: "medium" },
  { wcag: "4.1.2", desc: "Custom button missing aria-label", sev: "high" },
  { wcag: "2.4.4", desc: "Link text too generic ('Click here')", sev: "medium" },
  { wcag: "3.3.2", desc: "Form field missing associated label", sev: "critical" },
  { wcag: "1.1.1", desc: "Icon button missing accessible name", sev: "high" },
  { wcag: "2.4.1", desc: "Skip navigation link not implemented", sev: "high" },
  { wcag: "1.4.11", desc: "Inactive button lacks sufficient contrast", sev: "medium" },
  { wcag: "2.5.3", desc: "Accessible name doesn't match visible text", sev: "medium" },
  { wcag: "3.3.1", desc: "Error messages not programmatically associated with inputs", sev: "high" },
  { wcag: "4.1.3", desc: "Loading state not announced by screen reader", sev: "medium" },
  { wcag: "1.4.4", desc: "Text does not reflow properly at 200% zoom", sev: "medium" },
  { wcag: "2.1.2", desc: "Modal dialog traps keyboard incorrectly", sev: "critical" },
];

function generateModuleScore(module: ModuleName, _index: number): A11yModuleScore {
  const totalChecks = WCAG_CRITERIA.length;
  const base = Math.round(totalChecks * (0.78 + Math.random() * 0.18));
  const passed = Math.min(totalChecks, base);
  const failed = Math.round((totalChecks - passed) * Math.random());
  const partial = totalChecks - passed - failed;
  const score = Math.round((passed / totalChecks) * 100);
  const totalIssues = rand(1, 8 + (100 - score) / 10);
  const resolved = Math.round(totalIssues * (0.3 + Math.random() * 0.5));
  return {
    module, totalChecks, passed, failed: Math.max(0, failed), partial: Math.max(0, partial),
    score, issues: Math.round(totalIssues), resolved,
  };
}

function generateIssues(): A11yIssue[] {
  const issues: A11yIssue[] = [];
  for (let i = 0; i < 30; i++) {
    const template = ISSUE_TEMPLATES[rand(0, ISSUE_TEMPLATES.length - 1)]!;
    const module = MODULES[rand(0, MODULES.length - 1)]!;
    const isFixed = Math.random() > 0.6;
    issues.push({
      id: `a11y-${Date.now().toString(36)}-${i}`,
      module,
      wcagCriteria: template.wcag,
      description: template.desc,
      severity: template.sev,
      status: isFixed ? "fixed" : (["open", "in_progress", "wont_fix"] as const)[rand(0, 2)]!,
      impact: template.sev === "critical" || template.sev === "high" ? "Prevents users with disabilities from completing tasks" : "Minor inconvenience for assistive technology users",
      recommendation: `Ensure ${template.wcag} compliance by following WCAG techniques`,
      createdAt: new Date(Date.now() - rand(0, 30) * 86400000).toISOString(),
      resolvedAt: isFixed ? new Date(Date.now() - rand(0, 5) * 86400000).toISOString() : undefined,
    });
  }
  return issues;
}

export function generateA11ySummary(): A11ySummary {
  const moduleScores = MODULES.map((m, i) => generateModuleScore(m, i));
  const avgScore = Math.round(moduleScores.reduce((s, m) => s + m.score, 0) / moduleScores.length);
  const allIssues = generateIssues();
  const resolved = allIssues.filter((i) => i.status === "fixed").length;
  const open = allIssues.filter((i) => i.status === "open" || i.status === "in_progress").length;

  return {
    overallScore: avgScore,
    totalIssues: allIssues.length,
    resolvedIssues: resolved,
    openIssues: open,
    moduleScores,
    criteriaResults: WCAG_CRITERIA.map((c) => ({
      ...c,
      status: (Math.random() > 0.2 ? "pass" : Math.random() > 0.5 ? "partial" : "fail") as "pass" | "fail" | "partial" | "not_applicable",
    })),
    recentIssues: allIssues.slice(0, 15),
    contrastScore: rand(78, 96),
    keyboardScore: rand(75, 95),
    screenReaderScore: rand(72, 94),
    responsiveScore: rand(80, 98),
    motionScore: rand(85, 99),
    formsScore: rand(70, 93),
    dataVizScore: rand(68, 92),
    lastAudit: new Date().toISOString(),
  };
}

