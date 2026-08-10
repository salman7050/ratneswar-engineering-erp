"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateInventory() {
  revalidatePath("/inventory/assets");
}

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const k of Object.keys(out)) if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  return out;
}

const assetSchema = z.object({
  name: z.string().min(1),
  assetTag: z.string().min(1),
  category: z.string().min(1),
  location: z.string().optional().nullable(),
  siteId: z.string().optional().nullable(),
  purchaseDate: z.coerce.date().optional().nullable(),
  purchaseValue: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(["ACTIVE", "UNDER_MAINTENANCE", "RETIRED"]),
});

export async function createGlobalAsset(input: z.infer<typeof assetSchema>) {
  const { user, error } = await authorize("inventory", "create");
  if (!user) return error;
  const parsed = assetSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const record = await prisma.asset.create({ data: cleanEmpty(parsed.data) });
  revalidateInventory();
  return ok(record);
}

export async function updateGlobalAssetStatus(id: string, status: "ACTIVE" | "UNDER_MAINTENANCE" | "RETIRED") {
  const { user, error } = await authorize("inventory", "edit");
  if (!user) return error;
  const record = await prisma.asset.update({ where: { id }, data: { status } });
  revalidateInventory();
  return ok(record);
}

export async function deleteGlobalAsset(id: string) {
  const { user, error } = await authorize("inventory", "delete");
  if (!user) return error;
  await prisma.asset.delete({ where: { id } });
  revalidateInventory();
  return ok(undefined);
}
