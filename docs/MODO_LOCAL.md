# Usar PromptSketch en tu computador (sin saber programar)

Sirve para probar la plataforma o hacer un taller pequeño desde tu propio computador. Funciona en **Windows, macOS y Linux**. No necesitas cuenta en ningún servicio ni base de datos.

## Windows

1. **Instala Node.js** (solo una vez): entra a <https://nodejs.org>, descarga la versión **LTS** e instálala con "Siguiente" en todo. Si prefieres la terminal: `winget install OpenJS.NodeJS.LTS`.
2. **Descarga PromptSketch** desde GitHub (botón verde *Code* → *Download ZIP*) y descomprímelo.
3. Haz **doble clic en `iniciar.bat`**.
   - La primera vez instala y prepara todo (unos minutos, necesita internet).
   - Si Windows pregunta por el **Firewall**, elige **"Permitir acceso"** (en redes privadas). Es lo que permite que los celulares de los participantes entren.
4. Se abre el navegador en la página de administración. La **contraseña** aparece en la ventana negra y queda guardada en el archivo `.env.local`.
5. Para cerrar: presiona `Ctrl + C` en la ventana negra, o ciérrala.

## macOS

Instala Node.js (LTS) desde <https://nodejs.org> y haz doble clic en `iniciar.command`. Si macOS dice que no tiene permisos, abre la Terminal en esa carpeta y escribe `chmod +x iniciar.command`.

## Linux

```bash
./run.sh            # modo desarrollo, o
npm run local       # igual que Windows y macOS
```

## Cómo entran los participantes

- Tu computador y los celulares deben estar en **el mismo Wi-Fi**. Algunas redes (universidades, hoteles, redes "de invitados") bloquean la conexión entre dispositivos: si pasa eso, usa el Wi-Fi del celular compartido desde tu teléfono (zona Wi-Fi) o pide a TI que permita la conexión entre dispositivos.
- Abre la administración con la dirección que muestra la ventana (algo como `http://192.168.1.20:3000/admin`, **no** `localhost`): así el código QR de tu campaña funciona en los celulares.
- Comparte el código o proyecta el QR desde **En vivo → Proyectar QR**.

## Tus datos

- Todo se guarda en el archivo `data.json` de esta carpeta. **Haz copias de respaldo** y no lo compartas: puede contener respuestas de participantes.
- Para empezar de cero, cierra el programa y borra `data.json`.
- La primera vez verás **datos de ejemplo** (modo demo). Salir del modo demo está en **Ajustes**.
- Para que el asistente responda con IA de verdad, configura un proveedor en **Ajustes**. Sin clave, el asistente es simulado.

## Si algo falla

| Problema | Qué hacer |
| --- | --- |
| "Falta instalar Node.js" | Instálalo (paso 1) y vuelve a abrir `iniciar.bat`. |
| "No se pudo instalar" | Revisa tu conexión a internet y vuelve a intentarlo. |
| La ventana se cierra sola | Abre `cmd` en la carpeta y ejecuta `node scripts\start-local.js` para ver el mensaje. |
| El celular no abre la página | Mismo Wi-Fi, Firewall permitido y dirección con la IP (no `localhost`). |
| Otro programa usa el puerto 3000 | `iniciar.bat --port 3001` |
| Quiero actualizar PromptSketch | Descarga el ZIP nuevo, copia tu `data.json` y `.env.local` a la carpeta nueva y ejecuta con `--rebuild` la primera vez. |

Para publicar la plataforma en internet (con muchos participantes a la vez) este modo no es suficiente: ver el README (Supabase y despliegue).
