import "server-only";
import { prisma } from "@/lib/prisma";

export async function getEntityHistory(entityType: string, entityId: string) {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
}
