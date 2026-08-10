"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/config/nav";
import { NavLink } from "@/components/layout/sidebar";
import { useUser } from "@/components/providers/supabase-provider";
import { can } from "@/lib/rbac";

export function MobileSidebar({ brand: _brand }: { brand: { name: string; tagline: string; logoUrl?: string | null } }) {
  const [open, setOpen] = React.useState(false);
  const user = useUser();
  const role = user?.role ?? "ADMIN";
  const primary = NAV_ITEMS.filter((item) => can(role, item.module, "view"));
  const secondary = SECONDARY_NAV_ITEMS.filter((item) => can(role, item.module, "view"));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
      <SheetContent side="left" className="flex w-[300px] flex-col p-0">
        <div className="flex h-[72px] items-center border-b border-slate-100 px-4"><img src="/brand/ratneswar-wordmark.png" alt="Ratneswar Engineering" className="h-[50px] w-[205px] object-contain object-left" /></div>
        <nav className="flex flex-col gap-1 overflow-y-auto px-3 py-4" onClick={() => setOpen(false)}>
          {primary.map((item) => <NavLink key={item.href} item={item} collapsed={false} />)}
          {secondary.length > 0 && <><Separator className="my-3" />{secondary.map((item) => <NavLink key={item.href} item={item} collapsed={false} />)}</>}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
