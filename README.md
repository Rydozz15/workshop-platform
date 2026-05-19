# ISSDE Workshop Chatbot Platform

A complete web platform designed for running interactive, AI-driven case-based workshops. Administrators can create custom scenarios (versions), organize them into campaigns, and share dynamic QR codes or links with participants. Participants are randomly assigned a case and interact with a ChatGPT-like AI to resolve the scenario.

## Features

*   **Two Separate Experiences**: A secure admin dashboard and a frictionless participant interface.
*   **Chained Campaigns & QR Codes**: Group different case versions into Campaigns. You can chain multiple campaigns together (Step 1 -> Step 2) for an automated sequence. The app automatically generates shareable URLs and QR codes.
*   **Post-Session Surveys**: Configure custom surveys (Likert scale, multiple choice, checkboxes, open text) that participants must fill out after completing a session.
*   **Dynamic Scenarios (Versions)**: Create and edit cases using Markdown. Participants can toggle a side-panel to read their specific case while chatting.
*   **Custom AI Personas**: Set a custom system prompt per Campaign step to control how the AI behaves (e.g., naive mode, strict tutor, casual peer).
*   **Global Settings Panel**: Configure a default AI provider and model from the admin UI. These defaults pre-fill new campaigns and are used as fallback for analytics.
*   **Advanced Analytics & Longitudinal Analysis**: The dashboard tracks active sessions, computes survey distributions, visualizes Likert scale averages with charts, generates AI summaries of open-text responses, and provides longitudinal evolution analysis across chained campaign steps.
*   **Data Export**: Export sessions and full chat transcripts to CSV or JSON for data analysis.
*   **AI Integration**: Connects directly to OpenRouter or Groq APIs (supporting models like Llama 3/4, Qwen, Gemini, Mixtral).
*   **Participant Journey Hub**: Participants can review their full session history, transcripts, and survey responses after completing a campaign.
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

# Get your API key at https://console.groq.com/keys
GROQ_API_KEY=your-groq-api-key-here

# Password to access the /admin dashboard
ADMIN_PASSWORD=workshop2025

# Database provider: "memory" (for local testing) or "supabase" (for production)
DB_PROVIDER=memory

# Base URL for generating shareable links (update this when deploying)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Default OpenRouter model (optional — can be configured from /admin/settings instead)
DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct
```

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
2.  **Campaigns**: Create a new campaign, add multiple steps if you want a chained sequence, select *Versions*, AI provider, specify an AI model, set Custom System Prompts, and add Post-Session Surveys. Provider and model are pre-filled from your global settings.
3.  Once a Campaign is created, you will be given a **Shareable Link and a QR Code** (only for the first step).
4.  **Dashboard & Sessions**: Monitor incoming sessions in real-time, read full chat transcripts, and export data.
5.  **Analytics**: View charts with survey results (Likert averages, multiple choice distributions), generate AI summaries of open-text responses, and run longitudinal evolution analysis across chained campaign steps.
6.  **Settings**: Configure your default AI provider (OpenRouter or Groq) and model. These defaults are used as pre-fill for new campaigns and as fallback for analytics summaries.

### 2. The Participant Interface (`/session/[code]`)
Participants will scan the QR code or click the link provided by the Campaign.
1.  They enter their name (optional).
2.  They are **randomly and evenly** assigned one of the versions selected for that campaign.
3.  They chat with the AI to resolve their scenario. They can view the case details by clicking the **"📋 Case"** toggle.
4.  When finished, they click "Mark Session as Complete".
5.  If configured, they fill out the **Post-Session Survey**.
6.  If the campaign is chained, they are automatically forwarded to the next case in the sequence.

---

## 🐣 Step-by-Step Deployment Guide (For Beginners)

If you've never deployed a web app before, here is the exact step-by-step process to host this platform for free so anyone can access it from their phone. We will use three services: **GitHub** (to host your code), **Supabase** (for the database), and **Vercel** (to host the live website).

### Step 1: Save your code to GitHub
1. Go to [GitHub](https://github.com/) and create an account.
2. In the top right corner, click the **"+"** button and select **"New repository"**.
3. Give it a name (e.g., `my-workshop`) and click **"Create repository"**.
4. Open the terminal in your project folder and run these commands one by one:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # Copy the command GitHub gives you starting with "git remote add origin..." and paste it here.
   git push -u origin main
   ```
Your code is now safely backed up in the cloud.

### Step 2: Set up the Database in Supabase
1. Go to [Supabase](https://supabase.com/) and sign up (using "Continue with GitHub" is recommended).
2. Click **"New Project"**, choose a name and a secure password, and wait a few minutes for it to provision.
3. **Create the Tables:** On the left menu in Supabase, go to **"SQL Editor"** and click "New Query". 
   Open the `lib/db-supabase.js` file in your code, copy all the commented SQL text at the very bottom of the file, paste it into the Supabase SQL editor, and click the green **"Run"** button. You should see a "Success" message.
   *(Note: If prompted about "RLS", choose "Run without RLS" for now. If you already had an older version installed, look at the bottom of the SQL block in `db-supabase.js` to see the ALTER/CREATE statements for upgrading, including the `settings` table).*
4. **Copy your keys:** In Supabase, go to the bottom left gear icon (**Project Settings**), then to **API**. Leave this tab open; you will need to copy the `Project URL` and the `anon / public key` (Publishable key) in the next step.

### Step 3: Deploy the Website on Vercel
1. Go to [Vercel](https://vercel.com/) and sign up using "Continue with GitHub".
2. On your main dashboard, click the black **"Add New..."** button and select **"Project"**.
3. You will see the GitHub repository you created in Step 1. Click **"Import"**.
4. **Important! Environment Variables:** Before clicking deploy, open the "Environment Variables" section and add these variables one by one:
   - Name: `DB_PROVIDER` / Value: `supabase`
   - Name: `SUPABASE_URL` / Value: *(Paste the URL from Supabase here)*
   - Name: `SUPABASE_ANON_KEY` / Value: *(Paste the anon key from Supabase here)*
   - Name: `GROQ_API_KEY` or `OPENROUTER_API_KEY` / Value: *(Your secret AI provider key)*
   - Name: `ADMIN_PASSWORD` / Value: *(The password you want to use for the /admin dashboard)*
5. Once all variables are added, click the **"Deploy"** button.

Magic! Vercel will build the app and give you a live URL (e.g., `my-workshop.vercel.app`) in about 2 minutes. **Your platform is now officially on the internet!**
