import "server-only";

import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/types";

/**
 * ERP access is intentionally limited to OWNER and ADMIN.
 * The Prisma Role enum still contains legacy employee roles for old data,
 * so we filter them out here and narrow the returned role for the UI.
 */
export async function getUsers() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "ADMIN"] } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      authId: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          assignedTasks: true,
          createdInvoices: true,
          createdQuotations: true,
        },
      },
    },
  });

  return users.map((user) => ({
    ...user,
    role: user.role as Extract<AppRole, "OWNER" | "ADMIN">,
  }));
}

export type UserListItem = Awaited<ReturnType<typeof getUsers>>[number];
