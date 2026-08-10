"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

const reviewSchema = z.object({
  employeeId: z.string().min(1),
  reviewPeriod: z.string().min(1),
  rating: z.enum(["BELOW_EXPECTATIONS", "MEETS_EXPECTATIONS", "EXCEEDS_EXPECTATIONS", "OUTSTANDING"]),
  strengths: z.string().optional().nullable(),
  improvements: z.string().optional().nullable(),
  reviewedBy: z.string().min(1),
  reviewDate: z.coerce.date(),
});

export async function addPerformanceReview(input: z.infer<typeof reviewSchema>) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.performanceReview.create({ data: parsed.data });
  revalidatePath(`/employees/${parsed.data.employeeId}`);
  return ok(record);
}

export async function deletePerformanceReview(id: string, employeeId: string) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  await prisma.performanceReview.delete({ where: { id } });
  revalidatePath(`/employees/${employeeId}`);
  return ok(undefined);
}
