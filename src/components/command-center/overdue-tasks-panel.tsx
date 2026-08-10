import { AlertTriangle } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { StatusChip } from "@/components/ui/status-chip";
import { TaskRow } from "./task-row";
import type { TaskRowData } from "./types";

export function OverdueTasksPanel({ tasks }: { tasks: TaskRowData[] }) {
  if (tasks.length === 0) {
    return (
      <MissionPanel
        title="Overdue Tasks"
        tint="red"
        action={<StatusChip tone="success">All clear</StatusChip>}
      >
        <p className="py-2 text-sm text-muted-foreground">
          Nothing carried over from previous days. Clean slate.
        </p>
      </MissionPanel>
    );
  }

  return (
    <MissionPanel
      title="Overdue Tasks"
      tint="red"
      action={
        <StatusChip tone="destructive" pulse>
          {tasks.length} overdue
        </StatusChip>
      }
    >
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>These stay here every day until you mark them complete.</p>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} tone="overdue" />
        ))}
      </div>
    </MissionPanel>
  );
}
