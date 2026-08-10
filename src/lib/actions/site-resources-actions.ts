"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateSite(siteId: string) {
  revalidatePath(`/sites/${siteId}`);
}

// ── Material ──────────────────────────────────────────────────

const materialSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.coerce.number().positive(),
  ratePerUnit: z.coerce.number().nonnegative(),
  receivedDate: z.coerce.date(),
  supplier: z.string().optional().nullable(),
});

export async function addMaterial(input: z.infer<typeof materialSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.material.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function deleteMaterial(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.material.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}

// ── Inventory ─────────────────────────────────────────────────

const inventorySchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().min(1),
  minThreshold: z.coerce.number().nonnegative().optional().nullable(),
  location: z.string().optional().nullable(),
});

export async function addInventoryItem(input: z.infer<typeof inventorySchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = inventorySchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.inventoryItem.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function updateInventoryQuantity(id: string, siteId: string, quantity: number) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const record = await prisma.inventoryItem.update({ where: { id }, data: { quantity } });
  revalidateSite(siteId);
  return ok(record);
}

export async function deleteInventoryItem(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.inventoryItem.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}

// ── Assets ────────────────────────────────────────────────────

const assetSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  assetTag: z.string().min(1),
  category: z.string().min(1),
  purchaseDate: z.coerce.date().optional().nullable(),
  purchaseValue: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(["ACTIVE", "UNDER_MAINTENANCE", "RETIRED"]),
});

export async function addAsset(input: z.infer<typeof assetSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const parsed = assetSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.asset.create({ data: parsed.data });
  revalidateSite(parsed.data.siteId);
  return ok(record);
}

export async function updateAssetStatus(id: string, siteId: string, status: "ACTIVE" | "UNDER_MAINTENANCE" | "RETIRED") {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  const record = await prisma.asset.update({ where: { id }, data: { status } });
  revalidateSite(siteId);
  return ok(record);
}

export async function deleteAsset(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;
  await prisma.asset.delete({ where: { id } });
  revalidateSite(siteId);
  return ok(undefined);
}
