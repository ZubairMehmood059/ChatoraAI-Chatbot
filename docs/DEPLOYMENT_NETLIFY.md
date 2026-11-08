# Chatora AI - Production Deployment Guide: Netlify & Supabase

> **Deployment notice (2026-11-08):** Sections below include historical Express/Node recommendations and are not the supported API deployment path. The current supported frontend is the React/Vite SPA and the API is FastAPI under `backend/`; see `README.md`. Set `VITE_API_URL` to the FastAPI origin for production (the Vite proxy applies only in development). Configure CORS on FastAPI for the deployed frontend origin. No production deployment was performed as part of the repair.

This document outlines the production architecture, hosting strategy, Netlify deployment steps, and Supabase Authentication configuration for Chatora AI.

---

## 1. Architecture Overview & Netlify Functions Audit

### Can the Express backend run on Netlify Functions?

**Technical Audit Finding:**

- **Streaming Incompatibility:** Netlify Functions (AWS Lambda-based) buffer HTTP responses by default. This halts Server-Sent Events (SSE) streaming (`/api/chat`), preventing chunk-by-chunk token delivery to the user and degrading the conversational AI experience. While Netlify Edge Functions offer streaming, they impose strict execution timeout ceilings (10–26 seconds max), which fail on detailed, multi-paragraph AI generations.
- **Stateless Ephemeral Filesystem:** Netlify Functions spin up in stateless micro-containers without persistent local storage. Conversation logs, feedback, and rate-limiting stores written to local disk are wiped whenever instances terminate or scale.
- **Separation of Concerns:** Industry best practice for high-throughput AI applications is to decouple static client delivery (edge CDN) from long-running AI streaming endpoints (dedicated Node.js container).

### Recommended Production Architecture

1. **Frontend (Netlify Edge CDN):**
   - Built with Vite (`npm run build`), deployed to Netlify's global multi-cloud CDN.
   - SPA client-side routing handled by `netlify.toml` and `public/_redirects` (`/* -> /index.html 200`).
   - Connects directly to Supabase Auth client-side for user signups, logins, and session restoration.
2. **Backend (Containerized Node.js / Express):**
   - Runs `dist/server.js` on a persistent Node runtime (Google Cloud Run, Render, Railway, Fly.io, or VPS).
   - Holds privileged secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
   - Verifies Supabase JWT tokens via `Authorization: Bearer <token>` on all `/api/*` endpoints.
   - Streams real-time tokens via HTTP/2 SSE without execution timeouts or buffering.
3. **API Proxying (Optional Single-Domain Strategy):**
   - In `netlify.toml` or `_redirects`, proxy `/api/*` and `/health` to the backend URL so frontend and API share a single domain, eliminating CORS headers entirely.

---

## 2. Environment Variables Configuration

### A. Netlify Frontend Variables (Site configuration -> Environment variables)

| Variable                 | Description                                                            | Example                          |
| :----------------------- | :--------------------------------------------------------------------- | :------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase Project API URL                                               | `https://xxxx.supabase.co`       |
| `VITE_SUPABASE_ANON_KEY` | Supabase Public Anonymous Key                                          | `eyJhbGciOi...`                  |
| `VITE_API_URL`           | URL of the backend Express server (leave empty if using Netlify proxy) | `https://api.chatora.ai` or `""` |

### B. Backend Host Variables (Google Cloud Run / Render / Railway)

| Variable                    | Description                                                          |
| :-------------------------- | :------------------------------------------------------------------- |
| `GEMINI_API_KEY`            | **Privileged Secret** - Google Gemini API Key                        |
| `SUPABASE_URL`              | Supabase Project API URL                                             |
| `SUPABASE_SERVICE_ROLE_KEY` | **Privileged Secret** - Supabase service role key for JWT validation |
| `PORT`                      | Listening port (typically `3000` or `8080`)                          |
| `NODE_ENV`                  | `production`                                                         |

> ⚠️ **Security Guarantee:** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are never bundled into frontend assets or exposed via `VITE_` variables.

---

## 3. Step-by-Step Netlify Deployment

1. **Push Code to Git Repository:**
   Ensure `netlify.toml`, `public/_redirects`, and `package.json` are committed to your repository (GitHub, GitLab, or Bitbucket).

2. **Create New Site on Netlify:**
   - Log in to [Netlify Dashboard](https://app.netlify.com/).
   - Click **Add new site** > **Import an existing project**.
   - Select your Git provider and repository.

3. **Configure Build Settings:**
   - **Base directory:** Leave empty (root)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** 22 (configured in `netlify.toml`)

4. **Add Environment Variables in Netlify:**
   Navigate to **Site Configuration** > **Environment variables** and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (if your backend is deployed at e.g. `https://chatora-api.onrender.com`)

5. **Deploy Site:**
   - Click **Deploy site**.
   - Netlify will build the Vite SPA and deploy it with full SSL and global CDN distribution.

---

## 4. Supabase Project Configuration

1. **Create Supabase Project:**
   - Go to [Supabase](https://supabase.com) and create a project.
   - Go to **Project Settings** > **API** to copy:
     - Project URL (`VITE_SUPABASE_URL` / `SUPABASE_URL`)
     - anon/public key (`VITE_SUPABASE_ANON_KEY`)
     - service_role key (`SUPABASE_SERVICE_ROLE_KEY`)

2. **Configure Authentication Redirects:**
   - Go to **Authentication** > **URL Configuration**.
   - Set **Site URL** to your Netlify production domain: `https://your-site.netlify.app`.
   - Add **Redirect URLs**:
     - `https://your-site.netlify.app/**`
     - `http://localhost:3000/**` (for local development)

3. **Enable Email Provider:**
   - Go to **Authentication** > **Providers** > **Email**.
   - Enable "Email provider".
   - (Optional) Toggle "Confirm email" based on your verification preference. Both instant sign-in and email verification modes are handled natively by Chatora AI's `AuthModal`.

---

## 5. Backend Server Deployment (Render / Cloud Run)

To run the backend independently:

- **Build Command:** `npm run build`
- **Start Command:** `npm run start` (executes `node dist/server.js`)
- **Port:** Set `PORT` environment variable or accept default `3000`.
- The Express bundle compiled by esbuild contains no external dependencies other than native Node runtime modules.

---

## 6. Verification Checklist

- [x] SPA Routing: Direct navigation to `/contact`, `/faq`, `/terms` loads correctly without 404s.
- [x] Client Build: `dist/index.html` and hashed asset bundles generate cleanly.
- [x] Supabase Auth: Sign Up, Sign In, Sign Out, Password Reset, and Recovery flow functional.
- [x] Per-User Data Isolation: Authenticated users only see and edit their own conversations.
- [x] SSE Streaming: Real-time chunk transmission with cancellation support.
- [x] Rate Limiting: 45 req/min chat protection, 15 req/min auth protection.
