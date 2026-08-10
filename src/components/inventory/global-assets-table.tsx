"use client";

import { Trash2, HardHat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { updateGlobalAssetStatus, deleteGlobalAsset } from "@/lib/actions/inventory-assets-actions";
import { useAction } from "@/hooks/use-action";
import { formatINR } from "@/lib/utils";
import type { AssetListItem } from "@/lib/queries/inventory";

export function GlobalAssetsTable({ assets }: { assets: AssetListItem[] }) {
  const { run: setStatus } = useAction(updateGlobalAssetStatus, { successMessage: "Status updated" });
  const { run: remove } = useAction(deleteGlobalAsset, { successMessage: "Asset removed" });

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <HardHat className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-medium">No assets yet</p>
        <Muted className="max-w-sm">Track tools, equipment, and vehicles across sites and the central store.</Muted>
      </div>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Asset</TableHead><TableHead>Tag</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Value</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="text-sm font-medium">{a.name}</TableCell>
              <TableCell className="font-mono text-xs">{a.assetTag}</TableCell>
              <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{a.site?.name ?? a.location ?? "Central Store"}</TableCell>
              <TableCell className="tabular text-right font-mono text-sm">{a.purchaseValue !== null ? formatINR(a.purchaseValue) : "—"}</TableCell>
              <TableCell>
                <Select value={a.status} onValueChange={(v) => setStatus(a.id, v as any)}>
                  <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell><button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
