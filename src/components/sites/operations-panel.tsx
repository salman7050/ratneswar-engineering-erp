"use client";

import * as React from "react";
import { Plus, Trash2, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import {
  addMaintenanceLog, deleteMaintenanceLog, addBreakdownLog, resolveBreakdown, deleteBreakdownLog,
} from "@/lib/actions/site-ops-actions";
import type { SiteDetail } from "@/lib/queries/sites";

const SEVERITY_TONE: Record<string, "success" | "warning" | "destructive" | "neutral"> = {
  LOW: "success", MEDIUM: "warning", HIGH: "destructive", CRITICAL: "destructive",
};

function MaintenanceSection({ siteId, items }: { siteId: string; items: SiteDetail["maintenance"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ type: "PREVENTIVE", description: "", performedBy: "", date: "", cost: "", nextDueDate: "" });
  const { run: add, loading } = useAction(addMaintenanceLog, { successMessage: "Maintenance logged", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteMaintenanceLog, { successMessage: "Log removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Log Maintenance</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Maintenance</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PREVENTIVE">Preventive</SelectItem><SelectItem value="CORRECTIVE">Corrective</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Transformer oil top-up, IR test" /></div>
              <div className="flex flex-col gap-1.5"><Label>Performed By</Label><Input value={form.performedBy} onChange={(e) => setForm({ ...form, performedBy: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Cost (₹, optional)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Next Due (optional)</Label><Input type="date" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => add({
                  siteId, type: form.type as any, description: form.description, performedBy: form.performedBy,
                  date: new Date(form.date), cost: form.cost ? Number(form.cost) : null,
                  nextDueDate: form.nextDueDate ? new Date(form.nextDueDate) : null,
                })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No maintenance logged yet.</Muted> : (
        <ul className="flex flex-col gap-2">
          {items.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.description}</p>
                <Muted className="text-[11px]">{formatDate(m.date)} · {m.performedBy} {m.cost ? `· ${formatINR(Number(m.cost))}` : ""}</Muted>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusChip tone={m.type === "PREVENTIVE" ? "info" : "warning"}>{m.type}</StatusChip>
                <button onClick={() => remove(m.id, siteId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BreakdownSection({ siteId, items }: { siteId: string; items: SiteDetail["breakdowns"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "", severity: "MEDIUM", reportedAt: "", downtimeHours: "" });
  const { run: add, loading } = useAction(addBreakdownLog, { successMessage: "Breakdown logged", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteBreakdownLog, { successMessage: "Log removed" });
  const { run: resolve } = useAction(resolveBreakdown, { successMessage: "Marked resolved" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Report Breakdown</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Report Breakdown</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Inverter 2 tripped on grid fault" /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem><SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Reported At</Label><Input type="datetime-local" value={form.reportedAt} onChange={(e) => setForm({ ...form, reportedAt: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Downtime (hours, optional)</Label><Input type="number" value={form.downtimeHours} onChange={(e) => setForm({ ...form, downtimeHours: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => add({
                  siteId, title: form.title, description: form.description, severity: form.severity as any,
                  reportedAt: new Date(form.reportedAt), downtimeHours: form.downtimeHours ? Number(form.downtimeHours) : null,
                })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No breakdowns logged — all clear.</Muted> : (
        <ul className="flex flex-col gap-2">
          {items.map((b) => (
            <li key={b.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {b.resolvedAt ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />}
                  {b.title}
                </p>
                <Muted className="text-[11px]">
                  Reported {formatDate(b.reportedAt)}{b.downtimeHours ? ` · ${Number(b.downtimeHours)}h downtime` : ""}
                  {b.resolvedAt ? ` · resolved ${formatDate(b.resolvedAt)}` : ""}
                </Muted>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusChip tone={SEVERITY_TONE[b.severity]}>{b.severity}</StatusChip>
                {!b.resolvedAt && (
                  <button onClick={() => resolve(b.id, siteId, "Resolved")} className="text-xs text-success hover:underline">Resolve</button>
                )}
                <button onClick={() => remove(b.id, siteId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OperationsPanel({ siteId, site }: { siteId: string; site: SiteDetail }) {
  return (
    <Tabs defaultValue="maintenance">
      <TabsList>
        <TabsTrigger value="maintenance"><Wrench className="mr-1.5 h-3.5 w-3.5" /> Maintenance</TabsTrigger>
        <TabsTrigger value="breakdown"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Breakdown History</TabsTrigger>
      </TabsList>
      <TabsContent value="maintenance"><MaintenanceSection siteId={siteId} items={site.maintenance} /></TabsContent>
      <TabsContent value="breakdown"><BreakdownSection siteId={siteId} items={site.breakdowns} /></TabsContent>
    </Tabs>
  );
}
