"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, MapPin, Clock, MessageSquare, Paperclip } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { updateTaskStatus, deleteTask } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";
import { PRIORITY_META, CATEGORY_LABELS, TASK_STATUS_META, formatDueLabel } from "./utils";
import type { TaskRowData } from "./types";
import { cn } from "@/lib/utils";

const STATUSES = ["PENDING", "IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED"] as const;

export function TaskRow({ task, tone = "default" }: { task: TaskRowData; tone?: "default" | "overdue" }) {
  const router = useRouter();
  const isDone = task.status === "COMPLETED";
  const priority = PRIORITY_META[task.priority] ?? { label: "Medium", dot: "bg-info", text: "text-info" };

  const { run: runStatus, loading: statusLoading } = useAction(updateTaskStatus, {
    onSuccess: () => router.refresh(),
  });
  const { run: runDelete, loading: deleteLoading } = useAction(deleteTask, {
    successMessage: "Task removed",
    onSuccess: () => router.refresh(),
  });

  function toggleComplete(checked: boolean) {
    runStatus({ id: task.id, status: checked ? "COMPLETED" : "PENDING" });
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        tone === "overdue" ? "border-destructive/25 bg-destructive/[0.04] hover:border-destructive/40" : "border-border/60 bg-secondary/20 hover:border-border",
        isDone && "opacity-50"
      )}
    >
      <Checkbox
        checked={isDone}
        disabled={statusLoading}
        onCheckedChange={(c) => toggleComplete(Boolean(c))}
        className="mt-1 shrink-0"
        aria-label={`Mark "${task.title}" complete`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("truncate text-sm font-medium leading-snug", isDone && "line-through")}>{task.title}</p>
          <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", priority.dot)} title={`${priority.label} priority`} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {tone === "overdue" ? (
            <span className="font-semibold text-destructive">{formatDueLabel(task.dueDate)}</span>
          ) : (
            task.dueTime && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {task.dueTime}</span>
            )
          )}
          {task.site && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {task.site.name}</span>
          )}
          <span>{CATEGORY_LABELS[task.category] ?? task.category}</span>
          {task._count.comments > 0 && (
            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {task._count.comments}</span>
          )}
          {task.attachmentUrl && (
            <a href={task.attachmentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
              <Paperclip className="h-3 w-3" /> Attachment
            </a>
          )}
        </div>

        {task.progress > 0 && task.progress < 100 && (
          <Progress value={task.progress} className="mt-2 h-1.5" />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Select value={task.status} onValueChange={(v) => runStatus({ id: task.id, status: v as any })}>
          <SelectTrigger className="h-7 w-[110px] border-none bg-transparent px-2 text-[11px] shadow-none">
            <SelectValue>{TASK_STATUS_META[task.status]?.label ?? task.status}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_META[s]?.label ?? s}</SelectItem>)}
          </SelectContent>
        </Select>
        <button
          onClick={() => runDelete(task.id)}
          disabled={deleteLoading}
          aria-label="Delete task"
          className="touch-target flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
