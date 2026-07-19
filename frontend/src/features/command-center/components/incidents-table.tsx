"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ShieldAlert, ArrowUpRight, AlertCircle, AlertTriangle, Info, Minus } from "lucide-react";
import type { Incident, AlertSeverity, IncidentStatus } from "../types";

const PAGE_SIZE = 10;

interface IncidentsTableProps {
  incidents: Incident[];
  className?: string;
  onViewIncident?: (id: string) => void;
}

const severityConfig: Record<AlertSeverity, { color: string; icon: typeof AlertCircle }> = {
  critical: { color: "text-red-400 border-red-500/30 bg-red-500/10", icon: AlertCircle },
  high: { color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: AlertTriangle },
  medium: { color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: Info },
  low: { color: "text-muted-foreground border-border bg-muted/50", icon: Minus },
  info: { color: "text-muted-foreground border-border bg-muted/50", icon: Info },
};

const statusConfig: Record<IncidentStatus, { color: string; label: string }> = {
  open: { color: "text-red-400 bg-red-500/10", label: "Open" },
  dispatched: { color: "text-amber-400 bg-amber-500/10", label: "Dispatched" },
  resolved: { color: "text-emerald-400 bg-emerald-500/10", label: "Resolved" },
  monitoring: { color: "text-blue-400 bg-blue-500/10", label: "Monitoring" },
};

export function IncidentsTable({ incidents, className, onViewIncident }: IncidentsTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const paginatedIncidents = useMemo(
    () => incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [incidents, page],
  );
  if (incidents.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No incidents reported</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Recent Incidents
          {incidents.filter((i) => i.status !== "resolved").length > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {incidents.filter((i) => i.status !== "resolved").length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto" role="region" aria-label="Incidents table">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Time</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Location</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell" scope="col">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Severity</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Status</th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground lg:table-cell" scope="col">Team</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedIncidents.map((incident) => {
                const sevConfig = severityConfig[incident.severity];
                const statConfig = statusConfig[incident.status];
                const SevIcon = sevConfig.icon;

                return (
                  <tr
                    key={incident.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">{incident.time}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{incident.location}</td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">{incident.type}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn("gap-1 text-[10px]", sevConfig.color)}>
                        <SevIcon className="h-3 w-3" aria-hidden="true" />
                        <span className="capitalize">{incident.severity}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={cn("text-[10px]", statConfig.color)}>
                        {statConfig.label}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">{incident.assignedTeam}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onViewIncident?.(incident.id)}
                        aria-label={`View incident at ${incident.location}`}
                      >
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => { setPage(p); }}
        />
      </CardContent>
    </Card>
  );
}
