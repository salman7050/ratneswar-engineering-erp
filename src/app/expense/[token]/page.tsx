import { PublicExpenseForm } from "@/components/expenses/public-expense-form";
import { getPublicExpensePortal } from "@/lib/queries/expense-portal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expense Submission · Ratneswar Engineering" };

export default async function ExpenseLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await getPublicExpensePortal(token);

  if (!portal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Ratneswar Engineering</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Expense link unavailable</h1>
          <p className="mt-3 text-sm text-slate-500">This link is invalid, expired, or has been revoked by Admin. Please contact the office for a new link.</p>
        </div>
      </div>
    );
  }

  return <PublicExpenseForm token={token} member={portal.member} sites={portal.sites} summary={portal.summary} />;
}
