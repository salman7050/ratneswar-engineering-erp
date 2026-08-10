#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");
const { execFileSync } = require("node:child_process");
let ts;
try {
  ts = require("typescript");
} catch {
  const globalRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
  ts = require(path.join(globalRoot, "typescript"));
}

const root = process.cwd();
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`ERROR: ${message}`);
}

function walk(directory, predicate = () => true) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full, predicate) : predicate(full) ? [full] : [];
  });
}

const sourceFiles = walk(path.join(root, "src"), (file) => /\.(ts|tsx)$/.test(file));
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      isolatedModules: true,
    },
  });
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    const location = diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : null;
    fail(`${path.relative(root, file)}${location ? `:${location.line + 1}:${location.character + 1}` : ""} — ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`);
  }
}

const localImport = /(?:from\s+|import\s*\()(["'])(@\/[^"']+|\.[^"']+)\1/g;
const extensions = [".ts", ".tsx", ".js", ".jsx", ".json"];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(localImport)) {
    const specifier = match[2];
    const base = specifier.startsWith("@/")
      ? path.join(root, "src", specifier.slice(2))
      : path.resolve(path.dirname(file), specifier);
    const candidates = path.extname(base)
      ? [base]
      : [
          ...extensions.map((extension) => `${base}${extension}`),
          ...extensions.map((extension) => path.join(base, `index${extension}`)),
        ];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      fail(`${path.relative(root, file)} imports missing local module ${specifier}`);
    }
  }
}

const appDir = path.join(root, "src", "app");
const routePages = walk(appDir, (file) => file.endsWith(`${path.sep}page.tsx`));
const routePatterns = routePages.map((file) => {
  let route = path.relative(appDir, path.dirname(file)).split(path.sep)
    .filter((part) => !/^\(.+\)$/.test(part))
    .join("/");
  route = `/${route}`.replace(/\/$/, "") || "/";
  const regex = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[\.\.\.([^\]]+)\\\]/g, ".+")
    .replace(/\\\[([^\]]+)\\\]/g, "[^/]+");
  return new RegExp(`^${regex}$`);
});

const hrefRegex = /(?:href|router\.(?:push|replace)|revalidatePath)\s*\(?\s*[`"'](\/[A-Za-z0-9_\-\/[\].${}]+)[`"']/g;
const allowedNonPagePrefixes = ["/api/", "/_next/", "/manifest", "/sw.js"];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(hrefRegex)) {
    const raw = match[1];
    if (raw.includes("${")) continue;
    const pathname = raw.split("?")[0].replace(/\/$/, "") || "/";
    if (allowedNonPagePrefixes.some((prefix) => pathname.startsWith(prefix))) continue;
    if (!routePatterns.some((pattern) => pattern.test(pathname))) {
      fail(`${path.relative(root, file)} references route with no page: ${pathname}`);
    }
  }
}

const forbiddenDashboardRoutes = /\/dashboard\/(employees|sites|tenders|invoices|quotations|purchase-orders|work-orders|inventory)(?:\/|[`"'])/;
for (const file of sourceFiles) {
  if (forbiddenDashboardRoutes.test(fs.readFileSync(file, "utf8"))) {
    fail(`${path.relative(root, file)} contains a stale /dashboard/... module route`);
  }
}

const schema = fs.readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8");
const migrationFiles = walk(path.join(root, "prisma", "migrations"), (file) => file.endsWith(`${path.sep}migration.sql`));
if (!migrationFiles.length) {
  fail("Prisma migrations are missing");
} else {
  const migration = migrationFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
  const modelCount = [...schema.matchAll(/^model\s+\w+\s*\{/gm)].length;
  const tableCount = [...migration.matchAll(/^CREATE TABLE\s+/gm)].length;
  const enumCount = [...schema.matchAll(/^enum\s+\w+\s*\{/gm)].length;
  const typeCount = [...migration.matchAll(/^CREATE TYPE\s+/gm)].length;
  if (modelCount !== tableCount) fail(`Migrations have ${tableCount} tables but schema has ${modelCount} models`);
  if (enumCount !== typeCount) fail(`Migrations have ${typeCount} enum types but schema has ${enumCount} enums`);
  if (/,[\s\n]*\);/m.test(migration)) fail("A migration contains a trailing comma before a closing table parenthesis");
}

if (failures) {
  console.error(`\nValidation failed with ${failures} problem(s).`);
  process.exit(1);
}
console.log(`Validated ${sourceFiles.length} TypeScript files, ${routePages.length} pages, local imports and all committed Prisma migrations.`);
