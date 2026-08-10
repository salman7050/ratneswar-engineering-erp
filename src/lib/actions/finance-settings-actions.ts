"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, zodError } from "@/lib/actions/action-utils";
import { deleteStoredFile } from "@/lib/supabase/storage-server";

function revalidateFinance() {
  revalidatePath("/settings/finance");
  revalidatePath("/invoices");
  revalidatePath("/quotations");
  revalidatePath("/purchase-orders");
}

const settingsSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  tradeName: z.string().trim().min(1).max(200),
  tagline: z.string().trim().min(1).max(300),
  gstin: z.string().trim().min(1).max(20),
  pan: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().min(1).max(1000),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  stateCode: z.string().trim().min(1).max(5),
  pincode: z.string().trim().max(10).optional().nullable(),
  phone: z.string().trim().min(1).max(100),
  email: z.string().email(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  signatoryName: z.string().trim().min(1).max(150),
  signatureUrl: z.string().optional().nullable(),
  jurisdiction: z.string().trim().min(1).max(150),
  declaration: z.string().trim().min(1).max(2000),
  defaultPaymentTerms: z.string().trim().min(1).max(300),
  defaultQuoteTerms: z.string().trim().min(1).max(5000),
  quotationRefPrefix: z.string().trim().min(1).max(40),
  quotationValidityDays: z.coerce.number().int().min(1).max(365),
  ownerApprovalThreshold: z.coerce.number().min(0).max(1000000000),
  defaultPoTerms: z.string().trim().min(1).max(5000),
  poContactName: z.string().trim().min(1).max(150),
  poContactEmail: z.string().email(),
  poContactPhone: z.string().trim().min(1).max(50),
  aiMode: z.enum(["CLOUD"]),
  aiProvider: z.string().trim().min(1).max(30),
  ollamaBaseUrl: z.string().url(),
  ollamaModel: z.string().trim().min(1).max(100),
});

export async function updateCompanySettings(input: z.infer<typeof settingsSchema>) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const record = await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {
      ...parsed.data,
      pan: parsed.data.pan || null,
      pincode: parsed.data.pincode || null,
      website: parsed.data.website || null,
      logoUrl: parsed.data.logoUrl || null,
      signatureUrl: parsed.data.signatureUrl || null,
    },
    create: {
      id: "singleton",
      ...parsed.data,
      pan: parsed.data.pan || null,
      pincode: parsed.data.pincode || null,
      website: parsed.data.website || null,
      logoUrl: parsed.data.logoUrl || null,
      signatureUrl: parsed.data.signatureUrl || null,
    },
  });

  revalidateFinance();
  return ok(record);
}

const signatureSchema = z.object({
  name: z.string().trim().min(2).max(120),
  imageUrl: z.string().min(1),
});

export async function addSignatureAsset(input: z.infer<typeof signatureSchema>) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  const parsed = signatureSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const count = await prisma.signatureAsset.count();
  const record = await prisma.signatureAsset.create({ data: { ...parsed.data, sortOrder: (count + 1) * 10 } });
  revalidateFinance();
  return ok(record);
}

export async function replaceSignatureAsset(id: string, input: z.infer<typeof signatureSchema>) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  const parsed = signatureSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);
  const existing = await prisma.signatureAsset.findUnique({ where: { id } });
  if (!existing) return { ok: false as const, error: "Signature asset not found." };
  const record = await prisma.signatureAsset.update({ where: { id }, data: parsed.data });
  if (existing.imageUrl !== parsed.data.imageUrl) await deleteStoredFile(existing.imageUrl);
  revalidateFinance();
  return ok(record);
}

export async function setDefaultSignatureAsset(id: string) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  await prisma.$transaction([
    prisma.signatureAsset.updateMany({ data: { isDefault: false } }),
    prisma.signatureAsset.update({ where: { id }, data: { isDefault: true, isActive: true } }),
  ]);
  revalidateFinance();
  return ok(undefined);
}

export async function deleteSignatureAsset(id: string) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  const existing = await prisma.signatureAsset.findUnique({ where: { id } });
  if (!existing) return ok(undefined);
  await prisma.signatureAsset.update({ where: { id }, data: { isActive: false, isDefault: false } });
  // Do not delete the physical file here because historical documents may still reference it.
  revalidateFinance();
  return ok(undefined);
}

const bankSchema = z.object({
  bankName: z.string().min(1),
  accountNo: z.string().min(1),
  ifsc: z.string().min(1),
  branch: z.string().min(1),
  upiId: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
});

export async function addBankAccount(input: z.infer<typeof bankSchema>) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  const parsed = bankSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  if (parsed.data.isDefault) {
    await prisma.bankAccount.updateMany({ data: { isDefault: false }, where: {} });
  }
  const record = await prisma.bankAccount.create({ data: parsed.data });
  revalidateFinance();
  return ok(record);
}

export async function setDefaultBankAccount(id: string) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  await prisma.$transaction([
    prisma.bankAccount.updateMany({ data: { isDefault: false }, where: {} }),
    prisma.bankAccount.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidateFinance();
  return ok(undefined);
}

export async function deleteBankAccount(id: string) {
  const { user, error } = await authorize("settings", "edit");
  if (!user) return error;
  await prisma.bankAccount.delete({ where: { id } });
  revalidateFinance();
  return ok(undefined);
}
