"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ShieldCheck, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createInvoice, updateInvoice } from "@/lib/actions/invoice-actions";
import { useAction } from "@/hooks/use-action";
import type { InvoiceDetail } from "@/lib/queries/invoices";

const CATEGORIES = [["O_AND_M", "O&M"], ["MAINTENANCE", "Maintenance"], ["TESTING", "KVI / KV Testing"], ["INSTALLATION", "Installation"], ["MATERIAL", "Material"], ["OTHER", "Other"]] as const;

type InvoiceLine = {
  workCategory: string;
  description: string;
  testingDescription: string;
  hsnCode: string;
  unit: string;
  quantity: string;
  rate: string;
  gstPercent: string;
};

const blankLine = (): InvoiceLine => ({ workCategory: "OTHER", description: "", testingDescription: "", hsnCode: "998717", unit: "Nos", quantity: "1", rate: "0", gstPercent: "18" });
const dateInput = (value: Date | string | null | undefined) => value ? new Date(value).toISOString().slice(0, 10) : "";

function InvoiceLines({ lines, onChange }: { lines: InvoiceLine[]; onChange: (lines: InvoiceLine[]) => void }) {
  function patch(index: number, key: keyof InvoiceLine, value: string) { onChange(lines.map((line, i) => i === index ? { ...line, [key]: value } : line)); }
  return <div className="flex flex-col gap-3">
    {lines.map((line, index) => <div key={index} className="rounded-xl border border-border bg-muted/25 p-3">
      <div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">ITEM {index + 1}</span>{lines.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => onChange(lines.filter((_, i) => i !== index))}>Remove</Button>}</div>
      <div className="grid gap-3 sm:grid-cols-6">
        <div className="sm:col-span-2"><Label>Work Type</Label><Select value={line.workCategory} onValueChange={(v) => patch(index, "workCategory", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="sm:col-span-4"><Label>Particulars / Description</Label><Textarea required value={line.description} onChange={(e) => patch(index, "description", e.target.value)} /></div>
        <div className="sm:col-span-6"><Label>KVI / KV Testing Description (optional extra column)</Label><Input value={line.testingDescription} onChange={(e) => patch(index, "testingDescription", e.target.value)} placeholder="Testing details and report reference" /></div>
        <div><Label>HSN/SAC</Label><Input value={line.hsnCode} onChange={(e) => patch(index, "hsnCode", e.target.value)} /></div>
        <div><Label>Unit</Label><Input value={line.unit} onChange={(e) => patch(index, "unit", e.target.value)} /></div>
        <div><Label>Quantity</Label><Input type="number" step="0.01" value={line.quantity} onChange={(e) => patch(index, "quantity", e.target.value)} /></div>
        <div><Label>Rate</Label><Input type="number" step="0.01" value={line.rate} onChange={(e) => patch(index, "rate", e.target.value)} /></div>
        <div><Label>GST %</Label><Input type="number" step="0.01" value={line.gstPercent} onChange={(e) => patch(index, "gstPercent", e.target.value)} /></div>
        <div className="flex items-end justify-end pb-2 text-sm font-bold">₹{(Number(line.quantity || 0) * Number(line.rate || 0)).toLocaleString("en-IN")}</div>
      </div>
    </div>)}
    <Button type="button" variant="outline" onClick={() => onChange([...lines, blankLine()])}><Plus /> Add Item</Button>
  </div>;
}

export function InvoiceFormDialog({
  invoice,
  suggestedNo,
  sites,
  bankAccounts,
  clients = [],
  subcontractors = [],
  signatures = [],
}: {
  invoice?: InvoiceDetail;
  suggestedNo: string;
  sites: { id: string; name: string; siteCode?: string | null; ownership?: string; clientId?: string | null; subcontractorId?: string | null; defaultDestination?: string | null; defaultPaymentTerms?: string | null; defaultTenderNo?: string | null; defaultBuyerOrderNo?: string | null; defaultBuyerOrderDate?: Date | string | null }[];
  bankAccounts: { id: string; bankName: string; accountNo: string }[];
  clients?: { id: string; name: string; legalName?: string | null; address?: string | null; gstin?: string | null; pan?: string | null }[];
  subcontractors?: { id: string; name: string; legalName?: string | null; address?: string | null; gstin?: string | null; pan?: string | null; bankName?: string | null; accountNo?: string | null; ifsc?: string | null; branch?: string | null }[];
  signatures?: { id: string; name: string; isDefault: boolean; previewUrl: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(invoice);
  const defaultSignature = signatures.find((entry) => entry.isDefault)?.id || signatures[0]?.id || "";
  const [partyChoice, setPartyChoice] = React.useState(invoice?.clientId ? `client:${invoice.clientId}` : "manual");
  const [form, setForm] = React.useState({
    date: dateInput(invoice?.date) || new Date().toISOString().slice(0, 10),
    dueDate: dateInput(invoice?.dueDate),
    invoiceType: invoice?.invoiceType ?? "STANDARD",
    billingMonth: invoice?.billingMonth ?? "",
    periodFrom: dateInput(invoice?.periodFrom),
    periodTo: dateInput(invoice?.periodTo),
    buyerName: invoice?.buyerName ?? "",
    buyerAddress: invoice?.buyerAddress ?? "",
    buyerGstin: invoice?.buyerGstin ?? "",
    buyerPan: invoice?.buyerPan ?? "",
    placeOfSupply: invoice?.placeOfSupply ?? "Gujarat",
    referenceNo: invoice?.referenceNo ?? "",
    referenceDate: dateInput(invoice?.referenceDate),
    poRefNo: invoice?.poRefNo ?? "",
    buyerOrderDate: dateInput(invoice?.buyerOrderDate),
    destination: invoice?.destination ?? "",
    tenderNo: invoice?.tenderNo ?? "",
    dispatchThrough: invoice?.dispatchThrough ?? "Service / Site Execution",
    paymentTerms: invoice?.paymentTerms ?? "Within 30 Days",
    termsOfDelivery: invoice?.termsOfDelivery ?? "As per approved scope of work and contract conditions.",
    remarks: invoice?.remarks ?? "",
    gstType: invoice?.gstType ?? "SGST_CGST",
    siteId: invoice?.siteId ?? "",
    clientId: invoice?.clientId ?? "",
    subcontractorId: invoice?.subcontractorId ?? "",
    billingContractId: invoice?.billingContractId ?? "",
    bankAccountId: invoice?.bankAccountId ?? bankAccounts[0]?.id ?? "",
    includeSignature: invoice?.includeSignature ?? false,
    signatureAssetId: invoice?.signatureAssetId || defaultSignature,
  });
  const [lines, setLines] = React.useState<InvoiceLine[]>(invoice?.items.map((item) => ({
    workCategory: item.workCategory,
    description: item.description,
    testingDescription: item.testingDescription ?? "",
    hsnCode: item.hsnCode,
    unit: item.unit,
    quantity: String(item.quantity),
    rate: String(item.rate),
    gstPercent: String(item.gstPercent),
  })) ?? [blankLine()]);

  const { run, loading } = useAction(
    isEdit ? (input: Parameters<typeof createInvoice>[0]) => updateInvoice(invoice!.id, input) : createInvoice,
    { successMessage: isEdit ? "Invoice updated" : "Invoice generated", onSuccess: (data) => { setOpen(false); router.push(`/invoices/${data?.id ?? invoice?.id}`); router.refresh(); } }
  );

  function chooseParty(value: string) {
    setPartyChoice(value);
    if (value.startsWith("client:")) {
      const id = value.slice(7);
      const party = clients.find((entry) => entry.id === id);
      setForm((current) => ({ ...current, clientId: id, buyerName: party?.legalName || party?.name || "", buyerAddress: party?.address || "", buyerGstin: party?.gstin || "", buyerPan: party?.pan || "" }));
    } else {
      setForm((current) => ({ ...current, clientId: "" }));
    }
  }
  function chooseIssuer(value: string) {
    if (value === "ratneswar") {
      setForm((current) => ({ ...current, subcontractorId: "", invoiceType: current.invoiceType === "SUBCONTRACT" ? "STANDARD" : current.invoiceType, bankAccountId: current.bankAccountId || bankAccounts[0]?.id || "" }));
    } else {
      setForm((current) => ({ ...current, subcontractorId: value, invoiceType: "SUBCONTRACT", bankAccountId: "", includeSignature: false, signatureAssetId: "" }));
    }
  }
  function chooseSite(id: string) {
    const site = sites.find((entry) => entry.id === id);
    const buyer = site?.clientId ? clients.find((entry) => entry.id === site.clientId) : null;
    setPartyChoice(site?.clientId ? `client:${site.clientId}` : partyChoice);
    setForm((current) => ({
      ...current,
      siteId: id,
      clientId: site?.clientId || current.clientId,
      buyerName: buyer ? (buyer.legalName || buyer.name) : current.buyerName,
      buyerAddress: buyer?.address || current.buyerAddress,
      buyerGstin: buyer?.gstin || current.buyerGstin,
      buyerPan: buyer?.pan || current.buyerPan,
      subcontractorId: site?.ownership === "SUBCONTRACT" ? (site.subcontractorId || current.subcontractorId) : "",
      invoiceType: site?.ownership === "SUBCONTRACT" ? "SUBCONTRACT" : (current.invoiceType === "SUBCONTRACT" ? "STANDARD" : current.invoiceType),
      bankAccountId: site?.ownership === "SUBCONTRACT" ? "" : (current.bankAccountId || bankAccounts[0]?.id || ""),
      includeSignature: site?.ownership === "SUBCONTRACT" ? false : current.includeSignature,
      signatureAssetId: site?.ownership === "SUBCONTRACT" ? "" : current.signatureAssetId,
      destination: current.destination || site?.defaultDestination || site?.name || "",
      paymentTerms: current.paymentTerms || site?.defaultPaymentTerms || "Within 30 Days",
      tenderNo: current.tenderNo || site?.defaultTenderNo || "",
      poRefNo: current.poRefNo || site?.defaultBuyerOrderNo || "",
      buyerOrderDate: current.buyerOrderDate || dateInput(site?.defaultBuyerOrderDate),
    }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    run({
      ...form,
      date: new Date(form.date),
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
      invoiceType: form.invoiceType as any,
      billingMonth: form.billingMonth || null,
      periodFrom: form.periodFrom ? new Date(form.periodFrom) : null,
      periodTo: form.periodTo ? new Date(form.periodTo) : null,
      referenceDate: form.referenceDate ? new Date(form.referenceDate) : null,
      buyerOrderDate: form.buyerOrderDate ? new Date(form.buyerOrderDate) : null,
      gstType: form.gstType as any,
      siteId: form.siteId || null,
      clientId: form.clientId || null,
      subcontractorId: form.subcontractorId || null,
      billingContractId: form.billingContractId || null,
      bankAccountId: form.bankAccountId || null,
      includeSignature: form.includeSignature,
      signatureAssetId: form.includeSignature && form.signatureAssetId ? form.signatureAssetId : null,
      tenderId: null,
      items: lines.map((line) => ({ workCategory: line.workCategory as any, description: line.description, testingDescription: line.testingDescription || null, hsnCode: line.hsnCode, unit: line.unit, quantity: Number(line.quantity), rate: Number(line.rate), gstPercent: Number(line.gstPercent) })),
    });
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{isEdit ? <Button variant="glass" size="sm"><Pencil /> Edit</Button> : <Button variant="gold"><Plus /> New Invoice</Button>}</DialogTrigger>
    <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
      <DialogHeader><DialogTitle>{isEdit ? "Edit Invoice" : "Generate Professional Invoice"}</DialogTitle><DialogDescription>Invoice number is generated securely on the server. Monthly, direct-client and subcontract invoices use the same tracked workflow.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2"><Label>Invoice Number</Label><div className="flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-3 font-mono text-sm"><ShieldCheck className="h-4 w-4 text-success" />{invoice?.invoiceNo ?? suggestedNo}</div></div>
          <div><Label>Invoice Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div><Label>Invoice Type</Label><Select value={form.invoiceType} onValueChange={(v) => setForm({ ...form, invoiceType: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STANDARD">Standard</SelectItem><SelectItem value="MONTHLY_SITE">Monthly Site</SelectItem><SelectItem value="SUBCONTRACT">Subcontract</SelectItem></SelectContent></Select></div>
          <div><Label>Billing Month</Label><Input type="month" value={form.billingMonth} onChange={(e) => setForm({ ...form, billingMonth: e.target.value })} /></div>
          <div><Label>Period From</Label><Input type="date" value={form.periodFrom} onChange={(e) => setForm({ ...form, periodFrom: e.target.value })} /></div>
          <div><Label>Period To</Label><Input type="date" value={form.periodTo} onChange={(e) => setForm({ ...form, periodTo: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Buyer / Bill To</Label><Select value={partyChoice} onValueChange={chooseParty}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual Buyer</SelectItem>{clients.map((party) => <SelectItem key={party.id} value={`client:${party.id}`}>Client — {party.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="sm:col-span-2"><Label>Site</Label><Select value={form.siteId} onValueChange={chooseSite}><SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger><SelectContent>{sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.siteCode ? `${site.siteCode} — ` : ""}{site.name}</SelectItem>)}</SelectContent></Select></div><div className="sm:col-span-2"><Label>Legal Invoice Issuer</Label><Select value={form.subcontractorId || "ratneswar"} onValueChange={chooseIssuer}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ratneswar">Ratneswar Engineering</SelectItem>{subcontractors.map((party) => <SelectItem key={party.id} value={party.id}>{party.legalName || party.name}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-[11px] text-slate-500">For SSNNL subcontract sites select Vikas / Ascent. Ratneswar branding will not appear on that invoice.</p></div>
          <div className="sm:col-span-2"><Label>Buyer Name</Label><Input required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} /></div>
          <div><Label>Buyer GSTIN</Label><Input value={form.buyerGstin} onChange={(e) => setForm({ ...form, buyerGstin: e.target.value.toUpperCase() })} /></div>
          <div><Label>Buyer PAN</Label><Input value={form.buyerPan} onChange={(e) => setForm({ ...form, buyerPan: e.target.value.toUpperCase() })} /></div>
          <div className="sm:col-span-4"><Label>Buyer Address</Label><Textarea value={form.buyerAddress} onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })} /></div>
        </div>

        <div className="rounded-xl border border-border bg-muted/25 p-4"><div className="mb-3 font-bold">Invoice References</div><div className="grid gap-3 sm:grid-cols-4">
          <div><Label>Reference No.</Label><Input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} /></div>
          <div><Label>Reference Date</Label><Input type="date" value={form.referenceDate} onChange={(e) => setForm({ ...form, referenceDate: e.target.value })} /></div>
          <div><Label>Buyer Order / PO No.</Label><Input value={form.poRefNo} onChange={(e) => setForm({ ...form, poRefNo: e.target.value })} /></div>
          <div><Label>Order Date</Label><Input type="date" value={form.buyerOrderDate} onChange={(e) => setForm({ ...form, buyerOrderDate: e.target.value })} /></div>
          <div><Label>Tender ID / No.</Label><Input value={form.tenderNo} onChange={(e) => setForm({ ...form, tenderNo: e.target.value })} /></div>
          <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
          <div><Label>Place of Supply</Label><Input value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} /></div>
          <div><Label>Dispatch Through</Label><Input value={form.dispatchThrough} onChange={(e) => setForm({ ...form, dispatchThrough: e.target.value })} /></div>
          <div><Label>Payment Terms</Label><Input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /></div>
          <div><Label>GST Type</Label><Select value={form.gstType} onValueChange={(v) => setForm({ ...form, gstType: v as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SGST_CGST">CGST + SGST</SelectItem><SelectItem value="IGST">IGST</SelectItem></SelectContent></Select></div>
          <div><Label>Bank Account</Label><Select value={form.bankAccountId} onValueChange={(v) => setForm({ ...form, bankAccountId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{bankAccounts.map((bank) => <SelectItem key={bank.id} value={bank.id}>{bank.bankName} — {bank.accountNo}</SelectItem>)}</SelectContent></Select></div><div><Label>Digital signature + stamp</Label><Select disabled={Boolean(form.subcontractorId)} value={form.includeSignature ? form.signatureAssetId || defaultSignature : "none"} onValueChange={(v) => setForm({ ...form, includeSignature: v !== "none", signatureAssetId: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No digital signature / stamp</SelectItem>{signatures.map((sig) => <SelectItem key={sig.id} value={sig.id}>{sig.name}{sig.isDefault ? " — Default" : ""}</SelectItem>)}</SelectContent></Select>{form.subcontractorId ? <p className="mt-1 text-[11px] text-amber-700">Third-party issuer: Ratneswar signature assets are disabled.</p> : form.includeSignature ? <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700"><Stamp className="h-3.5 w-3.5" /> Combined signature + stamp will be printed.</p> : null}</div>
          <div className="sm:col-span-4"><Label>Terms of Delivery / Work</Label><Textarea value={form.termsOfDelivery} onChange={(e) => setForm({ ...form, termsOfDelivery: e.target.value })} /></div>
        </div></div>

        <InvoiceLines lines={lines} onChange={setLines} />
        <div><Label>Remarks</Label><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" variant="gold" loading={loading}>{isEdit ? "Save Changes" : "Generate Invoice"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
