$ErrorActionPreference = 'Stop'
$repo = 'C:\RatneswarERP\ratneswar-engineering-erp-cloud-v8'

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host 'RATNESWAR ERP - OWNER/ADMIN ROLE TYPE FIX + GITHUB PUSH' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host "Project: $repo"

if (-not (Test-Path (Join-Path $repo 'package.json'))) {
  throw "Project folder not found: $repo"
}
Set-Location $repo

Write-Host '[1/5] Syncing latest main...' -ForegroundColor Yellow
git switch main
if ($LASTEXITCODE -ne 0) { throw 'Could not switch to main.' }
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) { throw 'Could not pull latest main.' }

$utf8 = New-Object System.Text.UTF8Encoding($false)

Write-Host '[2/5] Fixing users query role type...' -ForegroundColor Yellow
$qPath = Join-Path $repo 'src\lib\queries\users.ts'
$q = [IO.File]::ReadAllText($qPath)

if ($q -notmatch 'export type ErpAccessRole = "ADMIN" \| "OWNER";') {
  $q = $q -replace 'import \{ prisma \} from "@/lib/prisma";\r?\n', "import { prisma } from \"@/lib/prisma\";`n`nexport type ErpAccessRole = \"ADMIN\" | \"OWNER\";`n"
}

if ($q -match 'export async function getUsers\(\) \{\s*return prisma\.user\.findMany\(\{') {
  $q = $q -replace 'export async function getUsers\(\) \{\s*return prisma\.user\.findMany\(\{', "export async function getUsers() {`n  const users = await prisma.user.findMany({`n    where: { role: { in: [\"ADMIN\", \"OWNER\"] } },"
  $q = $q -replace '\n  \}\);\s*\n\}\s*\n\s*export type UserListItem', "`n  });`n`n  return users as Array<Omit<(typeof users)[number], \"role\"> & { role: ErpAccessRole }>;`n}`n`nexport type UserListItem"
} elseif ($q -notmatch 'where: \{ role: \{ in: \["ADMIN", "OWNER"\] \} \},') {
  $q = $q -replace '(const users = await prisma\.user\.findMany\(\{\s*)', '$1    where: { role: { in: ["ADMIN", "OWNER"] } },' + "`n"
}

if ($q -notmatch 'return users as Array<Omit<\(typeof users\)\[number\], "role"> & \{ role: ErpAccessRole \}>;') {
  $q = $q -replace '(\n  \}\);\s*\n\})\s*\n\s*export type UserListItem', "`n  });`n`n  return users as Array<Omit<(typeof users)[number], \"role\"> & { role: ErpAccessRole }>;`n}`n`nexport type UserListItem"
}
[IO.File]::WriteAllText($qPath, ($q -replace "`r`n", "`n").TrimEnd() + "`n", $utf8)

Write-Host '[3/5] Fixing users UI role type...' -ForegroundColor Yellow
$cPath = Join-Path $repo 'src\components\users\users-client.tsx'
$c = [IO.File]::ReadAllText($cPath)
$c = $c -replace 'import type \{ AppRole \} from "@/types";\s*\r?\nimport type \{ UserListItem \} from "@/lib/queries/users";', 'import type { ErpAccessRole, UserListItem } from "@/lib/queries/users";'
$c = $c -replace 'const ROLES: AppRole\[\] = \["ADMIN", "OWNER"\];', 'const ROLES: ErpAccessRole[] = ["ADMIN", "OWNER"];'
$c = $c -replace 'role as AppRole', 'role as ErpAccessRole'
$c = $c -replace '"OWNER" as AppRole', '"OWNER" as ErpAccessRole'
[IO.File]::WriteAllText($cPath, ($c -replace "`r`n", "`n").TrimEnd() + "`n", $utf8)

Write-Host '[4/5] Verifying intended access rule...' -ForegroundColor Yellow
$q2 = [IO.File]::ReadAllText($qPath)
$c2 = [IO.File]::ReadAllText($cPath)
if ($q2 -notmatch 'ErpAccessRole = "ADMIN" \| "OWNER"') { throw 'ErpAccessRole type was not applied.' }
if ($q2 -notmatch 'where: \{ role: \{ in: \["ADMIN", "OWNER"\] \} \},') { throw 'Owner/Admin query filter was not applied.' }
if ($c2 -match 'AppRole') { throw 'users-client.tsx still contains AppRole; patch incomplete.' }
Write-Host '  Owner/Admin-only access typing verified.' -ForegroundColor Green

Write-Host '[5/5] Committing and pushing...' -ForegroundColor Yellow
git add src/lib/queries/users.ts src/components/users/users-client.tsx
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Host '  Nothing new to commit; fix may already be present.' -ForegroundColor DarkYellow
} else {
  git commit -m 'Fix Owner Admin user role typing for Netlify build'
  if ($LASTEXITCODE -ne 0) { throw 'Git commit failed.' }
}
git push origin main
if ($LASTEXITCODE -ne 0) { throw 'Git push failed.' }

Write-Host ''
Write-Host 'SUCCESS - ROLE TYPE FIX PUSHED TO GITHUB MAIN' -ForegroundColor Green
Write-Host 'Netlify should automatically start a NEW deploy.' -ForegroundColor Green
