"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createGlobalAsset } from "@/lib/actions/inventory-assets-actions";
import { useAction } from "@/hooks/use-action";

export function GlobalAssetFormDialog({ sites }: { sites: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "", assetTag: "", category: "", location: "", siteId: "",
    purchaseDate: "", purchaseValue: "",
  });

  const { run, loading } = useAction(createGlobalAsset, {
    successMessage: "Asset added",
    onSuccess: () => { setOpen(false); router.refresh(); },
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="gold"><Plus /> New Asset</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Asset / Tool / Equipment</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 col-span-2"><Label>Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Portable DG Set 62.5 kVA" /></div>
          <div className="flex flex-col gap-1.5"><Label>Asset Tag</Label><Input value={form.assetTag} onChange={(e) => set("assetTag", e.target.value)} placeholder="RE-AST-021" /></div>
          <div className="flex flex-col gap-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Tool / Equipment / Vehicle" /></div>
          <div className="flex flex-col gap-1.5">
            <Label>Site (optional)</Label>
            <Select value={form.siteId} onValueChange={(v) => set("siteId", v)}>
              <SelectTrigger><SelectValue placeholder="Central Store" /></SelectTrigger>
              <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5"><Label>Location (optional)</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Central Store — Rapar" /></div>
          <div className="flex flex-col gap-1.5"><Label>Purchase Date (optional)</Label><Input type="date" value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>Purchase Value (₹, optional)</Label><Input type="number" value={form.purchaseValue} onChange={(e) => set("purchaseValue", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            variant="gold"
            loading={loading}
            disabled={!form.name || !form.assetTag}
            onClick={() => run({
              name: form.name, assetTag: form.assetTag, category: form.category, location: form.location || null,
              siteId: form.siteId || null, status: "ACTIVE",
              purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : null,
              purchaseValue: form.purchaseValue ? Number(form.purchaseValue) : null,
            })}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
