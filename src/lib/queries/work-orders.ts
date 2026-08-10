import "server-only";
import { prisma } from "@/lib/prisma";
import { documentNumberPreview } from "@/lib/document-number";

export async function getWorkOrders() {
  const wos = await prisma.workOrder.findMany({
    orderBy: { date: "desc" },
    include: { site: { select: { name: true } } },
  });
  return wos.map((w) => ({ ...w, value: Number(w.value) }));
}

export async function getWorkOrderDetail(id: string) {
  const wo = await prisma.workOrder.findUnique({ where: { id }, include: { site: { select: { name: true } } } });
  if (!wo) return null;
  return { ...wo, value: Number(wo.value) };
}

export async function suggestNextWONumber(): Promise<string> {
  return documentNumberPreview("WORK_ORDER");
}

export type WorkOrderDetail = NonNullable<Awaited<ReturnType<typeof getWorkOrderDetail>>>;
export type WorkOrderListItem = Awaited<ReturnType<typeof getWorkOrders>>[number];
