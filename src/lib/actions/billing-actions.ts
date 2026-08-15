"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";
import { generateDocumentNumber } from "@/lib/document-number";

const partySchema = z.object({
  code: z.string().max(30).optional().nullable(),
  name: z.string().min(2),
  legalName: z.string().max(200).optional().nullable(),
  gstin: z.string().max(20).optional().nullable(),
  pan: z.string().max(15).optional().nullable(),
  address: z.string().max(600).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(30).optional().nullable(),
  contactPerson: z.string().max(150).optional().nullable(),
  bankName: z.string().max(150).optional().nullable(),
  accountNo: z.string().max(50).optional().nullable(),
  ifsc: z.string().max(30).optional().nullable(),
  branch: z.string().max(150).optional().nullable(),
});

const lineSchema = z.object({
  category: z.enum(["O_AND_M", "MAINTENANCE", "TESTING", "INSTALLATION", "MATERIAL", "OTHER"]).default("O_AND_M"),
  description: z.string().min(2),
  testingDescription: z.string().max(1000).optional().nullable(),
  hsnCode: z.string().min(1).default("998717"),
  unit: z.string().min(1).default("Month"),
  quantity: z.coerce.number().positive().default(1),
  rate: z.coerce.number().nonnegative(),
  gstPercent: z.coerce.number().min(0).max(100).default(18),
});

const contractSchema = z.object({
  contractNo: z.string().max(100).optional().nullable(),
  title: z.string().min(2),
  siteId: z.string().min(1),
  billToType: z.enum(["CLIENT", "SUBCONTRACTOR"]),
  clientId: z.string().optional().nullable(),
  subcontractorId: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  paymentTerms: z.string().max(300).optional().nullable(),
  creditDays: z.coerce.number().int().min(0).max(365).default(30),
  cycleStartDay: z.coerce.number().int().min(1).max(28).default(1),
  destination: z.string().max(300).optional().nullable(),
  tenderNo: z.string().max(200).optional().nullable(),
  buyerOrderNo: z.string().max(250).optional().nullable(),
  buyerOrderDate: z.coerce.date().optional().nullable(),
  gstType: z.enum(["SGST_CGST", "IGST"]).default("SGST_CGST"),
  notes: z.string().max(2000).optional().nullable(),
  lines: z.array(lineSchema).min(1),
});

const monthlyInvoiceSchema = z.object({
  contractId: z.string().min(1),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/),
  date: z.coerce.date(),
  lines: z.array(lineSchema).min(1),
});

function clean<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) if (value === "") (result as Record<string, unknown>)[key] = null;
  return result;
}

export async function createClient(input: z.infer<typeof partySchema>) {
  const { user, error } = await authorize("billing", "create");
  if (!user) return error;
  const parsed = partySchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const { bankName, accountNo, ifsc, branch, ...clientData } = parsed.data;
  const client = await prisma.client.create({ data: clean({ ...clientData, state: "Gujarat", stateCode: "24" }) });
  await prisma.auditLog.create({ data: { action: "CLIENT_CREATED", entityType: "Client", entityId: client.id, userId: user.id } });
  revalidatePath("/billing");
  return ok(client);
}

export async function createSubcontractor(input: z.infer<typeof partySchema>) {
  const { user, error } = await authorize("billing", "create");
  if (!user) return error;
  const parsed = partySchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const party = await prisma.subcontractor.create({ data: clean(parsed.data) });
  await prisma.auditLog.create({ data: { action: "SUBCONTRACTOR_CREATED", entityType: "Subcontractor", entityId: party.id, userId: user.id } });
  revalidatePath("/billing");
  return ok(party);
}

export async function createBillingContract(input: z.infer<typeof contractSchema>) {
  const { user, error } = await authorize("billing", "create");
  if (!user) return error;
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const { lines, ...data } = parsed.data;
  const site = await prisma.site.findUnique({ where: { id: data.siteId } });
  if (!site) return fail("Site not found.");
  const buyerClientId = data.clientId || site.clientId;
  const issuerId = site.ownership === "SUBCONTRACT" ? (data.subcontractorId || site.subcontractorId) : null;
  if (!buyerClientId) return fail("Select the actual client / buyer for this site.");
  if (site.ownership === "SUBCONTRACT" && !issuerId) return fail("Select the legal billing issuer (Vikas / Ascent / other subcontractor) for this site.");

  const contract = await prisma.billingContract.create({
    data: {
      ...clean(data),
      billToType: "CLIENT",
      clientId: buyerClientId,
      subcontractorId: issuerId,
      lineTemplates: { create: lines.map((line, index) => ({ ...clean(line), sortOrder: index })) },
    },
  });
  await prisma.site.update({
    where: { id: data.siteId },
    data: { monthlyBillingEnabled: true, billingMode: "MONTHLY" },
  });
  await prisma.auditLog.create({ data: { action: "BILLING_CONTRACT_CREATED", entityType: "BillingContract", entityId: contract.id, userId: user.id } });
  revalidatePath("/billing");
  revalidatePath("/sites");
  return ok(contract);
}

