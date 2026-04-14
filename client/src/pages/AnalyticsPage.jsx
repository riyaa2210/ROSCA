import Spinner from "../components/Spinner";
import OverviewCards from "../components/analytics/OverviewCards";
import TrendsChart from "../components/analytics/TrendsChart";
import PaymentBehaviour from "../components/analytics/PaymentBehaviour";
import GroupBreakdown from "../components/analytics/GroupBreakdown";
import AIInsights from "../components/AIInsights";
import { useAnalytics } from "../hooks/useAnalytics";

export default function AnalyticsPage() {
  const { overview, trends, behaviour, breakdown, loading, months, setMonths } = useAnalytics();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Crunching your numbers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Your complete financial picture across all Bhishi groups</p>
      </div>

      <OverviewCards overview={overview} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TrendsChart trends={trends} months={months} onMonthsChange={setMonths} />
          <GroupBreakdown breakdown={breakdown} />
        </div>
        <div className="space-y-6">
          <PaymentBehaviour behaviour={behaviour} />
          <AIInsights />
        </div>
      </div>
    </div>
  );
}
