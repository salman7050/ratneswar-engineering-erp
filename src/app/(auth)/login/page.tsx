"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  Mail,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const LOGIN_FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Project Control",
    description: "Keep every task, document and decision on track.",
  },
  {
    icon: Workflow,
    title: "Smart Operations",
    description: "Make daily workflows faster, clearer and accountable.",
  },
  {
    icon: TrendingUp,
    title: "Business Growth",
    description: "A secure ERP built to scale with your company.",
  },
];

function friendlyLoginError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email or password is incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirm your email before signing in.";
  if (/rate limit|too many requests/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  return "Sign-in could not be completed. Please try again.";
}

function LoginCardFallback() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_32px_90px_-30px_rgba(15,35,71,0.48)]">
      <div className="grid min-h-[560px] animate-pulse lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden bg-brand-navy lg:block" />
        <div className="bg-white p-14"><div className="h-full rounded-2xl bg-slate-100" /></div>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirectTo");
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("://")
      ? rawRedirect
      : "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const statusMessage =
    searchParams.get("status") === "password_updated"
      ? "Password updated successfully. Sign in with your new password."
      : null;
  const callbackError =
    searchParams.get("error") === "auth_failed"
      ? "The sign-in link is invalid or has expired. Please try again."
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError(friendlyLoginError(signInError.message));
      setLoading(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <AuthShell
        eyebrow="Secure business access"
        title="Welcome back"
        description="Access your projects, teams and business operations in one place."
        panelTitle="Everything your business needs."
        panelAccent="One secure workspace."
        panelDescription="Manage projects, customers, teams and daily operations with complete clarity and confidence."
        features={LOGIN_FEATURES}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
              <Link href="/forgot-password" className="text-xs font-semibold text-brand-navy underline-offset-4 hover:text-brand-gold hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="h-12 border-slate-200 bg-slate-50 px-10 text-slate-900 shadow-none focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-navy"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          {(error || callbackError) && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {error || callbackError}
            </p>
          )}
          {statusMessage && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">
              {statusMessage}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-1 h-12 bg-brand-navy text-white shadow-[0_12px_28px_-12px_rgba(15,35,71,.8)] hover:bg-brand-navy-light">
            Sign in securely
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden />}
          </Button>

          <p className="text-center text-xs leading-5 text-slate-500">
            Need access? Contact your Ratneswar Engineering administrator.
          </p>
        </form>
      </AuthShell>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<LoginCardFallback />}>
      <LoginForm />
    </React.Suspense>
  );
}
