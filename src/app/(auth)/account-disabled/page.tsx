"use client";

import { ShieldX } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Muted } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/client";

export default function AccountDisabledPage() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Card variant="glass" className="shadow-soft-xl">
      <CardHeader className="items-center text-center"><ShieldX className="h-10 w-10 text-destructive" /><h1 className="text-lg font-semibold">Account access disabled</h1><Muted className="text-xs">Contact the Ratneswar ERP administrator to restore access.</Muted></CardHeader>
      <CardContent><Button className="w-full" variant="outline" onClick={signOut}>Sign out</Button></CardContent>
    </Card>
  );
}
