"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createEmployee, updateEmployee } from "@/lib/actions/employee-actions";
import { useAction } from "@/hooks/use-action";

function toDateInput(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

/** Structural type covering just the fields this form reads — works for both the list-row shape and the full detail shape. */
interface EditableEmployee {
  id: string;
  employeeCode: string; name: string; designation: string; department: string | null;
  photoUrl: string | null; dateOfBirth: Date | string | null; email: string | null; phone: string | null;
  address: string | null; pan: string | null; aadhaar: string | null; pfNumber: string | null;
  esicNumber: string | null; pfEnrolled: boolean; esicEnrolled: boolean;
  emergencyContactName: string | null; emergencyContactPhone: string | null; emergencyContactRelation: string | null;
  bankAccount: string | null; ifsc: string | null; basic: number; hra: number; otherAllowance: number;
  isActive: boolean; joinedAt: Date | string; siteId: string | null;
}

export function EmployeeFormDialog({
  employee,
  sites,
}: {
  employee?: EditableEmployee;
  sites: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const isEdit = Boolean(employee);

  const [form, setForm] = React.useState({
    employeeCode: employee?.employeeCode ?? "",
    name: employee?.name ?? "",
    designation: employee?.designation ?? "",
    department: employee?.department ?? "",
    photoUrl: employee?.photoUrl ?? "",
    dateOfBirth: toDateInput(employee?.dateOfBirth),
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    address: employee?.address ?? "",
    pan: employee?.pan ?? "",
    aadhaar: employee?.aadhaar ?? "",
    pfNumber: employee?.pfNumber ?? "",
    esicNumber: employee?.esicNumber ?? "",
    pfEnrolled: employee?.pfEnrolled ?? true,
    esicEnrolled: employee?.esicEnrolled ?? false,
    emergencyContactName: employee?.emergencyContactName ?? "",
    emergencyContactPhone: employee?.emergencyContactPhone ?? "",
    emergencyContactRelation: employee?.emergencyContactRelation ?? "",
    bankAccount: employee?.bankAccount ?? "",
    ifsc: employee?.ifsc ?? "",
    basic: employee?.basic?.toString() ?? "",
    hra: employee?.hra?.toString() ?? "0",
    otherAllowance: employee?.otherAllowance?.toString() ?? "0",
    isActive: employee?.isActive ?? true,
    joinedAt: toDateInput(employee?.joinedAt) || new Date().toISOString().slice(0, 10),
    siteId: employee?.siteId ?? "",
  });

  const { run, loading } = useAction(
    isEdit ? (input: Parameters<typeof createEmployee>[0]) => updateEmployee(employee!.id, input) : createEmployee,
    { successMessage: isEdit ? "Employee updated" : "Employee added", onSuccess: () => { setOpen(false); router.refresh(); } }
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run({
      ...form,
      dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
      joinedAt: new Date(form.joinedAt),
      basic: Number(form.basic),
      hra: Number(form.hra || 0),
      otherAllowance: Number(form.otherAllowance || 0),
      siteId: form.siteId || null,
      pan: form.pan ? form.pan.toUpperCase() : "",
    } as any);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? <Button variant="glass" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit Profile</Button> : <Button variant="gold"><Plus /> New Employee</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription>Full HR profile — identity, statutory IDs, and pay structure.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Tabs defaultValue="identity">
            <TabsList>
              <TabsTrigger value="identity">Identity</TabsTrigger>
              <TabsTrigger value="statutory">Statutory & Bank</TabsTrigger>
              <TabsTrigger value="pay">Pay & Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5"><Label>Employee Code</Label><Input required value={form.employeeCode} onChange={(e) => set("employeeCode", e.target.value)} placeholder="RE-EMP-014" /></div>
              <div className="flex flex-col gap-1.5"><Label>Full Name</Label><Input required value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Designation</Label><Input required value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Site Engineer" /></div>
              <div className="flex flex-col gap-1.5"><Label>Department (optional)</Label><Input value={form.department ?? ""} onChange={(e) => set("department", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Photo URL</Label><Input value={form.photoUrl ?? ""} onChange={(e) => set("photoUrl", e.target.value)} placeholder="https://…" /></div>
              <div className="flex flex-col gap-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5">
                <Label>Assigned Site</Label>
                <Select value={form.siteId} onValueChange={(v) => set("siteId", v)}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>{sites.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label className="font-normal">Active Employee</Label>
                <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
              </div>
            </TabsContent>

            <TabsContent value="statutory" className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5"><Label>PAN</Label><Input value={form.pan ?? ""} onChange={(e) => set("pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} /></div>
              <div className="flex flex-col gap-1.5"><Label>Aadhaar</Label><Input value={form.aadhaar ?? ""} onChange={(e) => set("aadhaar", e.target.value)} placeholder="123412341234" maxLength={12} /></div>
              <div className="flex flex-col gap-1.5"><Label>PF Number (UAN)</Label><Input value={form.pfNumber ?? ""} onChange={(e) => set("pfNumber", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>ESIC Number</Label><Input value={form.esicNumber ?? ""} onChange={(e) => set("esicNumber", e.target.value)} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label className="font-normal">PF Enrolled</Label><Switch checked={form.pfEnrolled} onCheckedChange={(v) => set("pfEnrolled", v)} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label className="font-normal">ESIC Enrolled</Label><Switch checked={form.esicEnrolled} onCheckedChange={(v) => set("esicEnrolled", v)} />
              </div>
              <div className="flex flex-col gap-1.5"><Label>Bank Account No.</Label><Input value={form.bankAccount ?? ""} onChange={(e) => set("bankAccount", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>IFSC</Label><Input value={form.ifsc ?? ""} onChange={(e) => set("ifsc", e.target.value)} /></div>
            </TabsContent>

            <TabsContent value="pay" className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5"><Label>Basic (₹/month)</Label><Input required type="number" value={form.basic} onChange={(e) => set("basic", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>HRA (₹/month)</Label><Input type="number" value={form.hra} onChange={(e) => set("hra", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Other Allowance (₹/month)</Label><Input type="number" value={form.otherAllowance} onChange={(e) => set("otherAllowance", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Joined On</Label><Input type="date" value={form.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Emergency Contact Name</Label><Input value={form.emergencyContactName ?? ""} onChange={(e) => set("emergencyContactName", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Emergency Contact Phone</Label><Input value={form.emergencyContactPhone ?? ""} onChange={(e) => set("emergencyContactPhone", e.target.value)} /></div>
              <div className="flex flex-col gap-1.5"><Label>Relation</Label><Input value={form.emergencyContactRelation ?? ""} onChange={(e) => set("emergencyContactRelation", e.target.value)} placeholder="Spouse / Parent / Sibling" /></div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="submit" variant="gold" loading={loading}>{isEdit ? "Save Changes" : "Add Employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
