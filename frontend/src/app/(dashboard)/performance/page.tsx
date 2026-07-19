import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { PerformanceDashboard } from "@/features/performance-center/components/performance-dashboard";

export default function PerformancePage() {
  return (
    <Shell title="Performance Center">
      <ErrorBoundary module="Performance Center">
        <PerformanceDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
