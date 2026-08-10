export interface TaskRowData {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  status: "PENDING" | "IN_PROGRESS" | "WAITING" | "COMPLETED" | "CANCELLED";
  progress: number;
  dueDate: Date | string | null;
  dueTime: string | null;
  attachmentUrl: string | null;
  notes: string | null;
  site: { id: string; name: string } | null;
  _count: { comments: number };
}
