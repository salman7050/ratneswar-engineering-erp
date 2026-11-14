import "server-only";
import { prisma } from "@/lib/prisma";
import type { DocumentKind, Prisma } from "@prisma/client";

export function financialYear(date = new Date()): string {
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

const DEFAULT_PREFIX: Record<DocumentKind, string> = {
  QUOTATION: "RE/QTN",
  INVOICE: "RE/INV",
  PURCHASE_ORDER: "RE/PO",
  WORK_ORDER: "RE/WO",
};

function cleanPrefix(value: string | undefined, kind: DocumentKind) {
  return (value?.trim() || DEFAULT_PREFIX[kind]).replace(/^\/+|\/+$/g, "");
}

async function alreadyExists(
  kind: DocumentKind,
  number: string,
  tx: Prisma.TransactionClient | typeof prisma,
): Promise<boolean> {
  switch (kind) {
    case "QUOTATION":
      return Boolean(await tx.quotation.findUnique({ where: { quoteNo: number }, select: { id: true } }));
    case "INVOICE":
      return Boolean(await tx.invoice.findUnique({ where: { invoiceNo: number }, select: { id: true } }));
    case "PURCHASE_ORDER":
      return Boolean(await tx.purchaseOrder.findUnique({ where: { poNo: number }, select: { id: true } }));
    case "WORK_ORDER":
      return Boolean(await tx.workOrder.findUnique({ where: { woNo: number }, select: { id: true } }));
  }
}

async function reserveNextValue(
  kind: DocumentKind,
  fy: string,
  tx: Prisma.TransactionClient | typeof prisma,
): Promise<number> {
  const sequence = await tx.documentSequence.upsert({
    where: { kind_financialYear: { kind, financialYear: fy } },
    create: { kind, financialYear: fy, nextValue: 2 },
    update: { nextValue: { increment: 1 } },
    select: { nextValue: true },
  });
  return sequence.nextValue - 1;
}

/**
 * Generates a professional FY-wise running document number.
 * Examples:
 *   RE/QTN/26-27/001
 *   RE/INV/26-27/001
 *   RE/PO/26-27/001
 *
 * Existing historical documents are never renumbered. The sequence is reserved
 * transactionally so two users cannot receive the same new number.
 */
export async function generateDocumentNumber(
  kind: DocumentKind,
  date = new Date(),
  tx: Prisma.TransactionClient | typeof prisma = prisma,
  prefix?: string,
): Promise<string> {
  const fy = financialYear(date);
  const clean = cleanPrefix(prefix, kind);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const value = await reserveNextValue(kind, fy, tx);
    const candidate = `${clean}/${fy}/${String(value).padStart(3, "0")}`;
    if (!(await alreadyExists(kind, candidate, tx))) return candidate;
  }

  throw new Error("Could not reserve a unique document number. Please try again.");
}

export function documentNumberPreview(kind: DocumentKind, date = new Date(), prefix?: string): string {
  return `${cleanPrefix(prefix, kind)}/${financialYear(date)}/###`;
}
