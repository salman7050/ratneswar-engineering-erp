import "server-only";

import { prisma } from "@/lib/prisma";

function n(value: unknown) {
  return Number(value ?? 0);
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getExpensePortalAdminData() {
  const [members, submissions, passbookEntries] = await Promise.all([
    prisma.expenseMember.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: { _count: { select: { submissions: true, passbookEntries: true } } },
    }),
    prisma.expenseSubmission.findMany({
      orderBy: { submittedAt: "desc" },
      take: 100,
      include: {
        member: true,
        reviewedBy: { select: { name: true } },
        items: { include: { site: { select: { name: true, location: true } } }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.memberPassbookEntry.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 500,
      include: {
        member: { select: { id: true, name: true, area: true } },
        site: { select: { name: true, location: true } },
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  return {
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      roleLabel: m.roleLabel,
      businessUnit: m.businessUnit,
      area: m.area,
      token: m.token,
      isActive: m.isActive,
      createdAt: iso(m.createdAt)!,
      submissionCount: m._count.submissions,
      passbookCount: m._count.passbookEntries,
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status,
      note: s.note,
      submittedAt: iso(s.submittedAt)!,
      reviewedAt: iso(s.reviewedAt),
      reviewedBy: s.reviewedBy?.name ?? null,
      member: {
        id: s.member.id,
        name: s.member.name,
        phone: s.member.phone,
        roleLabel: s.member.roleLabel,
        businessUnit: s.member.businessUnit,
        area: s.member.area,
      },
      items: s.items.map((item) => ({
        id: item.id,
        date: iso(item.date)!,
        category: item.category,
        siteId: item.siteId,
        siteName: item.site?.name ?? item.siteName,
        siteLocation: item.site?.location ?? null,
        description: item.description,
        amount: n(item.amount),
        paymentMode: item.paymentMode,
        reference: item.reference,
        receiptUrl: item.receiptUrl,
        reimbursementRequested: item.reimbursementRequested,
        expenseId: item.expenseId,
      })),
    })),
    passbookEntries: passbookEntries.map((e) => ({
      id: e.id,
      type: e.type,
      date: iso(e.date)!,
      description: e.description,
      amount: n(e.amount),
      reference: e.reference,
      proofUrl: e.proofUrl,
      member: e.member,
      site: e.site,
      sourceExpenseId: e.sourceExpenseId,
      createdBy: e.createdBy.name,
    })),
  };
}

export async function getPublicExpensePortal(token: string) {
  const member = await prisma.expenseMember.findFirst({
    where: { token, isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      roleLabel: true,
      businessUnit: true,
      area: true,
    },
  });
  if (!member) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [sites, passbook, pendingCount] = await Promise.all([
    prisma.site.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, location: true },
    }),
    prisma.memberPassbookEntry.findMany({
      where: { memberId: member.id, date: { gte: monthStart, lt: nextMonth } },
      select: { type: true, amount: true },
    }),
    prisma.expenseSubmission.count({ where: { memberId: member.id, status: "PENDING" } }),
  ]);

  const advances = passbook.filter((x) => x.type === "ADVANCE").reduce((s, x) => s + n(x.amount), 0);
  const expenses = passbook.filter((x) => x.type === "EXPENSE").reduce((s, x) => s + n(x.amount), 0);
  const refunds = passbook.filter((x) => x.type === "REFUND").reduce((s, x) => s + n(x.amount), 0);
  const adjustments = passbook.filter((x) => x.type === "ADJUSTMENT").reduce((s, x) => s + n(x.amount), 0);

  return {
    member,
    sites,
    summary: {
      month: now.toISOString().slice(0, 7),
      advances,
      expenses,
      refunds,
      adjustments,
      balance: advances + refunds + adjustments - expenses,
      pendingCount,
    },
  };
}
