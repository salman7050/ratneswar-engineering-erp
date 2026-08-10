"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DocumentPrintView, type CompanyInfo } from "@/components/finance/document-print-view";
import { PrintButton, EmailShareButton, WhatsAppShareButton } from "@/components/finance/share-buttons";
import { HistoryPanel } from "@/components/finance/history-panel";
import { WorkOrderFormDialog } from "@/components/finance/work-order-form-dialog";
import { updateWOStatus } from "@/lib/actions/work-order-actions";
import { useAction } from "@/hooks/use-action";
import { formatINR, formatDate } from "@/lib/utils";
import type { WorkOrderDetail } from "@/lib/queries/work-orders";

const STATUS_VARIANT = { DRAFT: "outline", ISSUED: "info", IN_PROGRESS: "gold", COMPLETED: "success", CANCELLED: "destructive" } as const;

export function WorkOrderDetailClient({
  wo, company, history, sites, suggestedNo,
}: {
  wo: WorkOrderDetail;
  company: CompanyInfo;
  history: { id: string; action: string; createdAt: Date | string; user: { name: string } | null }[];
  sites: { id: string; name: string }[];
  suggestedNo: string;
}) {
  const { run: setStatus } = useAction(updateWOStatus, { successMessage: "Status updated" });
  const shareMessage = `Hi ${wo.client}, please find Work Order ${wo.woNo} for ${formatINR(wo.value)}.`;

  const durationNote = wo.startDate && wo.endDate ? `${formatDate(wo.startDate)} → ${formatDate(wo.endDate)}` : "";

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 md:px-8">
      <div className="no-print flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-xl font-semibold">{wo.woNo}</h1>
          <Badge variant={STATUS_VARIANT[wo.status]}>{wo.status.replace("_", " ")}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={wo.status} onValueChange={(v) => setStatus(wo.id, v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="ISSUED">Issued</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem><SelectItem value="COMPLETED">Completed</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <WorkOrderFormDialog wo={wo} suggestedNo={suggestedNo} sites={sites} />
          <PrintButton />
          <EmailShareButton to={null} subject={`Work Order ${wo.woNo}`} body={shareMessage} />
          <WhatsAppShareButton phone={null} message={shareMessage} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto">
          <DocumentPrintView
            docTypeLabel="Work Order"
            docNo={wo.woNo}
            date={wo.date}
            meta={durationNote ? [{ label: "Duration", value: durationNote }] : []}
            partyLabel="Client"
            partyName={wo.client}
            scopeText={wo.scopeOfWork}
            plainValue={wo.value}
            notes={wo.terms}
            company={company}
          />
        </div>
        <div className="no-print">
          <Card variant="3d" className="p-5">
            <Tabs defaultValue="history">
              <TabsList><TabsTrigger value="history">History</TabsTrigger></TabsList>
              <TabsContent value="history"><HistoryPanel entries={history} /></TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
