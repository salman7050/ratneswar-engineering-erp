"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Muted } from "@/components/ui/typography";

export function PaymentQr({
  upiId,
  payeeName,
  amount,
  note,
  size = 120,
}: {
  upiId: string;
  payeeName: string;
  amount: number;
  note: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
    QRCode.toDataURL(upiLink, { width: size * 2, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [upiId, payeeName, amount, note, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="Scan to pay via UPI" width={size} height={size} className="rounded-lg border border-border" />
      <Muted className="text-center text-[10px]">Scan to pay via UPI</Muted>
    </div>
  );
}
