import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { withDatabaseRetry } from "@/lib/db-retry";
import type { AppUser, Module, Permission } from "@/types";

function serializeUser(appUser: {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: AppUser["role"];
  avatarUrl: string | null;
  isActive: boolean;
}): AppUser {
  return {
    id: appUser.id,
    authId: appUser.authId,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
    avatarUrl: appUser.avatarUrl,
    isActive: appUser.isActive,
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const appUser = await withDatabaseRetry(
    () => prisma.user.findUnique({ where: { authId: authUser.id } }),
    "current-user"
  );
  if (!appUser || !appUser.isActive || !["ADMIN", "OWNER"].includes(appUser.role)) return null;
  return serializeUser(appUser);
}

/** Distinguishes signed-out users from disabled/missing ERP profiles to avoid redirect loops. */
export async function requireUser(): Promise<AppUser> {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const appUser = await withDatabaseRetry(
    () => prisma.user.findUnique({ where: { authId: authUser.id } }),
    "required-user"
  );
  if (!appUser || !appUser.isActive || !["ADMIN", "OWNER"].includes(appUser.role)) redirect("/account-disabled");
  return serializeUser(appUser);
}

export async function requirePermission(module: Module, permission: Permission): Promise<AppUser> {
  const user = await requireUser();
  if (!can(user.role, module, permission)) redirect("/dashboard?error=forbidden");
  return user;
}
