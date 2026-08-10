"use client";

import * as React from "react";
import { ImageOff, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Muted } from "@/components/ui/typography";
import { addSitePhoto, deleteSitePhoto } from "@/lib/actions/site-actions";
import { useAction } from "@/hooks/use-action";
import type { SiteDetail } from "@/lib/queries/sites";

export function PhotosPanel({ siteId, photos }: { siteId: string; photos: SiteDetail["photos"] }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [caption, setCaption] = React.useState("");

  const { run: add, loading } = useAction(addSitePhoto, {
    successMessage: "Photo added",
    onSuccess: () => { setOpen(false); setUrl(""); setCaption(""); },
  });
  const { run: remove } = useAction(deleteSitePhoto, { successMessage: "Photo removed" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Muted className="text-xs">
          {photos.length} photo{photos.length === 1 ? "" : "s"} · paste a URL until upload is wired up
        </Muted>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Photo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Photo</DialogTitle>
              <DialogDescription>Paste an image URL (Supabase Storage, Drive share link, etc).</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Image URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Caption (optional)</Label>
                <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Panel installation, block A" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} onClick={() => add({ siteId, url, caption: caption || null })}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <ImageOff className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No photos yet.</Muted>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              {p.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="truncate text-[11px] text-white">{p.caption}</p>
                </div>
              )}
              <button
                onClick={() => remove(p.id, siteId)}
                className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
