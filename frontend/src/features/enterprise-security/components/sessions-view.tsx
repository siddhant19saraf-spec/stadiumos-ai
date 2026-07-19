"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Fingerprint, X } from "lucide-react";
import type { EnterpriseSecurityData } from "../types";

export function SessionsView({ state }: { state: EnterpriseSecurityData }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Active Sessions</p>
            <p className="text-2xl font-bold text-emerald-400">{state.sessions.filter((s) => s.isActive).length}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold text-card-foreground">{state.sessions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Idle Sessions</p>
            <p className="text-2xl font-bold text-amber-400">{state.sessions.filter((s) => s.isActive && Date.now() - new Date(s.lastActivity).getTime() > 15 * 60 * 1000).length}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Trusted Devices</p>
            <p className="text-2xl font-bold text-blue-400">{state.sessions.filter((s) => s.isTrusted).length}</p>
          </CardContent>
        </Card>
      </div>

      {state.sessions.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No sessions</div>
      ) : (
        <div className="space-y-1">
          {state.sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-md border border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] p-2.5">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full", s.isActive ? "bg-emerald-500/20" : "bg-muted/20")}>
                <Fingerprint className={cn("h-3.5 w-3.5", s.isActive ? "text-emerald-400" : "text-muted-foreground")} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-card-foreground">{s.username}</span>
                  <Badge variant="outline" className={cn("text-[8px]", s.isActive ? "text-emerald-400 border-emerald-500/20" : "text-muted-foreground")}>{s.isActive ? "Active" : "Inactive"}</Badge>
                  {s.isTrusted && <Badge variant="outline" className="text-[8px] text-blue-400 border-blue-500/20">Trusted</Badge>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{s.deviceName}</span>
                  <span>{s.ipAddress}</span>
                  <span>Last: {new Date(s.lastActivity).toLocaleString()}</span>
                </div>
              </div>
              {s.isActive && (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-400">
                  <X className="mr-1 h-3 w-3" />
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
