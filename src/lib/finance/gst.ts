export interface LineItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
}

export function lineAmount(item: Pick<LineItem, "quantity" | "rate">): number {
  return Math.round(item.quantity * item.rate * 100) / 100;
}

/** GST rate applied across this ERP's invoices/quotations/POs — 18% (9% SGST + 9% CGST, or 18% IGST). */
export const GST_RATE = 0.18;

export function computeGstTotals(items: { amount: number }[], gstType: "SGST_CGST" | "IGST") {
  const taxableValue = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100;
  const taxAmount = Math.round(taxableValue * GST_RATE * 100) / 100;
  const grandTotal = Math.round((taxableValue + taxAmount) * 100) / 100;

  const half = Math.round((taxAmount / 2) * 100) / 100;
  return {
    taxableValue,
    taxAmount,
    grandTotal,
    sgst: gstType === "SGST_CGST" ? half : 0,
    cgst: gstType === "SGST_CGST" ? half : 0,
    igst: gstType === "IGST" ? taxAmount : 0,
  };
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  return `${TENS[Math.floor(n / 10)] ?? ""}${n % 10 ? " " + (ONES[n % 10] ?? "") : ""}`;
}

function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n);
  return `${ONES[Math.floor(n / 100)] ?? ""} Hundred${n % 100 ? " " + twoDigits(n % 100) : ""}`;
}

/** Converts a rupee amount into Indian-numbering words, e.g. 148680 → "One Lakh Forty Eight Thousand Six Hundred Eighty Rupees Only". */
export function amountInWords(amount: number): string {
  const n = Math.round(amount);
  if (n === 0) return "Zero Rupees Only";

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return `${parts.join(" ")} Rupees Only`;
}
