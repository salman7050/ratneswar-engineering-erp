import { requirePermission } from "@/lib/auth";
import { getSalaryMonthlyRecords } from "@/lib/queries/salary-records";
import { SalaryArchiveClient } from "@/components/salary/salary-archive-client";

export const metadata = { title: "Salary Records · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function SalaryPage() {
  await requirePermission("salary", "view");
  const records = await getSalaryMonthlyRecords();
  return <div className="min-h-full bg-[#f6f8fb] px-4 py-6 md:px-7"><div className="mx-auto max-w-[1500px]"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">Records & Distribution</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Salary Records</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Your existing Excel workflow stays unchanged. Upload the final verified monthly salary sheet and ERP archives, distributes and tracks it site-wise.</p></div><SalaryArchiveClient records={records} /></div></div>;
}
