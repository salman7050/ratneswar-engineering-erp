"use client";

import * as React from "react";
import { ShieldCheck, ShieldQuestion, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import { requestTenderApproval, decideTenderApproval } from "@/lib/actions/tender-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate } from "@/lib/utils";
import type { TenderDetail } from "@/lib/queries/tenders";

const TONE = { NOT_REQUESTED: "neutral", PENDING: "warning", APPROVED: "success", REJECTED: "destructive" } as const;

export function TenderApprovalPanel({ tender }: { tender: TenderDetail }) {
  const [notes, setNotes] = React.useState("");
  const { run: request, loading: requesting } = useAction(requestTenderApproval, { successMessage: "Approval requested" });
  const { run: decide, loading: deciding } = useAction(decideTenderApproval, { successMessage: "Decision recorded" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tender.approvalStatus === "APPROVED" ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground"}`}>
          {tender.approvalStatus === "APPROVED" ? <ShieldCheck className="h-5 w-5" /> : <ShieldQuestion className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-semibold">Approval Status</p>
          <StatusChip tone={TONE[tender.approvalStatus]}>{tender.approvalStatus.replace("_", " ")}</StatusChip>
        </div>
      </div>

      {tender.approvedBy && (
        <Muted className="text-xs">
          {tender.approvalStatus === "APPROVED" ? "Approved" : "Reviewed"} by {tender.approvedBy.name}
          {tender.approvedAt ? ` on ${formatDate(tender.approvedAt)}` : ""}
          {tender.approvalNotes ? ` — ${tender.approvalNotes}` : ""}
        </Muted>
      )}

      {tender.approvalStatus === "NOT_REQUESTED" && (
        <Button variant="glass" size="sm" className="w-fit" loading={requesting} onClick={() => request(tender.id)}>
          Request Approval
        </Button>
      )}

      {tender.approvalStatus === "PENDING" && (
        <div className="flex flex-col gap-3 rounded-lg border border-warning/20 bg-warning/[0.05] p-4">
          <div className="flex flex-col gap-1.5">
            <Label>Decision Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reasoning for approval/rejection" />
          </div>
          <div className="flex gap-2">
            <Button variant="success" size="sm" loading={deciding} onClick={() => decide(tender.id, "APPROVED", notes || null)}>
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
            <Button variant="destructive" size="sm" loading={deciding} onClick={() => decide(tender.id, "REJECTED", notes || null)}>
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
