import { Shell } from "@/components/layout/shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { MainDashboard } from "@/features/smart-parking/components/main-dashboard";

export default function SmartParkingPage() {
  return (
    <Shell title="Smart Parking & Traffic">
      <ErrorBoundary module="Smart Parking & Traffic">
        <MainDashboard />
      </ErrorBoundary>
    </Shell>
  );
}
