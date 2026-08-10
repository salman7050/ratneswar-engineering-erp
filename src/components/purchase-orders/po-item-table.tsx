"use client";

import * as React from "react";
import { Plus, Trash2, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface POItemDraft {
  key: string;
  itemCode: string;
  description: string;
  hsnCode: string;
  unit: string;
  quantity: string;
  rate: string;
  discountPercent: string; // kept internally for legacy rows; final V7 UI always sends 0
  gstPercent: string;
  remarks: string;
}

export function emptyItem(): POItemDraft {
  return {
    key: Math.random().toString(36).slice(2),
    itemCode: "", description: "", hsnCode: "", unit: "Nos",
    quantity: "1", rate: "0", discountPercent: "0", gstPercent: "18", remarks: "",
  };
}

function lineCalc(it: POItemDraft) {
  const qty = parseFloat(it.quantity) || 0;
  const rate = parseFloat(it.rate) || 0;
  const gst = parseFloat(it.gstPercent) || 0;
  const taxable = qty * rate;
  const gstAmt = (taxable * gst) / 100;
  return { taxable, gstAmt, total: taxable + gstAmt };
}

export function POItemTable({ items, onChange }: { items: POItemDraft[]; onChange: (items: POItemDraft[]) => void }) {
  function update(index: number, patch: Partial<POItemDraft>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch, discountPercent: "0" } : it)));
  }
  function addRow() { onChange([...items, emptyItem()]); }
  function deleteRow(index: number) { if (items.length > 1) onChange(items.filter((_, i) => i !== index)); }
  function duplicateRow(index: number) {
    const source = items[index];
    if (!source) return;
    const copy = { ...source, key: Math.random().toString(36).slice(2), discountPercent: "0" };
    onChange([...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
  }
  function moveRow(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index], b = items[target];
    if (!a || !b) return;
    const next = [...items]; next[index] = b; next[target] = a; onChange(next);
  }

  const taxable = items.reduce((s, it) => s + lineCalc(it).taxable, 0);
  const totalWithTax = items.reduce((s, it) => s + lineCalc(it).total, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[920px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <th className="w-8 px-2 py-2 text-left">#</th>
            <th className="min-w-[300px] px-2 py-2 text-left">Material / Service Description</th>
            <th className="w-24 px-2 py-2 text-left">HSN / SAC</th>
            <th className="w-20 px-2 py-2 text-right">Qty</th>
            <th className="w-20 px-2 py-2 text-left">UOM</th>
            <th className="w-28 px-2 py-2 text-right">Unit Rate</th>
            <th className="w-20 px-2 py-2 text-right">GST %</th>
            <th className="w-28 px-2 py-2 text-right">Taxable</th>
            <th className="w-24 px-2 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const calc = lineCalc(it);
            return (
              <tr key={it.key} className="border-b border-slate-100 hover:bg-slate-50/60">
                <td className="px-2 py-1.5 text-slate-400">{i + 1}</td>
                <td className="px-1 py-1"><Input required value={it.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Clear material/service description" className="h-8 text-xs" /></td>
                <td className="px-1 py-1"><Input required value={it.hsnCode} onChange={(e) => update(i, { hsnCode: e.target.value })} className="h-8 text-xs" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" required value={it.quantity} onChange={(e) => update(i, { quantity: e.target.value })} className="h-8 text-right text-xs tabular" /></td>
                <td className="px-1 py-1"><Input value={it.unit} onChange={(e) => update(i, { unit: e.target.value })} className="h-8 text-xs" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" required value={it.rate} onChange={(e) => update(i, { rate: e.target.value })} className="h-8 text-right text-xs tabular" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={it.gstPercent} onChange={(e) => update(i, { gstPercent: e.target.value })} className="h-8 text-right text-xs tabular" /></td>
                <td className="px-2 py-1.5 text-right font-mono font-semibold tabular">{calc.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-1 py-1"><div className="flex items-center justify-end gap-0.5"><button type="button" onClick={() => moveRow(i, -1)} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-100" aria-label="Move up"><ChevronUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveRow(i, 1)} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-100" aria-label="Move down"><ChevronDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => duplicateRow(i)} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-slate-100" aria-label="Duplicate row"><Copy className="h-3.5 w-3.5" /></button><button type="button" onClick={() => deleteRow(i)} disabled={items.length === 1} className="flex h-8 w-8 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-25" aria-label="Delete row"><Trash2 className="h-3.5 w-3.5" /></button></div></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot><tr><td colSpan={9} className="px-2 py-2"><Button type="button" size="sm" variant="outline" onClick={addRow}><Plus className="h-3.5 w-3.5" /> Add Item</Button></td></tr></tfoot>
      </table>
      <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs"><span className="text-slate-500">Taxable: <b className="font-mono text-slate-800">₹{taxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span><span className="text-slate-500">Total incl. GST: <b className="font-mono text-slate-900">₹{totalWithTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span></div>
    </div>
  );
}
