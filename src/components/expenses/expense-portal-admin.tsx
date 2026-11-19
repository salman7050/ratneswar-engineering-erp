"use client";

import * as React from "react";
import { Check, Copy, FileSpreadsheet, Link2, Plus, RefreshCcw, ShieldOff, WalletCards, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "@/hooks/use-action";
import {
  approveExpenseSubmission,
  createExpenseMember,
  recordMemberAdvance,
  regenerateExpenseMemberLink,
  rejectExpenseSubmission,
  setExpenseMemberActive,
} from "@/lib/actions/expense-portal-actions";
import { uploadDocumentFile } from "@/lib/supabase/storage";
import { toast } from "@/lib/toast";

type AdminData = {
  members: Array<{
    id: string;
    name: string;
    phone: string | null;
    roleLabel: string;
    businessUnit: string;
    area: string | null;
    token: string;
    isActive: boolean;
    createdAt: string;
    submissionCount: number;
    passbookCount: number;
  }>;
  submissions: Array<{
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    note: string | null;
    submittedAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    member: { id: string; name: string; phone: string | null; roleLabel: string; businessUnit: string; area: string | null };
    items: Array<{
      id: string;
      date: string;
      category: string;
      siteId: string | null;
      siteName: string | null;
      siteLocation: string | null;
      description: string;
      amount: number;
      paymentMode: string;
      reference: string | null;
      receiptUrl: string | null;
      reimbursementRequested: boolean;
      expenseId: string | null;
    }>;
  }>;
  passbookEntries: Array<{
    id: string;
    type: "ADVANCE" | "EXPENSE" | "REFUND" | "ADJUSTMENT";
    date: string;
    description: string;
    amount: number;
    reference: string | null;
    proofUrl: string | null;
    member: { id: string; name: string; area: string | null };
    site: { name: string; location: string } | null;
    sourceExpenseId: string | null;
    createdBy: string;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
function pretty(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function ExpensePortalAdmin({ data }: { data: AdminData }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"pending" | "links" | "passbook">("pending");
  const [memberForm, setMemberForm] = React.useState({ name: "", phone: "", roleLabel: "Site Handler", businessUnit: "Ratneswar Engineering", area: "" });
  const [advance, setAdvance] = React.useState({ memberId: data.members[0]?.id || "", amount: "", date: new Date().toISOString().slice(0, 10), purpose: "", reference: "" });
  const [advanceProof, setAdvanceProof] = React.useState<File | null>(null);
  const [month, setMonth] = React.useState(currentMonth());
  const [passbookMember, setPassbookMember] = React.useState("ALL");

  const refresh = () => router.refresh();

  const createMember = useAction(createExpenseMember, { successMessage: "Employee expense link created", onSuccess: () => { setMemberForm({ name: "", phone: "", roleLabel: "Site Handler", businessUnit: "Ratneswar Engineering", area: "" }); refresh(); } });
  const activate = useAction(setExpenseMemberActive, { successMessage: "Link status updated", onSuccess: refresh });
  const regenerate = useAction(regenerateExpenseMemberLink, { successMessage: "New permanent link generated", onSuccess: refresh });
  const approve = useAction(approveExpenseSubmission, { successMessage: "Submission approved and posted to passbook", onSuccess: refresh });
  const reject = useAction(rejectExpenseSubmission, { successMessage: "Submission rejected", onSuccess: refresh });
  const addAdvance = useAction(recordMemberAdvance, { successMessage: "Advance added to member passbook", onSuccess: () => { setAdvance((v) => ({ ...v, amount: "", purpose: "", reference: "" })); setAdvanceProof(null); refresh(); } });

  const pending = data.submissions.filter((s) => s.status === "PENDING");
  const visiblePassbook = data.passbookEntries.filter((entry) => {
    if (!entry.date.startsWith(month)) return false;
    if (passbookMember !== "ALL" && entry.member.id !== passbookMember) return false;
    return true;
  });
  const passbookTotals = visiblePassbook.reduce((acc, e) => {
    if (e.type === "ADVANCE") acc.advance += e.amount;
    else if (e.type === "EXPENSE") acc.expense += e.amount;
    else if (e.type === "REFUND") acc.refund += e.amount;
    else acc.adjustment += e.amount;
    return acc;
  }, { advance: 0, expense: 0, refund: 0, adjustment: 0 });
  const passbookBalance = passbookTotals.advance + passbookTotals.refund + passbookTotals.adjustment - passbookTotals.expense;

  async function copyLink(member: AdminData["members"][number]) {
    const url = `${window.location.origin}/expense/${member.token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Expense link copied", member.name);
  }

  async function saveAdvance() {
    if (!advance.memberId || !(Number(advance.amount) > 0) || !advance.purpose.trim()) {
      toast.error("Member, amount and purpose are required.");
      return;
    }
    let proofUrl: string | null = null;
    if (advanceProof) {
      const uploaded = await uploadDocumentFile(advanceProof);
      proofUrl = uploaded.path;
    }
    await addAdvance.run({
      memberId: advance.memberId,
      amount: Number(advance.amount),
      date: new Date(`${advance.date}T12:00:00`),
      purpose: advance.purpose,
      reference: advance.reference || null,
      proofUrl,
    });
  }

  async function exportPassbook() {
    const XLSX = await import("xlsx");
    const rows = visiblePassbook.map((e) => ({
      Date: new Date(e.date),
      Member: e.member.name,
      Area: e.member.area || "",
      Type: pretty(e.type),
      Particulars: e.description,
      Reference: e.reference || "",
      "Advance / Credit": e.type === "ADVANCE" || e.type === "REFUND" || e.type === "ADJUSTMENT" ? e.amount : 0,
      "Expense / Debit": e.type === "EXPENSE" ? e.amount : 0,
      "Entered By": e.createdBy,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 13 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 55 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, "Member Passbook");
    XLSX.writeFile(wb, `Ratneswar_Member_Passbook_${month}.xlsx`, { compression: true });
  }

  const tabs = [
    ["pending", `Pending Submissions (${pending.length})`],
    ["links", `Employee Links (${data.members.length})`],
    ["passbook", "Member Passbook"],
  ] as const;

  return (
    <section className="mt-2 space-y-5">
      <div className="border-t border-slate-200 pt-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Employee Expense Portal</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Expense Links, Verification & Member Passbook</h2>
          <p className="mt-1 text-sm text-slate-500">Employee submissions remain pending until Admin approval. Approval creates company expense + member passbook debit automatically.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map(([value, label]) => (
            <button key={value} onClick={() => setTab(value)} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${tab === value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{label}</button>
          ))}
        </div>
      </div>

      {tab === "pending" && (
        <div className="space-y-4">
          {!pending.length && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">No pending employee expense submissions.</div>}
          {pending.map((submission) => {
            const total = submission.items.reduce((s, item) => s + item.amount, 0);
            return (
              <div key={submission.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{submission.member.name} <span className="font-normal text-slate-400">· {submission.member.roleLabel}</span></p>
                    <p className="text-xs text-slate-500">{submission.member.area || "No area"} · Submitted {dateLabel(submission.submittedAt)} · {submission.items.length} lines</p>
                  </div>
                  <div className="text-left md:text-right"><p className="text-xs uppercase tracking-wide text-slate-400">Total</p><p className="text-lg font-bold">{money(total)}</p></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th>Site / Project</th><th>Category</th><th>Description</th><th>Mode / Ref</th><th>Bill</th><th className="pr-4 text-right">Amount</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {submission.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap">{dateLabel(item.date)}</td>
                          <td className="py-3">{item.siteName || "General"}</td>
                          <td className="py-3">{pretty(item.category)}</td>
                          <td className="py-3"><div className="font-medium">{item.description}</div>{item.reimbursementRequested && <div className="text-xs text-amber-700">Reimbursement requested</div>}</td>
                          <td className="py-3"><div>{item.paymentMode}</div><div className="text-xs text-slate-400">{item.reference || "—"}</div></td>
                          <td className="py-3 text-xs">{item.receiptUrl ? "Uploaded" : "—"}</td>
                          <td className="py-3 pr-4 text-right font-semibold">{money(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {submission.note && <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600"><b>Note:</b> {submission.note}</div>}
                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-4 py-3">
                  <button disabled={reject.loading} onClick={() => reject.run(submission.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"><X className="h-4 w-4" /> Reject</button>
                  <button disabled={approve.loading} onClick={() => approve.run(submission.id)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"><Check className="h-4 w-4" /> Approve & Post</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "links" && (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="font-bold">Create Employee Expense Link</h3>
            <p className="mt-1 text-xs text-slate-500">Permanent link. Employee details remain locked on the form.</p>
            <div className="mt-4 space-y-3">
              <input value={memberForm.name} onChange={(e) => setMemberForm((v) => ({ ...v, name: e.target.value }))} placeholder="Name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={memberForm.phone} onChange={(e) => setMemberForm((v) => ({ ...v, phone: e.target.value }))} placeholder="Mobile (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={memberForm.roleLabel} onChange={(e) => setMemberForm((v) => ({ ...v, roleLabel: e.target.value }))} placeholder="Role e.g. Site Handler" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={memberForm.area} onChange={(e) => setMemberForm((v) => ({ ...v, area: e.target.value }))} placeholder="Area e.g. Rapar / Junagadh" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={memberForm.businessUnit} onChange={(e) => setMemberForm((v) => ({ ...v, businessUnit: e.target.value }))} placeholder="Business Unit" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <button disabled={createMember.loading} onClick={() => createMember.run({ ...memberForm, phone: memberForm.phone || null, area: memberForm.area || null })} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Create Link</button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 font-bold">Permanent Expense Links</div>
            <div className="divide-y divide-slate-100">
              {data.members.map((member) => (
                <div key={member.id} className="flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{member.name}</span><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{member.isActive ? "ACTIVE" : "REVOKED"}</span></div>
                    <p className="mt-1 text-xs text-slate-500">{member.roleLabel} · {member.area || "No area"} · {member.phone || "No mobile"}</p>
                    <p className="mt-1 text-xs text-slate-400">{member.submissionCount} submissions · {member.passbookCount} passbook entries</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => copyLink(member)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"><Copy className="h-3.5 w-3.5" /> Copy Link</button>
                    <button onClick={() => regenerate.run(member.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"><RefreshCcw className="h-3.5 w-3.5" /> New Link</button>
                    <button onClick={() => activate.run(member.id, !member.isActive)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold">{member.isActive ? <ShieldOff className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}{member.isActive ? "Revoke" : "Enable"}</button>
                  </div>
                </div>
              ))}
              {!data.members.length && <div className="p-8 text-center text-sm text-slate-400">Create the first employee expense link.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === "passbook" && (
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="flex items-center gap-2 font-bold"><WalletCards className="h-4 w-4" /> Give Advance to Member</h3>
              <div className="mt-4 space-y-3">
                <select value={advance.memberId} onChange={(e) => setAdvance((v) => ({ ...v, memberId: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">Select member</option>{data.members.filter((m) => m.isActive).map((m) => <option key={m.id} value={m.id}>{m.name} — {m.roleLabel}</option>)}</select>
                <div className="grid grid-cols-2 gap-2"><input type="date" value={advance.date} onChange={(e) => setAdvance((v) => ({ ...v, date: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /><input value={advance.amount} onChange={(e) => setAdvance((v) => ({ ...v, amount: e.target.value.replace(/[^0-9.]/g, "") }))} placeholder="Amount ₹" className="rounded-lg border border-slate-300 px-3 py-2.5 text-right text-sm" /></div>
                <input value={advance.purpose} onChange={(e) => setAdvance((v) => ({ ...v, purpose: e.target.value }))} placeholder="Purpose" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                <input value={advance.reference} onChange={(e) => setAdvance((v) => ({ ...v, reference: e.target.value }))} placeholder="UTR / Reference (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
                <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(e) => setAdvanceProof(e.target.files?.[0] || null)} className="w-full text-xs" />
                <button onClick={saveAdvance} disabled={addAdvance.loading} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">Record Advance</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Advance / Credit</p><p className="mt-1 text-xl font-bold text-emerald-700">{money(passbookTotals.advance)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Expenses / Debit</p><p className="mt-1 text-xl font-bold text-red-700">{money(passbookTotals.expense)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Refund / Adjustment</p><p className="mt-1 text-xl font-bold">{money(passbookTotals.refund + passbookTotals.adjustment)}</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Balance With Member</p><p className="mt-1 text-xl font-bold">{money(passbookBalance)}</p></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-wrap gap-2">
                <label className="text-xs font-semibold text-slate-500">Month<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900" /></label>
                <label className="text-xs font-semibold text-slate-500">Member<select value={passbookMember} onChange={(e) => setPassbookMember(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal text-slate-900"><option value="ALL">All Members</option>{data.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
              </div>
              <button onClick={exportPassbook} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"><FileSpreadsheet className="h-4 w-4" /> Download Excel</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[950px] w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date</th><th>Member</th><th>Particulars</th><th>Reference</th><th>Entered By</th><th className="text-right">Advance / Credit</th><th className="pr-4 text-right">Expense / Debit</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visiblePassbook.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{dateLabel(entry.date)}</td>
                      <td className="py-3"><div className="font-semibold">{entry.member.name}</div><div className="text-xs text-slate-400">{entry.member.area || ""}</div></td>
                      <td className="py-3">{entry.description}</td>
                      <td className="py-3 text-xs text-slate-500">{entry.reference || "—"}</td>
                      <td className="py-3 text-xs">{entry.createdBy}</td>
                      <td className="py-3 text-right font-semibold text-emerald-700">{entry.type === "ADVANCE" || entry.type === "REFUND" || entry.type === "ADJUSTMENT" ? money(entry.amount) : ""}</td>
                      <td className="py-3 pr-4 text-right font-semibold text-red-700">{entry.type === "EXPENSE" ? money(entry.amount) : ""}</td>
                    </tr>
                  ))}
                  {!visiblePassbook.length && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No passbook entries for this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
