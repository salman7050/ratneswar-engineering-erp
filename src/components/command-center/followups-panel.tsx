"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, PhoneCall } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { createFollowUp, completeFollowUp } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";
import { FOLLOW_UP_TYPE_LABELS } from "./utils";

interface FollowUpRow {
  id: string;
  title: string;
  type: string;
  status: "PENDING" | "DONE";
  notes: string | null;
  site: { id: string; name: string } | null;
}

export function FollowUpsPanel({
  followUps,
  sites,
  todayIso,
}: {
  followUps: FollowUpRow[];
  sites: { id: string; name: string }[];
  todayIso: string;
}) {
  const pending = followUps.filter((f) => f.status === "PENDING");

  return (
    <MissionPanel
      title="Follow-ups"
      tint="blue"
      action={<CreateFollowUpDialog sites={sites} defaultDate={todayIso} />}
    >
      {followUps.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <PhoneCall className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No follow-ups due today.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {followUps.map((f) => (
            <FollowUpRowItem key={f.id} followUp={f} />
          ))}
        </div>
      )}
      {pending.length === 0 && followUps.length > 0 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">All follow-ups handled today 🎉</p>
      )}
    </MissionPanel>
  );
}

function FollowUpRowItem({ followUp }: { followUp: FollowUpRow }) {
  const router = useRouter();
  const isDone = followUp.status === "DONE";
  const { run, loading } = useAction(completeFollowUp, { onSuccess: () => router.refresh() });

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5 ${isDone ? "opacity-50" : ""}`}>
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${isDone ? "line-through" : ""}`}>{followUp.title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {FOLLOW_UP_TYPE_LABELS[followUp.type] ?? followUp.type}
          {followUp.site && ` · ${followUp.site.name}`}
        </p>
      </div>
      {!isDone && (
        <Button size="sm" variant="glass" loading={loading} onClick={() => run(followUp.id)} className="shrink-0">
          <Check className="h-3.5 w-3.5" /> Done
        </Button>
      )}
    </div>
  );
}

function CreateFollowUpDialog({ sites, defaultDate }: { sites: { id: string; name: string }[]; defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const emptyForm = { title: "", type: "CALL_VENDOR", dueDate: defaultDate, notes: "", siteId: "" };
  const [form, setForm] = React.useState(emptyForm);

  const { run, loading } = useAction(createFollowUp, {
    successMessage: "Follow-up scheduled",
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
      siteId: form.siteId || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm"><Plus className="h-4 w-4" /> Follow-up</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Follow-up</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input required autoFocus value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Call Vendor — Sungrow" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Site <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Select value={form.siteId || "none"} onValueChange={(v) => set("siteId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No site</SelectItem>
                {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reminder Date</Label>
            <Input type="date" required value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>Schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
