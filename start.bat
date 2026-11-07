@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed. It is the program that runs PromptSketch.
  echo.
  echo   1. Go to https://nodejs.org and download the "LTS" version.
  echo   2. Install it, clicking "Next" all the way through.
  echo   3. Double-click this file again.
  echo.
  echo If you prefer the terminal:  winget install OpenJS.NodeJS.LTS
  echo.
  pause
  exit /b 1
)

node scripts\start-local.js %*
echo.
echo PromptSketch stopped.
pause
