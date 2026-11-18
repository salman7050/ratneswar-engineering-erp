"use client";

import { amountInWords } from "@/lib/finance/gst";

type CompanyLike = {
  legalName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
};

const money = (value: number) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function humanDate(value: Date | string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

async function imageBytes(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load image: ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

function cleanLines(value?: string | null) {
  return (value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export async function createPurchaseOrderWord(po: Record<string, any>, company: CompanyLike): Promise<Blob> {
  const d: any = await import("docx");
  const logo = await imageBytes("/brand/ratneswar-logo-full.png").catch(() => null);
  const signature = po.includeSignature
    ? await imageBytes("/brand/ratneswar-authorised-signature.png").catch(() => null)
    : null;

  const border = { style: d.BorderStyle.SINGLE, size: 4, color: "222222" };
  const soft = "F4F6F8";
  const cell = (children: any[], width?: number, shading?: string) => new d.TableCell({
    width: width ? { size: width, type: d.WidthType.PERCENTAGE } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    shading: shading ? { fill: shading, type: d.ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 110, right: 110 },
    children,
  });
  const p = (text = "", opts: Record<string, any> = {}) => new d.Paragraph({
    spacing: { after: opts.after ?? 70, before: opts.before ?? 0, line: opts.line ?? 250 },
    alignment: opts.align ?? d.AlignmentType.LEFT,
    children: [new d.TextRun({
      text,
      bold: Boolean(opts.bold),
      size: opts.size ?? 18,
      color: opts.color ?? "111827",
      font: opts.font ?? "Arial",
    })],
  });

  const headerTable = new d.Table({
    width: { size: 100, type: d.WidthType.PERCENTAGE },
    borders: {
      top: { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: d.BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [new d.TableRow({
      children: [
        new d.TableCell({
          width: { size: 57, type: d.WidthType.PERCENTAGE },
          borders: {},
          children: [
            p(`GSTIN: ${company.gstin}`, { bold: true, size: 16, after: 20 }),
            p("ELECTRICAL, MECHANICAL, CIVIL & SOLAR CONTRACTOR", { bold: true, size: 14, color: "0756A0", after: 0 }),
          ],
        }),
        new d.TableCell({
          width: { size: 43, type: d.WidthType.PERCENTAGE },
          borders: {},
          verticalAlign: d.VerticalAlign.CENTER,
          children: [new d.Paragraph({
            alignment: d.AlignmentType.RIGHT,
            children: logo ? [new d.ImageRun({ type: "png", data: logo, transformation: { width: 240, height: 62 } })] : [new d.TextRun({ text: company.legalName, bold: true, size: 28, color: "0756A0" })],
          })],
        }),
      ],
    })],
  });

  const vendorLines = [
    new d.Paragraph({ children: [new d.TextRun({ text: "TO,", bold: true, size: 16 })], spacing: { after: 50 } }),
    new d.Paragraph({ children: [new d.TextRun({ text: `M/s. ${po.vendorName}`, bold: true, size: 19 })], spacing: { after: 50 } }),
    ...cleanLines(po.vendorAddress).map((line) => p(line, { size: 16, after: 15 })),
    ...(po.vendorPhone ? [p(`Tel: ${po.vendorPhone}`, { size: 16, after: 15 })] : []),
    ...(po.vendorEmail ? [p(`Email: ${po.vendorEmail}`, { size: 16, after: 15 })] : []),
    ...(po.vendorGstin ? [p(`GSTIN: ${po.vendorGstin}`, { size: 16, after: 15 })] : []),
  ];

  const metaPairs = [
    ["P.O. No.", po.poNo],
    ["P.O. Date", humanDate(po.date)],
    ["Project / Site", po.site?.name || po.projectName || "—"],
    ["Contact Person", po.deliveryContactPerson || po.raisedBy || "—"],
    ["Email ID", company.email],
    ["GST No.", company.gstin],
  ];
  const metaChildren = metaPairs.map(([label, value]) => new d.Paragraph({
    spacing: { after: 35 },
    children: [
      new d.TextRun({ text: `${label}: `, bold: true, size: 16 }),
      new d.TextRun({ text: String(value || "—"), size: 16 }),
    ],
  }));

  const partyTable = new d.Table({
    width: { size: 100, type: d.WidthType.PERCENTAGE },
    rows: [new d.TableRow({
      children: [
        cell(vendorLines, 52),
        cell(metaChildren, 48),
      ],
    })],
  });

  const itemHeader = new d.TableRow({
    tableHeader: true,
    children: [
      ["Sr. No.", 8], ["Material / Service Description", 42], ["HSN / SAC", 13],
      ["Qty", 8], ["UOM", 9], ["Unit Rate (INR)", 10], ["Amount (INR)", 10],
    ].map(([label, width]) => cell([p(String(label), { bold: true, size: 14, align: d.AlignmentType.CENTER, after: 0 })], Number(width), soft)),
  });
  const itemRows = (po.items || []).map((item: any, index: number) => {
    const taxable = Math.round(Number(item.quantity) * Number(item.rate) * 100) / 100;
    return new d.TableRow({
      children: [
        cell([p(String(index + 1), { size: 15, align: d.AlignmentType.CENTER, after: 0 })], 8),
        cell([p(item.description || "", { bold: true, size: 15, after: 0 })], 42),
        cell([p(item.hsnCode || "-", { size: 15, align: d.AlignmentType.CENTER, after: 0 })], 13),
        cell([p(String(Number(item.quantity || 0)), { size: 15, align: d.AlignmentType.CENTER, after: 0 })], 8),
        cell([p(item.unit || "Nos", { size: 15, align: d.AlignmentType.CENTER, after: 0 })], 9),
        cell([p(money(item.rate), { size: 15, align: d.AlignmentType.RIGHT, after: 0 })], 10),
        cell([p(money(taxable), { bold: true, size: 15, align: d.AlignmentType.RIGHT, after: 0 })], 10),
      ],
    });
  });
  const itemsTable = new d.Table({ width: { size: 100, type: d.WidthType.PERCENTAGE }, rows: [itemHeader, ...itemRows] });

  const summaryRows: any[] = [
    ["Taxable Amount", po.taxableValue],
    ...(po.gstType === "SGST_CGST" ? [["CGST", po.cgstAmount], ["SGST", po.sgstAmount]] : [["IGST", po.igstAmount]]),
    ...(Number(po.roundOff || 0) !== 0 ? [["Round Off", po.roundOff]] : []),
    ["Total Amount", po.grandTotal],
  ].map(([label, value], index, arr) => new d.TableRow({
    children: [
      cell([p(String(label), { bold: index === arr.length - 1, size: 15, after: 0 })], 65, index === arr.length - 1 ? soft : undefined),
      cell([p(`₹ ${money(Number(value))}`, { bold: true, size: 15, align: d.AlignmentType.RIGHT, after: 0 })], 35, index === arr.length - 1 ? soft : undefined),
    ],
  }));
  const summaryTable = new d.Table({ width: { size: 100, type: d.WidthType.PERCENTAGE }, rows: summaryRows });

  const terms = [
    ...cleanLines(po.terms),
    ...(po.deliverySchedule ? [`Delivery Schedule: ${po.deliverySchedule}`] : []),
    ...(po.packing ? [`Packing: ${po.packing}`] : []),
    ...(po.transportation ? [`Transportation: ${po.transportation}`] : []),
    ...(po.insurance ? [`Insurance: ${po.insurance}`] : []),
    ...(po.warranty ? [`Warranty: ${po.warranty}`] : []),
    ...(po.inspectionTerms ? [`Inspection: ${po.inspectionTerms}`] : []),
  ];

  const signChildren: any[] = [
    p(`For ${company.legalName.toUpperCase()}`, { bold: true, size: 16, align: d.AlignmentType.CENTER, after: 50 }),
  ];
  if (signature) {
    signChildren.push(new d.Paragraph({
      alignment: d.AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [new d.ImageRun({ type: "png", data: signature, transformation: { width: 170, height: 68 } })],
    }));
  } else {
    signChildren.push(p("", { after: 700 }));
  }
  signChildren.push(p("Authorised Signatory", { bold: true, size: 15, align: d.AlignmentType.CENTER, after: 0 }));

  const bottomTable = new d.Table({
    width: { size: 100, type: d.WidthType.PERCENTAGE },
    rows: [new d.TableRow({
      children: [
        cell([
          p("DELIVERY ADDRESS", { bold: true, size: 15, after: 50 }),
          p(company.legalName, { bold: true, size: 16, after: 30 }),
          ...cleanLines(po.deliveryAddress || company.address).map((line) => p(line, { size: 15, after: 15 })),
          p(`Email: ${company.email}`, { size: 15, after: 0 }),
        ], 58),
        cell(signChildren, 42),
      ],
    })],
  });

  const children: any[] = [
    headerTable,
    new d.Paragraph({ border: { bottom: { style: d.BorderStyle.SINGLE, size: 10, color: "0756A0" } }, spacing: { after: 130 } }),
    p("PURCHASE ORDER", { bold: true, size: 25, align: d.AlignmentType.CENTER, after: 130 }),
    partyTable,
  ];
  if (po.vendorContactPerson) children.push(p(`KIND ATTN.: ${po.vendorContactPerson}`, { bold: true, size: 16, color: "0756A0", before: 100, after: 80 }));
  children.push(
    new d.Paragraph({ spacing: { before: 80, after: 45 }, children: [new d.TextRun({ text: "Subject: ", bold: true, size: 16 }), new d.TextRun({ text: po.projectName || `Purchase Order for ${po.items?.[0]?.description || "required material / services"}`, bold: true, size: 16 })] }),
  );
  if (po.quotationRef) children.push(new d.Paragraph({ spacing: { after: 40 }, children: [new d.TextRun({ text: "Ref. No.: ", bold: true, size: 16 }), new d.TextRun({ text: po.quotationRef, size: 16 })] }));
  if (po.refNumber) children.push(new d.Paragraph({ spacing: { after: 40 }, children: [new d.TextRun({ text: "Other Ref.: ", bold: true, size: 16 }), new d.TextRun({ text: po.refNumber, size: 16 })] }));
  children.push(
    p("Dear Sir/Madam,", { bold: true, size: 16, before: 50, after: 40 }),
    p("With reference to your offer and our discussion, we are pleased to place this Purchase Order. Kindly arrange supply strictly as per the specifications, quantities, rates and commercial terms mentioned below.", { size: 16, after: 110 }),
    itemsTable,
    p(`Amount in Words: ${amountInWords(po.grandTotal)}`, { bold: true, size: 15, before: 50, after: 80 }),
    summaryTable,
  );
  if (terms.length) {
    children.push(p("TERMS & CONDITIONS", { bold: true, size: 16, before: 110, after: 40 }));
    terms.forEach((term, index) => children.push(new d.Paragraph({
      numbering: { reference: "terms", level: 0 },
      spacing: { after: 35 },
      children: [new d.TextRun({ text: term, size: 15 })],
    })));
  }
  if (po.specialInstructions) children.push(p(`Special Instruction: ${po.specialInstructions}`, { bold: true, size: 15, before: 80, after: 70 }));
  children.push(bottomTable);

  const doc = new d.Document({
    numbering: {
      config: [{
        reference: "terms",
        levels: [{ level: 0, format: d.LevelFormat.DECIMAL, text: "%1.", alignment: d.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 220 } } } }],
      }],
    },
    styles: { default: { document: { run: { font: "Arial", size: 18 }, paragraph: { spacing: { line: 250 } } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 500, right: 650, bottom: 650, left: 650 } } },
      footers: {
        default: new d.Footer({
          children: [new d.Paragraph({
            alignment: d.AlignmentType.CENTER,
            border: { top: { style: d.BorderStyle.SINGLE, size: 6, color: "0756A0" } },
            children: [new d.TextRun({ text: `${company.legalName} · ${company.address} · ${company.email}`, size: 12, color: "64748B" })],
          })],
        }),
      },
      children,
    }],
  });
  return d.Packer.toBlob(doc);
}

export async function createQuotationWord(quotation: Record<string, any>, company: CompanyLike): Promise<Blob> {
  const d: any = await import("docx");
  const logo = await imageBytes("/brand/ratneswar-logo-full.png").catch(() => null);
  const signature = quotation.includeSignature
    ? await imageBytes(quotation.signaturePreviewUrl || "/brand/ratneswar-authorised-signature.png").catch(() => null)
    : null;
  const border = { style: d.BorderStyle.SINGLE, size: 4, color: "222222" };
  const p = (text = "", opts: Record<string, any> = {}) => new d.Paragraph({
    spacing: { after: opts.after ?? 65, before: opts.before ?? 0, line: 250 },
    alignment: opts.align ?? d.AlignmentType.LEFT,
    children: [new d.TextRun({ text, bold: Boolean(opts.bold), size: opts.size ?? 17, color: opts.color ?? "111827", font: "Arial" })],
  });
  const cell = (children: any[], width?: number, shading?: string) => new d.TableCell({
    width: width ? { size: width, type: d.WidthType.PERCENTAGE } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    shading: shading ? { fill: shading, type: d.ShadingType.CLEAR } : undefined,
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    children,
  });

  const header = new d.Table({
    width: { size: 100, type: d.WidthType.PERCENTAGE },
    rows: [new d.TableRow({ children: [
      new d.TableCell({ width: { size: 56, type: d.WidthType.PERCENTAGE }, borders: {}, children: [
        p(`GSTIN: ${company.gstin}`, { bold: true, size: 15, after: 20 }),
        p("ELECTRICAL, MECHANICAL, CIVIL & SOLAR CONTRACTOR", { bold: true, size: 13, color: "0756A0", after: 0 }),
      ] }),
      new d.TableCell({ width: { size: 44, type: d.WidthType.PERCENTAGE }, borders: {}, children: [new d.Paragraph({
        alignment: d.AlignmentType.RIGHT,
        children: logo ? [new d.ImageRun({ type: "png", data: logo, transformation: { width: 240, height: 62 } })] : [new d.TextRun({ text: company.legalName, bold: true, size: 26 })],
      })] }),
    ] })],
  });

  const rows = [
    new d.TableRow({ tableHeader: true, children: [
      ["Sr.", 8], ["Description / Particulars", 44], ["HSN/SAC", 13], ["Qty", 9], ["Unit", 9], ["Rate (₹)", 9], ["Amount (₹)", 8],
    ].map(([label, width]) => cell([p(String(label), { bold: true, size: 13, align: d.AlignmentType.CENTER, after: 0 })], Number(width), "F4F6F8")) }),
    ...(quotation.items || []).map((item: any, index: number) => new d.TableRow({ children: [
      cell([p(String(index + 1), { size: 14, align: d.AlignmentType.CENTER, after: 0 })], 8),
      cell([p(item.description || "", { bold: true, size: 14, after: 0 })], 44),
      cell([p(item.hsnCode || "-", { size: 14, align: d.AlignmentType.CENTER, after: 0 })], 13),
      cell([p(String(item.calculationMode === "FIXED" ? 1 : Number(item.quantity || 0)), { size: 14, align: d.AlignmentType.CENTER, after: 0 })], 9),
      cell([p(item.calculationMode === "FIXED" ? (item.rateBasis || item.unit || "Job") : (item.unit || "Nos"), { size: 14, align: d.AlignmentType.CENTER, after: 0 })], 9),
      cell([p(money(item.calculationMode === "FIXED" ? item.amount : item.rate), { size: 14, align: d.AlignmentType.RIGHT, after: 0 })], 9),
      cell([p(money(item.amount), { bold: true, size: 14, align: d.AlignmentType.RIGHT, after: 0 })], 8),
    ] })),
  ];

  const cgst = quotation.gstType === "SGST_CGST" ? Number(quotation.taxAmount || 0) / 2 : 0;
  const sgst = quotation.gstType === "SGST_CGST" ? Number(quotation.taxAmount || 0) / 2 : 0;
  const totals = [
    ["Sub Total", quotation.taxableValue],
    ...(quotation.gstType === "SGST_CGST" ? [["CGST @ 9%", cgst], ["SGST @ 9%", sgst]] : [["IGST @ 18%", quotation.taxAmount]]),
    ["Grand Total", quotation.amount],
  ];
  const totalTable = new d.Table({
    width: { size: 55, type: d.WidthType.PERCENTAGE },
    alignment: d.AlignmentType.RIGHT,
    rows: totals.map(([label, value], index) => new d.TableRow({ children: [
      cell([p(String(label), { bold: index === totals.length - 1, size: 14, after: 0 })], 60, index === totals.length - 1 ? "F4F6F8" : undefined),
      cell([p(`₹ ${money(Number(value))}`, { bold: true, size: 14, align: d.AlignmentType.RIGHT, after: 0 })], 40, index === totals.length - 1 ? "F4F6F8" : undefined),
    ] })),
  });

  const children: any[] = [
    header,
    new d.Paragraph({ border: { bottom: { style: d.BorderStyle.SINGLE, size: 10, color: "0756A0" } }, spacing: { after: 120 } }),
    new d.Paragraph({ spacing: { after: 50 }, children: [new d.TextRun({ text: "Ref: ", size: 15 }), new d.TextRun({ text: quotation.referenceNo, bold: true, size: 15 }), new d.TextRun({ text: `    Date: ${humanDate(quotation.date)}`, bold: true, size: 15 })] }),
    p("To,", { size: 15, after: 20 }),
    ...(quotation.recipientDesignation ? [p(quotation.recipientDesignation, { bold: true, size: 15, after: 20 })] : []),
    ...(quotation.recipientDepartment ? [p(quotation.recipientDepartment, { bold: true, size: 15, after: 20 })] : []),
    p(quotation.client || "", { bold: true, size: 17, after: 20 }),
    ...cleanLines(quotation.clientAddress).map((line) => p(line, { size: 15, after: 15 })),
    new d.Paragraph({ spacing: { before: 70, after: 60 }, children: [new d.TextRun({ text: "Subject: ", bold: true, size: 16 }), new d.TextRun({ text: quotation.subject || "", bold: true, size: 16 })] }),
    p("Dear Sir,", { bold: true, size: 16, after: 35 }),
    p(quotation.introduction || `With reference to your requirement, we are pleased to submit our quotation for ${quotation.scope}.`, { size: 15, after: 100 }),
    p("PRICE SCHEDULE", { bold: true, size: 17, after: 50 }),
    new d.Table({ width: { size: 100, type: d.WidthType.PERCENTAGE }, rows }),
    p(`Grand Total in Words: ${amountInWords(quotation.amount)}`, { bold: true, size: 14, before: 60, after: 60 }),
    totalTable,
  ];
  const notes = cleanLines(quotation.notes);
  if (notes.length) {
    children.push(p("SCOPE / TECHNICAL NOTES", { bold: true, size: 16, before: 100, after: 40 }));
    notes.forEach((line) => children.push(p(`• ${line}`, { size: 14, after: 30 })));
  }
  const terms = cleanLines(quotation.terms);
  if (terms.length) {
    children.push(p("COMMERCIAL TERMS & CONDITIONS", { bold: true, size: 16, before: 100, after: 40 }));
    terms.forEach((line, index) => children.push(p(`${index + 1}. ${line}`, { size: 14, after: 30 })));
  }
  children.push(p("Thanking you,", { bold: true, size: 15, before: 100, after: 25 }), p("Yours faithfully,", { bold: true, size: 15, after: 25 }), p(`For ${company.legalName}`, { bold: true, size: 15, after: 30 }));
  if (signature) children.push(new d.Paragraph({ children: [new d.ImageRun({ type: "png", data: signature, transformation: { width: 190, height: 76 } })], spacing: { after: 20 } }));

  const doc = new d.Document({
    styles: { default: { document: { run: { font: "Arial", size: 17 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 500, right: 650, bottom: 650, left: 650 } } },
      footers: { default: new d.Footer({ children: [new d.Paragraph({ alignment: d.AlignmentType.CENTER, border: { top: { style: d.BorderStyle.SINGLE, size: 6, color: "0756A0" } }, children: [new d.TextRun({ text: `${company.legalName} · ${company.address} · ${company.email}`, size: 12, color: "64748B" })] })] }) },
      children,
    }],
  });
  return d.Packer.toBlob(doc);
}
