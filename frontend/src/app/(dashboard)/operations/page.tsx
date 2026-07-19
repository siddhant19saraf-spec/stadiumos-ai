"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Services Healthy", value: "4", status: "healthy" },
  { label: "Services Down", value: "0", status: "down" },
  { label: "API Requests/min", value: "1,247", status: "healthy" },
  { label: "Error Rate", value: "0.02%", status: "healthy" },
  { label: "p95 Latency", value: "245ms", status: "healthy" },
  { label: "AI Response Time", value: "1.2s", status: "warning" },
  { label: "Active Users", value: "42", status: "healthy" },
  { label: "Queue Backlog", value: "3", status: "healthy" },
];

const services = [
  { name: "Frontend", status: "healthy", version: "v0.1.0", uptime: "99.9%" },
  { name: "Backend", status: "healthy", version: "v0.1.0", uptime: "99.8%" },
  { name: "Database", status: "healthy", version: "PostgreSQL 16", uptime: "99.95%" },
  { name: "Redis", status: "healthy", version: "Redis 7", uptime: "99.9%" },
];

const deployments = [
  { id: 1, version: "v0.1.0", status: "active", date: "2026-07-18", author: "CI/CD" },
  { id: 2, version: "v0.0.9", status: "rolled-back", date: "2026-07-17", author: "manual" },
  { id: 3, version: "v0.0.8", status: "success", date: "2026-07-15", author: "CI/CD" },
];

export default function OperationsPage() {
  return (
    <ErrorBoundary module="Operations Center">
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Operations Center</h1>
            <p className="text-muted-foreground">
              Real-time platform health, deployment status, and infrastructure monitoring
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <Badge
                variant={
                  stat.status === "healthy"
                    ? "default"
                    : stat.status === "warning"
                      ? "secondary"
                      : "destructive"
                }
                className="mt-2"
              >
                {stat.status}
              </Badge>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Service Health</h2>
            <div className="space-y-3">
              {services.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{svc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {svc.version} &middot; Uptime: {svc.uptime}
                    </p>
                  </div>
                  <Badge
                    variant={svc.status === "healthy" ? "default" : "destructive"}
                  >
                    {svc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Deployment History</h2>
            <div className="space-y-3">
              {deployments.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{dep.version}</p>
                    <p className="text-sm text-muted-foreground">
                      {dep.date} &middot; {dep.author}
                    </p>
                  </div>
                  <Badge
                    variant={
                      dep.status === "active"
                        ? "default"
                        : dep.status === "rolled-back"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {dep.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Infrastructure Summary</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Deployment Target</p>
              <p className="font-medium">Docker Compose</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Container Runtime</p>
              <p className="font-medium">Docker 24+</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monitoring Stack</p>
              <p className="font-medium">Prometheus / Grafana / Loki / Tempo</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CI/CD</p>
              <p className="font-medium">GitHub Actions</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Container Registry</p>
              <p className="font-medium">GHCR (ghcr.io)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Environment</p>
              <p className="font-medium">Production</p>
            </div>
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
