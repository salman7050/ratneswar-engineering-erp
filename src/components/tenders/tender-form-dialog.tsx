"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createTender, updateTender } from "@/lib/actions/tender-actions";
import { useAction } from "@/hooks/use-action";

function toDateInput(d: Date | string | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

/** Structural type covering just the fields this form reads — works for both the list-row shape and the detail shape. */
interface EditableTender {
  id: string;
  tenderNo: string; name: string; department: string; estimatedValue: number;
  emdAmount: number | null; emdDeadline: Date | string | null; submissionDate: Date | string | null;
  notes: string | null; siteId: string | null; ownerId: string | null;
}

export function TenderFormDialog({
  tender, suggestedNo, sites, owners,
}: {
  tender?: EditableTender;
  suggestedNo: string;
  sites: { id: string; name: string }[];
  owners: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(tender);

  const [form, setForm] = React.useState({
    tenderNo: tender?.tenderNo ?? suggestedNo,
    name: tender?.name ?? "",
    department: tender?.department ?? "",
    estimatedValue: tender?.estimatedValue?.toString() ?? "",
    emdAmount: tender?.emdAmount?.toString() ?? "",
    emdDeadline: toDateInput(tender?.emdDeadline),
    submissionDate: toDateInput(tender?.submissionDate),
    notes: tender?.notes ?? "",
    siteId: tender?.siteId ?? "",
    ownerId: tender?.ownerId ?? "",
  });

  const { run, loading } = useAction(
    isEdit ? (input: Parameters<typeof createTender>[0]) => updateTender(tender!.id, input) : createTender,
    { successMessage: isEdit ? "Tender updated" : "Tender created", onSuccess: (data) => { setOpen(false); router.push(`/tenders/${data?.id ?? tender?.id}`); router.refresh(); } }
  );

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      ...form,
      estimatedValue: Number(form.estimatedValue),
      emdAmount: form.emdAmount ? Number(form.emdAmount) : null,
      emdDeadline: form.emdDeadline ? new Date(form.emdDeadline) : null,
      submissionDate: form.submissionDate ? new Date(form.submissionDate) : null,
      siteId: form.siteId || null,
      ownerId: form.ownerId || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? <Button variant="glass" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit</Button> : <Button variant="gold"><Plus /> New Tender</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tender" : "Create Tender"}</DialogTitle>
          <DialogDescription>Tracks the tender from preparation through submission to award.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5"><Label>Tender No.</Label><Input required value={form.tenderNo} onChange={(e) => set("tenderNo", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>Department / Authority</Label><Input required value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="GETCO / SSNNL / GMDC" /></div>
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Tender Name</Label><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="11KV Overhead Line — Lakhpat" /></div>
          <div className="flex flex-col gap-1.5"><Label>Estimated Value (₹)</Label><Input required type="number" value={form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>EMD Amount (₹, optional)</Label><Input type="number" value={form.emdAmount} onChange={(e) => set("emdAmount", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>EMD Deadline</Label><Input type="date" value={form.emdDeadline} onChange={(e) => set("emdDeadline", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>Submission Date</Label><Input type="date" value={form.submissionDate} onChange={(e) => set("submissionDate", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5">
            <Label>Site (optional)</Label>
            <Select value={form.siteId} onValueChange={(v) => set("siteId", v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Owner (optional)</Label>
            <Select value={form.ownerId} onValueChange={(v) => set("ownerId", v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>{owners.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>{isEdit ? "Save Changes" : "Create Tender"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
