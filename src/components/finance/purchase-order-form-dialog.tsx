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
import { LineItemsEditor, EMPTY_ITEM, type EditableItem } from "@/components/finance/line-items-editor";
import { createPurchaseOrder, updatePurchaseOrder } from "@/lib/actions/purchase-order-actions";
import { useAction } from "@/hooks/use-action";
import type { PurchaseOrderDetail } from "@/lib/queries/purchase-orders";

function toDateInput(d: Date | string | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export function PurchaseOrderFormDialog({
  po, suggestedNo, sites,
}: {
  po?: PurchaseOrderDetail;
  suggestedNo: string;
  sites: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(po);

  const [form, setForm] = React.useState({
    poNo: po?.poNo ?? suggestedNo,
    date: toDateInput(po?.date) || new Date().toISOString().slice(0, 10),
    vendorName: po?.vendorName ?? "",
    vendorAddress: po?.vendorAddress ?? "",
    vendorGstin: po?.vendorGstin ?? "",
    deliveryDate: toDateInput(po?.deliveryDate),
    terms: po?.terms ?? "",
    gstType: po?.gstType ?? "SGST_CGST",
    siteId: po?.siteId ?? "",
  });
  const [items, setItems] = React.useState<EditableItem[]>(
    po?.items.map((it) => ({ description: it.description, hsnCode: it.hsnCode, quantity: String(it.quantity), rate: String(it.rate) })) ?? [{ ...EMPTY_ITEM }]
  );

  const { run, loading } = useAction(
    isEdit ? (input: Parameters<typeof createPurchaseOrder>[0]) => updatePurchaseOrder(po!.id, input) : createPurchaseOrder,
    { successMessage: isEdit ? "PO updated" : "Purchase Order created", onSuccess: (data) => { setOpen(false); router.push(`/purchase-orders/${data?.id ?? po?.id}`); router.refresh(); } }
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      ...form,
      gstType: form.gstType as any,
      siteId: form.siteId || null,
      deliveryDate: form.deliveryDate ? new Date(form.deliveryDate) : null,
      items: items.map((it) => ({ description: it.description, hsnCode: it.hsnCode, quantity: Number(it.quantity), rate: Number(it.rate) })),
    } as any);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? <Button variant="glass" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit</Button> : <Button variant="gold"><Plus /> New Purchase Order</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
          <DialogDescription>Issued to a vendor/supplier for materials or services.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label>PO Number</Label><Input readOnly value={form.poNo} className="font-mono bg-muted/50" /><span className="text-[11px] text-muted-foreground">Secure number is assigned automatically when saved.</span></div>
            <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Vendor Name</Label><Input required value={form.vendorName} onChange={(e) => set("vendorName", e.target.value)} /></div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Vendor Address</Label><Input value={form.vendorAddress} onChange={(e) => set("vendorAddress", e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><Label>Vendor GSTIN</Label><Input value={form.vendorGstin} onChange={(e) => set("vendorGstin", e.target.value)} /></div>
            <div className="flex flex-col gap-1.5"><Label>Delivery Date</Label><Input type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} /></div>
            <div className="flex flex-col gap-1.5">
              <Label>GST Type</Label>
              <Select value={form.gstType} onValueChange={(v) => set("gstType", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SGST_CGST">SGST + CGST</SelectItem><SelectItem value="IGST">IGST</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Site (optional)</Label>
              <Select value={form.siteId} onValueChange={(v) => set("siteId", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Terms (optional)</Label><Textarea value={form.terms} onChange={(e) => set("terms", e.target.value)} /></div>
          </div>
          <div className="rounded-lg border border-border p-3"><LineItemsEditor items={items} onChange={setItems} /></div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>{isEdit ? "Save Changes" : "Create PO"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
