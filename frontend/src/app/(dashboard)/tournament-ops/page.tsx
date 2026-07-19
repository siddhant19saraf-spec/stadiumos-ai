import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/tournament-ops/components/main-dashboard";

export default function TournamentOpsPage() {
  return (
    <Shell title="Tournament & Match Operations">
      <ErrorBoundary module="Tournament & Match Operations">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
