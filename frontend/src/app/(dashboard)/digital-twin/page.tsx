import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/digital-twin/components/main-dashboard";

export default function DigitalTwinPage() {
  return (
    <Shell title="Stadium Digital Twin">
      <ErrorBoundary module="Stadium Digital Twin">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
