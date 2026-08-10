import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrls } from "@/lib/supabase/storage-server";

export async function getTenders() {
  const tenders = await prisma.tender.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      site: { select: { name: true } },
      owner: { select: { name: true } },
      _count: { select: { documents: true, boqItems: true } },
    },
  });
  return tenders.map((t) => ({
    ...t,
    estimatedValue: Number(t.estimatedValue),
    emdAmount: t.emdAmount === null ? null : Number(t.emdAmount),
    winningBidAmount: t.winningBidAmount === null ? null : Number(t.winningBidAmount),
  }));
}

export async function getTenderDetail(id: string) {
  const tender = await prisma.tender.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      approvedBy: { select: { name: true } },
      documents: { orderBy: { createdAt: "desc" } },
      boqItems: { orderBy: { slNo: "asc" } },
      quotations: { orderBy: { date: "desc" } },
      workOrders: { orderBy: { date: "desc" } },
      timeline: { orderBy: { eventDate: "desc" }, include: { createdBy: { select: { name: true } } } },
    },
  });
  if (!tender) return null;

  const documents = await resolveStoredFileUrls(tender.documents);

  return {
    ...tender,
    documents,
    estimatedValue: Number(tender.estimatedValue),
    emdAmount: tender.emdAmount === null ? null : Number(tender.emdAmount),
    winningBidAmount: tender.winningBidAmount === null ? null : Number(tender.winningBidAmount),
    boqItems: tender.boqItems.map((b) => ({ ...b, quantity: Number(b.quantity), rate: Number(b.rate), amount: Number(b.amount) })),
    quotations: tender.quotations.map((q) => ({ ...q, amount: Number(q.amount) })),
    workOrders: tender.workOrders.map((w) => ({ ...w, value: Number(w.value) })),
  };
}

export async function suggestNextTenderNo(): Promise<string> {
  const yy = String(new Date().getFullYear()).slice(-2);
  const prefix = `RE/${yy}/TDR/`;
  const latest = await prisma.tender.findFirst({
    where: { tenderNo: { startsWith: prefix } },
    orderBy: { tenderNo: "desc" },
    select: { tenderNo: true },
  });
  const lastSeq = latest ? parseInt(latest.tenderNo.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(3, "0")}`;
}

export type TenderDetail = NonNullable<Awaited<ReturnType<typeof getTenderDetail>>>;
export type TenderListItem = Awaited<ReturnType<typeof getTenders>>[number];
