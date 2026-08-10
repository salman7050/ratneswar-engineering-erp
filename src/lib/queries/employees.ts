import "server-only";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrls } from "@/lib/supabase/storage-server";

export async function getEmployees() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    include: {
      site: { select: { name: true } },
      _count: { select: { leaves: true, reviews: true } },
    },
  });
  return employees.map((e) => ({
    ...e,
    basic: Number(e.basic),
    hra: Number(e.hra),
    otherAllowance: Number(e.otherAllowance),
  }));
}

export async function getEmployeeDetail(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true } },
      salarySlips: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 24 },
      attendance: { orderBy: { date: "desc" }, take: 60, include: { site: { select: { name: true } } } },
      leaves: { orderBy: { appliedAt: "desc" } },
      promotions: { orderBy: { effectiveDate: "desc" } },
      increments: { orderBy: { effectiveDate: "desc" } },
      reviews: { orderBy: { reviewDate: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!employee) return null;

  const documents = await resolveStoredFileUrls(employee.documents);

  // Decimal → number for the Server → Client Component boundary
  return {
    ...employee,
    basic: Number(employee.basic),
    hra: Number(employee.hra),
    otherAllowance: Number(employee.otherAllowance),
    documents,
    salarySlips: employee.salarySlips.map((s) => ({
      ...s,
      otHours: Number(s.otHours),
      otRate: Number(s.otRate),
      advanceDeduction: Number(s.advanceDeduction),
      grossPay: Number(s.grossPay),
      pfEmployee: Number(s.pfEmployee),
      pfEmployer: Number(s.pfEmployer),
      professionalTax: Number(s.professionalTax),
      netPay: Number(s.netPay),
    })),
    leaves: employee.leaves.map((l) => ({ ...l, days: Number(l.days) })),
    promotions: employee.promotions,
    increments: employee.increments.map((i) => ({
      ...i,
      previousBasic: Number(i.previousBasic),
      newBasic: Number(i.newBasic),
    })),
    reviews: employee.reviews,
  };
}

export async function getSitesForAssignment() {
  return prisma.site.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
}

export type EmployeeDetail = NonNullable<Awaited<ReturnType<typeof getEmployeeDetail>>>;
export type EmployeeListItem = Awaited<ReturnType<typeof getEmployees>>[number];
