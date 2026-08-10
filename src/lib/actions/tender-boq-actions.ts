"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

const boqItemSchema = z.object({
  slNo: z.number().int().positive(),
  description: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.coerce.number().positive(),
  rate: z.coerce.number().nonnegative(),
});

const saveBoqSchema = z.object({
  tenderId: z.string().min(1),
  items: z.array(boqItemSchema),
});

/** Replaces the entire BOQ for a tender in one save — simplest mental model for a bill of quantities. */
export async function saveTenderBoq(input: z.infer<typeof saveBoqSchema>) {
  const { user, error } = await authorize("tenders", "edit");
  if (!user) return error;
  const parsed = saveBoqSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const itemsWithAmount = parsed.data.items.map((it) => ({
    ...it,
    amount: Math.round(it.quantity * it.rate * 100) / 100,
  }));

  await prisma.$transaction([
    prisma.tenderBoqItem.deleteMany({ where: { tenderId: parsed.data.tenderId } }),
    prisma.tenderBoqItem.createMany({
      data: itemsWithAmount.map((it) => ({ ...it, tenderId: parsed.data.tenderId })),
    }),
  ]);

  revalidatePath(`/tenders/${parsed.data.tenderId}`);
  return ok(undefined);
}
