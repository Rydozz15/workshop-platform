@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Falta instalar Node.js, el programa que hace funcionar PromptSketch.
  echo.
  echo   1. Entra a https://nodejs.org y descarga la version "LTS".
  echo   2. Instalala con "Siguiente" en todo.
  echo   3. Vuelve a hacer doble clic en este archivo.
  echo.
  echo Si prefieres la terminal:  winget install OpenJS.NodeJS.LTS
  echo.
  pause
  exit /b 1
)

node scripts\start-local.js %*
echo.
echo PromptSketch se detuvo.
pause
