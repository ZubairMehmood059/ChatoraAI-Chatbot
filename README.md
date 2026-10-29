# Chatora AI — A Premium AI Chatbot Web Application

[![Version](https://img.shields.io/badge/version-1.0.0-315C43.svg)](#)
[![Design](https://img.shields.io/badge/design-Bento%20Grid%20%2B%20Minimalism-315C43.svg)](#)
[![Model](https://img.shields.io/badge/model-Gemini%203.8%20Flash-315C43.svg)](#)
[![Build](https://img.shields.io/badge/build-passing-315C43.svg)](#)

Chatora AI is a production-grade, minimalist AI chatbot web application built with a purposeful **Bento Grid layout**, real-time **Server-Sent Events (SSE) streaming**, intelligent conversation management, and strict **zero-forbidden-color compliance** (warm forest green, ivory, and charcoal palette with zero blue or purple).

---

## Architecture Summary

Chatora AI supports two coordinated execution targets:

1. **Google AI Studio Target (Authoritative in Cloud Run):**
   - **Engine:** Full-stack Express 4 + Vite running on port 3000 (`server.ts`).
   - **Frontend:** React 19, Tailwind CSS 4, Lucide Icons.
   - **AI Integration:** `@google/genai` TypeScript SDK with server-side proxy security and client-disconnect cleanup.
   - **HMR WebSocket Fix:** Configured with `hmr: false` behind Cloud Run to eliminate `WebSocket closed without opened` errors.

2. **Python Standalone Target (Deployment Export):**
   - **Engine:** Python 3.10+ Flask application factory (`app.py`, `app/`).
   - **Database:** SQLAlchemy ORM models (`Conversation`, `ChatMessage`, `User`) with SQLite/PostgreSQL support.
   - **AI Integration:** `google-genai` Python SDK (`app/services/ai_service.py`).
   - **Templates:** Jinja2 templates in `templates/` and static assets in `static/`.

---

## Features

- **Bento Grid Welcome Experience:** Four prompt suggestion cards (Learn something hero, Write better, Solve a problem, Explore ideas) that populate the composer and auto-select bracketed placeholder text.
- **Server-Side Gemini 3.8 Flash Streaming:** Fast SSE streaming with multi-turn context retention, adjustable response styles (*Concise*, *Balanced*, *Detailed*), auto-titling, and Stop generating support.
- **Responsive Navigation:** Collapsible 260px sidebar, 72px rail, and mobile off-canvas drawer with backdrop scrim. Real-time search (`Ctrl + K`) and chronological grouping.
- **Code & Markdown Formatting:** Clean markdown rendering with custom zero-blue syntax highlighting and copy code feedback.
- **File Attachments:** Text and markdown document uploads up to 2MB with server-side extraction.
- **Data Ownership & Export:** Export conversations as Text (`.txt`) or Markdown (`.md`), dedicated print view (`@media print`), and full deletion controls.

---

## Quick Start

### Running in Node.js (Full-Stack Dev Server)

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack server on port 3000
npm run dev
```

Visit `http://localhost:3000`.

### Running in Python (Flask Backend)

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start Flask app on port 5000
python app.py
```

Visit `http://localhost:5000`.

---

## Documentation

Full architectural guides, audits, and fix reports are available in the [`docs/`](./docs) folder:
- [**Codebase Audit**](./docs/CODEBASE_AUDIT.md) — Comprehensive architecture and backend reconciliation.
- [**Bug Fix Report**](./docs/BUG_FIX_REPORT.md) — Root causes, fixes, and test results.
- [**Architecture**](./docs/ARCHITECTURE.md) — Authoritative backend details and request flow.
- [**Configuration**](./docs/CONFIGURATION.md) — Environment variables, local setup, and troubleshooting.
- [**User Guide**](./docs/USER_GUIDE.md) — Feature walkthroughs, shortcuts, and tips.
- [**Security Guide**](./docs/SECURITY.md) — Secrets isolation, input limits, and hardening.
- [**Changelog**](./docs/CHANGELOG.md) — Version history and releases.

---

## License

Apache-2.0
