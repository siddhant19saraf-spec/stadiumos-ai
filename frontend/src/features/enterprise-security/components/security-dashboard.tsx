"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Shield, Users, KeyRound, FileSearch, AlertTriangle, Award, BarChart3, Fingerprint, FileText,
  RefreshCw, LogOut, Lock, AlertCircle,
} from "lucide-react";
import { securityService, createInitialState } from "../services/security-service";
import type { EnterpriseSecurityData } from "../types";
import { OverviewView } from "./overview-view";
import { UsersView } from "./users-view";
import { RBACView } from "./rbac-view";
import { AuditView } from "./audit-view";
import { AlertsView } from "./alerts-view";
import { ComplianceView } from "./compliance-view";
import { AnalyticsView } from "./analytics-view";
import { SessionsView } from "./sessions-view";
import { ReportsView } from "./reports-view";

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
