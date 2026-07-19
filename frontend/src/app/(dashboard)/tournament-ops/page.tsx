import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/tournament-ops/components/main-dashboard";

export default function TournamentOpsPage() {
  return (
    <Shell title="Tournament Operations">
      <ErrorBoundary module="Tournament Operations">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
