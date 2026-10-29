# Chatora AI Configuration & Deployment Reference

This document provides a guide to configuration variables, local setup, AI API setup, and troubleshooting for Chatora AI.

---

## 1. Environment Variables

| Variable | Description | Default | Required? |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key from AI Studio | `""` | Yes (for AI generation) |
| `GEMINI_MODEL` | Google Gemini model alias | `gemini-3.8-flash` | No |
| `PORT` | Web server listening port | `3000` (Node) / `5000` (Flask) | No |
| `SECRET_KEY` | Session signing key (Python Flask) | `chatora-dev-secret-key-change-in-prod` | Yes in Production |
| `DATABASE_URL` | Database connection URI (SQLAlchemy) | `sqlite:///instance/chatora.sqlite3` | No |
| `DISABLE_HMR` | Explicitly disables Vite HMR WebSocket | Automatically detected | No |
| `APP_URL` | Public hosting URL injected by Cloud Run | Injected at runtime | No |

---

## 2. Safe Local Setup

### Running in Node.js (Full-Stack Express + React SPA)
```bash
# 1. Clone or open repository
cd chatora-ai

# 2. Install dependencies
npm install

# 3. Create .env from template
cp .env.example .env
# Edit .env and set GEMINI_API_KEY="your_api_key_here"

# 4. Start full-stack server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

### Running in Python (Flask Backend + Jinja / SQLite)
```bash
# 1. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\Activate.ps1

# 2. Install Python packages
pip install -r requirements.txt

# 3. Set environment variable
export GEMINI_API_KEY="your_api_key_here"

# 4. Run Flask app
python app.py
```
Open `http://localhost:5000` in your browser.

---

## 3. Production Deployment Commands

### Node.js Production Build & Run:
```bash
# Build Vite production assets
npm run build

# Start production server
npm run start
```

### Python Production Run (Gunicorn):
```bash
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"
```

---

## 4. Troubleshooting & Common Issues

### Issue: `WebSocket closed without opened` in browser console
- **Cause:** Dev server attempting to connect to HMR WebSocket behind a reverse proxy that closes non-upgraded sockets.
- **Solution:** Set `hmr: false` in `vite.config.ts` (already configured in v1.0.0) or set `DISABLE_HMR=true`.

### Issue: `GEMINI_NOT_CONFIGURED` Error (HTTP 503)
- **Cause:** `GEMINI_API_KEY` is not defined in the environment.
- **Solution:** In AI Studio, ensure your API key is attached in the **Secrets** panel. In local environments, set `GEMINI_API_KEY` in `.env`.

### Issue: Timeout / Deadline Exceeded on Long Queries
- **Cause:** Network latency between client and Gemini endpoints.
- **Solution:** A 60-second timeout (`timeout: 60000`) is configured in `httpOptions` to give ample generation window.
