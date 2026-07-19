import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { ExecutiveDashboard } from "@/features/executive-analytics/components/executive-dashboard";

export default function ExecutiveAnalyticsPage() {
  return (
    <Shell title="Executive Analytics">
      <ErrorBoundary module="Executive Analytics">
        <ExecutiveDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
