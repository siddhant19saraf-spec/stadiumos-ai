// @ts-nocheck
"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Shield, ShieldCheck, ShieldAlert, Users, Fingerprint, KeyRound,
  AlertTriangle, AlertCircle, FileText, RefreshCw, Search,
  Lock, Unlock, Eye, EyeOff, UserCheck, UserX, LogOut,
  BarChart3, TrendingUp, TrendingDown, Target, Award,
  Server, Wifi, Clock, Calendar, CheckCircle2, X,
  ChevronRight, Activity, Radio, Sliders, FileSearch,
  Menu, Download, ExternalLink,
} from "lucide-react";
import { securityService, createInitialState } from "../services/security-service";
import { securityAnalyticsEngine } from "../services/security-analytics-engine";
import { complianceEngine } from "../services/compliance-engine";
import { securityMonitorEngine } from "../services/security-monitor-engine";
import { rbacEngine } from "../services/rbac-engine";
import type { EnterpriseSecurityData, SecurityPermission, SecurityRole, SecurityAlert, AuditLog, ComplianceFramework, SecurityUser } from "../types";
import { ROLE_DEFINITIONS, PERMISSION_LABELS, ALL_PERMISSIONS, DEPARTMENT_COLORS } from "../constants";

type Tab = "overview" | "users" | "rbac" | "audit" | "alerts" | "compliance" | "reports" | "analytics" | "sessions";

