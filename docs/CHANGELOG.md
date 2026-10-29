# Chatora AI Changelog

All notable changes to the Chatora AI project are documented in this file.

---

## [v1.1.0] - 2026-10-27

### Added
- **Reusable Frontend API Service Layer (`src/services/api.ts`):**
  - Consolidated all backend API communication (health check, conversation CRUD, pinning, uploads, and SSE chat streaming).
  - Clean callback lifecycle (`onStart`, `onChunk`, `onDone`, `onError`) with abort controller support.
- **Conversation Pinning & Favorites:**
  - Pinned conversations section prioritized at the top of the conversation list.
  - Quick pin/unpin toggles in sidebar context menus with real-time UI updates.
  - Full backend persistence in `server.ts` (`PATCH /api/conversations/:id`) and synchronized SQLAlchemy ORM model in Python Flask (`app/models/conversation.py`).
- **Enhanced Welcome Screen Bento Categorization:**
  - Interactive category chips: All Suggestions, Study, Coding, Writing, Research, Productivity.
  - Curated prompts per category with prompt insertion and 1-click "Ask now" immediate dispatch.
- **Language Preference Personalization:**
  - Preferred language selector in Settings (Auto, English, Spanish, French, German, Japanese, Chinese, Arabic, Urdu, Hindi).
  - Real-time backend system instruction injection to enforce response language consistently.
- **Upstream Resilience & Auto-Fallback:**
  - Automatic fallback from `gemini-3.8-flash` to `gemini-flash-latest` if upstream servers encounter temporary peak capacity (HTTP 503).
  - Human-friendly, actionable error handling for rate limits (HTTP 429) and timeouts (HTTP 504) with diagnostic request IDs.
  - Active client disconnect detection (`req.on('close')`) to immediately abort upstream streaming when the user stops or leaves.

---

## [v1.0.0] - 2026-10-26

### Added
- **Full Bento Grid Welcome Screen:**
  - 4 purposeful cards (Learn something hero, Write better, Solve a problem, Explore ideas).
  - Clicking any prompt fills composer and selects bracketed placeholder text.
- **Server-Side Gemini 3.8 Flash Integration:**
  - Real-time Server-Sent Events (SSE) streaming.
  - Context retention across multi-turn conversations.
  - Three adjustable response styles (Concise, Balanced, Detailed).
  - Automated title generation from initial user message.
- **Collapsible Responsive Sidebar:**
  - Expanded mode (260px), collapsed rail (72px), and mobile off-canvas drawer (320px with backdrop scrim).
  - Real-time conversation search and chronological grouping (Today, Yesterday, Previous 7 days, Older).
- **Core Chat Actions:**
  - Send via Enter / Button, multiline via Shift + Enter.
  - Real-time Stop Generating button during streaming.
  - Regenerate response for assistant turns.
  - Copy response and code blocks with visual feedback.
  - Floating Jump-to-Latest pill when user scrolls upward.
- **File Upload & Extraction:**
  - Support for text and markdown documents with chip preview and server-side text extraction.
- **Conversation Management:**
  - Create, rename, delete, clear all history with safety confirmation modals.
  - Export as Text (.txt) and Markdown (.md).
  - Dedicated print view stylesheet (`@media print`).
- **Strict Zero-Forbidden-Color Palette:**
  - Complete elimination of blue/purple hues.
  - Approved warm palette (Forest green `#315C43`, Ivory `#F6F3EB`, Charcoal `#242922`, Sage `#A7B7A0`, Amber `#D7A64A`).
  - High-contrast inputs (`--border-strong`), accessible 2px focus ring.
- **Python Flask Architecture & Tests:**
  - Flask application factory with SQLAlchemy ORM and models (`Conversation`, `ChatMessage`, `User`).
  - Automated pytest test suite covering health, conversation CRUD, and mocked AI streaming.
- **Complete Documentation Suite:**
  - User Guide, Installation, Architecture, Security, Configuration, and Changelog.
