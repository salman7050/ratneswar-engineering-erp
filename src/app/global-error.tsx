"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 bg-[#f4f8fc] font-sans text-slate-950">
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />
          <section className="relative w-full max-w-lg rounded-3xl border border-white/80 bg-white/80 p-8 text-center shadow-[0_24px_80px_rgba(33,80,120,.14)] backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle className="h-6 w-6" /></div>
            <h1 className="mt-5 text-2xl font-bold">Connection interrupted</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">The workspace could not load this request. Your data is safe—please retry the connection.</p>
            {error.digest && <p className="mt-3 font-mono text-[10px] text-slate-400">Reference: {error.digest}</p>}
            <button onClick={reset} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5">
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
