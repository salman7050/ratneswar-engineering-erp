"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Swap for real error reporting (Sentry, etc.) when available.
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
      <section className="erp-glass-surface flex w-full max-w-lg flex-col items-center gap-4 rounded-3xl p-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">Something went wrong</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          The connection was interrupted while loading this section. Your data is safe—try the request again.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Go to dashboard
        </Button>
        <Button onClick={() => reset()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </div>
      {error.digest && <p className="font-mono text-[10px] text-slate-400">Reference: {error.digest}</p>}
      </section>
    </div>
  );
}
