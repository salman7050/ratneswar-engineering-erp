import { CalendarDays, MapPinned, Users2, ListChecks } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { MissionClock } from "@/components/dashboard/mission-clock";
import { WeatherWidget } from "@/components/dashboard/weather-widget";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function GoodMorningPanel({
  name,
  todayTaskCount,
  meetingCount,
  siteVisitCount,
  overdueCount,
}: {
  name: string;
  todayTaskCount: number;
  meetingCount: number;
  siteVisitCount: number;
  overdueCount: number;
}) {
  const firstName = name.split(" ")[0];

  return (
    <MissionPanel tint="gold" live className="overflow-visible">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-light">
            {greeting()}, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Here&apos;s your day at a glance
          </h1>
          <div className="mt-3">
            <WeatherWidget />
          </div>
        </div>
        <MissionClock />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
        <SummaryStat icon={ListChecks} label="Today's tasks" value={todayTaskCount} />
        <SummaryStat icon={CalendarDays} label="Meetings" value={meetingCount} />
        <SummaryStat icon={MapPinned} label="Site visits" value={siteVisitCount} />
        <SummaryStat icon={Users2} label="Overdue" value={overdueCount} tone={overdueCount > 0 ? "text-destructive" : undefined} />
      </div>
    </MissionPanel>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
        <Icon className={`h-4 w-4 ${tone ?? "text-muted-foreground"}`} />
      </div>
      <div>
        <p className={`text-lg font-semibold leading-none tabular ${tone ?? ""}`}>{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
