"use client";

import { Sparkles, WifiOff } from "lucide-react";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { usePwa } from "@/components/providers/pwa-provider";
import { useUser } from "@/components/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/layout/global-search";

export function Topbar({ title, brand }: { title?: string; brand: { name: string; tagline: string; logoUrl?: string | null } }) {
  const { isOnline } = usePwa();
  const user = useUser();
  const aiAllowed = user?.role === "ADMIN" || user?.role === "OWNER";
  return <header className="erp-glass-surface sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-3 rounded-[22px] px-4 md:px-6 max-md:rounded-none max-md:border-x-0 max-md:border-t-0">
    <MobileSidebar brand={brand} />
    {title && <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>}
    <div className="hidden max-w-xl flex-1 items-center md:flex"><GlobalSearch /></div>
    {!isOnline && <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"><WifiOff className="h-3.5 w-3.5" /> Offline</span>}
    <div className="ml-auto flex items-center gap-2">{aiAllowed && <Button onClick={() => window.dispatchEvent(new CustomEvent("open-ratneswar-ai"))} size="sm" className="hidden border-0 bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-[0_10px_24px_-14px_rgba(37,99,235,.8)] hover:from-emerald-500 hover:to-blue-500 sm:flex"><Sparkles className="h-4 w-4" /> Ratneswar AI</Button>}<div className="h-7 w-px bg-blue-100" /><UserMenu /></div>
  </header>;
}
