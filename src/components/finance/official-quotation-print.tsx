import { amountInWords } from "@/lib/finance/gst";
import { formatDate } from "@/lib/utils";
import type { QuotationDetail } from "@/lib/queries/quotations";
import type { CompanyInfo } from "@/components/finance/document-print-view";

const money = (value: number) => value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const lines = (value?: string | null) => (value || "").split(/\r?\n/).map((v) => v.trim()).filter(Boolean);

function paginateItems(quotation: QuotationDetail) {
  const items = quotation.items;
  if (!items.length) return [[] as typeof quotation.items];

  const supportText = (quotation.notes?.length || 0) + (quotation.terms?.length || 0) + (quotation.introduction?.length || 0);
  const hasLongItem = items.some((item) => item.description.length > 170);
  const onePageCapacity = hasLongItem ? 3 : supportText > 1050 ? 4 : 6;
  if (items.length <= onePageCapacity) return [items];

  const normalCapacity = hasLongItem ? 6 : 10;
  const finalCapacity = supportText > 1250 ? 3 : supportText > 750 ? 4 : 5;
  const pages: Array<typeof quotation.items> = [];
  let index = 0;
  while (items.length - index > finalCapacity) {
    const remaining = items.length - index;
    const take = Math.min(normalCapacity, Math.max(1, remaining - finalCapacity));
    pages.push(items.slice(index, index + take));
    index += take;
  }
  pages.push(items.slice(index));
  return pages;
}

function closingFor(quotation: QuotationDetail) {
  const text = `${quotation.subject} ${quotation.scope}`.toLowerCase();
  if (/techno|supply|material|equipment|transformer|panel|cable|transport/.test(text)) {
    return "We assure you of professional coordination, quality supply and best service. Kindly consider our offer favourably and release the Purchase Order at the earliest.";
  }
  return "We assure quality execution and professional service. Kindly consider our offer favourably and issue the Purchase Order at the earliest.";
}

