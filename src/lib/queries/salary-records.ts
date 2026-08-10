import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/supabase/storage-server";

export async function getSalaryMonthlyRecords() {
  const rows = await prisma.salaryMonthlyRecord.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { createdBy: { select: { name: true } }, distributions: { include: { site: { select: { id: true, name: true } } }, orderBy: { sortOrder: "asc" } } },
  });
  return Promise.all(rows.map(async (row) => ({
    ...row,
    employeeGross: Number(row.employeeGross), bankPayable: Number(row.bankPayable), cashLabour: Number(row.cashLabour), totalManpowerCost: Number(row.totalManpowerCost),
    pfEmployee: Number(row.pfEmployee), pfEmployer: Number(row.pfEmployer), professionalTax: Number(row.professionalTax), advanceRecovery: Number(row.advanceRecovery),
    salaryDownloadUrl: await resolveStoredFileUrl(row.salaryFileUrl),
    bankDownloadUrl: row.bankFileUrl ? await resolveStoredFileUrl(row.bankFileUrl) : null,
    paymentProofDownloadUrl: row.paymentProofUrl ? await resolveStoredFileUrl(row.paymentProofUrl) : null,
    distributions: row.distributions.map((d) => ({ ...d, grossAmount: Number(d.grossAmount), netPaid: Number(d.netPaid) })),
  })));
}
export type SalaryMonthlyRecordItem = Awaited<ReturnType<typeof getSalaryMonthlyRecords>>[number];
