import { requirePermission } from "@/lib/auth";
import { getAllDocuments, getCategoryCounts } from "@/lib/queries/documents";
import { getSites } from "@/lib/queries/sites";
import { getEmployees } from "@/lib/queries/employees";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { DocumentCenterClient } from "@/components/documents/document-center-client";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";

export const metadata = { title: "Document Center · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  await requirePermission("documents", "view");
  const [documents, categoryCounts, sites, employees] = await Promise.all([
    getAllDocuments(), getCategoryCounts(), getSites(), getEmployees(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Document Center</H1>
          <Muted className="mt-1">{documents.length} document{documents.length === 1 ? "" : "s"} — insurance, certificates, photos, contracts, drawings, reports</Muted>
        </div>
        <UploadDialog
          sites={sites.map((s) => ({ id: s.id, name: s.name }))}
          employees={employees.map((e) => ({ id: e.id, name: e.name }))}
        />
      </div>

      <DocumentCenterClient documents={documents} categoryCounts={categoryCounts} />
    </div>
  );
}
