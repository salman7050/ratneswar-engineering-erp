"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, FileCheck2, FileSpreadsheet, Loader2, Paperclip, Trash2, Upload, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import { uploadDocumentFile } from "@/lib/supabase/storage";
import { parseBankBulkTotal, parseSalaryWorkbook, type ParsedSalaryWorkbook } from "@/lib/salary-parser";
import { attachSalaryBankFile, attachSalaryPaymentProof, createSalaryMonthlyRecord, deleteSalaryMonthlyRecord, setSalaryRecordStatus } from "@/lib/actions/salary-record-actions";
import type { SalaryMonthlyRecordItem } from "@/lib/queries/salary-records";
import { toast } from "@/lib/toast";

const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function summaryObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function UploadSalaryDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [parsed, setParsed] = React.useState<ParsedSalaryWorkbook | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function pick(next: File | null) {
    setFile(next); setParsed(null);
    if (!next) return;
    try { setParsed(await parseSalaryWorkbook(next)); }
    catch (error) { toast.error("Salary sheet", error instanceof Error ? error.message : "Could not read salary workbook."); setFile(null); }
  }

  async function save() {
    if (!file || !parsed || busy) return;
    setBusy(true);
    try {
      const uploaded = await uploadDocumentFile(file);
      const result = await createSalaryMonthlyRecord({
        periodKey: parsed.periodKey, month: parsed.month, year: parsed.year, title: parsed.title,
        salaryFileName: uploaded.name, salaryFileUrl: uploaded.path,
        pfEmployee: parsed.pfEmployee, pfEmployer: parsed.pfEmployer, professionalTax: parsed.professionalTax, advanceRecovery: parsed.advanceRecovery,
        sourceSheet: parsed.sourceSheet, cashLabourGross: parsed.cashLabourGross, distributions: parsed.distributions,
      });
      if (!result.ok) throw new Error(result.error);
      toast.success("Salary archived", `${MONTH[parsed.month - 1]} ${parsed.year} distributed successfully.`);
      setOpen(false); setFile(null); setParsed(null); router.refresh();
    } catch (error) { toast.error("Salary upload failed", error instanceof Error ? error.message : "Could not archive salary."); }
    finally { setBusy(false); }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button><Upload className="h-4 w-4" /> Upload Final Salary Sheet</Button></DialogTrigger>
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Upload Monthly Final Salary Sheet</DialogTitle><DialogDescription>Your Excel remains the source of truth. ERP only archives it and distributes the final values site-wise.</DialogDescription></DialogHeader>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center hover:border-blue-300 hover:bg-blue-50/40">
        <FileSpreadsheet className="h-8 w-8 text-blue-600" /><span className="mt-2 text-sm font-semibold text-slate-800">{file?.name || "Choose salary Excel"}</span><span className="mt-1 text-xs text-slate-400">Use the same monthly format as SALARY JUNE-2026.xlsx</span>
        <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => void pick(e.target.files?.[0] ?? null)} />
      </label>
      {parsed && <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Detected Period</p><p className="mt-1 text-lg font-bold text-slate-900">{MONTH[parsed.month - 1]} {parsed.year}</p></div><Badge variant="success">Ready to archive</Badge></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Employee Gross</p><p className="mt-1 text-sm font-bold text-slate-800">{formatINR(parsed.employeeGross)}</p><p className="text-[9px] text-slate-400">Rattilal excluded</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Bank Payable</p><p className="mt-1 text-sm font-bold text-slate-800">{formatINR(parsed.bankPayable)}</p></div>
          <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] text-amber-600">Rattilal Cash Labour</p><p className="mt-1 text-sm font-bold text-amber-800">{formatINR(parsed.cashLabour)}</p></div>
          <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] text-blue-600">Manpower Cost</p><p className="mt-1 text-sm font-bold text-blue-800">{formatINR(parsed.totalManpowerCost)}</p></div>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">Rule applied: Rattilal labour is not included in employee gross/bank salary. It is tracked separately as cash labour while still remaining visible in total manpower cost.</p>
      </div>}
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void save()} disabled={!parsed || busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />} Archive & Distribute</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function FileAttachButton({ record, type }: { record: SalaryMonthlyRecordItem; type: "bank" | "proof" }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  async function handle(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      if (type === "bank") {
        const total = await parseBankBulkTotal(file);
        const uploaded = await uploadDocumentFile(file);
        const result = await attachSalaryBankFile({ id: record.id, fileName: uploaded.name, fileUrl: uploaded.path, bankTotal: total });
        if (!result.ok) throw new Error(result.error);
        if (result.data.matched) toast.success("Bank file matched", `Bulk transfer total ${formatINR(total)} exactly matches ERP bank payable.`);
        else toast.warning("Bank total difference", `Expected ${formatINR(result.data.expected)} · Bank file ${formatINR(total)} · Difference ${formatINR(result.data.difference)}`);
      } else {
        const uploaded = await uploadDocumentFile(file);
        const result = await attachSalaryPaymentProof({ id: record.id, fileName: uploaded.name, fileUrl: uploaded.path });
        if (!result.ok) throw new Error(result.error);
        toast.success("Payment proof saved", "Salary month marked Paid.");
      }
      router.refresh();
    } catch (error) { toast.error(type === "bank" ? "Bank file" : "Payment proof", error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }
  return <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : type === "bank" ? <Banknote className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}{type === "bank" ? (record.bankFileName ? "Replace Bank Bulk" : "Upload Bank Bulk") : (record.paymentProofName ? "Replace Payment Proof" : "Upload Payment Proof")}<input type="file" className="hidden" accept={type === "bank" ? ".xlsx,.xls" : ".pdf,.png,.jpg,.jpeg,.xlsx"} onChange={(e) => void handle(e.target.files?.[0] ?? null)} /></label>;
}

