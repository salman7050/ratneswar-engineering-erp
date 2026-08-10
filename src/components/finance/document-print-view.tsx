import { Zap } from "lucide-react";
import { PaymentQr } from "@/components/finance/payment-qr";
import { formatDate } from "@/lib/utils";
import { amountInWords } from "@/lib/finance/gst";

export interface PrintItem {
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PrintTotals {
  taxableValue: number;
  taxAmount: number;
  grandTotal: number;
  gstType: "SGST_CGST" | "IGST";
  sgst: number;
  cgst: number;
  igst: number;
}

export interface CompanyInfo {
  legalName: string;
  tradeName?: string;
  tagline?: string;
  gstin: string;
  pan?: string | null;
  address: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string | null;
  phone: string;
  email: string;
  website?: string | null;
  logoUrl?: string | null;
  signatoryName: string;
  signatureUrl?: string | null;
  jurisdiction?: string;
  declaration?: string;
  defaultPaymentTerms?: string;
  defaultQuoteTerms?: string;
  defaultPoTerms?: string;
}

export interface BankInfo {
  bankName: string;
  accountNo: string;
  ifsc: string;
  branch: string;
  upiId?: string | null;
}

export function DocumentPrintView({
  docTypeLabel,
  docNo,
  date,
  meta = [],
  partyLabel,
  partyName,
  partyAddress,
  partyGstin,
  items,
  totals,
  plainValue,
  scopeText,
  bankAccount,
  showQr,
  company,
  notes,
}: {
  docTypeLabel: string;
  docNo: string;
  date: Date | string;
  meta?: { label: string; value: string }[];
  partyLabel: string;
  partyName: string;
  partyAddress?: string | null;
  partyGstin?: string | null;
  items?: PrintItem[];
  totals?: PrintTotals;
  plainValue?: number;
  scopeText?: string | null;
  bankAccount?: BankInfo | null;
  showQr?: boolean;
  company: CompanyInfo;
  notes?: string | null;
}) {
  const grand = totals?.grandTotal ?? plainValue ?? 0;

  return (
    <div id="print-doc" className="official-generic-wrap mx-auto bg-white text-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8">
        <div>
          <div className="text-[10px] font-bold tracking-wide text-[#0F2347]">GSTIN: {company.gstin}</div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-[#2563EB]">{company.tagline || "Electrical, Mechanical, Civil & Solar Contractor"}</div>
        </div>
        <div className="flex items-center gap-2.5">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt="Company logo" className="h-11 w-28 object-contain object-right" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#4F46E5]">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
          )}
          <div className="text-right">
            <div className="text-lg font-black leading-none text-[#0F2347]">{company.tradeName || company.legalName}</div>
            <div className="text-xs font-semibold text-[#2563EB]">{company.legalName}</div>
          </div>
        </div>
      </div>
      <div className="mx-8 mt-3 h-[3px] bg-gradient-to-r from-[#0F2347] via-[#5896FF] to-[#2E7D32]" />

      {/* Title bar */}
      <div className="flex items-center justify-between bg-[#F8FAFC] px-8 py-3">
        <div className="text-lg font-black uppercase tracking-wide text-[#0F2347]">{docTypeLabel}</div>
        <div className="rounded border border-[#CBD5E1] px-2 py-1 text-[10px] font-bold text-[#64748B]">ORIGINAL</div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 border-y border-[#E2E8F0]">
        <div className="border-r border-[#E2E8F0] px-6 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{docTypeLabel} No.</div>
          <div className="mt-1 text-base font-bold text-[#0F2347]">{docNo}</div>
        </div>
        <div className="px-6 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Date</div>
          <div className="mt-1 text-base font-bold">{formatDate(date)}</div>
        </div>
        {meta.map((m, i) => (
          <div key={i} className={`border-t border-[#E2E8F0] px-6 py-3 ${i % 2 === 0 ? "border-r" : ""}`}>
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{m.label}</div>
            <div className="mt-1 text-sm font-semibold">{m.value || "—"}</div>
          </div>
        ))}
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 border-b border-[#E2E8F0]">
        <div className="border-r border-[#E2E8F0] px-6 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">From</div>
          <div className="mt-1.5 text-sm font-bold text-[#0F2347]">{company.legalName}</div>
          <div className="mt-1 text-xs leading-relaxed text-[#475569]">{company.address}<br />GSTIN: {company.gstin}<br />{company.phone}</div>
        </div>
        <div className="bg-[#FAFBFC] px-6 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{partyLabel}</div>
          <div className="mt-1.5 text-sm font-bold text-[#0F2347]">{partyName}</div>
          {partyAddress && <div className="mt-1 text-xs leading-relaxed text-[#475569]">{partyAddress}</div>}
          {partyGstin && <div className="mt-1 text-xs font-semibold">GSTIN: {partyGstin}</div>}
        </div>
      </div>

      {scopeText && (
        <div className="border-b border-[#E2E8F0] bg-[#F0F4FF] px-6 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#0F2347]">Scope of Work</div>
          <div className="mt-1 text-sm font-medium">{scopeText}</div>
        </div>
      )}

      {/* Items */}
      {items && items.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#F1F5F9]">
              <th className="border-b-2 border-[#0F2347] px-3 py-2.5 text-left text-[11px] font-bold uppercase text-[#64748B]">Sl.</th>
              <th className="border-b-2 border-[#0F2347] px-3 py-2.5 text-left text-[11px] font-bold uppercase text-[#64748B]">Particulars</th>
              <th className="border-b-2 border-[#0F2347] px-3 py-2.5 text-center text-[11px] font-bold uppercase text-[#64748B]">HSN/SAC</th>
              <th className="border-b-2 border-[#0F2347] px-3 py-2.5 text-right text-[11px] font-bold uppercase text-[#64748B]">Qty</th>
              <th className="border-b-2 border-[#0F2347] px-3 py-2.5 text-right text-[11px] font-bold uppercase text-[#64748B]">Rate</th>
              <th className="border-b-2 border-[#0F2347] px-3 py-2.5 text-right text-[11px] font-bold uppercase text-[#64748B]">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-[#E2E8F0]">
                <td className="px-3 py-2 text-center text-[#64748B]">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{it.description}</td>
                <td className="px-3 py-2 text-center font-mono text-xs">{it.hsnCode}</td>
                <td className="px-3 py-2 text-right font-mono">{it.quantity}</td>
                <td className="px-3 py-2 text-right font-mono">{it.rate.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2 text-right font-mono">{it.amount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Totals */}
      <div className="grid grid-cols-2 border-t border-[#E2E8F0]">
        <div className="border-r border-[#E2E8F0] px-6 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Amount in Words</div>
          <div className="mt-1 text-sm font-bold">{amountInWords(grand)}</div>

          {bankAccount && (
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Bank Details</div>
                <div className="mt-1 text-xs leading-relaxed text-[#475569]">
                  {bankAccount.bankName}<br />A/c No.: {bankAccount.accountNo}<br />IFSC: {bankAccount.ifsc} — {bankAccount.branch}
                </div>
              </div>
              {showQr && bankAccount.upiId && (
                <PaymentQr upiId={bankAccount.upiId} payeeName={company.legalName} amount={grand} note={docNo} size={90} />
              )}
            </div>
          )}
        </div>

        <div>
          {totals ? (
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-[#E2E8F0]"><td className="px-6 py-1.5 text-[#64748B]">Taxable Value</td><td className="px-6 py-1.5 text-right font-mono">{totals.taxableValue.toLocaleString("en-IN")}</td></tr>
                {totals.gstType === "SGST_CGST" ? (
                  <>
                    <tr className="border-b border-[#E2E8F0]"><td className="px-6 py-1.5 text-[#64748B]">SGST 9%</td><td className="px-6 py-1.5 text-right font-mono">{totals.sgst.toLocaleString("en-IN")}</td></tr>
                    <tr className="border-b border-[#E2E8F0]"><td className="px-6 py-1.5 text-[#64748B]">CGST 9%</td><td className="px-6 py-1.5 text-right font-mono">{totals.cgst.toLocaleString("en-IN")}</td></tr>
                  </>
                ) : (
                  <tr className="border-b border-[#E2E8F0]"><td className="px-6 py-1.5 text-[#64748B]">IGST 18%</td><td className="px-6 py-1.5 text-right font-mono">{totals.igst.toLocaleString("en-IN")}</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#0F2347]"><td className="px-6 py-2.5 font-bold text-white">Grand Total</td><td className="px-6 py-2.5 text-right font-mono text-lg font-black text-white">₹{totals.grandTotal.toLocaleString("en-IN")}</td></tr>
              </tfoot>
            </table>
          ) : (
            <div className="flex h-full items-center justify-end bg-[#0F2347] px-6 py-6">
              <div className="text-right">
                <div className="text-xs font-semibold text-white/70">Total Value</div>
                <div className="font-mono text-2xl font-black text-white">₹{grand.toLocaleString("en-IN")}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {notes && (
        <div className="border-t border-[#E2E8F0] px-6 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Terms & Notes</div>
          <div className="mt-1 text-xs leading-relaxed text-[#475569]">{notes}</div>
        </div>
      )}

      {/* Declaration + signature */}
      <div className="grid grid-cols-[1fr_180px] border-t-2 border-[#0F2347]">
        <div className="border-r border-[#E2E8F0] px-6 py-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">Declaration</div>
          <div className="mt-1 text-xs leading-relaxed text-[#475569]">
            {company.declaration || `We declare that this ${docTypeLabel.toLowerCase()} shows the actual price and that all particulars are true and correct.`} Subject to <b>{company.jurisdiction || "Gujarat"} Jurisdiction</b>.
          </div>
        </div>
        <div className="flex flex-col items-center justify-between px-4 py-4 text-center">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">For {company.legalName}</div>
          {company.signatureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.signatureUrl} alt="Signature" className="h-10 object-contain" />
          ) : (
            <div className="h-10" />
          )}
          <div className="w-full border-t border-[#CBD5E1] pt-1 text-[10px] text-[#64748B]">{company.signatoryName}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap justify-center gap-6 bg-[#0F2347] px-6 py-3">
        <span className="text-[11px] text-white/75">📍 {company.address}</span>
        <span className="text-[11px] text-white/75">✉ {company.email}</span>
      </div>
    </div>
  );
}
