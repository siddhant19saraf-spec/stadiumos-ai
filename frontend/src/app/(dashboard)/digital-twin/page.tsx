import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/digital-twin/components/main-dashboard";

export default function DigitalTwinPage() {
  return (
    <Shell title="Digital Twin">
      <ErrorBoundary module="Digital Twin">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
