"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateInventory() {
  revalidatePath("/inventory");
}

// ── Vendors ───────────────────────────────────────────────────

const vendorSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
});

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const k of Object.keys(out)) if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  return out;
}

export async function createVendor(input: z.infer<typeof vendorSchema>) {
  const { user, error } = await authorize("inventory", "create");
  if (!user) return error;
  const parsed = vendorSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const record = await prisma.vendor.create({ data: cleanEmpty(parsed.data) });
  revalidateInventory();
  return ok(record);
}

export async function deleteVendor(id: string) {
  const { user, error } = await authorize("inventory", "delete");
  if (!user) return error;
  await prisma.vendor.delete({ where: { id } });
  revalidateInventory();
  return ok(undefined);
}

// ── Stores ────────────────────────────────────────────────────

const storeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["CENTRAL", "SITE"]),
  siteId: z.string().optional().nullable(),
});

export async function createStore(input: z.infer<typeof storeSchema>) {
  const { user, error } = await authorize("inventory", "create");
  if (!user) return error;
  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const record = await prisma.store.create({ data: cleanEmpty(parsed.data) });
  revalidateInventory();
  return ok(record);
}

export async function deleteStore(id: string) {
  const { user, error } = await authorize("inventory", "delete");
  if (!user) return error;
  await prisma.store.delete({ where: { id } });
  revalidateInventory();
  return ok(undefined);
}

// ── Stock Items (materials master) ───────────────────────────

const stockItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  reorderLevel: z.coerce.number().nonnegative(),
  standardRate: z.coerce.number().nonnegative().optional().nullable(),
});

export async function createStockItem(input: z.infer<typeof stockItemSchema>) {
  const { user, error } = await authorize("inventory", "create");
  if (!user) return error;
  const parsed = stockItemSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const record = await prisma.stockItem.create({ data: cleanEmpty(parsed.data) });
  revalidateInventory();
  return ok(record);
}

export async function updateStockItem(id: string, input: z.infer<typeof stockItemSchema>) {
  const { user, error } = await authorize("inventory", "edit");
  if (!user) return error;
  const parsed = stockItemSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const record = await prisma.stockItem.update({ where: { id }, data: cleanEmpty(parsed.data) });
  revalidateInventory();
  revalidatePath(`/inventory/${id}`);
  return ok(record);
}

export async function deleteStockItem(id: string) {
  const { user, error } = await authorize("inventory", "delete");
  if (!user) return error;
  await prisma.stockItem.delete({ where: { id } });
  revalidateInventory();
  return ok(undefined);
}
