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

## 🌍 Production Deployment

This project is built with Next.js App Router and is optimized to be deployed for free using Vercel and Supabase.

### Step 1: Database (Supabase)
1. Create a free account at [Supabase](https://supabase.com/).
2. Create a new project.
3. Go to the SQL Editor and run the schema provided at the bottom of `lib/db-supabase.js`.
4. Get your `Project URL` and `anon public` API key.

### Step 2: Deployment (Vercel)
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and import your repository.
3. Add the following Environment Variables in Vercel:
    *   `OPENROUTER_API_KEY`
    *   `ADMIN_PASSWORD`
    *   `DB_PROVIDER=supabase`
    *   `SUPABASE_URL=your_supabase_url`
    *   `SUPABASE_ANON_KEY=your_supabase_anon_key`
    *   `NEXT_PUBLIC_BASE_URL=https://your-production-url.vercel.app`
4. Click Deploy!
