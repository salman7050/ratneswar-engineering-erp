"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateTender(id?: string) {
  revalidatePath("/tenders");
  if (id) revalidatePath(`/tenders/${id}`);
}

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const k of Object.keys(out)) if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  return out;
}

const tenderSchema = z.object({
  tenderNo: z.string().min(1),
  name: z.string().min(1),
  department: z.string().min(1),
  estimatedValue: z.coerce.number().positive(),
  emdAmount: z.coerce.number().nonnegative().optional().nullable(),
  emdDeadline: z.coerce.date().optional().nullable(),
  submissionDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  siteId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
});

export async function createTender(input: z.infer<typeof tenderSchema>) {
  const { user, error } = await authorize("tenders", "create");
  if (!user) return error;
  const parsed = tenderSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const tender = await prisma.$transaction(async (tx) => {
    const t = await tx.tender.create({ data: cleanEmpty(parsed.data) });
    await tx.timelineEvent.create({
      data: { tenderId: t.id, title: "Tender created", category: "MILESTONE", eventDate: new Date(), createdById: user.id },
    });
    return t;
  });

  await prisma.auditLog.create({ data: { action: "TENDER_CREATED", entityType: "Tender", entityId: tender.id, userId: user.id } });
  revalidateTender();
  return ok(tender);
}

export async function updateTender(id: string, input: z.infer<typeof tenderSchema>) {
  const { user, error } = await authorize("tenders", "edit");
  if (!user) return error;
  const parsed = tenderSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const tender = await prisma.tender.update({ where: { id }, data: cleanEmpty(parsed.data) });
  await prisma.auditLog.create({ data: { action: "TENDER_UPDATED", entityType: "Tender", entityId: id, userId: user.id } });
  revalidateTender(id);
  return ok(tender);
}

export async function deleteTender(id: string) {
  const { user, error } = await authorize("tenders", "delete");
  if (!user) return error;
  await prisma.tender.delete({ where: { id } });
  await prisma.auditLog.create({ data: { action: "TENDER_DELETED", entityType: "Tender", entityId: id, userId: user.id } });
  revalidateTender();
  return ok(undefined);
}

const STATUS_LABEL: Record<string, string> = {
  PREPARING: "moved back to Preparing", SUBMITTED: "submitted", WON: "won 🎉",
  LOST: "marked lost", CANCELLED: "cancelled", COMPLETED: "marked completed",
};

export async function updateTenderStatus(
  id: string,
  status: "PREPARING" | "SUBMITTED" | "WON" | "LOST" | "CANCELLED" | "COMPLETED",
  extra?: { winningBidAmount?: number | null; competitorNotes?: string | null }
) {
  const { user, error } = await authorize("tenders", "edit");
  if (!user) return error;

  const tender = await prisma.$transaction(async (tx) => {
    const t = await tx.tender.update({
      where: { id },
      data: {
        status,
        ...(status === "WON" && extra ? { winningBidAmount: extra.winningBidAmount, competitorNotes: extra.competitorNotes } : {}),
      },
    });
    await tx.timelineEvent.create({
      data: {
        tenderId: id,
        title: `Tender ${STATUS_LABEL[status] ?? status.toLowerCase()}`,
        category: status === "WON" || status === "COMPLETED" ? "MILESTONE" : status === "LOST" ? "ISSUE" : "GENERAL",
        eventDate: new Date(),
        createdById: user.id,
      },
    });
    return t;
  });

  await prisma.auditLog.create({ data: { action: `TENDER_STATUS_${status}`, entityType: "Tender", entityId: id, userId: user.id } });
  revalidateTender(id);
  return ok(tender);
}

export async function updateEmdStatus(
  id: string,
  emdStatus: "PENDING" | "SUBMITTED" | "REFUNDED" | "FORFEITED",
  date?: Date
) {
  const { user, error } = await authorize("tenders", "edit");
  if (!user) return error;

  const data: Record<string, unknown> = { emdStatus };
  if (emdStatus === "SUBMITTED") data.emdSubmittedDate = date ?? new Date();
  if (emdStatus === "REFUNDED") data.emdRefundDate = date ?? new Date();

  const tender = await prisma.tender.update({ where: { id }, data });
  revalidateTender(id);
  return ok(tender);
}

// ── Approval workflow ─────────────────────────────────────────

export async function requestTenderApproval(id: string) {
  const { user, error } = await authorize("tenders", "edit");
  if (!user) return error;
  const tender = await prisma.tender.update({ where: { id }, data: { approvalStatus: "PENDING" } });
  revalidateTender(id);
  return ok(tender);
}

export async function decideTenderApproval(id: string, decision: "APPROVED" | "REJECTED", notes?: string | null) {
  const { user, error } = await authorize("tenders", "approve");
  if (!user) return error;

  const tender = await prisma.$transaction(async (tx) => {
    const t = await tx.tender.update({
      where: { id },
      data: { approvalStatus: decision, approvedById: user.id, approvedAt: new Date(), approvalNotes: notes ?? null },
    });
    await tx.timelineEvent.create({
      data: {
        tenderId: id,
        title: decision === "APPROVED" ? "Approved for submission" : "Approval rejected",
        category: decision === "APPROVED" ? "MILESTONE" : "ISSUE",
        eventDate: new Date(),
        createdById: user.id,
      },
    });
    return t;
  });

  revalidateTender(id);
  return ok(tender);
}
