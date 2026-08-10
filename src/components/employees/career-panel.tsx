"use client";

import * as React from "react";
import { Plus, Trash2, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { addPromotion, deletePromotion, addIncrement, deleteIncrement } from "@/lib/actions/employee-career-actions";
import type { EmployeeDetail } from "@/lib/queries/employees";

function PromotionSection({ employee }: { employee: EmployeeDetail }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ toDesignation: "", effectiveDate: "", notes: "" });
  const { run: add, loading } = useAction(addPromotion, { successMessage: "Promotion recorded", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deletePromotion, { successMessage: "Removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Record Promotion</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Promotion</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <Muted className="text-xs">From: <span className="font-medium text-foreground">{employee.designation}</span></Muted>
              <div className="flex flex-col gap-1.5"><Label>New Designation</Label><Input value={form.toDesignation} onChange={(e) => setForm({ ...form, toDesignation: e.target.value })} placeholder="Senior Site Engineer" /></div>
              <div className="flex flex-col gap-1.5"><Label>Effective Date</Label><Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} onClick={() => add({ employeeId: employee.id, fromDesignation: employee.designation, toDesignation: form.toDesignation, effectiveDate: new Date(form.effectiveDate), notes: form.notes || null })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {employee.promotions.length === 0 ? <Muted className="text-xs">No promotions on record.</Muted> : (
        <ul className="flex flex-col gap-2">
          {employee.promotions.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{p.fromDesignation} → {p.toDesignation}</p>
                <Muted className="text-[11px]">{formatDate(p.effectiveDate)}{p.notes ? ` · ${p.notes}` : ""}</Muted>
              </div>
              <button onClick={() => remove(p.id, employee.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IncrementSection({ employee }: { employee: EmployeeDetail }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ newBasic: "", effectiveDate: "", notes: "" });
  const { run: add, loading } = useAction(addIncrement, { successMessage: "Increment recorded", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteIncrement, { successMessage: "Removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Record Increment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Increment</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <Muted className="text-xs">Current Basic: <span className="font-medium text-foreground">{formatINR(employee.basic)}</span></Muted>
              <div className="flex flex-col gap-1.5"><Label>New Basic (₹/month)</Label><Input type="number" value={form.newBasic} onChange={(e) => setForm({ ...form, newBasic: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Effective Date</Label><Input type="date" value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} onClick={() => add({ employeeId: employee.id, previousBasic: employee.basic, newBasic: Number(form.newBasic), effectiveDate: new Date(form.effectiveDate), notes: form.notes || null })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {employee.increments.length === 0 ? <Muted className="text-xs">No increments on record.</Muted> : (
        <ul className="flex flex-col gap-2">
          {employee.increments.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div>
                <p className="tabular font-mono text-sm font-medium">{formatINR(i.previousBasic)} → {formatINR(i.newBasic)}</p>
                <Muted className="text-[11px]">{formatDate(i.effectiveDate)}{i.notes ? ` · ${i.notes}` : ""}</Muted>
              </div>
              <button onClick={() => remove(i.id, employee.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CareerPanel({ employee }: { employee: EmployeeDetail }) {
  return (
    <Tabs defaultValue="promotion">
      <TabsList>
        <TabsTrigger value="promotion"><Award className="mr-1.5 h-3.5 w-3.5" /> Promotion</TabsTrigger>
        <TabsTrigger value="increment"><TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Increment</TabsTrigger>
      </TabsList>
      <TabsContent value="promotion"><PromotionSection employee={employee} /></TabsContent>
      <TabsContent value="increment"><IncrementSection employee={employee} /></TabsContent>
    </Tabs>
  );
}
