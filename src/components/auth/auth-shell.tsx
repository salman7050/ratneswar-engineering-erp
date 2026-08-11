"use client";

import type { ReactNode } from "react";
import { Diamond, ShieldCheck, Target, TrendingUp, type LucideIcon } from "lucide-react";

export interface AuthFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURE_STYLES = [
  "bg-blue-50 text-blue-600",
  "bg-emerald-50 text-emerald-600",
  "bg-cyan-50 text-cyan-600",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  panelTitle,
  panelAccent,
  panelDescription,
  features,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  panelTitle: string;
  panelAccent?: string;
  panelDescription: string;
  features: AuthFeature[];
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f8fbff] text-[#0a1f38]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(#8ba9c3 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "linear-gradient(90deg, black, transparent 58%)",
          WebkitMaskImage: "linear-gradient(90deg, black, transparent 58%)",
        }}
      />
      <div className="auth-glow auth-glow-green" />
      <div className="auth-glow auth-glow-blue" />
      <div className="auth-ribbon auth-ribbon-one" />
      <div className="auth-ribbon auth-ribbon-two" />

      <div className="pointer-events-none absolute left-[46%] top-[18%] hidden h-11 w-11 items-center justify-center rounded-full border border-emerald-100 bg-white/80 text-emerald-500 shadow-[0_12px_35px_rgba(42,98,132,.12)] lg:flex auth-orb">
        <Target className="h-4 w-4" aria-hidden />
      </div>
      <div className="pointer-events-none absolute bottom-[10%] right-[46%] hidden h-11 w-11 items-center justify-center rounded-full border border-cyan-100 bg-white/80 text-cyan-600 shadow-[0_12px_35px_rgba(42,98,132,.12)] lg:flex auth-orb auth-orb-delay">
        <TrendingUp className="h-4 w-4" aria-hidden />
      </div>
      <div className="pointer-events-none absolute bottom-[18%] left-[5%] hidden h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white/80 text-blue-600 shadow-[0_12px_35px_rgba(42,98,132,.12)] lg:flex auth-orb auth-orb-late">
        <Diamond className="h-4 w-4" aria-hidden />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1540px] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/ratneswar-wordmark.png"
            alt="Ratneswar Engineering"
            className="h-[54px] w-auto max-w-[255px] object-contain sm:h-[62px] sm:max-w-[310px]"
          />
          <p className="hidden text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400 sm:block">
            Control · Clarity · Growth
          </p>
        </header>

        <div className="grid flex-1 items-center gap-10 pb-7 pt-12 lg:grid-cols-[minmax(0,1.16fr)_minmax(410px,.84fr)] lg:gap-[7vw] lg:px-6 lg:pb-10 lg:pt-16">
          <section className="max-w-[760px]">
            <p className="inline-flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.1),0_0_14px_rgba(16,185,129,.55)]" />
              One connected workspace
            </p>

            <h2 className="mt-7 max-w-[720px] text-[clamp(2.8rem,5.25vw,5.3rem)] font-bold leading-[.98] tracking-[-0.055em] text-[#0a1f38]">
              {panelTitle}
              {panelAccent && (
                <>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    {panelAccent}
                  </span>
                </>
              )}
            </h2>

            <p className="mt-6 max-w-[610px] text-sm leading-7 text-slate-600 sm:text-[15px]">
              {panelDescription}
            </p>

            <div className="mt-8 grid max-w-[650px] grid-cols-1 gap-3 sm:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-slate-200/90 bg-white/75 p-4 shadow-[0_12px_28px_rgba(30,79,116,.06)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(30,79,116,.11)]"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${FEATURE_STYLES[index % FEATURE_STYLES.length]}`}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </div>
                    <p className="mt-4 text-xs font-bold text-[#163552]">{feature.title}</p>
                    <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="justify-self-stretch rounded-[26px] border border-white bg-white/90 px-6 py-8 shadow-[0_30px_85px_rgba(22,77,117,.14)] backdrop-blur-xl sm:px-9 sm:py-10 lg:justify-self-end lg:px-10 lg:py-11">
            <div className="mx-auto w-full max-w-md">
              <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.1),0_0_12px_rgba(16,185,129,.5)]" />
                {eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-[#0a1f38] sm:text-[2.65rem]">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
              <div className="mt-8">{children}</div>

              <div className="mt-7 flex items-center justify-between gap-4 border-t border-slate-100 pt-5 text-[9px] text-slate-400">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" aria-hidden /> Protected company access</span>
                <span>Ratneswar Engineering ERP</span>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-slate-200/70 pt-4 text-[9px] text-slate-400">
          <span>© {new Date().getFullYear()} Ratneswar Engineering</span>
          <span className="hidden sm:inline">Secure internal business system</span>
        </footer>
      </div>
    </div>
  );
}
