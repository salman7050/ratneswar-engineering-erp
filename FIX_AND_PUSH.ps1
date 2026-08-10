$ErrorActionPreference = 'Stop'

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "RATNESWAR ERP - NETLIFY BUILD FIX + GITHUB PUSH" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$defaultRoot = 'C:\RatneswarERP\ratneswar-engineering-erp-cloud-v8'
$root = (Get-Location).Path
if (-not (Test-Path (Join-Path $root 'package.json'))) {
  if (Test-Path (Join-Path $defaultRoot 'package.json')) {
    $root = $defaultRoot
  } else {
    throw "Project folder not found. Put these two fix files inside your Cloud V8 project folder and run again."
  }
}
Set-Location $root
Write-Host "Project: $root" -ForegroundColor DarkGray

Write-Host "[1/5] Syncing latest main branch..." -ForegroundColor Yellow
git checkout main | Out-Host
git pull --rebase origin main | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'git pull failed.' }

$siteFile = Join-Path $root 'src\lib\queries\sites.ts'
$poFile   = Join-Path $root 'src\lib\actions\purchase-order-actions.ts'
if (-not (Test-Path $siteFile)) { throw "Missing $siteFile" }
if (-not (Test-Path $poFile)) { throw "Missing $poFile" }

Write-Host "[2/5] Fixing SiteDetail _count type..." -ForegroundColor Yellow
$site = Get-Content $siteFile -Raw
$siteCountLine = '      _count: { select: { employees: true, tenders: true, invoices: true, assets: true, billingContracts: true } },'
$detailAnchorPattern = '(clientAccount:\s*true,\r?\n\s*subcontractor:\s*true,)(\r?\n\s*billingContracts:)'
if ($site -notmatch 'clientAccount:\s*true,\r?\n\s*subcontractor:\s*true,\r?\n\s*_count:') {
  if ($site -notmatch $detailAnchorPattern) { throw 'Could not locate getSiteDetail include block safely.' }
  $site = [regex]::Replace($site, $detailAnchorPattern, ('$1' + "`r`n" + $siteCountLine + '$2'), 1)
  Set-Content -Path $siteFile -Value $site -Encoding utf8
  Write-Host "  Added _count to getSiteDetail." -ForegroundColor Green
} else {
  Write-Host "  _count fix already present." -ForegroundColor Green
}

Write-Host "[3/5] Fixing Purchase Order audit JSON typing..." -ForegroundColor Yellow
$po = Get-Content $poFile -Raw
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
  Set-Content -Path $poFile -Value $po -Encoding utf8
  Write-Host "  Prisma JSON typing fixed." -ForegroundColor Green
} elseif ($po -match 'metadata as Prisma\.InputJsonValue') {
  Set-Content -Path $poFile -Value $po -Encoding utf8
  Write-Host "  Purchase Order JSON fix already present." -ForegroundColor Green
} else {
  throw 'Could not locate Purchase Order logActivity safely.'
}

Write-Host "[4/5] Checking patch..." -ForegroundColor Yellow
git diff --check | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'git diff check failed.' }
git diff -- src/lib/queries/sites.ts src/lib/actions/purchase-order-actions.ts | Out-Host

$status = git status --porcelain
if (-not $status) {
  Write-Host "No new changes to commit - fixes are already on main." -ForegroundColor Green
} else {
  Write-Host "[5/5] Committing and pushing to GitHub..." -ForegroundColor Yellow
  git add src/lib/queries/sites.ts src/lib/actions/purchase-order-actions.ts
  git commit -m "Fix Netlify TypeScript build blockers" | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'git commit failed.' }
  git push origin main | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'git push failed.' }
  Write-Host "" 
  Write-Host "SUCCESS: Fix pushed to GitHub main." -ForegroundColor Green
  Write-Host "Netlify should start a NEW deploy automatically." -ForegroundColor Green
}

Write-Host "" 
Write-Host "Do NOT retry the old 2:59 PM deploy. Open Netlify > Deploys and watch the newest deploy." -ForegroundColor Cyan
