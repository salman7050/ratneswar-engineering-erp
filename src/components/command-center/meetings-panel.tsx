"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Users2 } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { createMeeting, updateMeetingStatus } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";

interface MeetingRow {
  id: string;
  time: string;
  withPerson: string;
  purpose: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
}

const STATUS_TONE = { SCHEDULED: "info", COMPLETED: "success", CANCELLED: "destructive" } as const;

export function MeetingsPanel({ meetings, todayIso }: { meetings: MeetingRow[]; todayIso: string }) {
  return (
    <MissionPanel title="Today's Meetings" action={<CreateMeetingDialog defaultDate={todayIso} />}>
      {meetings.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Users2 className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No meetings scheduled for today.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {meetings.map((m) => (
            <MeetingRowItem key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </MissionPanel>
  );
}

function MeetingRowItem({ meeting }: { meeting: MeetingRow }) {
  const router = useRouter();
  const { run, loading } = useAction(updateMeetingStatus, { onSuccess: () => router.refresh() });

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{meeting.time}</span>
          <p className="truncate text-sm font-medium">{meeting.withPerson}</p>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{meeting.purpose}</p>
        {meeting.notes && <p className="mt-1 text-[11px] italic text-muted-foreground/80">{meeting.notes}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusChip tone={STATUS_TONE[meeting.status]}>{meeting.status.charAt(0) + meeting.status.slice(1).toLowerCase()}</StatusChip>
        <Select value={meeting.status} onValueChange={(v) => run({ id: meeting.id, status: v as any })} disabled={loading}>
          <SelectTrigger className="h-7 w-7 border-none bg-transparent p-0 shadow-none [&>svg]:mx-auto [&>span]:hidden" aria-label="Change meeting status" />
          <SelectContent align="end">
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function CreateMeetingDialog({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const emptyForm = { date: defaultDate, time: "10:00", withPerson: "", purpose: "", notes: "" };
  const [form, setForm] = React.useState(emptyForm);

  const { run, loading } = useAction(createMeeting, {
    successMessage: "Meeting added",
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
      date: new Date(form.date),
      time: form.time,
      withPerson: form.withPerson,
      purpose: form.purpose,
      notes: form.notes || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm"><Plus className="h-4 w-4" /> Meeting</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Meeting</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Time</Label>
            <Input type="time" required value={form.time} onChange={(e) => set("time", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Meeting With</Label>
            <Input required autoFocus value={form.withPerson} onChange={(e) => set("withPerson", e.target.value)} placeholder="e.g. GETCO Executive Engineer" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Purpose</Label>
            <Input required value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="e.g. Tender discussion" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>Add Meeting</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
