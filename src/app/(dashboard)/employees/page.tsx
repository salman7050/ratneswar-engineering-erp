import Link from "next/link";
import { Users, ShieldCheck } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getEmployees, getSitesForAssignment } from "@/lib/queries/employees";
import { EmployeeFormDialog } from "@/components/employees/employee-form-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { initials, formatINR } from "@/lib/utils";
import {
  TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

export const metadata = { title: "Employees · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  await requirePermission("employees", "view");
  const [employees, sites] = await Promise.all([getEmployees(), getSitesForAssignment()]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Employees</H1>
          <Muted className="mt-1">{employees.length} on record · {employees.filter((e) => e.isActive).length} active</Muted>
        </div>
        <EmployeeFormDialog sites={sites} />
      </div>

      {employees.length === 0 ? (
        <Card variant="3d" className="flex flex-col items-center gap-3 p-12 text-center">
          <Users className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">No employees yet</p>
          <Muted className="max-w-sm">Add your first employee to start tracking attendance, leave, salary, and performance.</Muted>
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Gross / month</TableHead>
                <TableHead>Statutory</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5 hover:text-brand-gold-light">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={e.photoUrl ?? undefined} alt={e.name} />
                        <AvatarFallback className="text-[10px]">{initials(e.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-[11px] text-muted-foreground">{e.employeeCode}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{e.designation}{e.department ? ` · ${e.department}` : ""}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.site?.name ?? "Unassigned"}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">
                    {formatINR(e.basic + e.hra + e.otherAllowance)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      {e.pfEnrolled && <Badge variant="info"><ShieldCheck className="mr-1 h-3 w-3" />PF</Badge>}
                      {e.esicEnrolled && <Badge variant="success">ESIC</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={e.isActive ? "success" : "outline"}>{e.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
