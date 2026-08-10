"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createTask } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";
import { CATEGORY_LABELS } from "./utils";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function TaskFormDialog({
  sites,
  team,
  defaultDueDate,
  trigger,
}: {
  sites: { id: string; name: string }[];
  team: { id: string; name: string }[];
  /** ISO date (yyyy-mm-dd) to pre-fill, e.g. today when launched from "Today's Plan". */
  defaultDueDate?: string;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const emptyForm = {
    title: "",
    description: "",
    priority: "MEDIUM" as (typeof PRIORITIES)[number],
    category: "OTHER",
    siteId: "",
    assignedToId: "",
    dueDate: defaultDueDate ?? "",
    dueTime: "",
    attachmentUrl: "",
    notes: "",
  };
  const [form, setForm] = React.useState(emptyForm);

  const { run, loading } = useAction(createTask, {
    successMessage: "Task added",
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
      description: form.description || null,
      priority: form.priority,
      category: form.category as any,
      siteId: form.siteId || null,
      assignedToId: form.assignedToId || null,
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
      dueTime: form.dueTime || null,
      attachmentUrl: form.attachmentUrl || null,
      notes: form.notes || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="gold" size="sm">
            <Plus className="h-4 w-4" /> Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Add it to your plan — it&apos;ll follow you until it&apos;s done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid max-h-[70vh] gap-4 overflow-y-auto scrollbar-thin pr-1 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Title</Label>
            <Input required autoFocus value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Visit PS-2" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional detail" rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set("priority", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Site <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Select value={form.siteId || "none"} onValueChange={(v) => set("siteId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No site</SelectItem>
                {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Assign To <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Select value={form.assignedToId || "self"} onValueChange={(v) => set("assignedToId", v === "self" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Myself" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Myself</SelectItem>
                {team.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Due Time</Label>
            <Input type="time" value={form.dueTime} onChange={(e) => set("dueTime", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Attachment URL <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input value={form.attachmentUrl} onChange={(e) => set("attachmentUrl", e.target.value)} placeholder="Link to a document/photo" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
