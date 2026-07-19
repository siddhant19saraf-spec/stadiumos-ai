import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/emergency-response/components/main-dashboard";

export default function EmergencyResponsePage() {
  return (
    <Shell title="Emergency Response">
      <ErrorBoundary module="Emergency Response">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
