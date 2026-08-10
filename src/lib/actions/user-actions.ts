"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";
import { createAdminClient } from "@/lib/supabase/server";

const roles = ["ADMIN", "OWNER"] as const;

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().nullable(),
  role: z.enum(roles),
  password: z.string().min(8).max(72),
});

export async function createAppUser(input: z.infer<typeof createUserSchema>) {
  const { user, error } = await authorize("users", "create");
  if (!user) return error;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return fail("A user with this email already exists.");

  const supabase = createAdminClient();
  const { data, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { name: parsed.data.name },
  });

  if (authError || !data.user) return fail(authError?.message ?? "Could not create authentication user.");

  try {
    const record = await prisma.user.upsert({
      where: { authId: data.user.id },
      update: {
        email,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        isActive: true,
      },
      create: {
        authId: data.user.id,
        email,
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "USER_CREATED",
        entityType: "User",
        entityId: record.id,
        userId: user.id,
        metadata: { email, role: parsed.data.role },
      },
    });

    revalidatePath("/users");
    return ok(record);
  } catch (databaseError) {
    // The Auth trigger may already have created a public.users profile. Remove
    // both sides so a failed creation does not leave an orphan that blocks retry.
    await prisma.user.deleteMany({ where: { authId: data.user.id } }).catch(() => undefined);
    await supabase.auth.admin.deleteUser(data.user.id).catch(() => undefined);
    return fail(databaseError instanceof Error ? databaseError.message : "Could not create user profile.");
  }
}

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  role: z.enum(roles),
  isActive: z.boolean(),
});

export async function updateAppUser(id: string, input: z.infer<typeof updateUserSchema>) {
  const { user, error } = await authorize("users", "edit");
  if (!user) return error;

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  if (id === user.id && !parsed.data.isActive) return fail("You cannot deactivate your own account.");
  if (id === user.id && parsed.data.role !== user.role) return fail("You cannot change your own access role. Use the other Owner/Admin account if a role change is required.");

  const current = await prisma.user.findUnique({ where: { id }, select: { authId: true } });
  if (!current) return fail("User not found.");

  const record = await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    },
  });

  const supabase = createAdminClient();
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(current.authId, {
    user_metadata: { name: parsed.data.name },
  });
  if (authUpdateError) return fail(authUpdateError.message);

  await prisma.auditLog.create({
    data: {
      action: "USER_UPDATED",
      entityType: "User",
      entityId: id,
      userId: user.id,
      metadata: { role: parsed.data.role, isActive: parsed.data.isActive },
    },
  });

  revalidatePath("/users");
  return ok(record);
}

export async function resetUserPassword(id: string, password: string) {
  const { user, error } = await authorize("users", "edit");
  if (!user) return error;

  const parsed = z.string().min(8).max(72).safeParse(password);
  if (!parsed.success) return fail("Password must be at least 8 characters.");

  const target = await prisma.user.findUnique({ where: { id }, select: { authId: true } });
  if (!target) return fail("User not found.");

  const supabase = createAdminClient();
  const { error: updateError } = await supabase.auth.admin.updateUserById(target.authId, { password: parsed.data });
  if (updateError) return fail(updateError.message);

  await prisma.auditLog.create({
    data: { action: "USER_PASSWORD_RESET", entityType: "User", entityId: id, userId: user.id },
  });

  return ok(undefined);
}
