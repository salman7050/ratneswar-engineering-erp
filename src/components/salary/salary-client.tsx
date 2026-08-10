"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CircleDollarSign, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Muted } from "@/components/ui/typography";
import { addSalarySlip, deleteSalarySlip, updateSalaryStatus } from "@/lib/actions/employee-salary-actions";
import { useAction } from "@/hooks/use-action";
import { formatINR } from "@/lib/utils";
import type { PayrollEmployee, SalaryListItem } from "@/lib/queries/salary";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SalaryClient({
  slips,
  employees,
  canCreate,
  canEdit,
  canApprove,
  canDelete,
}: {
  slips: SalaryListItem[];
  employees: PayrollEmployee[];
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
}) {
  const now = new Date();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    employeeId: employees[0]?.id ?? "",
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
    presentDays: "26",
    totalDays: "26",
    otHours: "0",
    otRate: "0",
    advanceDeduction: "0",
  });

  const { run: generate, loading } = useAction(addSalarySlip, {
    successMessage: "Salary slip generated",
    onSuccess: () => setOpen(false),
  });
  const { run: setStatus } = useAction(updateSalaryStatus, { successMessage: "Salary status updated" });
  const { run: remove } = useAction(deleteSalarySlip, { successMessage: "Salary slip deleted" });

  const gross = slips.reduce((sum, slip) => sum + slip.grossPay, 0);
  const net = slips.reduce((sum, slip) => sum + slip.netPay, 0);
  const unpaid = slips.filter((slip) => slip.status !== "PAID").reduce((sum, slip) => sum + slip.netPay, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="3d" className="p-4"><Muted className="text-xs">Gross payroll</Muted><p className="mt-1 font-mono text-xl font-semibold">{formatINR(gross)}</p></Card>
        <Card variant="3d" className="p-4"><Muted className="text-xs">Net payroll</Muted><p className="mt-1 font-mono text-xl font-semibold text-brand-gold-light">{formatINR(net)}</p></Card>
        <Card variant="3d" className="p-4"><Muted className="text-xs">Pending payment</Muted><p className="mt-1 font-mono text-xl font-semibold text-warning">{formatINR(unpaid)}</p></Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Muted className="text-xs">{slips.length} salary slips</Muted>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="gold"><Plus className="h-4 w-4" /> Generate Salary</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Generate Salary Slip</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5"><Label>Employee</Label>
                  <Select value={form.employeeId} onValueChange={(employeeId) => setForm({ ...form, employeeId })}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>{employees.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employee.name} · {employee.employeeCode}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Month</Label>
                  <Select value={form.month} onValueChange={(month) => setForm({ ...form, month })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map((month, index) => <SelectItem key={month} value={String(index + 1)}>{month}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Year</Label><Input type="number" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Present days</Label><Input type="number" min="0" value={form.presentDays} onChange={(event) => setForm({ ...form, presentDays: event.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>Total days</Label><Input type="number" min="1" value={form.totalDays} onChange={(event) => setForm({ ...form, totalDays: event.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>OT hours</Label><Input type="number" min="0" step="0.5" value={form.otHours} onChange={(event) => setForm({ ...form, otHours: event.target.value })} /></div>
                <div className="flex flex-col gap-1.5"><Label>OT rate (₹)</Label><Input type="number" min="0" value={form.otRate} onChange={(event) => setForm({ ...form, otRate: event.target.value })} /></div>
                <div className="col-span-2 flex flex-col gap-1.5"><Label>Advance deduction (₹)</Label><Input type="number" min="0" value={form.advanceDeduction} onChange={(event) => setForm({ ...form, advanceDeduction: event.target.value })} /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="gold" loading={loading} disabled={!form.employeeId} onClick={() => generate({
                  employeeId: form.employeeId,
                  month: Number(form.month),
                  year: Number(form.year),
                  presentDays: Number(form.presentDays),
                  totalDays: Number(form.totalDays),
                  otHours: Number(form.otHours),
                  otRate: Number(form.otRate),
                  advanceDeduction: Number(form.advanceDeduction),
                })}>Generate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {slips.length === 0 ? (
        <Card variant="3d" className="flex flex-col items-center gap-3 p-12 text-center"><CircleDollarSign className="h-8 w-8 text-muted-foreground/50" /><p className="font-medium">No salary slips</p><Muted>Generate payroll for an employee to begin.</Muted></Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead>Attendance</TableHead><TableHead className="text-right">Gross</TableHead><TableHead className="text-right">PF + PT</TableHead><TableHead className="text-right">Net pay</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {slips.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell><Link href={`/employees/${slip.employee.id}`} className="text-sm font-medium hover:text-brand-gold-light">{slip.employee.name}<span className="block text-[11px] text-muted-foreground">{slip.employee.employeeCode}</span></Link></TableCell>
                  <TableCell className="text-sm">{MONTHS[slip.month - 1]} {slip.year}</TableCell>
                  <TableCell className="font-mono text-sm">{slip.presentDays}/{slip.totalDays}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatINR(slip.grossPay)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatINR(slip.pfEmployee + slip.professionalTax)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-brand-gold-light">{formatINR(slip.netPay)}</TableCell>
                  <TableCell><Badge variant={slip.status === "PAID" ? "success" : slip.status === "APPROVED" ? "info" : "warning"}>{slip.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {canApprove && slip.status === "DRAFT" && <button onClick={() => setStatus(slip.id, "APPROVED")} className="text-muted-foreground hover:text-success" aria-label="Approve salary"><Check className="h-3.5 w-3.5" /></button>}
                      {canEdit && slip.status === "APPROVED" && <button onClick={() => setStatus(slip.id, "PAID")} className="text-muted-foreground hover:text-brand-gold-light" aria-label="Mark paid"><CircleDollarSign className="h-3.5 w-3.5" /></button>}
                      {canDelete && <button onClick={() => remove(slip.id, slip.employee.id)} className="text-muted-foreground hover:text-destructive" aria-label="Delete salary slip"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
