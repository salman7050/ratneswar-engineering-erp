import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { AreaChartCard } from "@/components/ui/charts";
import { Muted } from "@/components/ui/typography";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  color,
  deltaPct,
  suffix,
}: {
  label: string;
  value: number;
  trend: { month: string; value: number }[];
  icon: LucideIcon;
  color: string;
  deltaPct?: number;
  suffix?: string;
}) {
  const positive = (deltaPct ?? 0) >= 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${color}1F`, color }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <Muted className="text-xs">{label}</Muted>
        </div>
        {typeof deltaPct === "number" && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[11px] font-semibold",
              positive ? "text-success" : "text-destructive"
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(deltaPct)}%
          </span>
        )}
      </div>
      <p className="tabular font-mono text-2xl font-semibold tracking-tight md:text-[28px]">
        {suffix ? `${value}${suffix}` : formatINR(value)}
      </p>
      <AreaChartCard data={trend} xKey="month" yKey="value" color={color} height={56} minimal />
    </div>
  );
}
