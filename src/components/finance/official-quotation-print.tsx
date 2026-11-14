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

  return <div id="print-doc" className="ratneswar-quotation-wrap rq2-wrap text-black"><style data-ratneswar-quotation-css>{`
.rq2-wrap{display:flex;flex-direction:column;align-items:center;gap:22px;width:100%;color:#111827;font-family:"Times New Roman",Times,serif}
.rq2-page{position:relative!important;box-sizing:border-box!important;width:210mm!important;height:297mm!important;min-height:297mm!important;max-height:297mm!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#fff!important;box-shadow:0 14px 42px rgba(15,23,42,.14);font-family:"Times New Roman",Times,serif!important;font-size:10.2px!important;line-height:1.32!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.rq2-letterpad{position:absolute;z-index:0;inset:0;width:210mm;height:297mm;object-fit:fill;pointer-events:none;user-select:none}
.rq2-content{position:absolute;z-index:2;left:9.5mm;right:9.5mm;top:25.5mm;bottom:17.5mm;display:block}
.rq2-docline{display:flex;justify-content:space-between;gap:8mm;margin:1.5mm 1mm 3mm;font-size:10px}.rq2-docline>div{display:flex;gap:2mm;align-items:baseline}.rq2-docline span{color:#111827;font-weight:400}.rq2-docline b{color:#0f172a;white-space:nowrap;font-weight:700}
.rq2-to-block{display:flex;flex-direction:column;margin:0 1.5mm 4mm;line-height:1.35;font-size:10.1px}.rq2-to-block span,.rq2-to-block b{display:block;white-space:pre-line}.rq2-to-block b{font-weight:700}
.rq2-subject{display:grid;grid-template-columns:17mm 1fr;gap:1.5mm;margin:2.5mm 1.5mm 3mm;padding:0;border:0;font-size:10.2px;line-height:1.35}.rq2-subject b{font-weight:800}.rq2-subject span{font-weight:700}
.rq2-opening{margin:0 1.5mm 2.6mm;font-size:10px;line-height:1.35}.rq2-opening p{margin:0 0 1.2mm;text-align:justify;font-weight:400}.rq2-opening p:first-child{font-weight:700}
.rq2-continuation{display:flex;justify-content:space-between;align-items:center;margin:1.5mm 1mm 3mm;font-size:9.2px;color:#334155}.rq2-continuation span,.rq2-continuation b{font-weight:700}
.rq2-section-title{margin:2mm 1.5mm 1.3mm;font-size:10.3px;line-height:1;font-weight:800;letter-spacing:.1px;color:#111827}
.rq2-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:9.2px;line-height:1.28}.rq2-table thead{display:table-header-group}.rq2-table tr{break-inside:avoid;page-break-inside:avoid}.rq2-table th,.rq2-table td{border:.25mm solid #222;padding:1.35mm 1.1mm;vertical-align:top}.rq2-table th{background:rgba(255,255,255,.7);color:#111827;font-size:8.8px;font-weight:800;text-align:center}.rq2-table td{min-height:7mm}.rq2-sl{width:10mm}.rq2-hsn{width:19mm}.rq2-qty{width:12mm}.rq2-unit{width:13mm}.rq2-rate{width:23mm}.rq2-amount{width:25mm}.rq2-description{font-weight:600;line-height:1.3;white-space:pre-line}.rq2-center{text-align:center;vertical-align:middle!important}.rq2-right{text-align:right;vertical-align:middle!important;font-variant-numeric:tabular-nums}.rq2-bold{font-weight:800}
.rq2-summary-grid{display:grid;grid-template-columns:1fr 78mm;border:.25mm solid #222;border-top:0;break-inside:avoid;page-break-inside:avoid}.rq2-words{padding:2.5mm 2.8mm;display:flex;flex-direction:column;gap:1mm}.rq2-words span{font-size:8.3px;color:#111827;font-weight:800}.rq2-words b{font-size:9.5px;line-height:1.35}.rq2-totals{border-left:.25mm solid #222}.rq2-totals>div{display:grid;grid-template-columns:1fr auto;gap:4mm;padding:1.1mm 1.8mm;border-bottom:.2mm solid #444}.rq2-totals>div:last-child{border-bottom:0}.rq2-totals span,.rq2-totals b{font-size:9px}.rq2-totals span{font-weight:700}.rq2-totals b{font-variant-numeric:tabular-nums}.rq2-grand{background:transparent;font-size:9.7px;font-weight:900;color:#0f172a;border-top:.3mm solid #111}
.rq2-detail-section{margin:3.2mm 1.5mm 0;font-size:9.4px;line-height:1.3;break-inside:avoid;page-break-inside:avoid}.rq2-detail-section h3{margin:0 0 1.2mm;font-size:10px;font-weight:800;color:#111827}.rq2-detail-section ul,.rq2-detail-section ol{margin:0;padding-left:6mm}.rq2-detail-section li{margin:0 0 .9mm}.rq2-terms{margin-top:3.6mm}
.rq2-bank-inline{margin:2.8mm 1.5mm 0;padding-top:1.5mm;border-top:.2mm solid #64748b;font-size:8.6px;line-height:1.3;break-inside:avoid;page-break-inside:avoid}.rq2-bank-inline h3{margin:0 0 .8mm;font-size:9.3px;font-weight:800}.rq2-bank-inline div{font-weight:500}
.rq2-closing-text{margin:3mm 1.5mm 0;font-size:9.7px;line-height:1.35;font-weight:600;break-inside:avoid;page-break-inside:avoid}
.rq2-signoff{display:block;min-height:25mm;margin:3.5mm 1.5mm 0;text-align:left;font-size:9.6px;line-height:1.28;break-inside:avoid;page-break-inside:avoid}.rq2-signoff p{margin:0 0 .7mm}.rq2-signoff img{display:block;width:46mm;height:25mm;object-fit:contain;object-position:left center;margin-top:.5mm}.rq2-sign-space{height:14mm}
.rq2-page-no{position:absolute;z-index:3;right:10mm;bottom:14mm;color:#64748b;font-size:6.5px;font-weight:700}.rq2-draft{position:absolute;z-index:4;left:25mm;right:25mm;top:142mm;transform:rotate(-24deg);border:.45mm solid rgba(180,83,9,.22);color:rgba(180,83,9,.22);font-size:19px;font-weight:900;letter-spacing:1.5px;text-align:center;padding:2.5mm;pointer-events:none}
@media screen and (max-width:900px){.rq2-wrap{align-items:flex-start;overflow:auto}.rq2-page{box-shadow:none}}
@media print{@page{size:A4 portrait;margin:0}.rq2-wrap{display:block!important;width:210mm!important;min-width:210mm!important;max-width:210mm!important;margin:0!important;padding:0!important;gap:0!important;overflow:visible!important}.rq2-page{width:210mm!important;min-width:210mm!important;max-width:210mm!important;height:297mm!important;min-height:297mm!important;max-height:297mm!important;margin:0!important;padding:0!important;box-shadow:none!important;border:0!important;overflow:hidden!important;break-after:page!important;page-break-after:always!important}.rq2-page:last-child{break-after:auto!important;page-break-after:auto!important}.rq2-letterpad{width:210mm!important;height:297mm!important}.rq2-table thead{display:table-header-group!important}.rq2-table tr,.rq2-summary-grid,.rq2-detail-section,.rq2-bank-inline,.rq2-closing-text,.rq2-signoff{break-inside:avoid!important;page-break-inside:avoid!important}}
`}</style>
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
