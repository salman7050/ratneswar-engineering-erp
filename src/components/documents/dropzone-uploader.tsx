"use client";

import * as React from "react";
import { UploadCloud, FileCheck2, FileX2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadDocumentFile, type UploadedFile } from "@/lib/supabase/storage";
import { toast } from "@/lib/toast";

interface FileProgress {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

export function DropzoneUploader({
  onFilesUploaded,
  accept,
  multiple = true,
}: {
  onFilesUploaded: (files: UploadedFile[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
}) {
  const [dragging, setDragging] = React.useState(false);
  const [progress, setProgress] = React.useState<FileProgress[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setProgress(files.map((f) => ({ name: f.name, status: "uploading" as const })));

    const uploaded: UploadedFile[] = [];
    for (const file of files) {
      try {
        const result = await uploadDocumentFile(file);
        uploaded.push(result);
        setProgress((p) => p.map((f) => (f.name === file.name ? { ...f, status: "done" } : f)));
      } catch (e) {
        setProgress((p) => p.map((f) => (f.name === file.name ? { ...f, status: "error", error: e instanceof Error ? e.message : "Upload failed" } : f)));
        toast.error(`Failed to upload ${file.name}`, e instanceof Error ? e.message : undefined);
      }
    }

    if (uploaded.length > 0) await onFilesUploaded(uploaded);
    if (inputRef.current) inputRef.current.value = "";
    setTimeout(() => setProgress([]), 2500);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-brand-gold bg-brand-gold/[0.06]" : "border-border hover:border-white/20 hover:bg-secondary/30"
        )}
      >
        <UploadCloud className={cn("h-8 w-8", dragging ? "text-brand-gold-light" : "text-muted-foreground/60")} />
        <p className="text-sm font-medium">Drag & drop files here, or click to browse</p>
        <p className="text-xs text-muted-foreground">PDF, images, Word, Excel — up to 25MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {progress.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {progress.map((f, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs">
              {f.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              {f.status === "done" && <FileCheck2 className="h-3.5 w-3.5 text-success" />}
              {f.status === "error" && <FileX2 className="h-3.5 w-3.5 text-destructive" />}
              <span className="truncate">{f.name}</span>
              {f.error && <span className="ml-auto shrink-0 text-destructive">{f.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
