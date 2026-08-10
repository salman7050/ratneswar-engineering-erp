"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";
import { deleteStoredFile } from "@/lib/supabase/storage-server";

const documentSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  category: z.enum([
    "INSURANCE", "WORK_ORDER", "AGREEMENT", "INVOICE_BILL", "QUOTATION",
    "TESTING_REPORT", "STAFF_DOCUMENT", "ATTENDANCE", "TENDER_DOCUMENT", "OTHER",
  ]),
  fileUrl: z.string().min(1),
  fileSize: z.coerce.number().nonnegative(),
  mimeType: z.string().min(1),
});

export async function addEmployeeDocument(input: z.infer<typeof documentSchema>) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.document.create({
    data: { ...parsed.data, uploadedById: user.id },
  });
  revalidatePath(`/employees/${parsed.data.employeeId}`);
  return ok(record);
}

export async function deleteEmployeeDocument(id: string, employeeId: string) {
  const { user, error } = await authorize("employees", "edit");
  if (!user) return error;
  const document = await prisma.document.delete({ where: { id } });
  await deleteStoredFile(document.fileUrl);
  revalidatePath(`/employees/${employeeId}`);
  return ok(undefined);
}
