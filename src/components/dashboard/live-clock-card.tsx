"use client";

import * as React from "react";

export function LiveClockCard() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!now) return <div className="erp-glass-surface h-[154px] animate-pulse rounded-2xl" />;

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  const secondAngle = seconds * 6;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const date = now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  const numbers = [12, 3, 6, 9] as const;
  const positions: Record<number, string> = {
    12: "left-1/2 top-[8px] -translate-x-1/2",
    3: "right-[8px] top-1/2 -translate-y-1/2",
    6: "bottom-[6px] left-1/2 -translate-x-1/2",
    9: "left-[8px] top-1/2 -translate-y-1/2",
  };

  return (
    <section className="erp-glass-surface flex min-h-[154px] items-center gap-5 rounded-2xl px-5 py-4">
      <div className="relative h-[116px] w-[116px] shrink-0 rounded-full border-2 border-slate-300 bg-[#fbfbfa] shadow-[inset_0_0_0_4px_rgba(15,23,42,.025),0_7px_22px_rgba(15,23,42,.08)]" aria-label="Live analog clock">
        {[...Array(60)].map((_, index) => {
          const major = index % 5 === 0;
          return (
            <span
              key={index}
              className={`absolute left-1/2 top-1/2 rounded-full ${major ? "h-[2px] w-[7px] bg-slate-500" : "h-px w-[3px] bg-slate-300"}`}
              style={{ transform: `translate(-50%, -50%) rotate(${index * 6}deg) translateY(-51px)` }}
            />
          );
        })}
        {numbers.map((n) => <span key={n} className={`absolute z-10 text-[11px] font-semibold text-slate-600 ${positions[n]}`}>{n}</span>)}
        <span className="absolute left-1/2 top-1/2 z-20 h-[29px] w-[3px] origin-bottom rounded-full bg-slate-800" style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }} />
        <span className="absolute left-1/2 top-1/2 z-20 h-[40px] w-[2px] origin-bottom rounded-full bg-slate-900" style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }} />
        <span className="absolute left-1/2 top-1/2 z-20 h-[43px] w-px origin-bottom bg-rose-500" style={{ transform: `translate(-50%, -100%) rotate(${secondAngle}deg)` }} />
        <span className="absolute left-1/2 top-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow-sm" />
      </div>
      <div className="min-w-0">
        <p className="whitespace-nowrap font-mono text-[25px] font-bold tracking-tight text-slate-950">{time}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{date}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Live</p>
      </div>
    </section>
  );
}
