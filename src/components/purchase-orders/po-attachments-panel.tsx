"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Paperclip, FileText, ExternalLink } from "lucide-react";
import { DropzoneUploader } from "@/components/documents/dropzone-uploader";
import { createDocument } from "@/lib/actions/document-center-actions";
import { toast } from "@/lib/toast";
import type { UploadedFile } from "@/lib/supabase/storage";

interface AttachmentRow {
  id: string;
  name: string;
  fileUrl: string;
  category: string;
  createdAt: Date | string;
}

export function POAttachmentsPanel({ poId, attachments }: { poId: string; attachments: AttachmentRow[] }) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);

  async function handleUploaded(files: UploadedFile[]) {
    setUploading(true);
    let successCount = 0;
    for (const file of files) {
      const result = await createDocument({
        name: file.name,
        category: "OTHER",
        fileUrl: file.url,
        fileSize: file.size,
        mimeType: file.mimeType,
        poId,
      });
      if (result.ok) successCount++;
    }
    setUploading(false);
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount === 1 ? "" : "s"} attached`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Attachments <span className="text-muted-foreground/60">(quotation, BOQ, drawings, specs…)</span>
      </p>

      {attachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {attachments.map((a) => (
            <a
              key={a.id}
              href={a.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-secondary/15 px-3 py-2 text-xs transition-colors hover:border-brand-gold/30"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{a.name}</span>
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      )}

      <DropzoneUploader onFilesUploaded={handleUploaded} />
      {uploading && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Paperclip className="h-3 w-3" /> Attaching…</p>}
    </div>
  );
}
