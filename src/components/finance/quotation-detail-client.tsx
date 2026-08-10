"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightCircle, CheckCircle2, Pencil, ShieldAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OfficialQuotationPrint } from "@/components/finance/official-quotation-print";
import { PrintButton, EmailShareButton, WhatsAppShareButton } from "@/components/finance/share-buttons";
import { HistoryPanel } from "@/components/finance/history-panel";
import { updateQuotationStatus, convertQuotationToInvoice, approveQuotation, rejectQuotationApproval } from "@/lib/actions/quotation-actions";
import { useAction } from "@/hooks/use-action";
import { formatINR } from "@/lib/utils";
import type { QuotationDetail } from "@/lib/queries/quotations";
import type { CompanyInfo } from "@/components/finance/document-print-view";
import type { AppRole } from "@/types";

const STATUS_VARIANT = { DRAFT: "outline", SENT: "info", ACCEPTED: "success", REJECTED: "destructive", EXPIRED: "secondary" } as const;

export function QuotationDetailClient({ quotation, company, history, userRole, userId }: {
  quotation: QuotationDetail;
  company: CompanyInfo;
  history: { id: string; action: string; createdAt: Date | string; user: { name: string } | null }[];
  userRole: AppRole;
  userId: string;
}) {
  const router = useRouter();
  const [reviewNote, setReviewNote] = React.useState("");
  const { run: setStatus } = useAction(updateQuotationStatus, { successMessage: "Status updated", onSuccess: () => router.refresh() });
  const { run: convert, loading: converting } = useAction(convertQuotationToInvoice, { successMessage: "Converted to invoice", onSuccess: (data) => data && router.push(`/invoices/${data.id}`) });
  const { run: approve, loading: approving } = useAction(approveQuotation, { successMessage: "Quotation approved", onSuccess: () => router.refresh() });
  const { run: reject, loading: rejecting } = useAction(rejectQuotationApproval, { successMessage: "Revision requested", onSuccess: () => router.refresh() });

  const finalIssueAllowed = quotation.approvalStatus === "NOT_REQUIRED" || quotation.approvalStatus === "APPROVED";
  const ownerCanReview = userRole === "OWNER" && quotation.approvalStatus === "PENDING" && quotation.createdById !== userId;
  const shareMessage = `Please find our quotation ${quotation.referenceNo} for ${formatINR(quotation.amount)}.`;

  return <div className="mx-auto flex max-w-[1450px] flex-col gap-6 px-4 py-6 md:px-8">
    <div className="no-print flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div><div className="flex flex-wrap items-center gap-2"><h1 className="font-mono text-lg font-bold text-slate-950">{quotation.referenceNo}</h1><Badge variant={STATUS_VARIANT[quotation.status]}>{quotation.status}</Badge>{quotation.riskLevel === "HIGH_RISK" && <Badge variant="warning"><ShieldAlert className="mr-1 h-3 w-3"/> High Risk</Badge>}{quotation.approvalStatus === "APPROVED" && <Badge variant="success">Owner Approved</Badge>}{quotation.approvalStatus === "PENDING" && <Badge variant="warning">Approval Pending</Badge>}{quotation.approvalStatus === "REJECTED" && <Badge variant="destructive">Revision Required</Badge>}</div><p className="mt-1 max-w-3xl text-sm text-slate-500">{quotation.subject}</p></div>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href={`/quotations/${quotation.id}/edit`}><Pencil className="h-4 w-4"/> Edit</Link></Button>{finalIssueAllowed && <PrintButton />}{finalIssueAllowed && <EmailShareButton to={null} subject={`Quotation ${quotation.referenceNo}`} body={shareMessage} />}{finalIssueAllowed && <WhatsAppShareButton phone={null} message={shareMessage} />}</div>
    </div>

    {!finalIssueAllowed && <Card className="no-print border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600"/><div><p className="font-semibold text-amber-950">Final PDF is locked until Owner approval</p><p className="mt-1 text-sm text-amber-800">You can review the A4 draft below. Print/PDF/Send controls unlock automatically after approval.</p>{quotation.riskReason && <p className="mt-1 text-xs font-medium text-amber-900">Risk reason: {quotation.riskReason}</p>}{quotation.approvalNote && <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-amber-900">Review note: {quotation.approvalNote}</p>}</div></div></Card>}

    {ownerCanReview && <Card className="no-print border-blue-200 bg-blue-50 p-5"><div className="mb-3"><h2 className="font-semibold text-blue-950">Owner Safety Approval</h2><p className="text-xs text-blue-800">Review scope, quantities, rates and safety implications. Your approval unlocks the final PDF.</p></div><Textarea rows={2} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Optional approval note, or required reason when requesting revision"/><div className="mt-3 flex gap-2"><Button loading={approving} onClick={() => approve(quotation.id, reviewNote)}><CheckCircle2 className="h-4 w-4"/> Approve</Button><Button variant="destructive" loading={rejecting} disabled={!reviewNote.trim()} onClick={() => reject(quotation.id, reviewNote)}><XCircle className="h-4 w-4"/> Request Revision</Button></div></Card>}

    <div className="no-print flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3"><span className="text-xs font-semibold text-slate-500">Workflow:</span><Select value={quotation.status} onValueChange={(v) => setStatus(quotation.id, v as any)}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="SENT">Sent</SelectItem><SelectItem value="ACCEPTED">Accepted</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem><SelectItem value="EXPIRED">Expired</SelectItem></SelectContent></Select>{quotation.status === "ACCEPTED" && finalIssueAllowed && <Button loading={converting} onClick={() => convert(quotation.id)}><ArrowRightCircle className="h-4 w-4"/> Convert to Invoice</Button>}</div>

    <div className="grid gap-6 xl:grid-cols-[1fr_300px]"><div className="overflow-x-auto"><OfficialQuotationPrint quotation={quotation} company={company}/></div><div className="no-print"><Card className="p-4"><h3 className="mb-3 text-sm font-semibold">Audit History</h3><HistoryPanel entries={history}/></Card></div></div>
  </div>;
}
