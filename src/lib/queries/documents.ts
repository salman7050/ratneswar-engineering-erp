import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrls } from "@/lib/supabase/storage-server";

export async function getAllDocuments() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      site: { select: { name: true } },
      tender: { select: { name: true } },
      employee: { select: { name: true } },
      uploadedBy: { select: { name: true } },
    },
  });
  return resolveStoredFileUrls(documents);
}

export async function getExpiringDocuments() {
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const documents = await prisma.document.findMany({
    where: { expiryDate: { not: null, lte: in30Days } },
    orderBy: { expiryDate: "asc" },
    include: { site: { select: { name: true } }, tender: { select: { name: true } }, employee: { select: { name: true } }, uploadedBy: { select: { name: true } } },
  });
  return resolveStoredFileUrls(documents);
}

export async function getCategoryCounts() {
  const counts = await prisma.document.groupBy({ by: ["category"], _count: { _all: true } });
  const acc: Record<string, number> = {};
  for (const c of counts) acc[c.category] = c._count._all;
  return acc;
}

export type DocumentListItem = Awaited<ReturnType<typeof getAllDocuments>>[number];
