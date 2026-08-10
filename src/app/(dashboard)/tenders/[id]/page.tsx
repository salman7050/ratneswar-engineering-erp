import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getTenderDetail, suggestNextTenderNo } from "@/lib/queries/tenders";
import { getSites, getAssignableUsers } from "@/lib/queries/sites";
import { getBankAccounts } from "@/lib/queries/finance-settings";
import { getEntityHistory } from "@/lib/queries/history";
import { suggestNextQuoteNumber } from "@/lib/queries/quotations";
import { TenderFormDialog } from "@/components/tenders/tender-form-dialog";
import { TenderOverviewPanel } from "@/components/tenders/tender-overview-panel";
import { TenderBoqPanel } from "@/components/tenders/tender-boq-panel";
import { TenderDocumentsPanel } from "@/components/tenders/tender-documents-panel";
import { TenderQuotationsPanel } from "@/components/tenders/tender-quotations-panel";
import { TenderApprovalPanel } from "@/components/tenders/tender-approval-panel";
import { TenderTimelinePanel } from "@/components/tenders/tender-timeline-panel";
import { HistoryPanel } from "@/components/finance/history-panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

const STATUS_VARIANT = {
  PREPARING: "outline", SUBMITTED: "info", WON: "success", LOST: "destructive", CANCELLED: "secondary", COMPLETED: "gold",
} as const;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const tender = await getTenderDetail(params.id);
  return { title: tender ? `${tender.tenderNo} · Ratneswar ERP` : "Tender · Ratneswar ERP" };
}

export default async function TenderDetailPage({ params }: { params: { id: string } }) {
  await requirePermission("tenders", "view");
  const [tender, sites, owners, bankAccounts, history, suggestedTenderNo, suggestedQuoteNo] = await Promise.all([
    getTenderDetail(params.id), getSites(), getAssignableUsers(), getBankAccounts(),
    getEntityHistory("Tender", params.id), suggestNextTenderNo(), suggestNextQuoteNumber(),
  ]);

  if (!tender) notFound();

  const siteOptions = sites.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-mono text-lg font-semibold">{tender.tenderNo}</h1>
            <p className="text-sm text-muted-foreground">{tender.name}</p>
          </div>
          <Badge variant={STATUS_VARIANT[tender.status]}>{tender.status}</Badge>
        </div>
        <TenderFormDialog tender={tender} suggestedNo={suggestedTenderNo} sites={siteOptions} owners={owners} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="boq">BOQ</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><Card variant="3d" className="p-6"><TenderOverviewPanel tender={tender} /></Card></TabsContent>
        <TabsContent value="boq"><Card variant="3d" className="p-6"><TenderBoqPanel tenderId={tender.id} items={tender.boqItems} /></Card></TabsContent>
        <TabsContent value="documents"><Card variant="3d" className="p-6"><TenderDocumentsPanel tenderId={tender.id} documents={tender.documents} /></Card></TabsContent>
        <TabsContent value="quotations">
          <Card variant="3d" className="p-6">
            <TenderQuotationsPanel tenderId={tender.id} quotations={tender.quotations} suggestedNo={suggestedQuoteNo} sites={siteOptions} bankAccounts={bankAccounts} />
          </Card>
        </TabsContent>
        <TabsContent value="approval"><Card variant="3d" className="p-6"><TenderApprovalPanel tender={tender} /></Card></TabsContent>
        <TabsContent value="timeline"><Card variant="3d" className="p-6"><TenderTimelinePanel tenderId={tender.id} events={tender.timeline} /></Card></TabsContent>
        <TabsContent value="history"><Card variant="3d" className="p-6"><HistoryPanel entries={history} /></Card></TabsContent>
      </Tabs>
    </div>
  );
}
