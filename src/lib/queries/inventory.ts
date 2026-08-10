import "server-only";
import { prisma } from "@/lib/prisma";

export async function getVendors() {
  return prisma.vendor.findMany({ orderBy: { name: "asc" } });
}

export async function getStores() {
  return prisma.store.findMany({ orderBy: { name: "asc" }, include: { site: { select: { name: true } } } });
}

function balanceFromTxns(txns: { type: "RECEIVE" | "ISSUE"; quantity: number; storeId: string }[]) {
  return txns.reduce((s, t) => s + (t.type === "RECEIVE" ? t.quantity : -t.quantity), 0);
}

export async function getStockItems() {
  const [items, txns] = await Promise.all([
    prisma.stockItem.findMany({ orderBy: { name: "asc" } }),
    prisma.stockTransaction.findMany({ select: { stockItemId: true, type: true, quantity: true, storeId: true } }),
  ]);

  const byItem = new Map<string, { type: "RECEIVE" | "ISSUE"; quantity: number; storeId: string }[]>();
  for (const t of txns) {
    const list = byItem.get(t.stockItemId) ?? [];
    list.push({ type: t.type, quantity: Number(t.quantity), storeId: t.storeId });
    byItem.set(t.stockItemId, list);
  }

  return items.map((item) => {
    const itemTxns = byItem.get(item.id) ?? [];
    const balance = balanceFromTxns(itemTxns);
    const reorderLevel = Number(item.reorderLevel);
    return {
      ...item,
      reorderLevel,
      standardRate: item.standardRate === null ? null : Number(item.standardRate),
      balance,
      isLowStock: balance <= reorderLevel,
    };
  });
}

export async function getStockItemDetail(id: string) {
  const item = await prisma.stockItem.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        include: { store: { select: { name: true } }, vendor: { select: { name: true } }, createdBy: { select: { name: true } } },
      },
    },
  });
  if (!item) return null;

  const txns = item.transactions.map((t) => ({
    ...t,
    quantity: Number(t.quantity),
    rate: t.rate === null ? null : Number(t.rate),
  }));

  const balance = balanceFromTxns(txns.map((t) => ({ type: t.type, quantity: t.quantity, storeId: t.storeId })));

  const byStore = new Map<string, { name: string; balance: number }>();
  for (const t of txns) {
    const cur = byStore.get(t.storeId) ?? { name: t.store.name, balance: 0 };
    cur.balance += t.type === "RECEIVE" ? t.quantity : -t.quantity;
    byStore.set(t.storeId, cur);
  }

  return {
    ...item,
    reorderLevel: Number(item.reorderLevel),
    standardRate: item.standardRate === null ? null : Number(item.standardRate),
    transactions: txns,
    balance,
    storeBreakdown: Array.from(byStore.values()),
  };
}

export async function suggestNextSku(): Promise<string> {
  const count = await prisma.stockItem.count();
  return `RE-MAT-${String(count + 1).padStart(4, "0")}`;
}

/** All assets/tools/equipment across every site plus unassigned (central store) ones. */
export async function getAllAssets() {
  const assets = await prisma.asset.findMany({
    orderBy: { name: "asc" },
    include: { site: { select: { name: true } } },
  });
  return assets.map((a) => ({ ...a, purchaseValue: a.purchaseValue === null ? null : Number(a.purchaseValue) }));
}

export type StockItemDetail = NonNullable<Awaited<ReturnType<typeof getStockItemDetail>>>;
export type StockItemListItem = Awaited<ReturnType<typeof getStockItems>>[number];
export type AssetListItem = Awaited<ReturnType<typeof getAllAssets>>[number];