export async function updateBillingContract(id: string, input: z.infer<typeof contractSchema>) {
  const { user, error } = await authorize("billing", "edit");
  if (!user) return error;
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const { lines, ...data } = parsed.data;
  const site = await prisma.site.findUnique({ where: { id: data.siteId } });
  if (!site) return fail("Site not found.");
  const buyerClientId = data.clientId || site.clientId;
  const issuerId = site.ownership === "SUBCONTRACT" ? (data.subcontractorId || site.subcontractorId) : null;
  if (!buyerClientId) return fail("Select the actual client / buyer for this site.");
  if (site.ownership === "SUBCONTRACT" && !issuerId) return fail("Select the legal billing issuer for this subcontract site.");
  const contract = await prisma.$transaction(async (tx) => {
    await tx.billingLineTemplate.deleteMany({ where: { billingContractId: id } });
    return tx.billingContract.update({
      where: { id },
      data: {
        ...clean(data),
        billToType: "CLIENT",
        clientId: buyerClientId,
        subcontractorId: issuerId,
        lineTemplates: { create: lines.map((line, index) => ({ ...clean(line), sortOrder: index })) },
      },
    });
  });
  await prisma.auditLog.create({ data: { action: "BILLING_CONTRACT_UPDATED", entityType: "BillingContract", entityId: id, userId: user.id } });
  revalidatePath("/billing");
  return ok(contract);
}

function monthRange(month: string, cycleStartDay = 1) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    throw new Error("Billing month must use YYYY-MM format.");
  }
  const pad = (value: number) => String(value).padStart(2, "0");
  const nextMonthDate = new Date(Date.UTC(year, monthNumber, 1));
  const nextYear = nextMonthDate.getUTCFullYear();
  const nextMonth = nextMonthDate.getUTCMonth() + 1;
  const endDay = cycleStartDay === 1
    ? new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
    : cycleStartDay - 1;
  const endYear = cycleStartDay === 1 ? year : nextYear;
  const endMonth = cycleStartDay === 1 ? monthNumber : nextMonth;
  const start = new Date(`${year}-${pad(monthNumber)}-${pad(cycleStartDay)}T00:00:00+05:30`);
  const end = new Date(`${endYear}-${pad(endMonth)}-${pad(endDay)}T23:59:59.999+05:30`);
  return { start, end };
}

