"use client";

import * as React from "react";
import { Plus, Trash2, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Muted } from "@/components/ui/typography";
import { saveTenderBoq } from "@/lib/actions/tender-boq-actions";
import { useAction } from "@/hooks/use-action";
import { formatINR } from "@/lib/utils";
import type { TenderDetail } from "@/lib/queries/tenders";

interface Row { description: string; unit: string; quantity: string; rate: string; }

export function TenderBoqPanel({ tenderId, items }: { tenderId: string; items: TenderDetail["boqItems"] }) {
  const [rows, setRows] = React.useState<Row[]>(
    items.length > 0
      ? items.map((it) => ({ description: it.description, unit: it.unit, quantity: String(it.quantity), rate: String(it.rate) }))
      : [{ description: "", unit: "", quantity: "1", rate: "" }]
  );

  const { run: save, loading } = useAction(saveTenderBoq, { successMessage: "BOQ saved" });

  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function add() {
    setRows((r) => [...r, { description: "", unit: "", quantity: "1", rate: "" }]);
  }

  const total = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.rate) || 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><ListOrdered className="h-4 w-4" /> Bill of Quantities</p>
        <Button
          variant="gold"
          size="sm"
          loading={loading}
          onClick={() => save({
            tenderId,
            items: rows.filter((r) => r.description).map((r, i) => ({
              slNo: i + 1, description: r.description, unit: r.unit, quantity: Number(r.quantity), rate: Number(r.rate),
            })),
          })}
        >
          Save BOQ
        </Button>
      </div>

      <div className="grid grid-cols-[32px_1fr_80px_70px_100px_100px_28px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Sl.</span><span>Description</span><span>Unit</span><span>Qty</span><span>Rate</span><span className="text-right">Amount</span><span />
      </div>
      {rows.map((r, i) => {
        const amount = (Number(r.quantity) || 0) * (Number(r.rate) || 0);
        return (
          <div key={i} className="grid grid-cols-[32px_1fr_80px_70px_100px_100px_28px] items-center gap-2">
            <span className="text-center text-xs text-muted-foreground">{i + 1}</span>
            <Input value={r.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Item description" />
            <Input value={r.unit} onChange={(e) => update(i, { unit: e.target.value })} placeholder="RMT" />
            <Input type="number" value={r.quantity} onChange={(e) => update(i, { quantity: e.target.value })} />
            <Input type="number" value={r.rate} onChange={(e) => update(i, { rate: e.target.value })} />
            <span className="tabular text-right font-mono text-sm">{formatINR(amount)}</span>
            <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="glass" size="sm" onClick={add}><Plus className="h-3.5 w-3.5" /> Add Row</Button>
        <Muted className="text-xs">BOQ Total: <span className="tabular font-mono font-semibold text-foreground">{formatINR(total)}</span></Muted>
      </div>
    </div>
  );
}
