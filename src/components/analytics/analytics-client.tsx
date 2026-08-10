"use client";

import * as React from "react";
import { TrendingUp, Wallet, PiggyBank, ArrowLeftRight, Users, MapPinned, Receipt, FileSignature } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AreaChartCard, BarChartCard, DonutChart, CHART_COLORS } from "@/components/ui/charts";
import { Stat, Muted, Eyebrow, H1 } from "@/components/ui/typography";
import { ChartCard } from "@/components/analytics/chart-card";
import { ExportButtons } from "@/components/analytics/export-buttons";
import { formatINR } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/queries/analytics";

function slice<T>(arr: T[], months: number): T[] {
  return arr.slice(Math.max(0, arr.length - months));
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const [range, setRange] = React.useState<6 | 12>(12);

  const revenueTrend = slice(data.revenue.trend, range);
  const expenseTrend = slice(data.expenses.trend, range);
  const profitTrend = slice(data.profit.trend, range);
  const cashFlowTrend = slice(data.cashFlow.trend, range);
  const salaryCostTrend = slice(data.employees.salaryCostTrend, range);

  return (
    <div id="print-doc" className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Analytics & Reports</H1>
          <Muted className="mt-1">Real-time figures across Finance, HR, Sites, and Tenders</Muted>
        </div>
        <div className="flex items-center gap-2">
          <div className="no-print flex rounded-lg border border-border p-0.5">
            <Button variant={range === 6 ? "secondary" : "ghost"} size="sm" onClick={() => setRange(6)}>6mo</Button>
            <Button variant={range === 12 ? "secondary" : "ghost"} size="sm" onClick={() => setRange(12)}>12mo</Button>
          </div>
          <ExportButtons data={data} />
        </div>
      </div>

      <Tabs defaultValue="financial">
        <TabsList className="no-print flex-wrap h-auto">
          <TabsTrigger value="financial"><TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Financial</TabsTrigger>
          <TabsTrigger value="employees"><Users className="mr-1.5 h-3.5 w-3.5" /> Employees</TabsTrigger>
          <TabsTrigger value="sites"><MapPinned className="mr-1.5 h-3.5 w-3.5" /> Sites</TabsTrigger>
          <TabsTrigger value="invoices"><Receipt className="mr-1.5 h-3.5 w-3.5" /> Invoices</TabsTrigger>
          <TabsTrigger value="tenders"><FileSignature className="mr-1.5 h-3.5 w-3.5" /> Tenders</TabsTrigger>
        </TabsList>

        {/* ── Financial ── */}
        <TabsContent value="financial" className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ChartCard title="Revenue" description={`Last ${range} months`}>
              <Stat className="text-gradient-gold">{formatINR(data.revenue.total)}</Stat>
              <AreaChartCard data={revenueTrend} xKey="month" yKey="value" color={CHART_COLORS.gold} height={70} minimal />
            </ChartCard>
            <ChartCard title="Expenses" description={`Last ${range} months`}>
              <Stat>{formatINR(data.expenses.total)}</Stat>
              <AreaChartCard data={expenseTrend} xKey="month" yKey="value" color={CHART_COLORS.red} height={70} minimal />
            </ChartCard>
            <ChartCard title="Profit" description={`Margin ${data.profit.marginPct}%`}>
              <Stat className={data.profit.total >= 0 ? "" : "text-destructive"}>{formatINR(data.profit.total)}</Stat>
              <AreaChartCard data={profitTrend} xKey="month" yKey="value" color={CHART_COLORS.green} height={70} minimal />
            </ChartCard>
            <ChartCard title="Cash Flow" description="Payments received − expenses">
              <Stat>{formatINR(cashFlowTrend.reduce((s, c) => s + c.value, 0))}</Stat>
              <AreaChartCard data={cashFlowTrend} xKey="month" yKey="value" color={CHART_COLORS.blue} height={70} minimal />
            </ChartCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Revenue Trend" description="Monthly invoiced amount">
              <AreaChartCard data={revenueTrend} xKey="month" yKey="value" color={CHART_COLORS.gold} />
            </ChartCard>
            <ChartCard title="Expense Trend" description="Monthly spend across all sites">
              <AreaChartCard data={expenseTrend} xKey="month" yKey="value" color={CHART_COLORS.red} />
            </ChartCard>
            <ChartCard title="Revenue by Site" description="Top sites by invoiced amount">
              <BarChartCard data={data.revenue.bySite} xKey="name" yKey="value" color={CHART_COLORS.gold} />
            </ChartCard>
            <ChartCard title="Expense by Category">
              <div className="flex items-center gap-6">
                <DonutChart data={data.expenses.byCategory} nameKey="name" valueKey="value" height={180} className="max-w-[180px]" />
                <div className="flex flex-1 flex-col gap-2">
                  {data.expenses.byCategory.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: [CHART_COLORS.gold, CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.red, CHART_COLORS.violet][i % 5] }} />
                        {c.name}
                      </span>
                      <span className="tabular font-mono font-semibold">{formatINR(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
            <ChartCard title="Revenue by Client" description="Top clients by invoiced amount" className="lg:col-span-2">
              <BarChartCard data={data.revenue.byClient} xKey="name" yKey="value" color={CHART_COLORS.blue} />
            </ChartCard>
          </div>
        </TabsContent>

        {/* ── Employees ── */}
        <TabsContent value="employees" className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <ChartCard title="Active Employees"><Stat>{data.employees.activeCount}</Stat></ChartCard>
            <ChartCard title="Monthly Payroll"><Stat>{formatINR(data.employees.monthlyPayroll)}</Stat></ChartCard>
            <ChartCard title="Sites Staffed"><Stat>{data.employees.headcountBySite.length}</Stat></ChartCard>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Salary Cost Trend" description="Net payroll disbursed per month">
              <AreaChartCard data={salaryCostTrend} xKey="month" yKey="value" color={CHART_COLORS.green} />
            </ChartCard>
            <ChartCard title="Headcount by Site">
              <BarChartCard data={data.employees.headcountBySite} xKey="name" yKey="value" color={CHART_COLORS.blue} />
            </ChartCard>
            <ChartCard title="Active vs Inactive" className="lg:col-span-2">
              <div className="flex items-center gap-6">
                <DonutChart data={data.employees.activeVsInactive} nameKey="name" valueKey="value" height={160} className="max-w-[160px]" />
                <div className="flex flex-1 flex-col gap-2">
                  {data.employees.activeVsInactive.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: [CHART_COLORS.green, CHART_COLORS.red][i] }} />{c.name}</span>
                      <span className="tabular font-mono font-semibold">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* ── Sites ── */}
        <TabsContent value="sites" className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <ChartCard title="Total Sites"><Stat>{data.sites.total}</Stat></ChartCard>
            <ChartCard title="Total Site Expenses"><Stat>{formatINR(data.expenses.total)}</Stat></ChartCard>
            <ChartCard title="Total Site Revenue"><Stat>{formatINR(data.revenue.total)}</Stat></ChartCard>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Sites by Status">
              <DonutChart data={data.sites.byStatus} nameKey="name" valueKey="value" />
            </ChartCard>
            <ChartCard title="Sites by Type">
              <DonutChart data={data.sites.byType} nameKey="name" valueKey="value" colors={[CHART_COLORS.blue, CHART_COLORS.gold, CHART_COLORS.green, CHART_COLORS.violet, CHART_COLORS.red]} />
            </ChartCard>
            <ChartCard title="Expense by Site" className="lg:col-span-2">
              <BarChartCard data={data.expenses.bySite} xKey="name" yKey="value" color={CHART_COLORS.red} />
            </ChartCard>
          </div>
        </TabsContent>

        {/* ── Invoices ── */}
        <TabsContent value="invoices" className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <ChartCard title="Total Invoiced"><Stat>{formatINR(data.invoices.totalInvoiced)}</Stat></ChartCard>
            <ChartCard title="Outstanding"><Stat className="text-destructive">{formatINR(data.invoices.totalOutstanding)}</Stat></ChartCard>
            <ChartCard title="Average Invoice Value"><Stat>{formatINR(data.invoices.avgInvoiceValue)}</Stat></ChartCard>
          </div>
          <ChartCard title="Invoices by Status" description={`${data.invoices.count} invoices total`}>
            <div className="flex items-center gap-6">
              <DonutChart data={data.invoices.byStatus} nameKey="name" valueKey="value" height={180} className="max-w-[180px]" colors={[CHART_COLORS.blue, CHART_COLORS.gold, CHART_COLORS.green, CHART_COLORS.red]} />
              <div className="flex flex-1 flex-col gap-2">
                {data.invoices.byStatus.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: [CHART_COLORS.blue, CHART_COLORS.gold, CHART_COLORS.green, CHART_COLORS.red][i % 4] }} />{c.name}</span>
                    <span className="tabular font-mono font-semibold">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </TabsContent>

        {/* ── Tenders ── */}
        <TabsContent value="tenders" className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <ChartCard title="Win Rate" description="Of decided tenders"><Stat className="text-gradient-gold">{data.tenders.winRate}%</Stat></ChartCard>
            <ChartCard title="Pipeline Value" description="Preparing + Submitted"><Stat>{formatINR(data.tenders.pipelineValue)}</Stat></ChartCard>
            <ChartCard title="Total Won Value"><Stat className="text-success">{formatINR(data.tenders.totalWonValue)}</Stat></ChartCard>
          </div>
          <ChartCard title="Tenders by Status" description={`${data.tenders.count} tenders total`}>
            <BarChartCard data={data.tenders.byStatus} xKey="name" yKey="value" color={CHART_COLORS.gold} />
          </ChartCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
