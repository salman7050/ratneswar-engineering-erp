import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getEmployeeDetail, getSitesForAssignment } from "@/lib/queries/employees";
import { EmployeeHeader } from "@/components/employees/employee-header";
import { ProfilePanel } from "@/components/employees/profile-panel";
import { PfEsicPanel } from "@/components/employees/pf-esic-panel";
import { SalaryPanel } from "@/components/employees/salary-panel";
import { EmployeeAttendancePanel } from "@/components/employees/employee-attendance-panel";
import { LeavePanel } from "@/components/employees/leave-panel";
import { CareerPanel } from "@/components/employees/career-panel";
import { EmployeeDocumentsPanel } from "@/components/employees/employee-documents-panel";
import { PerformancePanel } from "@/components/employees/performance-panel";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const employee = await getEmployeeDetail(params.id);
  return { title: employee ? `${employee.name} · Ratneswar ERP` : "Employee · Ratneswar ERP" };
}

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("employees", "view");
  const [employee, sites] = await Promise.all([
    getEmployeeDetail(params.id),
    getSitesForAssignment(),
  ]);

  if (!employee) notFound();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <EmployeeHeader employee={employee} sites={sites} />

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="pf-esic">PF & ESIC</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="career">Promotion & Increment</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile"><Card variant="3d" className="p-6"><ProfilePanel employee={employee} /></Card></TabsContent>
        <TabsContent value="pf-esic"><Card variant="3d" className="p-6"><PfEsicPanel employee={employee} /></Card></TabsContent>
        <TabsContent value="salary"><Card variant="3d" className="p-6"><SalaryPanel employee={employee} /></Card></TabsContent>
        <TabsContent value="attendance"><Card variant="3d" className="p-6"><EmployeeAttendancePanel employee={employee} /></Card></TabsContent>
        <TabsContent value="leave"><Card variant="3d" className="p-6"><LeavePanel employee={employee} /></Card></TabsContent>
        <TabsContent value="career"><Card variant="3d" className="p-6"><CareerPanel employee={employee} /></Card></TabsContent>
        <TabsContent value="documents"><Card variant="3d" className="p-6"><EmployeeDocumentsPanel employee={employee} /></Card></TabsContent>
        <TabsContent value="performance"><Card variant="3d" className="p-6"><PerformancePanel employee={employee} /></Card></TabsContent>
      </Tabs>
    </div>
  );
}
