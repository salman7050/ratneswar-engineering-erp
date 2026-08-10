import { requirePermission } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/queries/analytics";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export const metadata = { title: "Analytics & Reports · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requirePermission("reports", "view");
  const data = await getAnalyticsData(12);

  return <AnalyticsClient data={data} />;
}
