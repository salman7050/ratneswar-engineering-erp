"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { submitEndOfDayReport } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";

const EVENING_HOUR = 18; // auto-prompt from 6pm onward
const SESSION_KEY = "eod-prompt-dismissed";

export function EndOfDayDialog({ alreadySubmittedToday }: { alreadySubmittedToday: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ completedWork: "", pendingWork: "", tomorrowPlan: "" });

  React.useEffect(() => {
    if (alreadySubmittedToday) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    if (new Date().getHours() >= EVENING_HOUR) {
      setOpen(true);
    }
  }, [alreadySubmittedToday]);

  const { run, loading } = useAction(submitEndOfDayReport, {
    successMessage: "Day closed out — see you tomorrow",
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) sessionStorage.setItem(SESSION_KEY, "1"); // don't re-nag this session if dismissed
    setOpen(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      completedWork: form.completedWork,
      pendingWork: form.pendingWork || null,
      tomorrowPlan: form.tomorrowPlan || null,
    });
  }

  return (
    <>
      <Button variant="glass" size="sm" onClick={() => setOpen(true)}>
        <Moon className="h-3.5 w-3.5" /> End My Day
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>What did you complete today?</DialogTitle>
            <DialogDescription>Two minutes now saves confusion tomorrow morning. This gets saved to your history.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Completed Work</Label>
              <Textarea
                required
                autoFocus
                rows={3}
                value={form.completedWork}
                onChange={(e) => setForm((f) => ({ ...f, completedWork: e.target.value }))}
                placeholder="e.g. Visited PS-2, submitted GETCO invoice, called Sungrow re: warranty"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Pending Work <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea
                rows={2}
                value={form.pendingWork}
                onChange={(e) => setForm((f) => ({ ...f, pendingWork: e.target.value }))}
                placeholder="What's still open"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tomorrow&apos;s Plan <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea
                rows={2}
                value={form.tomorrowPlan}
                onChange={(e) => setForm((f) => ({ ...f, tomorrowPlan: e.target.value }))}
                placeholder="What you'll tackle first tomorrow"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Not now</Button></DialogClose>
              <Button type="submit" variant="gold" loading={loading}>Save & Close Day</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
