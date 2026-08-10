"use client";

import * as React from "react";
import { Plus, Trash2, History, Flag, AlertCircle, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Muted } from "@/components/ui/typography";
import { formatDate } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { addTenderTimelineEvent, deleteTenderTimelineEvent } from "@/lib/actions/tender-timeline-actions";
import type { TenderDetail } from "@/lib/queries/tenders";

const CATEGORY_ICON: Record<string, typeof Flag> = {
  MILESTONE: Flag, ISSUE: AlertCircle, VISIT: Eye, GENERAL: MessageSquare,
};
const CATEGORY_COLOR: Record<string, string> = {
  MILESTONE: "text-brand-gold-light bg-brand-gold/12",
  ISSUE: "text-destructive bg-destructive/12",
  VISIT: "text-info bg-info/12",
  GENERAL: "text-muted-foreground bg-secondary",
};

export function TenderTimelinePanel({ tenderId, events }: { tenderId: string; events: TenderDetail["timeline"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "", category: "GENERAL", eventDate: new Date().toISOString().slice(0, 10) });

  const { run: add, loading } = useAction(addTenderTimelineEvent, {
    successMessage: "Event added",
    onSuccess: () => { setOpen(false); setForm({ title: "", description: "", category: "GENERAL", eventDate: new Date().toISOString().slice(0, 10) }); },
  });
  const { run: remove } = useAction(deleteTenderTimelineEvent, { successMessage: "Event removed" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Timeline Event</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Pre-bid meeting attended" /></div>
              <div className="flex flex-col gap-1.5"><Label>Description (optional)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MILESTONE">Milestone</SelectItem><SelectItem value="ISSUE">Issue</SelectItem>
                      <SelectItem value="VISIT">Visit</SelectItem><SelectItem value="GENERAL">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                disabled={!form.title}
                onClick={() => add({ tenderId, title: form.title, description: form.description || null, category: form.category as any, eventDate: new Date(form.eventDate) })}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <History className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No timeline events yet.</Muted>
        </div>
      ) : (
        <ol className="relative flex flex-col gap-5 border-l border-border pl-6">
          {events.map((e) => {
            const Icon = CATEGORY_ICON[e.category] ?? MessageSquare;
            return (
              <li key={e.id} className="relative">
                <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ${CATEGORY_COLOR[e.category]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    {e.description && <Muted className="mt-0.5 text-xs">{e.description}</Muted>}
                    <Muted className="mt-1 text-[11px]">{formatDate(e.eventDate)} {e.createdBy ? `· ${e.createdBy.name}` : ""}</Muted>
                  </div>
                  <button onClick={() => remove(e.id, tenderId)} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
