import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only allow same-app relative paths — blocks `//evil.com`, `https://evil.com`,
 * and `app.com.evil.com`-style redirects built by concatenating raw user input. */
function safeRedirect(path: string | null): string {
  if (!path) return "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return "/dashboard";
  }
  return path;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = safeRedirect(searchParams.get("redirectTo"));
  const isPasswordRecovery = redirectTo === "/reset-password";

  if (!code) {
    const target = isPasswordRecovery
      ? "/forgot-password?error=recovery_link_invalid"
      : "/login?error=auth_failed";
    return NextResponse.redirect(new URL(target, origin));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const target = isPasswordRecovery
      ? "/forgot-password?error=recovery_link_invalid"
      : "/login?error=auth_failed";
    return NextResponse.redirect(new URL(target, origin));
  }

  return NextResponse.redirect(new URL(redirectTo, origin));
}
