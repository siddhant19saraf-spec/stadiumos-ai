"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { EnterpriseSecurityData } from "../types";
import { DEPARTMENT_COLORS } from "../constants";

export function UsersView({ state }: { state: EnterpriseSecurityData }) {
  const [search, setSearch] = useState("");
  const filtered = state.users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="h-8 pl-7 text-[10px]" aria-label="Search users" />
        </div>
        <Badge variant="outline" className="text-[10px]">{state.users.length} total</Badge>
      </div>
      <div className="space-y-1">
        {filtered.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No users match search</div>
        ) : (
          filtered.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-md border border-primary/10 bg-gradient-to-br from-background to-primary/[0.02] p-2.5">
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium text-white", user.status === "active" ? "bg-emerald-500/80" : user.status === "locked" ? "bg-red-500/80" : "bg-muted-foreground/50")}>
                {user.displayName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-card-foreground">{user.displayName}</span>
                  <Badge variant="outline" className={cn("text-[8px]", user.status === "active" ? "text-emerald-400 border-emerald-500/20" : user.status === "locked" ? "text-red-400 border-red-500/20" : "text-amber-400 border-amber-500/20")}>{user.status}</Badge>
                  {user.mfaEnabled && <Badge variant="outline" className="text-[8px] text-blue-400 border-blue-500/20">MFA</Badge>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>@{user.username}</span>
                  <span>{user.email}</span>
                  <span className="capitalize">{user.role.replace(/_/g, " ")}</span>
                  <span>{user.department}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize" style={{ borderColor: `${DEPARTMENT_COLORS[user.department] ?? "#6b7280"}40`, color: DEPARTMENT_COLORS[user.department] ?? "#6b7280" }}>
                {user.role.replace(/_/g, " ")}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
