"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  Building2,
  FileCheck2,
  FileSpreadsheet,
  Landmark,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createExpense, deleteExpense } from "@/lib/actions/expense-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate, formatINR } from "@/lib/utils";
import { uploadDocumentFile } from "@/lib/supabase/storage";
import { toast } from "@/lib/toast";
import type { ExpenseListItem, SalaryCostListItem } from "@/lib/queries/expenses";

const CATEGORIES = ["MATERIAL", "LABOUR", "FUEL", "TRANSPORT", "EQUIPMENT", "MISC"] as const;
const TYPES = [
  ["EXPENSE", "General Expense"],
  ["VENDOR_PAYMENT", "Direct Vendor Payment"],
  ["PO_PAYMENT", "PO Payment"],
  ["ADVANCE", "Advance"],
  ["CASH_EXPENSE", "Cash Expense"],
  ["CASH_LABOUR", "Cash Labour"],
  ["INTERNAL_TRANSFER", "Internal Transfer (not expense)"],
  ["REFUND_RECOVERY", "Refund / Recovery"],
] as const;
const PAYMENT_MODES = ["Internet Banking", "NEFT / RTGS", "UPI", "Cheque", "Cash", "Card", "Other"] as const;
const BUSINESS_UNITS = ["Ratneswar Engineering", "Ratneswar Solar", "General / Head Office"] as const;

type SiteOption = { id: string; name: string; siteCode: string | null };
type VendorOption = { id: string; name: string };
type POOption = { id: string; poNo: string; vendorName: string; siteId: string | null; grandTotal: number };

