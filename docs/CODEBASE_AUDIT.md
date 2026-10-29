# Chatora AI — Codebase Audit & System Architecture Report

**Audit Date:** 2026-10-27  
**Auditor:** Senior Software Architect, Security Specialist & Systems Engineer  
**Project:** Chatora AI (v1.0.0)

---

## 1. Project Overview & Directory Structure

Chatora AI was designed according to the Bento Grid minimalism specification (`design-final.md`) with a strict forbidden-color policy (zero blue/purple hues) and server-side Gemini 3.8 Flash integration.

### Full Workspace File Map:

```text
/
├── app.py                      # Standalone Python Flask entry point
├── config.py                   # Python application configuration (Dev/Prod/Test)
├── requirements.txt            # Python dependencies (Flask, SQLAlchemy, GenAI, pytest)
├── package.json                # Node.js project manifest & scripts ("dev": "tsx server.ts")
├── vite.config.ts              # Vite configuration with Tailwind CSS 4 & HMR controls
├── tsconfig.json               # TypeScript strict configuration with path aliases
├── index.html                  # HTML entry point with Chatora metadata & unhandled rejection guard
├── metadata.json               # AI Studio app metadata with SERVER_SIDE_GEMINI_API capability
├── server.ts                   # Full-Stack Node/Express server (authoritative in AI Studio runtime)
│
├── app/                        # Python Flask modular backend package
│   ├── __init__.py             # Flask application factory (blueprints, error handlers)
│   ├── extensions.py           # SQLAlchemy database instance
│   ├── models/
│   │   ├── conversation.py     # Conversation & ChatMessage models
│   │   └── user.py             # User model with salted password hashing
│   ├── routes/
│   │   ├── auth.py             # User registration, login, session endpoints
│   │   ├── chat.py             # Server-Sent Events (SSE) streaming endpoint
│   │   ├── conversations.py    # Conversation CRUD and management
│   │   └── health.py           # Health check endpoint
│   └── services/
│       └── ai_service.py       # Google GenAI Python SDK wrapper
│
├── src/                        # React 19 Frontend Application
│   ├── App.tsx                 # Core state management, SSE handling, shortcuts
│   ├── main.tsx                # React DOM root render
│   ├── index.css               # Approved design tokens & strict forbidden-color rules
│   └── components/
│       ├── BrandLogo.tsx       # SVG speech bubble with spark
│       ├── Composer.tsx        # Auto-resizing textarea, Stop button, file chip
│       ├── ConversationView.tsx# Chronological turns, copy actions, jump-to-latest pill
│       ├── MarkdownRenderer.tsx# Markdown parser with zero-blue syntax highlighter
│       ├── Sidebar.tsx         # Collapsible rail/drawer, live search, grouped history
│       ├── Topbar.tsx          # Model status, theme toggle, conversation options
│       ├── Toast.tsx           # Feedback toasts
│       └── modals/
│           ├── DeleteDialog.tsx# Deletion confirmation modal
│           ├── HelpModal.tsx   # Privacy transparency notice & guide
│           ├── RenameDialog.tsx# Title rename dialog
│           ├── SettingsModal.tsx# Theme, response style, and shortcuts modal
│           └── UploadModal.tsx # Document upload & text extraction modal
│
├── templates/                  # Jinja2 templates for Flask deployment
│   ├── base.html
│   ├── index.html
│   └── errors/
│       ├── 404.html
│       └── 500.html
│
├── static/                     # Static assets for Flask deployment
│   ├── css/tokens.css
│   ├── css/style.css
│   └── js/chat.js
│
├── tests/                      # Automated Python test suite
│   ├── test_chat.py            # Chat validation & mocked streaming tests
│   ├── test_conversations.py   # CRUD lifecycle tests
│   └── test_health.py          # Health endpoint assertions
│
└── docs/                       # Architectural and technical documentation
    ├── ARCHITECTURE.md
    ├── BUG_FIX_REPORT.md
    ├── CHANGELOG.md
    ├── CODEBASE_AUDIT.md
    ├── CONFIGURATION.md
    ├── INSTALLATION.md
    ├── SECURITY.md
    └── USER_GUIDE.md
```

---

## 2. Analysis of the Two Backend Implementations

### Backend 1: Full-Stack Node.js / Express (`server.ts`)
- **Framework:** Node.js 18+ / Express 4.21.2 / TypeScript via `tsx`
- **Execution Port:** `http://0.0.0.0:3000`
- **Startup Command:** `npm run dev` (`tsx server.ts`)
- **Status in AI Studio:** **AUTHORITATIVE & ACTIVE**.
- **Role & Rationale:**
  - Google AI Studio container supervisor is configured to execute Node.js dev scripts (`npm run dev`) on port 3000.
  - Express mounts Vite middlewares (`createViteServer`) to serve the responsive React 19 frontend seamlessly with zero build delays.
  - Directly connects to Google Gemini 3.8 Flash using the official `@google/genai` TypeScript SDK on the server side (`process.env.GEMINI_API_KEY`).
  - Implements:
    - `GET /health`: Health status, model information, configuration check.
    - `POST /api/chat`: Server-Sent Events (SSE) streaming chat endpoint with history context, response style prompts, and auto-titling.
    - `GET /api/conversations`: Lists conversations with summaries and counts.
    - `POST /api/conversations`: Creates new conversation.
    - `GET /api/conversations/:id`: Retrieves full message history.
    - `PATCH /api/conversations/:id`: Renames conversation.
    - `DELETE /api/conversations/:id`: Deletes single conversation.
    - `DELETE /api/conversations`: Clears all history.
    - `POST /api/upload`: Validates file format/size and extracts text up to 2MB.
    - `POST /api/auth/*`: Registration, login, and user endpoints with PBKDF2-SHA512 password hashing.

