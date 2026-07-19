"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { rbacEngine } from "../services/rbac-engine";
import { ALL_PERMISSIONS, PERMISSION_LABELS } from "../constants";
import type { SecurityPermission } from "../types";

export function RBACView() {
  const matrix = rbacEngine.getPermissionMatrix();
  const hierarchy = rbacEngine.getRoleHierarchy();

  return (
    <div className="space-y-3">
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Role Hierarchy</h3>
          <div className="flex flex-wrap gap-1">
            {hierarchy.map((r: { role: string; label: string; priority: number }) => (
              <Badge key={r.role} variant="outline" className="text-[10px] capitalize">
                {r.label} (P{r.priority})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Permission Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" role="grid" aria-label="Permission matrix">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="sticky left-0 bg-background px-2 py-1 text-left font-medium text-muted-foreground">Role</th>
                  {ALL_PERMISSIONS.map((p: string) => (
                    <th key={p} className="rotate-180 px-1 py-1 text-[7px] text-muted-foreground" style={{ writingMode: "vertical-lr" }}>{PERMISSION_LABELS[p as SecurityPermission].split(" ").slice(0, 2).join("\n")}</th>
                  ))}
                  <th className="px-2 py-1 text-right font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row: { role: string; permissions: string[]; count: number }) => (
                  <tr key={row.role} className="border-b border-primary/5 hover:bg-primary/5">
                    <td className="sticky left-0 bg-background px-2 py-1 font-medium capitalize">{row.role.replace(/_/g, " ")}</td>
                    {ALL_PERMISSIONS.map((p: string) => (
                      <td key={p} className="px-1 py-1 text-center">
                        <div className={cn("mx-auto h-3 w-3 rounded-sm", row.permissions.includes(p) ? "bg-emerald-500" : "bg-primary/10")} />
                      </td>
                    ))}
                    <td className="px-2 py-1 text-right font-medium tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
