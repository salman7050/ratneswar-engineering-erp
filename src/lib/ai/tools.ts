import "server-only";

export interface LocalAiTool {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

const LINE_ITEMS = {
  type: "array",
  items: {
    type: "object",
    properties: {
      description: { type: "string" },
      hsnCode: { type: "string" },
      unit: { type: "string" },
      quantity: { type: "number" },
      rate: { type: "number" },
      gstPercent: { type: "number" },
    },
    required: ["description", "hsnCode", "quantity", "rate"],
  },
};

export const AI_TOOLS: LocalAiTool[] = [
  {
    name: "lookup_master",
    description: "Finds existing sites, clients and vendors before preparing a document. Use this instead of guessing names, GSTINs or addresses.",
    input_schema: { type: "object", properties: { query: { type: "string" }, type: { type: "string", enum: ["SITE", "CLIENT", "VENDOR", "ALL"] } }, required: ["query"] },
  },
  {
    name: "generate_purchase_order",
    description: "Creates a DRAFT purchase order with an automatic 11-digit PO number. Call only after vendor, GST treatment and every financial line item are explicitly known.",
    input_schema: { type: "object", properties: { vendorName: { type: "string" }, vendorGstin: { type: "string" }, vendorAddress: { type: "string" }, vendorEmail: { type: "string" }, vendorPhone: { type: "string" }, subject: { type: "string" }, siteName: { type: "string" }, gstType: { type: "string", enum: ["SGST_CGST", "IGST"] }, deliveryAddress: { type: "string" }, quotationRef: { type: "string" }, terms: { type: "string" }, notes: { type: "string" }, items: LINE_ITEMS }, required: ["vendorName", "gstType", "items"] },
  },
  {
    name: "generate_quotation",
    description: "Creates a DRAFT quotation. Use after client, scope, GST treatment and all financial line items are explicitly known. Hindi/Hinglish descriptions may be professionally rewritten by the model.",
    input_schema: { type: "object", properties: { client: { type: "string" }, clientAddress: { type: "string" }, clientGstin: { type: "string" }, scope: { type: "string" }, subject: { type: "string" }, siteName: { type: "string" }, gstType: { type: "string", enum: ["SGST_CGST", "IGST"] }, validTillDays: { type: "number" }, items: LINE_ITEMS }, required: ["client", "scope", "gstType", "items"] },
  },
  {
    name: "generate_invoice",
    description: "Creates a DRAFT standard GST invoice. Never guess buyer, supplier profile, amounts, GST type, rates or line items.",
    input_schema: { type: "object", properties: { buyerName: { type: "string" }, buyerAddress: { type: "string" }, buyerGstin: { type: "string" }, poRefNo: { type: "string" }, paymentTerms: { type: "string" }, siteName: { type: "string" }, gstType: { type: "string", enum: ["SGST_CGST", "IGST"] }, items: LINE_ITEMS }, required: ["buyerName", "gstType", "items"] },
  },
  {
    name: "generate_monthly_site_invoice",
    description: "Generates a DRAFT monthly invoice from a saved site billing profile, including its saved legal billing party. Ask for site and billing month if missing.",
    input_schema: { type: "object", properties: { siteName: { type: "string" }, billingMonth: { type: "string", description: "YYYY-MM" }, testingDescription: { type: "string" } }, required: ["siteName", "billingMonth"] },
  },
  {
    name: "record_expense",
    description: "Records a company expense/payment/advance/internal transfer in Expenses & Payments. Never guess amount, payee or payment type; ask when missing.",
    input_schema: { type: "object", properties: {
      date: { type: "string", description: "YYYY-MM-DD" }, amount: { type: "number" }, description: { type: "string" }, category: { type: "string", enum: ["MATERIAL", "LABOUR", "FUEL", "TRANSPORT", "EQUIPMENT", "MISC"] }, businessUnit: { type: "string" }, siteName: { type: "string" }, payee: { type: "string" }, paymentMode: { type: "string" }, bankReference: { type: "string" }, transactionType: { type: "string", enum: ["EXPENSE", "VENDOR_PAYMENT", "PO_PAYMENT", "ADVANCE", "CASH_EXPENSE", "INTERNAL_TRANSFER", "REFUND_RECOVERY"] }, documentPending: { type: "boolean" }
    }, required: ["amount", "description", "category", "businessUnit", "transactionType"] },
  },
  {
    name: "create_task",
    description: "Adds a task to Today's Work / Pending Works for the signed-in Owner/Admin.",
    input_schema: { type: "object", properties: { title: { type: "string" }, dueDate: { type: "string", description: "YYYY-MM-DD" }, dueTime: { type: "string", description: "HH:MM" }, priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] }, siteName: { type: "string" }, description: { type: "string" } }, required: ["title"] },
  },
  {
    name: "draft_email",
    description: "Produces a professional English email draft from Hindi, Hinglish or English instructions. It never sends the email automatically.",
    input_schema: { type: "object", properties: { to: { type: "string" }, subject: { type: "string" }, body: { type: "string" } }, required: ["subject", "body"] },
  },
  {
    name: "search_documents",
    description: "Searches uploaded ERP documents by name/category.",
    input_schema: { type: "object", properties: { query: { type: "string" }, category: { type: "string" } }, required: ["query"] },
  },
  {
    name: "billing_status",
    description: "Fetches saved billing status for a site/month without changing records.",
    input_schema: { type: "object", properties: { siteName: { type: "string" }, billingMonth: { type: "string" } } },
  },
  {
    name: "expense_analysis",
    description: "Fetches expense totals by category/month for a requested site or company scope. Only use when the user explicitly asks for financial analysis; never expose such values on the public dashboard.",
    input_schema: { type: "object", properties: { siteName: { type: "string" }, months: { type: "number" } } },
  },
];
