import {
  FileSignature, Receipt, Wallet, FolderOpen, Users, Activity as ActivityIcon,
} from "lucide-react";
import { Muted } from "@/components/ui/typography";

const ENTITY_ICON: Record<string, typeof ActivityIcon> = {
  Tender: FileSignature,
  Invoice: Receipt,
  Expense: Wallet,
  Document: FolderOpen,
  Employee: Users,
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityFeed({
  activities,
}: {
  activities: { id: string; action: string; entityType: string; userName: string; createdAt: string }[];
}) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <ActivityIcon className="h-6 w-6 text-muted-foreground/50" />
        <Muted className="text-xs">No activity logged yet — actions across the ERP will stream here.</Muted>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {activities.map((a) => {
        const Icon = ENTITY_ICON[a.entityType] ?? ActivityIcon;
        return (
          <li key={a.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-foreground/90">
                <span className="font-medium">{a.userName}</span>{" "}
                <span className="text-muted-foreground">{a.action.toLowerCase().replace(/_/g, " ")}</span>
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{relativeTime(a.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
