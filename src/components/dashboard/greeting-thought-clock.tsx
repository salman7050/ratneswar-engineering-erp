"use client";

import * as React from "react";
import { Quote } from "lucide-react";
import { LiveClockCard } from "@/components/dashboard/live-clock-card";

const THOUGHTS = [
  "Small progress every day builds big results.",
  "Consistency turns ordinary work into extraordinary results.",
  "Do the important work first; the rest becomes easier.",
  "Quality is remembered long after speed is forgotten.",
  "Clear priorities create calm execution.",
  "A good system makes good work repeatable.",
  "Finish what matters, then improve what remains.",
  "Strong teams communicate early and execute clearly.",
  "Discipline today creates freedom tomorrow.",
  "Reliable work builds reliable relationships.",
  "One completed task is worth more than ten intentions.",
  "Measure twice, execute once, review always.",
];

function greeting(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function thoughtFor(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return THOUGHTS[Math.abs(day) % THOUGHTS.length];
}

export function GreetingThoughtClock({ name }: { name: string }) {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const firstName = name.trim().split(/\s+/)[0] || name;
  const title = now ? greeting(now.getHours()) : "Welcome";
  const thought = now ? thoughtFor(now) : THOUGHTS[0];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_.72fr_.78fr]">
      <section className="flex min-h-[154px] flex-col justify-center rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
          {title}, {firstName} <span aria-hidden>👋</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">Here&apos;s what needs your attention today.</p>
      </section>

      <section className="flex min-h-[154px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Quote className="h-5 w-5 text-emerald-600" /> Thought of the Day
        </div>
        <p className="mt-4 max-w-[310px] text-[15px] font-medium leading-6 text-slate-700">{thought}</p>
        <span className="mt-4 h-0.5 w-8 rounded bg-emerald-500" />
      </section>

      <LiveClockCard />
    </div>
  );
}
