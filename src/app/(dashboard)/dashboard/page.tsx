import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Receipt,
  ShoppingCart,
  WalletCards,
  Zap,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCleanDashboardData } from "@/lib/queries/clean-dashboard";
import { GreetingThoughtClock } from "@/components/dashboard/greeting-thought-clock";
import { DailyWorkPanels } from "@/components/dashboard/daily-work-panels";
import { AiOpenButton } from "@/components/dashboard/ai-open-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard · Ratneswar ERP" };
export const dynamic = "force-dynamic";

function Metric({ icon: Icon, value, label, href, tone }: { icon: typeof Building2; value: number; label: string; href: string; tone: "blue" | "green" | "teal" | "rose" | "sky" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    teal: "bg-teal-50 text-teal-700 ring-teal-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
  };
  return (
    <Link href={href} className="erp-glass-surface group flex min-h-[100px] items-center gap-4 rounded-2xl px-4 py-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_22px_48px_-26px_rgba(37,99,235,.38)]">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${styles[tone]}`}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0"><p className="text-2xl font-bold text-slate-950">{value}</p><p className="truncate text-xs font-medium text-slate-500">{label}</p></div>
      <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </Link>
  );
}

function pretty(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getCleanDashboardData(user);

  return (
    <div className="min-h-full bg-transparent px-4 py-5 md:px-6 lg:px-7">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <GreetingThoughtClock name={user.name} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Metric icon={CalendarCheck2} value={data.counts.openToday} label="Open Tasks Today" href="/dashboard" tone="blue" />
          <Metric icon={ClipboardCheck} value={data.counts.pendingWorks} label="Pending Works" href="/dashboard" tone="rose" />
          <Metric icon={Building2} value={data.counts.activeSites} label="Active Sites" href="/sites" tone="teal" />
          <Metric icon={Receipt} value={data.counts.recentInvoices} label="Recent Invoices" href="/invoices" tone="green" />
          <Metric icon={ShoppingCart} value={data.counts.openPurchaseOrders} label="Open Purchase Orders" href="/purchase-orders" tone="sky" />
        </div>

        <DailyWorkPanels
          todayTasks={data.todayTasks}
          pendingWorks={data.pendingWorks}
          sites={data.siteOptions}
          team={data.teamOptions}
          todayDate={data.indiaDateKey}
        />

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_.78fr]">
          <Card className="erp-glass-surface overflow-hidden p-0">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"><div><h2 className="text-sm font-semibold text-slate-900">Recent Invoices</h2><p className="mt-0.5 text-[11px] text-slate-400">Status only — financial values stay inside the module.</p></div><Button asChild variant="ghost" size="sm"><Link href="/invoices">View All <ArrowRight className="h-3.5 w-3.5" /></Link></Button></header>
            <div className="divide-y divide-slate-100">
              {data.recentInvoices.length ? data.recentInvoices.map((invoice) => (
                <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="rounded-lg bg-blue-50 p-2 text-blue-700"><Receipt className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-slate-800">{invoice.invoiceNo}</p><p className="truncate text-[11px] text-slate-400">{invoice.site?.name ?? invoice.buyerName}</p></div>
                  <div className="text-right"><Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "destructive" : "outline"}>{pretty(invoice.status)}</Badge><p className="mt-1 text-[10px] text-slate-400">{shortDate(invoice.date)}</p></div>
                </Link>
              )) : <p className="px-4 py-10 text-center text-xs text-slate-400">No recent invoices.</p>}
            </div>
          </Card>

          <Card className="erp-glass-surface overflow-hidden p-0">
            <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"><div><h2 className="text-sm font-semibold text-slate-900">Recent Expenses / Payments</h2><p className="mt-0.5 text-[11px] text-slate-400">Operational activity without exposing amounts.</p></div><Button asChild variant="ghost" size="sm"><Link href="/expenses">View All <ArrowRight className="h-3.5 w-3.5" /></Link></Button></header>
            <div className="divide-y divide-slate-100">
              {data.recentExpenses.length ? data.recentExpenses.map((expense) => (
                <Link key={expense.id} href="/expenses" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><WalletCards className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-slate-800">{expense.payee || expense.description}</p><p className="truncate text-[11px] text-slate-400">{expense.site?.name ?? expense.businessUnit} · {pretty(expense.transactionType)}</p></div>
                  <div className="text-right"><Badge variant={expense.documentStatus === "DOCUMENT_PENDING" ? "warning" : "outline"}>{pretty(expense.category)}</Badge><p className="mt-1 text-[10px] text-slate-400">{shortDate(expense.date)}</p></div>
                </Link>
              )) : <p className="px-4 py-10 text-center text-xs text-slate-400">No recent expense/payment activity.</p>}
            </div>
          </Card>

          <Card className="erp-glass-surface p-4">
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2></div>
            <div className="mt-4 space-y-2">
              <Button asChild variant="outline" className="h-11 w-full justify-start"><Link href="/invoices"><Receipt className="h-4 w-4 text-blue-600" /> New Invoice <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" /></Link></Button>
              <Button asChild variant="outline" className="h-11 w-full justify-start"><Link href="/purchase-orders"><ShoppingCart className="h-4 w-4 text-emerald-600" /> New PO <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" /></Link></Button>
              <Button asChild variant="outline" className="h-11 w-full justify-start"><Link href="/quotations"><FileText className="h-4 w-4 text-teal-600" /> New Quotation <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" /></Link></Button>
              <Button asChild variant="outline" className="h-11 w-full justify-start"><Link href="/expenses"><WalletCards className="h-4 w-4 text-rose-600" /> Record Expense <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" /></Link></Button>
              <Button asChild variant="outline" className="h-11 w-full justify-start"><Link href="/salary"><FileSpreadsheet className="h-4 w-4 text-cyan-600" /> Upload Salary Sheet <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" /></Link></Button>
              <AiOpenButton />
            </div>
          </Card>
        </div>

        <Card className="erp-glass-surface overflow-hidden p-0">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5"><div><h2 className="text-sm font-semibold text-slate-900">Site Activity</h2><p className="mt-0.5 text-[11px] text-slate-400">Quick operational view of active sites.</p></div><Button asChild variant="ghost" size="sm"><Link href="/sites">View All <ArrowRight className="h-3.5 w-3.5" /></Link></Button></header>
          <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
            {data.recentSites.map((site) => <Link href={`/sites/${site.id}`} key={site.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><Building2 className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold text-slate-800">{site.name}</p><p className="truncate text-[11px] text-slate-400">{site.capacity || pretty(site.type)}</p></div><Badge variant="success">Active</Badge></Link>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
