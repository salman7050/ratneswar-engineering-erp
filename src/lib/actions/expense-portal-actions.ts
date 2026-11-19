"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";

function makeToken() {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
}

const memberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  roleLabel: z.string().trim().min(2).max(80),
  businessUnit: z.string().trim().min(2).max(120).default("Ratneswar Engineering"),
  area: z.string().trim().max(120).optional().nullable(),
});

export async function createExpenseMember(input: z.infer<typeof memberSchema>) {
  const { user, error } = await authorize("expenses", "create");
  if (!user) return error;

  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const member = await prisma.expenseMember.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      roleLabel: parsed.data.roleLabel,
      businessUnit: parsed.data.businessUnit,
      area: parsed.data.area || null,
      token: makeToken(),
      createdById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "EXPENSE_MEMBER_CREATED",
      entityType: "ExpenseMember",
      entityId: member.id,
      userId: user.id,
      metadata: { name: member.name, roleLabel: member.roleLabel },
    },
  });

  revalidatePath("/expenses");
  return ok(member);
}

export async function setExpenseMemberActive(id: string, isActive: boolean) {
  const { user, error } = await authorize("expenses", "edit");
  if (!user) return error;

  const member = await prisma.expenseMember.update({ where: { id }, data: { isActive } });
  await prisma.auditLog.create({
    data: {
      action: isActive ? "EXPENSE_LINK_ENABLED" : "EXPENSE_LINK_REVOKED",
      entityType: "ExpenseMember",
      entityId: id,
      userId: user.id,
    },
  });
  revalidatePath("/expenses");
  return ok(member);
}

export async function regenerateExpenseMemberLink(id: string) {
  const { user, error } = await authorize("expenses", "edit");
  if (!user) return error;

  const member = await prisma.expenseMember.update({
    where: { id },
    data: { token: makeToken(), isActive: true },
  });
  await prisma.auditLog.create({
    data: {
      action: "EXPENSE_LINK_REGENERATED",
      entityType: "ExpenseMember",
      entityId: id,
      userId: user.id,
    },
  });
  revalidatePath("/expenses");
  return ok(member);
}

export async function approveExpenseSubmission(id: string) {
  const { user, error } = await authorize("expenses", "edit");
  if (!user) return error;

  const submission = await prisma.expenseSubmission.findUnique({
    where: { id },
    include: { member: true, items: { include: { site: true } } },
  });
  if (!submission) return fail("Submission not found.");
  if (submission.status !== "PENDING") return fail("This submission has already been reviewed.");
  if (!submission.items.length) return fail("Submission has no expense lines.");

  await prisma.$transaction(async (tx) => {
    for (const item of submission.items) {
      const siteLabel = item.site?.name || item.siteName || "General / Office";
      const categoryLabel = item.category.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
      const expense = await tx.expense.create({
        data: {
          category: item.category,
          description: item.description,
          amount: item.amount,
          date: item.date,
          businessUnit: submission.member.businessUnit,
          transactionType: "EXPENSE",
          payee: submission.member.name,
          paymentMode: item.paymentMode,
          bankReference: item.reference,
          documentUrl: item.receiptUrl,
          documentStatus: item.receiptUrl ? "AVAILABLE" : "NOT_REQUIRED",
          source: "EMPLOYEE_LINK",
          approved: true,
          siteId: item.siteId,
          createdById: user.id,
        },
      });

      await tx.memberPassbookEntry.create({
        data: {
          type: "EXPENSE",
          date: item.date,
          description: `${categoryLabel} | ${siteLabel} | ${item.description}`,
          amount: item.amount,
          reference: item.reference,
          proofUrl: item.receiptUrl,
          memberId: submission.memberId,
          siteId: item.siteId,
          sourceExpenseId: expense.id,
          createdById: user.id,
        },
      });

      await tx.expenseSubmissionItem.update({
        where: { id: item.id },
        data: { expenseId: expense.id },
      });
    }

    await tx.expenseSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedById: user.id },
    });

    await tx.auditLog.create({
      data: {
        action: "EXPENSE_SUBMISSION_APPROVED",
        entityType: "ExpenseSubmission",
        entityId: id,
        userId: user.id,
        metadata: { memberId: submission.memberId, itemCount: submission.items.length },
      },
    });
  });

  revalidatePath("/expenses");
  return ok(undefined);
}

export async function rejectExpenseSubmission(id: string) {
  const { user, error } = await authorize("expenses", "edit");
  if (!user) return error;

  const current = await prisma.expenseSubmission.findUnique({ where: { id }, select: { status: true, memberId: true } });
  if (!current) return fail("Submission not found.");
  if (current.status !== "PENDING") return fail("This submission has already been reviewed.");

  await prisma.expenseSubmission.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedById: user.id },
  });
  await prisma.auditLog.create({
    data: {
      action: "EXPENSE_SUBMISSION_REJECTED",
      entityType: "ExpenseSubmission",
      entityId: id,
      userId: user.id,
      metadata: { memberId: current.memberId },
    },
  });
  revalidatePath("/expenses");
  return ok(undefined);
}

const advanceSchema = z.object({
  memberId: z.string().min(1),
  amount: z.number().positive().max(100000000),
  date: z.coerce.date(),
  purpose: z.string().trim().min(2).max(500),
  reference: z.string().trim().max(120).optional().nullable(),
  proofUrl: z.string().trim().max(1000).optional().nullable(),
});

export async function recordMemberAdvance(input: z.infer<typeof advanceSchema>) {
  const { user, error } = await authorize("expenses", "create");
  if (!user) return error;

  const parsed = advanceSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const member = await prisma.expenseMember.findUnique({ where: { id: parsed.data.memberId }, select: { id: true, name: true } });
  if (!member) return fail("Member not found.");

  const entry = await prisma.memberPassbookEntry.create({
    data: {
      type: "ADVANCE",
      date: parsed.data.date,
      description: parsed.data.purpose,
      amount: parsed.data.amount,
      reference: parsed.data.reference || null,
      proofUrl: parsed.data.proofUrl || null,
      memberId: member.id,
      createdById: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "MEMBER_ADVANCE_RECORDED",
      entityType: "MemberPassbookEntry",
      entityId: entry.id,
      userId: user.id,
      metadata: { memberId: member.id, amount: parsed.data.amount },
    },
  });
  revalidatePath("/expenses");
  return ok(entry);
}
