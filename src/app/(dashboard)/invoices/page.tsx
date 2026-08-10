import Link from "next/link";
import { Receipt } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { getInvoices, suggestNextInvoiceNumber, getInvoiceMasterOptions } from "@/lib/queries/invoices";
import { getSites } from "@/lib/queries/sites";
import { getBankAccounts, getSignatureAssets } from "@/lib/queries/finance-settings";
import { InvoiceFormDialog } from "@/components/finance/invoice-form-dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { formatDate, formatINR } from "@/lib/utils";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata = { title: "Invoices · Ratneswar ERP" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT = { DRAFT: "outline", GENERATED: "info", PAID: "success", OVERDUE: "destructive" } as const;

export default async function InvoicesPage() {
  await requirePermission("invoices", "view");
  const [invoices, sites, bankAccounts, suggestedNo, masters, signatures] = await Promise.all([
    getInvoices(), getSites(), getBankAccounts(), suggestNextInvoiceNumber(), getInvoiceMasterOptions(), getSignatureAssets(),
  ]);

  const totalOutstanding = invoices.reduce((s, i) => s + (i.grandTotal - i.amountPaid), 0);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Eyebrow className="text-brand-gold-light/80">Ratneswar Engineering · Finance</Eyebrow>
          <H1 className="text-2xl md:text-3xl">Invoices</H1>
          <Muted className="mt-1">{invoices.length} invoice{invoices.length === 1 ? "" : "s"} · {formatINR(totalOutstanding)} outstanding</Muted>
        </div>
        <InvoiceFormDialog suggestedNo={suggestedNo} sites={sites} bankAccounts={bankAccounts} clients={masters.clients} subcontractors={masters.subcontractors} signatures={signatures} />
      </div>

      {invoices.length === 0 ? (
        <Card variant="3d" className="flex flex-col items-center gap-3 p-12 text-center">
          <Receipt className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">No invoices yet</p>
          <Muted className="max-w-sm">Generate your first GST tax invoice — tax split, bank details, official print layout and optional combined digital signature + stamp.</Muted>
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead><TableHead>Site / Type</TableHead><TableHead>Buyer</TableHead><TableHead>Date</TableHead>
                <TableHead className="text-right">Grand Total</TableHead><TableHead className="text-right">Outstanding</TableHead><TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell><Link href={`/invoices/${inv.id}`} className="font-mono text-xs font-semibold hover:text-brand-gold-light">{inv.invoiceNo}</Link></TableCell>
                  <TableCell className="text-sm"><div>{inv.site?.siteCode ?? inv.site?.name ?? "—"}</div><div className="text-xs text-muted-foreground">{inv.invoiceType.replace("_", " ")}</div></TableCell>
                  <TableCell className="text-sm">{inv.buyerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(inv.date)}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">{formatINR(inv.grandTotal)}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">{formatINR(inv.grandTotal - inv.amountPaid)}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[inv.status]}>{inv.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
