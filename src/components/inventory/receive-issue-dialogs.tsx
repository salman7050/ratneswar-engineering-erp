"use client";

import * as React from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { receiveStock, issueStock } from "@/lib/actions/inventory-transaction-actions";
import { useAction } from "@/hooks/use-action";

interface Store { id: string; name: string; }
interface Vendor { id: string; name: string; }

export function ReceiveStockDialog({
  stockItemId, stores, vendors, trigger,
}: { stockItemId: string; stores: Store[]; vendors: Vendor[]; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ storeId: stores[0]?.id ?? "", vendorId: "", quantity: "", rate: "", date: new Date().toISOString().slice(0, 10), referenceNo: "" });
  const { run, loading } = useAction(receiveStock, { successMessage: "Stock received", onSuccess: () => setOpen(false) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="glass" size="sm"><ArrowDownToLine className="h-3.5 w-3.5" /> Receive</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Receive Stock</DialogTitle><DialogDescription>Adds to the store&apos;s balance.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Store</Label>
            <Select value={form.storeId} onValueChange={(v) => setForm({ ...form, storeId: v })}>
              <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
              <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Vendor (optional)</Label>
            <Select value={form.vendorId} onValueChange={(v) => setForm({ ...form, vendorId: v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Rate (₹/unit, optional)</Label><Input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Reference No. (optional)</Label><Input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} placeholder="PO / Challan No." /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            variant="gold"
            loading={loading}
            disabled={!form.storeId || !form.quantity}
            onClick={() => run({
              stockItemId, storeId: form.storeId, vendorId: form.vendorId || null,
              quantity: Number(form.quantity), rate: form.rate ? Number(form.rate) : null,
              date: new Date(form.date), referenceNo: form.referenceNo || null, notes: null,
            })}
          >
            Receive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function IssueStockDialog({
  stockItemId, stores, trigger,
}: { stockItemId: string; stores: Store[]; trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ storeId: stores[0]?.id ?? "", quantity: "", issuedTo: "", date: new Date().toISOString().slice(0, 10), referenceNo: "" });
  const { run, loading } = useAction(issueStock, { successMessage: "Stock issued", onSuccess: () => setOpen(false) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button variant="glass" size="sm"><ArrowUpFromLine className="h-3.5 w-3.5" /> Issue</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Issue Stock</DialogTitle><DialogDescription>Deducts from the store&apos;s balance.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Store</Label>
            <Select value={form.storeId} onValueChange={(v) => setForm({ ...form, storeId: v })}>
              <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
              <SelectContent>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5 col-span-2"><Label>Issued To</Label><Input value={form.issuedTo} onChange={(e) => setForm({ ...form, issuedTo: e.target.value })} placeholder="PS-2 Site / Ramesh (Site Engineer)" /></div>
          <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Reference No. (optional)</Label><Input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} placeholder="Material Requisition No." /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            variant="gold"
            loading={loading}
            disabled={!form.storeId || !form.quantity || !form.issuedTo}
            onClick={() => run({
              stockItemId, storeId: form.storeId, quantity: Number(form.quantity), issuedTo: form.issuedTo,
              date: new Date(form.date), referenceNo: form.referenceNo || null, notes: null,
            })}
          >
            Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
