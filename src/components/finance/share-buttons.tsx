"use client";

import { Mail, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ filename }: { filename?: string }) {
  function print() {
    const original = document.title;
    if (filename) document.title = filename.replace(/\.pdf$/i, "");
    const restore = () => { document.title = original; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
    window.setTimeout(restore, 1500);
  }
  return (
    <Button variant="default" onClick={print}>
      <Printer className="h-4 w-4" /> Print / Save as PDF
    </Button>
  );
}

export function EmailShareButton({
  to,
  subject,
  body,
}: {
  to?: string | null;
  subject: string;
  body: string;
}) {
  const href = `mailto:${to ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return (
    <Button variant="outline" asChild>
      <a href={href}><Mail className="h-4 w-4" /> Email</a>
    </Button>
  );
}

export function WhatsAppShareButton({
  phone,
  message,
}: {
  phone?: string | null;
  message: string;
}) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const href = `https://wa.me/${digits.startsWith("91") || !digits ? digits : "91" + digits}?text=${encodeURIComponent(message)}`;
  return (
    <Button variant="outline" asChild>
      <a href={href} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
    </Button>
  );
}
