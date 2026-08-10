import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PartiesClient } from "@/components/parties/parties-client";
import { H1, Muted } from "@/components/ui/typography";

export const metadata = { title: "Clients & Parties · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function PartiesPage() {
  await requirePermission("billing", "view");
  const [clients, subcontractors] = await Promise.all([
    prisma.client.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }], include: { _count: { select: { sites: true, invoices: true, billingContracts: true } } } }),
    prisma.subcontractor.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }], include: { _count: { select: { sites: true, invoices: true, billingContracts: true } } } }),
  ]);
  return <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 md:px-8"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Master Data</p><H1 className="mt-1 text-2xl md:text-3xl">Clients & Billing Parties</H1><Muted className="mt-1">Maintain client and subcontractor details once, then reuse them across sites, quotations, invoices and monthly billing.</Muted></div><PartiesClient clients={clients as any} subcontractors={subcontractors as any} /></div>;
}
