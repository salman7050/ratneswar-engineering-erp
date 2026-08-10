import { amountInWords } from "@/lib/finance/gst";
import { formatDate } from "@/lib/utils";
import type { InvoiceDetail } from "@/lib/queries/invoices";
import type { CompanyInfo } from "@/components/finance/document-print-view";

const money = (value: number) => value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function MetaCell({ label, value }: { label: string; value?: string | null }) {
  return <div className="invoice-meta-cell"><div className="invoice-meta-label">{label}</div><div className="invoice-meta-value">{value || "—"}</div></div>;
}

type InvoiceIssuer = {
  legalName: string;
  tradeName: string;
  gstin: string;
  pan?: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
  bankName?: string | null;
  accountNo?: string | null;
  ifsc?: string | null;
  branch?: string | null;
  isRatneswar: boolean;
};

function InvoiceHeader({ title = "Tax Invoice", company, issuer }: { title?: string; company: CompanyInfo; issuer: InvoiceIssuer }) {
  return <div className="invoice-document-header">
    <div className="invoice-title">{title}</div>
    <div className="invoice-copy">(ORIGINAL FOR RECIPIENT)</div>
    {issuer.isRatneswar ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={company.logoUrl || "/brand/ratneswar-wordmark.png"} alt={issuer.tradeName} className="invoice-wordmark" /></> : <div className="invoice-issuer-wordmark">{issuer.tradeName}</div>}
  </div>;
}

