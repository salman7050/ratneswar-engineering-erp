@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo RATNESWAR ERP - FINAL DB MIGRATION FIX PUSH
echo ================================================
echo.

git status >nul 2>&1
if errorlevel 1 (
  echo [ERROR] This folder is not the existing Git repository.
  echo Copy these files into your existing project folder first:
  echo C:\RatneswarERP\ratneswar-engineering-erp-cloud-v8
  pause
  exit /b 1
)

echo [1/3] Staging corrected migration and Netlify recovery...
git add prisma/migrations/20260810000100_private_signature_cleanup/migration.sql netlify.toml

echo [2/3] Committing...
git commit -m "Fix signature migration and recover failed Prisma migration"
if errorlevel 1 (
  echo No new commit was created. Checking whether files are already committed...
)

echo [3/3] Pushing main to GitHub...
git push origin main
if errorlevel 1 (
  echo.
  echo [ERROR] GitHub push failed.
  pause
  exit /b 1
)

echo.
echo SUCCESS - FINAL MIGRATION FIX PUSHED.
echo Netlify will start a fresh deploy automatically.
echo Do NOT retry the old failed deploy.
pause
