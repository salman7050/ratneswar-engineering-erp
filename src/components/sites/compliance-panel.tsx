"use client";

import * as React from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { addInsurance, deleteInsurance, addAMC, deleteAMC, addWarranty, deleteWarranty } from "@/lib/actions/site-compliance-actions";
import type { SiteDetail } from "@/lib/queries/sites";

function expiryTone(endDate: Date | string): "success" | "warning" | "destructive" {
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "destructive";
  if (days <= 30) return "warning";
  return "success";
}
function expiryLabel(endDate: Date | string): string {
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  return `${days}d left`;
}

function Row({ title, sub, endDate, onDelete }: { title: string; sub: string; endDate: Date | string; onDelete: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <Muted className="text-[11px]">{sub}</Muted>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusChip tone={expiryTone(endDate)}>{expiryLabel(endDate)}</StatusChip>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </li>
  );
}

function InsuranceSection({ siteId, items }: { siteId: string; items: SiteDetail["insurances"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ policyNo: "", provider: "", type: "", coverageAmount: "", startDate: "", endDate: "" });
  const { run: add, loading } = useAction(addInsurance, { successMessage: "Insurance added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteInsurance, { successMessage: "Insurance removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Insurance</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Insurance Policy</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Provider</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="ICICI Lombard" /></div>
              <div className="flex flex-col gap-1.5"><Label>Policy No.</Label><Input value={form.policyNo} onChange={(e) => setForm({ ...form, policyNo: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Type</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Machinery Breakdown" /></div>
              <div className="flex flex-col gap-1.5"><Label>Coverage (₹)</Label><Input type="number" value={form.coverageAmount} onChange={(e) => setForm({ ...form, coverageAmount: e.target.value })} /></div>
              <div />
              <div className="flex flex-col gap-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} onClick={() => add({ siteId, ...form, coverageAmount: Number(form.coverageAmount), startDate: new Date(form.startDate), endDate: new Date(form.endDate) })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No insurance policies on record.</Muted> : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <Row key={i.id} title={`${i.provider} — ${i.type}`} sub={`Policy ${i.policyNo} · ${formatINR(Number(i.coverageAmount))} cover`} endDate={i.endDate} onDelete={() => remove(i.id, siteId)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AMCSection({ siteId, items }: { siteId: string; items: SiteDetail["amcs"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ vendor: "", scope: "", amount: "", startDate: "", endDate: "", status: "ACTIVE" });
  const { run: add, loading } = useAction(addAMC, { successMessage: "AMC added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteAMC, { successMessage: "AMC removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add AMC</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add AMC Contract</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Scope</Label><Input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="Transformer AMC" /></div>
              <div className="flex flex-col gap-1.5"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="EXPIRED">Expired</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} onClick={() => add({ siteId, vendor: form.vendor, scope: form.scope, status: form.status as any, amount: Number(form.amount), startDate: new Date(form.startDate), endDate: new Date(form.endDate) })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No AMC contracts on record.</Muted> : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => (
            <Row key={a.id} title={`${a.vendor} — ${a.scope}`} sub={formatINR(Number(a.amount))} endDate={a.endDate} onDelete={() => remove(a.id, siteId)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function WarrantySection({ siteId, items }: { siteId: string; items: SiteDetail["warranties"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ itemName: "", vendor: "", startDate: "", endDate: "", terms: "" });
  const { run: add, loading } = useAction(addWarranty, { successMessage: "Warranty added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteWarranty, { successMessage: "Warranty removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Warranty</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Warranty</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Item</Label><Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="Inverter — Sungrow SG110CX" /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Vendor</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} onClick={() => add({ siteId, itemName: form.itemName, vendor: form.vendor, terms: form.terms || null, startDate: new Date(form.startDate), endDate: new Date(form.endDate) })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No warranties on record.</Muted> : (
        <ul className="flex flex-col gap-2">
          {items.map((w) => (
            <Row key={w.id} title={w.itemName} sub={w.vendor} endDate={w.endDate} onDelete={() => remove(w.id, siteId)} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function CompliancePanel({ siteId, site }: { siteId: string; site: SiteDetail }) {
  return (
    <Tabs defaultValue="insurance">
      <TabsList>
        <TabsTrigger value="insurance"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Insurance</TabsTrigger>
        <TabsTrigger value="amc">AMC</TabsTrigger>
        <TabsTrigger value="warranty">Warranty</TabsTrigger>
      </TabsList>
      <TabsContent value="insurance"><InsuranceSection siteId={siteId} items={site.insurances} /></TabsContent>
      <TabsContent value="amc"><AMCSection siteId={siteId} items={site.amcs} /></TabsContent>
      <TabsContent value="warranty"><WarrantySection siteId={siteId} items={site.warranties} /></TabsContent>
    </Tabs>
  );
}
