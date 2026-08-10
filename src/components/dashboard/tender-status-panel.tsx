import { FileSignature } from "lucide-react";
import { DonutChart, CHART_COLORS } from "@/components/ui/charts";
import { Muted } from "@/components/ui/typography";

const COLORS = [CHART_COLORS.gold, CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.red, CHART_COLORS.violet];

export function TenderStatusPanel({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <FileSignature className="h-6 w-6 text-muted-foreground/50" />
        <Muted className="text-xs">No tenders logged yet.</Muted>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <DonutChart data={data} nameKey="name" valueKey="count" height={160} className="max-w-[160px]" />
      <div className="flex flex-1 flex-col gap-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {d.name}
            </span>
            <span className="tabular font-mono font-semibold">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
