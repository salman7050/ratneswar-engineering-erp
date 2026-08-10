import { History } from "lucide-react";
import { Muted } from "@/components/ui/typography";

function relativeTime(iso: string | Date): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function HistoryPanel({
  entries,
}: {
  entries: { id: string; action: string; createdAt: Date | string; user: { name: string } | null }[];
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <History className="h-6 w-6 text-muted-foreground/40" />
        <Muted className="text-xs">No history yet — actions on this document will show up here.</Muted>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
          <span className="text-xs">
            <span className="font-medium">{e.user?.name ?? "System"}</span>{" "}
            <span className="text-muted-foreground">{e.action.toLowerCase().replace(/_/g, " ")}</span>
          </span>
          <Muted className="text-[11px]">{relativeTime(e.createdAt)}</Muted>
        </li>
      ))}
    </ul>
  );
}