### Backend 2: Python / Flask (`app.py`, `app/`)
- **Framework:** Python 3.10+ / Flask 3.0 / SQLAlchemy / Jinja2
- **Execution Port:** `http://0.0.0.0:5000`
- **Startup Command:** `python app.py` (or `gunicorn app:app`)
- **Status in AI Studio:** **STANDALONE DORMANT EXPORT**.
- **Role & Rationale:**
  - The project brief specifically requested a complete Python Flask application structure with Jinja templates, SQLAlchemy models, and pytest suite.
  - In the Google AI Studio container environment, Python 3.10 is installed, but `pip` is intentionally omitted from the base Node container.
  - The Python backend exists as a 100% complete, standalone distribution ready for immediate deployment to dedicated Python environments (Render, Heroku, AWS, or local virtual environments) by running `pip install -r requirements.txt && python app.py`.
  - It does not compete or conflict with `server.ts` because only one process (`server.ts`) binds to port 3000 in AI Studio.

---

## 3. Root Cause Analysis: Vite WebSocket Error

### The Symptom:
```text
[vite] failed to connect to websocket
Error: WebSocket closed without opened.

Unhandled Rejection
Error: WebSocket closed without opened.
at WebSocket.<anonymous>
https://ais-dev-sulvpnnqk7yvf27aa3v7hc-554296802136.asia-east1.run.app/@vite/client:236:30
```

### Verified Root Cause:
1. **Cloud Run Reverse Proxy Protocol Incompatibility:**
   - The AI Studio development server is hosted behind a Google Cloud Run ingress reverse proxy at `https://ais-dev-...run.app`.
   - By default, Vite runs in development mode with Hot Module Replacement (HMR) enabled (`hmr: true`).
   - Vite injects `@vite/client` into `index.html`. In the browser, `@vite/client` opens `new WebSocket("wss://ais-dev-...run.app/")` to listen for file change events.
   - The Cloud Run HTTP ingress terminates or immediately closes raw WebSocket connections to the root `/` path, causing the browser's native WebSocket to trigger `onclose` immediately with `WebSocket closed without opened.`
2. **Missing In-App HMR Suppression Flag:**
   - In `vite.config.ts`, `hmr` checked `process.env.DISABLE_HMR !== 'true'`.
   - In the Cloud Run container runtime, `DISABLE_HMR` was undefined, while `process.env.APP_URL` was defined (`https://ais-dev-...run.app`).
   - Consequently, Vite continued to spin up its client-side WebSocket listener despite running in an iframe environment where HMR is not supported.

### Resolution Applied:
1. Updated `vite.config.ts` and `server.ts` to detect `APP_URL` and explicitly set `hmr: false` when hosted in the Cloud Run container.
2. Added an unhandled rejection guard in `index.html` to prevent any dev proxy WebSocket teardowns from throwing uncaught promise rejections in the browser console.

---

## 4. End-to-End Request Flow

```
[User Browser]
       │
       ▼ (HTTPS)
[Google Cloud Run Ingress] (port 443)
       │
       ▼ (HTTP proxy)
[server.ts - Express + Vite] (port 3000)
       ├── GET / ──> Vite Middleware ──> React SPA (App.tsx)
       ├── /api/conversations ──> JSON File Store (instance/conversations.json)
       └── POST /api/chat ──> Server-Sent Events (SSE)
                                   │
                                   ▼ (HTTPS, Authorization: Bearer / SDK)
                        [Google Gemini 3.8 Flash]
                                   │
                                   ▼ (Streaming Tokens)
                        [server.ts res.write]
                                   │
                                   ▼ (SSE Event Source)
                        [ConversationView Component]
```

---

## 5. Security Audit Findings

| Audit Check | Status | Verification Detail |
|---|---|---|
| Hardcoded API Keys | **PASS** | No credentials in repository or frontend bundles. API key read exclusively via `process.env.GEMINI_API_KEY`. |
| Zero Client-Side SDK | **PASS** | `@google/genai` is loaded exclusively in `server.ts` / `ai_service.py`. No browser imports. |
| Forbidden Colors | **PASS** | Automated audit verified zero instances of blue, purple, cyan, indigo, or lavender. |
| Input Boundaries | **PASS** | 8,000 character limit on prompts; 2MB limit on document uploads; 10MB payload body parser cap. |
| Non-Executable Output | **PASS** | AI code blocks rendered through syntax highlighter without `eval()` or script execution. |
| Password Storage | **PASS** | User passwords salted and hashed using PBKDF2 (Express) and Werkzeug Scrypt (Flask). |
| Resource Cleanup | **PASS** | `req.on('close')` added to terminate Gemini generation immediately when client disconnects. |
