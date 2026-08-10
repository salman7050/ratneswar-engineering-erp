import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrls } from "@/lib/supabase/storage-server";

export async function getSites() {
  return prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      clientAccount: { select: { id: true, name: true } },
      subcontractor: { select: { id: true, name: true } },
      _count: { select: { employees: true, tenders: true, invoices: true, assets: true, billingContracts: true } },
    },
  });
}

export async function getSiteDetail(id: string) {
  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      clientAccount: true,
      subcontractor: true,
      billingContracts: { include: { client: true, subcontractor: true, lineTemplates: { orderBy: { sortOrder: "asc" } } } },
      photos: { orderBy: { createdAt: "desc" } },
      engineers: { include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } } },
      employees: { orderBy: { name: "asc" } },
      attendance: { orderBy: { date: "desc" }, take: 60, include: { employee: { select: { name: true } } } },
      expenses: { orderBy: { date: "desc" }, take: 50 },
      documents: { orderBy: { createdAt: "desc" } },
      insurances: { orderBy: { endDate: "asc" } },
      amcs: { orderBy: { endDate: "asc" } },
      warranties: { orderBy: { endDate: "asc" } },
      maintenance: { orderBy: { date: "desc" } },
      breakdowns: { orderBy: { reportedAt: "desc" } },
      timeline: { orderBy: { eventDate: "desc" }, include: { createdBy: { select: { name: true } } } },
      materials: { orderBy: { receivedDate: "desc" } },
      inventory: { orderBy: { name: "asc" } },
      assets: { orderBy: { name: "asc" } },
    },
  });

  if (!site) return null;

  // Prisma's Decimal is a class instance and cannot cross the Server →
  // Client Component boundary — convert every Decimal field to a plain
  // number here, once, so every panel downstream just deals with numbers.
  const documents = await resolveStoredFileUrls(site.documents);

  return {
    ...site,
    documents,
    billingContracts: site.billingContracts.map((contract) => ({
      ...contract,
      lineTemplates: contract.lineTemplates.map((line) => ({
        ...line,
        quantity: Number(line.quantity),
        rate: Number(line.rate),
        gstPercent: Number(line.gstPercent),
      })),
    })),
    expenses: site.expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
    insurances: site.insurances.map((i) => ({ ...i, coverageAmount: Number(i.coverageAmount) })),
    amcs: site.amcs.map((a) => ({ ...a, amount: Number(a.amount) })),
    maintenance: site.maintenance.map((m) => ({ ...m, cost: m.cost === null ? null : Number(m.cost) })),
    breakdowns: site.breakdowns.map((b) => ({
      ...b,
      downtimeHours: b.downtimeHours === null ? null : Number(b.downtimeHours),
    })),
    materials: site.materials.map((m) => ({
      ...m,
      quantity: Number(m.quantity),
      ratePerUnit: Number(m.ratePerUnit),
    })),
    inventory: site.inventory.map((i) => ({
      ...i,
      quantity: Number(i.quantity),
      minThreshold: i.minThreshold === null ? null : Number(i.minThreshold),
    })),
    assets: site.assets.map((a) => ({
      ...a,
      purchaseValue: a.purchaseValue === null ? null : Number(a.purchaseValue),
    })),
  };
}

export async function getAssignableUsers() {
  return prisma.user.findMany({
    where: { isActive: true, role: { in: ["ADMIN", "OWNER"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

export type SiteDetail = NonNullable<Awaited<ReturnType<typeof getSiteDetail>>>;
export type SiteListItem = Awaited<ReturnType<typeof getSites>>[number];


export async function getSiteMasterOptions() {
  const [clients, subcontractors] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.subcontractor.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { clients, subcontractors };
}
