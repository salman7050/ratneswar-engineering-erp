import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { indiaDayRange } from "@/lib/queries/clean-dashboard";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { name: "UnknownError", code: "unknown", message: String(error).slice(0, 900) };
  }
  const e = error as { name?: string; code?: string; message?: string; meta?: unknown };
  return {
    name: e.name ?? "Error",
    code: e.code ?? "unknown",
    message: (e.message ?? "Unknown error")
      .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, "[DATABASE_URL_REDACTED]")
      .slice(0, 900),
    meta: e.meta ?? null,
  };
}

async function run(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return { name, ok: true };
  } catch (error) {
    return { name, ok: false, error: safeError(error) };
  }
}

export async function GET() {
  const user = await requireUser();
  const { start, end } = indiaDayRange();
  const thirtyDaysAgo = new Date(start.getTime() - 30 * 86_400_000);

  const checks = [];
  checks.push(await run("todayTasks", () =>
    prisma.task.findMany({
      where: { assignedToId: user.id, dueDate: { gte: start, lt: end } },
      include: { site: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: [{ status: "asc" }, { dueTime: "asc" }, { priority: "desc" }],
      take: 1,
    })
  ));
  checks.push(await run("pendingWorks", () =>
    prisma.task.findMany({
      where: {
        assignedToId: user.id,
        status: { in: ["PENDING", "IN_PROGRESS", "WAITING"] },
        OR: [{ dueDate: { lt: start } }, { dueDate: null }],
      },
      include: { site: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 1,
    })
  ));
  checks.push(await run("activeSites", () =>
    prisma.site.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, capacity: true, type: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 1,
    })
  ));
  checks.push(await run("recentInvoices", () =>
    prisma.invoice.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, invoiceNo: true, status: true, date: true, buyerName: true, site: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 1,
    })
  ));
  checks.push(await run("recentExpenses", () =>
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
      take: 1,
    })
  ));
  checks.push(await run("openPurchaseOrders", () =>
    prisma.purchaseOrder.count({
      where: { status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "ISSUED", "PARTIALLY_RECEIVED"] } },
    })
  ));
  checks.push(await run("teamOptions", () =>
    prisma.user.findMany({
      where: { isActive: true, role: { in: ["OWNER", "ADMIN"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 1,
    })
  ));

  const failed = checks.filter((item) => !item.ok);
  return NextResponse.json({
    ok: failed.length === 0,
    failedCount: failed.length,
    checks,
  }, { status: failed.length ? 503 : 200 });
}