export function SecurityDashboard() {
  const [state, setState] = useState<EnterpriseSecurityData>(createInitialState());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const init = useCallback(() => {
    setLoading(true);
    setState(securityService.initialize());
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  const handleLogin = useCallback(() => {
    const { data, result } = securityService.login({
      username: loginUsername || "admin",
      password: loginPassword || "valid_password",
      deviceId: "192.168.1.100",
      deviceName: "Command Center Terminal",
    });
    setState(data);
    if (result.success) {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError(result.error ?? "Login failed");
    }
  }, [loginUsername, loginPassword]);

  const handleLogout = useCallback(() => {
    if (state.sessions[0]) {
      setState(securityService.logout(state.sessions[0].id, state));
    }
    setIsAuthenticated(false);
  }, [state]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setState((prev) => securityService.refreshAnalytics(prev));
    setLoading(false);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-sm border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
          <CardContent className="p-6">
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-sm font-semibold text-card-foreground">Security Command Center</h1>
              <p className="text-[10px] text-muted-foreground">Enterprise authentication required</p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="login-username" className="text-[10px] font-medium text-muted-foreground">Username</label>
                <Input id="login-username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="admin" className="mt-1 h-8 text-[10px]" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <div>
                <label htmlFor="login-password" className="text-[10px] font-medium text-muted-foreground">Password</label>
                <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter password" className="mt-1 h-8 text-[10px]" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              {loginError && (
                <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-2">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] text-red-400">{loginError}</span>
                </div>
              )}
              <Button size="sm" className="h-8 w-full text-[10px]" onClick={handleLogin}>
                <Lock className="mr-1 h-3 w-3" />
                Authenticate
              </Button>
              <p className="text-center text-[9px] text-muted-foreground">Demo: use any username with password &quot;valid_password&quot;</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading && !state.analytics) {
    return (
      <div className="flex h-60 items-center justify-center text-xs text-muted-foreground">
        Initializing Security Command Center...
      </div>
    );
  }

  const analytics = state.analytics;
  const criticalUnacked = state.alerts.filter((a) => !a.acknowledged && a.severity === "critical").length;
  const openAlerts = state.alerts.filter((a) => !a.acknowledged).length;

  const tabs = [
    { id: "overview" as Tab, label: "Security Overview", icon: Shield },
    { id: "users" as Tab, label: "Users", icon: Users },
    { id: "rbac" as Tab, label: "RBAC", icon: KeyRound },
    { id: "audit" as Tab, label: "Audit Log", icon: FileSearch },
    { id: "alerts" as Tab, label: "Alerts", icon: AlertTriangle },
    { id: "compliance" as Tab, label: "Compliance", icon: Award },
    { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
    { id: "sessions" as Tab, label: "Sessions", icon: Fingerprint },
    { id: "reports" as Tab, label: "Reports", icon: FileText },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-card-foreground">Security Command Center</h1>
              <Badge variant="outline" className={cn("text-[10px]", analytics.overallSecurityScore >= 70 ? "text-emerald-400 border-emerald-500/20" : analytics.overallSecurityScore >= 50 ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20")}>
                Score: {analytics.overallSecurityScore}%
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {state.sessions.length} active sessions &middot; {openAlerts} open alerts &middot; {analytics.totalUsers} users
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            <div className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            System Online
          </Badge>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleLogout}>
            <LogOut className="mr-1 h-3 w-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Critical Alert Bar */}
      {criticalUnacked > 0 && (
        <Card className="border-red-500/20 bg-red-500/[0.03]">
          <CardContent className="flex items-center gap-2 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span className="text-[10px] text-red-400">
              {criticalUnacked} critical alert{criticalUnacked > 1 ? "s" : ""} require{criticalUnacked === 1 ? "s" : ""} immediate attention
            </span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px]" onClick={() => setActiveTab("alerts")}>
              View Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            className={cn("h-7 text-[10px]", activeTab !== tab.id && "text-muted-foreground")}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="mr-1 h-3 w-3" />
            {tab.label}
            {tab.id === "alerts" && openAlerts > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                {openAlerts}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewView state={state} analytics={analytics} />}
      {activeTab === "users" && <UsersView state={state} />}
      {activeTab === "rbac" && <RBACView />}
      {activeTab === "audit" && <AuditView logs={state.auditLogs} />}
      {activeTab === "alerts" && <AlertsView alerts={state.alerts} />}
      {activeTab === "compliance" && <ComplianceView frameworks={state.complianceFrameworks} />}
      {activeTab === "analytics" && <AnalyticsView analytics={analytics} />}
      {activeTab === "sessions" && <SessionsView state={state} />}
      {activeTab === "reports" && <ReportsView state={state} />}
    </div>
  );
}

/* ============= Security KPI Card ============= */
function SecurityKpiCard({ label, value, icon: Icon, status, subtitle }: { label: string; value: string; icon: import("@/types/common").IconType; status: "healthy" | "warning" | "critical" | "neutral"; subtitle?: string }) {
  const colorMap: Record<string, string> = {
    healthy: "text-emerald-400 bg-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    critical: "text-red-400 bg-red-500/10",
    neutral: "text-muted-foreground bg-primary/5",
  };
  return (
    <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/[0.02]">
      <CardContent className="flex items-start gap-2 p-2.5">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", colorMap[status] ?? colorMap.neutral)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] text-muted-foreground">{label}</p>
          <p className={cn("text-sm font-bold tabular-nums", status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : status === "critical" ? "text-red-400" : "")}>{value}</p>
          {subtitle && <p className="text-[9px] text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============= Overview View ============= */
function OverviewView({ state, analytics }: { state: EnterpriseSecurityData; analytics: typeof state.analytics }) {
  const frameworkScores = complianceEngine.getFrameworkScores();
  const riskHeatmap = securityAnalyticsEngine.getRiskHeatmap();

  return (
    <div className="space-y-3">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        <SecurityKpiCard label="Security Score" value={`${analytics.overallSecurityScore}%`} icon={ShieldCheck} status={analytics.overallSecurityScore >= 70 ? "healthy" : analytics.overallSecurityScore >= 50 ? "warning" : "critical"} subtitle={analytics.uptimePercentage + "% uptime"} />
        <SecurityKpiCard label="Active Users" value={String(analytics.totalUsers)} icon={Users} status="healthy" subtitle={`${state.sessions.filter((s) => s.isActive).length} online`} />
        <SecurityKpiCard label="Failed Logins (24h)" value={String(analytics.failedLogins24h)} icon={UserX} status={analytics.failedLogins24h > 10 ? "critical" : analytics.failedLogins24h > 3 ? "warning" : "healthy"} />
        <SecurityKpiCard label="Suspicious Activity" value={String(analytics.suspiciousActivities24h)} icon={AlertTriangle} status={analytics.suspiciousActivities24h > 2 ? "critical" : analytics.suspiciousActivities24h > 0 ? "warning" : "healthy"} />
        <SecurityKpiCard label="Critical Alerts" value={String(analytics.criticalAlerts)} icon={AlertCircle} status={analytics.criticalAlerts > 0 ? "critical" : "healthy"} />
        <SecurityKpiCard label="Login Success Rate" value={`${analytics.loginSuccessRate}%`} icon={UserCheck} status={analytics.loginSuccessRate >= 90 ? "healthy" : analytics.loginSuccessRate >= 75 ? "warning" : "critical"} />
        <SecurityKpiCard label="Avg Response Time" value={`${analytics.avgResponseTimeMin}m`} icon={Clock} status={analytics.avgResponseTimeMin <= 15 ? "healthy" : analytics.avgResponseTimeMin <= 30 ? "warning" : "critical"} />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {/* Compliance Scores */}
        <Card className="border-primary/10 xl:col-span-2">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Compliance Readiness</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {frameworkScores.map((fw) => (
                <div key={fw.framework} className="rounded-md bg-primary/5 p-2">
                  <p className="text-[10px] text-muted-foreground">{fw.label}</p>
                  <p className={cn("text-lg font-bold tabular-nums", fw.score >= 80 ? "text-emerald-400" : fw.score >= 60 ? "text-amber-400" : "text-red-400")}>{fw.score}%</p>
                  <Badge variant="outline" className={cn("mt-1 text-[8px]", fw.status === "compliant" ? "text-emerald-400 border-emerald-500/20" : fw.status === "partial" ? "text-amber-400 border-amber-500/20" : "text-red-400 border-red-500/20")}>{fw.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Heatmap */}
        <Card className="border-primary/10">
          <CardContent className="p-3">
            <h3 className="mb-2 text-xs font-medium text-card-foreground">Risk Heatmap</h3>
            <div className="space-y-1">
              {riskHeatmap.map((item) => (
                <div key={item.zone} className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", item.risk >= 70 ? "bg-red-500" : item.risk >= 40 ? "bg-amber-500" : "bg-emerald-500")} />
                  <span className="flex-1 text-[10px] text-card-foreground">{item.zone}</span>
                  <span className={cn("text-[10px] font-medium", item.risk >= 70 ? "text-red-400" : item.risk >= 40 ? "text-amber-400" : "text-emerald-400")}>{item.risk}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Trends */}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">7-Day Threat Trends</h3>
          <div className="flex items-end gap-1 sm:gap-2">
            {analytics.threatTrends.filter((t) => t.type === "failed").map((trend) => {
              const maxCount = Math.max(...analytics.threatTrends.map((t) => t.count), 1);
              const heightPct = Math.max(8, (trend.count / maxCount) * 100);
              return (
                <div key={trend.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[8px] text-muted-foreground">{trend.count}</span>
                  <div className="flex w-full flex-col gap-0.5">
                    <div className="w-full rounded-t bg-red-500/40" style={{ height: `${heightPct * 0.6}px` }} />
                  </div>
                  <span className="text-[7px] text-muted-foreground">{trend.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============= Users View ============= */
function UsersView({ state }: { state: EnterpriseSecurityData }) {
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

/* ============= RBAC View ============= */
function RBACView() {
  const matrix = rbacEngine.getPermissionMatrix();
  const hierarchy = rbacEngine.getRoleHierarchy();

  return (
    <div className="space-y-3">
      {/* Role Hierarchy */}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Role Hierarchy</h3>
          <div className="flex flex-wrap gap-1">
            {hierarchy.map((r) => (
              <Badge key={r.role} variant="outline" className="text-[10px] capitalize">
                {r.label} (P{r.priority})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Permission Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]" role="grid" aria-label="Permission matrix">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="sticky left-0 bg-background px-2 py-1 text-left font-medium text-muted-foreground">Role</th>
                  {ALL_PERMISSIONS.map((p) => (
                    <th key={p} className="rotate-180 px-1 py-1 text-[7px] text-muted-foreground" style={{ writingMode: "vertical-lr" }}>{PERMISSION_LABELS[p].split(" ").slice(0, 2).join("\n")}</th>
                  ))}
                  <th className="px-2 py-1 text-right font-medium text-muted-foreground">Count</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.role} className="border-b border-primary/5 hover:bg-primary/5">
                    <td className="sticky left-0 bg-background px-2 py-1 font-medium capitalize">{row.role.replace(/_/g, " ")}</td>
                    {ALL_PERMISSIONS.map((p) => (
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

/* ============= Audit View ============= */
function AuditView({ logs }: { logs: AuditLog[] }) {
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

/* ============= Alerts View ============= */
function AlertsView({ alerts }: { alerts: SecurityAlert[] }) {
  const [filter, setFilter] = useState<string>("all");
  const filtered = filter === "all" ? alerts : filter === "unacked" ? alerts.filter((a) => !a.acknowledged) : alerts.filter((a) => a.severity === filter);
  const totalUnacked = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("all")}>All</Button>
          <Button variant={filter === "unacked" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("unacked")}>Unacknowledged ({totalUnacked})</Button>
          <Button variant={filter === "critical" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("critical")}>Critical</Button>
          <Button variant={filter === "high" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("high")}>High</Button>
          <Button variant={filter === "medium" ? "default" : "ghost"} size="sm" className="h-7 text-[10px]" onClick={() => setFilter("medium")}>Medium</Button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">No alerts match filter</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => (
            <Card key={alert.id} className={cn("border-l-4", alert.severity === "critical" ? "border-l-red-500" : alert.severity === "high" ? "border-l-orange-500" : alert.severity === "medium" ? "border-l-amber-500" : "border-l-blue-500", alert.acknowledged && "opacity-50")}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-3.5 w-3.5", alert.severity === "critical" ? "text-red-400" : alert.severity === "high" ? "text-orange-400" : "text-amber-400")} />
                      <span className="text-sm font-medium text-card-foreground">{alert.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", alert.severity === "critical" ? "text-red-400 border-red-500/20" : alert.severity === "high" ? "text-orange-400 border-orange-500/20" : "text-amber-400 border-amber-500/20")}>{alert.severity}</Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">{alert.type.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{alert.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>User: {alert.user}</span>
                      <span>IP: {alert.ipAddress}</span>
                      <span>Source: {alert.source}</span>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button variant="ghost" size="sm" className="h-7 shrink-0 text-[10px]" onClick={() => securityMonitorEngine.acknowledgeAlert(alert.id, "admin")}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============= Compliance View ============= */
function ComplianceView({ frameworks }: { frameworks: ComplianceFrameworkStatus[] }) {
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
                    {fw.gaps.map((g, i) => <p key={i} className="text-[10px] text-muted-foreground">• {g}</p>)}
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

/* ============= Analytics View ============= */
function AnalyticsView({ analytics }: { analytics: EnterpriseSecurityData["analytics"] }) {
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

      {/* Audit Activity (7d) */}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Audit Activity (7 days)</h3>
          <div className="flex items-end gap-2">
            {analytics.auditActivity7d.map((day) => {
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

      {/* Top Risks */}
      <Card className="border-primary/10">
        <CardContent className="p-3">
          <h3 className="mb-2 text-xs font-medium text-card-foreground">Top Risks</h3>
          <div className="space-y-1">
            {analytics.topRisks.map((risk) => (
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

/* ============= Sessions View ============= */
function SessionsView({ state }: { state: EnterpriseSecurityData }) {
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

/* ============= Reports View ============= */
function ReportsView({ state }: { state: EnterpriseSecurityData }) {
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

