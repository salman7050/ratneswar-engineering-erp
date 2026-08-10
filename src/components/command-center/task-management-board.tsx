import { ClipboardList } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskRow } from "./task-row";
import { TASK_STATUS_META } from "./utils";
import type { TaskRowData } from "./types";

const COLUMNS = ["PENDING", "IN_PROGRESS", "WAITING"] as const;

export function TaskManagementBoard({
  tasks,
  sites,
  team,
}: {
  tasks: TaskRowData[];
  sites: { id: string; name: string }[];
  team: { id: string; name: string }[];
}) {
  return (
    <MissionPanel title="Task Management" action={<TaskFormDialog sites={sites} team={team} />}>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No open tasks — you&apos;re fully caught up.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {COLUMNS.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {TASK_STATUS_META[status]?.label ?? status}
                  </p>
                  <span className="text-xs tabular text-muted-foreground">{columnTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {columnTasks.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/50 px-3 py-4 text-center text-xs text-muted-foreground/70">
                      Nothing here
                    </p>
                  ) : (
                    columnTasks.map((t) => <TaskRow key={t.id} task={t} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MissionPanel>
  );
}
