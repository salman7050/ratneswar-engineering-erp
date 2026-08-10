@echo off
setlocal EnableExtensions
chcp 65001 >nul

echo ============================================================
echo  RATNESWAR ENGINEERING ERP - CLOUD V8 GITHUB PUSH
echo ============================================================
echo.

set "REPO=https://github.com/salman7050/ratneswar-engineering-erp.git"
set "SRC=%~dp0"
set "WORK=%TEMP%\RatneswarERP_GitHub_Push"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git is not available in Windows PATH.
  echo Install Git for Windows, then run this file again.
  echo No ERP runtime will be installed or run locally; Git is used only once to upload source code.
  pause
  exit /b 1
)

echo [1/6] Preparing temporary working folder...
if exist "%WORK%" rmdir /s /q "%WORK%"

echo [2/6] Cloning private GitHub repository...
git clone "%REPO%" "%WORK%"
if errorlevel 1 goto :fail

echo [3/6] Copying Cloud V8 source...
robocopy "%SRC%" "%WORK%" /E /NFL /NDL /NJH /NJS /NP /XD .git node_modules .next /XF PUSH_TO_GITHUB.bat >nul
set RC=%ERRORLEVEL%
if %RC% GEQ 8 goto :fail

cd /d "%WORK%"

echo [4/6] Preparing commit...
git add -A

git diff --cached --quiet
if not errorlevel 1 (
  echo Nothing new to push.
  goto :done
)

git -c user.name="Md Salman" -c user.email="salmanperwez93@gmail.com" commit -m "Deploy Ratneswar Engineering ERP Cloud V8"
if errorlevel 1 goto :fail

echo [5/6] Pushing to main...
git push origin main
if errorlevel 1 goto :fail

echo [6/6] Push completed.
:done
echo.
echo ============================================================
echo  SUCCESS - CLOUD V8 SOURCE IS ON GITHUB
 echo Repository: salman7050/ratneswar-engineering-erp
 echo Next step: connect this repository to Netlify.
echo ============================================================
pause
exit /b 0

:fail
echo.
echo [ERROR] Push did not complete.
echo Copy the error shown above and send it to ChatGPT.
pause
exit /b 1