function monthStart(value: string) {
  return value ? `${value}-01` : "";
}
function monthEnd(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return "";
  return new Date(y!, m!, 0).toISOString().slice(0, 10);
}
function monthValue(date: string) {
  return date.slice(0, 7);
}
function safeSheetName(value: string) {
  return value.replace(/[\\/?*\[\]:]/g, " ").trim().slice(0, 31) || "UNASSIGNED";
}
function cleanFilePart(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 50);
}
function pretty(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
function money(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function dayLabel(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

export function ExpensesClient({
  expenses,
  salaryCosts,
  sites,
  vendors,
  purchaseOrders,
  canCreate,
  canDelete,
  fromDate,
  toDate,
}: {
  expenses: ExpenseListItem[];
  salaryCosts: SalaryCostListItem[];
  sites: SiteOption[];
  vendors: VendorOption[];
  purchaseOrders: POOption[];
  canCreate: boolean;
  canDelete: boolean;
  fromDate: string;
  toDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [fromMonth, setFromMonth] = React.useState(monthValue(fromDate));
  const [toMonth, setToMonth] = React.useState(monthValue(toDate));
  const [uploading, setUploading] = React.useState(false);
  const [receipt, setReceipt] = React.useState<File | null>(null);
  const [form, setForm] = React.useState({
    businessUnit: "Ratneswar Engineering",
    siteId: "",
    transactionType: "EXPENSE",
    category: "MATERIAL" as (typeof CATEGORIES)[number],
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    payee: "",
    paymentMode: "Internet Banking",
    bankReference: "",
    vendorId: "",
    purchaseOrderId: "",
    documentStatus: "NOT_REQUIRED",
  });

  const { run: add, loading } = useAction(createExpense, {
    successMessage: "Expense / payment recorded",
    onSuccess: () => {
      setOpen(false);
      setReceipt(null);
      setForm((current) => ({ ...current, description: "", amount: "", payee: "", bankReference: "", purchaseOrderId: "", vendorId: "" }));
    },
  });
  const { run: remove } = useAction(deleteExpense, { successMessage: "Record deleted" });

  function applyPeriod() {
    const from = monthStart(fromMonth);
    const to = monthEnd(toMonth);
    if (!from || !to) return toast.error("Select both From and To months.");
    if (from > to) return toast.error("From month cannot be after To month.");
    router.push(`/expenses?from=${from}&to=${to}`);
  }

  async function saveExpense() {
    if (!form.description.trim() || !form.amount) return toast.error("Description and amount are required.");
    setUploading(true);
    try {
      let documentUrl: string | null = null;
      let documentStatus = form.documentStatus as "NOT_REQUIRED" | "DOCUMENT_PENDING" | "AVAILABLE" | "VERIFIED";
      if (receipt) {
        const uploaded = await uploadDocumentFile(receipt);
        documentUrl = uploaded.path;
        documentStatus = "AVAILABLE";
      }
      await add({
        ...form,
        siteId: form.siteId || null,
        vendorId: form.vendorId || null,
        purchaseOrderId: form.purchaseOrderId || null,
        amount: Number(form.amount),
        date: new Date(`${form.date}T12:00:00`),
        payee: form.payee || null,
        bankReference: form.bankReference || null,
        documentUrl,
        documentStatus,
        source: "ERP",
      } as any);
    } finally {
      setUploading(false);
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleExpenses = expenses.filter((e) => {
    if (!normalizedSearch) return true;
    return [e.description, e.payee, e.businessUnit, e.site?.name, e.vendor?.name, e.purchaseOrder?.poNo, e.bankReference]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(normalizedSearch));
  });

  const counted = expenses.filter((e) => e.transactionType !== "INTERNAL_TRANSFER");
  const outflows = counted.filter((e) => e.transactionType !== "REFUND_RECOVERY").reduce((sum, e) => sum + e.amount, 0);
  const recoveries = counted.filter((e) => e.transactionType === "REFUND_RECOVERY").reduce((sum, e) => sum + e.amount, 0);
  const transfers = expenses.filter((e) => e.transactionType === "INTERNAL_TRANSFER").reduce((sum, e) => sum + e.amount, 0);
  const salaryCost = salaryCosts.reduce((sum, e) => sum + e.amount, 0);
  const netCost = outflows - recoveries + salaryCost;
  const missingBills = expenses.filter((e) => e.documentStatus === "DOCUMENT_PENDING");

  const reportRows = React.useMemo(() => {
    const expenseRows = expenses
      .filter((e) => e.transactionType !== "INTERNAL_TRANSFER")
      .map((e) => ({
        date: new Date(e.date),
        source: "Expenses & Payments",
        businessUnit: e.businessUnit,
        site: e.site?.name || "UNASSIGNED / GENERAL",
        type: pretty(e.transactionType),
        category: pretty(e.category),
        payee: e.payee || e.vendor?.name || "",
        description: e.description,
        paymentMode: e.paymentMode || "",
        reference: e.bankReference || e.purchaseOrder?.poNo || "",
        document: pretty(e.documentStatus),
        amount: e.transactionType === "REFUND_RECOVERY" ? -e.amount : e.amount,
      }));
    const salaryRows = salaryCosts.map((s) => ({
      date: new Date(s.date),
      source: "Salary Archive",
      businessUnit: s.businessUnit,
      site: s.site?.name || s.label,
      type: s.type === "CASH_LABOUR" ? "Cash Labour" : "Salary Cost",
      category: "Labour",
      payee: s.type === "CASH_LABOUR" ? "Rattilal Labour" : "",
      description: `${s.periodKey} — ${s.label}`,
      paymentMode: s.isCash ? "Cash" : "Salary Record",
      reference: s.periodKey,
      document: "Salary sheet archived",
      amount: s.amount,
    }));
    return [...expenseRows, ...salaryRows].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [expenses, salaryCosts]);

  async function exportExcel() {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: `Ratneswar Expenses & Payments ${fromDate} to ${toDate}`,
      Subject: "Management Expenses & Payments Report",
      Author: "Ratneswar Engineering ERP",
      Company: "Ratneswar Engineering",
    };

    const summaryBySite = new Map<string, { count: number; amount: number; missing: number }>();
    const summaryByCategory = new Map<string, number>();
    for (const row of reportRows) {
      const s = summaryBySite.get(row.site) ?? { count: 0, amount: 0, missing: 0 };
      s.count += 1;
      s.amount += row.amount;
      if (row.document === "Document Pending") s.missing += row.amount;
      summaryBySite.set(row.site, s);
      summaryByCategory.set(row.category, (summaryByCategory.get(row.category) ?? 0) + row.amount);
    }

    const summaryAoA: (string | number)[][] = [
      ["RATNESWAR ENGINEERING"],
      ["EXPENSES & PAYMENTS — MANAGEMENT REPORT"],
      [`Reporting Period: ${dayLabel(fromDate)} to ${dayLabel(toDate)}`],
      [],
      ["KEY SUMMARY", "VALUE"],
      ["Direct / Field / Vendor Outflows", outflows],
      ["Salary & Manpower Cost", salaryCost],
      ["Refunds / Recoveries", recoveries],
      ["Net Recorded Cost", netCost],
      ["Internal Transfers (excluded from expense)", transfers],
      ["Missing Bill Entries", missingBills.length],
      [],
      ["SITE / BUSINESS UNIT", "ENTRIES", "NET COST", "MISSING BILL VALUE", "% OF NET COST"],
      ...Array.from(summaryBySite.entries()).sort((a, b) => b[1].amount - a[1].amount).map(([site, v]) => [site, v.count, v.amount, v.missing, netCost ? v.amount / netCost : 0]),
      [],
      ["CATEGORY", "NET AMOUNT"],
      ...Array.from(summaryByCategory.entries()).sort((a, b) => b[1] - a[1]).map(([c, v]) => [c, v]),
      [],
      ["CONTROL NOTE"],
      ["Internal transfers are recorded for traceability but are not counted as company expenses. Salary is read from the final monthly salary archive; Rattilal cash labour remains a separate cash-labour cost and is not included in employee gross salary."],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA);
    wsSummary["!cols"] = [{ wch: 38 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 18 }];
    wsSummary["!merges"] = [
      XLSX.utils.decode_range("A1:E1"), XLSX.utils.decode_range("A2:E2"), XLSX.utils.decode_range("A3:E3"),
      XLSX.utils.decode_range(`A${summaryAoA.length}:E${summaryAoA.length}`),
    ];
    for (const addr of ["B6", "B7", "B8", "B9", "B10"]) if (wsSummary[addr]) wsSummary[addr].z = '₹#,##0.00';
    for (let r = 14; r <= 13 + summaryBySite.size; r++) {
      if (wsSummary[`C${r}`]) wsSummary[`C${r}`].z = '₹#,##0.00';
      if (wsSummary[`D${r}`]) wsSummary[`D${r}`].z = '₹#,##0.00';
      if (wsSummary[`E${r}`]) wsSummary[`E${r}`].z = '0.0%';
    }
    XLSX.utils.book_append_sheet(wb, wsSummary, "EXECUTIVE SUMMARY");

    const headers = ["Date", "Source", "Business Unit", "Site / Project", "Transaction Type", "Category", "Payee / Vendor", "Description", "Payment Mode", "PO / UTR / Reference", "Document Status", "Amount (INR)"];
    const siteGroups = new Map<string, typeof reportRows>();
    for (const row of reportRows) {
      const list = siteGroups.get(row.site) ?? [];
      list.push(row);
      siteGroups.set(row.site, list);
    }
    for (const [site, rows] of Array.from(siteGroups.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      const aoa: any[][] = [
        ["RATNESWAR ENGINEERING", "", "", "", "", "", "", "", "", "", "", ""],
        [`${site} — EXPENSE & PAYMENT LEDGER`],
        [`Period: ${dayLabel(fromDate)} to ${dayLabel(toDate)}`],
        [],
        headers,
        ...rows.map((r) => [r.date, r.source, r.businessUnit, r.site, r.type, r.category, r.payee, r.description, r.paymentMode, r.reference, r.document, r.amount]),
        [],
        ["TOTAL", "", "", "", "", "", "", "", "", "", "", rows.reduce((s, r) => s + r.amount, 0)],
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 13 }, { wch: 19 }, { wch: 23 }, { wch: 24 }, { wch: 20 }, { wch: 17 }, { wch: 24 }, { wch: 42 }, { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 16 }];
      ws["!autofilter"] = { ref: `A5:L${5 + rows.length}` };
      ws["!merges"] = [XLSX.utils.decode_range("A1:L1"), XLSX.utils.decode_range("A2:L2"), XLSX.utils.decode_range("A3:L3")];
      for (let r = 6; r <= 5 + rows.length; r++) {
        if (ws[`A${r}`]) ws[`A${r}`].z = "dd-mmm-yyyy";
        if (ws[`L${r}`]) ws[`L${r}`].z = '₹#,##0.00;[Red]-₹#,##0.00';
      }
      const totalRow = aoa.length;
      if (ws[`L${totalRow}`]) ws[`L${totalRow}`].z = '₹#,##0.00;[Red]-₹#,##0.00';
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName(site));
    }

    const transferRows = expenses.filter((e) => e.transactionType === "INTERNAL_TRANSFER");
    const directAoA: any[][] = [
      ["RATNESWAR ENGINEERING — DIRECT / MANUAL / INTERNAL PAYMENT REGISTER"],
      [`Period: ${dayLabel(fromDate)} to ${dayLabel(toDate)}`],
      [], headers,
      ...expenses.filter((e) => !e.siteId || ["VENDOR_PAYMENT", "PO_PAYMENT", "ADVANCE", "CASH_EXPENSE", "INTERNAL_TRANSFER"].includes(e.transactionType)).map((e) => [
        new Date(e.date), "Expenses & Payments", e.businessUnit, e.site?.name || "UNASSIGNED / GENERAL", pretty(e.transactionType), pretty(e.category), e.payee || e.vendor?.name || "", e.description, e.paymentMode || "", e.bankReference || e.purchaseOrder?.poNo || "", pretty(e.documentStatus), e.amount,
      ]),
      [],
      ["Internal transfer total (excluded from expense)", "", "", "", "", "", "", "", "", "", "", transferRows.reduce((s, e) => s + e.amount, 0)],
    ];
    const wsDirect = XLSX.utils.aoa_to_sheet(directAoA);
    wsDirect["!cols"] = [{ wch: 13 }, { wch: 19 }, { wch: 23 }, { wch: 24 }, { wch: 22 }, { wch: 17 }, { wch: 24 }, { wch: 42 }, { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 16 }];
    wsDirect["!merges"] = [XLSX.utils.decode_range("A1:L1"), XLSX.utils.decode_range("A2:L2")];
    XLSX.utils.book_append_sheet(wb, wsDirect, "DIRECT & MANUAL");

    const ledger = XLSX.utils.aoa_to_sheet([headers, ...reportRows.map((r) => [r.date, r.source, r.businessUnit, r.site, r.type, r.category, r.payee, r.description, r.paymentMode, r.reference, r.document, r.amount])]);
    ledger["!cols"] = [{ wch: 13 }, { wch: 19 }, { wch: 23 }, { wch: 24 }, { wch: 20 }, { wch: 17 }, { wch: 24 }, { wch: 42 }, { wch: 18 }, { wch: 24 }, { wch: 20 }, { wch: 16 }];
    ledger["!autofilter"] = { ref: `A1:L${1 + reportRows.length}` };
    XLSX.utils.book_append_sheet(wb, ledger, "DATA LEDGER");

    XLSX.writeFile(wb, `Ratneswar_Expenses_Payments_${cleanFilePart(fromDate)}_to_${cleanFilePart(toDate)}.xlsx`, { compression: true });
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Reporting Period</p>
            <p className="mt-1 text-xs text-slate-500">Choose month-to-month. The same period is used for summary, site sheets, salary cost and exports.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1"><Label className="text-xs">From month</Label><Input type="month" value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="w-[165px]" /></div>
            <div className="space-y-1"><Label className="text-xs">To month</Label><Input type="month" value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="w-[165px]" /></div>
            <Button variant="outline" onClick={applyPeriod}>Apply</Button>
            <Button variant="outline" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4" /> Export Excel</Button>
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Direct / Field Outflows</p><p className="mt-2 text-xl font-bold text-slate-950">{formatINR(outflows)}</p><p className="mt-1 text-[11px] text-slate-400">Excludes internal transfers</p></Card>
        <Card className="border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Salary & Manpower</p><p className="mt-2 text-xl font-bold text-slate-950">{formatINR(salaryCost)}</p><p className="mt-1 text-[11px] text-slate-400">From final salary archive</p></Card>
        <Card className="border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Refund / Recovery</p><p className="mt-2 text-xl font-bold text-emerald-700">{formatINR(recoveries)}</p><p className="mt-1 text-[11px] text-slate-400">Reduces net cost</p></Card>
        <Card className="border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Net Recorded Cost</p><p className="mt-2 text-xl font-bold text-blue-800">{formatINR(netCost)}</p><p className="mt-1 text-[11px] text-slate-400">Selected reporting period</p></Card>
        <Card className="border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Missing Bills</p><p className="mt-2 text-xl font-bold text-amber-700">{missingBills.length}</p><p className="mt-1 text-[11px] text-slate-400">Need document follow-up</p></Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search payee, site, PO, UTR, description..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Record Expense / Payment</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader><DialogTitle>Record Expense / Payment</DialogTitle></DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5"><Label>Business Unit *</Label><Select value={form.businessUnit} onValueChange={(businessUnit) => setForm({ ...form, businessUnit })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BUSINESS_UNITS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Site / Project</Label><Select value={form.siteId || "none"} onValueChange={(v) => setForm({ ...form, siteId: v === "none" ? "" : v })}><SelectTrigger><SelectValue placeholder="General / no site" /></SelectTrigger><SelectContent><SelectItem value="none">General / no site</SelectItem>{sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Transaction Type *</Label><Select value={form.transactionType} onValueChange={(transactionType) => setForm({ ...form, transactionType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Category *</Label><Select value={form.category} onValueChange={(category) => setForm({ ...form, category: category as typeof form.category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((category) => <SelectItem key={category} value={category}>{pretty(category)}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Payee / Person / Vendor</Label><Input value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} placeholder="e.g. LAMCO / Kanaksinh Dodiya" /></div>
                <div className="space-y-1.5"><Label>Vendor Master</Label><Select value={form.vendorId || "none"} onValueChange={(v) => setForm({ ...form, vendorId: v === "none" ? "" : v })}><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent><SelectItem value="none">No linked vendor</SelectItem>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>PO Link</Label><Select value={form.purchaseOrderId || "none"} onValueChange={(v) => setForm({ ...form, purchaseOrderId: v === "none" ? "" : v })}><SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger><SelectContent><SelectItem value="none">No linked PO</SelectItem>{purchaseOrders.map((po) => <SelectItem key={po.id} value={po.id}>{po.poNo} — {po.vendorName}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Payment Mode</Label><Select value={form.paymentMode} onValueChange={(paymentMode) => setForm({ ...form, paymentMode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_MODES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>UTR / Bank Reference</Label><Input value={form.bankReference} onChange={(e) => setForm({ ...form, bankReference: e.target.value })} /></div>
                <div className="space-y-1.5 md:col-span-2"><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was paid / purchased and why?" /></div>
                <div className="space-y-1.5"><Label>Bill / Receipt</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} /><p className="text-[11px] text-slate-500">Optional. If unavailable now, mark Document Pending.</p></div>
                <div className="space-y-1.5"><Label>Document Status</Label><Select value={form.documentStatus} onValueChange={(documentStatus) => setForm({ ...form, documentStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NOT_REQUIRED">Not Required</SelectItem><SelectItem value="DOCUMENT_PENDING">Document Pending</SelectItem><SelectItem value="AVAILABLE">Available</SelectItem><SelectItem value="VERIFIED">Verified</SelectItem></SelectContent></Select></div>
              </div>
              {form.transactionType === "INTERNAL_TRANSFER" && <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">Internal Transfer will stay in the transaction register for traceability, but it will not be counted as an expense.</div>}
              <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button loading={loading || uploading} onClick={saveExpense}>Save Record</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <TableContainer>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Business Unit / Site</TableHead><TableHead>Type</TableHead><TableHead>Payee / Description</TableHead><TableHead>Mode / Reference</TableHead><TableHead>Document</TableHead><TableHead className="text-right">Amount</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {visibleExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="whitespace-nowrap text-xs">{formatDate(expense.date)}</TableCell>
                <TableCell><p className="text-sm font-medium">{expense.site?.name || expense.businessUnit}</p><p className="text-[11px] text-slate-400">{expense.site ? expense.businessUnit : "General / no site"}</p></TableCell>
                <TableCell><Badge variant={expense.transactionType === "INTERNAL_TRANSFER" ? "outline" : expense.isMajor ? "warning" : "secondary"}>{pretty(expense.transactionType)}</Badge></TableCell>
                <TableCell className="max-w-[320px]"><p className="truncate text-sm font-medium">{expense.payee || expense.vendor?.name || expense.description}</p><p className="truncate text-[11px] text-slate-500">{expense.description}</p>{expense.purchaseOrder && <p className="mt-0.5 text-[10px] text-blue-600">PO {expense.purchaseOrder.poNo}</p>}</TableCell>
                <TableCell><p className="text-xs">{expense.paymentMode || "—"}</p><p className="text-[10px] text-slate-400">{expense.bankReference || ""}</p></TableCell>
                <TableCell><Badge variant={expense.documentStatus === "DOCUMENT_PENDING" ? "warning" : expense.documentStatus === "AVAILABLE" || expense.documentStatus === "VERIFIED" ? "success" : "outline"}>{pretty(expense.documentStatus)}</Badge></TableCell>
                <TableCell className={`text-right font-mono text-sm font-semibold ${expense.transactionType === "INTERNAL_TRANSFER" ? "text-slate-400" : expense.transactionType === "REFUND_RECOVERY" ? "text-emerald-700" : ""}`}>{expense.transactionType === "REFUND_RECOVERY" ? "−" : ""}{formatINR(expense.amount)}</TableCell>
                <TableCell>{canDelete && <button onClick={() => remove(expense.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete record"><Trash2 className="h-4 w-4" /></button>}</TableCell>
              </TableRow>
            ))}
            {!visibleExpenses.length && <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-slate-400">No expense/payment records in this period.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <div id="print-doc" className="expense-management-report rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3"><img src="/brand/ratneswar-symbol.png" alt="Ratneswar" className="h-11 w-11 object-contain" /><div><p className="text-lg font-bold text-slate-950">Ratneswar Engineering</p><p className="text-[11px] uppercase tracking-[.16em] text-slate-500">Expenses & Payments — Management Summary</p></div></div>
          <div className="text-right text-xs text-slate-500"><p className="font-semibold text-slate-800">{dayLabel(fromDate)} — {dayLabel(toDate)}</p><p>Generated from ERP records</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3 py-4 md:grid-cols-5">
          {[ ["Direct Outflows", outflows], ["Salary / Manpower", salaryCost], ["Recoveries", recoveries], ["Net Cost", netCost], ["Internal Transfers*", transfers] ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-mono text-base font-bold text-slate-900">₹{money(Number(value))}</p></div>)}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Site / Project Summary</p><table className="w-full text-xs"><thead><tr className="border-y border-slate-200 bg-slate-50"><th className="px-2 py-2 text-left">Site</th><th className="px-2 py-2 text-right">Entries</th><th className="px-2 py-2 text-right">Net Cost</th></tr></thead><tbody>{Array.from(reportRows.reduce((m, r) => { const v=m.get(r.site)??{count:0,amount:0}; v.count++; v.amount+=r.amount; m.set(r.site,v); return m; }, new Map<string,{count:number;amount:number}>()).entries()).sort((a,b)=>b[1].amount-a[1].amount).map(([site,v])=><tr key={site} className="border-b border-slate-100"><td className="px-2 py-2 font-medium">{site}</td><td className="px-2 py-2 text-right">{v.count}</td><td className="px-2 py-2 text-right font-mono">₹{money(v.amount)}</td></tr>)}</tbody></table></div>
          <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">Control Notes</p><div className="space-y-2 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600"><p><b>Internal transfers:</b> recorded for traceability but excluded from expenses.</p><p><b>Salary:</b> automatically read from uploaded final monthly salary sheets and distributed site-wise.</p><p><b>Rattilal labour:</b> remains a separate cash-labour cost and is not included in employee gross salary.</p><p><b>Missing bills:</b> {missingBills.length} direct expense/payment entries need supporting documents in this period.</p></div></div>
        </div>
        <p className="mt-4 border-t border-slate-200 pt-3 text-[10px] text-slate-400">* Internal transfer amounts are displayed only for movement-of-funds tracking and do not affect Net Cost.</p>
      </div>
    </div>
  );
}
