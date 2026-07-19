"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AuditLog } from "../types";

export function AuditView({ logs }: { logs: AuditLog[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = logs.filter((l) => {
    if (filter !== "all" && l.result !== filter) return false;
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
        <Button variant={filter === "success" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("success")}>Success</Button>
        <Button variant={filter === "failure" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("failure")}>Failure</Button>
        <Button variant={filter === "denied" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("denied")}>Denied</Button>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="ml-auto h-7 w-40 text-[10px]" aria-label="Search audit logs" />
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No audit logs match filter</div>
      ) : (
        <div className="space-y-1">
          {filtered.slice(0, 50).map((log) => (
            <div key={log.id} className="flex items-start gap-2 rounded-md border border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] p-2">
              <div className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", log.result === "success" ? "bg-emerald-500" : log.result === "failure" ? "bg-red-500" : "bg-amber-500")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-card-foreground">{log.action}</span>
                  <Badge variant="outline" className={cn("text-[8px]", log.severity === "critical" ? "text-red-400 border-red-500/20" : log.severity === "error" ? "text-orange-400" : log.severity === "warning" ? "text-amber-400" : "text-muted-foreground")}>{log.severity}</Badge>
                  <Badge variant="outline" className={cn("text-[8px]", log.result === "success" ? "text-emerald-400" : log.result === "failure" ? "text-red-400" : "text-amber-400")}>{log.result}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{log.user} &middot; {log.resourceType}:{log.resourceId} &middot; {log.detail}</p>
                <p className="text-[9px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()} &middot; {log.ipAddress} &middot; {log.correlationId}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
