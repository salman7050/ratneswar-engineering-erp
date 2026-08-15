import "server-only";
import { prisma } from "@/lib/prisma";

const money = (value: any) => Number(value ?? 0);

export async function getExecutiveDashboardData() {
  const now = new Date();
  const fyStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const next30 = new Date(now.getTime() + 30 * 86400000);

  const [
    activeSites, totalSites, purchaseOrders, quotations, invoices, pendingInvoices,
    activeContracts, lowStock, recentInvoices, recentQuotes, recentPos,
    monthlyRevenueRows, monthlyExpenseRows, upcomingDue, activities,
  ] = await Promise.all([
    prisma.site.count({ where: { status: "ACTIVE" } }),
    prisma.site.count(),
    prisma.purchaseOrder.count({ where: { date: { gte: fyStart } } }),
    prisma.quotation.count({ where: { date: { gte: fyStart } } }),
    prisma.invoice.count({ where: { date: { gte: fyStart } } }),
    prisma.invoice.findMany({ where: { status: { in: ["GENERATED", "OVERDUE"] } }, select: { grandTotal: true, payments: { select: { amount: true } } } }),
    prisma.billingContract.count({ where: { active: true } }),
    prisma.stockItem.count({ where: { reorderLevel: { gt: 0 } } }),
    prisma.invoice.findMany({ take: 4, orderBy: { createdAt: "desc" }, select: { id: true, invoiceNo: true, buyerName: true, grandTotal: true, status: true, createdAt: true } }),
    prisma.quotation.findMany({ take: 4, orderBy: { createdAt: "desc" }, select: { id: true, quoteNo: true, referenceNo: true, client: true, amount: true, status: true, createdAt: true } }),
    prisma.purchaseOrder.findMany({ take: 4, orderBy: { createdAt: "desc" }, select: { id: true, poNo: true, vendorName: true, grandTotal: true, status: true, createdAt: true } }),
    prisma.invoice.findMany({ where: { date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } }, select: { date: true, grandTotal: true } }),
    prisma.expense.findMany({ where: { date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } }, select: { date: true, amount: true } }),
    prisma.invoice.findMany({ where: { dueDate: { gte: now, lte: next30 }, status: { in: ["GENERATED", "OVERDUE"] } }, take: 5, orderBy: { dueDate: "asc" }, select: { id: true, invoiceNo: true, buyerName: true, dueDate: true, grandTotal: true, payments: { select: { amount: true } } } }),
    prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
  ]);

  const labels: string[] = [];
  const revenueMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    labels.push(key); revenueMap.set(key, 0); expenseMap.set(key, 0);
  }
  for (const row of monthlyRevenueRows) { const k = `${row.date.getFullYear()}-${row.date.getMonth()}`; if (revenueMap.has(k)) revenueMap.set(k, (revenueMap.get(k) ?? 0) + money(row.grandTotal)); }
  for (const row of monthlyExpenseRows) { const k = `${row.date.getFullYear()}-${row.date.getMonth()}`; if (expenseMap.has(k)) expenseMap.set(k, (expenseMap.get(k) ?? 0) + money(row.amount)); }
  const chart = labels.map((key) => {
    const [yearText, monthText] = key.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    return { month: new Date(year, month, 1).toLocaleDateString("en-IN", { month: "short" }), revenue: Math.round((revenueMap.get(key) ?? 0) / 1000), expenses: Math.round((expenseMap.get(key) ?? 0) / 1000) };
  });

  const outstanding = pendingInvoices.reduce((sum, inv) => sum + money(inv.grandTotal) - inv.payments.reduce((s, p) => s + money(p.amount), 0), 0);
  const thisMonthRevenue = monthlyRevenueRows.filter((r) => r.date >= monthStart).reduce((s, r) => s + money(r.grandTotal), 0);

  const recentDocuments = [
    ...recentInvoices.map((r) => ({ id: r.id, number: r.invoiceNo, title: r.buyerName, amount: money(r.grandTotal), status: r.status, type: "Invoice", href: `/invoices/${r.id}`, createdAt: r.createdAt.toISOString() })),
    ...recentQuotes.map((r) => ({ id: r.id, number: r.referenceNo, title: r.client, amount: money(r.amount), status: r.status, type: "Quotation", href: `/quotations/${r.id}`, createdAt: r.createdAt.toISOString() })),
    ...recentPos.map((r) => ({ id: r.id, number: r.poNo, title: r.vendorName, amount: money(r.grandTotal), status: r.status, type: "Purchase Order", href: `/purchase-orders/${r.id}`, createdAt: r.createdAt.toISOString() })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 7);

  return {
    counts: { activeSites, totalSites, purchaseOrders, quotations, invoices, activeContracts, lowStock },
    finance: { outstanding, thisMonthRevenue },
    chart,
    recentDocuments,
    upcomingDue: upcomingDue.map((r) => ({ id: r.id, invoiceNo: r.invoiceNo, buyerName: r.buyerName, dueDate: r.dueDate?.toISOString() ?? null, outstanding: money(r.grandTotal) - r.payments.reduce((s, p) => s + money(p.amount), 0) })),
    activities: activities.map((a) => ({ id: a.id, action: a.action, entityType: a.entityType, userName: a.user?.name ?? "System", createdAt: a.createdAt.toISOString() })),
  };
}

export type ExecutiveDashboardData = Awaited<ReturnType<typeof getExecutiveDashboardData>>;
