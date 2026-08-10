"use client";

import * as React from "react";
import { Plus, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Muted } from "@/components/ui/typography";
import { createVendor, deleteVendor } from "@/lib/actions/inventory-master-actions";
import { useAction } from "@/hooks/use-action";

interface Vendor {
  id: string; name: string; contactPerson: string | null; phone: string | null; email: string | null; gstin: string | null;
}

export function VendorsPanel({ vendors }: { vendors: Vendor[] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", contactPerson: "", phone: "", email: "", address: "", gstin: "" });

  const { run: add, loading } = useAction(createVendor, { successMessage: "Vendor added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteVendor, { successMessage: "Vendor removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Vendor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Vendor Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} disabled={!form.name} onClick={() => add(form)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {vendors.length === 0 ? <Muted className="text-xs">No vendors added yet.</Muted> : (
        <ul className="flex flex-col gap-2">
          {vendors.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{v.name}</p>
                  <Muted className="text-[11px]">{v.contactPerson}{v.phone ? ` · ${v.phone}` : ""}</Muted>
                </div>
              </div>
              <button onClick={() => remove(v.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
