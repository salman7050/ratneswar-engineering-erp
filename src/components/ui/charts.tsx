"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";

export type ChartPoint = Record<string, string | number>;

const CHART_COLORS = {
  gold: "#C6A15B",
  goldLight: "#E4C888",
  blue: "#5896FF",
  green: "#34D399",
  red: "#F87171",
  violet: "#A78BFA",
};

/** Glass tooltip shared by every chart in the system. */
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border-white/10 px-3 py-2 text-xs shadow-soft-md">
      {label !== undefined && (
        <p className="mb-1 font-medium text-muted-foreground">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-foreground/80">{p.name}</span>
            <span className="tabular font-mono font-semibold">{p.value?.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const axisTickStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

export function AreaChartCard({
  data,
  xKey,
  yKey,
  color = CHART_COLORS.gold,
  height = 240,
  className,
  minimal = false,
}: {
  data: ChartPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  className?: string;
  minimal?: boolean;
}) {
  const gradientId = React.useId();
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={minimal ? { top: 2, right: 0, left: 0, bottom: 0 } : { top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {!minimal && <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 6" />}
          {!minimal && <XAxis dataKey={xKey} tick={axisTickStyle} axisLine={false} tickLine={false} />}
          {!minimal && <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={40} />}
          {!minimal && <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />}
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={minimal ? false : { r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartCard({
  data,
  xKey,
  yKey,
  color = CHART_COLORS.blue,
  height = 240,
  className,
}: {
  data: ChartPoint[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  className?: string;
}) {
  const gradientId = React.useId();
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 6" />
          <XAxis dataKey={xKey} tick={axisTickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisTickStyle} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--foreground) / 0.04)" }} />
          <Bar dataKey={yKey} fill={`url(#${gradientId})`} radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  nameKey,
  valueKey,
  colors = [CHART_COLORS.gold, CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.violet, CHART_COLORS.red],
  height = 220,
  className,
}: {
  data: ChartPoint[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={3}
            stroke="hsl(var(--background))"
            strokeWidth={3}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export { CHART_COLORS };
