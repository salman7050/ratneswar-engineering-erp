"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateSite(siteId: string) {
  revalidatePath(`/sites/${siteId}`);
}

// ── Insurance ─────────────────────────────────────────────────

const insuranceSchema = z.object({
  siteId: z.string().min(1),
  policyNo: z.string().min(1),
  provider: z.string().min(1),
  type: z.string().min(1),
  coverageAmount: z.coerce.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export async function addInsurance(input: z.infer<typeof insuranceSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = insuranceSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.insurance.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteInsurance(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.insurance.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}

// ── AMC ───────────────────────────────────────────────────────

const amcSchema = z.object({
  siteId: z.string().min(1),
  vendor: z.string().min(1),
  scope: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  amount: z.coerce.number().positive(),
  status: z.enum(["ACTIVE", "EXPIRED", "PENDING"]),
});

export async function addAMC(input: z.infer<typeof amcSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = amcSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.aMC.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteAMC(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.aMC.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}

// ── Warranty ──────────────────────────────────────────────────

const warrantySchema = z.object({
  siteId: z.string().min(1),
  itemName: z.string().min(1),
  vendor: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  terms: z.string().optional().nullable(),
});

export async function addWarranty(input: z.infer<typeof warrantySchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = warrantySchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.warranty.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteWarranty(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.warranty.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}
