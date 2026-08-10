"use client";

import { Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/excel-export";
import type { AnalyticsData } from "@/lib/queries/analytics";

export function ExportButtons({ data }: { data: AnalyticsData }) {
  function handleExcelExport() {
    exportToExcel(`Ratneswar-Analytics-${new Date().toISOString().slice(0, 10)}`, [
      { name: "Revenue Trend", rows: data.revenue.trend.map((r) => ({ Month: r.month, "Revenue (₹)": r.value })) },
      { name: "Revenue by Site", rows: data.revenue.bySite.map((r) => ({ Site: r.name, "Revenue (₹)": r.value })) },
      { name: "Revenue by Client", rows: data.revenue.byClient.map((r) => ({ Client: r.name, "Revenue (₹)": r.value })) },
      { name: "Expense Trend", rows: data.expenses.trend.map((r) => ({ Month: r.month, "Expense (₹)": r.value })) },
      { name: "Expense by Category", rows: data.expenses.byCategory.map((r) => ({ Category: r.name, "Amount (₹)": r.value })) },
      { name: "Expense by Site", rows: data.expenses.bySite.map((r) => ({ Site: r.name, "Amount (₹)": r.value })) },
      { name: "Profit Trend", rows: data.profit.trend.map((r) => ({ Month: r.month, "Profit (₹)": r.value })) },
      { name: "Cash Flow Trend", rows: data.cashFlow.trend.map((r) => ({ Month: r.month, "Net Cash Flow (₹)": r.value })) },
      { name: "Employees by Site", rows: data.employees.headcountBySite.map((r) => ({ Site: r.name, Headcount: r.value })) },
      { name: "Salary Cost Trend", rows: data.employees.salaryCostTrend.map((r) => ({ Month: r.month, "Net Payroll (₹)": r.value })) },
      { name: "Sites by Status", rows: data.sites.byStatus.map((r) => ({ Status: r.name, Count: r.value })) },
      { name: "Sites by Type", rows: data.sites.byType.map((r) => ({ Type: r.name, Count: r.value })) },
      { name: "Invoices by Status", rows: data.invoices.byStatus.map((r) => ({ Status: r.name, Count: r.value })) },
      { name: "Tenders by Status", rows: data.tenders.byStatus.map((r) => ({ Status: r.name, Count: r.value })) },
      {
        name: "Summary",
        rows: [
          { Metric: "Total Revenue", Value: data.revenue.total },
          { Metric: "Total Expenses", Value: data.expenses.total },
          { Metric: "Total Profit", Value: data.profit.total },
          { Metric: "Profit Margin %", Value: data.profit.marginPct },
          { Metric: "Outstanding Invoices (₹)", Value: data.invoices.totalOutstanding },
          { Metric: "Average Invoice Value (₹)", Value: data.invoices.avgInvoiceValue },
          { Metric: "Active Employees", Value: data.employees.activeCount },
          { Metric: "Monthly Payroll (₹)", Value: data.employees.monthlyPayroll },
          { Metric: "Total Sites", Value: data.sites.total },
          { Metric: "Tender Win Rate %", Value: data.tenders.winRate },
          { Metric: "Tender Pipeline Value (₹)", Value: data.tenders.pipelineValue },
        ],
      },
    ]);
  }

  return (
    <div className="no-print flex gap-2">
      <Button variant="glass" onClick={handleExcelExport}>
        <FileSpreadsheet className="h-4 w-4" /> Export Excel
      </Button>
      <Button variant="gold" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Export PDF
      </Button>
    </div>
  );
}
