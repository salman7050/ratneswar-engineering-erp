import { ShieldCheck, ShieldOff } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import type { EmployeeDetail } from "@/lib/queries/employees";

export function PfEsicPanel({ employee }: { employee: EmployeeDetail }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="card-3d flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${employee.pfEnrolled ? "bg-info/12 text-info" : "bg-secondary text-muted-foreground"}`}>
            {employee.pfEnrolled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold">Provident Fund</p>
            <Muted className="text-xs font-mono">{employee.pfNumber ?? "No UAN on file"}</Muted>
          </div>
        </div>
        <StatusChip tone={employee.pfEnrolled ? "info" : "neutral"}>{employee.pfEnrolled ? "Enrolled" : "Not Enrolled"}</StatusChip>
      </div>

      <div className="card-3d flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${employee.esicEnrolled ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground"}`}>
            {employee.esicEnrolled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold">ESIC</p>
            <Muted className="text-xs font-mono">{employee.esicNumber ?? "No ESIC number on file"}</Muted>
          </div>
        </div>
        <StatusChip tone={employee.esicEnrolled ? "success" : "neutral"}>{employee.esicEnrolled ? "Enrolled" : "Not Enrolled"}</StatusChip>
      </div>

      <Muted className="text-xs sm:col-span-2">
        Update enrollment status, UAN, or ESIC number from &ldquo;Edit Profile&rdquo; → Statutory & Bank.
      </Muted>
    </div>
  );
}
