"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Muted } from "@/components/ui/typography";
import { changeOwnPassword, updateOwnProfile } from "@/lib/actions/profile-actions";
import { useAction } from "@/hooks/use-action";
import type { AppUser } from "@/types";

export function ProfileForm({ user, phone }: { user: AppUser; phone: string | null }) {
  const [profile, setProfile] = React.useState({ name: user.name, phone: phone ?? "" });
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const { run: save, loading: saving } = useAction(updateOwnProfile, { successMessage: "Profile updated" });
  const { run: change, loading: changing } = useAction(changeOwnPassword, { successMessage: "Password updated", onSuccess: () => { setPassword(""); setConfirm(""); } });

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card variant="3d" className="flex flex-col gap-4 p-5">
        <div><h2 className="font-semibold">Personal details</h2><Muted className="text-xs">Your name is shown across ERP activity records.</Muted></div>
        <div className="flex flex-col gap-1.5"><Label>Email</Label><Input value={user.email} disabled /></div>
        <div className="flex flex-col gap-1.5"><Label>Name</Label><Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></div>
        <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></div>
        <Button variant="gold" loading={saving} disabled={profile.name.trim().length < 2} onClick={() => save(profile)}>Save Profile</Button>
      </Card>

      <Card variant="3d" className="flex flex-col gap-4 p-5">
        <div><h2 className="font-semibold">Change password</h2><Muted className="text-xs">Use at least 8 characters.</Muted></div>
        <div className="flex flex-col gap-1.5"><Label>New password</Label><Input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div className="flex flex-col gap-1.5"><Label>Confirm password</Label><Input type="password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} /></div>
        {password && confirm && password !== confirm && <p className="text-xs text-destructive">Passwords do not match.</p>}
        <Button variant="gold" loading={changing} disabled={password.length < 8 || password !== confirm} onClick={() => change(password)}>Update Password</Button>
      </Card>
    </div>
  );
}
