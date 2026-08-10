import { UsersClient } from "@/components/users/users-client";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { requirePermission } from "@/lib/auth";
import { getUsers } from "@/lib/queries/users";

export const metadata = { title: "Access Control · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePermission("users", "view");
  const users = await getUsers();

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8">
      <div>
        <Eyebrow className="text-brand-gold-light/80">Administration</Eyebrow>
        <H1 className="text-2xl md:text-3xl">Access Control</H1>
        <Muted className="mt-1">Keep only the Admin account and Owner account that need ERP access. Employee records and employee logins are not part of this workflow.</Muted>
      </div>
      <UsersClient users={users} />
    </div>
  );
}
