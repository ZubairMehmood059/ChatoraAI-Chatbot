# CHATORA AI — COMPLETE CODEBASE AUDIT, BACKEND RECONCILIATION & BUG FIX MASTER PROMPT

Act as a senior software architect, Python/Flask backend engineer, frontend engineer, debugging specialist, security auditor, and QA engineer.

## PROJECT CONTEXT

Project name: Chatora AI.

The existing project was built successfully in Google AI Studio, but it has unresolved issues:

1. There appear to be two backend implementations or backend entry points. Their exact relationship is unknown.
2. The application displays this Vite error:

```text
[vite] failed to connect to websocket
Error: WebSocket closed without opened.

Unhandled Rejection
Error: WebSocket closed without opened.
at WebSocket.<anonymous>
https://ais-dev-sulvpnnqk7yvf27aa3v7hc-554296802136.asia-east1.run.app/@vite/client:236:30
```

3. Other runtime, integration, configuration, architecture, or deployment issues may exist.

Google AI Studio currently hosts the project. Antigravity is temporarily unavailable, so perform as much repository analysis, debugging, and verification as the current environment supports.

## PRIMARY OBJECTIVE

Thoroughly inspect the entire existing codebase, discover the root causes of all identifiable issues, fix the issues safely, and verify the result.

**Do not rebuild the application from scratch. Do not replace working features with placeholders. Do not assume that the visible WebSocket error is the only problem.**

Treat the actual project files as the source of truth for the implementation. Follow the supplied PRD, `design.md`, and any approved final design specification. If a required document is unavailable, explicitly report that rather than inventing its contents.

## PHASE 1 — FULL CODEBASE DISCOVERY

Before modifying files:

1. Inspect the complete project directory and identify all relevant files, including:
   - Backend entry points and application factories
   - Frontend entry points and components
   - `package.json` and lockfiles
   - Python dependency manifests such as `requirements.txt` or `pyproject.toml`
   - Vite configuration and development scripts
   - Flask routes, API endpoints, middleware, and authentication
   - Environment variable usage and configuration files
   - Database models, migrations, and connection configuration
   - API clients and AI provider integrations
   - Build, deployment, and runtime configuration
   - Tests, logs, and documentation

2. Identify both suspected backends precisely. For each, report:
   - File path and framework
   - Startup command and entry point
   - Routes and features it implements
   - Database and AI-provider integrations
   - Authentication and session handling
   - Dependencies and environment variables
   - Whether it is active, unused, duplicated, partially integrated, or conflicting

3. Trace the actual request flow:

   Browser → frontend → API client/proxy → backend → AI provider/database → response → UI.

4. Create an audit report before making architectural changes.

Do not assume that two backend files mean two independent running servers. Verify how the project starts and which implementation the frontend actually calls.

## PHASE 2 — ROOT-CAUSE ANALYSIS OF THE VITE WEBSOCKET ERROR

Investigate the error using the actual configuration and runtime evidence.

Check:

- Whether Vite is running as a development server or the application is supposed to use a production build.
- Whether the frontend is being served by a preview URL, proxy, embedded environment, or separate application server.
- Vite `server.host`, `server.port`, `server.strictPort`, `server.hmr`, WebSocket protocol, hostname, and client port settings where relevant.
- Reverse proxy and WebSocket upgrade support.
- HTTP/HTTPS and `ws://`/`wss://` mismatches.
- Port conflicts, process termination, failed startup scripts, and unreachable dev-server ports.
- Whether the application is incorrectly trying to connect to a development HMR WebSocket after deployment.
- Whether frontend API requests and Vite HMR connections are being confused.
- Browser console and server logs, if accessible.

Important distinctions:

- Vite HMR WebSocket is normally for development hot-module replacement. It is not the chatbot's backend API connection.
- A failed HMR connection does not by itself prove that the backend is broken.
- Do not hardcode an arbitrary WebSocket URL or public port just to silence the error.
- Do not disable error reporting while leaving the underlying problem unresolved.
- If the app is meant to run in production, prefer a correct production build served through the intended deployment architecture, rather than exposing a development server.
- If the current AI Studio environment requires its own preview/HMR mechanism, preserve the supported environment configuration instead of applying incompatible production settings.

Determine the real root cause from evidence. If the environment does not expose sufficient logs or configuration, state what is confirmed, what remains uncertain, and the next diagnostic step.

## PHASE 3 — BACKEND RECONCILIATION

Determine which backend architecture the existing project is intended to use.

The preferred long-term architecture for Chatora AI is Python-first:

- Flask
- Jinja templates where server-rendered pages are appropriate
- HTML, CSS, and vanilla JavaScript where appropriate
- SQLAlchemy
- SQLite for local development
- PostgreSQL-compatible production configuration
- Official Google GenAI Python SDK for Gemini integration
- Pytest for backend tests

However, inspect the actual working project before enforcing this architecture.

If the existing frontend is a Vite-based React/TypeScript application and one backend is Python while the other is Node/Express:

1. Explain why both were created and whether both are required.
2. Identify the intended frontend-to-backend contract.
3. Determine whether the second backend is redundant or genuinely needed.
4. Avoid running two competing servers on the same port.
5. Avoid maintaining duplicate implementations of authentication, chat, AI integration, or database access.
6. Prefer one clearly defined authoritative backend.
7. Preserve working functionality and existing data.
8. Do not rewrite React into Flask/Jinja, remove a backend, delete files, or perform a major migration without first presenting the evidence, migration impact, and safest option.

