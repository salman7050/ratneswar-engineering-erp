import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function safeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { name: "UnknownError", code: "unknown", message: String(error).slice(0, 600) };
  }

  const candidate = error as { name?: string; code?: string; message?: string };
  const message = (candidate.message ?? "Unknown error")
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, "[DATABASE_URL_REDACTED]")
    .replace(/(password|apikey|api_key|token)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .slice(0, 600);

  return {
    name: candidate.name ?? "Error",
    code: candidate.code ?? "unknown",
    message,
  };
}

export async function GET() {
  const result: Record<string, unknown> = {
    ok: false,
    environment: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    auth: { ok: false },
    database: { ok: false },
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      result.auth = { ok: false, error: safeError(error) };
      return NextResponse.json(result, { status: 503 });
    }

    if (!data.user) {
      result.auth = { ok: false, error: { code: "NO_SESSION", message: "No authenticated Supabase session." } };
      return NextResponse.json(result, { status: 401 });
    }

    result.auth = { ok: true, userIdPresent: true };
  } catch (error) {
    result.auth = { ok: false, error: safeError(error) };
    return NextResponse.json(result, { status: 503 });
  }

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    result.database = { ok: true };
    result.ok = true;
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    result.database = { ok: false, error: safeError(error) };
    return NextResponse.json(result, { status: 503 });
  }
}
