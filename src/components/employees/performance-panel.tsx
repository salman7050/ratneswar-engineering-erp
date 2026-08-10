"use client";

import * as React from "react";
import { Plus, Trash2, Star } from "lucide-react";
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
import { addPerformanceReview, deletePerformanceReview } from "@/lib/actions/employee-performance-actions";
import type { EmployeeDetail } from "@/lib/queries/employees";

const RATING_TONE = {
  BELOW_EXPECTATIONS: "destructive", MEETS_EXPECTATIONS: "info",
  EXCEEDS_EXPECTATIONS: "success", OUTSTANDING: "gold",
} as const;
const RATING_LABEL: Record<string, string> = {
  BELOW_EXPECTATIONS: "Below Expectations", MEETS_EXPECTATIONS: "Meets Expectations",
  EXCEEDS_EXPECTATIONS: "Exceeds Expectations", OUTSTANDING: "Outstanding",
};

export function PerformancePanel({ employee }: { employee: EmployeeDetail }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ reviewPeriod: "", rating: "MEETS_EXPECTATIONS", strengths: "", improvements: "", reviewedBy: "", reviewDate: new Date().toISOString().slice(0, 10) });

  const { run: add, loading } = useAction(addPerformanceReview, { successMessage: "Review added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deletePerformanceReview, { successMessage: "Review removed" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Muted className="text-xs">{employee.reviews.length} review{employee.reviews.length === 1 ? "" : "s"}</Muted>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Review</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Performance Review</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label>Review Period</Label><Input value={form.reviewPeriod} onChange={(e) => setForm({ ...form, reviewPeriod: e.target.value })} placeholder="H1 2026" /></div>
              <div className="flex flex-col gap-1.5"><Label>Review Date</Label><Input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <Label>Rating</Label>
                <Select value={form.rating} onValueChange={(v) => setForm({ ...form, rating: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RATING_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Reviewed By</Label><Input value={form.reviewedBy} onChange={(e) => setForm({ ...form, reviewedBy: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Strengths</Label><Textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Areas to Improve</Label><Textarea value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => add({
                  employeeId: employee.id, reviewPeriod: form.reviewPeriod, rating: form.rating as any,
                  strengths: form.strengths || null, improvements: form.improvements || null,
                  reviewedBy: form.reviewedBy, reviewDate: new Date(form.reviewDate),
                })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {employee.reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Star className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No performance reviews yet.</Muted>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {employee.reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-secondary/30 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{r.reviewPeriod}</p>
                  <Muted className="text-[11px]">{formatDate(r.reviewDate)} · Reviewed by {r.reviewedBy}</Muted>
                </div>
                <div className="flex items-center gap-2">
                  <StatusChip tone={RATING_TONE[r.rating as keyof typeof RATING_TONE]}>{RATING_LABEL[r.rating]}</StatusChip>
                  <button onClick={() => remove(r.id, employee.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {(r.strengths || r.improvements) && (
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  {r.strengths && <div><Muted className="text-[11px] font-semibold uppercase tracking-wide">Strengths</Muted><p className="mt-0.5 text-xs">{r.strengths}</p></div>}
                  {r.improvements && <div><Muted className="text-[11px] font-semibold uppercase tracking-wide">To Improve</Muted><p className="mt-0.5 text-xs">{r.improvements}</p></div>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
