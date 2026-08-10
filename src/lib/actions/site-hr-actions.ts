"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

const attendanceSchema = z.object({
  siteId: z.string().min(1),
  employeeId: z.string().min(1),
  date: z.coerce.date(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function recordAttendance(input: z.infer<typeof attendanceSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const { siteId, employeeId, date, ...rest } = parsed.data;

  const record = await prisma.attendance.upsert({
    where: { siteId_employeeId_date: { siteId, employeeId, date } },
    update: rest,
    create: { siteId, employeeId, date, ...rest },
  });

  revalidatePath(`/sites/${siteId}`);
  return ok(record);
}

export async function deleteAttendance(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  await prisma.attendance.delete({ where: { id } });
  revalidatePath(`/sites/${siteId}`);
  return ok(undefined);
}
