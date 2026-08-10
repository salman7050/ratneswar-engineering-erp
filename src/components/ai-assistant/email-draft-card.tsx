"use client";

import { Mail, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Muted } from "@/components/ui/typography";
import { toast } from "@/lib/toast";

export function EmailDraftCard({ to, subject, body }: { to?: string; subject: string; body: string }) {
  function copy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success("Copied to clipboard");
  }

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="glass-card flex flex-col gap-2 p-3.5">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-brand-gold-light" />
        <p className="text-xs font-semibold">Email Draft</p>
      </div>
      {to && <Muted className="text-[11px]">To: {to}</Muted>}
      <p className="text-xs font-medium">{subject}</p>
      <p className="whitespace-pre-wrap text-xs text-foreground/80">{body}</p>
      <div className="mt-1 flex gap-2">
        <Button size="sm" variant="glass" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy</Button>
        <Button size="sm" variant="outline" asChild><a href={mailto}><Mail className="h-3.5 w-3.5" /> Open in Mail</a></Button>
      </div>
    </div>
  );
}
