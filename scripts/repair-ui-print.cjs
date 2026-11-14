const fs = require('fs');
const path = require('path');

const root = process.cwd();
const cssPath = path.join(root, 'src', 'app', 'globals.css');
if (!fs.existsSync(cssPath)) {
  console.error('[repair] src/app/globals.css not found. Run this from the ERP project root.');
  process.exit(1);
}

let css = fs.readFileSync(cssPath, 'utf8');
const before = css;
const marker = '/* ═════════════ V9 deterministic print pipeline';
const markerIndex = css.indexOf(marker);
if (markerIndex >= 0) {
  css = css.slice(0, markerIndex).trimEnd() + '\n';
  console.log('[repair] Removed the old V9 DOM-moving print CSS block.');
} else {
  console.log('[repair] Old V9 print CSS block was not present.');
}

const required = ['@tailwind base;', '@tailwind components;', '@tailwind utilities;'];
for (const directive of required) {
  if (!css.includes(directive)) {
    console.error(`[repair] Missing Tailwind directive: ${directive}`);
    process.exit(1);
  }
}

if (css !== before) fs.writeFileSync(cssPath, css, 'utf8');

// Give Analytics a stable print target class without replacing the whole component file.
const analyticsPath = path.join(root, 'src', 'components', 'analytics', 'analytics-client.tsx');
if (fs.existsSync(analyticsPath)) {
  let analytics = fs.readFileSync(analyticsPath, 'utf8');
  const oldClass = 'id="print-doc" className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8"';
  const newClass = 'id="print-doc" className="analytics-print-report mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8"';
  if (analytics.includes(oldClass)) {
    analytics = analytics.replace(oldClass, newClass);
    fs.writeFileSync(analyticsPath, analytics, 'utf8');
    console.log('[repair] Added analytics-print-report class.');
  }
}

const printButtonPath = path.join(root, 'src', 'components', 'finance', 'share-buttons.tsx');
if (!fs.existsSync(printButtonPath)) {
  console.error('[repair] share-buttons.tsx not found.');
  process.exit(1);
}
const printSource = fs.readFileSync(printButtonPath, 'utf8');
if (!printSource.includes('document.createElement("iframe")')) {
  console.error('[repair] Isolated iframe print engine is not installed.');
  process.exit(1);
}
if (printSource.includes('appendChild(printRoot)') || printSource.includes('print-document-active')) {
  console.error('[repair] Unsafe DOM-moving print code is still present.');
  process.exit(1);
}

const srcRoot = path.join(root, 'src');
const printDocs = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      if (text.includes('id="print-doc"')) printDocs.push(path.relative(root, full));
    }
  }
}
walk(srcRoot);
console.log(`[repair] Found ${printDocs.length} standardized print document roots:`);
for (const file of printDocs) console.log(`         - ${file}`);
console.log('[repair] UI + print source checks passed.');
