"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { ComplianceFrameworkStatus, ComplianceFramework } from "../types";
import { complianceEngine } from "../services/compliance-engine";

export function ComplianceView({ frameworks }: { frameworks: ComplianceFrameworkStatus[] }) {
  const overallScore = complianceEngine.getOverallComplianceScore();
  const [expanded, setExpanded] = useState<ComplianceFramework | null>(null);
  const compliantCount = complianceEngine.getCompliantCount();
  const nonCompliantCount = complianceEngine.getNonCompliantCount();
  const totalRequirements = frameworks.reduce((s, f) => s + f.requirements.length, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Overall Compliance</p>
            <p className={cn("text-2xl font-bold", overallScore >= 80 ? "text-emerald-400" : overallScore >= 60 ? "text-amber-400" : "text-red-400")}>{overallScore}%</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Compliant</p>
            <p className="text-2xl font-bold text-emerald-400">{compliantCount}/{totalRequirements}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Non-Compliant</p>
            <p className="text-2xl font-bold text-red-400">{nonCompliantCount}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Last Assessed</p>
            <p className="text-xs font-medium tabular-nums text-card-foreground">{new Date(complianceEngine.getLastAssessmentDate()).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>

      {frameworks.map((fw) => (
        <Card key={fw.framework} className="border-primary/10">
          <CardContent className="p-3">
            <button className="flex w-full items-center justify-between" onClick={() => setExpanded(expanded === fw.framework ? null : fw.framework)}>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-card-foreground">{fw.label}</h3>
                <Badge variant="outline" className={cn("text-[10px]", fw.overallScore >= 80 ? "text-emerald-400 border-emerald-500/20" : fw.overallScore >= 60 ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20")}>{fw.overallScore}%</Badge>
              </div>
              <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", expanded === fw.framework && "rotate-90")} />
            </button>
            {expanded === fw.framework && (
              <div className="mt-2 space-y-1">
                {fw.requirements.map((req) => (
                  <div key={req.id} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1">
                    <div className={cn("h-2 w-2 shrink-0 rounded-full", req.status === "compliant" ? "bg-emerald-500" : req.status === "partial" ? "bg-amber-500" : "bg-red-500")} />
                    <span className="flex-1 text-[10px] text-card-foreground">{req.controlId}: {req.title}</span>
                    <Badge variant="outline" className={cn("text-[8px]", req.status === "compliant" ? "text-emerald-400" : req.status === "partial" ? "text-amber-400" : "text-red-400")}>{req.status.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
                {fw.gaps.length > 0 && (
                  <div className="mt-2 rounded-md bg-red-500/5 p-2">
                    <p className="text-[10px] font-medium text-red-400">Gaps ({fw.gaps.length})</p>
                    {fw.gaps.map((g: string, i: number) => <p key={i} className="text-[10px] text-muted-foreground">&bull; {g}</p>)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
