"use client";

import { FileText, FileImage, File, Trash2, ExternalLink, Building2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { deleteDocument } from "@/lib/actions/document-center-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate } from "@/lib/utils";
import type { DocumentListItem } from "@/lib/queries/documents";

const CATEGORY_LABEL: Record<string, string> = {
  INSURANCE: "Insurance", CERTIFICATE: "Certificate", WORK_ORDER: "Work Order", AGREEMENT: "Agreement",
  CONTRACT: "Contract", INVOICE_BILL: "Invoice / Bill", QUOTATION: "Quotation", TESTING_REPORT: "Testing Report",
  REPORT: "Report", DRAWING: "Drawing", PHOTO: "Photo", STAFF_DOCUMENT: "Staff Document",
  ATTENDANCE: "Attendance", TENDER_DOCUMENT: "Tender Document", OTHER: "Other",
};

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function expiryTone(expiryDate: Date | string): "success" | "warning" | "destructive" {
  const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "destructive";
  if (days <= 30) return "warning";
  return "success";
}

export function DocumentCard({ doc }: { doc: DocumentListItem }) {
  const { run: remove } = useAction(deleteDocument, { successMessage: "Document removed" });

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft-sm transition-all hover:-translate-y-[2px] hover:shadow-soft-md">
      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="relative flex h-32 items-center justify-center bg-secondary/40">
        {isImage(doc.mimeType) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.fileUrl} alt={doc.name} className="h-full w-full object-cover" />
        ) : doc.mimeType === "application/pdf" ? (
          <FileText className="h-10 w-10 text-muted-foreground/50" />
        ) : doc.mimeType.startsWith("image") ? (
          <FileImage className="h-10 w-10 text-muted-foreground/50" />
        ) : (
          <File className="h-10 w-10 text-muted-foreground/50" />
        )}
        <span className="absolute right-2 top-2 rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3.5 w-3.5" />
        </span>
      </a>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="truncate text-xs font-medium">{doc.name}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{CATEGORY_LABEL[doc.category] ?? doc.category}</Badge>
          {doc.expiryDate && <StatusChip tone={expiryTone(doc.expiryDate)}>Exp {formatDate(doc.expiryDate)}</StatusChip>}
        </div>
        {(doc.site || doc.employee || doc.tender) && (
          <Muted className="flex items-center gap-1 text-[10px]">
            {doc.site ? <><Building2 className="h-2.5 w-2.5" /> {doc.site.name}</> : doc.employee ? <><User className="h-2.5 w-2.5" /> {doc.employee.name}</> : doc.tender?.name}
          </Muted>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <Muted className="text-[10px]">{formatDate(doc.createdAt)}</Muted>
          <button onClick={() => remove(doc.id)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
