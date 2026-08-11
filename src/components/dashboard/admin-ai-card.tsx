"use client";

import { FileText, Receipt, ShoppingCart, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const tasks = [
  { label: "Create PO", prompt: "Create a new purchase order draft. Ask me for the vendor and items.", icon: ShoppingCart },
  { label: "Create Quote", prompt: "Create a professional quotation draft. Ask me for client, scope and line items.", icon: FileText },
  { label: "Create Invoice", prompt: "Create a GST invoice draft. Ask me for buyer, GST type and line items.", icon: Receipt },
];

export function AdminAiCard() {
  function open(prompt?: string) { window.dispatchEvent(new CustomEvent("open-ratneswar-ai", { detail: { prompt } })); }
  return <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 p-5 text-white shadow-[0_16px_40px_rgba(37,99,235,.20)]">
    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-xl" /><div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-cyan-300/10 blur-xl" />
    <div className="relative"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100"><Sparkles className="h-4 w-4" /> Admin Only</div><h2 className="mt-2 text-xl font-bold">AI Operations Assistant</h2><p className="mt-1 max-w-md text-sm text-blue-100">Draft documents, search records and analyse business data. Cloud AI runs without any office-PC server and uses the configured free cloud quota.</p></div><WandSparkles className="h-8 w-8 text-emerald-100" /></div>
      <div className="mt-5 grid grid-cols-3 gap-2">{tasks.map(({ label, prompt, icon: Icon }) => <button key={label} onClick={() => open(prompt)} className="rounded-xl border border-white/15 bg-white/10 p-3 text-left transition hover:bg-white/20"><Icon className="h-4 w-4" /><span className="mt-2 block text-xs font-semibold">{label}</span></button>)}</div>
      <Button onClick={() => open()} variant="secondary" className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50">Open AI Workspace</Button>
    </div>
  </div>;
}
