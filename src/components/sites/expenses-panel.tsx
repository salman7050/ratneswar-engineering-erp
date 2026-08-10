"use client";

import * as React from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import {
  TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter,
} from "@/components/ui/table";
import { addSiteExpense, deleteSiteExpense } from "@/lib/actions/site-docs-expenses-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate, formatINR } from "@/lib/utils";
import type { SiteDetail } from "@/lib/queries/sites";

const CATEGORIES = ["MATERIAL", "LABOUR", "FUEL", "TRANSPORT", "EQUIPMENT", "MISC"];

export function ExpensesPanel({ siteId, expenses }: { siteId: string; expenses: SiteDetail["expenses"] }) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState("MATERIAL");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));

  const { run: add, loading } = useAction(addSiteExpense, {
    successMessage: "Expense logged",
    onSuccess: () => { setOpen(false); setDescription(""); setAmount(""); },
  });
  const { run: remove } = useAction(deleteSiteExpense, { successMessage: "Expense removed" });

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Muted className="text-xs">{expenses.length} entries</Muted>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Log Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Expense</DialogTitle>
              <DialogDescription>Add a site expense entry.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c[0] + c.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cable tray fabrication" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Amount (₹)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                disabled={!description || !amount}
                onClick={() => add({ siteId, category: category as any, description, amount: Number(amount), date: new Date(date) })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Wallet className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No expenses logged yet.</Muted>
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                  <TableCell className="text-sm">{e.description}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">{formatINR(Number(e.amount))}</TableCell>
                  <TableCell>
                    <button onClick={() => remove(e.id, siteId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="tabular text-right font-mono">{formatINR(total)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
