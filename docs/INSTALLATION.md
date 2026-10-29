# Chatora AI Installation & Setup Guide

This guide details how to install, configure, and run **Chatora AI** in both development and production environments.

---

## 1. Prerequisites

- **Node.js**: Version 18+ (for full-stack dev server and React client)
- **Python**: Version 3.10+ (for Python Flask backend and pytest suite)
- **Google Gemini API Key**: Free or paid key from [Google AI Studio](https://aistudio.google.com/)

---

## 2. Quick Start (AI Studio / Full-Stack Node Environment)

The AI Studio preview runs the full-stack server on port 3000:

```bash
# 1. Install Node dependencies
npm install

# 2. Start full-stack server (serves React frontend with Express API & Gemini streaming)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 3. Running the Python Flask Backend Locally

Chatora AI includes a standalone Python Flask backend with SQLite persistence, SQLAlchemy ORM, and Google GenAI Python SDK.

### Linux / macOS:

```bash
# 1. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Create .env file with your Gemini API key
cp .env.example .env
# Edit .env and enter GEMINI_API_KEY=your_key_here

# 4. Start Flask server
python app.py
```

### Windows (PowerShell):

```powershell
# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
Copy-Item .env.example .env

# 4. Run application
python app.py
```

The Flask server will start at `http://localhost:5000`.

---

## 4. Running Automated Tests

To run the automated pytest test suite for the Python backend:

```bash
pytest -v
```

All tests mock external AI calls to avoid consuming API credits during continuous integration.
