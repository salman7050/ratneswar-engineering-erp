import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/supabase/storage-server";

export async function getCompanySettings() {
  const existing = await prisma.companySettings.findUnique({ where: { id: "singleton" } });
  const record = existing ?? await prisma.companySettings.create({ data: { id: "singleton" } });
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
