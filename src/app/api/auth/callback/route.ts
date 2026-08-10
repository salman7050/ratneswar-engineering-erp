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

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
