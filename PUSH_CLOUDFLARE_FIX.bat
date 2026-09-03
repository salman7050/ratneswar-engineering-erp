@echo off
setlocal
cd /d "%~dp0"
echo.
echo RATNESWAR ERP - Cloudflare Fix Push
 echo.
git status --short
 echo.
git add -A
if errorlevel 1 goto fail
git diff --cached --check
if errorlevel 1 goto fail
git commit -m "Prepare ERP for Cloudflare Workers deployment"
if errorlevel 1 (
  echo.
  echo No new commit was created. If everything is already committed, continue to Cloudflare.
) else (
  git push origin main
  if errorlevel 1 goto fail
)
echo.
echo DONE - GitHub main now contains the Cloudflare deployment files.
pause
exit /b 0
:fail
echo.
echo The Git command failed. Read the message above.
pause
exit /b 1
