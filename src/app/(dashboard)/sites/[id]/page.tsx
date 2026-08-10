import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getSiteDetail, getAssignableUsers, getSiteMasterOptions } from "@/lib/queries/sites";
import { SiteHeader } from "@/components/sites/site-header";
import { PhotosPanel } from "@/components/sites/photos-panel";
import { TeamPanel } from "@/components/sites/team-panel";
import { AttendancePanel } from "@/components/sites/attendance-panel";
import { ExpensesPanel } from "@/components/sites/expenses-panel";
import { DocumentsPanel } from "@/components/sites/documents-panel";
import { CompliancePanel } from "@/components/sites/compliance-panel";
import { OperationsPanel } from "@/components/sites/operations-panel";
import { TimelinePanel } from "@/components/sites/timeline-panel";
import { Card } from "@/components/ui/card";
import { Muted } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const site = await getSiteDetail(params.id);
  return { title: site ? `${site.name} · Ratneswar ERP` : "Site · Ratneswar ERP" };
}

export default async function SiteDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("sites", "view");
  const [site, assignableUsers, masters] = await Promise.all([
    getSiteDetail(params.id),
    getAssignableUsers(),
    getSiteMasterOptions(),
  ]);

  if (!site) notFound();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <SiteHeader site={site} clients={masters.clients} subcontractors={masters.subcontractors} />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Insurance / AMC / Warranty</TabsTrigger>
          <TabsTrigger value="operations">Maintenance / Breakdown</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card variant="3d" className="p-6">
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              <div><Muted className="text-xs">Client</Muted><p className="mt-1 font-medium">{site.clientAccount?.name ?? site.client}</p></div>
              <div><Muted className="text-xs">Execution</Muted><p className="mt-1 font-medium">{site.ownership}{site.subcontractor ? ` · ${site.subcontractor.name}` : ""}</p></div>
              <div><Muted className="text-xs">Billing Mode</Muted><p className="mt-1 font-medium">{site.billingMode}</p></div>
              <div><Muted className="text-xs">Capacity</Muted><p className="mt-1 tabular font-mono font-medium">{site.capacity ?? "—"}</p></div>
              <div><Muted className="text-xs">Employees</Muted><p className="mt-1 font-medium">{site.employees.length}</p></div>
              <div><Muted className="text-xs">Engineers Assigned</Muted><p className="mt-1 font-medium">{site.engineers.length}</p></div>
              <div><Muted className="text-xs">Photos</Muted><p className="mt-1 font-medium">{site.photos.length}</p></div>
              <div><Muted className="text-xs">Documents</Muted><p className="mt-1 font-medium">{site.documents.length}</p></div>
              <div><Muted className="text-xs">Open Breakdowns</Muted><p className="mt-1 font-medium">{site.breakdowns.filter((b) => !b.resolvedAt).length}</p></div>
              <div><Muted className="text-xs">Assets</Muted><p className="mt-1 font-medium">{site.assets.length}</p></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card variant="3d" className="p-6"><PhotosPanel siteId={site.id} photos={site.photos} /></Card>
        </TabsContent>

        <TabsContent value="team">
          <Card variant="3d" className="p-6">
            <TeamPanel siteId={site.id} engineers={site.engineers} employees={site.employees} assignableUsers={assignableUsers} />
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card variant="3d" className="p-6"><AttendancePanel siteId={site.id} employees={site.employees} attendance={site.attendance} /></Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card variant="3d" className="p-6"><ExpensesPanel siteId={site.id} expenses={site.expenses} /></Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card variant="3d" className="p-6"><DocumentsPanel siteId={site.id} documents={site.documents} /></Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card variant="3d" className="p-6"><CompliancePanel siteId={site.id} site={site} /></Card>
        </TabsContent>

        <TabsContent value="operations">
          <Card variant="3d" className="p-6"><OperationsPanel siteId={site.id} site={site} /></Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card variant="3d" className="p-6"><TimelinePanel siteId={site.id} events={site.timeline} /></Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
