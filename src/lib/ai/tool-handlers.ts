import "server-only";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/actions/invoice-actions";
import { createQuotation } from "@/lib/actions/quotation-actions";
import { createPurchaseOrder } from "@/lib/actions/purchase-order-actions";
import { generateMonthlyInvoice } from "@/lib/actions/billing-actions";
import { resolveStoredFileUrls } from "@/lib/supabase/storage-server";
import { createExpense } from "@/lib/actions/expense-actions";
import { createTask } from "@/lib/actions/command-center-actions";

async function findSiteIdByName(name?: string): Promise<string | null> {
  if (!name) return null;
  const site = await prisma.site.findFirst({ where: { name: { contains: name, mode: "insensitive" } } });
  return site?.id ?? null;
}

type ToolInput = Record<string, any>;

export async function runAiTool(toolName: string, input: ToolInput): Promise<{ summary: string; data: unknown }> {
  switch (toolName) {
    case "lookup_master": {
      const query = String(input.query || "").trim();
      if (!query) return { summary: "Enter a name to search.", data: null };
      const type = input.type || "ALL";
      const [sites, clients, vendors] = await Promise.all([
        type === "CLIENT" || type === "VENDOR" ? Promise.resolve([]) : prisma.site.findMany({ where: { name: { contains: query, mode: "insensitive" } }, select: { id: true, name: true, location: true, capacity: true, client: true }, take: 8 }),
        type === "SITE" || type === "VENDOR" ? Promise.resolve([]) : prisma.client.findMany({ where: { isActive: true, name: { contains: query, mode: "insensitive" } }, select: { id: true, name: true, legalName: true, gstin: true, address: true, email: true, phone: true }, take: 8 }),
        type === "SITE" || type === "CLIENT" ? Promise.resolve([]) : prisma.vendor.findMany({ where: { name: { contains: query, mode: "insensitive" } }, select: { id: true, name: true, gstin: true, address: true, email: true, phone: true, contactPerson: true }, take: 8 }),
      ]);
      return { summary: `Found ${sites.length} site(s), ${clients.length} client(s) and ${vendors.length} vendor(s) matching "${query}".`, data: { sites, clients, vendors } };
    }
    case "generate_invoice": {
      const site = input.siteName ? await prisma.site.findFirst({
        where: { name: { contains: String(input.siteName), mode: "insensitive" } },
        include: { clientAccount: true, subcontractor: true },
      }) : null;
      if (input.siteName && !site) return { summary: `Site ${input.siteName} was not found. Please select the saved site instead of guessing.`, data: null };
      if (site?.ownership === "SUBCONTRACT" && !site.subcontractorId) {
        return { summary: `The legal invoice issuer is not configured for ${site.name}. Configure Vikas / Ascent / the correct issuer in the site master first.`, data: null };
      }
      const matchedClient = await prisma.client.findFirst({
        where: { isActive: true, name: { contains: String(input.buyerName || ""), mode: "insensitive" } },
      });
      const directBank = site?.ownership === "SUBCONTRACT" ? null : await prisma.bankAccount.findFirst({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
      const result = await createInvoice({
        date: new Date(), dueDate: null, invoiceType: site?.ownership === "SUBCONTRACT" ? "SUBCONTRACT" : "STANDARD", billingMonth: null,
        periodFrom: null, periodTo: null, buyerName: input.buyerName,
        buyerAddress: input.buyerAddress ?? matchedClient?.address ?? null, buyerGstin: input.buyerGstin ?? matchedClient?.gstin ?? null,
        buyerPan: matchedClient?.pan ?? null, placeOfSupply: "Gujarat", referenceNo: null, referenceDate: null,
        poRefNo: input.poRefNo ?? null, buyerOrderDate: null, destination: input.siteName ?? null,
        tenderNo: site?.defaultTenderNo ?? null, dispatchThrough: "Service / Supply", paymentTerms: input.paymentTerms ?? site?.defaultPaymentTerms ?? "Within 30 Days",
        termsOfDelivery: null, remarks: null, gstType: input.gstType, siteId: site?.id ?? null,
        clientId: matchedClient?.id ?? site?.clientId ?? null, subcontractorId: site?.ownership === "SUBCONTRACT" ? site.subcontractorId : null, billingContractId: null, tenderId: null, bankAccountId: directBank?.id ?? null,
        includeSignature: false, signatureAssetId: null,
        items: input.items.map((it: any) => ({ workCategory: it.workCategory ?? "OTHER", description: it.description,
          testingDescription: it.testingDescription ?? null, hsnCode: it.hsnCode, unit: it.unit ?? "Nos",
          quantity: it.quantity, rate: it.rate, gstPercent: it.gstPercent ?? 18 }))
      });
      if (!result.ok) return { summary: `Could not create the invoice: ${result.error}`, data: null };
      return { summary: `Invoice ${result.data.invoiceNo} created for ${input.buyerName}.`, data: { id: result.data.id, invoiceNo: result.data.invoiceNo, url: `/invoices/${result.data.id}` } };
    }

    case "generate_quotation": {
      const siteId = await findSiteIdByName(input.siteName);
      const clientAccount = await prisma.client.findFirst({ where: { name: { contains: input.client, mode: "insensitive" }, isActive: true } });
      const validTill = new Date(Date.now() + (input.validTillDays ?? 30) * 86400000);
      const basicItems = input.items.map((it: any) => ({
        shortDescription: it.description,
        description: it.description,
        hsnCode: it.hsnCode ?? "",
        quantity: it.quantity ?? 1,
        unit: it.unit ?? "Nos",
        secondaryQuantity: null,
        secondaryUnit: null,
        rate: it.rate ?? 0,
        rateBasis: it.rateBasis ?? null,
        calculationMode: "QTY_RATE" as const,
      }));
      const subject = input.subject || `Quotation for ${input.scope}`;
      const result = await createQuotation({ date: new Date(), recipientDesignation: null, recipientDepartment: null,
        client: clientAccount?.legalName || input.client, clientAddress: input.clientAddress ?? clientAccount?.address ?? null,
        clientGstin: input.clientGstin ?? clientAccount?.gstin ?? null, clientId: clientAccount?.id ?? null,
        subject, scope: input.scope, introduction: `With reference to the requirement, we are pleased to submit our quotation for ${input.scope}. The details of the work and corresponding rates are as follows:`,
        notes: null, terms: null, aiDrafted: true, riskLevel: "NORMAL", riskReason: null,
        gstType: input.gstType, validTill, siteId, tenderId: null, bankAccountId: null, includeSignature: false, signatureAssetId: null, items: basicItems });
      if (!result.ok) return { summary: `Could not create the quotation: ${result.error}`, data: null };
      return { summary: `Quotation ${result.data.referenceNo} created for ${input.client}.`, data: { id: result.data.id, quoteNo: result.data.referenceNo, url: `/quotations/${result.data.id}` } };
    }

    case "generate_purchase_order": {
      const siteId = await findSiteIdByName(input.siteName);
      const vendor = await prisma.vendor.findFirst({ where: { name: { contains: String(input.vendorName || ""), mode: "insensitive" } } });
      const settings = await prisma.companySettings.findUnique({ where: { id: "singleton" }, select: { defaultPoTerms: true } });
      const result = await createPurchaseOrder({
        date: new Date(), refNumber: null, quotationRef: input.quotationRef ?? null, indentRef: null, department: null,
        raisedBy: null, priority: "MEDIUM", projectName: input.subject || input.items?.[0]?.description || input.siteName || "Purchase Order", vendorId: vendor?.id ?? null,
        vendorName: vendor?.name || input.vendorName, vendorCode: vendor?.code ?? null, vendorGstin: input.vendorGstin ?? vendor?.gstin ?? null, vendorPan: vendor?.pan ?? null,
        vendorAddress: input.vendorAddress ?? vendor?.address ?? null, vendorEmail: input.vendorEmail ?? vendor?.email ?? null, vendorPhone: input.vendorPhone ?? vendor?.phone ?? null, vendorContactPerson: vendor?.contactPerson ?? null,
        siteId, deliveryAddress: input.deliveryAddress ?? null, deliveryContactPerson: null, deliveryDate: null,
        expectedDelivery: null, gstType: input.gstType, advancePercent: null, creditDays: input.creditDays ?? 30,
        paymentMethod: "Bank Transfer", bankAccountId: null, deliverySchedule: null, packing: null,
        transportation: null, insurance: null, warranty: null, inspectionTerms: null,
        specialInstructions: null, notes: input.notes ?? null, terms: input.terms ?? settings?.defaultPoTerms ?? null, includeSignature: false, signatureAssetId: null,
        items: input.items.map((it: any) => ({ itemCode: null, description: it.description, hsnCode: it.hsnCode,
          unit: it.unit ?? "Nos", quantity: it.quantity, rate: it.rate, discountPercent: 0,
          gstPercent: it.gstPercent ?? 18, remarks: null }))
      });
      if (!result.ok) return { summary: `Could not create the purchase order: ${result.error}`, data: null };
      return { summary: `Purchase order ${result.data.poNo} created for ${input.vendorName}.`, data: { id: result.data.id, poNo: result.data.poNo, url: `/purchase-orders/${result.data.id}` } };
    }

    case "generate_monthly_site_invoice": {
      const contract = await prisma.billingContract.findFirst({
        where: { active: true, site: { name: { contains: input.siteName, mode: "insensitive" } } },
        include: { site: true, lineTemplates: { where: { active: true }, orderBy: { sortOrder: "asc" } } }
      });
      if (!contract) return { summary: `No active monthly billing contract found for ${input.siteName}.`, data: null };
      const result = await generateMonthlyInvoice({ contractId: contract.id, billingMonth: input.billingMonth, date: new Date(),
        lines: contract.lineTemplates.map((line) => ({ category: line.category, description: line.description,
          testingDescription: line.category === "TESTING" && input.testingDescription ? input.testingDescription : line.testingDescription,
          hsnCode: line.hsnCode, unit: line.unit, quantity: Number(line.quantity), rate: Number(line.rate), gstPercent: Number(line.gstPercent) })) });
      if (!result.ok) return { summary: `Could not generate monthly invoice: ${result.error}`, data: null };
      return { summary: `Monthly invoice ${result.data.invoiceNo} generated for ${contract.site.name}.`, data: { id: result.data.id, invoiceNo: result.data.invoiceNo, url: `/invoices/${result.data.id}` } };
    }

    case "billing_status": {
      const month = input.billingMonth ?? new Date().toISOString().slice(0, 7);
      const contracts = await prisma.billingContract.findMany({
        where: { active: true, ...(input.siteName ? { site: { name: { contains: input.siteName, mode: "insensitive" } } } : {}) },
        include: { site: true, client: true, subcontractor: true, invoices: { where: { billingMonth: month }, select: { id: true, invoiceNo: true, grandTotal: true, status: true } } }
      });
      return { summary: `Billing status fetched for ${month}.`, data: contracts.map((contract) => ({ site: contract.site.name,
        ownership: contract.site.ownership, billTo: contract.client?.name ?? contract.subcontractor?.name ?? "Not configured",
        invoice: contract.invoices[0] ? { ...contract.invoices[0], grandTotal: Number(contract.invoices[0].grandTotal) } : null,
        pending: contract.invoices.length === 0 })) };
    }

    case "record_expense": {
      const siteId = await findSiteIdByName(input.siteName);
      const result = await createExpense({
        siteId, businessUnit: input.businessUnit || "Ratneswar Engineering", transactionType: input.transactionType || "EXPENSE",
        category: input.category, description: input.description, amount: input.amount,
        date: input.date ? new Date(`${input.date}T12:00:00+05:30`) : new Date(), payee: input.payee ?? null,
        paymentMode: input.paymentMode ?? null, bankReference: input.bankReference ?? null, vendorId: null, purchaseOrderId: null,
        documentUrl: null, documentStatus: input.documentPending ? "DOCUMENT_PENDING" : "NOT_REQUIRED", source: "Ratneswar AI"
      });
      if (!result.ok) return { summary: `Could not record the expense/payment: ${result.error}`, data: null };
      return { summary: `${input.transactionType === "INTERNAL_TRANSFER" ? "Internal transfer" : "Expense/payment"} recorded successfully.`, data: { id: result.data.id, url: "/expenses" } };
    }

    case "create_task": {
      const siteId = await findSiteIdByName(input.siteName);
      const dueDate = input.dueDate ? new Date(`${input.dueDate}T00:00:00Z`) : new Date();
      const result = await createTask({ title: input.title, description: input.description ?? null, priority: input.priority ?? "MEDIUM", category: "OTHER", siteId, dueDate, dueTime: input.dueTime ?? null, reminderAt: null, attachmentUrl: null, notes: null, assignedToId: null });
      if (!result.ok) return { summary: `Could not add the task: ${result.error}`, data: null };
      return { summary: `Task added: ${input.title}.`, data: { id: result.data.id, url: "/dashboard" } };
    }

    case "draft_email": {
      // Pure formatting tool — no DB access. The local model wrote the content; we hand it back
      // structured so the UI can render a proper email card with copy/mailto actions.
      return {
        summary: "Drafted the email below.",
        data: { to: input.to ?? "", subject: input.subject, body: input.body },
      };
    }

    case "search_documents": {
      const docs = await prisma.document.findMany({
        where: {
          name: { contains: input.query, mode: "insensitive" },
          ...(input.category ? { category: input.category } : {}),
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { site: { select: { name: true } }, employee: { select: { name: true } } },
      });
      const signedDocs = await resolveStoredFileUrls(docs);
      return {
        summary: `Found ${signedDocs.length} document(s) matching "${input.query}".`,
        data: signedDocs.map((d) => ({
          name: d.name, category: d.category, url: d.fileUrl,
          linkedTo: d.site?.name ?? d.employee?.name ?? null,
          uploadedAt: d.createdAt.toISOString().slice(0, 10),
        })),
      };
    }

    case "expense_analysis": {
      const months = input.months ?? 6;
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      const site = input.siteName ? await prisma.site.findFirst({ where: { name: { contains: input.siteName, mode: "insensitive" } } }) : null;

      const expenses = await prisma.expense.findMany({
        where: { date: { gte: since }, transactionType: { not: "INTERNAL_TRANSFER" }, ...(site ? { siteId: site.id } : {}) },
        select: { date: true, amount: true, category: true },
      });

      const byCategory = new Map<string, number>();
      const byMonth = new Map<string, number>();
      for (const e of expenses) {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));
        const mk = e.date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        byMonth.set(mk, (byMonth.get(mk) ?? 0) + Number(e.amount));
      }

      return {
        summary: `Analyzed ${expenses.length} expense entries over the last ${months} months${site ? ` at ${site.name}` : " company-wide"}.`,
        data: {
          scope: site?.name ?? "Company-wide",
          totalSpend: expenses.reduce((s, e) => s + Number(e.amount), 0),
          byCategory: Array.from(byCategory.entries()).map(([name, value]) => ({ name, value: Math.round(value) })),
          byMonth: Array.from(byMonth.entries()).map(([month, value]) => ({ month, value: Math.round(value) })),
        },
      };
    }

    default:
      return { summary: `Unknown tool: ${toolName}`, data: null };
  }
}
