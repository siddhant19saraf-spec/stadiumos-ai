"use client";

import { useState, useEffect } from "react";
import type { A11ySummary } from "../types";
import { generateA11ySummary } from "../services/a11y-service";

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

function ScoreGauge({ value, label, sub }: { value: number; label: string; sub?: string }) {
  const color = value >= 90 ? "text-green-400 stroke-green-400" : value >= 75 ? "text-yellow-400 stroke-yellow-400" : "text-red-400 stroke-red-400";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle cx="50" cy="50" r="42" fill="none" className={color} strokeWidth="8" strokeDasharray={`${value * 2.64} 264`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-lg font-bold", color)}>{value}</span>
        </div>
      </div>
      <p className="text-xs text-white/60">{label}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

function IssueRow({ issue }: { issue: import("../types").A11yIssue }) {
  const sevColor = { critical: "bg-red-500/20 text-red-400", high: "bg-orange-500/20 text-orange-400", medium: "bg-yellow-500/20 text-yellow-400", low: "bg-blue-500/20 text-blue-400" };
  const statusColor = { open: "bg-red-500/20 text-red-400", in_progress: "bg-yellow-500/20 text-yellow-400", fixed: "bg-green-500/20 text-green-400", wont_fix: "bg-white/10 text-white/40" };
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-white/5 hover:bg-white/[0.02] transition-colors">
      <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", sevColor[issue.severity].replace("text", "bg").split(" ")[0])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium capitalize">{issue.module.replace(/-/g, " ")}</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] border", sevColor[issue.severity])}>{issue.severity}</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] border", statusColor[issue.status])}>{issue.status.replace("_", " ")}</span>
        </div>
        <p className="text-sm text-white/80">{issue.description}</p>
        <p className="text-xs text-white/40 mt-0.5">WCAG {issue.wcagCriteria} — {issue.recommendation}</p>
      </div>
    </div>
  );
}

function ModuleBar({ m }: { m: import("../types").A11yModuleScore }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="capitalize">{m.module.replace(/-/g, " ")}</span>
        <span className={cn(m.score >= 90 ? "text-green-400" : m.score >= 75 ? "text-yellow-400" : "text-red-400")}>{m.score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", m.score >= 90 ? "bg-green-500" : m.score >= 75 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${m.score}%` }} />
      </div>
      <p className="text-[10px] text-white/40">{m.passed}/{m.totalChecks} checks passed · {m.resolved}/{m.issues} issues resolved</p>
    </div>
  );
}

