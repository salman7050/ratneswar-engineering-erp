import "server-only";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import type { Module, Permission } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T): ActionResult<T> {
  // Server Action results must cross the React serialization boundary. Prisma
  // Decimal instances are not directly serializable, so normalize action data
  // to JSON-safe values before returning it to a Client Component.
  if (data === undefined || data === null) return { ok: true, data };
  return { ok: true, data: JSON.parse(JSON.stringify(data)) as T };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/** Resolves the current user and checks RBAC — returns a failure result instead of redirecting, since actions are called via fetch, not page navigation. */
export async function authorize(module: Module, permission: Permission) {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: fail("Not signed in.") } as const;
  if (!can(user.role, module, permission)) {
    return { user: null, error: fail("You don't have permission to do this.") } as const;
  }
  return { user, error: null } as const;
}

export function zodError(e: z.ZodError): ActionResult<never> {
  const first = e.issues[0];
  return fail(first ? `${first.path.join(".")}: ${first.message}` : "Invalid input.");
}
