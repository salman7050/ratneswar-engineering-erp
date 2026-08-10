import "server-only";
import { prisma } from "@/lib/prisma";
import type { AppUser } from "@/types";

/** Midnight-to-midnight boundaries for "today" in server local time. */
function todayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

const OPEN_TASK_STATUSES = ["PENDING", "IN_PROGRESS", "WAITING"] as const;

/** Lightweight site list for <Select> pickers — id + name only. */
export async function getSiteOptions() {
  return prisma.site.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/** Lightweight active-user list for "assign to" pickers. */
export async function getTeamOptions() {
  return prisma.user.findMany({
    where: { isActive: true, role: { in: ["OWNER", "ADMIN"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Everything the Command Center's first paint needs, in one round trip.
 * Scoped to the current user (assigned-to-them or created-by-them) so two
 * people opening the app at once never step on each other's daily plan.
 */
export async function getCommandCenterData(user: AppUser) {
  const { start: todayStart, end: todayEnd } = todayRange();

  const [
    overdueTasks,
    todayTasks,
    todayMeetings,
    todayFollowUps,
    todaySiteVisits,
    quickNotes,
    activeReminders,
    allOpenTasks,
    pendingPOs,
    pendingInvoices,
    pendingQuotations,
    pendingLeaves,
    pendingExpenses,
    completedTodayCount,
    weekCompletedCount,
    weekTotalCount,
    monthCompletedCount,
    monthTotalCount,
    eodToday,
  ] = await Promise.all([
    // Section 2 — overdue: anything with a due date before today, still open
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        status: { in: [...OPEN_TASK_STATUSES] },
        dueDate: { lt: todayStart },
      },
      include: { site: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: { dueDate: "asc" },
    }),
    // Section 3 — today's plan
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        dueDate: { gte: todayStart, lt: todayEnd },
      },
      include: { site: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: [{ status: "asc" }, { priority: "desc" }],
    }),
    // Section 6 — today's meetings
    prisma.meeting.findMany({
      where: { createdById: user.id, date: { gte: todayStart, lt: todayEnd } },
      orderBy: { time: "asc" },
    }),
    // Section 4 — today's follow-ups
    prisma.followUp.findMany({
      where: {
        assignedToId: user.id,
        dueDate: { gte: todayStart, lt: todayEnd },
      },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { status: "asc" },
    }),
    // Section 8 — today's site visits
    prisma.siteVisit.findMany({
      where: { engineerId: user.id, date: { gte: todayStart, lt: todayEnd } },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { time: "asc" },
    }),
    // Section 5 — quick notes
    prisma.quickNote.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    // Section 10 — smart reminders due in the next 30 days
    prisma.smartReminder.findMany({
      where: {
        status: "ACTIVE",
        dueDate: { lt: new Date(todayStart.getTime() + 30 * 86400000) },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
    // Section 9 — full task board (all open tasks, not just today)
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        status: { in: [...OPEN_TASK_STATUSES] },
      },
      include: { site: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 100,
    }),
    // Section 7 — approvals
    prisma.purchaseOrder.count({ where: { status: "DRAFT" } }),
    prisma.invoice.count({ where: { status: "DRAFT" } }),
    prisma.quotation.count({ where: { status: "DRAFT" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.expense.count({ where: { approved: false } }),
    // Section 12 — productivity
    prisma.task.count({
      where: { assignedToId: user.id, status: "COMPLETED", completedAt: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.task.count({
      where: {
        assignedToId: user.id,
        status: "COMPLETED",
        completedAt: { gte: new Date(todayStart.getTime() - 6 * 86400000), lt: todayEnd },
      },
    }),
    prisma.task.count({
      where: {
        assignedToId: user.id,
        createdAt: { gte: new Date(todayStart.getTime() - 6 * 86400000), lt: todayEnd },
      },
    }),
    prisma.task.count({
      where: {
        assignedToId: user.id,
        status: "COMPLETED",
        completedAt: { gte: new Date(todayStart.getFullYear(), todayStart.getMonth(), 1), lt: todayEnd },
      },
    }),
    prisma.task.count({
      where: {
        assignedToId: user.id,
        createdAt: { gte: new Date(todayStart.getFullYear(), todayStart.getMonth(), 1), lt: todayEnd },
      },
    }),
    // Section 11 — has today's EOD report already been filed?
    prisma.endOfDayReport.findUnique({
      where: { userId_date: { userId: user.id, date: todayStart } },
    }),
  ]);

  const todayTotalCount = todayTasks.length;
  const todayCompletedCount = todayTasks.filter((t) => t.status === "COMPLETED").length;
  const todayPendingCount = todayTotalCount - todayCompletedCount;
  const completionPct = todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  return {
    overdueTasks,
    todayTasks,
    todayMeetings,
    todayFollowUps,
    todaySiteVisits,
    quickNotes,
    activeReminders,
    allOpenTasks,
    approvals: {
      purchaseOrders: pendingPOs,
      invoices: pendingInvoices,
      quotations: pendingQuotations,
      leaves: pendingLeaves,
      expenses: pendingExpenses,
      total: pendingPOs + pendingInvoices + pendingQuotations + pendingLeaves + pendingExpenses,
    },
    productivity: {
      today: { total: todayTotalCount, completed: todayCompletedCount, pending: todayPendingCount, overdue: overdueTasks.length, completionPct },
      week: { completed: weekCompletedCount, total: weekTotalCount },
      month: { completed: monthCompletedCount, total: monthTotalCount },
    },
    eodSubmittedToday: Boolean(eodToday),
  };
}
