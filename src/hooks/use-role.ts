"use client";

import { useUser } from "@/components/providers/supabase-provider";
import { can } from "@/lib/rbac";
import type { Module, Permission } from "@/types";

/**
 * usePermission("invoices", "create") → boolean
 * Returns false while the user is unresolved, so gated UI defaults to hidden.
 */
export function usePermission(module: Module, permission: Permission): boolean {
  const user = useUser();
  if (!user) return false;
  return can(user.role, module, permission);
}

export function useRole() {
  const user = useUser();
  return user?.role ?? null;
}
