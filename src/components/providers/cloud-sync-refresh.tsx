"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Shared-cloud refresh channel. Database triggers write a tiny non-sensitive
 * event row to erp_sync_events after any ERP table changes. Supabase Realtime
 * broadcasts only that event table; the client then refreshes Server Components.
 */
export function CloudSyncRefresh() {
  const router = useRouter();

  React.useEffect(() => {
    const supabase = createClient();
    let debounceTimer: number | undefined;
    let lastRefresh = 0;

    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      const wait = Math.max(0, 700 - (now - lastRefresh));
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        lastRefresh = Date.now();
        router.refresh();
      }, wait);
    };

    const channel = supabase
      .channel("ratneswar-erp-cloud-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "erp_sync_events" },
        refresh
      )
      .subscribe();

    // Realtime events are the primary sync path. Refresh when the user returns
    // to the app, but do not force a router.refresh() every 30 seconds; that
    // creates needless database load and can turn transient errors into a full
    // dashboard failure.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
