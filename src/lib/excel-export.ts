"use client";

import * as XLSX from "xlsx";

export interface ExcelSheet {
  name: string;
  rows: Record<string, string | number>[];
}

/** Builds a real .xlsx workbook from one or more sheets and triggers a browser download. */
export function exportToExcel(filename: string, sheets: ExcelSheet[]) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)); // Excel sheet-name limit
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
