# Chatora AI Security Guide

Security is a foundational requirement of Chatora AI. This document outlines the safeguards and hardening policies applied to the project.

---

## 1. Secrets & Credentials Management

- **Zero Client-Side Keys:** The Google Gemini API key (`GEMINI_API_KEY`) is stored strictly in server-side environment variables and is never transmitted to the browser or bundled in frontend client code.
- **`.env` Exclusion:** `.env` is explicitly included in `.gitignore` to prevent accidental credential commits.
- **Fail-Safe Missing Key Behavior:** When `GEMINI_API_KEY` is missing or invalid, the backend returns a clear `GEMINI_NOT_CONFIGURED` status error with guidance, rather than fabricating a simulated response.

---

## 2. Input Validation & Request Limits

- **Message Length:** Incoming user messages are strictly capped at 8,000 characters. Requests exceeding this limit receive a `400 Bad Request`.
- **Payload Limits:** Maximum incoming payload size is limited to 10MB to mitigate denial-of-service attempts.
- **File Upload Verification:** Document attachments are validated by file extension, size (<= 2MB), and extracted as plain text only. Executable formats are strictly rejected.

---

## 3. Cross-Site Scripting (XSS) & Code Execution

- **Zero Code Execution:** Chatora AI displays programming code in syntax-highlighted blocks with copy affordances. AI responses or user code are never evaluated with `eval()` or executed in the runtime.
- **HTML Sanitization:** All rendered Markdown strings are parsed into clean semantic HTML elements with no `style` attributes, `javascript:` URLs, or inline execution handlers.

---

## 4. Session & Authentication Security

- **Password Hashing:** User passwords (when authentication is enabled) are hashed using `werkzeug.security.generate_password_hash` with secure salting.
- **Anti-Enumeration:** Login authentication failures return generic messages ("Email or password is incorrect") to prevent account enumeration.
- **Scoped Data Access:** Conversations are isolated per session/user id.

---

## 5. Security Checklist for Production

- [x] Server-side API key injection
- [x] Input size and payload limits
- [x] Non-executable code presentation
- [x] Overridden browser autofill and focus styles
- [x] Secure password hashing
- [x] Excluded credentials from source control
