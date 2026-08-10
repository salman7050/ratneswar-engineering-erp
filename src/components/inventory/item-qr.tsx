"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Muted } from "@/components/ui/typography";

export function ItemQr({
  sku,
  name,
  size = 100,
}: {
  sku: string;
  name: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    QRCode.toDataURL(sku, { width: size * 2, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [sku, size]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className="animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <div id="item-qr-label" className="flex flex-col items-center gap-1 rounded-lg border border-border bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR code for ${sku}`} width={size} height={size} />
      <p className="text-center text-[11px] font-bold text-[#1a1a2e]">{sku}</p>
      <p className="max-w-[140px] truncate text-center text-[10px] text-[#64748B]">{name}</p>
      <Muted className="no-print text-center text-[9px]">Scan to identify item</Muted>
    </div>
  );
}
