"use client";

import * as React from "react";
import { Plus, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { Muted } from "@/components/ui/typography";
import {
  TableContainer, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { recordAttendance } from "@/lib/actions/site-hr-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate } from "@/lib/utils";
import type { SiteDetail } from "@/lib/queries/sites";

const STATUS_TONE: Record<string, "success" | "destructive" | "warning" | "neutral"> = {
  PRESENT: "success", ABSENT: "destructive", HALF_DAY: "warning", LEAVE: "neutral",
};

export function AttendancePanel({
  siteId,
  employees,
  attendance,
}: {
  siteId: string;
  employees: SiteDetail["employees"];
  attendance: SiteDetail["attendance"];
}) {
  const [open, setOpen] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = React.useState("PRESENT");

  const { run, loading } = useAction(recordAttendance, {
    successMessage: "Attendance recorded",
    onSuccess: () => setOpen(false),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Muted className="text-xs">Last {attendance.length} records</Muted>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="glass" size="sm" disabled={employees.length === 0}>
              <Plus className="h-3.5 w-3.5" /> Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>Records upsert per employee, per day.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENT">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="HALF_DAY">Half Day</SelectItem>
                      <SelectItem value="LEAVE">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                variant="gold"
                loading={loading}
                disabled={!employeeId}
                onClick={() => run({ siteId, employeeId, date: new Date(date), status: status as any })}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {attendance.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <ClipboardCheck className="h-6 w-6 text-muted-foreground/40" />
          <Muted className="text-xs">No attendance recorded yet.</Muted>
        </div>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{formatDate(a.date)}</TableCell>
                  <TableCell className="text-sm">{a.employee.name}</TableCell>
                  <TableCell><StatusChip tone={STATUS_TONE[a.status]}>{a.status.replace("_", " ")}</StatusChip></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