export function OfficialInvoicePrint({ invoice, company }: { invoice: InvoiceDetail; company: CompanyInfo }) {
  const thirdParty = invoice.subcontractor;
  const issuer: InvoiceIssuer = thirdParty ? {
    legalName: thirdParty.legalName || thirdParty.name,
    tradeName: thirdParty.legalName || thirdParty.name,
    gstin: thirdParty.gstin || "",
    pan: thirdParty.pan,
    address: thirdParty.address || "",
    email: thirdParty.email,
    phone: thirdParty.phone,
    bankName: thirdParty.bankName,
    accountNo: thirdParty.accountNo,
    ifsc: thirdParty.ifsc,
    branch: thirdParty.branch,
    isRatneswar: false,
  } : {
    legalName: company.legalName,
    tradeName: company.tradeName || company.legalName,
    gstin: company.gstin,
    pan: company.pan,
    address: company.address,
    email: company.email,
    phone: company.phone,
    bankName: invoice.bankAccount?.bankName,
    accountNo: invoice.bankAccount?.accountNo,
    ifsc: invoice.bankAccount?.ifsc,
    branch: invoice.bankAccount?.branch,
    isRatneswar: true,
  };
  const hasTesting = invoice.items.some((item) => Boolean(item.testingDescription));
  const cgst = invoice.gstType === "SGST_CGST" ? invoice.taxAmount / 2 : 0;
  const sgst = invoice.gstType === "SGST_CGST" ? invoice.taxAmount / 2 : 0;
  const igst = invoice.gstType === "IGST" ? invoice.taxAmount : 0;
  const period = invoice.periodFrom && invoice.periodTo ? `${formatDate(invoice.periodFrom)} to ${formatDate(invoice.periodTo)}` : invoice.billingMonth || "—";
  const hsnSummary = Array.from(new Set(invoice.items.map((item) => item.hsnCode).filter(Boolean))).join(", ") || "—";
  const effectiveGstRate = invoice.taxableValue > 0 ? (invoice.taxAmount / invoice.taxableValue) * 100 : 0;
  const halfGstRate = effectiveGstRate / 2;
  const rateLabel = (value: number) => `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}%`;

  return <div id="print-doc" className="official-invoice-wrap text-black">
    <section className="official-invoice-page">
      <InvoiceHeader company={company} issuer={issuer} />
      <div className="invoice-party-meta-grid">
        <div className="invoice-parties">
          <div className="invoice-seller">
            <div className="invoice-company-name">{issuer.tradeName.toUpperCase()}</div>
            <div>{issuer.address || "—"}</div><div>GSTIN/UIN: {issuer.gstin || "—"}</div>{issuer.pan && <div>PAN/IT No.: {issuer.pan}</div>}<div>E-Mail: {issuer.email || "—"}</div><div>Phone: {issuer.phone || "—"}</div>
          </div>
          <div className="invoice-buyer">
            <div className="invoice-small-label">Buyer (Bill to)</div>
            <div className="invoice-company-name">{invoice.buyerName.toUpperCase()}</div>
            <div>{invoice.buyerAddress || "—"}</div><div>GSTIN/UIN: {invoice.buyerGstin || "—"}</div><div>PAN/IT No.: {invoice.buyerPan || "—"}</div><div>Place of Supply: {invoice.placeOfSupply || "Gujarat"}</div>
          </div>
        </div>
        <div className="invoice-meta-grid">
          <MetaCell label="Invoice No." value={invoice.invoiceNo} /><MetaCell label="Dated" value={formatDate(invoice.date)} />
          <MetaCell label="Reference No. & Date" value={`${invoice.referenceNo || "—"}${invoice.referenceDate ? ` · ${formatDate(invoice.referenceDate)}` : ""}`} /><MetaCell label="Mode/Terms of Payment" value={invoice.paymentTerms} />
          <MetaCell label="Buyer's Order No." value={invoice.poRefNo} /><MetaCell label="Order Dated" value={invoice.buyerOrderDate ? formatDate(invoice.buyerOrderDate) : "—"} />
          <MetaCell label="Tender ID / Other Reference" value={invoice.tenderNo} /><MetaCell label="Destination" value={invoice.destination || invoice.site?.name} />
          <MetaCell label="Billing Period" value={period} /><MetaCell label="Dispatched Through" value={invoice.dispatchThrough} />
          <div className="invoice-meta-wide"><div className="invoice-meta-label">Terms of Delivery / Work</div><div className="invoice-meta-value">{invoice.termsOfDelivery || "As per approved scope of work."}</div></div>
        </div>
      </div>

      <table className="invoice-items-table">
        <thead><tr><th className="w-sl">Sl<br />No.</th><th>Particulars</th>{hasTesting && <th className="w-testing">KVI / KV Testing Description</th>}<th className="w-hsn">HSN/SAC</th><th className="w-qty">Quantity</th><th className="w-rate">Rate</th><th className="w-amount">Amount</th></tr></thead>
        <tbody>
          {invoice.items.map((item, index) => <tr key={item.id}>
            <td className="center">{index + 1}</td>
            <td><div className="invoice-item-category">{item.workCategory.replaceAll("_", " ")}</div><div>{item.description}</div></td>
            {hasTesting && <td>{item.testingDescription || "—"}</td>}
            <td className="center">{item.hsnCode}</td><td className="center">{Number(item.quantity).toLocaleString("en-IN")} {item.unit}</td><td className="right">{money(item.rate)}</td><td className="right bold">{money(item.amount)}</td>
          </tr>)}
          <tr className="invoice-fill-row"><td /><td />{hasTesting && <td />}<td /><td /><td /><td /></tr>
          {cgst > 0 && <tr className="tax-line"><td /><td className="right bold" colSpan={hasTesting ? 5 : 4}>CGST</td><td className="right bold">{money(cgst)}</td></tr>}
          {igst > 0 && <tr className="tax-line"><td /><td className="right bold" colSpan={hasTesting ? 5 : 4}>IGST</td><td className="right bold">{money(igst)}</td></tr>}
        </tbody>
      </table>
      <div className="invoice-page-continuation">continued to page number 2</div>
      <div className="invoice-page-footer"><b>SUBJECT TO {(company.jurisdiction || "Gujarat").toUpperCase()} JURISDICTION</b><br />This is a Computer Generated Invoice</div>
    </section>

    <section className="official-invoice-page invoice-page-two">
      <InvoiceHeader title="Tax Invoice (Page 2)" company={company} issuer={issuer} />
      <div className="invoice-page2-summary">
        <div><div className="invoice-company-name">{issuer.tradeName.toUpperCase()}</div><div>{issuer.address || "—"}</div><div>GSTIN/UIN: {issuer.gstin || "—"}</div><div>E-Mail: {issuer.email || "—"}</div></div>
        <div className="invoice-page2-meta"><MetaCell label="Invoice No." value={invoice.invoiceNo} /><MetaCell label="Dated" value={formatDate(invoice.date)} /><MetaCell label="Buyer" value={invoice.buyerName} /><MetaCell label="Destination" value={invoice.destination || invoice.site?.name} /></div>
      </div>
      <table className="invoice-page2-table"><thead><tr><th>Particulars</th><th>HSN/SAC</th><th>Taxable Value</th><th>Tax Amount</th></tr></thead><tbody>
        {sgst > 0 && <tr><td className="right bold">SGST</td><td>{hsnSummary}</td><td className="right">{money(invoice.taxableValue)}</td><td className="right bold">{money(sgst)}</td></tr>}
        {igst > 0 && <tr><td className="right bold">IGST</td><td>{hsnSummary}</td><td className="right">{money(invoice.taxableValue)}</td><td className="right bold">{money(igst)}</td></tr>}
        <tr className="invoice-page2-space"><td /><td /><td /><td /></tr>
        <tr className="invoice-total-row"><td className="right bold" colSpan={3}>Total</td><td className="right bold">₹ {money(invoice.grandTotal)}</td></tr>
      </tbody></table>

      <div className="invoice-words"><span>Amount Chargeable (in words)</span><b>INR {amountInWords(invoice.grandTotal)}</b></div>
      <table className="invoice-tax-summary"><thead><tr><th>HSN/SAC</th><th>Taxable Value</th>{invoice.gstType === "SGST_CGST" ? <><th>CGST Rate</th><th>CGST Amount</th><th>SGST Rate</th><th>SGST Amount</th></> : <><th>IGST Rate</th><th>IGST Amount</th></>}<th>Total Tax Amount</th></tr></thead><tbody><tr><td>{hsnSummary}</td><td>{money(invoice.taxableValue)}</td>{invoice.gstType === "SGST_CGST" ? <><td>{rateLabel(halfGstRate)}</td><td>{money(cgst)}</td><td>{rateLabel(halfGstRate)}</td><td>{money(sgst)}</td></> : <><td>{rateLabel(effectiveGstRate)}</td><td>{money(igst)}</td></>}<td>{money(invoice.taxAmount)}</td></tr></tbody></table>
      <div className="invoice-tax-words"><b>Tax Amount (in words):</b> INR {amountInWords(invoice.taxAmount)}</div>

      <div className="invoice-bottom-grid">
        <div><div><b>Declaration</b></div><div>{company.declaration || "We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct."}</div><div className="mt-3"><b>Company GSTIN:</b> {issuer.gstin || "—"}</div></div>
        <div><div><b>Company&apos;s Bank Details</b></div>{issuer.bankName || issuer.accountNo || issuer.ifsc ? <><div>Bank Name: <b>{issuer.bankName || "—"}</b></div><div>A/c No.: <b>{issuer.accountNo || "—"}</b></div><div>Branch & IFS Code: <b>{issuer.branch || "—"} {issuer.ifsc ? `& ${issuer.ifsc}` : ""}</b></div></> : <div>Bank details not configured for this legal issuer.</div>}</div>
        <div className="invoice-signatory"><div>for <b>{issuer.legalName.toUpperCase()}</b></div>{issuer.isRatneswar && invoice.includeSignature && invoice.signaturePreviewUrl ? <img src={invoice.signaturePreviewUrl} alt="Digital signature and company stamp" /> : <div className="invoice-signature-space" />}<div>{company.signatoryName || "Authorised Signatory"}</div></div>
      </div>
      {invoice.remarks && <div className="invoice-remarks"><b>Remarks:</b> {invoice.remarks}</div>}
      <div className="invoice-page-footer"><b>SUBJECT TO {(company.jurisdiction || "Gujarat").toUpperCase()} JURISDICTION</b><br />This is a Computer Generated Invoice</div>
    </section>
  </div>;
}
