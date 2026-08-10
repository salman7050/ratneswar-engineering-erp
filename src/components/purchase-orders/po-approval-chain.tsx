"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { approveCurrentStage, rejectPurchaseOrder } from "@/lib/actions/purchase-order-actions";
import { useAction } from "@/hooks/use-action";
import { STAGE_SEQUENCE, APPROVAL_STAGE_LABEL } from "./po-utils";
import { cn } from "@/lib/utils";

interface ApprovalRow {
  id: string;
  stage: string;
  action: "APPROVED" | "REJECTED";
  comment: string | null;
  createdAt: Date | string;
  by: { id: string; name: string; role: string };
}

export function POApprovalChain({
  poId,
  status,
  approvalStage,
  approvals,
  userRole,
  canAct,
}: {
  poId: string;
  status: string;
  approvalStage: string;
  approvals: ApprovalRow[];
  userRole: string;
  canAct: boolean;
}) {
  const router = useRouter();
  const { run: runApprove, loading: approving } = useAction(approveCurrentStage, {
    successMessage: "Approved",
    onSuccess: () => router.refresh(),
  });

  const isPending = status === "PENDING_APPROVAL";
  const isRejected = status === "REJECTED";

  function stageState(stage: string): "done" | "current" | "upcoming" | "rejected" {
    const approval = approvals.find((a) => a.stage === stage);
    if (approval?.action === "REJECTED") return "rejected";
    if (approval?.action === "APPROVED") return "done";
    if (isPending && approvalStage === stage) return "current";
    return "upcoming";
  }

  const currentStageApprovable =
    isPending && STAGE_SEQUENCE.includes(approvalStage as any) && canAct;

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/10 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approval Chain</p>
        {status === "APPROVED" && (
          <span className="flex items-center gap-1 text-xs font-medium text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> Fully Approved
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {STAGE_SEQUENCE.map((stage, i) => {
          const state = stageState(stage);
          const approval = approvals.find((a) => a.stage === stage);
          return (
            <React.Fragment key={stage}>
              {i > 0 && <div className={cn("h-px flex-1", state === "upcoming" ? "bg-border" : "bg-brand-gold/40")} />}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    state === "done" && "border-success bg-success/15 text-success",
                    state === "current" && "border-brand-gold bg-brand-gold/15 text-brand-gold-light",
                    state === "upcoming" && "border-border text-muted-foreground",
                    state === "rejected" && "border-destructive bg-destructive/15 text-destructive"
                  )}
                >
                  {state === "done" ? <Check className="h-4 w-4" /> : state === "rejected" ? <X className="h-4 w-4" /> : state === "current" ? <Clock className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{APPROVAL_STAGE_LABEL[stage]}</span>
                {approval?.by.name && <span className="text-[10px] text-muted-foreground/70">{approval.by.name}</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {isRejected && (
        <div className="mt-4 rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-xs text-destructive">
          Rejected — see comment above for the reason.
        </div>
      )}

      {currentStageApprovable && (
        <div className="mt-4 flex justify-end gap-2">
          <RejectDialog poId={poId} />
          <Button size="sm" variant="gold" loading={approving} onClick={() => runApprove({ id: poId, comment: null })}>
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
        </div>
      )}
    </div>
  );
}

function RejectDialog({ poId }: { poId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const { run, loading } = useAction(rejectPurchaseOrder, {
    successMessage: "Purchase order rejected",
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><X className="h-3.5 w-3.5" /> Reject</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Reject Purchase Order</DialogTitle></DialogHeader>
        <Textarea
          autoFocus
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this being rejected?"
        />
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            variant="destructive"
            loading={loading}
            disabled={!reason.trim()}
            onClick={() => run({ id: poId, reason })}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
