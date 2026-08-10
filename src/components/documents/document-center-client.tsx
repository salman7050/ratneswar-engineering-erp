"use client";

import * as React from "react";
import { Search, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Muted } from "@/components/ui/typography";
import { DocumentCard } from "@/components/documents/document-card";
import type { DocumentListItem } from "@/lib/queries/documents";

const CATEGORY_LABEL: Record<string, string> = {
  INSURANCE: "Insurance", CERTIFICATE: "Certificate", WORK_ORDER: "Work Order", AGREEMENT: "Agreement",
  CONTRACT: "Contract", INVOICE_BILL: "Invoice / Bill", QUOTATION: "Quotation", TESTING_REPORT: "Testing Report",
  REPORT: "Report", DRAWING: "Drawing", PHOTO: "Photo", STAFF_DOCUMENT: "Staff Document",
  ATTENDANCE: "Attendance", TENDER_DOCUMENT: "Tender Document", OTHER: "Other",
};

export function DocumentCenterClient({
  documents,
  categoryCounts,
}: {
  documents: DocumentListItem[];
  categoryCounts: Record<string, number>;
}) {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string | null>(null);

  const categoriesPresent = Object.keys(categoryCounts).filter((c) => (categoryCounts[c] ?? 0) > 0);
  const filtered = documents.filter((d) => {
    const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || d.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">All Documents</p>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" className="pl-9" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${!category ? "border-blue-200 bg-blue-50 text-blue-700" : "border-border text-muted-foreground hover:bg-secondary/50"}`}
        >
          All ({documents.length})
        </button>
        {categoriesPresent.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${category === c ? "border-blue-200 bg-blue-50 text-blue-700" : "border-border text-muted-foreground hover:bg-secondary/50"}`}
          >
            {CATEGORY_LABEL[c] ?? c} ({categoryCounts[c] ?? 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium">{documents.length === 0 ? "No documents yet" : "No documents match your search"}</p>
          <Muted className="max-w-sm">{documents.length === 0 ? "Upload your first document — certificates, photos, contracts, drawings, reports or supporting records." : "Try a different search term or category."}</Muted>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((d) => <DocumentCard key={d.id} doc={d} />)}
        </div>
      )}
    </div>
  );
}
