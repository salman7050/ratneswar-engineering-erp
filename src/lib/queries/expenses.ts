import "server-only";

import { prisma } from "@/lib/prisma";

export type ExpenseQueryRange = { from?: Date; to?: Date };

function dateWhere(range?: ExpenseQueryRange) {
  if (!range?.from && !range?.to) return undefined;
  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lte: range.to } : {}),
  };
}

export async function getExpenses(range?: ExpenseQueryRange) {
  const expenses = await prisma.expense.findMany({
    where: dateWhere(range) ? { date: dateWhere(range) } : undefined,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      site: { select: { id: true, name: true } },
      vendor: { select: { id: true, name: true } },
      purchaseOrder: { select: { id: true, poNo: true, vendorName: true } },
      createdBy: { select: { name: true } },
    },
  });

  return expenses.map((expense) => ({ ...expense, amount: Number(expense.amount) }));
}

/** Salary is not duplicated into the Expense table. This returns the approved/final
 * monthly archive distribution as a separate cost stream for management reports. */
export async function getSalaryCostEntries(range?: ExpenseQueryRange) {
  const monthRange = dateWhere(range);
  const records = await prisma.salaryMonthlyRecord.findMany({
    where: {
      status: { in: ["FINAL", "PAID"] },
      ...(monthRange
        ? {
            AND: [
              range?.from
                ? { OR: [{ year: { gt: range.from.getFullYear() } }, { year: range.from.getFullYear(), month: { gte: range.from.getMonth() + 1 } }] }
                : {},
              range?.to
                ? { OR: [{ year: { lt: range.to.getFullYear() } }, { year: range.to.getFullYear(), month: { lte: range.to.getMonth() + 1 } }] }
                : {},
            ],
          }
        : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: {
      distributions: {
        orderBy: { sortOrder: "asc" },
        include: { site: { select: { id: true, name: true } } },
      },
    },
  });

  return records.flatMap((record) =>
    record.distributions.map((dist) => ({
      id: `${record.id}:${dist.id}`,
      recordId: record.id,
      periodKey: record.periodKey,
      date: new Date(record.year, record.month - 1, 1),
      businessUnit: "Ratneswar Engineering",
      site: dist.site,
      label: dist.label,
      type: dist.type,
      // Employee site cost is gross; Rattilal cash labour is tracked as the actual cash paid.
      amount: Number(dist.type === "CASH_LABOUR" ? dist.netPaid : dist.grossAmount),
      grossAmount: Number(dist.grossAmount),
      netPaid: Number(dist.netPaid),
      isCash: dist.isCash,
    }))
  );
}

export async function getExpenseSites() {
  return prisma.site.findMany({
    where: { status: { not: "COMPLETED" } },
    select: { id: true, name: true, siteCode: true },
    orderBy: { name: "asc" },
  });
}

export async function getExpenseVendors() {
  return prisma.vendor.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getExpensePurchaseOrders() {
  return prisma.purchaseOrder.findMany({
    where: { status: { notIn: ["CANCELLED", "REJECTED"] } },
    select: { id: true, poNo: true, vendorName: true, siteId: true, grandTotal: true },
    orderBy: { date: "desc" },
    take: 250,
  }).then((rows) => rows.map((row) => ({ ...row, grandTotal: Number(row.grandTotal) })));
}

export type ExpenseListItem = Awaited<ReturnType<typeof getExpenses>>[number];
export type SalaryCostListItem = Awaited<ReturnType<typeof getSalaryCostEntries>>[number];
