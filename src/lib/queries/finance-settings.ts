import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/supabase/storage-server";
import { withDatabaseRetry } from "@/lib/db-retry";

export async function getCompanySettings() {
  let record = await withDatabaseRetry(
    () => prisma.companySettings.findUnique({ where: { id: "singleton" } }),
    "company-settings"
  );

  // Never write on a normal dashboard read. Writing here used to fire the
  // database-wide realtime trigger, which caused CloudSyncRefresh -> router.refresh()
  // -> getCompanySettings() -> UPDATE -> realtime event in an endless loop.
  if (!record) {
    record = await withDatabaseRetry(
      () => prisma.companySettings.create({ data: { id: "singleton" } }),
      "company-settings-create"
    );
  }

  return { ...record, ownerApprovalThreshold: Number(record.ownerApprovalThreshold) };
}

export async function getBankAccounts() {
  return prisma.bankAccount.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
}

export async function getDefaultBankAccount() {
  const accounts = await getBankAccounts();
  return accounts.find((a) => a.isDefault) ?? accounts[0] ?? null;
}

export async function getSignatureAssets() {
  const records = await prisma.signatureAsset.findMany({ where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { name: "asc" }] });
  return Promise.all(records.map(async (record) => ({ ...record, previewUrl: await resolveStoredFileUrl(record.imageUrl) })));
}
