"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fail, ok, zodError } from "@/lib/actions/action-utils";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
});

export async function updateOwnProfile(input: z.infer<typeof profileSchema>) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone || null },
  });

  const supabase = createClient();
  await supabase.auth.updateUser({ data: { name: parsed.data.name } });
  revalidatePath("/profile");
  revalidatePath("/dashboard", "layout");
  return ok(record);
}

export async function changeOwnPassword(password: string) {
  const user = await getCurrentUser();
  if (!user) return fail("Not signed in.");
  const parsed = z.string().min(8).max(72).safeParse(password);
  if (!parsed.success) return fail("Password must be at least 8 characters.");

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return fail(error.message);
  return ok(undefined);
}
