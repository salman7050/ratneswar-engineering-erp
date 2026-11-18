"use client";

import * as React from "react";
import {
  CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Circle, Clock3,
  History, ListChecks, Plus, Search, Star, UserPlus, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createTask, updateTaskPriority, updateTaskStatus } from "@/lib/actions/command-center-actions";
import { encodeTodoAssignee } from "@/lib/todo-meta";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

type TodoTask = {
  id: string;
  title: string;
  description: string | null;
  customAssigneeName: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  status: "PENDING" | "IN_PROGRESS" | "WAITING" | "COMPLETED" | "CANCELLED";
  progress: number;
  dueDate: string | null;
  dueTime: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  site: { id: string; name: string } | null;
  assignedTo: { id: string; name: string };
  createdBy: { id: string; name: string };
  commentCount: number;
};

type TodoPayload = {
  currentUserId: string;
  sites: { id: string; name: string }[];
  team: { id: string; name: string; role: string }[];
  tasks: TodoTask[];
};

type View = "today" | "important" | "planned" | "overdue" | "all" | "completed" | "history";
type WorkList = "Office" | "Sites" | "Payment" | "Purchase" | "Follow-up";

const LISTS: { label: WorkList; categories: string[] }[] = [
  { label: "Office", categories: ["ADMIN", "DOCUMENTATION", "MEETING", "OTHER"] },
  { label: "Sites", categories: ["SITE_VISIT", "MAINTENANCE"] },
  { label: "Payment", categories: ["INVOICE"] },
  { label: "Purchase", categories: ["MATERIAL_ORDER"] },
  { label: "Follow-up", categories: ["FOLLOW_UP", "QUOTATION", "TENDER"] },
];

const LIST_TO_CATEGORY: Record<WorkList, string> = {
  Office: "ADMIN",
  Sites: "SITE_VISIT",
  Payment: "INVOICE",
  Purchase: "MATERIAL_ORDER",
  "Follow-up": "FOLLOW_UP",
};

function indiaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

function dateKey(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(value));
}

