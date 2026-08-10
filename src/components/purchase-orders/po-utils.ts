export const PO_STATUS_META: Record<string, { label: string; tone: "neutral" | "info" | "warning" | "success" | "destructive"; dot: string }> = {
  DRAFT: { label: "Draft", tone: "neutral", dot: "bg-muted-foreground" },
  PENDING_APPROVAL: { label: "Pending Approval", tone: "warning", dot: "bg-warning" },
  APPROVED: { label: "Approved", tone: "info", dot: "bg-info" },
  ISSUED: { label: "Issued", tone: "info", dot: "bg-brand-gold" },
  PARTIALLY_RECEIVED: { label: "Partially Received", tone: "warning", dot: "bg-warning" },
  COMPLETED: { label: "Completed", tone: "success", dot: "bg-success" },
  CANCELLED: { label: "Cancelled", tone: "destructive", dot: "bg-destructive" },
  REJECTED: { label: "Rejected", tone: "destructive", dot: "bg-destructive" },
};

export const PO_PRIORITY_META: Record<string, { label: string; dot: string }> = {
  LOW: { label: "Low", dot: "bg-muted-foreground" },
  MEDIUM: { label: "Medium", dot: "bg-info" },
  HIGH: { label: "High", dot: "bg-warning" },
  URGENT: { label: "Urgent", dot: "bg-destructive" },
};

export const APPROVAL_STAGE_LABEL: Record<string, string> = {
  NONE: "Not submitted",
  ENGINEER: "Legacy Engineer Stage",
  MANAGER: "Legacy Approval Stage",
  OWNER: "Owner",
  DONE: "Fully Approved",
};

export const STAGE_SEQUENCE = ["OWNER"] as const;

export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}
