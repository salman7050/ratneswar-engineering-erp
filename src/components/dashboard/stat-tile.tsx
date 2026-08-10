import type { LucideIcon } from "lucide-react";
import { Muted } from "@/components/ui/typography";

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}1F`, color }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="tabular font-mono text-xl font-semibold leading-tight">{value}</p>
        <Muted className="truncate text-[11px]">{label}{sub ? ` · ${sub}` : ""}</Muted>
      </div>
    </div>
  );
}
