# Chatora AI — A Premium AI Chatbot Web Application

[![Version](https://img.shields.io/badge/version-1.0.0-315C43.svg)](#)
[![Design](https://img.shields.io/badge/design-Bento%20Grid%20%2B%20Minimalism-315C43.svg)](#)
[![Backend](https://img.shields.io/badge/backend-Python%20FastAPI-315C43.svg)](#)
[![Database](https://img.shields.io/badge/database-Supabase%20PostgreSQL-315C43.svg)](#)
[![Build](https://img.shields.io/badge/build-check%20locally-315C43.svg)](#)

Chatora AI is a production-grade, minimalist AI chatbot web application built with a purposeful **Bento Grid layout**, real-time **Server-Sent Events (SSE) streaming** powered by **Google Gemini**, **Supabase PostgreSQL** with strict Row Level Security (RLS), and a **FastAPI** asynchronous Python backend.

---

## Architecture

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 (deployed as a static SPA).
- **API backend:** Python 3.11+ FastAPI with async SQLAlchemy 2.0 and asyncpg (deployable to Render, Railway, AWS, or Docker).
- **AI Engine:** Official `google-genai` Python SDK streaming tokens via Server-Sent Events (`POST /api/chat`).
- **Database:** Supabase PostgreSQL with user-level data isolation via Row Level Security (RLS) policies.

---

## Features

- **Bento Grid Welcome Experience:** Four prompt suggestion cards that auto-populate composer templates with bracketed selections.
- **Real-Time Gemini SSE Streaming:** Server-side proxy with multi-turn context retention, adjustable response styles (_Concise_, _Balanced_, _Detailed_), title auto-generation, and **Stop Generating** client-disconnect support.
- **Supabase Authentication & Isolation:** Session management supporting email sign-up/sign-in, bearer JWT verification, and strict user-level data isolation preventing cross-user access (BOLA/IDOR).
- **Document Processing:** Server validates and extracts text/Markdown, code, JSON, CSV, and text-based PDF documents up to 2 MB. Image-only/scanned PDFs are not OCR'd.
- **Feedback & Contact Form:** Feedback submissions with honeypot spam protection and SHA-256 IP hashing.
- **Zero Forbidden Colors:** Strictly follows warm forest green, ivory, and charcoal palette (zero blue or purple).

---

## Local Development Setup

### 1. Prerequisites

- Python 3.11+
- Node.js 20+ and npm

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure backend secrets in `.env` (leave unconfigured values blank):

- `GEMINI_API_KEY`: Free-tier API key from [Google AI Studio](https://aistudio.google.com/).
- `SUPABASE_URL`: Supabase project URL (`https://your-ref.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` (or `SB_SECRET_KEY`): backend-only key used to validate Supabase bearer tokens. Never use a `VITE_` prefix for this secret.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: browser Supabase project URL and publishable/anon key. These are public client settings; do not put a service-role/secret key here.
- `FASTAPI_DATABASE_URL` (optional local override) or `DATABASE_URL` (deployment): Asynchronous PostgreSQL connection string:
  `postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
  _(For `npm run dev`, the app uses an isolated persistent SQLite file at `instance/chatora-local.db` unless `FASTAPI_DATABASE_URL` or a process-level `DATABASE_URL` is explicitly supplied.)_

For Supabase email sign-in, enable the Email provider and allow the local redirect `http://localhost:5173/**` in **Authentication → URL Configuration**. Set the production Site URL and exact production redirect URLs in the Supabase dashboard. Email confirmation behavior is controlled by the Supabase Auth project settings.

### 3. Database Migration

Apply the versioned schema and Row Level Security policies to Supabase. For an existing installation, run all files in `backend/migrations/` in order. Never run schema changes against production without reviewing them and taking a backup.

- **Option A:** Run the SQL files in order in the [Supabase Dashboard SQL Editor](https://supabase.com/dashboard).
- **Option B:** Run the Python migration utility against the intended database:
  ```bash
  python -m backend.app.scripts.migrate
  ```

### 4. Run FastAPI and the Frontend

The standard development command starts both FastAPI and Vite. It uses local SQLite by default and proxies `/api/*` and `/health` to FastAPI; override `FASTAPI_PORT` or `VITE_PORT` to change ports. To intentionally use a remote database in local development, set `FASTAPI_DATABASE_URL` in the process environment.

```bash
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies and launch the full local stack
npm install
npm run dev
```

Open `http://localhost:5173`; FastAPI interactive documentation is at `http://localhost:8000/docs`. `npm run dev:vite` starts only Vite (use only if FastAPI is already running). `npm run dev:express`, `npm run build:express`, and `npm run start:express` are legacy Express commands and are not the supported API path for this app.

---

## Running the Automated Test Suite

### Python Backend Tests

```bash
.venv\Scripts\python -m pytest backend/tests -v
```

The test suite includes:

- Health check, security headers, CORS, and JSON 404 fallback.
- Supabase bearer verification and rejection of fabricated demo tokens (test identities are provided only by isolated test overrides).
- Conversation CRUD, search filter, and cross-user authorization (BOLA/IDOR).
- Database foreign key cascade deletion and feedback persistence.
- Gemini SSE streaming lifecycle, auto-titling, and rate limit error handling.
- Full end-to-end user journey test.
- Document upload validation, 2MB size enforcement, and path traversal sanitization.

For real account sign-in, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` (or `SB_SECRET_KEY`) to the same Supabase project. Configure the Supabase Auth email provider and redirect allowlist as described above; backend tests use isolated test identities and do not authenticate a real Supabase account.

### Frontend TypeScript Verification & Build

```bash
npm run lint  # tsc --noEmit
npx vite build
```

---

## Production Deployment

### Frontend (Netlify)

1. Connect your repository to Netlify.
2. Build Settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Environment Variables in Netlify:
   - `VITE_API_URL`: URL of your deployed FastAPI backend (e.g., `https://api.chatora.ai`).
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

### Backend (Render, Railway, or Docker)

Deploy using `Dockerfile.backend` or direct command:

- **Build command:** `pip install -r backend/requirements.txt`
- **Start command:** `uvicorn backend.app.main:create_app --factory --host 0.0.0.0 --port 8000`
- **Environment Variables:**
  - `GEMINI_API_KEY`: Google Gemini API key.
  - `SUPABASE_URL`: Supabase project URL.
  - `SUPABASE_SERVICE_ROLE_KEY` or `SB_SECRET_KEY`: backend-only Supabase credential used for server-side verification. Never set it as a `VITE_` variable.
  - `DATABASE_URL`: Supabase `postgresql+asyncpg://...` connection string.
  - `CORS_ORIGINS`: Comma-separated list including your Netlify domain.
