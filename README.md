# Chatora AI — A Premium AI Chatbot Web Application

[![Version](https://img.shields.io/badge/version-1.0.0-315C43.svg)](#)
[![Design](https://img.shields.io/badge/design-Bento%20Grid%20%2B%20Minimalism-315C43.svg)](#)
[![Backend](https://img.shields.io/badge/backend-Python%20FastAPI-315C43.svg)](#)
[![Database](https://img.shields.io/badge/database-Supabase%20PostgreSQL-315C43.svg)](#)
[![Build](https://img.shields.io/badge/build-passing-315C43.svg)](#)

Chatora AI is a production-grade, minimalist AI chatbot web application built with a purposeful **Bento Grid layout**, real-time **Server-Sent Events (SSE) streaming** powered by **Google Gemini**, **Supabase PostgreSQL** with strict Row Level Security (RLS), and a **FastAPI** asynchronous Python backend.

---

## Architecture

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4 (Deployed on Netlify / Vercel / Cloud Run).
- **Backend:** Python 3.13 FastAPI with async SQLAlchemy 2.0 and asyncpg (Deployable to Render, Railway, AWS, or Docker).
- **AI Engine:** Official `google-genai` Python SDK streaming tokens via Server-Sent Events (`POST /api/chat`).
- **Database:** Supabase PostgreSQL with user-level data isolation via Row Level Security (RLS) policies.

---

## Features

- **Bento Grid Welcome Experience:** Four prompt suggestion cards that auto-populate composer templates with bracketed selections.
- **Real-Time Gemini SSE Streaming:** Server-side proxy with multi-turn context retention, adjustable response styles (_Concise_, _Balanced_, _Detailed_), title auto-generation, and **Stop Generating** client-disconnect support.
- **Supabase Authentication & Isolation:** Session management supporting email sign-up/sign-in, bearer JWT verification, and strict user-level data isolation preventing cross-user access (BOLA/IDOR).
- **Document Processing:** Client-side document upload modal extracting plain text, Markdown, code, and JSON with 2MB limits and server sanitization.
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

Configure your secrets in `.env`:
- `GEMINI_API_KEY`: Free-tier API key from [Google AI Studio](https://aistudio.google.com/).
- `SUPABASE_URL`: Supabase project URL (`https://your-ref.supabase.co`).
- `SUPABASE_ANON_KEY`: Supabase anon key.
- `DATABASE_URL`: Asynchronous PostgreSQL connection string:
  `postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
  *(If left blank, a local SQLite async database will automatically be used for development).*

### 3. Database Migration

Apply the initial schema and Row Level Security policies to Supabase:
- **Option A:** Open `backend/migrations/001_initial_schema.sql` and run it in the [Supabase Dashboard SQL Editor](https://supabase.com/dashboard).
- **Option B:** Run the Python migration utility:
  ```bash
  python -m backend.app.scripts.migrate
  ```

### 4. Running the Backend (FastAPI)

```bash
# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run FastAPI server on port 8000
uvicorn backend.app.main:create_app --factory --reload --port 8000
```

FastAPI interactive documentation will be available at `http://localhost:8000/docs`.

### 5. Running the Frontend (React + Vite)

```bash
# Install npm dependencies
npm install

# Run frontend development server
npm run dev
```

---

## Running the Automated Test Suite

### Python Backend Tests (26 test cases)

```bash
.venv\Scripts\python -m pytest backend/tests -v
```

Includes:
- Health check, security headers, CORS, and JSON 404 fallback.
- Supabase bearer authentication and demo JWT parsing.
- Conversation CRUD, search filter, and cross-user authorization (BOLA/IDOR).
- Database foreign key cascade deletion and feedback persistence.
- Gemini SSE streaming lifecycle, auto-titling, and rate limit error handling.
- Full end-to-end user journey test.
- Document upload validation, 2MB size enforcement, and path traversal sanitization.

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
  - `SUPABASE_ANON_KEY`: Supabase anon key.
  - `DATABASE_URL`: Supabase `postgresql+asyncpg://...` connection string.
  - `CORS_ORIGINS`: Comma-separated list including your Netlify domain.
