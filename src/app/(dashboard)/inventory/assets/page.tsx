import { requirePermission } from "@/lib/auth";
import { getAllAssets } from "@/lib/queries/inventory";
import { getSites } from "@/lib/queries/sites";
import { GlobalAssetFormDialog } from "@/components/inventory/global-asset-form-dialog";
import { GlobalAssetsTable } from "@/components/inventory/global-assets-table";
import { Card } from "@/components/ui/card";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";

export const metadata = { title: "Tools & Equipment · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function GlobalAssetsPage() {
  await requirePermission("inventory", "view");
  const [assets, sites] = await Promise.all([getAllAssets(), getSites()]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering · Inventory</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Tools & Equipment</H1>
          <Muted className="mt-1">{assets.length} asset{assets.length === 1 ? "" : "s"} across all sites and central store</Muted>
        </div>
        <GlobalAssetFormDialog sites={sites.map((s) => ({ id: s.id, name: s.name }))} />
      </div>

      <Card variant="3d" className="p-6">
        <GlobalAssetsTable assets={assets} />
      </Card>
    </div>
  );
}
