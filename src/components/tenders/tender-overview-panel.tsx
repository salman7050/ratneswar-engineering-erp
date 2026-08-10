"use client";

import * as React from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { updateTenderStatus, updateEmdStatus } from "@/lib/actions/tender-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate, formatINR } from "@/lib/utils";
import type { TenderDetail } from "@/lib/queries/tenders";

const EMD_TONE = { PENDING: "neutral", SUBMITTED: "info", REFUNDED: "success", FORFEITED: "destructive" } as const;

export function TenderOverviewPanel({ tender }: { tender: TenderDetail }) {
  const [wonOpen, setWonOpen] = React.useState(false);
  const [wonForm, setWonForm] = React.useState({ winningBidAmount: tender.estimatedValue.toString(), competitorNotes: "" });

  const { run: setStatus, loading: statusLoading } = useAction(updateTenderStatus, { successMessage: "Status updated" });
  const { run: setEmd } = useAction(updateEmdStatus, { successMessage: "EMD status updated" });

  function handleStatusChange(status: string) {
    if (status === "WON") { setWonOpen(true); return; }
    setStatus(tender.id, status as any);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div><Muted className="text-xs">Estimated Value</Muted><p className="tabular mt-1 font-mono font-semibold">{formatINR(tender.estimatedValue)}</p></div>
        <div><Muted className="text-xs">Department</Muted><p className="mt-1 font-medium">{tender.department}</p></div>
        <div><Muted className="text-xs">Submission Date</Muted><p className="mt-1 font-medium">{tender.submissionDate ? formatDate(tender.submissionDate) : "—"}</p></div>
        <div><Muted className="text-xs">Owner</Muted><p className="mt-1 font-medium">{tender.owner?.name ?? "Unassigned"}</p></div>
      </div>

      {tender.status === "WON" && tender.winningBidAmount !== null && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-gold/30 bg-brand-gold/[0.06] px-4 py-3">
          <Trophy className="h-5 w-5 text-brand-gold-light" />
          <div>
            <p className="text-sm font-semibold">Won at {formatINR(tender.winningBidAmount)}</p>
            {tender.competitorNotes && <Muted className="text-xs">{tender.competitorNotes}</Muted>}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Tender Status</Label>
          <Select value={tender.status} onValueChange={handleStatusChange}>
            <SelectTrigger disabled={statusLoading}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PREPARING">Preparing</SelectItem><SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="WON">Won</SelectItem><SelectItem value="LOST">Lost</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tender.emdAmount !== null && (
          <div className="flex flex-col gap-1.5">
            <Label>EMD Status — {formatINR(tender.emdAmount)}</Label>
            <div className="flex items-center gap-2">
              <Select value={tender.emdStatus} onValueChange={(v) => setEmd(tender.id, v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem><SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem><SelectItem value="FORFEITED">Forfeited</SelectItem>
                </SelectContent>
              </Select>
              <StatusChip tone={EMD_TONE[tender.emdStatus]}>{tender.emdStatus}</StatusChip>
            </div>
          </div>
        )}
      </div>

      {tender.notes && (
        <div>
          <Muted className="text-xs">Notes</Muted>
          <p className="mt-1 text-sm">{tender.notes}</p>
        </div>
      )}

      <Dialog open={wonOpen} onOpenChange={setWonOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Mark as Won</DialogTitle>
            <DialogDescription>Capture the winning bid amount for the record.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5"><Label>Winning Bid Amount (₹)</Label><Input type="number" value={wonForm.winningBidAmount} onChange={(e) => setWonForm({ ...wonForm, winningBidAmount: e.target.value })} /></div>
            <div className="flex flex-col gap-1.5"><Label>Competitor Notes (optional)</Label><Textarea value={wonForm.competitorNotes} onChange={(e) => setWonForm({ ...wonForm, competitorNotes: e.target.value })} placeholder="L1/L2 competitors, margins, etc." /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              variant="gold"
              loading={statusLoading}
              onClick={async () => {
                await setStatus(tender.id, "WON", { winningBidAmount: Number(wonForm.winningBidAmount), competitorNotes: wonForm.competitorNotes || null });
                setWonOpen(false);
              }}
            >
              Confirm Win
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
