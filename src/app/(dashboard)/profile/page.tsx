import { ProfileForm } from "@/components/profile/profile-form";
import { Eyebrow, H1, Muted } from "@/components/ui/typography";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Profile · Ratneswar ERP" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } });

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-6 md:px-8">
      <div><Eyebrow className="text-brand-gold-light/80">Account</Eyebrow><H1 className="text-2xl md:text-3xl">My Profile</H1><Muted className="mt-1">Manage your personal details and password.</Muted></div>
      <ProfileForm user={user} phone={profile?.phone ?? null} />
    </div>
  );
}
