"use client";

import { FileSignature, Receipt, Wallet, UserPlus, FolderPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

const ACTIONS = [
  { label: "New Tender", icon: FileSignature, module: "Tenders" },
  { label: "New Invoice", icon: Receipt, module: "Invoices" },
  { label: "Log Expense", icon: Wallet, module: "Expenses" },
  { label: "New Quotation", icon: FileText, module: "Quotations" },
  { label: "Add Employee", icon: UserPlus, module: "Salary" },
  { label: "Upload Document", icon: FolderPlus, module: "Documents" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {ACTIONS.map(({ label, icon: Icon, module }) => (
        <Button
          key={label}
          variant="glass"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => toast.info(`${module} module`, "Build coming right after the dashboard ships")}
        >
          <Icon className="h-5 w-5 text-brand-gold-light" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}
