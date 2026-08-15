"use client";

import * as XLSX from "xlsx";

export interface ParsedSalaryDistribution {
  label: string;
  type: "EMPLOYEE_SALARY" | "CASH_LABOUR" | "OTHER";
  grossAmount: number;
  netPaid: number;
  isCash: boolean;
  siteHint: string | null;
}

export interface ParsedSalaryWorkbook {
  periodKey: string;
  month: number;
  year: number;
  title: string;
  employeeGross: number;
  bankPayable: number;
  cashLabour: number;
  cashLabourGross: number;
  totalManpowerCost: number;
  pfEmployee: number;
  pfEmployer: number;
  professionalTax: number;
  advanceRecovery: number;
  distributions: ParsedSalaryDistribution[];
  sourceSheet: string;
}

const MONTH_INDEX: Record<string, number> = {
  JAN: 1, JANUARY: 1, FEB: 2, FEBRUARY: 2, MAR: 3, MARCH: 3, APR: 4, APRIL: 4,
  MAY: 5, JUN: 6, JUNE: 6, JUL: 7, JULY: 7, AUG: 8, AUGUST: 8, SEP: 9, SEPT: 9,
  SEPTEMBER: 9, OCT: 10, OCTOBER: 10, NOV: 11, NOVEMBER: 11, DEC: 12, DECEMBER: 12,
};

function amount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value * 100) / 100;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[₹,\s]/g, ""));
    return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
  }
  return 0;
}

function periodFromText(text: string) {
  const upper = text.toUpperCase().replace(/[_.]/g, " ");
  const monthToken = Object.keys(MONTH_INDEX).sort((a, b) => b.length - a.length).find((m) => new RegExp(`\\b${m}\\b`).test(upper));
  const yearMatch = upper.match(/\b(20\d{2})\b/);
  if (!monthToken || !yearMatch) return null;
  const month = MONTH_INDEX[monthToken];
  const yearText = yearMatch[1];
  if (!month || !yearText) return null;
  return { month, year: Number(yearText) };
}

function normalizeSection(raw: string): { label: string; type: ParsedSalaryDistribution["type"]; isCash: boolean; siteHint: string | null } {
  const u = raw.toUpperCase().replace(/\s+/g, " ").trim();
  if (u.includes("RATTILAL")) return { label: "Rattilal Labour", type: "CASH_LABOUR", isCash: true, siteHint: null };
  if (u.includes("GOKUL")) return { label: "Gokul Solar O&M – 2.9 MW", type: "EMPLOYEE_SALARY", isCash: false, siteHint: "GOKUL" };
  if (u.includes("SMALL HYDRO") || u.includes("SHPP-1") || u.includes("SHP-1")) return { label: "SHPP-1", type: "EMPLOYEE_SALARY", isCash: false, siteHint: "SHPP-1" };
  if (u.includes("PUMPING") && u.includes("PS-2")) return { label: "PS-2 PH-2", type: "EMPLOYEE_SALARY", isCash: false, siteHint: "PS-2 PH-2" };
  if ((u.includes("SUBSTATION") || u.includes("220/11") || u.includes("220 KV")) && u.includes("PS-2")) return { label: "PS-2 SS", type: "EMPLOYEE_SALARY", isCash: false, siteHint: "PS-2 SS" };
  if (u.includes("PUMPING") && u.includes("PS-3")) return { label: "PS-3 PH-2", type: "EMPLOYEE_SALARY", isCash: false, siteHint: "PS-3 PH-2" };
  if ((u.includes("SUBSTATION") || u.includes("220/11") || u.includes("220 KV")) && u.includes("PS-3")) return { label: "PS-3 SS", type: "EMPLOYEE_SALARY", isCash: false, siteHint: "PS-3 SS" };
  if (u.includes("SWEEPER")) return { label: "Sweepers / Support", type: "OTHER", isCash: false, siteHint: null };
  if (u.includes("SUPERVISOR") || u.includes("ADMIN")) return { label: "Supervisors / Admin", type: "OTHER", isCash: false, siteHint: null };
  const cleaned = raw.replace(/^\s*\d+[.)-]?\s*/, "").replace(/SITE\s*TOTAL.*$/i, "").trim();
  return { label: cleaned || "Other Salary", type: "OTHER", isCash: false, siteHint: null };
}