export function SalaryArchiveClient({ records }: { records: SalaryMonthlyRecordItem[] }) {
  const router = useRouter();
  async function remove(id: string) {
    if (!window.confirm("Delete this monthly salary archive and its site distribution?")) return;
    const result = await deleteSalaryMonthlyRecord(id);
    if (!result.ok) { toast.error("Salary record", result.error); return; }
    toast.success("Salary record deleted"); router.refresh();
  }
  async function markPaid(id: string) {
    const result = await setSalaryRecordStatus(id, "PAID");
    if (!result.ok) { toast.error("Salary record", result.error); return; }
    toast.success("Salary month marked Paid"); router.refresh();
  }

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold text-slate-800">Monthly salary archive</p><p className="mt-1 text-xs text-slate-500">Upload the final verified Excel each month. Salary calculation and verification stay in your existing Excel/Drive workflow; ERP only archives and distributes the final record.</p></div><UploadSalaryDialog /></div>
    {!records.length ? <Card className="flex flex-col items-center justify-center border-slate-200 bg-white p-12 text-center shadow-sm"><FileSpreadsheet className="h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No salary month archived yet</p><p className="mt-1 text-xs text-slate-400">Upload your final monthly salary Excel to begin.</p></Card> : records.map((record) => {
      const meta = summaryObject(record.parsedSummary);
      const bankMatched = meta.bankMatched === true;
      const bankDifference = typeof meta.bankDifference === "number" ? meta.bankDifference : null;
      return <Card key={record.id} className="overflow-hidden border-slate-200 bg-white p-0 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><FileSpreadsheet className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{MONTH[record.month - 1]} {record.year}</h2><Badge variant={record.status === "PAID" ? "success" : "info"}>{record.status}</Badge>{record.bankFileName && <Badge variant={bankMatched ? "success" : "warning"}>{bankMatched ? "Bank Matched" : "Check Bank Total"}</Badge>}</div><p className="mt-1 text-xs text-slate-500">Uploaded by {record.createdBy.name} · source sheet: {String(meta.sourceSheet || "Monthly Salary Excel")}</p></div></div>
          <div className="flex flex-wrap gap-2"><a href={record.salaryDownloadUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><FileSpreadsheet className="h-3.5 w-3.5" /> Salary Excel</Button></a>{record.bankDownloadUrl && <a href={record.bankDownloadUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><Banknote className="h-3.5 w-3.5" /> Bank Bulk</Button></a>}{record.paymentProofDownloadUrl && <a href={record.paymentProofDownloadUrl} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><Paperclip className="h-3.5 w-3.5" /> Payment Proof</Button></a>}<button onClick={() => void remove(record.id)} className="rounded-lg border border-rose-100 p-2 text-rose-500 hover:bg-rose-50" aria-label="Delete salary record"><Trash2 className="h-4 w-4" /></button></div>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-white p-4"><p className="text-[10px] uppercase tracking-[.12em] text-slate-400">Employee Gross</p><p className="mt-1 text-xl font-bold text-slate-900">{formatINR(record.employeeGross)}</p><p className="text-[10px] text-slate-400">Rattilal excluded</p></div>
          <div className="bg-white p-4"><p className="text-[10px] uppercase tracking-[.12em] text-slate-400">Bank Payable</p><p className="mt-1 text-xl font-bold text-slate-900">{formatINR(record.bankPayable)}</p>{bankDifference !== null && <p className={bankMatched ? "text-[10px] text-emerald-600" : "text-[10px] text-amber-600"}>{bankMatched ? "Bank file difference ₹0" : `Difference ${formatINR(bankDifference)}`}</p>}</div>
          <div className="bg-white p-4"><p className="text-[10px] uppercase tracking-[.12em] text-slate-400">Rattilal Cash Labour</p><p className="mt-1 text-xl font-bold text-amber-700">{formatINR(record.cashLabour)}</p><p className="text-[10px] text-slate-400">Separate cash route</p></div>
          <div className="bg-white p-4"><p className="text-[10px] uppercase tracking-[.12em] text-slate-400">Total Manpower Cost</p><p className="mt-1 text-xl font-bold text-blue-700">{formatINR(record.totalManpowerCost)}</p><p className="text-[10px] text-slate-400">Employee gross + cash labour gross</p></div>
        </div>
        <div className="grid gap-4 p-5 xl:grid-cols-[1fr_auto]">
          <TableContainer className="border-slate-200"><Table><TableHeader><TableRow><TableHead>Site / Group</TableHead><TableHead>Route</TableHead><TableHead className="text-right">Gross / Cost</TableHead><TableHead className="text-right">Net Paid</TableHead></TableRow></TableHeader><TableBody>{record.distributions.map((d) => <TableRow key={d.id}><TableCell><p className="text-sm font-medium text-slate-800">{d.label}</p>{d.site && <p className="text-[10px] text-slate-400">Linked: {d.site.name}</p>}</TableCell><TableCell><Badge variant={d.type === "CASH_LABOUR" ? "warning" : d.site ? "info" : "outline"}>{d.type === "CASH_LABOUR" ? "Cash Labour" : d.site ? "Site Salary" : "General / HO"}</Badge></TableCell><TableCell className="text-right font-mono text-xs">{formatINR(d.grossAmount)}</TableCell><TableCell className="text-right font-mono text-xs font-semibold">{formatINR(d.netPaid)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
          <div className="flex min-w-[230px] flex-col gap-2"><FileAttachButton record={record} type="bank" /><FileAttachButton record={record} type="proof" />{record.status !== "PAID" && <Button variant="outline" size="sm" className="justify-start" onClick={() => void markPaid(record.id)}><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Mark Paid</Button>}<div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 text-slate-500"><WalletCards className="mb-1 h-4 w-4 text-slate-500" />These distributions feed site/company manpower reporting. The bank payment is settlement of the same salary record, not a second expense.</div></div>
        </div>
      </Card>;
    })}
  </div>;
}
