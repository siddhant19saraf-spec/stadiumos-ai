import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { PredictiveDashboard } from "@/features/predictive-maintenance/components/predictive-dashboard";

export default function PredictiveMaintenancePage() {
  return (
    <Shell title="Stadium Predictive Maintenance">
      <ErrorBoundary module="Stadium Predictive Maintenance">
        <PredictiveDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
