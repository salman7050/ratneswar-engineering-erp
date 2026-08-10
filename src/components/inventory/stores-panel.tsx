"use client";

import * as React from "react";
import { Plus, Trash2, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { createStore, deleteStore } from "@/lib/actions/inventory-master-actions";
import { useAction } from "@/hooks/use-action";

interface Store {
  id: string; name: string; type: "CENTRAL" | "SITE"; site: { name: string } | null;
}

export function StoresPanel({ stores, sites }: { stores: Store[]; sites: { id: string; name: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", type: "CENTRAL", siteId: "" });

  const { run: add, loading } = useAction(createStore, { successMessage: "Store added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteStore, { successMessage: "Store removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Store</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Store</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5"><Label>Store Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Central Store — Rapar" /></div>
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CENTRAL">Central</SelectItem><SelectItem value="SITE">Site Store</SelectItem></SelectContent>
                </Select>
              </div>
              {form.type === "SITE" && (
                <div className="flex flex-col gap-1.5">
                  <Label>Site</Label>
                  <Select value={form.siteId} onValueChange={(v) => setForm({ ...form, siteId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} disabled={!form.name} onClick={() => add({ name: form.name, type: form.type as any, siteId: form.type === "SITE" ? form.siteId || null : null })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {stores.length === 0 ? <Muted className="text-xs">No stores yet — add a Central Store to start receiving stock.</Muted> : (
        <ul className="flex flex-col gap-2">
          {stores.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <Muted className="text-[11px]">{s.site?.name ?? "Central"}</Muted>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={s.type === "CENTRAL" ? "gold" : "outline"}>{s.type}</Badge>
                <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
