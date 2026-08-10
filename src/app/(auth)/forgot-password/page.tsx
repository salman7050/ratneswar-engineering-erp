"use client";

import * as React from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Muted } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/api/auth/callback?redirectTo=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setMessage(error ? error.message : "Password reset link sent. Check your email.");
    setLoading(false);
  }

  return (
    <Card variant="glass" className="shadow-soft-xl">
      <CardHeader className="text-center"><h1 className="text-lg font-semibold">Reset your password</h1><Muted className="text-xs">We will email a secure reset link.</Muted></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" /></div></div>
          {message && <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs">{message}</p>}
          <Button type="submit" variant="gold" loading={loading}>Send Reset Link</Button>
          <Button asChild variant="ghost"><Link href="/login">Back to sign in</Link></Button>
        </form>
      </CardContent>
    </Card>
  );
}
