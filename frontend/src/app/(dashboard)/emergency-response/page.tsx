import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/emergency-response/components/main-dashboard";

export default function EmergencyResponsePage() {
  return (
    <Shell title="Stadium Emergency Response">
      <ErrorBoundary module="Stadium Emergency Response">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
