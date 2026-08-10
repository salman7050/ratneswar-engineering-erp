"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DropzoneUploader } from "@/components/documents/dropzone-uploader";
import { createDocument } from "@/lib/actions/document-center-actions";
import { toast } from "@/lib/toast";
import type { UploadedFile } from "@/lib/supabase/storage";

const CATEGORIES = [
  { value: "INSURANCE", label: "Insurance" },
  { value: "CERTIFICATE", label: "Certificate" },
  { value: "CONTRACT", label: "Contract" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "WORK_ORDER", label: "Work Order" },
  { value: "TENDER_DOCUMENT", label: "Tender Document" },
  { value: "INVOICE_BILL", label: "Invoice / Bill" },
  { value: "QUOTATION", label: "Quotation" },
  { value: "PHOTO", label: "Photo" },
  { value: "DRAWING", label: "Drawing" },
  { value: "REPORT", label: "Report" },
  { value: "TESTING_REPORT", label: "Testing Report" },
  { value: "STAFF_DOCUMENT", label: "Staff Document" },
  { value: "OTHER", label: "Other" },
];

export function UploadDialog({
  sites, employees,
}: {
  sites: { id: string; name: string }[];
  employees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("OTHER");
  const [siteId, setSiteId] = React.useState("");
  const [employeeId, setEmployeeId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleUploaded(files: UploadedFile[]) {
    setSaving(true);
    let successCount = 0;
    for (const file of files) {
      const result = await createDocument({
        name: file.name,
        category: category as any,
        fileUrl: file.url,
        fileSize: file.size,
        mimeType: file.mimeType,
        expiryDate: null,
        siteId: siteId || null,
        employeeId: employeeId || null,
        tenderId: null,
      });
      if (result?.ok) successCount++;
    }
    setSaving(false);
    if (successCount > 0) {
      toast.success(`${successCount} document${successCount === 1 ? "" : "s"} saved`);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="gold"><UploadCloud className="h-4 w-4" /> Upload</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>Files upload to Supabase Storage and are saved permanently.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Link to Site (optional)</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Link to Employee (optional)</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <DropzoneUploader onFilesUploaded={handleUploaded} />
        {saving && <p className="text-center text-xs text-muted-foreground">Saving document records…</p>}
      </DialogContent>
    </Dialog>
  );
}