export async function generateMonthlyInvoice(input: z.infer<typeof monthlyInvoiceSchema>) {
  const { user, error } = await authorize("billing", "create");
  if (!user) return error;
  const parsed = monthlyInvoiceSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const contract = await prisma.billingContract.findUnique({
    where: { id: parsed.data.contractId },
    include: { site: { include: { clientAccount: true, subcontractor: true } }, client: true, subcontractor: true },
  });
  if (!contract || !contract.active) return fail("Billing contract not found or inactive.");

  // Buyer is always the actual client/customer. For subcontract SSNNL sites,
  // the subcontractor is the legal invoice issuer, never the buyer.
  const buyer = contract.client ?? contract.site.clientAccount;
  if (!buyer) return fail("The client / buyer is missing from this billing contract or site.");
  const issuer = contract.site.ownership === "SUBCONTRACT" ? (contract.subcontractor ?? contract.site.subcontractor) : null;
  if (contract.site.ownership === "SUBCONTRACT" && !issuer) return fail("The legal billing issuer is missing for this subcontract site.");

  const existing = await prisma.invoice.findFirst({ where: { billingContractId: contract.id, billingMonth: parsed.data.billingMonth } });
  if (existing) return fail(`Invoice ${existing.invoiceNo} already exists for ${parsed.data.billingMonth}.`);

  const computed = parsed.data.lines.map((line, index) => {
    const amount = Math.round(line.quantity * line.rate * 100) / 100;
    const taxAmount = Math.round(amount * line.gstPercent) / 100;
    return { ...line, sortOrder: index, amount, taxAmount };
  });
  const taxableValue = Math.round(computed.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
  const taxAmount = Math.round(computed.reduce((sum, line) => sum + line.taxAmount, 0) * 100) / 100;
  const grandTotal = Math.round((taxableValue + taxAmount) * 100) / 100;
  const { start, end } = monthRange(parsed.data.billingMonth, contract.cycleStartDay);
  const defaultBank = issuer ? null : await prisma.bankAccount.findFirst({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  const dueDate = new Date(parsed.data.date);
  dueDate.setDate(dueDate.getDate() + contract.creditDays);

  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNo = await generateDocumentNumber("INVOICE", parsed.data.date, tx);
    return tx.invoice.create({
      data: {
        invoiceNo,
        date: parsed.data.date,
        dueDate,
        invoiceType: issuer ? "SUBCONTRACT" : "MONTHLY_SITE",
        billingMonth: parsed.data.billingMonth,
        periodFrom: start,
        periodTo: end,
        buyerName: buyer.legalName || buyer.name,
        buyerAddress: buyer.address,
        buyerGstin: buyer.gstin,
        buyerPan: buyer.pan,
        placeOfSupply: "Gujarat",
        referenceNo: contract.contractNo,
        referenceDate: contract.startDate,
        poRefNo: contract.buyerOrderNo,
        buyerOrderDate: contract.buyerOrderDate,
        destination: contract.destination || contract.site.defaultDestination || contract.site.name,
        tenderNo: contract.tenderNo || contract.site.defaultTenderNo,
        dispatchThrough: "Service / Site Execution",
        paymentTerms: contract.paymentTerms || contract.site.defaultPaymentTerms || `Within ${contract.creditDays} Days`,
        termsOfDelivery: `Monthly services for ${contract.site.name} as per approved scope and contract.`,
        remarks: contract.notes,
        gstType: contract.gstType,
        taxableValue,
        taxAmount,
        grandTotal,
        status: "GENERATED",
        siteId: contract.siteId,
        clientId: buyer.id,
        subcontractorId: issuer?.id ?? null,
        billingContractId: contract.id,
        bankAccountId: defaultBank?.id ?? null,
        includeSignature: false,
        signatureAssetId: null,
        createdById: user.id,
        items: { create: computed.map((line) => ({ ...line })) },
      },
    });
  });

  await prisma.auditLog.create({
    data: {
      action: "MONTHLY_INVOICE_GENERATED",
      entityType: "Invoice",
      entityId: invoice.id,
      userId: user.id,
      metadata: { billingMonth: parsed.data.billingMonth, siteId: contract.siteId, contractId: contract.id },
    },
  });
  revalidatePath("/billing");
  revalidatePath("/invoices");
  return ok(invoice);
}

export async function updateClient(id: string, input: z.infer<typeof partySchema>) {
  const { user, error } = await authorize("billing", "edit");
  if (!user) return error;
  const parsed = partySchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const { bankName, accountNo, ifsc, branch, ...clientData } = parsed.data;
  const client = await prisma.client.update({ where: { id }, data: clean(clientData) });
  await prisma.auditLog.create({ data: { action: "CLIENT_UPDATED", entityType: "Client", entityId: id, userId: user.id } });
  revalidatePath("/parties"); revalidatePath("/billing"); revalidatePath("/sites");
  return ok(client);
}

export async function updateSubcontractor(id: string, input: z.infer<typeof partySchema>) {
  const { user, error } = await authorize("billing", "edit");
  if (!user) return error;
  const parsed = partySchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const party = await prisma.subcontractor.update({ where: { id }, data: clean(parsed.data) });
  await prisma.auditLog.create({ data: { action: "SUBCONTRACTOR_UPDATED", entityType: "Subcontractor", entityId: id, userId: user.id } });
  revalidatePath("/parties"); revalidatePath("/billing"); revalidatePath("/sites");
  return ok(party);
}

export async function setClientActive(id: string, isActive: boolean) {
  const { user, error } = await authorize("billing", "edit");
  if (!user) return error;
  const client = await prisma.client.update({ where: { id }, data: { isActive } });
  revalidatePath("/parties"); revalidatePath("/billing");
  return ok(client);
}

export async function setSubcontractorActive(id: string, isActive: boolean) {
  const { user, error } = await authorize("billing", "edit");
  if (!user) return error;
  const party = await prisma.subcontractor.update({ where: { id }, data: { isActive } });
  revalidatePath("/parties"); revalidatePath("/billing");
  return ok(party);
}
