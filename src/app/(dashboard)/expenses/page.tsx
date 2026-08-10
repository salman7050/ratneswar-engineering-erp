import { ExpensesClient } from "@/components/expenses/expenses-client";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { getExpenses, getExpenseSites, getExpenseVendors, getExpensePurchaseOrders, getSalaryCostEntries } from "@/lib/queries/expenses";

export const metadata = { title: "Expenses & Payments · Ratneswar ERP" };
export const dynamic = "force-dynamic";

function safeDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}
function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function ExpensesPage({ searchParams }: { searchParams?: { from?: string; to?: string } }) {
  const user = await requirePermission("expenses", "view");
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const from = safeDate(searchParams?.from, defaultFrom);
  const toInput = safeDate(searchParams?.to, defaultTo);
  const to = new Date(toInput.getFullYear(), toInput.getMonth(), toInput.getDate(), 23, 59, 59, 999);

  const [expenses, salaryCosts, sites, vendors, purchaseOrders] = await Promise.all([
    getExpenses({ from, to }),
    getSalaryCostEntries({ from, to }),
    getExpenseSites(),
    getExpenseVendors(),
    getExpensePurchaseOrders(),
  ]);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 md:px-8">
      <div>
        <Eyebrow className="text-blue-600">Company financial control</Eyebrow>
        <H1 className="text-2xl md:text-3xl">Expenses & Payments</H1>
        <Muted className="mt-1">Field expenses, direct bank payments, PO payments, cash labour, Ratneswar Solar and salary distribution — one controlled ledger.</Muted>
      </div>
      <ExpensesClient
        expenses={expenses}
        salaryCosts={salaryCosts}
        sites={sites}
        vendors={vendors}
        purchaseOrders={purchaseOrders}
        canCreate={can(user.role, "expenses", "create")}
        canDelete={can(user.role, "expenses", "delete")}
        fromDate={isoDate(from)}
        toDate={isoDate(toInput)}
      />
    </div>
  );
}
