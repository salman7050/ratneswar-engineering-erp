"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorize, ok, fail, zodError } from "@/lib/actions/action-utils";

// ── Site core ─────────────────────────────────────────────────

const siteSchema = z.object({
  siteCode: z.string().max(30).optional().nullable(),
  name: z.string().min(2, "Name is too short"),
  location: z.string().min(2, "Location is required"),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  type: z.enum(["SUBSTATION", "HYDRO", "PUMPING_STATION", "SOLAR", "OM_CONTRACT", "EPC", "OTHER"]),
  client: z.string().min(2, "Client is required"),
  clientId: z.string().optional().nullable(),
  ownership: z.enum(["DIRECT", "SUBCONTRACT"]).default("DIRECT"),
  subcontractorId: z.string().optional().nullable(),
  billingMode: z.enum(["ON_DEMAND", "MONTHLY", "MILESTONE"]).default("ON_DEMAND"),
  monthlyBillingEnabled: z.boolean().default(false),
  defaultDestination: z.string().max(300).optional().nullable(),
  defaultPaymentTerms: z.string().max(300).optional().nullable(),
  defaultTenderNo: z.string().max(200).optional().nullable(),
  defaultBuyerOrderNo: z.string().max(250).optional().nullable(),
  defaultBuyerOrderDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  capacity: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "COMPLETED", "ON_HOLD"]),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export async function createSite(input: z.infer<typeof siteSchema>) {
  const { user, error } = await authorize("sites", "create");
  if (!user) return error;

  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const site = await prisma.site.create({
    data: {
      ...parsed.data,
      subcontractorId: parsed.data.ownership === "SUBCONTRACT" ? parsed.data.subcontractorId : null,
      monthlyBillingEnabled: parsed.data.billingMode === "MONTHLY" || parsed.data.monthlyBillingEnabled,
    },
  });

  await prisma.auditLog.create({
    data: { action: "SITE_CREATED", entityType: "Site", entityId: site.id, userId: user.id },
  });

  revalidatePath("/sites");
  return ok(site);
}

export async function updateSite(id: string, input: z.infer<typeof siteSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const site = await prisma.site.update({
    where: { id },
    data: {
      ...parsed.data,
      subcontractorId: parsed.data.ownership === "SUBCONTRACT" ? parsed.data.subcontractorId : null,
      monthlyBillingEnabled: parsed.data.billingMode === "MONTHLY" || parsed.data.monthlyBillingEnabled,
    },
  });

  await prisma.auditLog.create({
    data: { action: "SITE_UPDATED", entityType: "Site", entityId: site.id, userId: user.id },
  });

  revalidatePath("/sites");
  revalidatePath(`/sites/${id}`);
  return ok(site);
}

export async function deleteSite(id: string) {
  const { user, error } = await authorize("sites", "delete");
  if (!user) return error;

  await prisma.site.delete({ where: { id } });

  await prisma.auditLog.create({
    data: { action: "SITE_DELETED", entityType: "Site", entityId: id, userId: user.id },
  });

  revalidatePath("/sites");
  return ok(undefined);
}

// ── Photos ────────────────────────────────────────────────────

const photoSchema = z.object({
  siteId: z.string().min(1),
  url: z.string().url("Must be a valid URL"),
  caption: z.string().optional().nullable(),
});

export async function addSitePhoto(input: z.infer<typeof photoSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  const parsed = photoSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const photo = await prisma.sitePhoto.create({ data: parsed.data });
  revalidatePath(`/sites/${parsed.data.siteId}`);
  return ok(photo);
}

export async function deleteSitePhoto(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  await prisma.sitePhoto.delete({ where: { id } });
  revalidatePath(`/sites/${siteId}`);
  return ok(undefined);
}

// ── Engineer / staff assignment ──────────────────────────────

const engineerSchema = z.object({
  siteId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["SITE_ENGINEER", "SITE_MANAGER", "SUPERVISOR"]),
});

export async function assignEngineer(input: z.infer<typeof engineerSchema>) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  const parsed = engineerSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const assignment = await prisma.siteEngineer.upsert({
    where: { siteId_userId: { siteId: parsed.data.siteId, userId: parsed.data.userId } },
    update: { role: parsed.data.role },
    create: parsed.data,
  });

  revalidatePath(`/sites/${parsed.data.siteId}`);
  return ok(assignment);
}

export async function removeEngineer(id: string, siteId: string) {
  const { user, error } = await authorize("sites", "edit");
  if (!user) return error;

  await prisma.siteEngineer.delete({ where: { id } });
  revalidatePath(`/sites/${siteId}`);
  return ok(undefined);
}