export async function parseSalaryWorkbook(file: File): Promise<ParsedSalaryWorkbook> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const salarySheet = workbook.SheetNames.find((name) => /SALARY/i.test(name) && !/BANK|RULE/i.test(name)) ?? workbook.SheetNames[0];
  if (!salarySheet) throw new Error("No worksheet found in this Excel file.");
  const sheet = workbook.Sheets[salarySheet];
  if (!sheet) throw new Error("The selected salary worksheet could not be read.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });

  const sampleText = [salarySheet, ...rows.slice(0, 12).flat().filter((v) => typeof v === "string")].join(" ");
  const period = periodFromText(sampleText);
  if (!period) throw new Error("Could not detect salary month/year. Keep month and year in the salary sheet name/header, e.g. SALARY JUNE-2026.");

  const distributions: ParsedSalaryDistribution[] = [];
  let currentSection = "";
  let pfEmployee = 0, pfEmployer = 0, professionalTax = 0, advanceRecovery = 0;

  for (const row of rows) {
    const first = String(row?.[0] ?? "").trim();
    const rowText = row.map((v) => (v == null ? "" : String(v))).join(" ").replace(/\s+/g, " ").trim();
    if (!rowText) continue;

    if (/^\s*\d+[.)-]?\s+/.test(first) && !/SITE\s*TOTAL/i.test(rowText)) currentSection = first;
    if (!/SITE\s*TOTAL/i.test(rowText)) continue;

    const section = normalizeSection(`${currentSection} ${rowText}`);
    const grossAmount = amount(row[10]); // Column K — Total Earnings / Gross for the section
    const netPaid = amount(row[19]);     // Column T — Net Paid for the section
    const item: ParsedSalaryDistribution = { ...section, grossAmount, netPaid };
    distributions.push(item);

    // Statutory/advance values are section-total columns in the user's existing monthly format.
    pfEmployee += amount(row[11]);
    pfEmployer += amount(row[12]);
    professionalTax += amount(row[13]);
    advanceRecovery += amount(row[17]);
  }

  if (!distributions.length) throw new Error("Could not find SITE TOTAL rows in the salary workbook. Use the same monthly salary format as June 2026.");

  const cashRows = distributions.filter((d) => d.type === "CASH_LABOUR");
  const employeeRows = distributions.filter((d) => d.type !== "CASH_LABOUR");
  const employeeGross = employeeRows.reduce((sum, d) => sum + d.grossAmount, 0);
  const bankPayable = employeeRows.reduce((sum, d) => sum + d.netPaid, 0);
  const cashLabour = cashRows.reduce((sum, d) => sum + d.netPaid, 0);
  const cashLabourGross = cashRows.reduce((sum, d) => sum + d.grossAmount, 0);

  return {
    periodKey: `${period.year}-${String(period.month).padStart(2, "0")}`,
    month: period.month,
    year: period.year,
    title: `Salary ${salarySheet.replace(/^.*SALARY\s*/i, "").trim() || `${period.month}-${period.year}`}`,
    employeeGross: Math.round(employeeGross * 100) / 100,
    bankPayable: Math.round(bankPayable * 100) / 100,
    cashLabour: Math.round(cashLabour * 100) / 100,
    cashLabourGross: Math.round(cashLabourGross * 100) / 100,
    totalManpowerCost: Math.round((employeeGross + cashLabourGross) * 100) / 100,
    pfEmployee: Math.round(pfEmployee * 100) / 100,
    pfEmployer: Math.round(pfEmployer * 100) / 100,
    professionalTax: Math.round(professionalTax * 100) / 100,
    advanceRecovery: Math.round(advanceRecovery * 100) / 100,
    distributions,
    sourceSheet: salarySheet,
  };
}

export async function parseBankBulkTotal(file: File): Promise<number> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  let best = 0;
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
    for (let r = 0; r < Math.min(rows.length, 25); r++) {
      const row = rows[r];
      if (!row) continue;
      const header = row.map((v) => String(v ?? "").toUpperCase().trim());
      const amountCol = header.findIndex((v) => v === "AMOUNT" || v.includes("TRANSFER AMOUNT") || v.includes("SALARY AMOUNT"));
      if (amountCol < 0) continue;
      let total = 0;
      for (let i = r + 1; i < rows.length; i++) total += amount(rows[i]?.[amountCol]);
      best = Math.max(best, Math.round(total * 100) / 100);
    }
  }
  if (best <= 0) throw new Error("Could not find the Amount column in the bank bulk Excel file.");
  return best;
}
