"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, fail, zodError } from "@/lib/actions/action-utils";

function revalidateStockItem(id: string) {
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
}

const receiveSchema = z.object({
  stockItemId: z.string().min(1),
  storeId: z.string().min(1),
  vendorId: z.string().optional().nullable(),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative().optional().nullable(),
  date: z.coerce.date(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function receiveStock(input: z.infer<typeof receiveSchema>) {
  const { user, error } = await authorize("inventory", "create");
  if (!user) return error;
  const parsed = receiveSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.stockTransaction.create({
    data: { ...parsed.data, type: "RECEIVE", createdById: user.id },
  });
  revalidateStockItem(parsed.data.stockItemId);
  return ok(record);
}

const issueSchema = z.object({
  stockItemId: z.string().min(1),
  storeId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  issuedTo: z.string().min(1, "Specify who/where this was issued to"),
  date: z.coerce.date(),
  referenceNo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function issueStock(input: z.infer<typeof issueSchema>) {
  const { user, error } = await authorize("inventory", "create");
  if (!user) return error;
  const parsed = issueSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  // Guard against issuing more than what's currently in that store for this item.
  const txns = await prisma.stockTransaction.findMany({
    where: { stockItemId: parsed.data.stockItemId, storeId: parsed.data.storeId },
    select: { type: true, quantity: true },
  });
  const balance = txns.reduce((s, t) => s + (t.type === "RECEIVE" ? Number(t.quantity) : -Number(t.quantity)), 0);
  if (parsed.data.quantity > balance) {
    return fail(`Only ${balance} available in this store — can't issue ${parsed.data.quantity}.`);
  }

  const record = await prisma.stockTransaction.create({
    data: { ...parsed.data, type: "ISSUE", createdById: user.id },
  });
  revalidateStockItem(parsed.data.stockItemId);
  return ok(record);
}

export async function deleteStockTransaction(id: string, stockItemId: string) {
  const { user, error } = await authorize("inventory", "delete");
  if (!user) return error;
  await prisma.stockTransaction.delete({ where: { id } });
  revalidateStockItem(stockItemId);
  return ok(undefined);
}
