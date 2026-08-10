import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PartyDialog, PartyGrid } from "@/components/parties/parties-client";
import { H1, Muted } from "@/components/ui/typography";

export const metadata = { title: "Clients · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requirePermission("billing", "view");
  const clients = await prisma.client.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }], include: { _count: { select: { sites: true, invoices: true, billingContracts: true } } } });
  return <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 md:px-8"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Master Data</p><H1 className="mt-1 text-2xl md:text-3xl">Clients</H1><Muted className="mt-1">Client GST, contact and billing details used across sites, quotations and invoices.</Muted></div><PartyDialog type="client" /></div><PartyGrid type="client" records={clients as any} /></div>;
}
