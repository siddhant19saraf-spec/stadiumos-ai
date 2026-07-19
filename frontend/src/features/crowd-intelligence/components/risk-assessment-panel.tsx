"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, Activity, Gauge } from "lucide-react";
import type { CrowdAnalytics } from "../types";

interface RiskAssessmentPanelProps {
  analytics: CrowdAnalytics;
  className?: string;
}

function RiskGauge({ label, value, icon: Icon, color, desc }: { label: string; value: number; icon: React.ElementType; color: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-gradient-to-r from-primary/5 to-transparent p-3">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-14 w-14 -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 264} 264`}
            className="transition-all duration-500"
          />
        </svg>
        <Icon className="absolute h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-card-foreground">{label}</span>
          <span className="text-lg font-bold" style={{ color }}>{value.toFixed(0)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export function RiskAssessmentPanel({ analytics, className }: RiskAssessmentPanelProps) {
  if (!analytics || analytics.congestionScore === undefined) {
    return (
      <Card className={cn("", className)}>
        <CardHeader><CardTitle className="text-sm">Risk Assessment</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">No risk data available</CardContent>
      </Card>
    );
  }

  const items = [
    { label: "Congestion Risk", value: analytics.congestionScore, icon: Activity, color: analytics.congestionScore > 60 ? "#f97316" : analytics.congestionScore > 30 ? "#eab308" : "#22c55e", desc: analytics.congestionScore > 60 ? "Elevated congestion in multiple zones" : analytics.congestionScore > 30 ? "Moderate congestion levels" : "Normal congestion levels" },
    { label: "Safety Score", value: analytics.safetyIndex, icon: Shield, color: analytics.safetyIndex > 80 ? "#22c55e" : analytics.safetyIndex > 60 ? "#eab308" : "#ef4444", desc: analytics.safetyIndex > 80 ? "All safety thresholds met" : analytics.safetyIndex > 60 ? "Some thresholds approaching" : "Critical thresholds breached" },
    { label: "Risk Score", value: analytics.riskScore, icon: AlertTriangle, color: analytics.riskScore > 60 ? "#ef4444" : analytics.riskScore > 30 ? "#f97316" : "#22c55e", desc: analytics.riskScore > 60 ? "Immediate action recommended" : analytics.riskScore > 30 ? "Monitor closely" : "Within acceptable range" },
    { label: "Heat Index", value: analytics.heatIndex, icon: Gauge, color: analytics.heatIndex > 70 ? "#f97316" : analytics.heatIndex > 40 ? "#eab308" : "#22c55e", desc: analytics.heatIndex > 70 ? "High crowd density pressure" : analytics.heatIndex > 40 ? "Moderate pressure" : "Low pressure" },
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <RiskGauge key={item.label} {...item} />
        ))}
      </CardContent>
    </Card>
  );
}

