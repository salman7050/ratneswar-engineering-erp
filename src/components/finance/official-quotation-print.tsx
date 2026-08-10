import { amountInWords } from "@/lib/finance/gst";
import { formatDate } from "@/lib/utils";
import type { QuotationDetail } from "@/lib/queries/quotations";
import type { CompanyInfo } from "@/components/finance/document-print-view";

const money = (value: number) => value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const lines = (value?: string | null) => (value || "").split(/\r?\n/).map((v) => v.trim()).filter(Boolean);

export function OfficialQuotationPrint({ quotation, company }: { quotation: QuotationDetail; company: CompanyInfo }) {
  const hasSecondary = quotation.items.some((item) => item.secondaryQuantity != null);
  const primaryHeader = hasSecondary ? (quotation.items.find((item) => item.secondaryQuantity != null)?.unit || "Qty") : "Quantity";
  const secondaryHeader = quotation.items.find((item) => item.secondaryQuantity != null)?.secondaryUnit || "Qty 2";
  const pageSize = quotation.items.length <= 7 ? 7 : 6;
  const pages: Array<typeof quotation.items> = [];
  for (let i = 0; i < quotation.items.length; i += pageSize) pages.push(quotation.items.slice(i, i + pageSize));
  const cgst = quotation.gstType === "SGST_CGST" ? quotation.taxAmount / 2 : 0;
  const sgst = quotation.gstType === "SGST_CGST" ? quotation.taxAmount / 2 : 0;
  const igst = quotation.gstType === "IGST" ? quotation.taxAmount : 0;
  const noteLines = lines(quotation.notes);
  const termLines = lines(quotation.terms);
  const pending = quotation.approvalStatus === "PENDING" || quotation.approvalStatus === "REJECTED";

  return <div id="print-doc" className="ratneswar-quotation-wrap text-black">
    {pages.map((items, pageIndex) => {
      const isLast = pageIndex === pages.length - 1;
      const itemStart = pageIndex * pageSize;
      return <section className="ratneswar-quotation-page" key={pageIndex}>
        <QuotationLetterhead company={company} />
        <div className="rq-watermark" aria-hidden="true">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/ratneswar-logo.png" alt="" /></div>
        {pending && <div className="rq-draft-watermark">{quotation.approvalStatus === "REJECTED" ? "REVISION REQUIRED" : "OWNER APPROVAL PENDING"}</div>}

        {pageIndex === 0 ? <>
          <div className="rq-ref-row"><span>Ref No.: <b>{quotation.referenceNo}</b></span><span>Date: <b>{formatDate(quotation.date)}</b></span></div>
          <div className="rq-to-block"><div>To,</div>{quotation.recipientDesignation && <b>{quotation.recipientDesignation}</b>}{quotation.recipientDepartment && <b>{quotation.recipientDepartment}</b>}<b>{quotation.client}</b>{quotation.clientAddress && <span>{quotation.clientAddress}</span>}</div>
          <div className="rq-subject"><b>Subject:</b> {quotation.subject}</div>
          <div className="rq-intro"><b>Dear Sir,</b><p>{quotation.introduction || `With reference to the requirement, we are pleased to submit our quotation for ${quotation.scope}. The details of the work and corresponding rates are as follows:`}</p></div>
        </> : <div className="rq-ref-row rq-continuation"><span>Ref No.: <b>{quotation.referenceNo}</b></span><span>Page {pageIndex + 1} of {pages.length}</span></div>}

        <QuotationItemsTable items={items} startIndex={itemStart} hasSecondary={hasSecondary} primaryHeader={primaryHeader} secondaryHeader={secondaryHeader} />

        {isLast && <div className="rq-final-block">
          <div className="rq-totals">
            <div><span>Sub Total:</span><b>₹ {money(quotation.taxableValue)}/-</b></div>
            {quotation.gstType === "SGST_CGST" ? <><div><span>CGST (9%):</span><b>₹ {money(cgst)}/-</b></div><div><span>SGST (9%):</span><b>₹ {money(sgst)}/-</b></div></> : <div><span>IGST (18%):</span><b>₹ {money(igst)}/-</b></div>}
            <div className="rq-grand"><span>Grand Total:</span><b>₹ {money(quotation.amount)}/-</b></div>
            <div className="rq-words">(Rupees {amountInWords(quotation.amount).replace(/ Rupees Only$/, "")} Only)</div>
          </div>

          {noteLines.length > 0 && <div className="rq-list"><b>Notes:</b><ol>{noteLines.map((line, i) => <li key={i}>{line}</li>)}</ol></div>}
          {termLines.length > 0 && <div className="rq-list"><b>Terms & Conditions:</b><ol>{termLines.map((line, i) => <li key={i}>{line}</li>)}</ol></div>}

          <div className="rq-closing"><p>We assure you of quality workmanship, timely execution, and adherence to applicable safety standards.</p><p>We look forward to your approval and the opportunity to execute the work.</p><p className="rq-thanks">Thanking you,<br/>Yours faithfully,<br/><b>For {company.legalName}</b></p></div>
          <div className="rq-signature">{quotation.includeSignature && quotation.signaturePreviewUrl ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={quotation.signaturePreviewUrl} alt="Digital signature and company stamp"/></> : <div className="rq-signature-space" />}<div>[{company.signatoryName || "Authorised Signatory"}]</div></div>
          {quotation.approvalStatus === "APPROVED" && quotation.approvedBy && <div className="rq-approval-line">Owner reviewed: {quotation.approvedBy.name}{quotation.approvedAt ? ` · ${formatDate(quotation.approvedAt)}` : ""}</div>}
        </div>}
        <QuotationFooter company={company} />
      </section>;
    })}
  </div>;
}

