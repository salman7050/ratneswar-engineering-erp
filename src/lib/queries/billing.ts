import "server-only";
import { prisma } from "@/lib/prisma";

const num = (value: unknown) => Number(value ?? 0);

export async function getBillingCenterData() {
  const [clients, subcontractors, sites, contracts, recentInvoices] = await Promise.all([
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.subcontractor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.site.findMany({
      orderBy: [{ ownership: "asc" }, { name: "asc" }],
      include: {
        clientAccount: true,
        subcontractor: true,
        _count: { select: { billingContracts: true, invoices: true } },
      },
    }),
    prisma.billingContract.findMany({
      where: { active: true },
      orderBy: [{ site: { name: "asc" } }, { title: "asc" }],
      include: {
        site: { select: { id: true, siteCode: true, name: true, ownership: true, location: true } },
        client: true,
        subcontractor: true,
        lineTemplates: { where: { active: true }, orderBy: { sortOrder: "asc" } },
        invoices: { orderBy: { date: "desc" }, take: 6, select: { id: true, invoiceNo: true, billingMonth: true, date: true, grandTotal: true, status: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { invoiceType: { in: ["MONTHLY_SITE", "SUBCONTRACT"] } },
      orderBy: { date: "desc" },
      take: 12,
      include: { site: { select: { name: true, siteCode: true } } },
    }),
  ]);

  const serializedContracts = contracts.map((contract) => ({
    ...contract,
    lineTemplates: contract.lineTemplates.map((line) => ({
      ...line,
      quantity: num(line.quantity),
      rate: num(line.rate),
      gstPercent: num(line.gstPercent),
    })),
    invoices: contract.invoices.map((invoice) => ({ ...invoice, grandTotal: num(invoice.grandTotal) })),
  }));

  return {
    clients,
    subcontractors,
    sites,
    contracts: serializedContracts,
    recentInvoices: recentInvoices.map((invoice) => ({ ...invoice, grandTotal: num(invoice.grandTotal) })),
    summary: {
      directSites: sites.filter((site) => site.ownership === "DIRECT").length,
      subcontractSites: sites.filter((site) => site.ownership === "SUBCONTRACT").length,
      monthlyContracts: contracts.length,
      uninvoicedThisMonth: contracts.filter((contract) => {
        const month = new Date().toISOString().slice(0, 7);
        return !contract.invoices.some((invoice) => invoice.billingMonth === month);
      }).length,
    },
  };
}

export type BillingCenterData = Awaited<ReturnType<typeof getBillingCenterData>>;
