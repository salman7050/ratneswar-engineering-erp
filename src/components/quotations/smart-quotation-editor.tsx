"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Sparkles, Trash2, ShieldAlert, Calculator, FileCheck2, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAction } from "@/hooks/use-action";
import { createQuotation, updateQuotation } from "@/lib/actions/quotation-actions";
import { draftQuotationWithAI } from "@/lib/actions/quotation-ai-actions";
import { formatINR } from "@/lib/utils";
import type { QuotationDetail } from "@/lib/queries/quotations";

type CalcMode = "QTY_RATE" | "QTY_SECONDARY_RATE" | "FIXED";

type EditorItem = {
  shortDescription: string;
  description: string;
  hsnCode: string;
  quantity: string;
  unit: string;
  secondaryQuantity: string;
  secondaryUnit: string;
  rate: string;
  rateBasis: string;
  calculationMode: CalcMode;
};

const EMPTY_ITEM: EditorItem = {
  shortDescription: "", description: "", hsnCode: "", quantity: "1", unit: "Nos",
  secondaryQuantity: "", secondaryUnit: "", rate: "", rateBasis: "", calculationMode: "QTY_RATE",
};

function dateInput(value?: Date | string | null) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function itemAmount(item: EditorItem) {
  const qty = Number(item.quantity || 0); const rate = Number(item.rate || 0); const secondary = Number(item.secondaryQuantity || 0);
  if (item.calculationMode === "FIXED") return rate;
  if (item.calculationMode === "QTY_SECONDARY_RATE") return qty * secondary * rate;
  return qty * rate;
}

