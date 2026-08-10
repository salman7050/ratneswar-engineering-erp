"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createSite, updateSite } from "@/lib/actions/site-actions";
import { useAction } from "@/hooks/use-action";
import type { SiteListItem } from "@/lib/queries/sites";

const SITE_TYPES = [
  ["SUBSTATION", "Substation"], ["HYDRO", "Hydro"], ["PUMPING_STATION", "Pumping Station"],
  ["SOLAR", "Solar"], ["OM_CONTRACT", "O&M Contract"], ["EPC", "EPC"], ["OTHER", "Other"],
] as const;
const SITE_STATUSES = [["ACTIVE", "Active"], ["COMPLETED", "Completed"], ["ON_HOLD", "On Hold"]] as const;

function dateInput(value: Date | string | null | undefined) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }

export function SiteFormDialog({
  site,
  clients = [],
  subcontractors = [],
}: {
  site?: SiteListItem;
  clients?: { id: string; name: string }[];
  subcontractors?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(site);
  const [form, setForm] = React.useState({
    siteCode: site?.siteCode ?? "",
    name: site?.name ?? "",
    location: site?.location ?? "",
    latitude: site?.latitude?.toString() ?? "",
    longitude: site?.longitude?.toString() ?? "",
    type: site?.type ?? "PUMPING_STATION",
    client: site?.client ?? "",
    clientId: site?.clientId ?? "",
    ownership: site?.ownership ?? "DIRECT",
    subcontractorId: site?.subcontractorId ?? "",
    billingMode: site?.billingMode ?? "ON_DEMAND",
    monthlyBillingEnabled: site?.monthlyBillingEnabled ?? false,
    defaultDestination: site?.defaultDestination ?? "",
    defaultPaymentTerms: site?.defaultPaymentTerms ?? "Within 30 Days",
    defaultTenderNo: site?.defaultTenderNo ?? "",
    defaultBuyerOrderNo: site?.defaultBuyerOrderNo ?? "",
    defaultBuyerOrderDate: dateInput(site?.defaultBuyerOrderDate),
    notes: site?.notes ?? "",
    capacity: site?.capacity ?? "",
    status: site?.status ?? "ACTIVE",
    startDate: dateInput(site?.startDate),
    endDate: dateInput(site?.endDate),
  });
  const { run, loading } = useAction(
    isEdit ? (input: Parameters<typeof createSite>[0]) => updateSite(site!.id, input) : createSite,
    { successMessage: isEdit ? "Site updated" : "Site created", onSuccess: () => { setOpen(false); router.refresh(); } }
  );
  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function selectClient(id: string) {
    const selected = clients.find((client) => client.id === id);
    setForm((current) => ({ ...current, clientId: id, client: selected?.name ?? current.client }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    run({
      siteCode: form.siteCode || null,
      name: form.name,
      location: form.location,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      type: form.type as any,
      client: form.client,
      clientId: form.clientId || null,
      ownership: form.ownership as any,
      subcontractorId: form.ownership === "SUBCONTRACT" ? form.subcontractorId || null : null,
      billingMode: form.billingMode as any,
      monthlyBillingEnabled: form.billingMode === "MONTHLY" || form.monthlyBillingEnabled,
      defaultDestination: form.defaultDestination || null,
      defaultPaymentTerms: form.defaultPaymentTerms || null,
      defaultTenderNo: form.defaultTenderNo || null,
      defaultBuyerOrderNo: form.defaultBuyerOrderNo || null,
      defaultBuyerOrderDate: form.defaultBuyerOrderDate ? new Date(form.defaultBuyerOrderDate) : null,
      notes: form.notes || null,
      capacity: form.capacity || null,
      status: form.status as any,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{isEdit ? <Button variant="glass" size="sm"><Pencil /> Edit Site</Button> : <Button variant="gold"><Plus /> New Site</Button>}</DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Site" : "Create Site"}</DialogTitle><DialogDescription>Track direct Ratneswar execution and subcontract execution separately, with site-wise billing defaults.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Site Code</Label><Input value={form.siteCode} onChange={(e) => set("siteCode", e.target.value.toUpperCase())} placeholder="PS-1" /></div>
            <div className="sm:col-span-2"><Label>Site Name</Label><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="PS-1 SS" /></div>
            <div className="sm:col-span-3"><Label>Location</Label><Input required value={form.location} onChange={(e) => set("location", e.target.value)} /></div>
            <div><Label>Type</Label><Select value={form.type} onValueChange={(value) => set("type", value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SITE_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={(value) => set("status", value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SITE_STATUSES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Capacity</Label><Input value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="220 kV / 3.7 MW" /></div>
            <div><Label>Client Master</Label><Select value={form.clientId} onValueChange={selectClient}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="sm:col-span-2"><Label>Client Display Name</Label><Input required value={form.client} onChange={(e) => set("client", e.target.value)} placeholder="Client / billing party" /></div>
            <div><Label>Execution Type</Label><Select value={form.ownership} onValueChange={(value) => set("ownership", value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DIRECT">Directly Ratneswar</SelectItem><SelectItem value="SUBCONTRACT">Subcontract</SelectItem></SelectContent></Select></div>
            {form.ownership === "SUBCONTRACT" && <div className="sm:col-span-2"><Label>Subcontractor</Label><Select value={form.subcontractorId} onValueChange={(value) => set("subcontractorId", value)}><SelectTrigger><SelectValue placeholder="Select subcontractor" /></SelectTrigger><SelectContent>{subcontractors.map((party) => <SelectItem key={party.id} value={party.id}>{party.name}</SelectItem>)}</SelectContent></Select></div>}
            <div><Label>Billing Mode</Label><Select value={form.billingMode} onValueChange={(value) => set("billingMode", value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ON_DEMAND">On Demand</SelectItem><SelectItem value="MONTHLY">Monthly</SelectItem><SelectItem value="MILESTONE">Milestone</SelectItem></SelectContent></Select></div>
            <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
            <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></div>
          </div>

          <div className="rounded-xl border border-border bg-muted/25 p-4">
            <div className="mb-3 font-bold">Default Billing Metadata</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label>Destination</Label><Input value={form.defaultDestination} onChange={(e) => set("defaultDestination", e.target.value)} /></div>
              <div><Label>Payment Terms</Label><Input value={form.defaultPaymentTerms} onChange={(e) => set("defaultPaymentTerms", e.target.value)} /></div>
              <div><Label>Tender No.</Label><Input value={form.defaultTenderNo} onChange={(e) => set("defaultTenderNo", e.target.value)} /></div>
              <div><Label>Buyer Order No.</Label><Input value={form.defaultBuyerOrderNo} onChange={(e) => set("defaultBuyerOrderNo", e.target.value)} /></div>
              <div><Label>Buyer Order Date</Label><Input type="date" value={form.defaultBuyerOrderDate} onChange={(e) => set("defaultBuyerOrderDate", e.target.value)} /></div>
              <div><Label>Latitude / Longitude</Label><div className="grid grid-cols-2 gap-2"><Input value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="Lat" /><Input value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="Lng" /></div></div>
              <div className="sm:col-span-3"><Label>Site Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" variant="gold" loading={loading}>{isEdit ? "Save Changes" : "Create Site"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