export function OfficialQuotationPrint({ quotation, company }: { quotation: QuotationDetail; company: CompanyInfo }) {
  const pages = paginateItems(quotation);
  const cgst = quotation.gstType === "SGST_CGST" ? quotation.taxAmount / 2 : 0;
  const sgst = quotation.gstType === "SGST_CGST" ? quotation.taxAmount / 2 : 0;
  const igst = quotation.gstType === "IGST" ? quotation.taxAmount : 0;
  const noteLines = lines(quotation.notes);
  const termLines = lines(quotation.terms);
  const pending = quotation.approvalStatus === "PENDING" || quotation.approvalStatus === "REJECTED";

  return <div id="print-doc" className="ratneswar-quotation-wrap rq2-wrap text-black">
    {pages.map((items, pageIndex) => {
      const isFirst = pageIndex === 0;
      const isLast = pageIndex === pages.length - 1;
      const startIndex = pages.slice(0, pageIndex).reduce((sum, page) => sum + page.length, 0);

      return <section className="ratneswar-quotation-page rq2-page" key={pageIndex}>
        {/* Exact Ratneswar Engineering letterpad supplied by the user. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rq2-letterpad" src="/brand/ratneswar-letterpad-a4.png" alt="" aria-hidden="true" />
        {pending && <div className="rq2-draft">{quotation.approvalStatus === "REJECTED" ? "REVISION REQUIRED" : "DRAFT - APPROVAL PENDING"}</div>}

        <main className="rq2-content">
          <div className="rq2-docline">
            <div><span>Ref:</span><b>{quotation.referenceNo}</b></div>
            <div><span>Date:</span><b>{formatDate(quotation.date)}</b></div>
          </div>

          {isFirst ? <>
            <div className="rq2-to-block">
              <span>To,</span>
              {quotation.recipientDesignation && <b>{quotation.recipientDesignation}</b>}
              {quotation.recipientDepartment && <b>{quotation.recipientDepartment}</b>}
              <b>{quotation.client}</b>
              {quotation.clientAddress && <span>{quotation.clientAddress}</span>}
              {quotation.clientGstin && <span>GST No: {quotation.clientGstin}</span>}
            </div>

            <div className="rq2-subject"><b>Subject:</b><span>{quotation.subject}</span></div>
            <div className="rq2-opening">
              <p>Dear Sir,</p>
              <p>{quotation.introduction || `With reference to your requirement, we are pleased to submit our quotation for ${quotation.scope}. The scope and commercial details are given below.`}</p>
            </div>
          </> : <div className="rq2-continuation"><span>{quotation.referenceNo}</span><b>Continuation - Page {pageIndex + 1} of {pages.length}</b></div>}

          <h2 className="rq2-section-title">{isFirst ? "PRICE SCHEDULE" : "PRICE SCHEDULE - CONTINUED"}</h2>
          <QuotationItemsTable items={items} startIndex={startIndex} />

          {isLast && <>
            <div className="rq2-summary-grid">
              <div className="rq2-words">
                <span>Grand Total in Words</span>
                <b>{amountInWords(quotation.amount)}</b>
              </div>
              <div className="rq2-totals">
                <div><span>Sub Total</span><b>₹ {money(quotation.taxableValue)}</b></div>
                {quotation.gstType === "SGST_CGST" ? <>
                  <div><span>CGST @ 9%</span><b>₹ {money(cgst)}</b></div>
                  <div><span>SGST @ 9%</span><b>₹ {money(sgst)}</b></div>
                </> : <div><span>IGST @ 18%</span><b>₹ {money(igst)}</b></div>}
                <div className="rq2-grand"><span>Grand Total</span><b>₹ {money(quotation.amount)}/-</b></div>
              </div>
            </div>

            {noteLines.length > 0 && <section className="rq2-detail-section"><h3>SCOPE / TECHNICAL NOTES</h3><ul>{noteLines.map((line, i) => <li key={i}>{line}</li>)}</ul></section>}
            {termLines.length > 0 && <section className="rq2-detail-section rq2-terms"><h3>COMMERCIAL TERMS &amp; CONDITIONS</h3><ol>{termLines.map((line, i) => <li key={i}>{line}</li>)}</ol></section>}

            {quotation.bankAccount && <section className="rq2-bank-inline"><h3>BANK DETAILS</h3><div><b>{quotation.bankAccount.bankName}</b> · A/c {quotation.bankAccount.accountNo} · IFSC {quotation.bankAccount.ifsc}{quotation.bankAccount.branch ? ` · ${quotation.bankAccount.branch}` : ""}</div></section>}

            <p className="rq2-closing-text">{closingFor(quotation)}</p>
            <div className="rq2-signoff">
              <p><b>Thanking you,</b></p>
              <p><b>Yours faithfully,</b></p>
              <p>For <b>{company.legalName}</b></p>
              {quotation.includeSignature ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={quotation.signaturePreviewUrl || "/brand/salman-sign-stamp.png"} alt="Authorised signature and company stamp" /></> : <div className="rq2-sign-space" />}
            </div>
          </>}
        </main>

        <div className="rq2-page-no">Page {pageIndex + 1} of {pages.length}</div>
      </section>;
    })}
  </div>;
}

function QuotationItemsTable({ items, startIndex }: { items: QuotationDetail["items"]; startIndex: number }) {
  return <table className="rq2-table">
    <thead><tr><th className="rq2-sl">Sr. No.</th><th>Description / Particulars</th><th className="rq2-hsn">HSN/SAC</th><th className="rq2-qty">Qty</th><th className="rq2-unit">Unit</th><th className="rq2-rate">Rate (₹)</th><th className="rq2-amount">Amount (₹)</th></tr></thead>
    <tbody>{items.map((item, i) => <tr key={item.id}>
      <td className="rq2-center">{startIndex + i + 1}</td>
      <td className="rq2-description">{item.description}</td>
      <td className="rq2-center">{item.hsnCode || "-"}</td>
      <td className="rq2-center">{item.calculationMode === "FIXED" ? "1" : Number(item.quantity).toLocaleString("en-IN")}</td>
      <td className="rq2-center">{item.calculationMode === "FIXED" ? (item.rateBasis || item.unit || "Job") : (item.unit || "Nos")}</td>
      <td className="rq2-right">{item.calculationMode === "FIXED" ? money(item.amount) : money(item.rate)}</td>
      <td className="rq2-right rq2-bold">{money(item.amount)}</td>
    </tr>)}</tbody>
  </table>;
}
