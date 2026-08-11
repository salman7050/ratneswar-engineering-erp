import "server-only";
import { prisma } from "@/lib/prisma";
import type { AppUser } from "@/types";
import { withDatabaseRetry } from "@/lib/db-retry";

const OPEN = ["PENDING", "IN_PROGRESS", "WAITING"] as const;

/** Calendar boundaries for the current date in India, represented as instants. */
export function indiaDayRange(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const key = `${get("year")}-${get("month")}-${get("day")}`;
  const start = new Date(`${key}T00:00:00+05:30`);
  const end = new Date(start.getTime() + 86_400_000);
  return { key, start, end };
}

export async function getCleanDashboardData(user: AppUser) {
  const { key, start, end } = indiaDayRange();
  const thirtyDaysAgo = new Date(start.getTime() - 30 * 86_400_000);

  const [
    todayTasks,
    pendingWorks,
    activeSites,
    recentSites,
    recentInvoices,
    recentExpenses,
    recentPOs,
    siteOptions,
    teamOptions,
  ] = await withDatabaseRetry(() => Promise.all([
    prisma.task.findMany({
      where: { assignedToId: user.id, dueDate: { gte: start, lt: end } },
      include: { site: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: [{ status: "asc" }, { dueTime: "asc" }, { priority: "desc" }],
    }),
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        status: { in: [...OPEN] },
        OR: [{ dueDate: { lt: start } }, { dueDate: null }],
      },
      include: { site: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 12,
    }),
    prisma.site.count({ where: { status: "ACTIVE" } }),
    prisma.site.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, capacity: true, type: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.invoice.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, invoiceNo: true, status: true, date: true, buyerName: true, site: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        description: true,
        category: true,
        transactionType: true,
        payee: true,
        businessUnit: true,
        date: true,
        documentStatus: true,
        site: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.purchaseOrder.findMany({
      where: { status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "ISSUED", "PARTIALLY_RECEIVED"] } },
      select: { id: true, poNo: true, vendorName: true, status: true, date: true, site: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.site.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["OWNER", "ADMIN"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]), "dashboard-data");

  const completedToday = todayTasks.filter((task) => task.status === "COMPLETED").length;
  const openToday = todayTasks.filter((task) => OPEN.includes(task.status as (typeof OPEN)[number])).length;
  const pendingPOCount = recentPOs.filter((po) => !["COMPLETED", "CANCELLED", "REJECTED"].includes(po.status)).length;

  return {
    indiaDateKey: key,
    todayTasks,
    pendingWorks,
    activeSites,
    recentSites,
    recentInvoices,
    recentExpenses,
    recentPOs,
    siteOptions,
    teamOptions,
    counts: {
      today: todayTasks.length,
      completedToday,
      openToday,
      pendingWorks: pendingWorks.length,
      activeSites,
      recentInvoices: recentInvoices.length,
      openPurchaseOrders: pendingPOCount,
    },
  };
}
