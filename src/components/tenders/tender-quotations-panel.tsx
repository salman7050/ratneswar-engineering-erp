import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import type { TenderDetail } from "@/lib/queries/tenders";

const STATUS_VARIANT = { DRAFT: "outline", SENT: "info", ACCEPTED: "success", REJECTED: "destructive", EXPIRED: "secondary" } as const;

export function TenderQuotationsPanel({ tenderId, quotations }: {
  tenderId: string;
  quotations: TenderDetail["quotations"];
  suggestedNo?: string;
  sites?: { id: string; name: string }[];
  bankAccounts?: { id: string; bankName: string; accountNo: string }[];
}) {
  return <div className="flex flex-col gap-3">
    <div className="flex justify-end"><Button asChild size="sm"><Link href={`/quotations/new?tenderId=${encodeURIComponent(tenderId)}`}><Plus className="h-4 w-4"/> New Quotation</Link></Button></div>
    {quotations.length === 0 ? <div className="flex flex-col items-center gap-2 py-8 text-center"><FileText className="h-6 w-6 text-muted-foreground/40"/><Muted className="text-xs">No quotations prepared for this tender yet.</Muted></div> : <ul className="flex flex-col gap-2">{quotations.map((q) => <li key={q.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5"><Link href={`/quotations/${q.id}`} className="min-w-0 flex-1 hover:text-blue-700"><p className="font-mono text-xs font-semibold">{q.quoteNo}</p><Muted className="text-[11px]">{formatDate(q.date)}</Muted></Link><span className="tabular font-mono text-sm">{formatINR(q.amount)}</span><Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge></li>)}</ul>}
  </div>;
}
