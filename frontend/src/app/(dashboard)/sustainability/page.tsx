import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { SustainabilityDashboard } from "@/features/sustainability/components/sustainability-dashboard";

export default function SustainabilityPage() {
  return (
    <Shell title="Stadium Sustainability Intelligence">
      <ErrorBoundary module="Stadium Sustainability Intelligence">
        <SustainabilityDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
