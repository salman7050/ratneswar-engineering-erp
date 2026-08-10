"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const aadhaarRegex = /^\d{12}$/;

const employeeSchema = z.object({
  employeeCode: z.string().min(2, "Employee code is required"),
  name: z.string().min(2, "Name is too short"),
  designation: z.string().min(2, "Designation is required"),
  department: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
  dateOfBirth: z.coerce.date().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  pan: z.string().regex(panRegex, "Invalid PAN format (e.g. ABCDE1234F)").optional().nullable().or(z.literal("")),
  aadhaar: z.string().regex(aadhaarRegex, "Aadhaar must be 12 digits").optional().nullable().or(z.literal("")),
  pfNumber: z.string().optional().nullable(),
  esicNumber: z.string().optional().nullable(),
  pfEnrolled: z.boolean(),
  esicEnrolled: z.boolean(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  ifsc: z.string().optional().nullable(),
  basic: z.coerce.number().positive("Basic pay must be greater than 0"),
  hra: z.coerce.number().nonnegative(),
  otherAllowance: z.coerce.number().nonnegative(),
  isActive: z.boolean(),
  joinedAt: z.coerce.date(),
  siteId: z.string().optional().nullable(),
});

function cleanEmpty<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const k of Object.keys(out)) {
    if (out[k] === "") (out as Record<string, unknown>)[k] = null;
  }
  return out;
}

export async function createEmployee(input: z.infer<typeof employeeSchema>) {
  const { user, error } = await authorize("employees", "create");
  if (!user) return error;

  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const employee = await prisma.employee.create({ data: cleanEmpty(parsed.data) });

  await prisma.auditLog.create({
    data: { action: "EMPLOYEE_CREATED", entityType: "Employee", entityId: employee.id, userId: user.id },
  });

  revalidatePath("/employees");
  return ok(employee);
}

export async function updateEmployee(id: string, input: z.infer<typeof employeeSchema>) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;

  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const employee = await prisma.employee.update({ where: { id }, data: cleanEmpty(parsed.data) });

  await prisma.auditLog.create({
    data: { action: "EMPLOYEE_UPDATED", entityType: "Employee", entityId: employee.id, userId: user.id },
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  return ok(employee);
}

export async function deleteEmployee(id: string) {
  const { user, error } = await authorize("employees", "delete");
  if (!user) return error;

  await prisma.employee.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { action: "EMPLOYEE_DELETED", entityType: "Employee", entityId: id, userId: user.id },
  });

  revalidatePath("/employees");
  return ok(undefined);
}
