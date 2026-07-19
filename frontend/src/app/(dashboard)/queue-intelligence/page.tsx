import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/queue-intelligence/components/main-dashboard";

export default function QueueIntelligencePage() {
  return (
    <Shell title="Queue Intelligence">
      <ErrorBoundary module="Queue Intelligence">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
