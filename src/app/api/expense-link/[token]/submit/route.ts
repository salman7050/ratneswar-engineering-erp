import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const itemSchema = z.object({
  date: z.string().min(10).max(10),
  category: z.enum(["MATERIAL","LABOUR","FOOD","FUEL","TRANSPORT","SITE_TRANSPORT","EQUIPMENT","OFFICE","MARKETING","MISC"]),
  siteId: z.string().optional().nullable(),
  siteName: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().min(2).max(800),
  amount: z.number().positive().max(100000000),
  paymentMode: z.string().trim().min(2).max(80),
  reference: z.string().trim().max(120).optional().nullable(),
  reimbursementRequested: z.boolean().default(false),
});

const payloadSchema = z.object({
  note: z.string().trim().max(1000).optional().nullable(),
  items: z.array(itemSchema).min(1).max(30),
});

function safeExtension(name: string) {
  const raw = name.includes(".") ? name.split(".").pop() || "bin" : "bin";
  return /^[a-z0-9]{1,10}$/i.test(raw) ? raw.toLowerCase() : "bin";
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const member = await prisma.expenseMember.findFirst({ where: { token, isActive: true } });
    if (!member) return NextResponse.json({ error: "This expense link is invalid or has been revoked." }, { status: 404 });

    const form = await request.formData();
    const rawPayload = form.get("payload");
    if (typeof rawPayload !== "string") {
      return NextResponse.json({ error: "Expense details are missing." }, { status: 400 });
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(rawPayload);
    } catch {
      return NextResponse.json({ error: "Expense details are not valid." }, { status: 400 });
    }

    const parsed = payloadSchema.safeParse(decoded);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Please check the expense details." }, { status: 400 });
    }

    const validSiteIds = parsed.data.items.map((x) => x.siteId).filter((x): x is string => Boolean(x));
    const sites = validSiteIds.length
      ? await prisma.site.findMany({ where: { id: { in: validSiteIds } }, select: { id: true, name: true } })
      : [];
    const siteMap = new Map(sites.map((s) => [s.id, s.name]));

    const submission = await prisma.expenseSubmission.create({
      data: {
        memberId: member.id,
        note: parsed.data.note || null,
      },
      select: { id: true },
    });

    const supabase = createAdminClient();
    const yearMonth = new Date().toISOString().slice(0, 7);
    const itemData: Array<{
      submissionId: string;
      date: Date;
      category: typeof parsed.data.items[number]["category"];
      siteId: string | null;
      siteName: string | null;
      description: string;
      amount: number;
      paymentMode: string;
      reference: string | null;
      receiptUrl: string | null;
      reimbursementRequested: boolean;
    }> = [];

    for (let i = 0; i < parsed.data.items.length; i += 1) {
      const item = parsed.data.items[i]!;
      let receiptUrl: string | null = null;
      const file = form.get(`receipt_${i}`);

      if (file instanceof File && file.size > 0) {
        if (file.size > 10 * 1024 * 1024) {
          await prisma.expenseSubmission.delete({ where: { id: submission.id } }).catch(() => undefined);
          return NextResponse.json({ error: "Each receipt must be 10 MB or smaller." }, { status: 400 });
        }
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
        if (file.type && !allowed.includes(file.type)) {
          await prisma.expenseSubmission.delete({ where: { id: submission.id } }).catch(() => undefined);
          return NextResponse.json({ error: "Receipts must be PDF, JPG, PNG or WEBP." }, { status: 400 });
        }
        const path = `expense-portal/${member.id}/${yearMonth}/${submission.id}-${i}-${crypto.randomUUID()}.${safeExtension(file.name)}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { error } = await supabase.storage.from("documents").upload(path, bytes, {
          contentType: file.type || "application/octet-stream",
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          await prisma.expenseSubmission.delete({ where: { id: submission.id } }).catch(() => undefined);
          return NextResponse.json({ error: "Receipt upload failed. Please try again." }, { status: 500 });
        }
        receiptUrl = path;
      }

      const siteId = item.siteId && siteMap.has(item.siteId) ? item.siteId : null;
      itemData.push({
        submissionId: submission.id,
        date: new Date(`${item.date}T12:00:00`),
        category: item.category,
        siteId,
        siteName: siteId ? siteMap.get(siteId)! : item.siteName || null,
        description: item.description,
        amount: item.amount,
        paymentMode: item.paymentMode,
        reference: item.reference || null,
        receiptUrl,
        reimbursementRequested: item.reimbursementRequested,
      });
    }

    await prisma.expenseSubmissionItem.createMany({ data: itemData });

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      message: "Expense submitted. It is pending admin verification.",
    });
  } catch (error) {
    console.error("[expense-link:submit]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit expenses." }, { status: 500 });
  }
}
