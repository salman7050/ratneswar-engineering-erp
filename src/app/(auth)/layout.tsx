import { COMPANY } from "@/config/nav";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, hsl(var(--accent) / 0.14), transparent 40%), radial-gradient(circle at 85% 80%, hsl(var(--info) / 0.1), transparent 45%)",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            System Online
          </span>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-gold-light/80">
            {COMPANY.tagline}
          </p>
          <h1 className="text-2xl font-bold text-foreground">{COMPANY.name}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
