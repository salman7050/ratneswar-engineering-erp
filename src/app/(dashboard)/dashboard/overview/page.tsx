import { TrendingUp, ArrowLeftRight, Wallet, PiggyBank, MapPinned, Users, Receipt, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import { COMPANY } from "@/config/nav";

import { MissionGrid } from "@/components/dashboard/mission-grid";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { MissionClock } from "@/components/dashboard/mission-clock";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { MissionCalendar } from "@/components/dashboard/mission-calendar";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { TenderStatusPanel } from "@/components/dashboard/tender-status-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { StatusChip } from "@/components/ui/status-chip";
import { Eyebrow, H1 } from "@/components/ui/typography";
import { CHART_COLORS } from "@/components/ui/charts";

export const metadata = { title: "Business Overview · Ratneswar ERP" };
export const dynamic = "force-dynamic"; // always read live data, never cache stale figures

function pctChange(trend: { value: number }[]): number | undefined {
  if (trend.length < 2) return undefined;
  const prev = trend[trend.length - 2]?.value;
  const last = trend[trend.length - 1]?.value;
  if (prev === undefined || last === undefined || prev === 0) return undefined;
  return Math.round(((last - prev) / prev) * 100);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData();

  return (
    <div className="relative min-h-full">
      {/* Faint command-center grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-6 md:px-8">
        {/* ── Status bar ── */}
        <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div>
            <Eyebrow className="text-brand-gold-light/80">{COMPANY.name} · Command Center</Eyebrow>
            <div className="mt-1 flex items-center gap-3">
              <H1 className="text-2xl md:text-3xl">
                Welcome back, <span className="text-gradient-gold">{user.name.split(" ")[0]}</span>
              </H1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusChip tone="success" pulse>System Operational</StatusChip>
              <StatusChip tone="info">{user.role}</StatusChip>
              <StatusChip tone={data.hasAnyData ? "gold" : "neutral"}>
                {data.hasAnyData ? "Live Data Feed" : "Awaiting First Entries"}
              </StatusChip>
            </div>
          </div>
          <MissionClock />
        </div>

        <MissionGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-12">
          {/* ── KPI row ── */}
          <MissionPanel title="Revenue" tint="gold" live className="lg:col-span-3">
            <KpiCard
              label="This FY, all invoices"
              value={data.revenue.total}
              trend={data.revenue.trend}
              icon={TrendingUp}
              color={CHART_COLORS.gold}
              deltaPct={pctChange(data.revenue.trend)}
            />
          </MissionPanel>

          <MissionPanel title="Cash Flow" tint="blue" live className="lg:col-span-3">
            <KpiCard
              label="Net, last 6 months"
              value={data.cashFlow.net}
              trend={data.cashFlow.trend}
              icon={ArrowLeftRight}
              color={CHART_COLORS.blue}
              deltaPct={pctChange(data.cashFlow.trend)}
            />
          </MissionPanel>

          <MissionPanel title="Expenses" tint="red" live className="lg:col-span-3">
            <KpiCard
              label="This FY, all sites"
              value={data.expenses.total}
              trend={data.expenses.trend}
              icon={Wallet}
              color={CHART_COLORS.red}
              deltaPct={pctChange(data.expenses.trend)}
            />
          </MissionPanel>

          <MissionPanel title="Profit" tint="green" live className="lg:col-span-3">
            <KpiCard
              label={`Margin ${data.profit.marginPct}%`}
              value={data.profit.total}
              trend={data.revenue.trend.map((r, i) => ({
                month: r.month,
                value: r.value - (data.expenses.trend[i]?.value ?? 0),
              }))}
              icon={PiggyBank}
              color={CHART_COLORS.green}
            />
          </MissionPanel>

          {/* ── Operations snapshot ── */}
          <MissionPanel title="Operations Snapshot" tint="neutral" className="lg:col-span-12">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <StatTile
                label="Running Sites"
                value={data.runningSites}
                sub={`of ${data.totalSites}`}
                icon={MapPinned}
                color={CHART_COLORS.gold}
              />
              <StatTile label="Employees" value={data.employees} icon={Users} color={CHART_COLORS.blue} />
              <StatTile
                label="Pending Invoices"
                value={data.pendingInvoices.count}
                sub={data.pendingInvoices.amount > 0 ? `₹${Math.round(data.pendingInvoices.amount / 1000)}k` : undefined}
                icon={Receipt}
                color={CHART_COLORS.violet}
              />
              <StatTile
                label="Pending Quotations"
                value={data.pendingQuotations.count}
                sub={data.pendingQuotations.amount > 0 ? `₹${Math.round(data.pendingQuotations.amount / 1000)}k` : undefined}
                icon={FileText}
                color={CHART_COLORS.green}
              />
            </div>
          </MissionPanel>

          {/* ── Tender status / Activity / Notifications ── */}
          <MissionPanel title="Tender Status" tint="gold" className="lg:col-span-4">
            <TenderStatusPanel data={data.tenderStatus} />
          </MissionPanel>

          <MissionPanel title="Recent Activity" tint="neutral" live className="lg:col-span-4" bodyClassName="p-4 max-h-72 overflow-y-auto scrollbar-thin">
            <ActivityFeed activities={data.recentActivities} />
          </MissionPanel>

          <MissionPanel title="Notifications" tint="red" className="lg:col-span-4">
            <NotificationsPanel upcomingEmds={data.upcomingEmds} overdueInvoices={data.overdueInvoices} />
          </MissionPanel>

          {/* ── Weather / Calendar / Quick actions ── */}
          <MissionPanel title="Site Conditions" tint="blue" live className="lg:col-span-4">
            <WeatherWidget />
          </MissionPanel>

          <MissionPanel title="Calendar" tint="gold" className="lg:col-span-4">
            <MissionCalendar highlightDates={data.upcomingEmds.map((t) => t.emdDeadline)} />
          </MissionPanel>

          <MissionPanel title="Quick Actions" tint="neutral" className="lg:col-span-4">
            <QuickActions />
          </MissionPanel>
        </MissionGrid>
      </div>
    </div>
  );
}
