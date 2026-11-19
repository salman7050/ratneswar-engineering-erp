"use client";

import * as React from "react";
import { CheckCircle2, FileUp, Plus, Trash2 } from "lucide-react";

type Site = { id: string; name: string; location: string };
type Member = { id: string; name: string; phone: string | null; roleLabel: string; businessUnit: string; area: string | null };
type Summary = { month: string; advances: number; expenses: number; refunds: number; adjustments: number; balance: number; pendingCount: number };

const CATEGORIES = [
  ["FOOD", "Food"],
  ["SITE_TRANSPORT", "Site Transport"],
  ["LABOUR", "Labour"],
  ["FUEL", "Fuel"],
  ["MATERIAL", "Material"],
  ["EQUIPMENT", "Equipment"],
  ["OFFICE", "Office"],
  ["MARKETING", "Marketing"],
  ["TRANSPORT", "Transport"],
  ["MISC", "Other / Misc"],
] as const;

const PAYMENT_MODES = ["Cash", "UPI", "Internet Banking", "NEFT / RTGS", "Card", "Cheque", "Other"] as const;

type Line = {
  id: string;
  date: string;
  siteId: string;
  siteName: string;
  category: (typeof CATEGORIES)[number][0];
  description: string;
  amount: string;
  paymentMode: string;
  reference: string;
  reimbursementRequested: boolean;
  receipt: File | null;
};

function freshLine(): Line {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    siteId: "",
    siteName: "",
    category: "FOOD",
    description: "",
    amount: "",
    paymentMode: "Cash",
    reference: "",
    reimbursementRequested: false,
    receipt: null,
  };
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

