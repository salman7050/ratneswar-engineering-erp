import { amountInWords } from "@/lib/finance/gst";
import { formatDate } from "@/lib/utils";
import type { PurchaseOrderDetail } from "@/lib/queries/purchase-orders";
import type { CompanyInfo } from "@/components/finance/document-print-view";

type POCompanyInfo = CompanyInfo & {
  poContactName?: string | null;
  poContactEmail?: string | null;
  poContactPhone?: string | null;
};

function n(value: number) {
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lines(value?: string | null) {
  return (value ?? "").split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
}

export function POPrintView({ po, company }: { po: PurchaseOrderDetail; company: POCompanyInfo }) {
  const terms = lines(po.terms);
  const taxableLines = po.items.map((it) => ({ ...it, taxable: Math.round(it.quantity * it.rate * 100) / 100 }));
  const subject = po.projectName || (po.items[0]?.description ? `Purchase Order for ${po.items[0].description}` : "Purchase Order");

  return (
    <div id="print-doc" className="ratneswar-po-wrap">
      <section className="ratneswar-po-page">
        <header className="rpo-letterhead">
          <div className="rpo-brand">
            {/* exact supplied Ratneswar wordmark */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ratneswar-wordmark.png" alt="Ratneswar Engineering" className="rpo-wordmark" />
            <p>ELECTRICAL, MECHANICAL &amp; CIVIL CONTRACTOR</p>
          </div>
          <div className="rpo-company-contact">
            <p>{company.address}</p>
            <p>{company.phone}</p>
            <p>{company.email}</p>
            <p><b>GST No.:</b> {company.gstin}</p>
          </div>
        </header>

        <h1 className="rpo-title">PURCHASE ORDER</h1>

        <div className="rpo-party-meta">
          <div className="rpo-vendor-box">
            <p className="rpo-label">TO,</p>
            <p className="rpo-vendor-name">M/s. {po.vendorName}</p>
            {po.vendorAddress && <p>{po.vendorAddress}</p>}
            {po.vendorPhone && <p>Tel: {po.vendorPhone}</p>}
            {po.vendorEmail && <p>Email: {po.vendorEmail}</p>}
            {po.vendorGstin && <p>GSTIN: {po.vendorGstin}</p>}
          </div>
          <div className="rpo-meta-box">
            <div><b>P.O. No.</b><span>{po.poNo}</span></div>
            <div><b>P.O. Date</b><span>{formatDate(po.date)}</span></div>
            <div><b>Contact Person</b><span>{company.poContactName || "Salman Perwez"}</span></div>
            <div><b>Email ID</b><span>{company.poContactEmail || "ratneswar.salman@gmail.com"}</span></div>
            <div><b>Mobile No.</b><span>{company.poContactPhone || "7050202473"}</span></div>
            <div><b>GST No.</b><span>{company.gstin}</span></div>
            {po.site?.name && <div><b>Project / Site</b><span>{po.site.name}</span></div>}
          </div>
        </div>

        <div className="rpo-reference-block">
          <p><b>Sub</b><span>:</span>{subject}</p>
          {po.quotationRef && <p><b>Ref. No.</b><span>:</span>{po.quotationRef}</p>}
          {po.refNumber && <p><b>Other Ref.</b><span>:</span>{po.refNumber}</p>}
        </div>

        <p className="rpo-opening">Dear Sir/Madam,<br />With reference to the above requirement / offer, please find below our Purchase Order:</p>

        <table className="rpo-items">
          <thead><tr><th className="rpo-sl">Sr.<br />No.</th><th>Material / Service Description</th><th className="rpo-hsn">HSN / SAC</th><th className="rpo-qty">Qty</th><th className="rpo-uom">UOM</th><th className="rpo-rate">Unit Rate<br />(INR)</th><th className="rpo-amount">Amount<br />(INR)</th></tr></thead>
          <tbody>
            {taxableLines.map((it, index) => <tr key={it.id}><td className="rpo-center">{index + 1}</td><td className="rpo-desc">{it.description}</td><td className="rpo-center">{it.hsnCode}</td><td className="rpo-center">{n(it.quantity).replace(".00", "")}</td><td className="rpo-center">{it.unit}</td><td className="rpo-right">{n(it.rate)}</td><td className="rpo-right">{n(it.taxable)}</td></tr>)}
          </tbody>
        </table>

        <div className="rpo-total-grid">
          <div className="rpo-words"><b>Amount in Words:</b><span>{amountInWords(po.grandTotal)}</span></div>
          <table className="rpo-totals"><tbody>
            <tr><td>Taxable Amount</td><td>{n(po.taxableValue)}</td></tr>
            {po.gstType === "SGST_CGST" ? <><tr><td>CGST</td><td>{n(po.cgstAmount)}</td></tr><tr><td>SGST</td><td>{n(po.sgstAmount)}</td></tr></> : <tr><td>IGST</td><td>{n(po.igstAmount)}</td></tr>}
            {po.roundOff !== 0 && <tr><td>Round Off</td><td>{n(po.roundOff)}</td></tr>}
            <tr className="rpo-grand"><td>Total Amount (Inclusive of GST)</td><td>₹ {n(po.grandTotal)}</td></tr>
          </tbody></table>
        </div>

        <div className="rpo-bottom-grid">
          <div className="rpo-terms">
            <p className="rpo-section-title">TERMS &amp; CONDITIONS</p>
            {terms.length ? <ol>{terms.map((term, i) => <li key={`${i}-${term}`}>{term}</li>)}</ol> : <p className="rpo-muted">As mutually agreed between buyer and supplier.</p>}
            {po.specialInstructions && <><p className="rpo-section-title rpo-small-top">SPECIAL INSTRUCTIONS</p><p>{po.specialInstructions}</p></>}
          </div>
          <div className="rpo-delivery-sign">
            <div>
              <p className="rpo-section-title">DELIVERY ADDRESS</p>
              <p className="rpo-delivery-name">Ratneswar Engineering</p>
              <p>{po.deliveryAddress || company.address}</p>
              <p>Email: {company.email}</p>
            </div>
            <div className="rpo-signature">
              <p>For RATNESWAR ENGINEERING</p>
              {po.includeSignature && po.signaturePreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={po.signaturePreviewUrl} alt="Authorised signature and stamp" />
              ) : <div className="rpo-signature-space" />}
              <div>Authorized Signatory</div>
            </div>
          </div>
        </div>

        <footer className="rpo-footer">Ratneswar Engineering · {company.address} · {company.email}</footer>
      </section>
    </div>
  );
}
