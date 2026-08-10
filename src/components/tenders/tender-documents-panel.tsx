"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, FolderOpen, ExternalLink } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Muted } from "@/components/ui/typography";
import { DropzoneUploader } from "@/components/documents/dropzone-uploader";
import { createDocument, deleteDocument } from "@/lib/actions/document-center-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate } from "@/lib/utils";
import type { UploadedFile } from "@/lib/supabase/storage";
import type { TenderDetail } from "@/lib/queries/tenders";

const CATEGORIES = ["TENDER_DOCUMENT", "AGREEMENT", "CONTRACT", "CERTIFICATE", "OTHER"];
const CATEGORY_LABEL: Record<string, string> = {
  TENDER_DOCUMENT: "Tender Document", AGREEMENT: "Agreement", CONTRACT: "Contract", CERTIFICATE: "Certificate", OTHER: "Other",
};

export function TenderDocumentsPanel({ tenderId, documents }: { tenderId: string; documents: TenderDetail["documents"] }) {
  const router = useRouter();
  const [category, setCategory] = React.useState("TENDER_DOCUMENT");
  const { run: remove } = useAction(deleteDocument, { successMessage: "Document removed" });

  async function handleUploaded(files: UploadedFile[]) {
    for (const file of files) {
      await createDocument({
        name: file.name, category: category as any, fileUrl: file.url, fileSize: file.size,
        mimeType: file.mimeType, expiryDate: null, tenderId, siteId: null, employeeId: null,
      });
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 max-w-xs">
        <Label>Category for next upload</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <DropzoneUploader onFilesUploaded={handleUploaded} />

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <FolderOpen className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No documents attached yet.</Muted>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-sm font-medium hover:text-brand-gold-light">
                  {d.name} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">{CATEGORY_LABEL[d.category] ?? d.category}</Badge>
                  <Muted className="text-[11px]">{formatDate(d.createdAt)}</Muted>
                </div>
              </div>
              <button onClick={() => remove(d.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