function QuotationLetterhead({ company }: { company: CompanyInfo }) {
  return <header className="rq-letterhead"><div className="rq-company-meta"><div>G.S.T. No. {company.gstin}</div><div>{(company.tagline || "ELECTRICAL, MECHANICAL & CIVIL CONTRACTOR").toUpperCase()}</div></div>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="rq-wordmark" src={company.logoUrl || "/brand/ratneswar-wordmark.png"} alt={company.tradeName || company.legalName}/></header>;
}

function QuotationItemsTable({ items, startIndex, hasSecondary, primaryHeader, secondaryHeader }: { items: QuotationDetail["items"]; startIndex: number; hasSecondary: boolean; primaryHeader: string; secondaryHeader: string }) {
  return <table className="rq-table"><thead><tr><th>Sr. No.</th><th>Description of Work</th><th>{primaryHeader}</th>{hasSecondary && <th>{secondaryHeader}</th>}<th>Rate (₹)</th>{hasSecondary && <th>Unit</th>}<th>Amount (₹)</th></tr></thead><tbody>{items.map((item, i) => <tr key={item.id}><td>{startIndex + i + 1}</td><td>{item.description}</td><td>{item.calculationMode === "FIXED" ? (item.unit || "L.S.") : `${Number(item.quantity).toLocaleString("en-IN")} ${hasSecondary ? "" : item.unit || ""}`}</td>{hasSecondary && <td>{item.secondaryQuantity == null ? "" : Number(item.secondaryQuantity).toLocaleString("en-IN")}</td>}<td>{item.calculationMode === "FIXED" && item.rate === item.amount ? "—" : money(item.rate)}</td>{hasSecondary && <td>{item.rateBasis || item.unit || ""}</td>}<td><b>{money(item.amount)}</b></td></tr>)}</tbody></table>;
}

function QuotationFooter({ company }: { company: CompanyInfo }) {
  return <footer className="rq-footer"><div>{company.address}</div><div>(M) {company.phone} &nbsp;&nbsp; E-mail : {company.email}</div></footer>;
}
