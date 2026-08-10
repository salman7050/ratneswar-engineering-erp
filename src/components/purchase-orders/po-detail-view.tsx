"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Send, Trash2, XCircle, PackageCheck, PackageOpen, Stamp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import type { CompanyInfo } from "@/components/finance/document-print-view";
import { PrintButton, EmailShareButton, WhatsAppShareButton } from "@/components/finance/share-buttons";
import { POPrintView } from "./po-print-view";
import { submitForApproval, deletePurchaseOrder, duplicatePurchaseOrder, updatePurchaseOrderStatus } from "@/lib/actions/purchase-order-actions";
import { useAction } from "@/hooks/use-action";
import { POApprovalChain } from "./po-approval-chain";
import { POCommentsPanel } from "./po-comments-panel";
import { POAttachmentsPanel } from "./po-attachments-panel";
import { PO_STATUS_META, PO_PRIORITY_META } from "./po-utils";
import { formatINR, formatDate } from "@/lib/utils";
import type { PurchaseOrderDetail } from "@/lib/queries/purchase-orders";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return <div><p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 text-sm text-slate-800">{value}</p></div>;
}
function filePart(value: string) { return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, ""); }
function datePart(date: Date | string) { const d = new Date(date); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`; }

type POCompany = CompanyInfo & { poContactName?: string | null; poContactEmail?: string | null; poContactPhone?: string | null };

export function PODetailView({ po, company, userRole }: { po: PurchaseOrderDetail; company: POCompany; userRole: string }) {
  const router = useRouter();
  const statusMeta = PO_STATUS_META[po.status] ?? { label: po.status, tone: "neutral" as const, dot: "bg-muted-foreground" };
  const priorityMeta = PO_PRIORITY_META[po.priority] ?? { label: po.priority, dot: "bg-info" };
  const { run: runSubmit, loading: submitting } = useAction(submitForApproval, { successMessage: "Sent to Owner for approval", onSuccess: () => router.refresh() });
  const { run: runDelete, loading: deleting } = useAction(deletePurchaseOrder, { successMessage: "Draft deleted", onSuccess: () => router.push("/purchase-orders") });
  const { run: runDuplicate, loading: duplicating } = useAction(duplicatePurchaseOrder, { successMessage: "Duplicated as a new draft", onSuccess: (created) => router.push(`/purchase-orders/${(created as { id: string }).id}`) });
  const { run: runStatus, loading: statusLoading } = useAction(updatePurchaseOrderStatus, { onSuccess: () => router.refresh() });
  const emailBody = `Dear ${po.vendorName},\n\nPlease find our Purchase Order ${po.poNo} dated ${formatDate(po.date)}. The Grand Total inclusive of applicable GST is ${formatINR(po.grandTotal)}.\n\nRegards,\n${company.legalName}`;
  const pdfFilename = `PO_${filePart(po.poNo)}_${filePart(po.vendorName)}_${datePart(po.date)}.pdf`;

  return <div className="flex flex-col gap-4 pb-10">
    <Card className="no-print border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><div className="flex flex-wrap items-center gap-2.5"><h1 className="font-mono text-lg font-bold tracking-tight text-slate-950">{po.poNo}</h1><StatusChip tone={statusMeta.tone}>{statusMeta.label}</StatusChip><span className="flex items-center gap-1 text-xs text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${priorityMeta.dot}`} /> {priorityMeta.label}</span>{po.includeSignature && <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"><Stamp className="h-3 w-3" /> Digital sign + stamp</span>}</div><p className="mt-1 text-sm text-slate-500">{po.vendorName} · {formatDate(po.date)}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {po.status === "DRAFT" && <><Button asChild size="sm" variant="outline"><Link href={`/purchase-orders/${po.id}/edit`}><Pencil className="h-3.5 w-3.5" /> Edit</Link></Button><Button size="sm" loading={submitting} onClick={() => runSubmit(po.id)}><Send className="h-3.5 w-3.5" /> Send to Owner</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5" /> Delete</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this draft?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={deleting} onClick={() => runDelete(po.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>}
          {po.status === "APPROVED" && <Button size="sm" loading={statusLoading} onClick={() => runStatus({ id: po.id, status: "ISSUED" })}><PackageOpen className="h-3.5 w-3.5" /> Issue to Vendor</Button>}
          {po.status === "ISSUED" && <Button size="sm" variant="outline" loading={statusLoading} onClick={() => runStatus({ id: po.id, status: "PARTIALLY_RECEIVED" })}><PackageCheck className="h-3.5 w-3.5" /> Partially Received</Button>}
          {(po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED") && <Button size="sm" variant="success" loading={statusLoading} onClick={() => runStatus({ id: po.id, status: "COMPLETED" })}><PackageCheck className="h-3.5 w-3.5" /> Completed</Button>}
          {["APPROVED", "ISSUED", "PARTIALLY_RECEIVED", "DRAFT", "PENDING_APPROVAL"].includes(po.status) && <AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="outline"><XCircle className="h-3.5 w-3.5" /> Cancel</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel this purchase order?</AlertDialogTitle><AlertDialogDescription>The PO will be marked cancelled.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Back</AlertDialogCancel><AlertDialogAction disabled={statusLoading} onClick={() => runStatus({ id: po.id, status: "CANCELLED" })}>Cancel PO</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
          <Button size="sm" variant="outline" loading={duplicating} onClick={() => runDuplicate(po.id)}><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
          <PrintButton filename={pdfFilename} />
          <EmailShareButton to={po.vendorEmail} subject={`Purchase Order ${po.poNo}`} body={emailBody} />
          <WhatsAppShareButton phone={po.vendorPhone} message={`Purchase Order ${po.poNo} from ${company.legalName}.`} />
        </div>
      </div>
    </Card>

    {(po.status === "PENDING_APPROVAL" || po.approvals.length > 0) && <div className="no-print"><POApprovalChain poId={po.id} status={po.status} approvalStage={po.approvalStage} approvals={po.approvals as any} userRole={userRole} canAct /></div>}

    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_330px]">
      <div className="overflow-x-auto"><POPrintView po={po} company={company} /></div>
      <div className="no-print flex flex-col gap-4">
        <Card className="border-slate-200 p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Commercial Summary</p><div className="grid grid-cols-2 gap-3"><Info label="Grand Total" value={formatINR(po.grandTotal)} /><Info label="GST" value={po.gstType === "SGST_CGST" ? "CGST + SGST" : "IGST"} /><Info label="Advance" value={po.advancePercent ? `${po.advancePercent}%` : null} /><Info label="Credit Days" value={po.creditDays} /><Info label="Payment" value={po.paymentMethod} /><Info label="Site" value={po.site?.name} /></div></Card>
        <Card className="border-slate-200 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">PDF Output</p><p className="break-all font-mono text-xs text-slate-700">{pdfFilename}</p><p className="mt-2 text-[11px] text-slate-400">A4 portrait layout is locked for Print / Save as PDF. Table header repeats automatically when a long PO flows to another page.</p></Card>
        <Card className="border-slate-200 p-4"><POAttachmentsPanel poId={po.id} attachments={po.attachments as any} /></Card>
        <Card className="border-slate-200 p-4"><POCommentsPanel poId={po.id} comments={po.comments as any} /></Card>
        <Card className="border-slate-200 p-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">History</p><div className="space-y-1.5 text-xs text-slate-500"><p>Created by {po.createdBy.name} · {formatDate(po.createdAt)}</p><p>Last updated {formatDate(po.updatedAt)}</p></div></Card>
      </div>
    </div>
  </div>;
}
