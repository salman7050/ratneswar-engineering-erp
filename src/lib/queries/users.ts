import "server-only";

import { prisma } from "@/lib/prisma";

export async function getUsers() {
  return prisma.user.findMany({
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
}

export type UserListItem = Awaited<ReturnType<typeof getUsers>>[number];
