@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0FIX_ROLE_TYPE_AND_PUSH.ps1"
if errorlevel 1 (
  echo.
  echo [ERROR] Fix/push did not complete. Send this window screenshot to ChatGPT.
  pause
  exit /b 1
)
echo.
echo Done. Check Netlify Deploys for the newest deploy.
pause
