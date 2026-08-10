import { requireUser } from "@/lib/auth";
import { UserProvider } from "@/components/providers/supabase-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCompanySettings } from "@/lib/queries/finance-settings";
import { CloudSyncRefresh } from "@/components/providers/cloud-sync-refresh";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already redirects signed-out visitors to /login; this is
  // the server-side belt-and-braces check that also resolves the app
  // user's role for RBAC-aware rendering (sidebar, permission hooks, etc).
  const [user, company] = await Promise.all([requireUser(), getCompanySettings()]);

  return (
    <UserProvider user={user}>
      <CloudSyncRefresh />
      <DashboardShell brand={{ name: company.tradeName || company.legalName, tagline: company.tagline, logoUrl: company.logoUrl }}>{children}</DashboardShell>
    </UserProvider>
  );
}
