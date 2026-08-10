import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — Ratneswar ERP",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">You&apos;re offline</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This page hasn&apos;t been cached yet. Reconnect to the internet and try again —
          pages you&apos;ve already visited will keep working offline.
        </p>
      </div>
      <a
        href="/dashboard"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Try again
      </a>
    </div>
  );
}
