import { requirePermission } from "@/lib/auth";
import { getTenders, suggestNextTenderNo } from "@/lib/queries/tenders";
import { getSites, getAssignableUsers } from "@/lib/queries/sites";
import { TenderFormDialog } from "@/components/tenders/tender-form-dialog";
import { TenderListClient } from "@/components/tenders/tender-list-client";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Tenders · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function TendersPage() {
  await requirePermission("tenders", "view");
  const [tenders, sites, owners, suggestedNo] = await Promise.all([
    getTenders(), getSites(), getAssignableUsers(), suggestNextTenderNo(),
  ]);

  const wonValue = tenders.filter((t) => t.status === "WON" || t.status === "COMPLETED").reduce((s, t) => s + (t.winningBidAmount ?? t.estimatedValue), 0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Tenders</H1>
          <Muted className="mt-1">{tenders.length} tender{tenders.length === 1 ? "" : "s"} · {formatINR(wonValue)} won to date</Muted>
        </div>
        <TenderFormDialog suggestedNo={suggestedNo} sites={sites.map((s) => ({ id: s.id, name: s.name }))} owners={owners} />
      </div>

      <TenderListClient tenders={tenders} />
    </div>
  );
}
