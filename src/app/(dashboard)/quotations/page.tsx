import Link from "next/link";
import { FileText, Plus, ShieldAlert } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getQuotations } from "@/lib/queries/quotations";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata = { title: "Quotations · Ratneswar ERP" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT = { DRAFT: "outline", SENT: "info", ACCEPTED: "success", REJECTED: "destructive", EXPIRED: "secondary" } as const;

export default async function QuotationsPage() {
  await requirePermission("quotations", "view");
  const quotations = await getQuotations();

  return <div className="mx-auto flex max-w-[1450px] flex-col gap-6 px-4 py-6 md:px-8">
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div><H1 className="text-2xl md:text-3xl">Quotations</H1><Muted className="mt-1">Smart letterhead quotations with automatic reference numbers, free AI drafting and owner safety approval.</Muted></div>
      <Button asChild><Link href="/quotations/new"><Plus className="h-4 w-4"/> New Quotation</Link></Button>
    </div>

    <div className="grid gap-3 md:grid-cols-4">
      <Card className="p-4"><p className="text-xs text-slate-500">Total</p><p className="mt-1 text-2xl font-bold">{quotations.length}</p></Card>
      <Card className="p-4"><p className="text-xs text-slate-500">Draft / Pending</p><p className="mt-1 text-2xl font-bold">{quotations.filter((q) => q.status === "DRAFT").length}</p></Card>
      <Card className="p-4"><p className="text-xs text-slate-500">Owner Approval</p><p className="mt-1 text-2xl font-bold text-amber-600">{quotations.filter((q) => q.approvalStatus === "PENDING").length}</p></Card>
      <Card className="p-4"><p className="text-xs text-slate-500">Accepted</p><p className="mt-1 text-2xl font-bold text-emerald-600">{quotations.filter((q) => q.status === "ACCEPTED").length}</p></Card>
    </div>

    {quotations.length === 0 ? <Card className="flex flex-col items-center gap-3 p-12 text-center"><FileText className="h-9 w-9 text-slate-300"/><p className="font-semibold">No quotations yet</p><Muted>Create the first smart quotation. You only enter facts and rates; wording can be prepared automatically.</Muted></Card> : <TableContainer><Table><TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Client / Subject</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Grand Total</TableHead><TableHead>Approval</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{quotations.map((q) => <TableRow key={q.id}>
      <TableCell><Link href={`/quotations/${q.id}`} className="font-mono text-xs font-bold text-blue-700 hover:underline">{q.referenceNo}</Link></TableCell>
      <TableCell><p className="text-sm font-semibold">{q.client}</p><p className="max-w-[420px] truncate text-xs text-slate-500">{q.subject}</p></TableCell>
      <TableCell className="text-sm text-slate-500">{formatDate(q.date)}</TableCell>
      <TableCell className="text-right font-mono text-sm font-semibold">{formatINR(q.amount)}</TableCell>
      <TableCell>{q.approvalStatus === "PENDING" ? <Badge variant="warning"><ShieldAlert className="mr-1 h-3 w-3"/> Owner Pending</Badge> : q.approvalStatus === "APPROVED" ? <Badge variant="success">Approved</Badge> : q.approvalStatus === "REJECTED" ? <Badge variant="destructive">Revision Required</Badge> : <Badge variant="outline">Not Required</Badge>}</TableCell>
      <TableCell><Badge variant={STATUS_VARIANT[q.status]}>{q.status}</Badge></TableCell>
    </TableRow>)}</TableBody></Table></TableContainer>}
  </div>;
}
