import { getAnalyticsData } from "@/lib/actions/analytics";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const metadata = {
  title: "Analytics | Kanban Board",
};

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AnalyticsDashboard data={data} />
    </main>
  );
}
