"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CalendarDays, FilePlus2, Landmark, Plus, Wrench, Pencil, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAction } from "@/hooks/use-action";
import {
  createBillingContract,
  createClient,
  createSubcontractor,
  generateMonthlyInvoice,
  updateBillingContract,
} from "@/lib/actions/billing-actions";
import type { BillingCenterData } from "@/lib/queries/billing";
import { formatINR } from "@/lib/utils";

const CATEGORIES = [
  ["O_AND_M", "O&M"], ["MAINTENANCE", "Maintenance"], ["TESTING", "KVI / KV Testing"],
  ["INSTALLATION", "Installation"], ["MATERIAL", "Material"], ["OTHER", "Other"],
] as const;

type LineDraft = {
  category: "O_AND_M" | "MAINTENANCE" | "TESTING" | "INSTALLATION" | "MATERIAL" | "OTHER";
  description: string;
  testingDescription: string;
  hsnCode: string;
  unit: string;
  quantity: string;
  rate: string;
  gstPercent: string;
};

const emptyLine = (): LineDraft => ({
  category: "O_AND_M",
  description: "",
  testingDescription: "",
  hsnCode: "998717",
  unit: "Month",
  quantity: "1",
  rate: "0",
  gstPercent: "18",
});

function LineTemplateEditor({ lines, onChange }: { lines: LineDraft[]; onChange: (lines: LineDraft[]) => void }) {
  function patch(index: number, key: keyof LineDraft, value: string) {
    onChange(lines.map((line, i) => i === index ? { ...line, [key]: value } : line));
  }
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, index) => (
        <div key={index} className="rounded-xl border border-border bg-muted/25 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">LINE {index + 1}</span>
            {lines.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => onChange(lines.filter((_, i) => i !== index))}>Remove</Button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-6">
            <div className="sm:col-span-2"><Label>Category</Label><Select value={line.category} onValueChange={(v) => patch(index, "category", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="sm:col-span-4"><Label>Description</Label><Textarea required value={line.description} onChange={(e) => patch(index, "description", e.target.value)} placeholder="Monthly O&M / maintenance scope" /></div>
            <div className="sm:col-span-6"><Label>KVI / KV Testing Description (optional separate invoice column)</Label><Input value={line.testingDescription} onChange={(e) => patch(index, "testingDescription", e.target.value)} placeholder="Test details, equipment, report reference..." /></div>
            <div><Label>HSN/SAC</Label><Input value={line.hsnCode} onChange={(e) => patch(index, "hsnCode", e.target.value)} /></div>
            <div><Label>Unit</Label><Input value={line.unit} onChange={(e) => patch(index, "unit", e.target.value)} /></div>
            <div><Label>Qty</Label><Input type="number" step="0.01" value={line.quantity} onChange={(e) => patch(index, "quantity", e.target.value)} /></div>
            <div><Label>Rate</Label><Input type="number" step="0.01" value={line.rate} onChange={(e) => patch(index, "rate", e.target.value)} /></div>
            <div><Label>GST %</Label><Input type="number" step="0.01" value={line.gstPercent} onChange={(e) => patch(index, "gstPercent", e.target.value)} /></div>
            <div className="flex items-end justify-end text-sm font-semibold">₹{(Number(line.quantity || 0) * Number(line.rate || 0)).toLocaleString("en-IN")}</div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...lines, emptyLine()])}><Plus /> Add Billing Line</Button>
    </div>
  );
}

