import { Mail, Phone, Building2 } from "lucide-react";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, formatDate } from "@/lib/utils";
import type { EmployeeDetail } from "@/lib/queries/employees";

export function EmployeeHeader({ employee, sites }: { employee: EmployeeDetail; sites: { id: string; name: string }[] }) {
  return (
    <div className="card-3d flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={employee.photoUrl ?? undefined} alt={employee.name} />
          <AvatarFallback className="text-lg">{initials(employee.name)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{employee.name}</h1>
            <Badge variant={employee.isActive ? "success" : "outline"}>{employee.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {employee.designation}{employee.department ? ` · ${employee.department}` : ""} · {employee.employeeCode}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {employee.site && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {employee.site.name}</span>}
            {employee.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {employee.email}</span>}
            {employee.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {employee.phone}</span>}
            <span>Joined {formatDate(employee.joinedAt)}</span>
          </div>
        </div>
      </div>
      <EmployeeFormDialog employee={employee} sites={sites} />
    </div>
  );
}
