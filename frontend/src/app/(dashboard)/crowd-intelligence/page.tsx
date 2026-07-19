import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/crowd-intelligence/components/main-dashboard";

export default function CrowdIntelligencePage() {
  return (
    <Shell title="Crowd Intelligence">
      <ErrorBoundary module="Crowd Intelligence">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
