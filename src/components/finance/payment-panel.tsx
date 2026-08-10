"use client";

import * as React from "react";
import { Plus, Trash2, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { recordPayment, deletePayment } from "@/lib/actions/invoice-actions";
import type { InvoiceDetail } from "@/lib/queries/invoices";

export function PaymentPanel({ invoice }: { invoice: InvoiceDetail }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ amount: "", date: new Date().toISOString().slice(0, 10), mode: "Bank Transfer", reference: "" });

  const { run: add, loading } = useAction(recordPayment, { successMessage: "Payment recorded", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deletePayment, { successMessage: "Payment removed" });

  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.grandTotal - paid;
  const pct = invoice.grandTotal > 0 ? Math.min(100, Math.round((paid / invoice.grandTotal) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <div><Muted className="text-xs">Grand Total</Muted><p className="tabular mt-0.5 font-mono font-semibold">{formatINR(invoice.grandTotal)}</p></div>
        <div><Muted className="text-xs">Paid</Muted><p className="tabular mt-0.5 font-mono font-semibold text-success">{formatINR(paid)}</p></div>
        <div><Muted className="text-xs">Balance</Muted><p className="tabular mt-0.5 font-mono font-semibold text-destructive">{formatINR(balance)}</p></div>
      </div>
      <Progress value={pct} />

      <div className="flex items-center justify-between">
        <Muted className="text-xs">{invoice.payments.length} payment{invoice.payments.length === 1 ? "" : "s"} recorded</Muted>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm" disabled={balance <= 0}><Plus className="h-3.5 w-3.5" /> Record Payment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={String(balance)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5">
                <Label>Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Reference (optional)</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="UTR / Cheque No." /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} disabled={!form.amount} onClick={() => add({ invoiceId: invoice.id, amount: Number(form.amount), date: new Date(form.date), mode: form.mode, reference: form.reference || null, notes: null })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {invoice.payments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CircleDollarSign className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No payments recorded yet.</Muted>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {invoice.payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2">
              <div>
                <p className="tabular font-mono text-sm font-semibold text-success">{formatINR(p.amount)}</p>
                <Muted className="text-[11px]">{formatDate(p.date)} · {p.mode}{p.reference ? ` · ${p.reference}` : ""}</Muted>
              </div>
              <button onClick={() => remove(p.id, invoice.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
