import "server-only";
import { prisma } from "@/lib/prisma";
import { toNum, bucketByMonth, groupAndSum } from "@/lib/analytics-utils";

type DecimalLike = { toNumber: () => number };

interface InvoiceRow { date: Date; grandTotal: DecimalLike | number; status: string; buyerName: string; siteId: string | null; site: { name: string } | null; }
interface ExpenseRow { date: Date; amount: DecimalLike | number; category: string; siteId: string | null; site: { name: string } | null; }
interface EmployeeRow { isActive: boolean; basic: DecimalLike | number; hra: DecimalLike | number; otherAllowance: DecimalLike | number; siteId: string | null; site: { name: string } | null; joinedAt: Date; }
interface SalarySlipRow { createdAt: Date; netPay: DecimalLike | number; }
interface SiteRow { status: string; type: string; }
interface InvoiceStatusRow { status: string; grandTotal: DecimalLike | number; }
interface TenderRow { status: string; estimatedValue: DecimalLike | number; winningBidAmount: DecimalLike | number | null; emdStatus: string; }
interface PaymentRow { date: Date; amount: DecimalLike | number; }

export async function getAnalyticsData(months = 12) {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [
    invoices, expenses, employees, salarySlips, sites, invoicesAll, tenders, payments,
  ]: [InvoiceRow[], ExpenseRow[], EmployeeRow[], SalarySlipRow[], SiteRow[], InvoiceStatusRow[], TenderRow[], PaymentRow[]] = await Promise.all([
    prisma.invoice.findMany({
      where: { date: { gte: rangeStart } },
      select: { date: true, grandTotal: true, status: true, buyerName: true, siteId: true, site: { select: { name: true } } },
    }),
    prisma.expense.findMany({
      where: { date: { gte: rangeStart } },
      select: { date: true, amount: true, category: true, siteId: true, site: { select: { name: true } } },
    }),
    prisma.employee.findMany({
      select: { isActive: true, basic: true, hra: true, otherAllowance: true, siteId: true, site: { select: { name: true } }, joinedAt: true },
    }),
    prisma.salarySlip.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true, netPay: true },
    }),
    prisma.site.findMany({ select: { status: true, type: true } }),
    prisma.invoice.findMany({ select: { status: true, grandTotal: true } }),
    prisma.tender.findMany({ select: { status: true, estimatedValue: true, winningBidAmount: true, emdStatus: true } }),
    prisma.paymentRecord.findMany({
      where: { date: { gte: rangeStart } },
      select: { date: true, amount: true },
    }),
  ]);

  // ── Revenue ──
  const revenueTrend = bucketByMonth(invoices, (i) => i.date, (i) => toNum(i.grandTotal), months, now);
  const revenueBySite = groupAndSum(invoices, (i) => i.site?.name ?? "Unassigned", (i) => toNum(i.grandTotal), 6);
  const revenueByClient = groupAndSum(invoices, (i) => i.buyerName, (i) => toNum(i.grandTotal), 6);

  // ── Expenses ──
  const CATEGORY_LABEL: Record<string, string> = { MATERIAL: "Material", LABOUR: "Labour", FUEL: "Fuel", TRANSPORT: "Transport", EQUIPMENT: "Equipment", MISC: "Misc" };
  const expenseTrend = bucketByMonth(expenses, (e) => e.date, (e) => toNum(e.amount), months, now);
  const expenseByCategory = groupAndSum(expenses, (e) => CATEGORY_LABEL[e.category] ?? e.category, (e) => toNum(e.amount));
  const expenseBySite = groupAndSum(expenses, (e) => e.site?.name ?? "Unassigned", (e) => toNum(e.amount), 6);

  // ── Profit & Cash Flow ──
  const profitTrend = revenueTrend.map((r, i) => ({ month: r.month, value: r.value - (expenseTrend[i]?.value ?? 0) }));
  const paymentsIn = bucketByMonth(payments, (p) => p.date, (p) => toNum(p.amount), months, now);
  const cashFlowTrend = paymentsIn.map((p, i) => ({ month: p.month, value: p.value - (expenseTrend[i]?.value ?? 0) }));

  const totalRevenue = revenueTrend.reduce((s, r) => s + r.value, 0);
  const totalExpense = expenseTrend.reduce((s, r) => s + r.value, 0);
  const totalProfit = totalRevenue - totalExpense;
  const marginPct = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  // ── Employees ──
  const activeEmployees = employees.filter((e) => e.isActive);
  const headcountBySite = groupAndSum(activeEmployees, (e) => e.site?.name ?? "Unassigned", () => 1);
  const salaryCostTrend = bucketByMonth(salarySlips, (s) => s.createdAt, (s) => toNum(s.netPay), months, now);
  const activeVsInactive = [
    { name: "Active", value: employees.filter((e) => e.isActive).length },
    { name: "Inactive", value: employees.filter((e) => !e.isActive).length },
  ];
  const monthlyPayroll = activeEmployees.reduce((s, e) => s + toNum(e.basic) + toNum(e.hra) + toNum(e.otherAllowance), 0);

  // ── Sites ──
  const SITE_STATUS_LABEL: Record<string, string> = { ACTIVE: "Active", COMPLETED: "Completed", ON_HOLD: "On Hold" };
  const SITE_TYPE_LABEL: Record<string, string> = { SUBSTATION: "Substation", HYDRO: "Hydro", PUMPING_STATION: "Pumping Station", SOLAR: "Solar", OM_CONTRACT: "O&M", EPC: "EPC", OTHER: "Other" };
  const sitesByStatus = groupAndSum(sites, (s) => SITE_STATUS_LABEL[s.status] ?? s.status, () => 1);
  const sitesByType = groupAndSum(sites, (s) => SITE_TYPE_LABEL[s.type] ?? s.type, () => 1);

  // ── Invoices ──
  const INVOICE_STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", GENERATED: "Generated", PAID: "Paid", OVERDUE: "Overdue" };
  const invoicesByStatus = groupAndSum(invoicesAll, (i) => INVOICE_STATUS_LABEL[i.status] ?? i.status, () => 1);
  const totalOutstanding = invoicesAll.filter((i) => i.status !== "PAID").reduce((s, i) => s + toNum(i.grandTotal), 0);
  const totalInvoiced = invoicesAll.reduce((s, i) => s + toNum(i.grandTotal), 0);
  const avgInvoiceValue = invoicesAll.length > 0 ? Math.round(totalInvoiced / invoicesAll.length) : 0;

  // ── Tenders ──
  const TENDER_STATUS_LABEL: Record<string, string> = { PREPARING: "Preparing", SUBMITTED: "Submitted", WON: "Won", LOST: "Lost", CANCELLED: "Cancelled", COMPLETED: "Completed" };
  const tendersByStatus = groupAndSum(tenders, (t) => TENDER_STATUS_LABEL[t.status] ?? t.status, () => 1);
  const decided = tenders.filter((t) => t.status === "WON" || t.status === "LOST");
  const winRate = decided.length > 0 ? Math.round((decided.filter((t) => t.status === "WON").length / decided.length) * 100) : 0;
  const pipelineValue = tenders.filter((t) => t.status === "PREPARING" || t.status === "SUBMITTED").reduce((s, t) => s + toNum(t.estimatedValue), 0);
  const totalWonValue = tenders.filter((t) => t.status === "WON" || t.status === "COMPLETED").reduce((s, t) => s + (t.winningBidAmount !== null ? toNum(t.winningBidAmount) : toNum(t.estimatedValue)), 0);

  return {
    revenue: { trend: revenueTrend, bySite: revenueBySite, byClient: revenueByClient, total: totalRevenue },
    expenses: { trend: expenseTrend, byCategory: expenseByCategory, bySite: expenseBySite, total: totalExpense },
    profit: { trend: profitTrend, total: totalProfit, marginPct },
    cashFlow: { trend: cashFlowTrend },
    employees: { headcountBySite, salaryCostTrend, activeVsInactive, activeCount: activeEmployees.length, monthlyPayroll },
    sites: { byStatus: sitesByStatus, byType: sitesByType, total: sites.length },
    invoices: { byStatus: invoicesByStatus, totalOutstanding, totalInvoiced, avgInvoiceValue, count: invoicesAll.length },
    tenders: { byStatus: tendersByStatus, winRate, pipelineValue, totalWonValue, count: tenders.length },
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
