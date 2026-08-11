"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const NEW_PASSWORD_FEATURES = [
  {
    icon: KeyRound,
    title: "Use 8 or more characters",
    description: "Choose a password that is difficult for other people to guess.",
  },
  {
    icon: ShieldCheck,
    title: "Keep it private",
    description: "Do not reuse an office-shared or personal account password.",
  },
  {
    icon: CheckCircle2,
    title: "Sign in again",
    description: "After the update, use the new password on the secure sign-in page.",
  },
];

type RecoveryState = "checking" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recoveryState, setRecoveryState] = React.useState<RecoveryState>("checking");

  React.useEffect(() => {
    let active = true;
    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) setRecoveryState("ready");
    });

    async function verifyRecoverySession() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setRecoveryState("invalid");
          return;
        }
        window.history.replaceState({}, document.title, "/reset-password");
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;
      setRecoveryState(!sessionError && data.session ? "ready" : "invalid");
    }

    void verifyRecoverySession();
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "Password could not be updated. Request a fresh reset link.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login?status=password_updated");
    router.refresh();
  }

  return (
    <AuthShell
      eyebrow="Final recovery step"
      title="Choose a new password"
      description="Create a strong password for your Ratneswar Engineering ERP account."
      panelTitle="Secure your account again."
      panelAccent="Get back to work."
      panelDescription="Your recovery link is used only to verify this protected password update."
      features={NEW_PASSWORD_FEATURES}
    >
      {recoveryState === "checking" && (
        <div role="status" className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-navy" />
          <p className="mt-4 text-sm font-semibold text-brand-navy">Verifying your secure link…</p>
        </div>
      )}

      {recoveryState === "invalid" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-800">This reset link is invalid or expired.</p>
          <p className="mt-2 text-sm leading-6 text-red-700">Request a fresh link and use only the newest email you receive.</p>
          <Button asChild className="mt-5 w-full bg-brand-navy text-white hover:bg-brand-navy-light">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      )}

      {recoveryState === "ready" && (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password" className="text-sm font-semibold text-slate-700">New password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="h-12 border-slate-200 bg-slate-50 px-10 text-slate-900 shadow-none focus:bg-white"
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-navy" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">Confirm new password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repeat your new password"
                className="h-12 border-slate-200 bg-slate-50 px-10 text-slate-900 shadow-none focus:bg-white"
              />
              <button type="button" onClick={() => setShowConfirm((current) => !current)} className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-navy" aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}>
                {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}

          <Button type="submit" size="lg" loading={loading} className="h-12 bg-brand-navy text-white shadow-[0_12px_28px_-12px_rgba(15,35,71,.8)] hover:bg-brand-navy-light">
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
