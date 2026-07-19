import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/queue-intelligence/components/main-dashboard";

export default function QueueIntelligencePage() {
  return (
    <Shell title="Queue & Concourse Intelligence">
      <ErrorBoundary module="Queue & Concourse Intelligence">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
