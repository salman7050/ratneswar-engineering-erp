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
  const contactName = po.deliveryContactPerson || company.poContactName || po.raisedBy || "—";
  const contactEmail = company.poContactEmail || company.email;
  const contactPhone = company.poContactPhone || company.phone;

  return (
    <div id="print-doc" className="ratneswar-po-wrap">
      <section className="ratneswar-po-page">
        <header className="rpo-letterhead">
          <div className="rpo-letterhead-left">
            <p className="rpo-gstin">GSTIN: {company.gstin}</p>
            <p className="rpo-contractor-line">{company.tagline || "ELECTRICAL, MECHANICAL, CIVIL & SOLAR CONTRACTOR"}</p>
          </div>
          <div className="rpo-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ratneswar-logo-full.png" alt="Ratneswar Engineering" className="rpo-wordmark" />
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
            <div><b>Contact Person</b><span>{contactName}</span></div>
            <div><b>Email ID</b><span>{contactEmail}</span></div>
            <div><b>Mobile No.</b><span>{contactPhone}</span></div>
            <div><b>GST No.</b><span>{company.gstin}</span></div>
            {po.site?.name && <div><b>Project / Site</b><span>{po.site.name}</span></div>}
          </div>
        </div>

        {po.vendorContactPerson && <div className="rpo-kind-attn">KIND ATTN.: {po.vendorContactPerson}</div>}

        <div className="rpo-reference-block">
          <p><b>Sub</b><span>:</span>{subject}</p>
          {po.quotationRef && <p><b>Ref. No.</b><span>:</span>{po.quotationRef}</p>}
          {po.refNumber && <p><b>Other Ref.</b><span>:</span>{po.refNumber}</p>}
        </div>

        <p className="rpo-opening">Dear Sir/Madam,<br />With reference to your offer and our discussion, we are pleased to place this Purchase Order. Kindly arrange supply strictly as per the specifications, quantities, rates and commercial terms mentioned below.</p>

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
              {po.includeSignature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/brand/ratneswar-authorised-signature.png" alt="Authorised signature and stamp" />
              ) : <div className="rpo-signature-space" />}
              <div>Authorised Signatory</div>
            </div>
          </div>
        </div>

        <div className="rpo-po-note">Please mention the above P.O. Number on your Tax Invoice, Delivery Challan and all correspondence related to this order.</div>
        <footer className="rpo-footer"><b>{company.legalName}</b><span>{company.address}</span><span>{company.email}</span></footer>
      </section>
    </div>
  );
}
