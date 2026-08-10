import { TrendingUp } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { Progress } from "@/components/ui/progress";

interface Productivity {
  today: { total: number; completed: number; pending: number; overdue: number; completionPct: number };
  week: { completed: number; total: number };
  month: { completed: number; total: number };
}

export function ProductivityScorePanel({ productivity }: { productivity: Productivity }) {
  const weekPct = productivity.week.total > 0 ? Math.round((productivity.week.completed / productivity.week.total) * 100) : 0;
  const monthPct = productivity.month.total > 0 ? Math.round((productivity.month.completed / productivity.month.total) * 100) : 0;

  return (
    <MissionPanel title="Productivity Score" tint="green" action={<TrendingUp className="h-4 w-4 text-success" />}>
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="9" className="text-secondary" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round"
              className="text-success transition-all duration-700"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - productivity.today.completionPct / 100)}
            />
          </svg>
          <span className="absolute text-2xl font-semibold tabular">{productivity.today.completionPct}%</span>
        </div>
        <p className="text-xs text-muted-foreground">Today&apos;s completion</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
        <Stat label="Completed" value={productivity.today.completed} tone="text-success" />
        <Stat label="Pending" value={productivity.today.pending} />
        <Stat label="Overdue" value={productivity.today.overdue} tone={productivity.today.overdue > 0 ? "text-destructive" : undefined} />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>This week</span>
            <span className="tabular">{productivity.week.completed}/{productivity.week.total}</span>
          </div>
          <Progress value={weekPct} className="h-1.5" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>This month</span>
            <span className="tabular">{productivity.month.completed}/{productivity.month.total}</span>
          </div>
          <Progress value={monthPct} className="h-1.5" />
        </div>
      </div>
    </MissionPanel>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <p className={`text-lg font-semibold tabular ${tone ?? ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
