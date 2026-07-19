"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award, FileSearch, Users, KeyRound, AlertTriangle, AlertCircle, TrendingUp, Download } from "lucide-react";
import type { EnterpriseSecurityData } from "../types";

const reportTypes = [
  { id: "security_summary", label: "Security Summary", icon: ShieldCheck },
  { id: "compliance", label: "Compliance Summary", icon: Award },
  { id: "audit_history", label: "Audit History", icon: FileSearch },
  { id: "user_activity", label: "User Activity", icon: Users },
  { id: "permission_matrix", label: "Permission Matrix", icon: KeyRound },
  { id: "risk_assessment", label: "Risk Assessment", icon: AlertTriangle },
  { id: "open_findings", label: "Open Findings", icon: AlertCircle },
  { id: "recommendations", label: "Recommendations", icon: TrendingUp },
] as const;

export function ReportsView({ state }: { state: EnterpriseSecurityData }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {reportTypes.map((rt) => (
          <Card key={rt.id} className="border-primary/10 cursor-pointer hover:border-primary/30 transition-colors">
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <rt.icon className="h-6 w-6 text-primary" />
              <span className="text-xs font-medium text-card-foreground">{rt.label}</span>
              <Button variant="outline" size="sm" className="h-6 text-[10px]">
                <Download className="mr-1 h-3 w-3" />
                Generate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.reports.length > 0 && (
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Generated Reports</h3>
            <div className="space-y-1">
              {state.reports.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md bg-primary/5 px-2 py-1.5">
                  <div>
                    <p className="text-[10px] text-card-foreground">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.period} &middot; {r.generatedBy}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] capitalize text-muted-foreground">{r.type.replace(/_/g, " ")}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                      <Download className="mr-1 h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
