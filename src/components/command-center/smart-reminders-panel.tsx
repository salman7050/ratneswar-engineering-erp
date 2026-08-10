"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, BellRing, Check, X } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { createReminder, completeReminder, dismissReminder } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";
import { REMINDER_TYPE_LABELS, formatDueLabel, daysOverdue } from "./utils";
import { cn } from "@/lib/utils";

interface ReminderRow {
  id: string;
  title: string;
  type: string;
  dueDate: Date | string;
  notes: string | null;
  recurrence: "NONE" | "MONTHLY" | "QUARTERLY" | "YEARLY";
}

export function SmartRemindersPanel({ reminders }: { reminders: ReminderRow[] }) {
  return (
    <MissionPanel title="Smart Reminders" tint="blue" action={<CreateReminderDialog />}>
      {reminders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <BellRing className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No upcoming AMC, statutory, or compliance dates.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reminders.map((r) => (
            <ReminderRowItem key={r.id} reminder={r} />
          ))}
        </div>
      )}
    </MissionPanel>
  );
}

function ReminderRowItem({ reminder }: { reminder: ReminderRow }) {
  const router = useRouter();
  const overdue = daysOverdue(reminder.dueDate) > 0;
  const { run: runComplete, loading: completing } = useAction(completeReminder, { onSuccess: () => router.refresh() });
  const { run: runDismiss, loading: dismissing } = useAction(dismissReminder, { onSuccess: () => router.refresh() });

  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5", overdue ? "border-destructive/25 bg-destructive/[0.04]" : "border-border/60 bg-secondary/20")}>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{reminder.title}</p>
        <p className={cn("mt-0.5 text-[11px]", overdue ? "font-semibold text-destructive" : "text-muted-foreground")}>
          {REMINDER_TYPE_LABELS[reminder.type] ?? reminder.type} · {formatDueLabel(reminder.dueDate)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => runComplete(reminder.id)}
          disabled={completing}
          aria-label="Mark reminder done"
          className="touch-target flex h-7 w-7 items-center justify-center rounded-lg text-success hover:bg-success/10"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => runDismiss(reminder.id)}
          disabled={dismissing}
          aria-label="Dismiss reminder"
          className="touch-target flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CreateReminderDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const emptyForm = { title: "", type: "AMC_EXPIRY", dueDate: "", notes: "", recurrence: "NONE" };
  const [form, setForm] = React.useState(emptyForm);

  const { run, loading } = useAction(createReminder, {
    successMessage: "Reminder set",
    onSuccess: () => {
      setOpen(false);
      setForm(emptyForm);
      router.refresh();
    },
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      title: form.title,
      type: form.type as any,
      dueDate: new Date(form.dueDate),
      notes: form.notes || null,
      recurrence: form.recurrence as any,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm"><Plus className="h-4 w-4" /> Reminder</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Smart Reminder</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input required autoFocus value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Site vehicle insurance" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(REMINDER_TYPE_LABELS).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Due Date</Label>
            <Input type="date" required value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Repeats</Label>
            <Select value={form.recurrence} onValueChange={(v) => set("recurrence", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Doesn&apos;t repeat</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>Set Reminder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
