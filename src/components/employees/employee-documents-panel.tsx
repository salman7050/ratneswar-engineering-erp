"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, FolderOpen, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { DropzoneUploader } from "@/components/documents/dropzone-uploader";
import { addEmployeeDocument, deleteEmployeeDocument } from "@/lib/actions/employee-documents-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate } from "@/lib/utils";
import type { UploadedFile } from "@/lib/supabase/storage";
import type { EmployeeDetail } from "@/lib/queries/employees";

const CATEGORIES = ["STAFF_DOCUMENT", "AGREEMENT", "INSURANCE", "TESTING_REPORT", "OTHER"] as const;

export function EmployeeDocumentsPanel({ employee }: { employee: EmployeeDetail }) {
  const router = useRouter();
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>("STAFF_DOCUMENT");
  const { run: remove } = useAction(deleteEmployeeDocument, { successMessage: "Document removed" });

  async function handleUploaded(files: UploadedFile[]) {
    for (const file of files) {
      await addEmployeeDocument({
        employeeId: employee.id,
        name: file.name,
        category,
        fileUrl: file.path,
        fileSize: file.size,
        mimeType: file.mimeType,
      });
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label>Category for next upload</Label>
        <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((value) => <SelectItem key={value} value={value}>{value.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DropzoneUploader onFilesUploaded={handleUploaded} />

      {employee.documents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <FolderOpen className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No documents attached yet.</Muted>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {employee.documents.map((document) => (
            <li key={document.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <a href={document.fileUrl || undefined} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-sm font-medium hover:text-brand-gold-light">
                  {document.name} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">{document.category.replace(/_/g, " ")}</Badge>
                  <Muted className="text-[11px]">{formatDate(document.createdAt)}</Muted>
                </div>
              </div>
              <button onClick={() => remove(document.id, employee.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Delete ${document.name}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
