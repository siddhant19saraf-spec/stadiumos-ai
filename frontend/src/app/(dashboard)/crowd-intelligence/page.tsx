import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/crowd-intelligence/components/main-dashboard";

export default function CrowdIntelligencePage() {
  return (
    <Shell title="Stadium Crowd Intelligence">
      <ErrorBoundary module="Stadium Crowd Intelligence">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
