"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, KeyRound, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const RECOVERY_FEATURES = [
  {
    icon: MailCheck,
    title: "1. Request a secure link",
    description: "Enter the email address attached to your ERP account.",
  },
  {
    icon: Clock3,
    title: "2. Open it promptly",
    description: "Use the newest email and open the link before it expires.",
  },
  {
    icon: KeyRound,
    title: "3. Choose a new password",
    description: "Set a new password, then return to the sign-in page.",
  },
];

type Notice = { type: "success" | "error"; text: string } | null;

function getRecoveryRedirectUrl() {
  // Use the page's real deployed origin so a stale local environment value can
  // never put localhost inside a production reset email.
  return `${window.location.origin}/api/auth/callback?redirectTo=/reset-password`;
}

function friendlyRecoveryError(error: { message: string; code?: string; status?: number }) {
  if (error.code === "email_address_not_authorized") {
    return "Reset emails are not enabled for this address yet. Ask the administrator to configure Supabase custom SMTP.";
  }
  if (error.status === 429 || /rate limit|too many requests/i.test(error.message)) {
    return "Too many reset requests. Wait at least 60 seconds, then try again.";
  }
  if (/redirect/i.test(error.message)) {
    return "The password-reset redirect is not configured. Ask the administrator to check the Supabase redirect URL.";
  }
  return "The reset email could not be sent. Check the address and try again.";
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(
    searchParams.get("error") === "recovery_link_invalid"
      ? { type: "error", text: "That reset link is invalid or expired. Request a fresh link below." }
      : null
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getRecoveryRedirectUrl(),
    });

    if (error) {
      setNotice({ type: "error", text: friendlyRecoveryError(error) });
      setLoading(false);
      return;
    }

    setNotice({
      type: "success",
      text: `Reset link sent to ${normalizedEmail}. Check Inbox and Spam, and use only the newest email.`,
    });
    setLoading(false);
  }

  return (
    <AuthShell
      eyebrow="Secure account recovery"
      title="Forgot password?"
      description="Enter your registered email and we will send a secure reset link."
      panelTitle="Reset your password safely."
      panelAccent="In three simple steps."
      panelDescription="A short, protected recovery flow gets you securely back into your business workspace."
      features={RECOVERY_FEATURES}
    >
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              className="h-12 border-slate-200 bg-slate-50 pl-10 text-slate-900 shadow-none focus:bg-white"
            />
          </div>
        </div>

        <div className="flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3 text-xs leading-5 text-blue-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          For security, use the exact email address registered by your administrator.
        </div>

        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={notice.type === "error"
              ? "flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700"
              : "flex gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-700"}
          >
            {notice.type === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
            <span>{notice.text}</span>
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="h-12 bg-brand-navy text-white shadow-[0_12px_28px_-12px_rgba(15,35,71,.8)] hover:bg-brand-navy-light">
          Send secure reset link
        </Button>

        <Button asChild variant="ghost" className="h-11 text-slate-600 hover:text-brand-navy">
          <Link href="/login"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to sign in</Link>
        </Button>

        <p className="text-center text-xs leading-5 text-slate-500">
          Email can take a minute. Check Spam before requesting another link.
        </p>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <React.Suspense fallback={<div className="h-[560px] animate-pulse rounded-[28px] bg-white" />}>
      <ForgotPasswordForm />
    </React.Suspense>
  );
}