export function SmartQuotationEditor({
  quotation,
  clients,
  sites,
  bankAccounts,
  canUseAI,
  defaultTerms,
  defaultValidityDays,
  presetTenderId,
  signatures = [],
}: {
  quotation?: QuotationDetail;
  clients: { id: string; name: string; legalName: string | null; address: string | null; gstin: string | null }[];
  sites: { id: string; name: string }[];
  bankAccounts: { id: string; bankName: string; accountNo: string }[];
  canUseAI: boolean;
  defaultTerms: string;
  defaultValidityDays: number;
  presetTenderId?: string;
  signatures?: { id: string; name: string; isDefault: boolean; previewUrl: string }[];
}) {
  const router = useRouter();
  const isEdit = Boolean(quotation);
  const defaultSignature = signatures.find((entry) => entry.isDefault)?.id || signatures[0]?.id || "";
  const defaultValidTill = React.useMemo(() => {
    if (quotation?.validTill) return dateInput(quotation.validTill);
    const date = new Date(); date.setDate(date.getDate() + defaultValidityDays); return dateInput(date);
  }, [quotation?.validTill, defaultValidityDays]);

  const [form, setForm] = React.useState({
    date: dateInput(quotation?.date) || dateInput(new Date()),
    recipientDesignation: quotation?.recipientDesignation || "",
    recipientDepartment: quotation?.recipientDepartment || "",
    clientId: quotation?.clientId || "",
    client: quotation?.client || "",
    clientAddress: quotation?.clientAddress || "",
    clientGstin: quotation?.clientGstin || "",
    siteId: quotation?.siteId || "",
    subject: quotation?.subject || "",
    scope: quotation?.scope || "",
    introduction: quotation?.introduction || "",
    notes: quotation?.notes || "",
    terms: quotation?.terms || defaultTerms,
    gstType: quotation?.gstType || "SGST_CGST",
    validTill: defaultValidTill,
    bankAccountId: quotation?.bankAccountId || bankAccounts[0]?.id || "",
    riskLevel: quotation?.riskLevel || "NORMAL",
    riskReason: quotation?.riskReason || "",
    aiDrafted: quotation?.aiDrafted || false,
    includeSignature: quotation?.includeSignature ?? false,
    signatureAssetId: quotation?.signatureAssetId || defaultSignature,
  });

  const [items, setItems] = React.useState<EditorItem[]>(quotation?.items?.length ? quotation.items.map((item) => ({
    shortDescription: item.shortDescription || item.description,
    description: item.description,
    hsnCode: item.hsnCode || "",
    quantity: String(item.quantity), unit: item.unit || "Nos",
    secondaryQuantity: item.secondaryQuantity == null ? "" : String(item.secondaryQuantity), secondaryUnit: item.secondaryUnit || "",
    rate: String(item.rate), rateBasis: item.rateBasis || "", calculationMode: item.calculationMode as CalcMode,
  })) : [{ ...EMPTY_ITEM }]);

  const subtotal = items.reduce((sum, item) => sum + itemAmount(item), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const { run: save, loading: saving } = useAction(
    isEdit ? (input: Parameters<typeof createQuotation>[0]) => updateQuotation(quotation!.id, input) : createQuotation,
    { successMessage: isEdit ? "Quotation updated" : "Quotation created", onSuccess: (data) => router.push(`/quotations/${data.id}`) },
  );
  const { run: aiDraft, loading: drafting } = useAction(draftQuotationWithAI, {
    successMessage: "Smart quotation draft prepared",
    onSuccess: (draft) => {
      if (!draft) return;
      setForm((old) => ({ ...old, subject: draft.subject, introduction: draft.introduction, notes: draft.notes.join("\n"), terms: draft.terms.join("\n"), riskLevel: draft.riskLevel, riskReason: draft.riskReason || "", aiDrafted: true }));
      setItems((old) => old.map((item, index) => ({ ...item, description: draft.descriptions[index] || item.shortDescription || item.description })));
    },
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((old) => ({ ...old, [key]: value })); }
  function patchItem(index: number, patch: Partial<EditorItem>) { setItems((old) => old.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  function selectClient(id: string) {
    const client = clients.find((entry) => entry.id === id);
    setForm((old) => ({ ...old, clientId: id, client: client?.legalName || client?.name || old.client, clientAddress: client?.address || old.clientAddress, clientGstin: client?.gstin || old.clientGstin }));
  }

  function generateDraft() {
    const basicItems = items.filter((item) => item.shortDescription.trim() || item.description.trim());
    aiDraft({
      recipientDesignation: form.recipientDesignation || null,
      recipientDepartment: form.recipientDepartment || null,
      client: form.client,
      clientAddress: form.clientAddress || null,
      workBrief: form.scope,
      validDays: defaultValidityDays,
      items: basicItems.map((item) => ({ shortDescription: item.shortDescription || item.description, quantity: Number(item.quantity || 0), unit: item.unit || "Nos", secondaryQuantity: item.secondaryQuantity ? Number(item.secondaryQuantity) : null, secondaryUnit: item.secondaryUnit || null, rate: Number(item.rate || 0), rateBasis: item.rateBasis || null, calculationMode: item.calculationMode })),
    });
  }

  function submit() {
    save({
      date: new Date(form.date), recipientDesignation: form.recipientDesignation || null, recipientDepartment: form.recipientDepartment || null,
      clientId: form.clientId || null, client: form.client, clientAddress: form.clientAddress || null, clientGstin: form.clientGstin || null,
      subject: form.subject, scope: form.scope, introduction: form.introduction || null, notes: form.notes || null, terms: form.terms || null,
      aiDrafted: form.aiDrafted, riskLevel: form.riskLevel as "NORMAL" | "HIGH_RISK", riskReason: form.riskReason || null,
      gstType: form.gstType as "SGST_CGST" | "IGST", validTill: form.validTill ? new Date(form.validTill) : null,
      siteId: form.siteId || null, tenderId: presetTenderId || quotation?.tenderId || null, bankAccountId: form.bankAccountId || null,
      includeSignature: form.includeSignature, signatureAssetId: form.includeSignature && form.signatureAssetId ? form.signatureAssetId : null,
      items: items.map((item) => ({ shortDescription: item.shortDescription || null, description: item.description || item.shortDescription, hsnCode: item.hsnCode || "", quantity: Number(item.quantity || 0), unit: item.unit || "Nos", secondaryQuantity: item.secondaryQuantity ? Number(item.secondaryQuantity) : null, secondaryUnit: item.secondaryUnit || null, rate: Number(item.rate || 0), rateBasis: item.rateBasis || null, calculationMode: item.calculationMode })),
    });
  }

  const readyForAI = form.client.trim() && form.scope.trim().length >= 8 && items.some((item) => (item.shortDescription || item.description).trim());
  const readyToSave = form.client.trim() && form.subject.trim() && form.scope.trim() && items.every((item) => (item.description || item.shortDescription).trim() && Number(item.rate || 0) >= 0);

  return <div className="mx-auto max-w-[1450px] space-y-6 px-4 py-6 md:px-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><button onClick={() => router.back()} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"><ArrowLeft className="h-3.5 w-3.5"/> Back</button><h1 className="text-2xl font-bold text-slate-950">{isEdit ? "Edit Quotation" : "New Smart Quotation"}</h1><p className="mt-1 text-sm text-slate-500">Enter facts and rates. AI writes the subject, formal wording and detailed scope; financial values are never guessed.</p></div>
      <div className="flex gap-2">{canUseAI && <Button type="button" variant="outline" disabled={!readyForAI || drafting} loading={drafting} onClick={generateDraft}><Sparkles className="h-4 w-4"/> Generate with Free AI</Button>}<Button disabled={!readyToSave || saving} loading={saving} onClick={submit}><FileCheck2 className="h-4 w-4"/> {isEdit ? "Save Changes" : "Create Quotation"}</Button></div>
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card className="p-5"><div className="mb-4"><h2 className="font-semibold text-slate-950">1. Recipient & basic work details</h2><p className="text-xs text-slate-500">Only factual details. No preset SSNNL / Vikas / Ascent relation is assumed.</p></div><div className="grid gap-4 md:grid-cols-2">
          <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}/></div>
          <div><Label>Saved Client (optional)</Label><Select value={form.clientId} onValueChange={selectClient}><SelectTrigger><SelectValue placeholder="Select saved party"/></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>To / Designation</Label><Input value={form.recipientDesignation} onChange={(e) => set("recipientDesignation", e.target.value)} placeholder="The Deputy Executive Engineer"/></div>
          <div><Label>Department / Division</Label><Input value={form.recipientDepartment} onChange={(e) => set("recipientDepartment", e.target.value)} placeholder="K.S.A.N. Sub-Division No. 2/4.D"/></div>
          <div><Label>Organisation / Client *</Label><Input value={form.client} onChange={(e) => set("client", e.target.value)} placeholder="Sardar Sarovar Narmada Nigam Ltd."/></div>
          <div><Label>GSTIN (optional)</Label><Input value={form.clientGstin} onChange={(e) => set("clientGstin", e.target.value.toUpperCase())}/></div>
          <div className="md:col-span-2"><Label>Address / Place</Label><Textarea rows={2} value={form.clientAddress} onChange={(e) => set("clientAddress", e.target.value)} placeholder="Bhachau, Gujarat"/></div>
          <div><Label>Site (optional)</Label><Select value={form.siteId} onValueChange={(v) => set("siteId", v)}><SelectTrigger><SelectValue placeholder="No site selected"/></SelectTrigger><SelectContent>{sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Valid Till</Label><Input type="date" value={form.validTill} onChange={(e) => set("validTill", e.target.value)}/></div>
          <div className="md:col-span-2"><Label>Work Brief * <span className="text-xs font-normal text-slate-400">(write simple language; AI will formalise it)</span></Label><Textarea rows={3} value={form.scope} onChange={(e) => set("scope", e.target.value)} placeholder="Example: shifting of 5500 kW motor from PS-3 to PS-1 including loading, transportation, unloading and OEM supervision"/></div>
        </div></Card>

        <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">2. Work items, quantities & rates</h2><p className="text-xs text-slate-500">Supports normal Qty × Rate, MT × KM × Rate and fixed/lumpsum items.</p></div><Button variant="outline" size="sm" onClick={() => setItems((old) => [...old, { ...EMPTY_ITEM }])}><Plus className="h-4 w-4"/> Add Item</Button></div><div className="space-y-4">{items.map((item, index) => <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">ITEM {index + 1}</span>{items.length > 1 && <Button variant="ghost" size="icon" onClick={() => setItems((old) => old.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-red-500"/></Button>}</div><div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-7"><Label>Simple item detail *</Label><Input value={item.shortDescription} onChange={(e) => patchItem(index, { shortDescription: e.target.value, description: item.description || e.target.value })} placeholder="Loading of 5500 kW motor"/></div>
          <div className="md:col-span-5"><Label>Calculation</Label><Select value={item.calculationMode} onValueChange={(v) => patchItem(index, { calculationMode: v as CalcMode })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="QTY_RATE">Quantity × Rate</SelectItem><SelectItem value="QTY_SECONDARY_RATE">Qty 1 × Qty 2 × Rate</SelectItem><SelectItem value="FIXED">Fixed / Lumpsum</SelectItem></SelectContent></Select></div>
          <div className="md:col-span-2"><Label>Qty 1</Label><Input type="number" step="any" value={item.quantity} onChange={(e) => patchItem(index, { quantity: e.target.value })}/></div>
          <div className="md:col-span-2"><Label>Unit 1</Label><Input value={item.unit} onChange={(e) => patchItem(index, { unit: e.target.value })} placeholder="Nos / MT"/></div>
          {item.calculationMode === "QTY_SECONDARY_RATE" && <><div className="md:col-span-2"><Label>Qty 2</Label><Input type="number" step="any" value={item.secondaryQuantity} onChange={(e) => patchItem(index, { secondaryQuantity: e.target.value })}/></div><div className="md:col-span-2"><Label>Unit 2</Label><Input value={item.secondaryUnit} onChange={(e) => patchItem(index, { secondaryUnit: e.target.value })} placeholder="KM"/></div></>}
          <div className="md:col-span-2"><Label>Rate (₹)</Label><Input type="number" step="any" value={item.rate} onChange={(e) => patchItem(index, { rate: e.target.value })}/></div>
          <div className="md:col-span-2"><Label>Rate Basis</Label><Input value={item.rateBasis} onChange={(e) => patchItem(index, { rateBasis: e.target.value })} placeholder="Per MT / Job"/></div>
          <div className="md:col-span-8"><Label>Final description <span className="text-xs font-normal text-slate-400">(AI fills this; editable)</span></Label><Textarea rows={2} value={item.description} onChange={(e) => patchItem(index, { description: e.target.value })}/></div>
          <div className="md:col-span-2"><Label>HSN/SAC</Label><Input value={item.hsnCode} onChange={(e) => patchItem(index, { hsnCode: e.target.value })} placeholder="Optional"/></div>
          <div className="md:col-span-2"><Label>Amount</Label><div className="flex h-10 items-center rounded-md border bg-white px-3 text-sm font-semibold">{formatINR(itemAmount(item))}</div></div>
        </div></div>)}</div></Card>

        <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">3. AI-prepared quotation wording</h2><p className="text-xs text-slate-500">Everything remains editable before issue.</p></div>{form.aiDrafted && <Badge variant="success">AI Drafted</Badge>}</div><div className="space-y-4">
          <div><Label>Subject *</Label><Textarea rows={2} value={form.subject} onChange={(e) => set("subject", e.target.value)}/></div>
          <div><Label>Opening / Reference paragraph</Label><Textarea rows={4} value={form.introduction} onChange={(e) => set("introduction", e.target.value)}/></div>
          <div><Label>Notes <span className="text-xs font-normal text-slate-400">(one per line)</span></Label><Textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)}/></div>
          <div><Label>Terms & Conditions <span className="text-xs font-normal text-slate-400">(one per line)</span></Label><Textarea rows={5} value={form.terms} onChange={(e) => set("terms", e.target.value)}/></div>
        </div></Card>
      </div>

      <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Card className="p-5"><div className="mb-3 flex items-center gap-2"><Calculator className="h-4 w-4 text-blue-600"/><h3 className="font-semibold">Live Total</h3></div><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Sub Total</span><b>{formatINR(subtotal)}</b></div><div className="flex justify-between"><span className="text-slate-500">GST 18%</span><b>{formatINR(tax)}</b></div><div className="flex justify-between border-t pt-3 text-base"><span>Grand Total</span><b>{formatINR(total)}</b></div></div></Card>
        <Card className="p-5"><h3 className="mb-3 font-semibold">Issue Settings</h3><div className="space-y-4"><div><Label>GST Type</Label><Select value={form.gstType} onValueChange={(v) => set("gstType", v as typeof form.gstType)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="SGST_CGST">CGST + SGST</SelectItem><SelectItem value="IGST">IGST</SelectItem></SelectContent></Select></div><div><Label>Bank Account</Label><Select value={form.bankAccountId} onValueChange={(v) => set("bankAccountId", v)}><SelectTrigger><SelectValue placeholder="Select bank"/></SelectTrigger><SelectContent>{bankAccounts.map((bank) => <SelectItem key={bank.id} value={bank.id}>{bank.bankName} · {bank.accountNo}</SelectItem>)}</SelectContent></Select></div><div><Label>Digital signature + stamp</Label><Select value={form.includeSignature ? form.signatureAssetId || defaultSignature : "none"} onValueChange={(v) => setForm((old) => ({ ...old, includeSignature: v !== "none", signatureAssetId: v === "none" ? "" : v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No digital signature / stamp</SelectItem>{signatures.map((sig) => <SelectItem key={sig.id} value={sig.id}>{sig.name}{sig.isDefault ? " — Default" : ""}</SelectItem>)}</SelectContent></Select>{form.includeSignature && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700"><Stamp className="h-3.5 w-3.5" /> Combined signature + stamp will appear on the final PDF.</p>}</div></div></Card>
        <Card className={form.riskLevel === "HIGH_RISK" ? "border-amber-300 bg-amber-50 p-5" : "p-5"}><div className="flex items-start gap-3"><ShieldAlert className={form.riskLevel === "HIGH_RISK" ? "mt-0.5 h-5 w-5 text-amber-600" : "mt-0.5 h-5 w-5 text-emerald-600"}/><div><h3 className="font-semibold">Safety / Approval</h3><p className="mt-1 text-xs text-slate-600">{form.riskLevel === "HIGH_RISK" ? "This work is flagged as safety-critical. A different Owner must approve it before the quotation can be issued." : "Normal workflow. Owner approval is only triggered for configured high-risk/high-value work."}</p>{form.riskReason && <p className="mt-2 text-xs font-medium text-amber-800">Reason: {form.riskReason}</p>}</div></div></Card>
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900"><b>Cloud AI rule:</b> The ERP uses the configured cloud AI service. If its free quota is unavailable, the built-in smart drafting fallback still prepares a professional subject, opening, descriptions and terms.</div>
      </div>
    </div>
  </div>;
}
