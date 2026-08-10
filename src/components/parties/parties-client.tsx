"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, HardHat, MoreHorizontal, Pencil, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAction } from "@/hooks/use-action";
import { createClient, createSubcontractor, setClientActive, setSubcontractorActive, updateClient, updateSubcontractor } from "@/lib/actions/billing-actions";

export interface PartyRecord {
  id: string; code: string | null; name: string; legalName: string | null; gstin: string | null; pan: string | null;
  address: string | null; email: string | null; phone: string | null; contactPerson: string | null; bankName?: string | null; accountNo?: string | null; ifsc?: string | null; branch?: string | null; isActive: boolean;
  _count?: { sites?: number; invoices?: number; billingContracts?: number };
}

type Form = { code: string; name: string; legalName: string; gstin: string; pan: string; address: string; email: string; phone: string; contactPerson: string; bankName: string; accountNo: string; ifsc: string; branch: string };
const blank: Form = { code: "", name: "", legalName: "", gstin: "", pan: "", address: "", email: "", phone: "", contactPerson: "", bankName: "", accountNo: "", ifsc: "", branch: "" };

export function PartyDialog({ type, party }: { type: "client" | "subcontractor"; party?: PartyRecord }) {
  const router = useRouter(); const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<Form>(party ? { code: party.code ?? "", name: party.name, legalName: party.legalName ?? "", gstin: party.gstin ?? "", pan: party.pan ?? "", address: party.address ?? "", email: party.email ?? "", phone: party.phone ?? "", contactPerson: party.contactPerson ?? "", bankName: party.bankName ?? "", accountNo: party.accountNo ?? "", ifsc: party.ifsc ?? "", branch: party.branch ?? "" } : blank);
  const action = async (payload: Form) => {
    if (party) return type === "client" ? updateClient(party.id, payload) : updateSubcontractor(party.id, payload);
    return type === "client" ? createClient(payload) : createSubcontractor(payload);
  };
  const { run, loading } = useAction(action, { successMessage: `${type === "client" ? "Client" : "Subcontractor"} saved`, onSuccess: () => { setOpen(false); router.refresh(); } });
  const set = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{party ? <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); }}><Pencil className="mr-2 h-4 w-4" />Edit details</DropdownMenuItem> : <Button><Plus className="h-4 w-4" /> Add {type === "client" ? "Client" : "Subcontractor"}</Button>}</DialogTrigger>
    <DialogContent className="max-w-2xl"><form onSubmit={(e) => { e.preventDefault(); run(form); }}>
      <DialogHeader><DialogTitle>{party ? "Edit" : "Add"} {type === "client" ? "Client" : "Subcontractor"}</DialogTitle><DialogDescription>Keep billing details accurate; these values auto-fill invoices, quotations and monthly contracts.</DialogDescription></DialogHeader>
      <div className="grid gap-4 py-5 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Code</Label><Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="Optional" /></div>
        <div className="space-y-1.5"><Label>Display Name</Label><Input required value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Legal Name</Label><Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} /></div>
        <div className="space-y-1.5"><Label>PAN</Label><Input value={form.pan} onChange={(e) => set("pan", e.target.value.toUpperCase())} /></div>
        <div className="space-y-1.5"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Billing Address</Label><Textarea rows={3} value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
        {type === "subcontractor" && <><div className="space-y-1.5"><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} /></div><div className="space-y-1.5"><Label>Account No.</Label><Input value={form.accountNo} onChange={(e) => set("accountNo", e.target.value)} /></div><div className="space-y-1.5"><Label>IFSC</Label><Input value={form.ifsc} onChange={(e) => set("ifsc", e.target.value.toUpperCase())} /></div><div className="space-y-1.5"><Label>Branch</Label><Input value={form.branch} onChange={(e) => set("branch", e.target.value)} /></div></>}
      </div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={loading}>Save</Button></DialogFooter>
    </form></DialogContent>
  </Dialog>;
}

export function PartyGrid({ type, records }: { type: "client" | "subcontractor"; records: PartyRecord[] }) {
  const router = useRouter();
  const toggleAction = async (id: string, isActive: boolean) => type === "client" ? setClientActive(id, isActive) : setSubcontractorActive(id, isActive);
  const { run: toggle, loading } = useAction(toggleAction, { successMessage: "Status updated", onSuccess: () => router.refresh() });
  if (!records.length) return <Card className="flex flex-col items-center gap-3 border-dashed p-12 text-center"><Building2 className="h-9 w-9 text-muted-foreground/40" /><p className="font-medium">No {type === "client" ? "clients" : "subcontractors"} added</p><p className="text-sm text-muted-foreground">Create the first master record to use it across sites and documents.</p></Card>;
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{records.map((p) => <Card key={p.id} className="group p-5 transition-shadow hover:shadow-md">
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="rounded-xl bg-primary/8 p-2.5 text-primary">{type === "client" ? <Building2 className="h-5 w-5" /> : <HardHat className="h-5 w-5" />}</div><div className="min-w-0"><h3 className="truncate font-semibold">{p.name}</h3><p className="truncate text-xs text-muted-foreground">{p.legalName || p.code || "No code"}</p></div></div>
      <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><PartyDialog type={type} party={p} /><DropdownMenuItem disabled={loading} onClick={() => toggle(p.id, !p.isActive)}><Power className="mr-2 h-4 w-4" />{p.isActive ? "Deactivate" : "Activate"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
    </div>
    <div className="mt-4 space-y-1.5 text-sm"><p><span className="text-muted-foreground">GSTIN:</span> {p.gstin || "—"}</p><p><span className="text-muted-foreground">Contact:</span> {p.contactPerson || p.phone || "—"}</p><p className="line-clamp-2 text-muted-foreground">{p.address || "No billing address"}</p></div>
    <div className="mt-4 flex items-center justify-between border-t pt-3"><Badge variant={p.isActive ? "success" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge><span className="text-xs text-muted-foreground">{p._count?.sites ?? 0} sites · {p._count?.billingContracts ?? 0} contracts</span></div>
  </Card>)}</div>;
}

export function PartiesClient({ clients, subcontractors }: { clients: PartyRecord[]; subcontractors: PartyRecord[] }) {
  return <Tabs defaultValue="clients" className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><TabsList><TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger><TabsTrigger value="subcontractors">Subcontractors ({subcontractors.length})</TabsTrigger></TabsList><div className="flex gap-2"><PartyDialog type="client" /><PartyDialog type="subcontractor" /></div></div><TabsContent value="clients"><PartyGrid type="client" records={clients} /></TabsContent><TabsContent value="subcontractors"><PartyGrid type="subcontractor" records={subcontractors} /></TabsContent></Tabs>;
}
