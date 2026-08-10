import "server-only";
import { prisma } from "@/lib/prisma";
import { documentNumberPreview } from "@/lib/document-number";
import { resolveStoredFileUrl, resolveStoredFileUrls } from "@/lib/supabase/storage-server";

function toNum(d: { toNumber: () => number } | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  return typeof d === "number" ? d : d.toNumber();
}

function serializePO<T extends Record<string, any>>(po: T) {
  return {
    ...po,
    subtotal: toNum(po.subtotal),
    discountAmount: toNum(po.discountAmount),
    taxableValue: toNum(po.taxableValue),
    cgstAmount: toNum(po.cgstAmount),
    sgstAmount: toNum(po.sgstAmount),
    igstAmount: toNum(po.igstAmount),
    taxAmount: toNum(po.taxAmount),
    roundOff: toNum(po.roundOff),
    grandTotal: toNum(po.grandTotal),
    advancePercent: po.advancePercent === null || po.advancePercent === undefined ? null : toNum(po.advancePercent),
  };
}

const LIST_INCLUDE = {
  site: { select: { id: true, name: true } },
  vendor: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} as const;

export async function getPurchaseOrders() {
  const pos = await prisma.purchaseOrder.findMany({
    orderBy: { date: "desc" },
    include: LIST_INCLUDE,
  });
  return pos.map(serializePO);
}

const DETAIL_INCLUDE = {
  items: { orderBy: { sortOrder: "asc" } },
  site: { select: { id: true, name: true } },
  vendor: true,
  bankAccount: true,
  createdBy: { select: { id: true, name: true, role: true } },
  approvals: { orderBy: { createdAt: "asc" }, include: { by: { select: { id: true, name: true, role: true } } } },
  comments: { orderBy: { createdAt: "desc" }, include: { user: { select: { id: true, name: true } } } },
  attachments: { orderBy: { createdAt: "desc" } },
  signatureAsset: true,
} as const;

export async function getPurchaseOrderDetail(id: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!po) return null;
  const attachments = await resolveStoredFileUrls(po.attachments);
  const signaturePreviewUrl = po.signatureAsset?.imageUrl ? await resolveStoredFileUrl(po.signatureAsset.imageUrl) : null;
  return {
    ...serializePO(po),
    attachments,
    signaturePreviewUrl,
    items: po.items.map((it) => ({
      ...it,
      quantity: toNum(it.quantity),
      rate: toNum(it.rate),
      discountPercent: toNum(it.discountPercent),
      gstPercent: toNum(it.gstPercent),
      gstAmount: toNum(it.gstAmount),
      amount: toNum(it.amount),
    })),
  };
}

/** PO-YYYY-#### — resets sequence each calendar year, matches this ERP's other document-numbering conventions. */
export async function suggestNextPONumber(): Promise<string> {
  return documentNumberPreview("PURCHASE_ORDER");
}

export async function getVendorOptions() {
  return prisma.vendor.findMany({ orderBy: { name: "asc" } });
}

export type PurchaseOrderDetail = NonNullable<Awaited<ReturnType<typeof getPurchaseOrderDetail>>>;
export type PurchaseOrderListItem = Awaited<ReturnType<typeof getPurchaseOrders>>[number];
