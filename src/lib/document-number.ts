import "server-only";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import type { DocumentKind, Prisma } from "@prisma/client";

export function financialYear(date = new Date()): string {
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

function randomDocumentNumber(): string {
  // 11-digit cryptographically secure random number. The first digit is never zero.
  return String(randomInt(10_000_000_000, 100_000_000_000));
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

/**
 * Generates an unpredictable server-only 11-digit number such as 34945864553.
 * A database lookup prevents the already extremely unlikely collision from being used.
 */
export async function generateDocumentNumber(
  kind: DocumentKind,
  date = new Date(),
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<string> {
  void date;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = randomDocumentNumber();
    if (!(await alreadyExists(kind, candidate, tx))) return candidate;
  }
  throw new Error("Could not generate a unique document number. Please try again.");
}

export function documentNumberPreview(kind: DocumentKind, date = new Date()): string {
  void kind;
  void date;
  return "Auto-generated secure 11-digit number";
}
