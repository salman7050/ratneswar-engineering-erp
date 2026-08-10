$ErrorActionPreference = 'Stop'

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "RATNESWAR ERP - NETLIFY FIX 2 + GITHUB PUSH" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$defaultRoot = 'C:\RatneswarERP\ratneswar-engineering-erp-cloud-v8'
$root = (Get-Location).Path
if (-not (Test-Path (Join-Path $root 'package.json'))) {
  if (Test-Path (Join-Path $defaultRoot 'package.json')) {
    $root = $defaultRoot
  } else {
    throw "Project folder not found. Put these fix files inside the Cloud V8 project folder and run again."
  }
}
Set-Location $root
Write-Host "Project: $root" -ForegroundColor DarkGray

$siteFile = Join-Path $root 'src\lib\queries\sites.ts'
$poFile   = Join-Path $root 'src\lib\actions\purchase-order-actions.ts'
if (-not (Test-Path $siteFile)) { throw "Missing $siteFile" }
if (-not (Test-Path $poFile)) { throw "Missing $poFile" }

Write-Host "[1/5] Verifying fixes are present..." -ForegroundColor Yellow
$site = [IO.File]::ReadAllText($siteFile)
$po   = [IO.File]::ReadAllText($poFile)

# Idempotently add SiteDetail _count if still missing.
$siteCountLine = '      _count: { select: { employees: true, tenders: true, invoices: true, assets: true, billingContracts: true } },'
$detailAnchorPattern = '(clientAccount:\s*true,\r?\n\s*subcontractor:\s*true,)(\r?\n\s*billingContracts:)'
if ($site -notmatch 'clientAccount:\s*true,\r?\n\s*subcontractor:\s*true,\r?\n\s*_count:') {
  if ($site -notmatch $detailAnchorPattern) { throw 'Could not locate getSiteDetail include block safely.' }
  $site = [regex]::Replace($site, $detailAnchorPattern, ('$1' + "`r`n" + $siteCountLine + '$2'), 1)
  Write-Host "  Added SiteDetail _count." -ForegroundColor Green
} else {
  Write-Host "  SiteDetail _count already present." -ForegroundColor Green
}

# Idempotently fix Prisma JSON metadata typing.
if ($po -notmatch 'import type \{ Prisma \} from "@prisma/client";') {
  $po = $po -replace 'import \{ z \} from "zod";', "import { z } from `"zod`";`r`nimport type { Prisma } from `"@prisma/client`";"
}
$oldLogPattern = 'async function logActivity\(action: string, poId: string, userId: string, metadata\?: Record<string, unknown>\) \{\s*await prisma\.auditLog\.create\(\{ data: \{ action, entityType: "PurchaseOrder", entityId: poId, userId, metadata \} \}\);\s*\}'
if ($po -match $oldLogPattern) {
  $replacement = @'
async function logActivity(action: string, poId: string, userId: string, metadata?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType: "PurchaseOrder",
      entityId: poId,
      userId,
      ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });
}
'@
  $po = [regex]::Replace($po, $oldLogPattern, $replacement, 1)
  Write-Host "  Purchase Order JSON typing fixed." -ForegroundColor Green
} elseif ($po -match 'metadata as Prisma\.InputJsonValue') {
  Write-Host "  Purchase Order JSON typing already fixed." -ForegroundColor Green
} else {
  throw 'Could not locate Purchase Order logActivity safely.'
}

Write-Host "[2/5] Normalizing line endings / EOF..." -ForegroundColor Yellow
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$site = $site.TrimEnd("`r", "`n") + "`r`n"
$po   = $po.TrimEnd("`r", "`n") + "`r`n"
[IO.File]::WriteAllText($siteFile, $site, $utf8NoBom)
[IO.File]::WriteAllText($poFile, $po, $utf8NoBom)
Write-Host "  Removed extra blank lines at EOF." -ForegroundColor Green

Write-Host "[3/5] Running git diff check..." -ForegroundColor Yellow
& git diff --check
if ($LASTEXITCODE -ne 0) { throw 'git diff check still failed. Send this screen to ChatGPT.' }
Write-Host "  git diff check passed." -ForegroundColor Green

Write-Host "[4/5] Committing fixes..." -ForegroundColor Yellow
& git add -- 'src/lib/queries/sites.ts' 'src/lib/actions/purchase-order-actions.ts'
$status = & git status --porcelain
if ($status) {
  & git commit -m 'Fix Netlify TypeScript build blockers'
  if ($LASTEXITCODE -ne 0) { throw 'git commit failed.' }
} else {
  Write-Host "  Nothing new to commit (fixes may already be committed)." -ForegroundColor Green
}

Write-Host "[5/5] Pushing to GitHub main..." -ForegroundColor Yellow
& git push origin main
if ($LASTEXITCODE -ne 0) { throw 'git push failed.' }

Write-Host "" 
Write-Host "SUCCESS - FIXES PUSHED TO GITHUB MAIN" -ForegroundColor Green
Write-Host "Netlify should automatically start a NEW deploy." -ForegroundColor Green
Write-Host "Open Netlify > Deploys and watch the newest deployment." -ForegroundColor Cyan