export default function A11yDashboard() {
  const [summary, setSummary] = useState<A11ySummary | null>(null);
  const [tab, setTab] = useState<"overview" | "modules" | "wcag" | "issues">("overview");

  useEffect(() => {
    setSummary(generateA11ySummary());
  }, []);

  if (!summary) return <div className="p-8 text-white/60" role="status">Loading Accessibility Center...</div>;

  const openIssues = summary.recentIssues.filter((i) => i.status !== "fixed");

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accessibility Center</h1>
          <p className="text-sm text-white/60">WCAG 2.2 AA Compliance & Inclusive Design Audit</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", summary.overallScore >= 85 ? "bg-green-500/20 text-green-400" : summary.overallScore >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>
            Score: {summary.overallScore}%
          </span>
          <span className="text-xs text-white/40">Last audit: {new Date(summary.lastAudit).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        <ScoreGauge value={summary.contrastScore} label="Contrast" sub="AA min 4.5:1" />
        <ScoreGauge value={summary.keyboardScore} label="Keyboard" sub="2.1.1 compliance" />
        <ScoreGauge value={summary.screenReaderScore} label="Screen Reader" sub="4.1.2 compliance" />
        <ScoreGauge value={summary.responsiveScore} label="Responsive" sub="1.4.10 reflow" />
        <ScoreGauge value={summary.motionScore} label="Motion" sub="Reduced motion" />
        <ScoreGauge value={summary.formsScore} label="Forms" sub="3.3.2 labels" />
        <ScoreGauge value={summary.dataVizScore} label="Data Viz" sub="1.4.1 color" />
        <ScoreGauge value={Math.round((summary.resolvedIssues / Math.max(1, summary.totalIssues)) * 100)} label="Fixed" sub={`${summary.resolvedIssues}/${summary.totalIssues}`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-white/5 p-1 w-fit" role="tablist" aria-label="Accessibility sections">
        {(["overview", "modules", "wcag", "issues"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("px-4 py-1.5 rounded text-sm font-medium transition-colors", tab === t ? "bg-cyan-500/20 text-cyan-400" : "text-white/60 hover:text-white/80")}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <h2 className="text-sm font-medium mb-4">WCAG 2.2 AA Criteria Status</h2>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {summary.criteriaResults.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-2 h-2 rounded-full", c.status === "pass" ? "bg-green-400" : c.status === "partial" ? "bg-yellow-400" : c.status === "fail" ? "bg-red-400" : "bg-white/20")} />
                    <span className="text-xs font-mono text-white/60 w-12">{c.id}</span>
                    <span className="text-sm">{c.name}</span>
                  </div>
                  <span className={cn("text-xs font-medium", c.status === "pass" ? "text-green-400" : c.status === "partial" ? "text-yellow-400" : c.status === "fail" ? "text-red-400" : "text-white/20")}>
                    {c.status === "not_applicable" ? "N/A" : c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-medium mb-3">Critical Issues</h2>
              <p className="text-3xl font-bold text-red-400">{summary.recentIssues.filter((i) => i.severity === "critical" && i.status !== "fixed").length}</p>
              <p className="text-xs text-white/40 mt-1">Requires immediate attention</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-medium mb-3">High Priority</h2>
              <p className="text-3xl font-bold text-orange-400">{summary.recentIssues.filter((i) => i.severity === "high" && i.status !== "fixed").length}</p>
              <p className="text-xs text-white/40 mt-1">Should be fixed this sprint</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <h2 className="text-sm font-medium mb-3">Recent Activity</h2>
              <p className="text-xs text-white/40">Last audit: {new Date(summary.lastAudit).toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">{summary.resolvedIssues} issues resolved</p>
            </div>
          </div>
        </div>
      )}

      {tab === "modules" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h2 className="text-sm font-medium mb-4">Module Compliance Scores</h2>
          <div className="grid grid-cols-2 gap-6">
            {summary.moduleScores.map((m) => (
              <ModuleBar key={m.module} m={m} />
            ))}
          </div>
        </div>
      )}

      {tab === "wcag" && (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <div className="divide-y divide-white/5">
            {summary.criteriaResults.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <span className={cn("w-2 h-2 rounded-full", c.status === "pass" ? "bg-green-400" : c.status === "partial" ? "bg-yellow-400" : c.status === "fail" ? "bg-red-400" : "bg-white/20")} />
                  <span className="text-xs font-mono text-white/60 w-12">{c.id}</span>
                  <div>
                    <span className="text-sm">{c.name}</span>
                    <span className="text-xs text-white/40 ml-2">Level {c.level}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 max-w-xs truncate">{c.description}</span>
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium", c.status === "pass" ? "bg-green-500/20 text-green-400" : c.status === "partial" ? "bg-yellow-500/20 text-yellow-400" : c.status === "fail" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/40")}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "issues" && (
        <div className="space-y-4">
          {openIssues.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <h2 className="text-sm font-medium text-red-400 mb-3">Open Issues ({openIssues.length})</h2>
              <div className="space-y-2">
                {openIssues.slice(0, 10).map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-medium">All Recent Issues</h2>
              <div className="flex gap-2 text-xs">
                <span className="text-red-400">{summary.recentIssues.filter((i) => i.status !== "fixed").length} open</span>
                <span className="text-green-400">{summary.recentIssues.filter((i) => i.status === "fixed").length} fixed</span>
              </div>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {summary.recentIssues.map((issue) => (
                <div key={issue.id} className="px-3 py-2">
                  <IssueRow issue={issue} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
