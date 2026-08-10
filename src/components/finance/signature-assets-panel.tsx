"use client";

import * as React from "react";
import { CheckCircle2, ImagePlus, RefreshCcw, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAction } from "@/hooks/use-action";
import { addSignatureAsset, deleteSignatureAsset, replaceSignatureAsset, setDefaultSignatureAsset } from "@/lib/actions/finance-settings-actions";
import { uploadDocumentFile } from "@/lib/supabase/storage";
import { toast } from "@/lib/toast";

export type SignatureAssetItem = { id: string; name: string; imageUrl: string; previewUrl: string; isDefault: boolean; isActive: boolean };

function SignatureUploadDialog({ existing }: { existing?: SignatureAssetItem }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(existing?.name ?? "");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const { run: add, loading: adding } = useAction(addSignatureAsset, { successMessage: "Signature + stamp saved", onSuccess: () => setOpen(false) });
  const { run: replace, loading: replacing } = useAction(replaceSignatureAsset, { successMessage: "Signature + stamp updated", onSuccess: () => setOpen(false) });
  async function save() {
    if (!file) return toast.error("Select a signature + stamp image first.");
    setUploading(true);
    try {
      const uploaded = await uploadDocumentFile(file);
      if (existing) await replace(existing.id, { name: name.trim() || existing.name, imageUrl: uploaded.path });
      else await add({ name: name.trim() || "Combined Signature + Stamp", imageUrl: uploaded.path });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>{existing ? <Button size="sm" variant="outline"><RefreshCcw className="h-3.5 w-3.5" /> Replace</Button> : <Button><ImagePlus className="h-4 w-4" /> Add Signature + Stamp</Button>}</DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>{existing ? "Replace" : "Add"} combined signature + stamp</DialogTitle></DialogHeader>
      <div className="space-y-4"><div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Jaydipsinh — Owner" /></div><div className="space-y-1.5"><Label>Image</Label><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} /><p className="text-xs text-slate-500">Signature and round stamp stay together as one image. Transparent PNG is preferred.</p></div></div>
      <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button disabled={!file} loading={uploading || adding || replacing} onClick={save}>Save</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function SignatureAssetsPanel({ assets }: { assets: SignatureAssetItem[] }) {
  const { run: makeDefault } = useAction(setDefaultSignatureAsset, { successMessage: "Default signature updated" });
  const { run: remove } = useAction(deleteSignatureAsset, { successMessage: "Signature hidden from new documents" });
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Saved Signature + Stamp</p><p className="text-xs text-slate-500">Use no signature or choose one saved combined asset on each PO / quotation / invoice.</p></div><SignatureUploadDialog /></div>
    <div className="grid gap-3 md:grid-cols-2">{assets.map((asset)=><Card key={asset.id} className="p-4"><div className="flex gap-4"><div className="flex h-28 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-2"><img src={asset.previewUrl || asset.imageUrl} alt={asset.name} className="max-h-full max-w-full object-contain" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{asset.name}</p>{asset.isDefault && <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" />Default</Badge>}</div><div className="mt-4 flex flex-wrap gap-2"><SignatureUploadDialog existing={asset} />{!asset.isDefault && <Button size="sm" variant="outline" onClick={()=>makeDefault(asset.id)}><Star className="h-3.5 w-3.5" /> Default</Button>}<Button size="sm" variant="ghost" onClick={()=>remove(asset.id)}><Trash2 className="h-3.5 w-3.5" /> Hide</Button></div></div></div></Card>)}</div>
  </div>;
}