function readableDate(value: string) {
  return new Date(`${value}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

function listFor(task: TodoTask): WorkList {
  return LISTS.find((item) => item.categories.includes(task.category))?.label ?? "Office";
}

function assigneeName(task: TodoTask) {
  return task.customAssigneeName || task.assignedTo.name;
}

function isOpen(task: TodoTask) {
  return !["COMPLETED", "CANCELLED"].includes(task.status);
}

export function TodoDrawer({ collapsed = false, mobile = false }: { collapsed?: boolean; mobile?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [payload, setPayload] = React.useState<TodoPayload | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [view, setView] = React.useState<View>("today");
  const [activeList, setActiveList] = React.useState<WorkList | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [historyDate, setHistoryDate] = React.useState(indiaDateKey());
  const [addOpen, setAddOpen] = React.useState(false);
  const [teamOpen, setTeamOpen] = React.useState(false);
  const [customAssignees, setCustomAssignees] = React.useState<string[]>([]);
  const today = indiaDateKey();

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("ratneswar-todo-assignees") || "[]");
      if (Array.isArray(saved)) setCustomAssignees(saved.filter((value) => typeof value === "string"));
    } catch {}
  }, []);

  const saveCustomAssignees = React.useCallback((names: string[]) => {
    const unique = Array.from(new Set(names.map((name) => name.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    setCustomAssignees(unique);
    window.localStorage.setItem("ratneswar-todo-assignees", JSON.stringify(unique));
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/todo", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load tasks");
      const data = await response.json() as TodoPayload;
      setPayload(data);
      setSelectedId((current) => current && data.tasks.some((task) => task.id === current) ? current : data.tasks[0]?.id ?? null);
      const discovered = data.tasks.map((task) => task.customAssigneeName).filter(Boolean) as string[];
      if (discovered.length) saveCustomAssignees([...customAssignees, ...discovered]);
    } catch (error) {
      toast.error("To Do", error instanceof Error ? error.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [customAssignees, saveCustomAssignees]);

  React.useEffect(() => { if (open) void load(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const tasks = payload?.tasks ?? [];
  const selected = tasks.find((task) => task.id === selectedId) ?? null;

  const filtered = React.useMemo(() => {
    const text = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const due = dateKey(task.dueDate);
      if (activeList && listFor(task) !== activeList) return false;
      if (!activeList) {
        if (view === "today" && due !== today) return false;
        if (view === "important" && !(isOpen(task) && ["HIGH", "URGENT"].includes(task.priority))) return false;
        if (view === "planned" && !(isOpen(task) && due && due >= today)) return false;
        if (view === "overdue" && !(isOpen(task) && due && due < today)) return false;
        if (view === "completed" && task.status !== "COMPLETED") return false;
        if (view === "history" && due !== historyDate) return false;
      }
      if (!text) return true;
      return [task.title, task.description, task.notes, task.site?.name, assigneeName(task), listFor(task)]
        .filter(Boolean).join(" ").toLowerCase().includes(text);
    }).sort((a, b) => {
      const ad = dateKey(a.dueDate) ?? "9999-99-99";
      const bd = dateKey(b.dueDate) ?? "9999-99-99";
      return ad.localeCompare(bd) || (a.dueTime ?? "99:99").localeCompare(b.dueTime ?? "99:99");
    });
  }, [tasks, activeList, view, today, historyDate, query]);

  const counts = React.useMemo(() => ({
    today: tasks.filter((task) => dateKey(task.dueDate) === today && isOpen(task)).length,
    important: tasks.filter((task) => isOpen(task) && ["HIGH", "URGENT"].includes(task.priority)).length,
    planned: tasks.filter((task) => { const due = dateKey(task.dueDate); return isOpen(task) && Boolean(due && due >= today); }).length,
    overdue: tasks.filter((task) => { const due = dateKey(task.dueDate); return isOpen(task) && Boolean(due && due < today); }).length,
    all: tasks.length,
    completed: tasks.filter((task) => task.status === "COMPLETED").length,
  }), [tasks, today]);

  function pickView(next: View) {
    setView(next); setActiveList(null);
    if (next === "history") setHistoryDate(today);
  }

  async function toggleComplete(task: TodoTask) {
    const result = await updateTaskStatus({ id: task.id, status: task.status === "COMPLETED" ? "PENDING" : "COMPLETED" });
    if (!result.ok) return toast.error("To Do", result.error);
    await load();
  }

  async function toggleImportant(task: TodoTask) {
    const next = ["HIGH", "URGENT"].includes(task.priority) ? "MEDIUM" : "HIGH";
    const result = await updateTaskPriority({ id: task.id, priority: next });
    if (!result.ok) return toast.error("To Do", result.error);
    await load();
  }

  function shiftHistory(delta: number) {
    const d = new Date(`${historyDate}T00:00:00+05:30`);
    d.setDate(d.getDate() + delta);
    setHistoryDate(indiaDateKey(d));
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            title={collapsed ? "To Do" : undefined}
            className={cn(
              "group flex w-full items-center rounded-xl text-[13px] font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-800",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
              mobile && "w-full"
            )}
          >
            <ListChecks className="h-[18px] w-[18px] shrink-0 text-blue-600" />
            {!collapsed && <span>To Do</span>}
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[96vw] max-w-[1180px] overflow-hidden border-blue-100 bg-slate-50 p-0 sm:max-w-[1180px]">
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
            <aside className="hidden min-h-0 overflow-y-auto border-r border-slate-200 bg-white p-3 lg:block">
              <div className="mb-3 px-2 pt-2">
                <p className="text-lg font-bold text-slate-950">To Do</p>
                <p className="text-[11px] text-slate-400">Ratneswar work planner</p>
              </div>
              <TodoNav view={view} activeList={activeList} counts={counts} onView={pickView} onList={(list) => { setActiveList(list); setView("all"); }} tasks={tasks} />
              <Button variant="outline" size="sm" className="mt-4 w-full justify-start" onClick={() => setTeamOpen(true)}>
                <Users className="h-4 w-4" /> Manage Assignees
              </Button>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col bg-slate-50">
              <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.17em] text-blue-500">Task Control Center</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-950">{activeList ?? viewLabel(view)}</h2>
                    <p className="mt-1 text-xs text-slate-400">{view === "history" ? readableDate(historyDate) : readableDate(today)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setTeamOpen(true)}><Users className="h-4 w-4" /> Team</Button>
                    <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Task</Button>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                  {(["today","overdue","planned","completed","history"] as View[]).map((item) => (
                    <button key={item} onClick={() => pickView(item)} className={cn("whitespace-nowrap rounded-full border px-3 py-1.5 text-xs", view === item && !activeList ? "border-blue-200 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 bg-white text-slate-600")}>{viewLabel(item)}</button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search task, site, assignee..." className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
                  {query && <button onClick={() => setQuery("")}><X className="h-4 w-4 text-slate-400" /></button>}
                </div>
                {view === "history" && !activeList && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => shiftHistory(-1)}><ChevronLeft className="h-4 w-4" /> Previous</Button>
                    <Input type="date" className="h-9 w-[150px]" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} />
                    <Button variant="outline" size="sm" onClick={() => shiftHistory(1)}>Next <ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
                {loading && !payload ? <TodoSkeleton /> : filtered.length ? (
                  <div className="space-y-1.5">
                    {filtered.map((task) => (
                      <TodoRow
                        key={task.id}
                        task={task}
                        selected={task.id === selectedId}
                        today={today}
                        onSelect={() => setSelectedId(task.id)}
                        onComplete={() => void toggleComplete(task)}
                        onImportant={() => void toggleImportant(task)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-slate-400">
                    <CheckCircle2 className="h-9 w-9 text-emerald-300" />
                    <p className="mt-3 text-sm font-medium text-slate-600">No tasks in this view.</p>
                    <p className="mt-1 text-xs">Add work or choose another date/list.</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="hidden min-h-0 overflow-y-auto border-l border-slate-200 bg-white p-5 lg:block">
              {selected ? <TaskDetail task={selected} onComplete={() => void toggleComplete(selected)} /> : <p className="pt-12 text-center text-sm text-slate-400">Select a task to see details.</p>}
            </aside>
          </div>
        </SheetContent>
      </Sheet>

      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        payload={payload}
        customAssignees={customAssignees}
        defaultDate={view === "history" ? historyDate : today}
        onCreated={load}
      />
      <AssigneeDialog open={teamOpen} onOpenChange={setTeamOpen} customAssignees={customAssignees} onChange={saveCustomAssignees} systemTeam={payload?.team ?? []} />
    </>
  );
}

function TodoNav({ view, activeList, counts, onView, onList, tasks }: {
  view: View; activeList: WorkList | null; counts: Record<string, number>;
  onView: (view: View) => void; onList: (list: WorkList) => void; tasks: TodoTask[];
}) {
  const rows: { view: View; label: string; icon: React.ElementType; count?: number }[] = [
    { view: "today", label: "My Day", icon: CalendarDays, count: counts.today },
    { view: "important", label: "Important", icon: Star, count: counts.important },
    { view: "planned", label: "Planned", icon: Clock3, count: counts.planned },
    { view: "overdue", label: "Overdue", icon: History, count: counts.overdue },
    { view: "all", label: "All Tasks", icon: ListChecks, count: counts.all },
    { view: "completed", label: "Completed", icon: CheckCircle2, count: counts.completed },
    { view: "history", label: "History", icon: History },
  ];
  return <div>
    <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">My Tasks</p>
    <nav className="space-y-1">
      {rows.map((row) => <button key={row.view} onClick={() => onView(row.view)} className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium", view === row.view && !activeList ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}>
        <row.icon className="h-4 w-4" /><span className="flex-1">{row.label}</span>{typeof row.count === "number" && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{row.count}</span>}
      </button>)}
    </nav>
    <p className="mb-2 mt-5 px-2 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Lists</p>
    <nav className="space-y-1">
      {LISTS.map((list) => {
        const count = tasks.filter((task) => listFor(task) === list.label).length;
        return <button key={list.label} onClick={() => onList(list.label)} className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium", activeList === list.label ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}>
          <Circle className="h-3.5 w-3.5" /><span className="flex-1">{list.label}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{count}</span>
        </button>;
      })}
    </nav>
  </div>;
}

function TodoRow({ task, selected, today, onSelect, onComplete, onImportant }: {
  task: TodoTask; selected: boolean; today: string; onSelect: () => void; onComplete: () => void; onImportant: () => void;
}) {
  const due = dateKey(task.dueDate);
  const overdue = isOpen(task) && Boolean(due && due < today);
  const done = task.status === "COMPLETED";
  return <div onClick={onSelect} className={cn("group grid cursor-pointer grid-cols-[28px_minmax(0,1fr)_32px] items-start gap-2 rounded-xl border p-3 transition", selected ? "border-blue-200 bg-blue-50/70" : "border-transparent bg-white hover:border-slate-200")}>
    <button onClick={(e) => { e.stopPropagation(); onComplete(); }} className={cn("mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white")} aria-label={done ? "Restore task" : "Complete task"}>{done && <Check className="h-3 w-3" />}</button>
    <div className="min-w-0">
      <p className={cn("truncate text-[13px] font-semibold text-slate-800", done && "text-slate-400 line-through")}>{task.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
        {due && <span className={cn("rounded-md bg-slate-100 px-2 py-0.5", overdue && "bg-rose-50 text-rose-700")}>{due === today ? "Today" : readableDate(due)}{task.dueTime ? ` · ${task.dueTime}` : ""}</span>}
        <span className="rounded-md bg-slate-100 px-2 py-0.5">{listFor(task)}</span>
        {task.site?.name && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700">{task.site.name}</span>}
        <span>{assigneeName(task)}</span>
      </div>
    </div>
    <button onClick={(e) => { e.stopPropagation(); onImportant(); }} className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 hover:bg-amber-50 hover:text-amber-500", ["HIGH","URGENT"].includes(task.priority) && "text-amber-500")}><Star className="h-4 w-4" fill={["HIGH","URGENT"].includes(task.priority) ? "currentColor" : "none"} /></button>
  </div>;
}

function TaskDetail({ task, onComplete }: { task: TodoTask; onComplete: () => void }) {
  return <div>
    <p className="text-lg font-bold leading-6 text-slate-950">{task.title}</p>
    <p className="mt-1 text-xs text-slate-400">{listFor(task)} · Assigned to {assigneeName(task)}</p>
    <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
      <DetailRow label="Due" value={task.dueDate ? readableDate(dateKey(task.dueDate)!) + (task.dueTime ? ` · ${task.dueTime}` : "") : "No date"} />
      <DetailRow label="Priority" value={task.priority} />
      <DetailRow label="Site" value={task.site?.name ?? "—"} />
      <DetailRow label="Status" value={task.status.replaceAll("_", " ")} />
      <DetailRow label="Created by" value={task.createdBy.name} />
    </div>
    {task.description && <section className="mt-5"><p className="text-xs font-bold text-slate-700">Description</p><p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{task.description}</p></section>}
    {task.notes && <section className="mt-5"><p className="text-xs font-bold text-slate-700">Notes</p><p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{task.notes}</p></section>}
    <Button className="mt-5 w-full" variant={task.status === "COMPLETED" ? "outline" : "default"} onClick={onComplete}>{task.status === "COMPLETED" ? "Restore Task" : "Mark Complete"}</Button>
  </div>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-2.5 text-xs"><span className="text-slate-400">{label}</span><span className="text-right font-semibold text-slate-700">{value}</span></div>;
}

function AddTaskDialog({ open, onOpenChange, payload, customAssignees, defaultDate, onCreated }: {
  open: boolean; onOpenChange: (open: boolean) => void; payload: TodoPayload | null; customAssignees: string[]; defaultDate: string; onCreated: () => Promise<void>;
}) {
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", description: "", date: defaultDate, time: "", priority: "MEDIUM", list: "Office" as WorkList, assignee: "self", siteId: "", notes: "" });
  React.useEffect(() => { if (open) setForm((f) => ({ ...f, date: defaultDate })); }, [open, defaultDate]);

  async function submit() {
    if (!form.title.trim()) return;
    setSaving(true);
    const actualUser = payload?.team.find((user) => `user:${user.id}` === form.assignee);
    const customName = form.assignee.startsWith("custom:") ? form.assignee.slice(7) : null;
    const result = await createTask({
      title: form.title.trim(),
      description: encodeTodoAssignee(form.description, customName),
      priority: form.priority as any,
      category: LIST_TO_CATEGORY[form.list] as any,
      siteId: form.siteId || null,
      assignedToId: actualUser?.id ?? null,
      dueDate: form.date ? new Date(`${form.date}T00:00:00+05:30`) : null,
      dueTime: form.time || null,
      notes: form.notes || null,
      reminderAt: null,
      attachmentUrl: null,
    });
    setSaving(false);
    if (!result.ok) return toast.error("To Do", result.error);
    toast.success("To Do", "Task added.");
    onOpenChange(false);
    setForm({ title: "", description: "", date: defaultDate, time: "", priority: "MEDIUM", list: "Office", assignee: "self", siteId: "", notes: "" });
    await onCreated();
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Task</Label><Input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to be done?" /></div>
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><Label>Time</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
        <div><Label>List</Label><Select value={form.list} onValueChange={(value) => setForm({ ...form, list: value as WorkList })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LISTS.map((item) => <SelectItem key={item.label} value={item.label}>{item.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Priority</Label><Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Normal</SelectItem><SelectItem value="HIGH">Important</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></div>
        <div><Label>Assign to</Label><Select value={form.assignee} onValueChange={(value) => setForm({ ...form, assignee: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="self">Myself</SelectItem>{payload?.team.map((user) => <SelectItem key={user.id} value={`user:${user.id}`}>{user.name}</SelectItem>)}{customAssignees.map((name) => <SelectItem key={name} value={`custom:${name}`}>{name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Site</Label><Select value={form.siteId || "none"} onValueChange={(value) => setForm({ ...form, siteId: value === "none" ? "" : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No site</SelectItem>{payload?.sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button loading={saving} onClick={() => void submit()}>Create Task</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function AssigneeDialog({ open, onOpenChange, customAssignees, onChange, systemTeam }: {
  open: boolean; onOpenChange: (open: boolean) => void; customAssignees: string[]; onChange: (names: string[]) => void; systemTeam: TodoPayload["team"];
}) {
  const [name, setName] = React.useState("");
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader><DialogTitle>Manage Assignees</DialogTitle></DialogHeader>
      <div>
        <p className="text-xs text-slate-500">ERP users appear automatically. Add extra field/team names below even if they do not have an ERP login.</p>
        <div className="mt-4 space-y-2">
          {systemTeam.map((user) => <div key={user.id} className="flex items-center gap-3 rounded-xl border p-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{user.name.slice(0,1).toUpperCase()}</div><div className="flex-1"><p className="text-sm font-semibold">{user.name}</p><p className="text-[10px] text-slate-400">ERP user · {user.role}</p></div></div>)}
          {customAssignees.map((value) => <div key={value} className="flex items-center gap-3 rounded-xl border p-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{value.slice(0,1).toUpperCase()}</div><div className="flex-1 text-sm font-semibold">{value}</div><button onClick={() => onChange(customAssignees.filter((name) => name !== value))} className="rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50">Remove</button></div>)}
        </div>
        <div className="mt-4 flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add assignee name" /><Button onClick={() => { if (name.trim()) { onChange([...customAssignees, name.trim()]); setName(""); } }}><UserPlus className="h-4 w-4" /> Add</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}

function TodoSkeleton() {
  return <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-white" />)}</div>;
}

function viewLabel(view: View) {
  return ({ today: "My Day", important: "Important", planned: "Planned", overdue: "Overdue", all: "All Tasks", completed: "Completed", history: "History" } as Record<View, string>)[view];
}
