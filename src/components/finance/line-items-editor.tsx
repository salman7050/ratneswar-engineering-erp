"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/utils";

export interface EditableItem {
  description: string;
  hsnCode: string;
  quantity: string;
  rate: string;
}

export const EMPTY_ITEM: EditableItem = { description: "", hsnCode: "998714", quantity: "1", rate: "" };

export function LineItemsEditor({
  items,
  onChange,
}: {
  items: EditableItem[];
  onChange: (items: EditableItem[]) => void;
}) {
  function update(i: number, patch: Partial<EditableItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, { ...EMPTY_ITEM }]);
  }

  const total = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_90px_70px_100px_100px_28px] gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Description</span><span>HSN/SAC</span><span>Qty</span><span>Rate</span><span className="text-right">Amount</span><span />
      </div>
      {items.map((it, i) => {
        const amount = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
        return (
          <div key={i} className="grid grid-cols-[1fr_90px_70px_100px_100px_28px] items-center gap-2">
            <Input value={it.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Item description" />
            <Input value={it.hsnCode} onChange={(e) => update(i, { hsnCode: e.target.value })} />
            <Input type="number" value={it.quantity} onChange={(e) => update(i, { quantity: e.target.value })} />
            <Input type="number" value={it.rate} onChange={(e) => update(i, { rate: e.target.value })} />
            <span className="tabular text-right font-mono text-sm">{formatINR(amount)}</span>
            <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="glass" size="sm" onClick={add}><Plus className="h-3.5 w-3.5" /> Add Line</Button>
        <span className="text-xs text-muted-foreground">Subtotal: <span className="tabular font-mono font-semibold text-foreground">{formatINR(total)}</span></span>
      </div>
    </div>
  );
}
