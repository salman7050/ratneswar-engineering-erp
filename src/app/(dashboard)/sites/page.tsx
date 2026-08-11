import Link from "next/link";
import { MapPinned, Users, FileSignature, Boxes } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getSites, getSiteMasterOptions } from "@/lib/queries/sites";
import { SiteFormDialog } from "@/components/sites/site-form-dialog";
import { StatusChip } from "@/components/ui/status-chip";
import { Card } from "@/components/ui/card";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import {
  TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

export const metadata = { title: "Sites & Projects · Ratneswar ERP" };
export const dynamic = "force-dynamic";

const STATUS_TONE = { ACTIVE: "success", COMPLETED: "info", ON_HOLD: "warning" } as const;
const TYPE_LABEL: Record<string, string> = {
  SUBSTATION: "Substation", HYDRO: "Hydro", PUMPING_STATION: "Pumping Station",
  SOLAR: "Solar", OM_CONTRACT: "O&M Contract", EPC: "EPC", OTHER: "Other",
};

export default async function SitesPage() {
  await requirePermission("sites", "view");
  const sites = await getSites();
  const masters = await getSiteMasterOptions();

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Sites & Projects</H1>
          <Muted className="mt-1">{sites.length} site{sites.length === 1 ? "" : "s"} on record</Muted>
        </div>
        <SiteFormDialog clients={masters.clients} subcontractors={masters.subcontractors} />
      </div>

      {sites.length === 0 ? (
        <Card variant="3d" className="flex flex-col items-center gap-3 p-12 text-center">
          <MapPinned className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">No sites yet</p>
          <Muted className="max-w-sm">
            Add your first site to start tracking its team, expenses, documents, maintenance, and more.
          </Muted>
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Execution</TableHead>
                <TableHead>Subcontractor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Tenders</TableHead>
                <TableHead className="text-right">Assets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/sites/${site.id}`} className="flex flex-col hover:text-brand-gold-light">
                      <span className="font-medium">{site.name}</span>
                      <span className="text-xs text-muted-foreground">{site.location}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{site.clientAccount?.name ?? site.client}</TableCell>
                  <TableCell><StatusChip tone={site.ownership === "DIRECT" ? "success" : "info"}>{site.ownership}</StatusChip></TableCell>
                  <TableCell className="text-sm">{site.subcontractor?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{TYPE_LABEL[site.type] ?? site.type}</TableCell>
                  <TableCell>
                    <StatusChip tone={STATUS_TONE[site.status]}>{site.status.replace("_", " ")}</StatusChip>
                  </TableCell>
                  <TableCell className="tabular font-mono text-sm">{site.capacity ?? "—"}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-muted-foreground" />{site._count.employees}</span>
                  </TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">
                    <span className="inline-flex items-center gap-1"><FileSignature className="h-3 w-3 text-muted-foreground" />{site._count.tenders}</span>
                  </TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">
                    <span className="inline-flex items-center gap-1"><Boxes className="h-3 w-3 text-muted-foreground" />{site._count.assets}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
