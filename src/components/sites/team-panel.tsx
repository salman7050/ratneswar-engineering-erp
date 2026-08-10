"use client";

import * as React from "react";
import { Plus, UserMinus, Users as UsersIcon, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Muted } from "@/components/ui/typography";
import { assignEngineer, removeEngineer } from "@/lib/actions/site-actions";
import { useAction } from "@/hooks/use-action";
import { initials } from "@/lib/utils";
import type { SiteDetail } from "@/lib/queries/sites";

const ROLE_LABEL: Record<string, string> = {
  SITE_ENGINEER: "Site Engineer", SITE_MANAGER: "Site Lead", SUPERVISOR: "Supervisor",
};

export function TeamPanel({
  siteId,
  engineers,
  employees,
  assignableUsers,
}: {
  siteId: string;
  engineers: SiteDetail["engineers"];
  employees: SiteDetail["employees"];
  assignableUsers: { id: string; name: string; role: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [userId, setUserId] = React.useState("");
  const [role, setRole] = React.useState("SITE_ENGINEER");

  const alreadyAssignedIds = new Set(engineers.map((e) => e.userId));
  const options = assignableUsers.filter((u) => !alreadyAssignedIds.has(u.id));

  const { run: assign, loading } = useAction(assignEngineer, {
    successMessage: "Engineer assigned",
    onSuccess: () => { setOpen(false); setUserId(""); },
  });
  const { run: remove } = useAction(removeEngineer, { successMessage: "Removed from site" });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Engineers */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><HardHat className="h-4 w-4" /> Site Team</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button variant="glass" size="sm"><Plus className="h-3.5 w-3.5" /> Assign</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign to Site</DialogTitle>
                <DialogDescription>Pick a team member and their role on this site.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Team Member</Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger>
                    <SelectContent>
                      {options.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Everyone eligible is already assigned</div>}
                      {options.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} · {u.role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Role on Site</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SITE_ENGINEER">Site Engineer</SelectItem>
                      <SelectItem value="SITE_MANAGER">Site Lead</SelectItem>
                      <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button
                  variant="gold"
                  loading={loading}
                  disabled={!userId}
                  onClick={() => assign({ siteId, userId, role: role as any })}
                >
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {engineers.length === 0 ? (
          <Muted className="text-xs">No one assigned yet.</Muted>
        ) : (
          <ul className="flex flex-col gap-2">
            {engineers.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{initials(e.user.name)}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-xs font-medium">{e.user.name}</p>
                    <Badge variant="outline" className="mt-0.5">{ROLE_LABEL[e.role]}</Badge>
                  </div>
                </div>
                <button onClick={() => remove(e.id, siteId)} className="text-muted-foreground hover:text-destructive">
                  <UserMinus className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Employees (reference — managed in the Salary module) */}
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><UsersIcon className="h-4 w-4" /> Employees on Site</p>
        {employees.length === 0 ? (
          <Muted className="text-xs">No employees linked to this site yet — add them from the Salary module.</Muted>
        ) : (
          <ul className="flex flex-col gap-2">
            {employees.map((emp) => (
              <li key={emp.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <div>
                  <p className="text-xs font-medium">{emp.name}</p>
                  <Muted className="text-[11px]">{emp.designation}</Muted>
                </div>
                <Badge variant={emp.isActive ? "success" : "outline"}>{emp.isActive ? "Active" : "Inactive"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
