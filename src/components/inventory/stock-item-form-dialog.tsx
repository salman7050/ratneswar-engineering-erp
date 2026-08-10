"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStockItem, updateStockItem } from "@/lib/actions/inventory-master-actions";
import { useAction } from "@/hooks/use-action";

/** Structural type covering just the fields this form reads — works for both the list-row shape and the detail shape. */
interface EditableStockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  reorderLevel: number;
  standardRate: number | null;
}

export function StockItemFormDialog({
  item,
  suggestedSku,
}: {
  item?: EditableStockItem;
  suggestedSku: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(item);

  const [form, setForm] = React.useState({
    name: item?.name ?? "",
    sku: item?.sku ?? suggestedSku,
    category: item?.category ?? "",
    unit: item?.unit ?? "",
    reorderLevel: item?.reorderLevel?.toString() ?? "0",
    standardRate: item?.standardRate?.toString() ?? "",
  });

  const { run, loading } = useAction(
    isEdit ? (input: Parameters<typeof createStockItem>[0]) => updateStockItem(item!.id, input) : createStockItem,
    { successMessage: isEdit ? "Material updated" : "Material added", onSuccess: () => { setOpen(false); router.refresh(); } }
  );

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      ...form,
      reorderLevel: Number(form.reorderLevel),
      standardRate: form.standardRate ? Number(form.standardRate) : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? <Button variant="glass" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit</Button> : <Button variant="gold"><Plus /> New Material</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Material" : "Add Material"}</DialogTitle>
          <DialogDescription>SKU is encoded into the item&apos;s QR label — keep it unique.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 col-span-2"><Label>Material Name</Label><Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="XLPE Cable 3C x 95 sq mm" /></div>
          <div className="flex flex-col gap-1.5"><Label>SKU</Label><Input required value={form.sku} onChange={(e) => set("sku", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label>Category</Label><Input required value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Cables" /></div>
          <div className="flex flex-col gap-1.5"><Label>Unit</Label><Input required value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="meter" /></div>
          <div className="flex flex-col gap-1.5"><Label>Reorder Level</Label><Input type="number" value={form.reorderLevel} onChange={(e) => set("reorderLevel", e.target.value)} /></div>
          <div className="flex flex-col gap-1.5 col-span-2"><Label>Standard Rate (₹, optional)</Label><Input type="number" value={form.standardRate} onChange={(e) => set("standardRate", e.target.value)} /></div>
          <DialogFooter className="col-span-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>{isEdit ? "Save Changes" : "Add Material"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
