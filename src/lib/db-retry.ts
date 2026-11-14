import "server-only";

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);
const RETRYABLE_MESSAGES = [
  "can't reach database server",
  "server has closed the connection",
  "timed out fetching a new connection",
  "connection pool",
  "connection terminated",
  "connection reset",
];

function retryable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code && RETRYABLE_CODES.has(candidate.code)) return true;
  const message = candidate.message?.toLowerCase() ?? "";
  return RETRYABLE_MESSAGES.some((part) => message.includes(part));
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function safeDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { name: "UnknownError", code: "unknown", message: String(error) };
  }

  const candidate = error as { name?: string; code?: string; message?: string };
  const message = (candidate.message ?? "Unknown database error")
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, "[DATABASE_URL_REDACTED]")
    .replace(/password\s*[:=]\s*[^\s,;]+/gi, "password=[REDACTED]")
    .slice(0, 700);

  return {
    name: candidate.name ?? "Error",
    code: candidate.code ?? "unknown",
    message,
  };
}

/** Retries short-lived Supabase/Supavisor failures without hiding real query errors. */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  label: string,
  attempts = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const safe = safeDatabaseError(error);

      if (!retryable(error) || attempt === attempts) {
        console.error(`[database:${label}] failed`, safe);
        throw error;
      }

      console.warn(
        `[database:${label}] retry ${attempt}/${attempts - 1}`,
        { code: safe.code, name: safe.name }
      );
      await wait(attempt * 180);
    }
  }

  throw lastError;
}
