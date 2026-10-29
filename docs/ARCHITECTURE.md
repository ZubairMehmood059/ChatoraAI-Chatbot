# Chatora AI Architecture Specification

Chatora AI is architected for high-performance conversational intelligence, minimalist visual design, and flexible hosting.

---

## 1. System Topology & Dual-Target Design

```
                     ┌────────────────────────────────┐
                     │          Browser Client        │
                     │  - React 19 UI (Tailwind 4)    │
                     │  - Bento Grid & Markdown view  │
                     │  - Zero Forbidden Colors       │
                     └───────────────┬────────────────┘
                                     │
                    HTTPS Requests & SSE (Port 3000)
                                     │
               ┌─────────────────────▼──────────────────────┐
               │    Target 1: Google AI Studio Runtime      │
               │           (Authoritative)                  │
               │   - server.ts: Express + Vite Middleware   │
               │   - Port: 3000                             │
               │   - In-memory / JSON persistence           │
               │   - @google/genai TypeScript SDK           │
               │   - Client disconnect termination          │
               └─────────────────────┬──────────────────────┘
                                     │
                                     ▼
                        [Google Gemini 3.8 Flash]
                                     ▲
                                     │
               ┌─────────────────────┴──────────────────────┐
               │    Target 2: Dedicated Python Environment   │
               │           (Standalone Export)              │
               │   - app.py / app/ package: Flask 3.0       │
               │   - Port: 5000 (or custom WSGI / Gunicorn) │
               │   - SQLAlchemy (SQLite / PostgreSQL)       │
               │   - google-genai Python SDK                │
               │   - Jinja2 Templates & Vanilla JS          │
               └────────────────────────────────────────────┘
```

---

## 2. Authoritative Backend Details

### In Google AI Studio: `server.ts`
- **Why it is Authoritative:**
  Google AI Studio supervisor starts `npm run dev` (`tsx server.ts`) inside a Node.js container on port 3000. `server.ts` directly handles all client API requests and mounts Vite middlewares to compile and serve the React frontend without a separate build step.
- **API Surface:**
  - `GET /health` — Verifies server health and Gemini configuration.
  - `POST /api/chat` — Server-Sent Events (SSE) streaming proxy. Passes conversation history, applies style parameters (*Concise*, *Balanced*, *Detailed*), generates titles, and stops generation when the client aborts.
  - `GET /api/conversations` — Summarizes existing conversations.
  - `POST /api/conversations` — Creates a new conversation.
  - `GET /api/conversations/:id` — Retrieves all messages in a conversation.
  - `PATCH /api/conversations/:id` — Renames conversation.
  - `DELETE /api/conversations/:id` — Deletes single conversation.
  - `DELETE /api/conversations` — Clears all conversations.
  - `POST /api/upload` — Extracts text from uploaded `.txt`, `.md`, `.json`, `.csv`, `.py`, `.js`, `.ts` files up to 2MB.
  - `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` — User authentication endpoints.

### In Dedicated Python Hosting: `app.py`
- When deployed to a Python environment (e.g., Render, Railway, AWS, or local virtualenv), `python app.py` serves the Flask application factory with identical routes, Jinja templates in `templates/`, and SQLite or PostgreSQL database models.

---

## 3. Frontend-to-Backend Contract

All frontend requests use relative paths (`/api/*`), ensuring seamless routing regardless of whether the backend is `server.ts` or Flask:

```ts
// Example: Sending a message with SSE
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  signal: abortController.signal,
  body: JSON.stringify({
    conversationId,
    message,
    history: contextMessages,
    responseStyle: 'balanced',
  }),
});
```

---

## 4. Forbidden-Color Architecture

Chatora AI strictly complies with the design specification:
- **Prohibited hues:** Blue, navy, indigo, purple, violet, cyan, teal, lavender, periwinkle.
- **Approved tokens:**
  - Primary Forest Green: `--primary: #315C43` (light) / `#A7B7A0` (dark)
  - Surface Ivory: `--bg: #F6F3EB` (light) / `#191D19` (dark)
  - Charcoal Ink: `--text: #242922` (light) / `#F3F0E8` (dark)
  - Muted Moss: `--text-muted: #686B61` (light) / `#B4B8AC` (dark)
  - Warm Amber: `--amber: #D7A64A`
  - Error Red: `--error: #A63D40` (light) / `--error-surface: #F7E6E4`
  - High-Contrast Borders: `--border-strong: #858880` (light) / `#7A8477` (dark)
- Explicit overrides for text selection, links, focus rings, carets, and form autofill prevent browser default blue styles.
