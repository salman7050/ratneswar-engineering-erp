"use client";

import * as React from "react";
import { KeyRound, Plus, ShieldCheck, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Muted } from "@/components/ui/typography";
import { createAppUser, resetUserPassword, updateAppUser } from "@/lib/actions/user-actions";
import { useAction } from "@/hooks/use-action";
import { formatDate } from "@/lib/utils";
import type { AppRole } from "@/types";
import type { UserListItem } from "@/lib/queries/users";

type EditableRole = Extract<AppRole, "ADMIN" | "OWNER">;
const ROLES: EditableRole[] = ["ADMIN", "OWNER"];

function UserEditor({ user }: { user: UserListItem }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: user.name, phone: user.phone ?? "", role: user.role as EditableRole, isActive: user.isActive });
  const { run: save, loading } = useAction(updateAppUser, { successMessage: "User updated", onSuccess: () => setOpen(false) });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon"><UserCog className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit {user.name}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Role</Label>
            <Select value={form.role} onValueChange={(role) => setForm({ ...form, role: role as EditableRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="text-sm font-medium">Active account</p><Muted className="text-xs">Inactive users cannot access ERP.</Muted></div><Switch checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} /></div>
        </div>
        <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="gold" loading={loading} onClick={() => save(user.id, form)}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordReset({ user }: { user: UserListItem }) {
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const { run: reset, loading } = useAction(resetUserPassword, { successMessage: "Temporary password set", onSuccess: () => { setOpen(false); setPassword(""); } });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon"><KeyRound className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reset password for {user.name}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-1.5"><Label>New temporary password</Label><Input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="gold" loading={loading} disabled={password.length < 8} onClick={() => reset(user.id, password)}>Set Password</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UsersClient({ users }: { users: UserListItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", role: "OWNER" as EditableRole, password: "" });
  const { run: create, loading } = useAction(createAppUser, {
    successMessage: "User created",
    onSuccess: () => {
      setOpen(false);
      setForm({ name: "", email: "", phone: "", role: "OWNER", password: "" });
    },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="3d" className="p-4"><Muted className="text-xs">Total users</Muted><p className="mt-1 font-mono text-xl font-semibold">{users.length}</p></Card>
        <Card variant="3d" className="p-4"><Muted className="text-xs">Active</Muted><p className="mt-1 font-mono text-xl font-semibold text-success">{users.filter((user) => user.isActive).length}</p></Card>
        <Card variant="3d" className="p-4"><Muted className="text-xs">Administrators</Muted><p className="mt-1 font-mono text-xl font-semibold text-brand-gold-light">{users.filter((user) => user.role === "ADMIN").length}</p></Card>
      </div>

      <div className="flex items-center justify-between"><Muted className="text-xs">Only Admin and Owner accounts can access this ERP. Employee master/login access is intentionally not used.</Muted>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="gold"><Plus className="h-4 w-4" /> Add User</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create ERP User</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5"><Label>Name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
              <div className="flex flex-col gap-1.5"><Label>Role</Label>
                <Select value={form.role} onValueChange={(role) => setForm({ ...form, role: role as EditableRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Temporary password</Label><Input type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
            </div>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button variant="gold" loading={loading} disabled={!form.name || !form.email || form.password.length < 8} onClick={() => create(form)}>Create User</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <Card variant="3d" className="flex flex-col items-center gap-3 p-12 text-center"><ShieldCheck className="h-8 w-8 text-muted-foreground/50" /><p className="font-medium">No users found</p></Card>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Activity</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{users.map((user) => (
              <TableRow key={user.id}>
                <TableCell><p className="text-sm font-medium">{user.name}</p><p className="text-[11px] text-muted-foreground">{user.email}</p></TableCell>
                <TableCell><Badge variant={user.role === "ADMIN" ? "warning" : "outline"}>{user.role}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.phone || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{user._count.assignedTasks} tasks · {user._count.createdInvoices} invoices</TableCell>
                <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                <TableCell><Badge variant={user.isActive ? "success" : "destructive"}>{user.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                <TableCell><div className="flex justify-end"><UserEditor user={user} /><PasswordReset user={user} /></div></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
