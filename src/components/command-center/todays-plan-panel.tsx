"use client";

import { CalendarCheck2 } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { StatusChip } from "@/components/ui/status-chip";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskRow } from "./task-row";
import type { TaskRowData } from "./types";

export function TodaysPlanPanel({
  tasks,
  sites,
  team,
  todayIso,
}: {
  tasks: TaskRowData[];
  sites: { id: string; name: string }[];
  team: { id: string; name: string }[];
  todayIso: string;
}) {
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <MissionPanel
      title="Today's Plan"
      tint="gold"
      action={<TaskFormDialog sites={sites} team={team} defaultDueDate={todayIso} />}
    >
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CalendarCheck2 className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Nothing planned yet — add your first task for today.</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              e.g. Visit PS-2 · Send Invoice · Follow up Sungrow · Prepare Tender
            </p>
            <StatusChip tone={completed === tasks.length ? "success" : "neutral"}>
              {completed}/{tasks.length} done
            </StatusChip>
          </div>
          <div className="flex flex-col gap-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </>
      )}
    </MissionPanel>
  );
}
