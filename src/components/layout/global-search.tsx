"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/config/nav";
import { resolveIcon } from "@/components/layout/icon-map";
import { useUser } from "@/components/providers/supabase-provider";
import { can } from "@/lib/rbac";

export function GlobalSearch() {
  const router = useRouter();
  const user = useUser();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const role = user?.role ?? "ENGINEER";
  const modules = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS].filter((item) => can(role, item.module, "view"));
  const results = query.trim()
    ? modules.filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 7)
    : modules.slice(0, 6);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(href: string) {
    setQuery("");
    setOpen(false);
    router.push(href);
  }

  return <div className="relative w-full max-w-md">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      ref={inputRef}
      aria-label="Open an ERP section"
      value={query}
      onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 140)}
      onKeyDown={(event) => { if (event.key === "Enter" && results[0]) go(results[0].href); }}
      placeholder="Jump to sites, invoices, PO or settings…"
      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-white px-1.5 py-0.5 text-[10px] text-slate-400">Ctrl K</span>
    {open && <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
      <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Available sections</p>
      {results.length ? results.map((item) => { const Icon = resolveIcon(item.icon); return <button type="button" key={item.href} onMouseDown={(event) => event.preventDefault()} onClick={() => go(item.href)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-800"><span className="rounded-lg bg-slate-100 p-1.5"><Icon className="h-4 w-4" /></span>{item.label}</button>; }) : <p className="px-3 py-6 text-center text-sm text-slate-500">No accessible section found.</p>}
    </div>}
  </div>;
}