export function PublicExpenseForm({
  token,
  member,
  sites,
  summary,
}: {
  token: string;
  member: Member;
  sites: Site[];
  summary: Summary;
}) {
  const [lines, setLines] = React.useState<Line[]>([freshLine()]);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState<{ id: string; message: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const total = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);

  function update(id: string, patch: Partial<Line>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((current) => [...current, freshLine()]);
  }

  function removeLine(id: string) {
    setLines((current) => (current.length === 1 ? current : current.filter((line) => line.id !== id)));
  }

  async function submit() {
    setError(null);
    setDone(null);
    for (const line of lines) {
      if (!line.date || !line.description.trim() || !(Number(line.amount) > 0)) {
        setError("Har expense line me date, description aur valid amount required hai.");
        return;
      }
      if (!line.siteId && !line.siteName.trim()) {
        setError("Har expense line me site/project select ya name enter karo.");
        return;
      }
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("payload", JSON.stringify({
        note: note.trim() || null,
        items: lines.map((line) => ({
          date: line.date,
          category: line.category,
          siteId: line.siteId || null,
          siteName: line.siteId ? null : line.siteName.trim(),
          description: line.description.trim(),
          amount: Number(line.amount),
          paymentMode: line.paymentMode,
          reference: line.reference.trim() || null,
          reimbursementRequested: line.reimbursementRequested,
        })),
      }));
      lines.forEach((line, index) => {
        if (line.receipt) form.append(`receipt_${index}`, line.receipt);
      });

      const response = await fetch(`/api/expense-link/${encodeURIComponent(token)}/submit`, {
        method: "POST",
        body: form,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not submit expenses.");

      setDone({ id: body.submissionId, message: body.message });
      setLines([freshLine()]);
      setNote("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit expenses.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-5 text-slate-900 md:px-6 md:py-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Ratneswar Engineering</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">Expense Submission</h1>
              <p className="mt-2 text-sm text-slate-500">Apne site/office expenses add karo. Submit hone ke baad Admin verification pending rahega.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold">{member.name}</p>
              <p className="text-slate-500">{member.roleLabel}{member.area ? ` · ${member.area}` : ""}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Name", member.name],
              ["Mobile", member.phone || "—"],
              ["Role", member.roleLabel],
              ["Business Unit", member.businessUnit],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 px-3 py-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                <div className="mt-1 text-sm font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">This Month Advance</p><p className="mt-1 text-lg font-bold text-emerald-700">{money(summary.advances)}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Approved Expenses</p><p className="mt-1 text-lg font-bold text-red-700">{money(summary.expenses)}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Balance With Member</p><p className="mt-1 text-lg font-bold">{money(summary.balance)}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Pending Submissions</p><p className="mt-1 text-lg font-bold">{summary.pendingCount}</p></div>
        </section>

        {done && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div><p className="font-semibold">{done.message}</p><p className="mt-1 text-xs">Submission ID: {done.id}</p></div>
          </div>
        )}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>}

        <section className="space-y-4">
          {lines.map((line, index) => (
            <div key={line.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div><p className="text-sm font-bold">Expense #{index + 1}</p><p className="text-xs text-slate-400">Ek expense = ek passbook line after approval</p></div>
                <button type="button" onClick={() => removeLine(line.id)} disabled={lines.length === 1} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label="Remove expense"><Trash2 className="h-4 w-4" /></button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1.5 text-sm"><span className="font-medium">Date *</span><input type="date" value={line.date} onChange={(e) => update(line.id, { date: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" /></label>
                <label className="space-y-1.5 text-sm lg:col-span-2"><span className="font-medium">Site / Project *</span><select value={line.siteId} onChange={(e) => update(line.id, { siteId: e.target.value, siteName: "" })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none"><option value="">Other / Manual site</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name} — {site.location}</option>)}</select>{!line.siteId && <input value={line.siteName} onChange={(e) => update(line.id, { siteName: e.target.value })} placeholder="Village / site / project name" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none" />}</label>
                <label className="space-y-1.5 text-sm"><span className="font-medium">Category *</span><select value={line.category} onChange={(e) => update(line.id, { category: e.target.value as Line["category"] })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5">{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>

                <label className="space-y-1.5 text-sm md:col-span-2 lg:col-span-2"><span className="font-medium">Description *</span><input value={line.description} onChange={(e) => update(line.id, { description: e.target.value })} placeholder="Example: Rapar site lunch / local labour / vehicle diesel" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none" /></label>
                <label className="space-y-1.5 text-sm"><span className="font-medium">Amount (₹) *</span><input inputMode="decimal" value={line.amount} onChange={(e) => update(line.id, { amount: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="0.00" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-right font-semibold outline-none" /></label>
                <label className="space-y-1.5 text-sm"><span className="font-medium">Payment Mode *</span><select value={line.paymentMode} onChange={(e) => update(line.id, { paymentMode: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5">{PAYMENT_MODES.map((mode) => <option key={mode}>{mode}</option>)}</select></label>

                <label className="space-y-1.5 text-sm md:col-span-2"><span className="font-medium">UTR / Reference (optional)</span><input value={line.reference} onChange={(e) => update(line.id, { reference: e.target.value })} placeholder="UPI / UTR / bill reference" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none" /></label>
                <label className="space-y-1.5 text-sm md:col-span-2"><span className="font-medium">Receipt / Bill (optional)</span><div className="flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2"><FileUp className="h-4 w-4 text-slate-400" /><input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(e) => update(line.id, { receipt: e.target.files?.[0] || null })} className="min-w-0 flex-1 text-xs" /></div></label>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={line.reimbursementRequested} onChange={(e) => update(line.id, { reimbursementRequested: e.target.checked })} className="h-4 w-4" /><span>Ye amount mujhe reimburse karna hai</span></label>
            </div>
          ))}
        </section>

        <button type="button" onClick={addLine} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-400 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"><Plus className="h-4 w-4" /> Add Another Expense</button>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <label className="space-y-1.5 text-sm"><span className="font-medium">Submission Note (optional)</span><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Admin ke liye koi note..." className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none" /></label>
          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs uppercase tracking-wide text-slate-400">Submission Total</p><p className="text-2xl font-bold">{money(total)}</p></div>
            <button type="button" onClick={submit} disabled={saving} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">{saving ? "Submitting..." : "Submit Expenses"}</button>
          </div>
        </section>

        <p className="pb-4 text-center text-xs text-slate-400">Permanent Ratneswar expense link · Admin can revoke this link anytime.</p>
      </div>
    </div>
  );
}
