"use client";

import * as React from "react";
import { Plus, Trash2, CalendarOff, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { formatDate } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { applyLeave, updateLeaveStatus, deleteLeave } from "@/lib/actions/employee-leave-actions";
import type { EmployeeDetail } from "@/lib/queries/employees";

const STATUS_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "destructive" } as const;

export function LeavePanel({ employee }: { employee: EmployeeDetail }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ type: "CASUAL", startDate: "", endDate: "", days: "1", reason: "" });

  const { run: apply, loading } = useAction(applyLeave, { successMessage: "Leave applied", onSuccess: () => setOpen(false) });
  const { run: setStatus } = useAction(updateLeaveStatus, { successMessage: "Status updated" });
  const { run: remove } = useAction(deleteLeave, { successMessage: "Leave removed" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Muted className="text-xs">{employee.leaves.length} request{employee.leaves.length === 1 ? "" : "s"}</Muted>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Apply Leave</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SICK">Sick</SelectItem><SelectItem value="CASUAL">Casual</SelectItem>
                    <SelectItem value="EARNED">Earned</SelectItem><SelectItem value="UNPAID">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Days</Label><Input type="number" step="0.5" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Reason (optional)</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => apply({ employeeId: employee.id, type: form.type as any, startDate: new Date(form.startDate), endDate: new Date(form.endDate), days: Number(form.days), reason: form.reason || null })}
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {employee.leaves.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <CalendarOff className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No leave requests yet.</Muted>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {employee.leaves.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{l.type[0] + l.type.slice(1).toLowerCase()} Leave · {Number(l.days)}d</p>
                <Muted className="text-[11px]">{formatDate(l.startDate)} → {formatDate(l.endDate)}{l.reason ? ` · ${l.reason}` : ""}</Muted>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusChip tone={STATUS_TONE[l.status]}>{l.status}</StatusChip>
                {l.status === "PENDING" && (
                  <>
                    <button onClick={() => setStatus(l.id, employee.id, "APPROVED")} className="text-success hover:opacity-70"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setStatus(l.id, employee.id, "REJECTED")} className="text-destructive hover:opacity-70"><X className="h-4 w-4" /></button>
                  </>
                )}
                <button onClick={() => remove(l.id, employee.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
