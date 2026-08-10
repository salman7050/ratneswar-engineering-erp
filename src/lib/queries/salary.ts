import "server-only";

import { prisma } from "@/lib/prisma";

export async function getSalarySlips(month?: number, year?: number) {
  const slips = await prisma.salarySlip.findMany({
    where: {
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { employee: { name: "asc" } }],
    include: {
      employee: { select: { id: true, employeeCode: true, name: true, designation: true } },
      approvedBy: { select: { name: true } },
    },
  });

  return slips.map((slip) => ({
    ...slip,
    otHours: Number(slip.otHours),
    otRate: Number(slip.otRate),
    advanceDeduction: Number(slip.advanceDeduction),
    grossPay: Number(slip.grossPay),
    pfEmployee: Number(slip.pfEmployee),
    pfEmployer: Number(slip.pfEmployer),
    professionalTax: Number(slip.professionalTax),
    netPay: Number(slip.netPay),
  }));
}

export async function getPayrollEmployees() {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: {
      id: true,
      employeeCode: true,
      name: true,
      designation: true,
      basic: true,
      hra: true,
      otherAllowance: true,
    },
    orderBy: { name: "asc" },
  });

  return employees.map((employee) => ({
    ...employee,
    basic: Number(employee.basic),
    hra: Number(employee.hra),
    otherAllowance: Number(employee.otherAllowance),
  }));
}

export type SalaryListItem = Awaited<ReturnType<typeof getSalarySlips>>[number];
export type PayrollEmployee = Awaited<ReturnType<typeof getPayrollEmployees>>[number];
