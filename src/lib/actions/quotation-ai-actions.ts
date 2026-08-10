"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize, fail, ok, zodError } from "@/lib/actions/action-utils";
import { callCloudflareAI } from "@/lib/ai/cloudflare";

const draftItemSchema = z.object({
  shortDescription: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().nonnegative(),
  unit: z.string().trim().min(1).max(40),
  secondaryQuantity: z.coerce.number().nonnegative().optional().nullable(),
  secondaryUnit: z.string().trim().max(40).optional().nullable(),
  rate: z.coerce.number().nonnegative(),
  rateBasis: z.string().trim().max(80).optional().nullable(),
  calculationMode: z.enum(["QTY_RATE", "QTY_SECONDARY_RATE", "FIXED"]),
});

const draftSchema = z.object({
  recipientDesignation: z.string().trim().max(200).optional().nullable(),
  recipientDepartment: z.string().trim().max(300).optional().nullable(),
  client: z.string().trim().min(1).max(300),
  clientAddress: z.string().trim().max(1000).optional().nullable(),
  workBrief: z.string().trim().min(8).max(5000),
  validDays: z.coerce.number().int().min(1).max(365).default(30),
  items: z.array(draftItemSchema).min(1).max(40),
});

export interface QuotationSmartDraft {
  subject: string;
  introduction: string;
  descriptions: string[];
  notes: string[];
  terms: string[];
  riskLevel: "NORMAL" | "HIGH_RISK";
  riskReason: string | null;
  source: "CLOUD_AI" | "SMART_FALLBACK";
}

const RISK_PATTERNS: Array<[RegExp, string]> = [
  [/\b(11|22|33|66|132|220|400)\s*k?v\b/i, "High-voltage electrical work"],
  [/\b(substation|switchyard|transformer|ht\s*panel|ehv|high\s*voltage|live\s*electrical)\b/i, "High-voltage / substation work"],
  [/\b(motor\s*shifting|heavy\s*lifting|crane|rigging|loading|unloading)\b/i, "Heavy lifting / shifting activity"],
  [/\b(confined\s*space|work\s*at\s*height|hot\s*work|shutdown|commissioning|testing\s*of\s*protection)\b/i, "Safety-critical execution activity"],
];

function detectRisk(text: string) {
  for (const [pattern, reason] of RISK_PATTERNS) if (pattern.test(text)) return { riskLevel: "HIGH_RISK" as const, riskReason: reason };
  return { riskLevel: "NORMAL" as const, riskReason: null };
}

function sentence(text: string) {
  const clean = text.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1) + ".";
}

function fallbackDraft(input: z.infer<typeof draftSchema>, defaultTerms: string): QuotationSmartDraft {
  const brief = input.workBrief.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
  const subject = /^quotation\b/i.test(brief) ? sentence(brief).replace(/\.$/, "") : `Quotation for ${brief}`;
  const introduction = `With reference to the requirement, we are pleased to submit our quotation for carrying out ${brief.charAt(0).toLowerCase() + brief.slice(1)}. The details of the work and corresponding rates are as follows:`;
  const descriptions = input.items.map((item) => sentence(item.shortDescription));
  const terms = (defaultTerms || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!terms.some((line) => /valid/i.test(line))) terms.push(`Quotation is valid for ${input.validDays} days from the date of issue.`);
  const notes = [
    "Quantities and rates are applicable only to the scope stated in this quotation.",
    "Any additional or changed work shall be executed only after written approval.",
  ];
  const risk = detectRisk(`${brief} ${input.items.map((item) => item.shortDescription).join(" ")}`);
  return { subject, introduction, descriptions, notes, terms, ...risk, source: "SMART_FALLBACK" };
}

function safeJson(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text) as Record<string, unknown>; } catch {
    const start = text.indexOf("{"); const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>; } catch { return null; }
    }
    return null;
  }
}

async function tryCloudAi(input: z.infer<typeof draftSchema>, fallback: QuotationSmartDraft): Promise<QuotationSmartDraft | null> {
  try {
    const prompt = `You write formal Indian engineering quotations for Ratneswar Engineering. Return ONLY JSON.
Do NOT invent, alter or recalculate quantities, rates, GST, names, dates or technical ratings.
Improve only wording: subject, introduction and each line-item description. Keep technical terms exactly meaningful.
Identify HIGH_RISK only for genuinely safety-critical work such as high voltage, live electrical work, substations, heavy lifting, motor shifting, cranes, confined space, work at height, commissioning or similar.
JSON shape: {"subject":"...","introduction":"...","descriptions":["..."],"notes":["..."],"terms":["..."],"riskLevel":"NORMAL|HIGH_RISK","riskReason":"... or null"}.
Recipient: ${input.recipientDesignation || ""}; ${input.recipientDepartment || ""}; ${input.client}; ${input.clientAddress || ""}
Work brief: ${input.workBrief}
Validity days: ${input.validDays}
Items (amount data is reference only and MUST NOT be changed): ${JSON.stringify(input.items)}
Default company terms: ${fallback.terms.join(" | ")}`;
    const text = await callCloudflareAI([{ role: "user", content: prompt }]);
    const parsed = safeJson(text);
    if (!parsed) return null;
    const descriptions = Array.isArray(parsed.descriptions) ? parsed.descriptions.map(String).slice(0, input.items.length) : fallback.descriptions;
    while (descriptions.length < input.items.length) descriptions.push(fallback.descriptions[descriptions.length] || input.items[descriptions.length]?.shortDescription || "Work item");
    const riskLevel = parsed.riskLevel === "HIGH_RISK" ? "HIGH_RISK" : parsed.riskLevel === "NORMAL" ? "NORMAL" : fallback.riskLevel;
    return {
      subject: typeof parsed.subject === "string" && parsed.subject.trim() ? parsed.subject.trim() : fallback.subject,
      introduction: typeof parsed.introduction === "string" && parsed.introduction.trim() ? parsed.introduction.trim() : fallback.introduction,
      descriptions,
      notes: Array.isArray(parsed.notes) ? parsed.notes.map(String).filter(Boolean).slice(0, 6) : fallback.notes,
      terms: Array.isArray(parsed.terms) ? parsed.terms.map(String).filter(Boolean).slice(0, 10) : fallback.terms,
      riskLevel,
      riskReason: typeof parsed.riskReason === "string" && parsed.riskReason.trim() ? parsed.riskReason.trim() : (riskLevel === "HIGH_RISK" ? fallback.riskReason || "Safety-critical work" : null),
      source: "CLOUD_AI",
    };
  } catch { return null; }
}


export async function draftQuotationWithAI(input: z.infer<typeof draftSchema>) {
  const { user, error } = await authorize("quotations", "create");
  if (!user) return error;
  if (user.role !== "ADMIN" && user.role !== "OWNER") return fail("Quotation AI is available only to Owner/Admin accounts.");
  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return zodError(parsed.error);

  const settings = await prisma.companySettings.findUnique({ where: { id: "singleton" } });
  const fallback = fallbackDraft(parsed.data, settings?.defaultQuoteTerms || "");
  const ai = await tryCloudAi(parsed.data, fallback);
  return ok(ai || fallback);
}
