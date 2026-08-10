export const PRIORITY_META: Record<string, { label: string; dot: string; text: string }> = {
  LOW: { label: "Low", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  MEDIUM: { label: "Medium", dot: "bg-info", text: "text-info" },
  HIGH: { label: "High", dot: "bg-warning", text: "text-warning" },
  URGENT: { label: "Urgent", dot: "bg-destructive", text: "text-destructive" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  SITE_VISIT: "Site Visit",
  INVOICE: "Invoice",
  QUOTATION: "Quotation",
  TENDER: "Tender",
  FOLLOW_UP: "Follow-up",
  MATERIAL_ORDER: "Material Order",
  MEETING: "Meeting",
  DOCUMENTATION: "Documentation",
  MAINTENANCE: "Maintenance",
  ADMIN: "Admin",
  OTHER: "Other",
};

export const TASK_STATUS_META: Record<string, { label: string; tone: "neutral" | "info" | "warning" | "success" | "destructive" }> = {
  PENDING: { label: "Pending", tone: "neutral" },
  IN_PROGRESS: { label: "In Progress", tone: "info" },
  WAITING: { label: "Waiting", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "destructive" },
};

export const FOLLOW_UP_TYPE_LABELS: Record<string, string> = {
  CALL_VENDOR: "Call Vendor",
  CALL_CLIENT: "Call Client",
  PAYMENT_REMINDER: "Payment Reminder",
  QUOTATION_REMINDER: "Quotation Reminder",
  TRANSFORMER_TESTING: "Transformer Testing",
  INSPECTION: "Inspection",
  OTHER: "Other",
};

export const REMINDER_TYPE_LABELS: Record<string, string> = {
  AMC_EXPIRY: "AMC Expiry",
  INSURANCE_EXPIRY: "Insurance Expiry",
  TENDER_SUBMISSION: "Tender Submission",
  INVOICE_DUE: "Invoice Due",
  SALARY_DATE: "Salary Date",
  PF_DUE: "PF Due",
  GST_RETURN: "GST Return",
  SITE_VISIT: "Site Visit",
  MAINTENANCE: "Maintenance",
  CALIBRATION: "Calibration",
  VEHICLE_SERVICE: "Vehicle Service",
  OTHER: "Other",
};

export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function formatDueLabel(d: Date | string | null | undefined): string {
  if (!d) return "No due date";
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function daysOverdue(d: Date | string): number {
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - date.getTime()) / 86400000));
}
