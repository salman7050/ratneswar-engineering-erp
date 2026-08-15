@echo off
cd /d "%~dp0"
if exist "C:\RatneswarERP\ratneswar-engineering-erp-cloud-v8\package.json" (
  cd /d "C:\RatneswarERP\ratneswar-engineering-erp-cloud-v8"
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0FIX_2_AND_PUSH.ps1"
echo.
pause
