"use client";

import * as React from "react";
import { Plus, Trash2, Package, Boxes, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import {
  TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { formatDate, formatINR } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { addMaterial, deleteMaterial, addInventoryItem, deleteInventoryItem, addAsset, deleteAsset, updateAssetStatus } from "@/lib/actions/site-resources-actions";
import type { SiteDetail } from "@/lib/queries/sites";

function MaterialsSection({ siteId, items }: { siteId: string; items: SiteDetail["materials"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", unit: "", quantity: "", ratePerUnit: "", receivedDate: "", supplier: "" });
  const { run: add, loading } = useAction(addMaterial, { successMessage: "Material added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteMaterial, { successMessage: "Removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Material</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Material Receipt</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Material Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="XLPE Cable 3C x 95 sq mm" /></div>
              <div className="flex flex-col gap-1.5"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="meter" /></div>
              <div className="flex flex-col gap-1.5"><Label>Rate / Unit (₹)</Label><Input type="number" value={form.ratePerUnit} onChange={(e) => setForm({ ...form, ratePerUnit: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Received Date</Label><Input type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Supplier (optional)</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => add({ siteId, name: form.name, unit: form.unit, quantity: Number(form.quantity), ratePerUnit: Number(form.ratePerUnit), receivedDate: new Date(form.receivedDate), supplier: form.supplier || null })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No material receipts logged.</Muted> : (
        <TableContainer>
          <Table>
            <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead>Received</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{m.name}<br /><Muted className="text-[11px]">{m.supplier}</Muted></TableCell>
                  <TableCell className="tabular font-mono text-sm">{Number(m.quantity)} {m.unit}</TableCell>
                  <TableCell className="tabular font-mono text-sm">{formatINR(Number(m.ratePerUnit))}</TableCell>
                  <TableCell className="text-sm">{formatDate(m.receivedDate)}</TableCell>
                  <TableCell><button onClick={() => remove(m.id, siteId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

function InventorySection({ siteId, items }: { siteId: string; items: SiteDetail["inventory"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", category: "", quantity: "", unit: "", minThreshold: "", location: "" });
  const { run: add, loading } = useAction(addInventoryItem, { successMessage: "Inventory item added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteInventoryItem, { successMessage: "Removed" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Item Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Spares" /></div>
              <div className="flex flex-col gap-1.5"><Label>Unit</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="nos" /></div>
              <div className="flex flex-col gap-1.5"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Min Threshold (optional)</Label><Input type="number" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Location (optional)</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Site store, Rack 3" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => add({ siteId, name: form.name, category: form.category, unit: form.unit, quantity: Number(form.quantity), minThreshold: form.minThreshold ? Number(form.minThreshold) : null, location: form.location || null })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No inventory items tracked.</Muted> : (
        <TableContainer>
          <Table>
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Category</TableHead><TableHead>Qty</TableHead><TableHead>Location</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {items.map((i) => {
                const low = i.minThreshold !== null && Number(i.quantity) <= Number(i.minThreshold);
                return (
                  <TableRow key={i.id}>
                    <TableCell className="text-sm">{i.name}</TableCell>
                    <TableCell><Badge variant="outline">{i.category}</Badge></TableCell>
                    <TableCell className={`tabular font-mono text-sm ${low ? "text-destructive font-semibold" : ""}`}>{Number(i.quantity)} {i.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.location ?? "—"}</TableCell>
                    <TableCell><button onClick={() => remove(i.id, siteId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

function AssetsSection({ siteId, items }: { siteId: string; items: SiteDetail["assets"] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", assetTag: "", category: "", purchaseDate: "", purchaseValue: "", status: "ACTIVE" });
  const { run: add, loading } = useAction(addAsset, { successMessage: "Asset added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteAsset, { successMessage: "Removed" });
  const { run: setStatus } = useAction(updateAssetStatus, { successMessage: "Status updated" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Asset</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Asset Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Portable DG Set 62.5 kVA" /></div>
              <div className="flex flex-col gap-1.5"><Label>Asset Tag</Label><Input value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} placeholder="RE-AST-014" /></div>
              <div className="flex flex-col gap-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Equipment" /></div>
              <div className="flex flex-col gap-1.5"><Label>Purchase Date (optional)</Label><Input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Purchase Value (₹, optional)</Label><Input type="number" value={form.purchaseValue} onChange={(e) => setForm({ ...form, purchaseValue: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => add({
                  siteId, name: form.name, assetTag: form.assetTag, category: form.category, status: "ACTIVE",
                  purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : null,
                  purchaseValue: form.purchaseValue ? Number(form.purchaseValue) : null,
                })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? <Muted className="text-xs">No assets tracked at this site.</Muted> : (
        <TableContainer>
          <Table>
            <TableHeader><TableRow><TableHead>Asset</TableHead><TableHead>Tag</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{a.name}</TableCell>
                  <TableCell className="font-mono text-xs">{a.assetTag}</TableCell>
                  <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                  <TableCell>
                    <Select value={a.status} onValueChange={(v) => setStatus(a.id, siteId, v as any)}>
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                        <SelectItem value="RETIRED">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><button onClick={() => remove(a.id, siteId)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export function ResourcesPanel({ siteId, site }: { siteId: string; site: SiteDetail }) {
  return (
    <Tabs defaultValue="materials">
      <TabsList>
        <TabsTrigger value="materials"><Package className="mr-1.5 h-3.5 w-3.5" /> Material</TabsTrigger>
        <TabsTrigger value="inventory"><Boxes className="mr-1.5 h-3.5 w-3.5" /> Inventory</TabsTrigger>
        <TabsTrigger value="assets"><HardDrive className="mr-1.5 h-3.5 w-3.5" /> Assets</TabsTrigger>
      </TabsList>
      <TabsContent value="materials"><MaterialsSection siteId={siteId} items={site.materials} /></TabsContent>
      <TabsContent value="inventory"><InventorySection siteId={siteId} items={site.inventory} /></TabsContent>
      <TabsContent value="assets"><AssetsSection siteId={siteId} items={site.assets} /></TabsContent>
    </Tabs>
  );
}
