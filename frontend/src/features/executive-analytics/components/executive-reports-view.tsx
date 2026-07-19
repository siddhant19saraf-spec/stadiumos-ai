"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { ExecutiveAnalyticsData } from "../types";
import { reportingEngine } from "../services/reporting-engine";

export function ReportsView({ state, onGenerate }: { state: ExecutiveAnalyticsData; onGenerate: () => void }) {
  const history = reportingEngine.getReportHistory();

  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-xs font-medium text-card-foreground">Board Report</h3>
            <p className="text-[10px] text-muted-foreground">Generate an executive board report with KPIs, risks, recommendations, and forecasts</p>
          </div>
          <Button variant="default" size="sm" className="h-7 text-[10px]" onClick={onGenerate}>
            <FileText className="mr-1 h-3 w-3" />
            Generate Report
          </Button>
        </CardContent>
      </Card>
      {state.lastReport && (
        <Card className="border-emerald-500/20">
          <CardContent className="p-4">
            <h3 className="mb-3 text-xs font-medium text-card-foreground">{state.lastReport.title}</h3>
            <p className="text-[10px] text-muted-foreground">Period: {state.lastReport.period}</p>
            <p className="text-[10px] text-muted-foreground">Generated: {new Date(state.lastReport.generatedAt).toLocaleString()}</p>
            <div className="mt-3 rounded-md bg-primary/5 p-2">
              <p className="text-[10px] font-medium text-muted-foreground">Executive Summary</p>
              <p className="mt-0.5 text-[10px] text-card-foreground">{state.lastReport.executiveSummary}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <div className="rounded-md bg-amber-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Op Health</p>
                <p className="text-sm font-bold text-amber-400 tabular-nums">{state.summary.operationalHealthScore}%</p>
              </div>
              <div className="rounded-md bg-emerald-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Safety</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">{state.summary.safetyScore}%</p>
              </div>
              <div className="rounded-md bg-red-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Risk</p>
                <p className="text-sm font-bold text-red-400 tabular-nums">{state.summary.executiveRiskScore}%</p>
              </div>
              <div className="rounded-md bg-blue-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Infrastructure</p>
                <p className="text-sm font-bold text-blue-400 tabular-nums">{state.summary.infrastructureHealth}%</p>
              </div>
              <div className="rounded-md bg-purple-500/5 p-2">
                <p className="text-[10px] text-muted-foreground">Sustainability</p>
                <p className="text-sm font-bold text-purple-400 tabular-nums">{state.summary.carbonScore}%</p>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="mb-1 text-[10px] font-medium text-muted-foreground">Strategic Roadmap</h4>
              <p className="text-[10px] text-card-foreground whitespace-pre-line">{state.lastReport.strategicRoadmap}</p>
            </div>
            <div className="mt-3">
              <h4 className="mb-1 text-[10px] font-medium text-muted-foreground">Forecast</h4>
              <p className="text-[10px] text-card-foreground">{state.lastReport.forecastSummary}</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Report History</h3>
          <div className="space-y-1">
            {history.map((h: { id: string; title: string; period: string; generatedAt: string }) => (
              <div key={h.id} className="flex items-center justify-between rounded-md bg-primary/5 px-2 py-1.5">
                <div>
                  <p className="text-[10px] text-card-foreground">{h.title}</p>
                  <p className="text-[10px] text-muted-foreground">{h.period}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                  <FileText className="mr-1 h-3 w-3" />
                  View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
