"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { EnterpriseSecurityData } from "../types";

export function AnalyticsView({ analytics }: { analytics: EnterpriseSecurityData["analytics"] }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Login Success Rate</p>
            <p className={cn("text-lg font-bold", analytics.loginSuccessRate >= 90 ? "text-emerald-400" : "text-amber-400")}>{analytics.loginSuccessRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Failed Logins (24h)</p>
            <p className={cn("text-lg font-bold", analytics.failedLogins24h > 10 ? "text-red-400" : analytics.failedLogins24h > 3 ? "text-amber-400" : "text-emerald-400")}>{analytics.failedLogins24h}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Suspicious Activities</p>
            <p className={cn("text-lg font-bold", analytics.suspiciousActivities24h > 2 ? "text-red-400" : "text-emerald-400")}>{analytics.suspiciousActivities24h}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Avg Response Time</p>
            <p className={cn("text-lg font-bold", analytics.avgResponseTimeMin <= 15 ? "text-emerald-400" : "text-amber-400")}>{analytics.avgResponseTimeMin} min</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Audit Activity (7 days)</h3>
          <div className="flex items-end gap-2">
            {analytics.auditActivity7d.map((day: { date: string; count: number }) => {
              const maxCount = Math.max(...analytics.auditActivity7d.map((d) => d.count), 1);
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[8px] text-muted-foreground">{day.count}</span>
                  <div className="w-full rounded-t bg-primary/30" style={{ height: `${Math.max(4, (day.count / maxCount) * 60)}px` }} />
                  <span className="text-[7px] text-muted-foreground">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Top Risks</h3>
          <div className="space-y-1">
            {analytics.topRisks.map((risk: { title: string; score: number; category: string }) => (
              <div key={risk.title} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1.5">
                <AlertTriangle className={cn("h-3 w-3 shrink-0", risk.score >= 70 ? "text-red-400" : risk.score >= 40 ? "text-amber-400" : "text-muted-foreground")} />
                <span className="flex-1 text-[10px] text-card-foreground">{risk.title}</span>
                <Badge variant="outline" className={cn("text-[8px]", risk.score >= 70 ? "text-red-400 border-red-500/20" : risk.score >= 40 ? "text-amber-400 border-amber-500/20" : "text-muted-foreground")}>{risk.score}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