function PartyDialog({ type }: { type: "client" | "subcontractor" }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ code: "", name: "", legalName: "", gstin: "", pan: "", address: "", email: "", phone: "", contactPerson: "" });
  const action = type === "client" ? createClient : createSubcontractor;
  const { run, loading } = useAction(action as typeof createClient, {
    successMessage: type === "client" ? "Client added" : "Subcontractor added",
    onSuccess: () => { setOpen(false); router.refresh(); },
  });
  function submit(e: React.FormEvent) { e.preventDefault(); run(form); }
  const title = type === "client" ? "Add Client" : "Add Subcontractor";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Plus /> {title}</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>This master is independent from employee login access.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder={type === "client" ? "CLIENT-01" : "SUB-01"} /></div>
          <div><Label>Display Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Legal Name</Label><Input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} /></div>
          <div><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /></div>
          <div><Label>PAN</Label><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <DialogFooter className="sm:col-span-2"><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" variant="gold" loading={loading}>Save</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContractDialog({ data, contract }: { data: BillingCenterData; contract?: BillingCenterData["contracts"][number] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(contract);
  const [form, setForm] = React.useState({
    contractNo: contract?.contractNo ?? "",
    title: contract?.title ?? "",
    siteId: contract?.siteId ?? data.sites[0]?.id ?? "",
    billToType: contract?.billToType ?? "CLIENT",
    clientId: contract?.clientId ?? data.clients[0]?.id ?? "",
    subcontractorId: contract?.subcontractorId ?? data.subcontractors[0]?.id ?? "",
    startDate: contract?.startDate ? new Date(contract.startDate).toISOString().slice(0, 10) : "",
    endDate: contract?.endDate ? new Date(contract.endDate).toISOString().slice(0, 10) : "",
    paymentTerms: contract?.paymentTerms ?? "Within 30 Days",
    creditDays: String(contract?.creditDays ?? 30),
    cycleStartDay: String(contract?.cycleStartDay ?? 1),
    destination: contract?.destination ?? "",
    tenderNo: contract?.tenderNo ?? "",
    buyerOrderNo: contract?.buyerOrderNo ?? "",
    buyerOrderDate: contract?.buyerOrderDate ? new Date(contract.buyerOrderDate).toISOString().slice(0, 10) : "",
    gstType: contract?.gstType ?? "SGST_CGST",
    notes: contract?.notes ?? "",
  });
  const [lines, setLines] = React.useState<LineDraft[]>(contract?.lineTemplates.map((line) => ({
    category: line.category,
    description: line.description,
    testingDescription: line.testingDescription ?? "",
    hsnCode: line.hsnCode,
    unit: line.unit,
    quantity: String(line.quantity),
    rate: String(line.rate),
    gstPercent: String(line.gstPercent),
  })) ?? [emptyLine()]);

  const action = isEdit ? (input: Parameters<typeof createBillingContract>[0]) => updateBillingContract(contract!.id, input) : createBillingContract;
  const { run, loading } = useAction(action, { successMessage: isEdit ? "Billing contract updated" : "Billing contract created", onSuccess: () => { setOpen(false); router.refresh(); } });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      ...form,
      billToType: "CLIENT",
      clientId: form.clientId || null,
      subcontractorId: form.subcontractorId || null,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      buyerOrderDate: form.buyerOrderDate ? new Date(form.buyerOrderDate) : null,
      creditDays: Number(form.creditDays),
      cycleStartDay: Number(form.cycleStartDay),
      gstType: form.gstType as "SGST_CGST" | "IGST",
      lines: lines.map((line) => ({ ...line, quantity: Number(line.quantity), rate: Number(line.rate), gstPercent: Number(line.gstPercent), testingDescription: line.testingDescription || null })),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{isEdit ? <Button size="sm" variant="ghost"><Pencil /> Edit</Button> : <Button variant="gold"><Plus /> New Billing Contract</Button>}</DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Billing Contract" : "Create Monthly Billing Contract"}</DialogTitle><DialogDescription>Select the actual buyer and, for subcontract sites, the legal invoice issuer. Each site can keep its own monthly billing-cycle start day.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Contract / Reference No.</Label><Input value={form.contractNo} onChange={(e) => setForm({ ...form, contractNo: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Contract Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Site</Label><Select value={form.siteId} onValueChange={(v) => setForm({ ...form, siteId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{data.sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.siteCode ? `${site.siteCode} — ` : ""}{site.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Actual Buyer / Bill To</Label><Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v, billToType: "CLIENT" })}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{data.clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Legal Invoice Issuer</Label><Select value={form.subcontractorId || "ratneswar"} onValueChange={(v) => setForm({ ...form, subcontractorId: v === "ratneswar" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ratneswar">Ratneswar Engineering (direct)</SelectItem>{data.subcontractors.map((party) => <SelectItem key={party.id} value={party.id}>{party.legalName || party.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            <div><Label>Credit Days</Label><Input type="number" value={form.creditDays} onChange={(e) => setForm({ ...form, creditDays: e.target.value })} /></div><div><Label>Billing Cycle Starts On</Label><Input type="number" min="1" max="28" value={form.cycleStartDay} onChange={(e) => setForm({ ...form, cycleStartDay: e.target.value })} /><p className="mt-1 text-[10px] text-muted-foreground">Example 23 = 23rd to 22nd next month.</p></div>
            <div><Label>Payment Terms</Label><Input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /></div>
            <div><Label>GST Type</Label><Select value={form.gstType} onValueChange={(v) => setForm({ ...form, gstType: v as "SGST_CGST" | "IGST" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SGST_CGST">CGST + SGST</SelectItem><SelectItem value="IGST">IGST</SelectItem></SelectContent></Select></div>
            <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
            <div><Label>Tender No.</Label><Input value={form.tenderNo} onChange={(e) => setForm({ ...form, tenderNo: e.target.value })} /></div>
            <div><Label>Buyer Order No.</Label><Input value={form.buyerOrderNo} onChange={(e) => setForm({ ...form, buyerOrderNo: e.target.value })} /></div>
            <div><Label>Buyer Order Date</Label><Input type="date" value={form.buyerOrderDate} onChange={(e) => setForm({ ...form, buyerOrderDate: e.target.value })} /></div>
            <div className="sm:col-span-3"><Label>Internal Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div><div className="mb-2 text-sm font-bold">Monthly Invoice Lines & Site-wise Rates</div><LineTemplateEditor lines={lines} onChange={setLines} /></div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" variant="gold" loading={loading}>Save Contract</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MonthlyInvoiceDialog({ data }: { data: BillingCenterData }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [contractId, setContractId] = React.useState(data.contracts[0]?.id ?? "");
  const [billingMonth, setBillingMonth] = React.useState(new Date().toISOString().slice(0, 7));
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const contract = data.contracts.find((item) => item.id === contractId);
  const [lines, setLines] = React.useState<LineDraft[]>([]);

  React.useEffect(() => {
    if (!contract) return;
    setLines(contract.lineTemplates.map((line) => ({
      category: line.category,
      description: line.description,
      testingDescription: line.testingDescription ?? "",
      hsnCode: line.hsnCode,
      unit: line.unit,
      quantity: String(line.quantity),
      rate: String(line.rate),
      gstPercent: String(line.gstPercent),
    })));
  }, [contractId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { run, loading } = useAction(generateMonthlyInvoice, {
    successMessage: "Monthly invoice generated",
    onSuccess: (invoice) => { setOpen(false); router.push(`/invoices/${invoice.id}`); router.refresh(); },
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({ contractId, billingMonth, date: new Date(date), lines: lines.map((line) => ({ ...line, quantity: Number(line.quantity), rate: Number(line.rate), gstPercent: Number(line.gstPercent), testingDescription: line.testingDescription || null })) });
  }
  const total = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.rate || 0) * (1 + Number(line.gstPercent || 0) / 100), 0);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="default"><FilePlus2 /> Generate Monthly Invoice</Button></DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader><DialogTitle>Generate Monthly Site Invoice</DialogTitle><DialogDescription>Select the site contract. The manually selected billing party, PO/tender fields and descriptions will fill automatically.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2"><Label>Billing Contract / Site</Label><Select value={contractId} onValueChange={setContractId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{data.contracts.map((item) => <SelectItem key={item.id} value={item.id}>{item.site.siteCode ? `${item.site.siteCode} — ` : ""}{item.title} → {item.client?.name ?? item.subcontractor?.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Invoice Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Billing Month</Label><Input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} /></div>
            <div className="sm:col-span-2 rounded-lg bg-muted/40 px-4 py-3 text-sm"><b>Invoice To:</b> {contract?.client?.legalName || contract?.client?.name || contract?.subcontractor?.legalName || contract?.subcontractor?.name || "—"}<br /><span className="text-muted-foreground">Number is generated automatically and cannot be guessed or manually edited.</span></div>
          </div>
          <LineTemplateEditor lines={lines} onChange={setLines} />
          <div className="flex justify-end rounded-xl bg-primary px-5 py-4 text-primary-foreground"><div className="text-right"><div className="text-xs opacity-70">Estimated total including GST</div><div className="text-2xl font-black">{formatINR(total)}</div></div></div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" variant="gold" loading={loading}>Generate Invoice</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type BillingCapabilities = { create: boolean; edit: boolean };

export function BillingCenter({ data, capabilities }: { data: BillingCenterData; capabilities: BillingCapabilities }) {
  return (
    <div className="flex flex-col gap-6">
      {capabilities.create && <div className="flex flex-wrap gap-2">
        {capabilities.create && <MonthlyInvoiceDialog data={data} />}
        {capabilities.create && <ContractDialog data={data} />}
        {capabilities.create && <PartyDialog type="client" />}
        {capabilities.create && <PartyDialog type="subcontractor" />}
      </div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><div className="flex items-center justify-between"><div><div className="text-xs font-bold uppercase text-muted-foreground">Direct Sites</div><div className="mt-2 text-3xl font-black">{data.summary.directSites}</div></div><Landmark className="h-8 w-8 text-primary/60" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><div className="text-xs font-bold uppercase text-muted-foreground">Subcontract Sites</div><div className="mt-2 text-3xl font-black">{data.summary.subcontractSites}</div></div><Wrench className="h-8 w-8 text-primary/60" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><div className="text-xs font-bold uppercase text-muted-foreground">Monthly Contracts</div><div className="mt-2 text-3xl font-black">{data.summary.monthlyContracts}</div></div><CalendarDays className="h-8 w-8 text-primary/60" /></div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><div><div className="text-xs font-bold uppercase text-muted-foreground">Pending This Month</div><div className="mt-2 text-3xl font-black">{data.summary.uninvoicedThisMonth}</div></div><ReceiptText className="h-8 w-8 text-primary/60" /></div></Card>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList><TabsTrigger value="contracts">Site Billing Contracts</TabsTrigger><TabsTrigger value="sites">Direct / Subcontract Sites</TabsTrigger><TabsTrigger value="masters">Client Masters</TabsTrigger><TabsTrigger value="invoices">Recent Monthly Invoices</TabsTrigger></TabsList>
        <TabsContent value="contracts">
          <TableContainer><Table><TableHeader><TableRow><TableHead>Site / Contract</TableHead><TableHead>Billing Party</TableHead><TableHead>Type</TableHead><TableHead>Lines</TableHead><TableHead>Last Invoice</TableHead><TableHead /></TableRow></TableHeader><TableBody>{data.contracts.map((contract) => <TableRow key={contract.id}><TableCell><div className="font-semibold">{contract.site.siteCode ? `${contract.site.siteCode} — ` : ""}{contract.site.name}</div><div className="text-xs text-muted-foreground">{contract.contractNo || contract.title}</div></TableCell><TableCell>{contract.client?.name ?? contract.subcontractor?.name ?? "—"}</TableCell><TableCell><Badge variant={contract.billToType === "CLIENT" ? "success" : "info"}>{contract.billToType === "CLIENT" ? "DIRECT" : "SUBCONTRACT"}</Badge></TableCell><TableCell>{contract.lineTemplates.length}</TableCell><TableCell>{contract.invoices[0] ? <Link className="font-mono text-xs text-primary underline" href={`/invoices/${contract.invoices[0].id}`}>{contract.invoices[0].invoiceNo}</Link> : "Not generated"}</TableCell><TableCell className="text-right">{capabilities.edit && <ContractDialog data={data} contract={contract} />}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
        </TabsContent>
        <TabsContent value="sites">
          <TableContainer><Table><TableHeader><TableRow><TableHead>Site</TableHead><TableHead>Client</TableHead><TableHead>Execution</TableHead><TableHead>Subcontractor</TableHead><TableHead>Billing</TableHead><TableHead>Invoices</TableHead></TableRow></TableHeader><TableBody>{data.sites.map((site) => <TableRow key={site.id}><TableCell><Link href={`/sites/${site.id}`} className="font-semibold hover:underline">{site.siteCode ? `${site.siteCode} — ` : ""}{site.name}</Link><div className="text-xs text-muted-foreground">{site.location}</div></TableCell><TableCell>{site.clientAccount?.name ?? site.client}</TableCell><TableCell><Badge variant={site.ownership === "DIRECT" ? "success" : "info"}>{site.ownership}</Badge></TableCell><TableCell>{site.subcontractor?.name ?? "—"}</TableCell><TableCell>{site.monthlyBillingEnabled ? "Monthly" : site.billingMode}</TableCell><TableCell>{site._count.invoices}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
        </TabsContent>
        <TabsContent value="masters"><div className="grid gap-4 lg:grid-cols-2"><Card className="p-5"><div className="mb-4 flex items-center gap-2 font-bold"><Building2 /> Clients</div>{data.clients.map((client) => <div key={client.id} className="border-t py-3"><div className="font-semibold">{client.name}</div><div className="text-xs text-muted-foreground">{client.gstin || "No GSTIN"} · {client.contactPerson || "No contact"}</div></div>)}</Card><Card className="p-5"><div className="mb-4 flex items-center gap-2 font-bold"><Wrench /> Subcontractors</div>{data.subcontractors.map((party) => <div key={party.id} className="border-t py-3"><div className="font-semibold">{party.name}</div><div className="text-xs text-muted-foreground">{party.gstin || "No GSTIN"} · {party.contactPerson || "No contact"}</div></div>)}</Card></div></TabsContent>
        <TabsContent value="invoices"><TableContainer><Table><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Site</TableHead><TableHead>Month</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{data.recentInvoices.map((invoice) => <TableRow key={invoice.id}><TableCell><Link href={`/invoices/${invoice.id}`} className="font-mono text-xs font-semibold text-primary underline">{invoice.invoiceNo}</Link></TableCell><TableCell>{invoice.site?.siteCode || invoice.site?.name || "—"}</TableCell><TableCell>{invoice.billingMonth || "—"}</TableCell><TableCell>{invoice.invoiceType.replace("_", " ")}</TableCell><TableCell><Badge variant={invoice.status === "PAID" ? "success" : "outline"}>{invoice.status}</Badge></TableCell><TableCell className="text-right font-mono">{formatINR(invoice.grandTotal)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></TabsContent>
      </Tabs>
    </div>
  );
}
