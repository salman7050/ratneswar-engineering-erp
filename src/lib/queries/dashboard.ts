import "server-only";
import { prisma } from "@/lib/prisma";

/** Structural type for Prisma's Decimal (avoids depending on the exact `Prisma` namespace shape). */
type DecimalLike = { toNumber: () => number };

function toNum(d: DecimalLike | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  return typeof d === "number" ? d : d.toNumber();
}

/** April-start Indian financial year boundary for the given date. */
function fyStart(date: Date): Date {
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(y, 3, 1);
}

function monthKey(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short" });
}

/** Builds an ordered [{month, value}] series for the last `count` months, zero-filled. */
function bucketByMonth<T>(
  rows: T[],
  getDate: (r: T) => Date,
  getValue: (r: T) => number,
  months: number,
  now: Date
): { month: string; value: number }[] {
  const buckets = new Map<string, number>();
  const order: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    buckets.set(key, 0);
    order.push(key);
  }
  for (const row of rows) {
    const key = monthKey(getDate(row));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + getValue(row));
  }
  return order.map((month) => ({ month, value: Math.round((buckets.get(month) ?? 0) / 1000) })); // ₹ thousands
}

export interface DashboardData {
  revenue: { total: number; trend: { month: string; value: number }[] };
  expenses: { total: number; trend: { month: string; value: number }[]; byCategory: { name: string; value: number }[] };
  cashFlow: { net: number; trend: { month: string; value: number }[] };
  profit: { total: number; marginPct: number };
  runningSites: number;
  totalSites: number;
  employees: number;
  pendingInvoices: { count: number; amount: number };
  pendingQuotations: { count: number; amount: number };
  tenderStatus: { name: string; count: number }[];
  recentActivities: {
    id: string;
    action: string;
    entityType: string;
    userName: string;
    createdAt: string;
  }[];
  upcomingEmds: { id: string; name: string; tenderNo: string; emdDeadline: string; daysLeft: number }[];
  overdueInvoices: { id: string; invoiceNo: string; buyerName: string; grandTotal: number }[];
  hasAnyData: boolean;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const fy = fyStart(now);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    invoicesForRevenue,
    expensesForTrend,
    expensesByCategoryRaw,
    runningSites,
    totalSites,
    employees,
    pendingInvoicesRaw,
    pendingQuotationsRaw,
    tenderStatusRaw,
    recentActivitiesRaw,
    upcomingEmdsRaw,
    overdueInvoicesRaw,
    anyInvoice,
    anySite,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { date: true, grandTotal: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { date: true, amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { date: { gte: fy } },
      _sum: { amount: true },
    }),
    prisma.site.count({ where: { status: "ACTIVE" } }),
    prisma.site.count(),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.invoice.findMany({
      where: { status: { in: ["GENERATED", "OVERDUE"] } },
      select: { grandTotal: true },
    }),
    prisma.quotation.findMany({
      where: { status: { in: ["DRAFT", "SENT"] } },
      select: { amount: true },
    }),
    prisma.tender.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.tender.findMany({
      where: {
        status: { in: ["PREPARING", "SUBMITTED"] },
        emdDeadline: { gte: now, lte: in7Days },
      },
      orderBy: { emdDeadline: "asc" },
      take: 5,
      select: { id: true, name: true, tenderNo: true, emdDeadline: true },
    }),
    prisma.invoice.findMany({
      where: { status: "OVERDUE" },
      take: 5,
      select: { id: true, invoiceNo: true, buyerName: true, grandTotal: true },
    }),
    prisma.invoice.findFirst({ select: { id: true } }),
    prisma.site.findFirst({ select: { id: true } }),
  ]);

  const revenueTotal = invoicesForRevenue.reduce(
    (s: number, i: { grandTotal: DecimalLike | number }) => s + toNum(i.grandTotal),
    0
  );
  const expensesTotalFY = expensesByCategoryRaw.reduce(
    (s: number, e: { _sum: { amount: DecimalLike | number | null } }) => s + toNum(e._sum.amount),
    0
  );
  const expensesTotal6m = expensesForTrend.reduce(
    (s: number, e: { amount: DecimalLike | number }) => s + toNum(e.amount),
    0
  );

  const revenueTrend = bucketByMonth(
    invoicesForRevenue,
    (i: { date: Date; grandTotal: DecimalLike | number }) => i.date,
    (i: { date: Date; grandTotal: DecimalLike | number }) => toNum(i.grandTotal),
    6,
    now
  );
  const expensesTrend = bucketByMonth(
    expensesForTrend,
    (e: { date: Date; amount: DecimalLike | number }) => e.date,
    (e: { date: Date; amount: DecimalLike | number }) => toNum(e.amount),
    6,
    now
  );
  const cashFlowTrend = revenueTrend.map((r, idx) => ({
    month: r.month,
    value: r.value - (expensesTrend[idx]?.value ?? 0),
  }));

  const profit = revenueTotal - expensesTotalFY;
  const marginPct = revenueTotal > 0 ? Math.round((profit / revenueTotal) * 100) : 0;

  const CATEGORY_LABEL: Record<string, string> = {
    MATERIAL: "Material", LABOUR: "Labour", FUEL: "Fuel",
    TRANSPORT: "Transport", EQUIPMENT: "Equipment", MISC: "Misc",
  };
  const STATUS_LABEL: Record<string, string> = {
    PREPARING: "Preparing", SUBMITTED: "Submitted", WON: "Won", LOST: "Lost", CANCELLED: "Cancelled",
  };

  return {
    revenue: { total: revenueTotal, trend: revenueTrend },
    expenses: {
      total: expensesTotalFY,
      trend: expensesTrend,
      byCategory: expensesByCategoryRaw.map((e: { category: string; _sum: { amount: DecimalLike | number | null } }) => ({
        name: CATEGORY_LABEL[e.category] ?? e.category,
        value: Math.round(toNum(e._sum.amount) / 1000),
      })),
    },
    cashFlow: {
      net: revenueTotal - expensesTotal6m,
      trend: cashFlowTrend,
    },
    profit: { total: profit, marginPct },
    runningSites,
    totalSites,
    employees,
    pendingInvoices: {
      count: pendingInvoicesRaw.length,
      amount: pendingInvoicesRaw.reduce((s: number, i: { grandTotal: DecimalLike | number }) => s + toNum(i.grandTotal), 0),
    },
    pendingQuotations: {
      count: pendingQuotationsRaw.length,
      amount: pendingQuotationsRaw.reduce((s: number, q: { amount: DecimalLike | number }) => s + toNum(q.amount), 0),
    },
    tenderStatus: tenderStatusRaw.map((t: { status: string; _count: { _all: number } }) => ({
      name: STATUS_LABEL[t.status] ?? t.status,
      count: t._count._all,
    })),
    recentActivities: recentActivitiesRaw.map((a: {
      id: string; action: string; entityType: string; createdAt: Date; user: { name: string } | null;
    }) => ({
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      userName: a.user?.name ?? "System",
      createdAt: a.createdAt.toISOString(),
    })),
    upcomingEmds: upcomingEmdsRaw.map((t: { id: string; name: string; tenderNo: string; emdDeadline: Date | null }) => ({
      id: t.id,
      name: t.name,
      tenderNo: t.tenderNo,
      emdDeadline: t.emdDeadline!.toISOString(),
      daysLeft: Math.ceil((t.emdDeadline!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    })),
    overdueInvoices: overdueInvoicesRaw.map((i: { id: string; invoiceNo: string; buyerName: string; grandTotal: DecimalLike | number }) => ({
      id: i.id,
      invoiceNo: i.invoiceNo,
      buyerName: i.buyerName,
      grandTotal: toNum(i.grandTotal),
    })),
    hasAnyData: Boolean(anyInvoice || anySite),
  };
}
