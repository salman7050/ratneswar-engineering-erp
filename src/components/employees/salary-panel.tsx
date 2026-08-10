"use client";

import * as React from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Muted } from "@/components/ui/typography";
import {
  TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import { useAction } from "@/hooks/use-action";
import { addSalarySlip, deleteSalarySlip } from "@/lib/actions/employee-salary-actions";
import type { EmployeeDetail } from "@/lib/queries/employees";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SalaryPanel({ employee }: { employee: EmployeeDetail }) {
  const [open, setOpen] = React.useState(false);
  const now = new Date();
  const [form, setForm] = React.useState({
    month: String(now.getMonth() + 1), year: String(now.getFullYear()),
    presentDays: "26", totalDays: "26", otHours: "0", otRate: "0", advanceDeduction: "0",
  });

  const { run: add, loading } = useAction(addSalarySlip, { successMessage: "Salary slip generated", onSuccess: () => setOpen(false) });
  const { run: remove } = useAction(deleteSalarySlip, { successMessage: "Slip deleted" });

  const monthlyGross = employee.basic + employee.hra + employee.otherAllowance;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-3d p-4"><Muted className="text-xs">Basic</Muted><p className="tabular mt-1 font-mono text-lg font-semibold">{formatINR(employee.basic)}</p></div>
        <div className="card-3d p-4"><Muted className="text-xs">HRA + Allowance</Muted><p className="tabular mt-1 font-mono text-lg font-semibold">{formatINR(employee.hra + employee.otherAllowance)}</p></div>
        <div className="card-3d p-4"><Muted className="text-xs">Monthly Gross</Muted><p className="tabular mt-1 font-mono text-lg font-semibold text-brand-gold-light">{formatINR(monthlyGross)}</p></div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Salary Slips</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Generate Slip</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate Salary Slip</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><Label>Month</Label>
                <select className="flex h-10 w-full rounded-lg border border-input bg-secondary/40 px-3 text-sm" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Present Days</Label><Input type="number" value={form.presentDays} onChange={(e) => setForm({ ...form, presentDays: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Total Days</Label><Input type="number" value={form.totalDays} onChange={(e) => setForm({ ...form, totalDays: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>OT Hours</Label><Input type="number" value={form.otHours} onChange={(e) => setForm({ ...form, otHours: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>OT Rate (₹/hr)</Label><Input type="number" value={form.otRate} onChange={(e) => setForm({ ...form, otRate: e.target.value })} /></div>
              <div className="flex flex-col gap-1.5 col-span-2"><Label>Advance Deduction (₹)</Label><Input type="number" value={form.advanceDeduction} onChange={(e) => setForm({ ...form, advanceDeduction: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                onClick={() => add({
                  employeeId: employee.id, month: Number(form.month), year: Number(form.year),
                  presentDays: Number(form.presentDays), totalDays: Number(form.totalDays),
                  otHours: Number(form.otHours), otRate: Number(form.otRate), advanceDeduction: Number(form.advanceDeduction),
                })}
              >
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {employee.salarySlips.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Wallet className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No salary slips generated yet.</Muted>
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead><TableHead>Attendance</TableHead>
                <TableHead className="text-right">Gross</TableHead><TableHead className="text-right">PF</TableHead>
                <TableHead className="text-right">PT</TableHead><TableHead className="text-right">Net Pay</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employee.salarySlips.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{MONTHS[s.month - 1]} {s.year}</TableCell>
                  <TableCell className="tabular font-mono text-sm">{s.presentDays}/{s.totalDays}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">{formatINR(s.grossPay)}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">{formatINR(s.pfEmployee)}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm">{formatINR(s.professionalTax)}</TableCell>
                  <TableCell className="tabular text-right font-mono text-sm font-semibold text-brand-gold-light">{formatINR(s.netPay)}</TableCell>
                  <TableCell><button onClick={() => remove(s.id, employee.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
