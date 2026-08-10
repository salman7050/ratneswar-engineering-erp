"use client";

import * as React from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MissionCalendar({ highlightDates = [] }: { highlightDates?: string[] }) {
  const [today, setToday] = React.useState<Date | null>(null);

  React.useEffect(() => setToday(new Date()), []);

  const highlightSet = React.useMemo(
    () => new Set(highlightDates.map((d) => new Date(d).toDateString())),
    [highlightDates]
  );

  if (!today) return <div className="h-52 animate-pulse rounded-lg bg-muted" />;

  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = today.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[10px] font-medium text-muted-foreground">{w}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={i} />;
          const cellDate = new Date(year, month, day);
          const isToday = cellDate.toDateString() === today.toDateString();
          const isHighlighted = highlightSet.has(cellDate.toDateString());
          return (
            <span
              key={i}
              className={
                "flex h-7 w-7 items-center justify-center rounded-full text-xs tabular font-mono transition-colors " +
                (isToday
                  ? "bg-gradient-to-br from-brand-gold-light to-brand-gold font-bold text-brand-navy shadow-glow-gold"
                  : isHighlighted
                    ? "border border-warning/50 text-warning"
                    : "text-foreground/80")
              }
            >
              {day}
            </span>
          );
        })}
      </div>
      {highlightDates.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2 w-2 rounded-full border border-warning/60" /> EMD deadline this week
        </p>
      )}
    </div>
  );
}
