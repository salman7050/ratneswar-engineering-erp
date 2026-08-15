import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getInvoiceDetail, suggestNextInvoiceNumber, getInvoiceMasterOptions } from "@/lib/queries/invoices";
import { getSites } from "@/lib/queries/sites";
import { getBankAccounts, getSignatureAssets } from "@/lib/queries/finance-settings";
import { getCompanySettings } from "@/lib/queries/finance-settings";
import { getEntityHistory } from "@/lib/queries/history";
import { InvoiceFormDialog } from "@/components/finance/invoice-form-dialog";
import { OfficialInvoicePrint } from "@/components/finance/official-invoice-print";
import { PrintButton, EmailShareButton, WhatsAppShareButton } from "@/components/finance/share-buttons";
import { PaymentPanel } from "@/components/finance/payment-panel";
import { HistoryPanel } from "@/components/finance/history-panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = { DRAFT: "outline", GENERATED: "info", PAID: "success", OVERDUE: "destructive" } as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceDetail(id);
  return { title: invoice ? `${invoice.invoiceNo} · Ratneswar ERP` : "Invoice · Ratneswar ERP" };
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("invoices", "view");
  const [invoice, sites, bankAccounts, company, history, suggestedNo, masters, signatures] = await Promise.all([
    getInvoiceDetail(id), getSites(), getBankAccounts(), getCompanySettings(),
    getEntityHistory("Invoice", id), suggestNextInvoiceNumber(), getInvoiceMasterOptions(), getSignatureAssets(),
  ]);

  if (!invoice) notFound();

  const totals = {
    taxableValue: invoice.taxableValue, taxAmount: invoice.taxAmount, grandTotal: invoice.grandTotal,
    gstType: invoice.gstType, sgst: invoice.gstType === "SGST_CGST" ? invoice.taxAmount / 2 : 0,
    cgst: invoice.gstType === "SGST_CGST" ? invoice.taxAmount / 2 : 0, igst: invoice.gstType === "IGST" ? invoice.taxAmount : 0,
  };

  const issuerName = invoice.subcontractor?.legalName || invoice.subcontractor?.name || company.legalName;
  const shareMessage = `Hi ${invoice.buyerName}, please find Invoice ${invoice.invoiceNo} for ${formatINR(invoice.grandTotal)} from ${issuerName}.`;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="no-print flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-xl font-semibold">{invoice.invoiceNo}</h1>
          <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <InvoiceFormDialog invoice={invoice} suggestedNo={suggestedNo} sites={sites} bankAccounts={bankAccounts} clients={masters.clients} subcontractors={masters.subcontractors} signatures={signatures} />
          <PrintButton filename={`Invoice_${invoice.invoiceNo.replace(/[^A-Za-z0-9_-]+/g, "_")}_${invoice.buyerName.replace(/[^A-Za-z0-9_-]+/g, "_")}.pdf`} />
          <EmailShareButton to={null} subject={`Invoice ${invoice.invoiceNo} — ${issuerName}`} body={shareMessage} />
          <WhatsAppShareButton phone={null} message={shareMessage} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto">
          <OfficialInvoicePrint invoice={invoice} company={company} />
        </div>

        <div className="no-print flex flex-col gap-4">
          <Card variant="3d" className="p-5">
            <Tabs defaultValue="payment">
              <TabsList>
                <TabsTrigger value="payment">Payment Status</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="payment"><PaymentPanel invoice={invoice} /></TabsContent>
              <TabsContent value="history"><HistoryPanel entries={history} /></TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
