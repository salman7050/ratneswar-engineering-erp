"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateSite(siteId: string) {
  revalidatePath(`/sites/${siteId}`);
}

// ── Maintenance ───────────────────────────────────────────────

const maintenanceSchema = z.object({
  siteId: z.string().min(1),
  type: z.enum(["PREVENTIVE", "CORRECTIVE"]),
  description: z.string().min(1),
  performedBy: z.string().min(1),
  date: z.coerce.date(),
  cost: z.coerce.number().nonnegative().optional().nullable(),
  nextDueDate: z.coerce.date().optional().nullable(),
});

export async function addMaintenanceLog(input: z.infer<typeof maintenanceSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.maintenanceLog.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteMaintenanceLog(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.maintenanceLog.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}

// ── Breakdown ─────────────────────────────────────────────────

const breakdownSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  reportedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().optional().nullable(),
  downtimeHours: z.coerce.number().nonnegative().optional().nullable(),
  resolution: z.string().optional().nullable(),
});

export async function addBreakdownLog(input: z.infer<typeof breakdownSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = breakdownSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.breakdownLog.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function resolveBreakdown(id: string, siteId: string, resolution: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  const record = await prisma.breakdownLog.update({
    where: { id },
    data: { resolvedAt: new Date(), resolution },
  });
  revalidateSite(siteId);
  return ok(record);
}

export async function deleteBreakdownLog(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.breakdownLog.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}

// ── Timeline ──────────────────────────────────────────────────

const timelineSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.enum(["MILESTONE", "ISSUE", "VISIT", "GENERAL"]),
  eventDate: z.coerce.date(),
});

export async function addTimelineEvent(input: z.infer<typeof timelineSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = timelineSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.timelineEvent.create({
    data: { ...parsed.data, createdById: user.id },
  });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteTimelineEvent(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.timelineEvent.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}
