"use client";

import * as React from "react";
import { Plus, Trash2, Star, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { useAction } from "@/hooks/use-action";
import { addBankAccount, deleteBankAccount, setDefaultBankAccount } from "@/lib/actions/finance-settings-actions";

interface BankAccount {
  id: string; bankName: string; accountNo: string; ifsc: string; branch: string; upiId: string | null; isDefault: boolean;
}

export function BankAccountsPanel({ accounts }: { accounts: BankAccount[] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ bankName: "", accountNo: "", ifsc: "", branch: "", upiId: "" });

  const { run: add, loading } = useAction(addBankAccount, { successMessage: "Bank account added", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteBankAccount, { successMessage: "Removed" });
  const { run: setDefault } = useAction(setDefaultBankAccount, { successMessage: "Default bank account updated" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Add Bank Account</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Axis Bank" /></div>
              <div className="flex flex-col gap-1.5"><Label>Account No.</Label><Input value={form.accountNo} onChange={(e) => setForm({ ...form, accountNo: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>IFSC</Label><Input value={form.ifsc} onChange={(e) => setForm({ ...form, ifsc: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Branch</Label><Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>UPI ID (for QR code)</Label><Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} placeholder="ratneswar@axisbank" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button variant="gold" loading={loading} onClick={() => add({ ...form, upiId: form.upiId || null, isDefault: accounts.length === 0 })}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Muted className="text-xs">No bank accounts added yet — invoices won&apos;t show payment details until you add one.</Muted>
      ) : (
        <ul className="flex flex-col gap-2">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{a.bankName} {a.isDefault && <Badge variant="gold" className="ml-1.5">Default</Badge>}</p>
                  <Muted className="text-[11px] font-mono">{a.accountNo} · {a.ifsc} · {a.branch}</Muted>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!a.isDefault && <button onClick={() => setDefault(a.id)} className="text-muted-foreground hover:text-brand-gold-light"><Star className="h-3.5 w-3.5" /></button>}
                <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
