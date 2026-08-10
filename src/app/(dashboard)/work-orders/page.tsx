import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getWorkOrders, suggestNextWONumber } from "@/lib/queries/work-orders";
import { getSites } from "@/lib/queries/sites";
import { WorkOrderFormDialog } from "@/components/finance/work-order-form-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata = { title: "Work Orders · Ratneswar ERP" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT = { DRAFT: "outline", ISSUED: "info", IN_PROGRESS: "gold", COMPLETED: "success", CANCELLED: "destructive" } as const;

export default async function WorkOrdersPage() {
  await requirePermission("invoices", "view");
  const [wos, sites, suggestedNo] = await Promise.all([getWorkOrders(), getSites(), suggestNextWONumber()]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering · Finance</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Work Orders</H1>
          <Muted className="mt-1">{wos.length} work order{wos.length === 1 ? "" : "s"}</Muted>
        </div>
        <WorkOrderFormDialog suggestedNo={suggestedNo} sites={sites} />
      </div>

      {wos.length === 0 ? (
        <Card variant="3d" className="flex flex-col items-center gap-3 p-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">No work orders yet</p>
          <Muted className="max-w-sm">Issue a formal work order with scope and value.</Muted>
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader><TableRow><TableHead>WO No.</TableHead><TableHead>Client</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {wos.map((w) => (
                <TableRow key={w.id}>
                  <TableCell><Link href={`/work-orders/${w.id}`} className="font-mono text-xs font-semibold hover:text-brand-gold-light">{w.woNo}</Link></TableCell>
                  <TableCell className="text-sm">{w.client}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(w.date)}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">{formatINR(w.value)}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[w.status]}>{w.status.replace("_", " ")}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
