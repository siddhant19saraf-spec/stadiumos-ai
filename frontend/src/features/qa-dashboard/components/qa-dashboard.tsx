"use client";

import { useState, useEffect, useMemo } from "react";
import type { QASummary, QAModuleStatus, QATestResult, QABuildConfig, TestType } from "../types";
import { generateQASummary, getDefaultBuildConfig } from "../services/qa-service";

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

const TYPE_COLORS: Record<TestType, string> = {
  unit: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  integration: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  e2e: "bg-green-500/20 text-green-400 border-green-500/30",
  api: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  security: "bg-red-500/20 text-red-400 border-red-500/30",
  performance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accessibility: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "error-handling": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "ai-validation": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="text-sm text-white/60">{label}</p>
      <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = "bg-cyan-500", label }: { value: number; max?: number; color?: string; label?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-white/60 flex justify-between"><span>{label}</span><span>{pct}%</span></p>}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ModuleRow({ m }: { m: QAModuleStatus }) {
  const borderColor = m.status === "passed" ? "border-green-500/30" : "border-red-500/30";
  const textColor = m.status === "passed" ? "text-green-400" : "text-red-400";
  return (
    <div className={cn("flex items-center justify-between p-3 rounded-lg border bg-white/[0.02]", borderColor)}>
      <div className="flex items-center gap-3">
        <span className={cn("w-2 h-2 rounded-full", textColor.replace("text", "bg"))} />
        <span className="text-sm font-medium capitalize">{m.module.replace(/-/g, " ")}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-white/60">
        <span>{m.passed}/{m.totalTests}</span>
        <span className={cn("font-medium", m.failed > 0 ? "text-red-400" : "text-green-400")}>{m.coverage}%</span>
        <span className={textColor}>{m.status}</span>
      </div>
    </div>
  );
}

function TestResultRow({ t }: { t: QATestResult }) {
  return (
    <div className="flex items-center justify-between p-2 rounded text-xs border border-white/5">
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", t.status === "passed" ? "bg-green-400" : "bg-red-400")} />
        <span className="truncate max-w-[300px]">{t.name}</span>
        <span className={cn("px-1.5 py-0.5 rounded text-[10px] border", TYPE_COLORS[t.type])}>{t.type}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-white/40">{t.durationMs}ms</span>
        <span className={t.status === "passed" ? "text-green-400" : "text-red-400"}>{t.status}</span>
      </div>
    </div>
  );
}

export default function QADashboard() {
  const [summary, setSummary] = useState<QASummary | null>(null);
  const [config] = useState<QABuildConfig>(getDefaultBuildConfig);
  const [tab, setTab] = useState<"overview" | "modules" | "results" | "config">("overview");

  useEffect(() => {
    setSummary(generateQASummary());
  }, []);

  const failedResults = useMemo(() => summary?.recentResults.filter((r) => r.status === "failed") ?? [], [summary]);

  if (!summary) return <div className="p-8 text-white/60">Loading QA Dashboard...</div>;

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QA Dashboard</h1>
          <p className="text-sm text-white/60">Enterprise Quality Engineering Command Center</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("px-3 py-1 rounded-full text-sm font-medium", summary.buildStatus === "passing" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
            {summary.buildStatus === "passing" ? "PASSING" : "FAILING"}
          </span>
          <span className="text-xs text-white/40">Last run: {new Date(summary.lastRun).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="url(#gauge)" strokeWidth="8" strokeDasharray={`${summary.overallQuality * 2.64} 264`} strokeLinecap="round" />
              <defs><linearGradient id="gauge" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#00D4FF" /><stop offset="100%" stopColor="#FF6B35" /></linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{summary.overallQuality}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 flex-1">
            <StatCard label="Pass Rate" value={`${summary.passRate}%`} sub={`${summary.totalPassed}/${summary.totalTests}`} color="text-green-400" />
            <StatCard label="Coverage" value={`${summary.coverage}%`} sub={`B:${summary.branchCoverage}% F:${summary.functionCoverage}%`} color="text-cyan-400" />
            <StatCard label="Failed" value={summary.totalFailed} sub={`${failedResults.length} recent`} color={summary.totalFailed > 0 ? "text-red-400" : "text-green-400"} />
            <StatCard label="Skipped" value={summary.totalSkipped} sub={`of ${summary.totalTests} total`} color="text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-white/5 p-1 w-fit">
        {(["overview", "modules", "results", "config"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 rounded text-sm font-medium transition-colors", tab === t ? "bg-cyan-500/20 text-cyan-400" : "text-white/60 hover:text-white/80")}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm col-span-2">
            <h3 className="text-sm font-medium mb-4">Module Coverage</h3>
            <div className="space-y-3">
              {summary.moduleStatuses.slice(0, 8).map((m) => (
                <div key={m.module} className="space-y-1">
                  <div className="flex justify-between text-xs"><span className="capitalize">{m.module.replace(/-/g, " ")}</span><span>{m.coverage}%</span></div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className={cn("h-full rounded-full", m.coverage >= 90 ? "bg-green-500" : m.coverage >= 80 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${m.coverage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-medium mb-3">Health Scores</h3>
              <div className="space-y-3">
                <ProgressBar value={summary.securityScore} label="Security" color="bg-red-500" />
                <ProgressBar value={summary.accessibilityScore} label="Accessibility" color="bg-pink-500" />
                <ProgressBar value={summary.performanceScore} label="Performance" color="bg-yellow-500" />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-medium mb-3">Performance</h3>
              <p className="text-xs text-white/60">Avg test: {summary.performance.avgTestDurationMs}ms</p>
              <p className="text-xs text-white/60">Total: {(summary.performance.totalDurationMs / 1000).toFixed(1)}s</p>
              <p className="text-xs text-white/60">Fastest: {summary.performance.fastestModule}</p>
              <p className="text-xs text-white/60">Slowest: {summary.performance.slowestModule}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "modules" && (
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <div className="divide-y divide-white/5">
            {summary.moduleStatuses.map((m) => (
              <div key={m.module} className="p-1">
                <ModuleRow m={m} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "results" && (
        <div className="space-y-4">
          {failedResults.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <h3 className="text-sm font-medium text-red-400 mb-2">Failed Tests ({failedResults.length})</h3>
              <div className="space-y-1">
                {failedResults.slice(0, 10).map((t) => (
                  <div key={t.id} className="text-xs text-red-300/80"><span className="text-white/40">[{t.module}]</span> {t.name} — <span className="text-red-400">{t.error}</span></div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-medium">Recent Results ({summary.recentResults.length})</h3>
              <div className="flex gap-2 text-xs">
                <span className="text-green-400">{summary.recentResults.filter((r) => r.status === "passed").length} passed</span>
                <span className="text-red-400">{failedResults.length} failed</span>
              </div>
            </div>
            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
              {summary.recentResults.map((t) => (
                <div key={t.id} className="px-3 py-0.5">
                  <TestResultRow t={t} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "config" && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-medium mb-4">Quality Gate Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(config).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded border border-white/5">
                <span className="text-sm text-white/60">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                <span className={cn("text-sm font-medium", typeof value === "boolean" ? (value ? "text-green-400" : "text-red-400") : "text-cyan-400")}>
                  {typeof value === "boolean" ? (value ? "Enabled" : "Disabled") : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
