import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function normalizePostgresConnectionString(raw: string): string {
  const match = raw.match(/^(postgres(?:ql)?:\/\/)(.*)$/i);
  if (!match) return raw;

  const scheme = match[1];
  const rest = match[2];
  const separator = rest.lastIndexOf("@");
  if (separator < 0) return raw;

  const credentials = rest.slice(0, separator);
  const destination = rest.slice(separator + 1);
  const colon = credentials.indexOf(":");
  if (colon < 0) return raw;

  const usernameRaw = credentials.slice(0, colon);
  const passwordRaw = credentials.slice(colon + 1);

  const canonicalize = (value: string) => {
    try {
      return encodeURIComponent(decodeURIComponent(value));
    } catch {
      return encodeURIComponent(value);
    }
  };

  return `${scheme}${canonicalize(usernameRaw)}:${canonicalize(passwordRaw)}@${destination}`;
}

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error("DATABASE_URL is required");
}

const connectionString = normalizePostgresConnectionString(rawConnectionString);

const adapter = new PrismaPg({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 10_000,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
