@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo RATNESWAR ERP - FINAL CLOUD SOURCE PUSH
echo ================================================
echo.
where git >nul 2>&1 || (echo [ERROR] Git is not installed.& pause & exit /b 1)
if not exist ".git" (
  echo [ERROR] This folder is not the existing Git repository folder.
  echo Copy/extract these files into:
  echo C:\RatneswarERP\ratneswar-engineering-erp-cloud-v8
  echo and keep its hidden .git folder.
  pause
  exit /b 1
)
git status --short
git add -A
git diff --cached --quiet && (
  echo No new changes to push.
  git push origin main
  pause
  exit /b %errorlevel%
)
git commit -m "Final Cloud V8 deploy fixes"
if errorlevel 1 goto :fail
git push origin main
if errorlevel 1 goto :fail
echo.
echo SUCCESS - FINAL SOURCE PUSHED TO GITHUB MAIN
echo Netlify will start a new deploy automatically.
pause
exit /b 0
:fail
echo.
echo [ERROR] Git push did not complete.
pause
exit /b 1
