"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

function revalidateEmployee(employeeId: string) {
  revalidatePath(`/employees/${employeeId}`);
}

const leaveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(["SICK", "CASUAL", "EARNED", "UNPAID"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  days: z.coerce.number().positive(),
  reason: z.string().optional().nullable(),
});

export async function applyLeave(input: z.infer<typeof leaveSchema>) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  const parsed = leaveSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.leaveRequest.create({ data: parsed.data });
  revalidateEmployee(parsed.data.employeeId);
  return ok(record);
}

export async function updateLeaveStatus(id: string, employeeId: string, status: "APPROVED" | "REJECTED" | "PENDING") {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;

  const record = await prisma.leaveRequest.update({ where: { id }, data: { status } });
  revalidateEmployee(employeeId);
  return ok(record);
}

export async function deleteLeave(id: string, employeeId: string) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  await prisma.leaveRequest.delete({ where: { id } });
  revalidateEmployee(employeeId);
  return ok(undefined);
}