If a major architectural migration is required, document it separately and ask for approval before destructive or broad changes. Fix safe, isolated bugs first.

## PHASE 4 — FULL APPLICATION AUDIT

Inspect and test every relevant feature, not just the home page.

### Frontend
- Startup and rendering
- Browser console errors
- Broken imports and missing dependencies
- API request URLs and response parsing
- Loading, success, empty, and error states
- Authentication forms
- Chat composer and message rendering
- Theme switching and persistence
- Responsive layout
- Accessible keyboard interactions

### Backend
- Startup and route registration
- Request validation and response formats
- Authentication and authorization
- Session and CSRF protection where applicable
- Database connectivity and persistence
- AI API configuration and error handling
- Timeouts, rate limits, and provider failures
- File uploads, if implemented
- Logging and exception handling

### Integration
- Frontend endpoint URLs match actual backend routes.
- CORS and proxy configuration are appropriate.
- Request payloads and response schemas match.
- Secrets are read from environment variables.
- Missing API keys produce clear setup errors.
- No fake AI responses masquerade as real model output.

### Build and deployment
- Dependency manifests are consistent.
- The documented start command works.
- Build scripts are valid.
- Environment variables are documented.
- Production and development configurations are not accidentally mixed.
- No secrets or local-only paths are embedded in production configuration.

## PHASE 5 — SECURITY AUDIT

Check for:

- Hardcoded API keys, tokens, and credentials
- Secrets accidentally committed to the repository
- Weak password storage or authentication logic
- Missing ownership checks on user-specific data
- Broken session configuration
- Unsafe HTML or Markdown rendering
- SQL injection and unsafe file handling
- Inadequate request validation
- Sensitive information in logs
- Insecure CORS or debug configuration
- Missing rate limits on sensitive endpoints

Never print secret values into the audit report. Redact them. Do not rotate credentials, alter production data, or perform destructive actions without explicit approval.

## PHASE 6 — IMPLEMENT FIXES

After the audit:

1. Fix verified, low-risk issues in a logical order.
2. Prioritize application startup, the WebSocket/HMR root cause, frontend-to-backend connectivity, and the two-backend conflict.
3. Fix related runtime and integration bugs that can be safely resolved.
4. Keep existing features working.
5. Reuse established project conventions and avoid unnecessary new dependencies.
6. Make small, traceable changes.
7. Do not replace real functionality with mocks, static responses, or hardcoded success messages.
8. Do not silently delete or disable features to make the error disappear.
9. Keep the UI consistent with the approved design and its strict color restrictions.
10. Update relevant documentation and configuration examples.

If a fix depends on unavailable services, credentials, permissions, or runtime access, implement only the safe portion and clearly identify the remaining blocker.

## PHASE 7 — VERIFICATION

Run the checks available in the current environment.

At minimum, where supported:

- Install or verify dependencies using the project's existing manifest.
- Run frontend linting and build checks if configured.
- Run Python syntax checks and pytest if applicable.
- Test backend startup.
- Test important API endpoints.
- Test frontend-to-backend communication.
- Test database initialization and persistence where safe.
- Test the chatbot with a real configured AI provider when credentials are available.
- Verify the WebSocket/HMR issue is resolved in the intended environment.
- Check that the browser console no longer reports the same error.
- Confirm existing core features still work.

Do not claim that a test passed unless you actually executed it and observed its result. Distinguish static inspection from runtime verification.

## PHASE 8 — REQUIRED DELIVERABLES

Produce:

1. `docs/CODEBASE_AUDIT.md`
   - Project structure
   - Actual architecture
   - Both backend implementations and their relationship
   - Root causes, evidence, severity, and affected files

2. `docs/BUG_FIX_REPORT.md`
   - Each discovered issue
   - Root cause
   - Files changed
   - Fix applied
   - Test performed
   - Actual result
   - Remaining limitations

3. `docs/ARCHITECTURE.md`
   - Authoritative backend
   - Frontend-to-backend request flow
   - Startup commands
   - Development versus production architecture
   - Environment variables and service dependencies

4. `docs/CONFIGURATION.md`
   - Required environment variables
   - Safe local setup
   - AI API configuration
   - Development and production commands
   - Troubleshooting instructions

5. Updated `README.md`
   - Prerequisites
   - Installation
   - Configuration
   - Run commands
   - Tests
   - Deployment notes
   - Known limitations

6. A final concise summary containing:
   - Issues discovered
   - Root cause of the Vite error
   - Which backend is authoritative and why
   - Files changed
   - Tests actually run and results
   - Remaining issues and blockers
   - Exact next steps for Antigravity

## OPERATING RULES

- Inspect first; change second.
- Be evidence-driven and honest.
- Do not invent files, commands, dependencies, test results, or runtime behavior.
- Do not expose or request API keys in chat.
- Do not overwrite user work or destroy data.
- Do not rebuild the project from scratch.
- Do not perform a major backend migration without approval.
- If a task cannot be completed in the current environment, explain the exact limitation and provide the required next action.
- Keep a running checklist and update it as work progresses.
- Continue through the safe audit, fix, and verification steps instead of stopping after merely listing problems.

**Start now with Phase 1: inspect the entire available codebase and report the exact two backend implementations. Then investigate the Vite WebSocket error from its root cause. Do not begin by changing random Vite settings.**