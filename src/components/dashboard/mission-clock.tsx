"use client";

import * as React from "react";

export function MissionClock() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="h-[82px] w-56 animate-pulse rounded-xl bg-muted" />;
  }

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  const secondAngle = seconds * 6;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });
  const date = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card/70 px-4 py-3 shadow-sm">
      <div className="relative h-20 w-20 shrink-0 rounded-full border-2 border-border bg-background shadow-inner" aria-label="Live analog clock">
        {[...Array(12)].map((_, index) => (
          <span
            key={index}
            className="absolute left-1/2 top-1/2 h-[2px] w-1 rounded bg-muted-foreground/70"
            style={{ transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-33px)` }}
          />
        ))}
        <span className="absolute left-1/2 top-1/2 h-5 w-[3px] origin-bottom rounded bg-foreground" style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }} />
        <span className="absolute left-1/2 top-1/2 h-7 w-[2px] origin-bottom rounded bg-foreground" style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }} />
        <span className="absolute left-1/2 top-1/2 h-8 w-px origin-bottom bg-destructive" style={{ transform: `translate(-50%, -100%) rotate(${secondAngle}deg)` }} />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive" />
      </div>
      <div className="min-w-[150px] text-left sm:text-right">
        <p className="tabular font-mono text-xl font-semibold leading-none text-foreground">{time}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{date}</p>
        <p className="mt-1 text-[10px] font-semibold text-emerald-600">● Live · IST</p>
      </div>
    </div>
  );
}
