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
import { createWorkOrder, updateWorkOrder } from "@/lib/actions/work-order-actions";
import { useAction } from "@/hooks/use-action";
import type { WorkOrderDetail } from "@/lib/queries/work-orders";

function toDateInput(d: Date | string | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function WorkOrderFormDialog({
  wo, suggestedNo, sites,
}: {
  wo?: WorkOrderDetail;
  suggestedNo: string;
  sites: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(wo);

  const [form, setForm] = React.useState({
    woNo: wo?.woNo ?? suggestedNo,
    date: toDateInput(wo?.date) || new Date().toISOString().slice(0, 10),
    client: wo?.client ?? "",
    scopeOfWork: wo?.scopeOfWork ?? "",
    startDate: toDateInput(wo?.startDate),
    endDate: toDateInput(wo?.endDate),
    value: wo?.value?.toString() ?? "",
    terms: wo?.terms ?? "",
    siteId: wo?.siteId ?? "",
  });

  const { run, loading } = useAction(
    isEdit ? (input: Parameters<typeof createWorkOrder>[0]) => updateWorkOrder(wo!.id, input) : createWorkOrder,
    { successMessage: isEdit ? "Work Order updated" : "Work Order created", onSuccess: (data) => { setOpen(false); router.push(`/work-orders/${data?.id ?? wo?.id}`); router.refresh(); } }
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      ...form,
      value: Number(form.value),
      siteId: form.siteId || null,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
    } as any);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? <Button variant="glass" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit</Button> : <Button variant="gold"><Plus /> New Work Order</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Work Order" : "Create Work Order"}</DialogTitle>
          <DialogDescription>Formal scope + value document, issued to a client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5"><Label>Work Order Number</Label><Input readOnly value={form.woNo} className="font-mono bg-muted/50" /><span className="text-[11px] text-muted-foreground">Secure number is assigned automatically when saved.</span></div>
          <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Client</Label><Input required value={form.client} onChange={(e) => set("client", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Scope of Work</Label><Textarea required value={form.scopeOfWork} onChange={(e) => set("scopeOfWork", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>Value (₹)</Label><Input required type="number" value={form.value} onChange={(e) => set("value", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5">
            <Label>Site (optional)</Label>
            <Select value={form.siteId} onValueChange={(v) => set("siteId", v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Terms (optional)</Label><Textarea value={form.terms} onChange={(e) => set("terms", e.target.value)} /></div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>{isEdit ? "Save Changes" : "Create WO"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
