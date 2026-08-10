"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Stamp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createPurchaseOrder, updatePurchaseOrder, submitForApproval } from "@/lib/actions/purchase-order-actions";
import { useAction } from "@/hooks/use-action";
import { POItemTable, emptyItem, type POItemDraft } from "./po-item-table";
import { toDateInput } from "./po-utils";
import type { PurchaseOrderDetail } from "@/lib/queries/purchase-orders";

interface Vendor {
  id: string; name: string; code: string | null; gstin: string | null; pan: string | null;
  address: string | null; email: string | null; phone: string | null; contactPerson: string | null;
}
export interface POSignatureOption { id: string; name: string; previewUrl: string; isDefault: boolean }

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <Card className="border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h3 className="text-sm font-semibold text-slate-900">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}</div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div></Card>;
}
function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return <div className={`flex flex-col gap-1.5 ${className ?? ""}`}><Label className="text-xs text-slate-600">{label}</Label>{children}</div>;
}

export function POForm({
  mode, po, sites, vendors, bankAccounts, signatures, defaultTerms, defaultDeliveryAddress,
}: {
  mode: "create" | "edit";
  po?: PurchaseOrderDetail;
  sites: { id: string; name: string }[];
  vendors: Vendor[];
  bankAccounts: { id: string; bankName: string; accountNo: string }[];
  signatures: POSignatureOption[];
  defaultTerms: string;
  defaultDeliveryAddress: string;
}) {
  const router = useRouter();
  const defaultSignature = signatures.find((s) => s.isDefault)?.id ?? signatures[0]?.id ?? "";
  const [form, setForm] = React.useState({
    date: toDateInput(po?.date) || toDateInput(new Date()),
    refNumber: po?.refNumber ?? "",
    quotationRef: po?.quotationRef ?? "",
    priority: po?.priority ?? "MEDIUM",
    projectName: po?.projectName ?? "",
    vendorId: po?.vendorId ?? "",
    vendorName: po?.vendorName ?? "",
    vendorCode: po?.vendorCode ?? "",
    vendorGstin: po?.vendorGstin ?? "",
    vendorPan: po?.vendorPan ?? "",
    vendorAddress: po?.vendorAddress ?? "",
    vendorEmail: po?.vendorEmail ?? "",
    vendorPhone: po?.vendorPhone ?? "",
    siteId: po?.siteId ?? "",
    deliveryAddress: po?.deliveryAddress ?? defaultDeliveryAddress,
    gstType: po?.gstType ?? "SGST_CGST",
    advancePercent: po?.advancePercent != null ? String(po.advancePercent) : "",
    creditDays: po?.creditDays != null ? String(po.creditDays) : "",
    paymentMethod: po?.paymentMethod ?? "",
    bankAccountId: po?.bankAccountId ?? "",
    specialInstructions: po?.specialInstructions ?? "",
    notes: po?.notes ?? "",
    terms: po?.terms ?? defaultTerms,
    includeSignature: po?.includeSignature ?? false,
    signatureAssetId: po?.signatureAssetId ?? defaultSignature,
  });

  const [items, setItems] = React.useState<POItemDraft[]>(po?.items?.length ? po.items.map((it) => ({
    key: it.id, itemCode: it.itemCode ?? "", description: it.description, hsnCode: it.hsnCode, unit: it.unit,
    quantity: String(it.quantity), rate: String(it.rate), discountPercent: "0", gstPercent: String(it.gstPercent), remarks: it.remarks ?? "",
  })) : [emptyItem()]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((f) => ({ ...f, [key]: value })); }
  function selectVendor(vendorId: string) {
    const v = vendors.find((x) => x.id === vendorId);
    if (!v) return set("vendorId", vendorId);
    setForm((f) => ({ ...f, vendorId, vendorName: v.name, vendorCode: v.code ?? "", vendorGstin: v.gstin ?? "", vendorPan: v.pan ?? "", vendorAddress: v.address ?? "", vendorEmail: v.email ?? "", vendorPhone: v.phone ?? "" }));
  }

  function buildPayload() {
    return {
      date: new Date(`${form.date}T12:00:00`), refNumber: form.refNumber || null, quotationRef: form.quotationRef || null,
      indentRef: null, department: null, raisedBy: null, priority: form.priority as any, projectName: form.projectName || null,
      vendorId: form.vendorId || null, vendorName: form.vendorName, vendorCode: form.vendorCode || null, vendorGstin: form.vendorGstin || null,
      vendorPan: form.vendorPan || null, vendorAddress: form.vendorAddress || null, vendorEmail: form.vendorEmail || null, vendorPhone: form.vendorPhone || null,
      vendorContactPerson: null,
      siteId: form.siteId || null, deliveryAddress: form.deliveryAddress || null, deliveryContactPerson: null, deliveryDate: null, expectedDelivery: null,
      gstType: form.gstType as any,
      advancePercent: form.advancePercent ? Number(form.advancePercent) : null, creditDays: form.creditDays ? Number(form.creditDays) : null,
      paymentMethod: form.paymentMethod || null, bankAccountId: form.bankAccountId || null,
      deliverySchedule: null, packing: null, transportation: null, insurance: null, warranty: null, inspectionTerms: null,
      specialInstructions: form.specialInstructions || null, notes: form.notes || null, terms: form.terms || null,
      includeSignature: form.includeSignature, signatureAssetId: form.includeSignature && form.signatureAssetId ? form.signatureAssetId : null,
      items: items.map((it) => ({ itemCode: it.itemCode || null, description: it.description, hsnCode: it.hsnCode, unit: it.unit || "Nos", quantity: Number(it.quantity) || 0, rate: Number(it.rate) || 0, discountPercent: 0, gstPercent: Number(it.gstPercent) || 0, remarks: it.remarks || null })),
    };
  }

  const { run: runCreate, loading: creating } = useAction(createPurchaseOrder, { successMessage: "Purchase order saved as draft", onSuccess: (created) => router.push(`/purchase-orders/${(created as { id: string }).id}`) });
  const { run: runUpdate, loading: updating } = useAction((payload: ReturnType<typeof buildPayload>) => updatePurchaseOrder(po!.id, payload), { successMessage: "Purchase order updated", onSuccess: () => router.push(`/purchase-orders/${po!.id}`) });
  const { run: runSubmit, loading: submitting } = useAction(submitForApproval, { successMessage: "Sent to Owner for approval", onSuccess: () => router.push(`/purchase-orders/${po!.id}`) });

  function save(e: React.FormEvent) { e.preventDefault(); mode === "create" ? runCreate(buildPayload()) : runUpdate(buildPayload()); }
  async function saveAndSubmit() { if (!po) return; await runUpdate(buildPayload()); runSubmit(po.id); }
  const busy = creating || updating || submitting;

  return <form onSubmit={save} className="flex flex-col gap-4 pb-24">
    <SectionCard title="Vendor" subtitle="Select a saved vendor or enter vendor details directly.">
      <Field label="Saved Vendor" className="lg:col-span-3"><Select value={form.vendorId || "manual"} onValueChange={(v) => v === "manual" ? set("vendorId", "") : selectVendor(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Enter manually</SelectItem>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Vendor Name *"><Input required value={form.vendorName} onChange={(e) => set("vendorName", e.target.value)} /></Field>
      <Field label="GSTIN"><Input value={form.vendorGstin} onChange={(e) => set("vendorGstin", e.target.value)} /></Field>
      <Field label="PAN"><Input value={form.vendorPan} onChange={(e) => set("vendorPan", e.target.value)} /></Field>
      <Field label="Phone"><Input value={form.vendorPhone} onChange={(e) => set("vendorPhone", e.target.value)} /></Field>
      <Field label="Email"><Input type="email" value={form.vendorEmail} onChange={(e) => set("vendorEmail", e.target.value)} /></Field>
      <Field label="Address" className="lg:col-span-3"><Textarea rows={2} value={form.vendorAddress} onChange={(e) => set("vendorAddress", e.target.value)} /></Field>
    </SectionCard>

    <SectionCard title="PO Details" subtitle="PO number is generated automatically as a unique 11-digit number.">
      <Field label="PO Date *"><Input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
      <Field label="Site / Project"><Select value={form.siteId || "none"} onValueChange={(v) => set("siteId", v === "none" ? "" : v)}><SelectTrigger><SelectValue placeholder="General purchase" /></SelectTrigger><SelectContent><SelectItem value="none">General purchase</SelectItem>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Priority"><Select value={form.priority} onValueChange={(v) => set("priority", v as typeof form.priority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="MEDIUM">Medium</SelectItem><SelectItem value="HIGH">High</SelectItem><SelectItem value="URGENT">Urgent</SelectItem></SelectContent></Select></Field>
      <Field label="Vendor Quotation / Reference"><Input value={form.quotationRef} onChange={(e) => set("quotationRef", e.target.value)} /></Field>
      <Field label="Other Reference"><Input value={form.refNumber} onChange={(e) => set("refNumber", e.target.value)} /></Field>
      <Field label="Subject / Work Description" className="lg:col-span-3"><Input value={form.projectName} onChange={(e) => set("projectName", e.target.value)} placeholder="e.g. Supply of 198kV 10kA Class 3 Porcelain Lightning Arrester" /></Field>
    </SectionCard>

    <Card className="border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h3 className="text-sm font-semibold text-slate-900">Items</h3><p className="mt-0.5 text-xs text-slate-500">No discount column. HSN/SAC is mandatory. GST is calculated at the bottom and Grand Total is inclusive of GST.</p></div><div className="w-full max-w-xs"><Label className="mb-1.5 block text-xs text-slate-600">GST Type</Label><Select value={form.gstType} onValueChange={(v) => set("gstType", v as typeof form.gstType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SGST_CGST">CGST + SGST</SelectItem><SelectItem value="IGST">IGST</SelectItem></SelectContent></Select></div></div><POItemTable items={items} onChange={setItems} /></Card>

    <SectionCard title="Commercial Terms" subtitle="Keep this short or write your own terms. Nothing is vendor-specific unless you type it.">
      <Field label="Advance %"><Input type="number" step="0.01" value={form.advancePercent} onChange={(e) => set("advancePercent", e.target.value)} /></Field>
      <Field label="Credit Days"><Input type="number" value={form.creditDays} onChange={(e) => set("creditDays", e.target.value)} /></Field>
      <Field label="Payment Method"><Input value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} placeholder="NEFT / RTGS / Advance" /></Field>
      <Field label="Delivery Address" className="lg:col-span-3"><Textarea rows={2} value={form.deliveryAddress} onChange={(e) => set("deliveryAddress", e.target.value)} /></Field>
      <Field label="Terms & Conditions" className="lg:col-span-3"><Textarea rows={5} value={form.terms} onChange={(e) => set("terms", e.target.value)} placeholder="One term per line. Fully editable." /></Field>
      <Field label="Special Instructions" className="lg:col-span-3"><Textarea rows={2} value={form.specialInstructions} onChange={(e) => set("specialInstructions", e.target.value)} /></Field>
      <Field label="Internal Notes" className="lg:col-span-3"><Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
      <Field label="Bank Account (optional)" className="lg:col-span-3"><Select value={form.bankAccountId || "none"} onValueChange={(v) => set("bankAccountId", v === "none" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not shown</SelectItem>{bankAccounts.map((b) => <SelectItem key={b.id} value={b.id}>{b.bankName} — {b.accountNo}</SelectItem>)}</SelectContent></Select></Field>
    </SectionCard>

    <SectionCard title="Digital Signature + Stamp" subtitle="Signature and round stamp are one combined asset. You can print with no digital signature or choose any saved asset.">
      <Field label="Signature on this PO" className="lg:col-span-3"><Select value={form.includeSignature ? form.signatureAssetId || defaultSignature : "none"} onValueChange={(v) => setForm((f) => ({ ...f, includeSignature: v !== "none", signatureAssetId: v === "none" ? "" : v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No digital signature / stamp</SelectItem>{signatures.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}{s.isDefault ? " — Default" : ""}</SelectItem>)}</SelectContent></Select>{form.includeSignature && <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700"><Stamp className="h-3.5 w-3.5" /> Selected combined signature + stamp will appear in the A4 PDF.</div>}</Field>
    </SectionCard>

    <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,.05)] backdrop-blur sm:-mx-6 sm:px-6"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" variant="outline" loading={creating || updating}><Save className="h-4 w-4" /> Save Draft</Button>{mode === "edit" && <Button type="button" loading={submitting} onClick={saveAndSubmit} disabled={busy}><Send className="h-4 w-4" /> Save & Send to Owner</Button>}</div>
  </form>;
}
