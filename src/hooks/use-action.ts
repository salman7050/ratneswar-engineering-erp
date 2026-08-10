"use client";

import * as React from "react";
import { toast } from "@/lib/toast";
import type { ActionResult } from "@/lib/actions/action-utils";

/**
 * Lightweight client wrapper for server actions. It deliberately accepts any
 * ActionResult payload because several shared forms choose between two actions
 * at runtime (Client/Subcontractor, etc.) whose Prisma return models differ.
 */
export function useAction<TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<ActionResult<any>>,
  opts?: { successMessage?: string; onSuccess?: (data: any) => void }
) {
  const [loading, setLoading] = React.useState(false);

  async function run(...args: TArgs): Promise<any | undefined> {
    setLoading(true);
    try {
      const result = await action(...args);
      if (result.ok) {
        if (opts?.successMessage) toast.success(opts.successMessage);
        opts?.onSuccess?.(result.data);
        return result.data;
      }

      toast.error("Couldn't save that", result.error);
      return undefined;
    } catch (e) {
      toast.error("Something went wrong", e instanceof Error ? e.message : undefined);
      return undefined;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading };
}
