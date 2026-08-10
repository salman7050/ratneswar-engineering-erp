"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPinned, LogIn, LogOut, Navigation } from "lucide-react";
import { MissionPanel } from "@/components/dashboard/mission-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { createSiteVisit, checkInSiteVisit, checkOutSiteVisit } from "@/lib/actions/command-center-actions";
import { useAction } from "@/hooks/use-action";

interface SiteVisitRow {
  id: string;
  time: string;
  purpose: string;
  status: "PLANNED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  checkInAt: Date | string | null;
  checkOutAt: Date | string | null;
  site: { id: string; name: string };
}

const STATUS_TONE = { PLANNED: "neutral", CHECKED_IN: "info", CHECKED_OUT: "success", CANCELLED: "destructive" } as const;
const STATUS_LABEL = { PLANNED: "Planned", CHECKED_IN: "Checked In", CHECKED_OUT: "Checked Out", CANCELLED: "Cancelled" } as const;

function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 5000 }
    );
  });
}

export function SiteVisitsPanel({
  visits,
  sites,
  todayIso,
}: {
  visits: SiteVisitRow[];
  sites: { id: string; name: string }[];
  todayIso: string;
}) {
  return (
    <MissionPanel title="Today's Site Visits" tint="green" action={<CreateSiteVisitDialog sites={sites} defaultDate={todayIso} />}>
      {visits.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MapPinned className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No site visits planned for today.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visits.map((v) => (
            <SiteVisitRowItem key={v.id} visit={v} />
          ))}
        </div>
      )}
    </MissionPanel>
  );
}

function SiteVisitRowItem({ visit }: { visit: SiteVisitRow }) {
  const router = useRouter();
  const { run: runCheckIn, loading: checkingIn } = useAction(checkInSiteVisit, {
    successMessage: "Checked in",
    onSuccess: () => router.refresh(),
  });
  const { run: runCheckOut, loading: checkingOut } = useAction(checkOutSiteVisit, {
    successMessage: "Checked out",
    onSuccess: () => router.refresh(),
  });

  async function handleCheckIn() {
    const { lat, lng } = await getLocation();
    runCheckIn({ id: visit.id, lat, lng });
  }
  async function handleCheckOut() {
    const { lat, lng } = await getLocation();
    runCheckOut({ id: visit.id, lat, lng });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/20 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{visit.time}</span>
          <p className="truncate text-sm font-medium">{visit.site.name}</p>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{visit.purpose}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusChip tone={STATUS_TONE[visit.status]}>{STATUS_LABEL[visit.status]}</StatusChip>
        {visit.status === "PLANNED" && (
          <Button size="sm" variant="glass" loading={checkingIn} onClick={handleCheckIn}>
            <LogIn className="h-3.5 w-3.5" /> Check In
          </Button>
        )}
        {visit.status === "CHECKED_IN" && (
          <Button size="sm" variant="glass" loading={checkingOut} onClick={handleCheckOut}>
            <LogOut className="h-3.5 w-3.5" /> Check Out
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateSiteVisitDialog({ sites, defaultDate }: { sites: { id: string; name: string }[]; defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const emptyForm = { siteId: "", date: defaultDate, time: "09:00", purpose: "" };
  const [form, setForm] = React.useState(emptyForm);

  const { run, loading } = useAction(createSiteVisit, {
    successMessage: "Site visit planned",
    onSuccess: () => {
      setOpen(false);
      setForm(emptyForm);
      router.refresh();
    },
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({ siteId: form.siteId, date: new Date(form.date), time: form.time, purpose: form.purpose });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm"><Plus className="h-4 w-4" /> Site Visit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Plan a Site Visit</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Site</Label>
            <Select required value={form.siteId} onValueChange={(v) => set("siteId", v)}>
              <SelectTrigger><SelectValue placeholder="Select a site" /></SelectTrigger>
              <SelectContent>
                {sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Time</Label>
            <Input type="time" required value={form.time} onChange={(e) => set("time", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Purpose</Label>
            <Input required value={form.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="e.g. Transformer inspection" />
          </div>
          <DialogFooter className="sm:col-span-2">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>
              <Navigation className="h-3.5 w-3.5" /> Plan Visit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
