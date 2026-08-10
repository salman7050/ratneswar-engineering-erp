"use client";

import * as React from "react";
import { CalendarDays, Check, CircleAlert, Clock3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskFormDialog } from "@/components/command-center/task-form-dialog";
import { updateTaskStatus } from "@/lib/actions/command-center-actions";
import { toast } from "@/lib/toast";
import type { TaskRowData } from "@/components/command-center/types";
import { cn } from "@/lib/utils";

const PRIORITY_STYLE: Record<string, string> = {
  LOW: "border-emerald-100 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-100 bg-amber-50 text-amber-700",
  HIGH: "border-rose-100 bg-rose-50 text-rose-700",
  URGENT: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value: Date | string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function WorkRow({ task, pending = false }: { task: TaskRowData; pending?: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const done = task.status === "COMPLETED";
  async function toggle() {
    setSaving(true);
    const result = await updateTaskStatus({ id: task.id, status: done ? "PENDING" : "COMPLETED" });
    setSaving(false);
    if (!result.ok) { toast.error("Task", result.error); return; }
    router.refresh();
  }

  return (
    <div className="flex min-h-[52px] items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={saving}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        className={cn("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition", done ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white hover:border-blue-500")}
      >{done && <Check className="h-3 w-3" />}</button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13px] font-medium text-slate-800", done && "text-slate-400 line-through")}>{task.title}</p>
        {task.site?.name && <p className="mt-0.5 truncate text-[11px] text-slate-400">{task.site.name}</p>}
      </div>
      {pending ? (
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">From {formatDate(task.dueDate)}</span>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          {task.dueTime && <span className="text-[11px] tabular-nums text-slate-500">{task.dueTime}</span>}
          <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold", PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.MEDIUM)}>{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span>
        </div>
      )}
    </div>
  );
}

export function DailyWorkPanels({
  todayTasks,
  pendingWorks,
  sites,
  team,
  todayDate,
}: {
  todayTasks: TaskRowData[];
  pendingWorks: TaskRowData[];
  sites: { id: string; name: string }[];
  team: { id: string; name: string }[];
  todayDate: string;
}) {
  const done = todayTasks.filter((task) => task.status === "COMPLETED").length;
  const pct = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-blue-600" /><h2 className="font-semibold text-slate-900">Today&apos;s Work</h2></div>
            <div className="flex items-center gap-2">
              <Badge variant="success">{done} of {todayTasks.length} completed</Badge>
              <TaskFormDialog sites={sites} team={team} defaultDueDate={todayDate} trigger={<Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /> Add Work</Button>} />
            </div>
          </header>
          <div className="min-h-[250px]">
            {todayTasks.length ? todayTasks.map((task) => <WorkRow key={task.id} task={task} />) : <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center"><CalendarDays className="h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">No work added for today.</p><p className="mt-1 text-xs text-slate-400">Add today&apos;s plan and tick each item when finished.</p></div>}
          </div>
          <footer className="border-t border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500"><span>Daily progress</span><span>{pct}%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
          </footer>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-600" /><h2 className="font-semibold text-slate-900">Pending Works</h2></div>
            <Badge variant="warning">{pendingWorks.length} pending</Badge>
          </header>
          <div className="min-h-[250px]">
            {pendingWorks.length ? pendingWorks.slice(0, 8).map((task) => <WorkRow key={task.id} task={task} pending />) : <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center"><Check className="h-7 w-7 text-emerald-400" /><p className="mt-3 text-sm font-medium text-slate-600">No previous work pending.</p><p className="mt-1 text-xs text-slate-400">Completed work disappears automatically.</p></div>}
          </div>
          <div className="mx-4 mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />Unfinished work automatically stays here until you tick it complete.</div>
        </section>
      </div>
      <ElevenPmReminder pendingCount={todayTasks.filter((task) => !["COMPLETED", "CANCELLED"].includes(task.status)).length} />
    </>
  );
}

function ElevenPmReminder({ pendingCount }: { pendingCount: number }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    function check() {
      const now = new Date();
      const key = `ratneswar-eod-reminder-${now.toISOString().slice(0, 10)}`;
      if (now.getHours() >= 23 && pendingCount > 0 && window.localStorage.getItem(key) !== "dismissed") setVisible(true);
    }
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, [pendingCount]);
  if (!visible) return null;
  function dismiss() {
    const key = `ratneswar-eod-reminder-${new Date().toISOString().slice(0, 10)}`;
    window.localStorage.setItem(key, "dismissed");
    setVisible(false);
  }
  return (
    <div className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-2xl rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl md:left-auto md:right-6 md:mx-0 md:w-[430px]">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-700"><Clock3 className="h-5 w-5" /></div><div className="flex-1"><p className="font-semibold text-slate-900">11:00 PM · Today&apos;s work check</p><p className="mt-1 text-sm leading-5 text-slate-600">You still have {pendingCount} unfinished {pendingCount === 1 ? "task" : "tasks"}. Tick anything completed now. The rest will stay under Pending Works tomorrow.</p><Button onClick={dismiss} size="sm" className="mt-3">Got it</Button></div></div>
    </div>
  );
}
