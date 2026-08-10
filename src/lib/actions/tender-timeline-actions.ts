"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

const timelineSchema = z.object({
  tenderId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.enum(["MILESTONE", "ISSUE", "VISIT", "GENERAL"]),
  eventDate: z.coerce.date(),
});

export async function addTenderTimelineEvent(input: z.infer<typeof timelineSchema>) {
  const { user, error } = await authorize("tenders", "edit");
  if (!user) return error;
  const parsed = timelineSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.timelineEvent.create({ data: { ...parsed.data, createdById: user.id } });
  revalidatePath(`/tenders/${parsed.data.tenderId}`);
  return ok(record);
}

export async function deleteTenderTimelineEvent(id: string, tenderId: string) {
  const { user, error } = await authorize("tenders", "edit");
  if (!user) return error;
  await prisma.timelineEvent.delete({ where: { id } });
  revalidatePath(`/tenders/${tenderId}`);
  return ok(undefined);
}
