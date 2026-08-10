"use client";

import * as React from "react";
import Link from "next/link";
import { FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusChip } from "@/components/ui/status-chip";
import { Card } from "@/components/ui/card";
import { Muted } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDate, formatINR } from "@/lib/utils";
import type { TenderListItem } from "@/lib/queries/tenders";

const STATUS_VARIANT = {
  PREPARING: "outline", SUBMITTED: "info", WON: "success", LOST: "destructive", CANCELLED: "secondary", COMPLETED: "gold",
} as const;

const EMD_TONE = { PENDING: "neutral", SUBMITTED: "info", REFUNDED: "success", FORFEITED: "destructive" } as const;

function TenderTable({ tenders }: { tenders: TenderListItem[] }) {
  if (tenders.length === 0) {
    return (
      <Card variant="3d" className="flex flex-col items-center gap-3 p-12 text-center">
        <FileSignature className="h-8 w-8 text-muted-foreground/50" />
        <p className="font-medium">No tenders here</p>
        <Muted className="max-w-sm">Nothing in this category yet.</Muted>
      </Card>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tender No.</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead>
            <TableHead className="text-right">Value</TableHead><TableHead>EMD</TableHead><TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((t) => (
            <TableRow key={t.id}>
              <TableCell><Link href={`/tenders/${t.id}`} className="font-mono text-xs font-semibold hover:text-brand-gold-light">{t.tenderNo}</Link></TableCell>
              <TableCell className="text-sm">{t.name}<br /><Muted className="text-[11px]">{t.site?.name}</Muted></TableCell>
              <TableCell className="text-sm text-muted-foreground">{t.department}</TableCell>
              <TableCell className="tabular text-right font-mono text-sm">{formatINR(t.estimatedValue)}</TableCell>
              <TableCell>{t.emdAmount !== null && <StatusChip tone={EMD_TONE[t.emdStatus]}>{t.emdStatus}</StatusChip>}</TableCell>
              <TableCell><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function TenderListClient({ tenders }: { tenders: TenderListItem[] }) {
  const pending = tenders.filter((t) => t.status === "PREPARING" || t.status === "SUBMITTED");
  const won = tenders.filter((t) => t.status === "WON");
  const completed = tenders.filter((t) => t.status === "COMPLETED");
  const lost = tenders.filter((t) => t.status === "LOST" || t.status === "CANCELLED");

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All ({tenders.length})</TabsTrigger>
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        <TabsTrigger value="won">Winner ({won.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        <TabsTrigger value="lost">Lost / Cancelled ({lost.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="all"><TenderTable tenders={tenders} /></TabsContent>
      <TabsContent value="pending"><TenderTable tenders={pending} /></TabsContent>
      <TabsContent value="won"><TenderTable tenders={won} /></TabsContent>
      <TabsContent value="completed"><TenderTable tenders={completed} /></TabsContent>
      <TabsContent value="lost"><TenderTable tenders={lost} /></TabsContent>
    </Tabs>
  );
}
