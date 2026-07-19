import { ErrorBoundary } from "@/components/error-boundary";
import QADashboard from "@/features/qa-dashboard/components/qa-dashboard";

export default function QADashboardPage() {
  return (
    <ErrorBoundary module="QA Dashboard">
      <QADashboard />
    </ErrorBoundary>
  );
}
