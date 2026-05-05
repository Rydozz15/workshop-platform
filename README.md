# ISSDE Workshop Chatbot Platform

A complete web platform designed for running interactive, AI-driven case-based workshops. Administrators can create custom scenarios (versions), organize them into campaigns, and share dynamic QR codes or links with participants. Participants are randomly assigned a case and interact with a ChatGPT-like AI to resolve the scenario.

## Features

*   **Two Separate Experiences**: A secure admin dashboard and a frictionless participant interface.
*   **Campaigns & QR Codes**: Group different case versions into Campaigns. The app automatically generates shareable URLs and QR codes for easy participant access.
*   **Dynamic Scenarios (Versions)**: Create and edit cases using Markdown. Participants can toggle a side-panel to read their specific case while chatting.
*   **Live Metrics**: The admin dashboard tracks active sessions, completed interactions, and message counts in real-time.
*   **AI Integration**: Connects directly to the OpenRouter API (supporting models like Llama 3, Claude, Gemini).
*   **No-Setup Dev Mode**: Runs out of the box using an in-memory JSON database. Can be easily switched to Supabase (PostgreSQL) for production.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
*   Node.js (v18 or higher recommended)
*   npm

### 2. Installation
```bash
# Navigate to the project directory
cd workshop-app

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root of the `workshop-app` directory (one is already provided as a template).

```env
# Get your API key at https://openrouter.ai/keys
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Password to access the /admin dashboard
ADMIN_PASSWORD=workshop2025

# Database provider: "memory" (for local testing) or "supabase" (for production)
DB_PROVIDER=memory

# Base URL for generating shareable links (update this when deploying)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Default OpenRouter model
DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct
```
*(Note: If `OPENROUTER_API_KEY` is not set, the chatbot will run in a "demo mode" and return canned responses).*

### 4. Run the Development Server
```bash
npm run dev
```

---

## 📖 How to Use the Platform

The application has two main entry points:

### 1. The Admin Dashboard (`/admin`)
Navigate to `http://localhost:3000/admin` and log in using the password defined in `ADMIN_PASSWORD` (default: `workshop2025`).

From here you can:
1.  **Versions**: Create the base text/scenarios. You can use Markdown to format the cases. (The app comes with 3 seed versions).
2.  **Campaigns**: Create a new campaign, select which *Versions* you want to include, and optionally specify an AI model.
3.  Once a Campaign is created, you will be given a **Shareable Link and a QR Code**.
4.  **Dashboard**: Monitor the incoming sessions, how many messages are being sent, and the distribution of assigned cases in real-time.

### 2. The Participant Interface (`/session/[code]`)
Participants will scan the QR code or click the link provided by the Campaign.
1.  They enter their name (optional).
2.  They are **randomly and evenly** assigned one of the versions selected for that campaign.
3.  They chat with the AI to resolve their scenario. They can view the case details by clicking the **"📋 Case"** toggle.
4.  When finished, they click "Mark Session as Complete".

---

## 🐣 Guía de Despliegue Paso a Paso (Para Principiantes)

Si nunca has subido una página web, ¡no te preocupes! Aquí tienes el paso a paso exacto para publicar esta plataforma gratis y que cualquiera pueda entrar desde su celular. Son 3 pasos grandes: **GitHub** (para guardar tu código), **Supabase** (la base de datos) y **Vercel** (donde vive la página web).

### Paso 1: Guarda tu código en GitHub
1. Entra a [GitHub](https://github.com/) y créate una cuenta si no tienes.
2. En la esquina superior derecha, haz clic en el botón **"+"** y elige **"New repository"**.
3. Ponle un nombre (ej. `mi-workshop`) y haz clic en **"Create repository"** (el botón verde abajo).
4. Abre la terminal en la carpeta de tu proyecto (donde está este código) y escribe estos comandos, uno por uno, presionando Enter:
   ```bash
   git init
   git add .
   git commit -m "Mi primer commit"
   git branch -M main
   # Copia el comando que GitHub te da que empieza con "git remote add origin..." y pégalo.
   git push -u origin main
   ```
¡Listo! Tu código ya está en la nube.

### Paso 2: Configura la Base de Datos en Supabase
1. Entra a [Supabase](https://supabase.com/) y créate una cuenta (te recomiendo usar el botón "Continue with GitHub").
2. Haz clic en **"New Project"**, elige un nombre y una contraseña segura, y dale a crear. (Tardará un par de minutos).
3. **Crea las Tablas:** En el menú izquierdo de Supabase, ve a **"SQL Editor"** y haz clic en "New Query". 
   Ve al archivo `lib/db-supabase.js` en tu código, copia toooodo el texto (SQL) que está comentado al final del archivo, pégalo en Supabase y presiona el botón verde **"Run"**. Saldrá un mensaje de "Success".
   *(Nota: si te sale un aviso sobre "RLS", elige la opción "Run without RLS").*
4. **Copia tus claves:** En Supabase, ve abajo a la izquierda a la "ruedita" de configuración (**Project Settings**), luego a **API**. Deja esta pantalla abierta, necesitaremos copiar la `Project URL` y la `anon / public key` (también llamada Publishable key) en el siguiente paso.

### Paso 3: Publica la Web en Vercel
1. Entra a [Vercel](https://vercel.com/) y regístrate usando "Continue with GitHub".
2. En tu panel principal, haz clic en el botón negro **"Add New..."** y elige **"Project"**.
3. Verás el repositorio de GitHub que creaste en el Paso 1. Haz clic en el botón **"Import"**.
4. **¡Importante! Las Variables de Entorno:** Antes de darle a desplegar, abre la pestaña "Environment Variables" y añade estas variables una por una:
   - Nombre: `DB_PROVIDER` / Valor: `supabase`
   - Nombre: `SUPABASE_URL` / Valor: *(Pega aquí la URL que dejaste abierta en Supabase)*
   - Nombre: `SUPABASE_ANON_KEY` / Valor: *(Pega aquí la key de Supabase)*
   - Nombre: `OPENROUTER_API_KEY` / Valor: *(Tu clave secreta de OpenRouter)*
   - Nombre: `ADMIN_PASSWORD` / Valor: *(La contraseña que quieras para entrar al panel de administrador)*
5. Una vez que añadas todas, haz clic en el botón **"Deploy"**.

¡Magia! Vercel cargará todo y en 2 minutos te dará una URL (ej. `mi-workshop.vercel.app`). **¡Tu plataforma ya está oficialmente en internet!**
