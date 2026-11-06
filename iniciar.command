#!/usr/bin/env bash
# macOS: doble clic en este archivo. (Si dice que no tiene permisos: chmod +x iniciar.command)
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Falta instalar Node.js: descarga la versión LTS en https://nodejs.org y vuelve a abrir este archivo."
  read -r -p "Presiona Enter para cerrar..." _
  exit 1
fi
node scripts/start-local.js "$@"
read -r -p "PromptSketch se detuvo. Presiona Enter para cerrar..." _
