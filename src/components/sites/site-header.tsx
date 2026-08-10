import { MapPin, Calendar } from "lucide-react";
import { SiteFormDialog } from "@/components/sites/site-form-dialog";
import { StatusChip } from "@/components/ui/status-chip";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { formatDate } from "@/lib/utils";
import type { SiteDetail } from "@/lib/queries/sites";

const STATUS_TONE = { ACTIVE: "success", COMPLETED: "info", ON_HOLD: "warning" } as const;
const TYPE_LABEL: Record<string, string> = {
  SUBSTATION: "Substation", HYDRO: "Hydro", PUMPING_STATION: "Pumping Station",
  SOLAR: "Solar", OM_CONTRACT: "O&M Contract", EPC: "EPC", OTHER: "Other",
};

export function SiteHeader({ site, clients = [], subcontractors = [] }: { site: SiteDetail; clients?: { id: string; name: string }[]; subcontractors?: { id: string; name: string }[] }) {
  const hasCoords = site.latitude !== null && site.longitude !== null;

  return (
    <div className="card-3d overflow-hidden">
      {site.coverPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={site.coverPhotoUrl} alt={site.name} className="h-40 w-full object-cover md:h-56" />
      ) : (
        <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-secondary to-secondary/40 md:h-36">
          <MapPin className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}

      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold md:text-2xl">{site.name}</h1>
            <StatusChip tone={STATUS_TONE[site.status]}>{site.status.replace("_", " ")}</StatusChip>
            <Badge variant="gold">{TYPE_LABEL[site.type] ?? site.type}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {site.location}</span>
            <span>Client: <span className="text-foreground/90 font-medium">{site.clientAccount?.name ?? site.client}</span></span>
            <Badge variant={site.ownership === "DIRECT" ? "success" : "info"}>{site.ownership}</Badge>
            {site.subcontractor && <span>Subcontractor: <span className="font-medium text-foreground/90">{site.subcontractor.name}</span></span>}
            {site.capacity && <span>Capacity: <span className="tabular font-mono text-foreground/90">{site.capacity}</span></span>}
            {site.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Started {formatDate(site.startDate)}
              </span>
            )}
          </div>
        </div>
        <SiteFormDialog site={site} clients={clients} subcontractors={subcontractors} />
      </div>

      {hasCoords ? (
        <iframe
          title="Site location map"
          className="h-64 w-full border-0"
          loading="lazy"
          src={`https://www.google.com/maps?q=${site.latitude},${site.longitude}&z=14&output=embed`}
        />
      ) : (
        <div className="flex h-24 items-center justify-center border-t border-border">
          <Muted className="text-xs">No coordinates set — edit the site to drop a pin on the map.</Muted>
        </div>
      )}
    </div>
  );
}
