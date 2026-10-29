# MASTER PROMPT — CHATORA AI v1.0
## Google AI Studio | Python-First Implementation

Act as a senior Python application architect, UI/UX designer, frontend engineer, application security engineer, and QA engineer.

Your task is to build **Chatora AI v1.0**, a polished, functional, secure, and maintainable AI chatbot application from scratch, following the supplied project references.

This is a real software project, not just a visual mockup. Prioritize Python compatibility, accurate implementation, fast performance, maintainability, and a premium user experience.

## 1. SOURCE-OF-TRUTH FILES

I have provided these references:

1. `design.md` — approved design system, visual rules, and UI/UX requirements.
2. `prd.md` — product requirements, features, and expected behavior.
3. Review image — visual reference for the intended appearance.

Read all three before implementation.

Rules:
- Treat `prd.md` as the source of truth for product requirements.
- Treat `design.md` as the source of truth for visual design and color restrictions.
- Use the review image to understand visual hierarchy, spacing, composition, and styling. Do not blindly copy any element that conflicts with the written specifications.
- Do not invent undocumented features or claim that incomplete functionality is working.
- If the documents conflict, identify the conflict and apply the explicit security, architecture, and design constraints. Ask only when a critical decision cannot reasonably be resolved.
- Reuse no imaginary code, files, integrations, credentials, or existing infrastructure.
- Do not claim to have read, modified, tested, or created anything unless you actually have.

## 2. CRITICAL ARCHITECTURE — PYTHON FIRST

**Chatora AI is a Python-based application. This requirement takes priority over framework defaults.**

Use the following architecture:

- Backend: Python with Flask.
- Templates: Jinja2, stored in `templates/`.
- Frontend: semantic HTML, CSS, and vanilla JavaScript.
- Static assets: `static/css/`, `static/js/`, and `static/images/`.
- Database: SQLAlchemy with SQLite for local development and PostgreSQL-compatible configuration for production.
- Database migrations: Flask-Migrate/Alembic where appropriate.
- Configuration: environment variables loaded server-side.
- AI integration: a dedicated Python service module using the official Google GenAI Python SDK.
- Tests: pytest.
- Deployment: a documented Python-compatible production deployment configuration.

Do not replace this architecture with React, Next.js, Node.js, or a separate JavaScript backend. Do not introduce a frontend build system unless a documented requirement makes it necessary.

If the current environment cannot run a Flask application, generate compatible project files and explain the limitation. Do not silently substitute a different stack.

Keep routes, database models, services, configuration, templates, and static assets modular. Avoid putting the entire application into one giant Python file.

## 3. VISUAL DESIGN — STRICT REQUIREMENTS

Implement the design described in `design.md` and the supplied review image.

The design philosophy is:

**Minimalism combined with a Bento Grid layout.**

The experience should be premium, warm, friendly, spacious, consistent, and easy to understand.

Required visual elements:
- Chatora AI brand identity.
- Collapsible left sidebar.
- New Chat action and searchable conversation history.
- Spacious main chat area.
- Purposeful Bento Grid welcome screen.
- Prompt suggestion cards.
- Readable user and assistant messages.
- Modern message composer.
- Markdown and code-block presentation.
- Responsive desktop, tablet, and mobile layouts.
- Light and dark themes.
- Clean settings and authentication screens where required by the PRD.

### Absolute forbidden-color rule

Never use blue, navy, purple, violet, indigo, cyan, lavender, periwinkle, or any shades, tints, gradients, shadows, or derived colors based on those hues.

This applies to:
- Every page and component.
- Light and dark themes.
- Buttons, links, hover and focus states.
- Icons, borders, backgrounds, shadows, and gradients.
- Loading animations and progress indicators.
- Third-party library defaults.
- Code syntax highlighting and browser interaction states.

Use only the approved design tokens from `design.md`. Do not introduce unapproved color literals.

## 4. FAST, SMOOTH, RESPONSIVE INTERACTIONS

The application must feel fast and smooth without unnecessary animation.

Requirements:
- Use lightweight CSS transitions and animations.
- Keep most interaction transitions around 150–220 ms.
- Avoid excessive blur, large shadows, continuous background animations, and expensive effects.
- Respect `prefers-reduced-motion`.
- Avoid layout shifts and unnecessary rerenders.
- Use asynchronous requests for operations that should not block the interface.
- Provide clear loading, success, empty, and error states.
- Prevent accidental duplicate submissions.
- Keep controls responsive while requests are processing.
- Use streaming AI responses when supported by the actual backend.
- Support stopping an active generation when the implementation supports it.
- Make the sidebar, menus, dialogs, and composer work correctly on mobile.
- Avoid horizontal overflow and ensure touch-friendly controls.

Do not fake performance with animations while the underlying operation is failing or unfinished.

## 5. IMPLEMENTATION PLAN

Work through the following phases in order. Complete and verify each phase before moving to the next.

### Phase 1 — Requirements and architecture

1. Read all supplied references.
2. Summarize the requirements and identify ambiguities.
3. Produce a short implementation plan.
4. Define the Python project structure.
5. Define routes, database models, service boundaries, configuration, and testing strategy.
6. Identify which requirements are feasible in the current environment.

Do not start by generating an unrelated framework or generic dashboard.

### Phase 2 — Python foundation

Create the application structure, including:

- Flask application factory.
- Configuration management.
- Environment-variable handling.
- Database models and initialization.
- Reusable Jinja templates.
- Static CSS and JavaScript.
- Error pages and safe error handling.
- Health endpoint.
- Dependency manifest.
- Local startup instructions.

Keep secrets out of source code and browser bundles.

### Phase 3 — Frontend implementation

Implement the approved UI in the existing Python-compatible structure.

Build:
- Application shell.
- Responsive collapsible sidebar.
- Welcome screen and Bento Grid.
- Prompt suggestions.
- Conversation view.
- Message composer.
- Markdown and code blocks.
- Theme toggle and persistence.
- Menus, dialogs, loading states, and error states.
- Authentication UI when required by the PRD.

Every visible control must have a defined behavior. Do not include fake buttons or decorative controls that imply unsupported functionality.

At the end of this phase, verify the frontend independently before connecting the AI provider.

### Phase 4 — Real AI integration

Create a dedicated AI provider service in Python.

Requirements:
- Use the official Google GenAI Python SDK.
- Keep provider-specific logic out of frontend JavaScript.
- Use server-side configuration for the model and API key.
- Implement timeouts, safe exception handling, and appropriate request limits.
- Support conversation context according to the PRD.
- Implement streaming only if supported by the selected model and SDK.
- Prevent unintended duplicate requests.
- Handle provider failures without losing existing conversation history.
- Never return fake assistant answers as a successful AI response.

Do not guess SDK methods or model identifiers. Use the current official documentation or installed package information to verify the correct integration.

### Phase 5 — Persistence and required product features

Implement the features required by `prd.md`, including applicable items such as:

- User registration, login, logout, and secure sessions.
- Persistent user-specific conversations and messages.
- Creating, searching, renaming, opening, and deleting conversations.
- Concise, Balanced, and Detailed response styles if required by the approved PRD.
- Copy and regenerate actions where specified.
- Stop generation where supported.
- Light and dark theme persistence.
- Secure document uploads only if they are included in the approved v1.0 scope.

Do not add deferred features simply to make the application appear more advanced.

Every database operation involving a user must enforce ownership and authorization on the server.

### Phase 6 — Security hardening

Follow security best practices appropriate to a Python web application.

**Configuration and secrets**
- Keep real API keys and secrets in environment variables.
- Provide `.env.example` with placeholder values only.
- Never commit a real `.env` file.
- Never expose credentials to browser code, HTML, JavaScript, or public logs.
- Require a strong secret key in production.
- Fail safely when required production configuration is missing.

**Authentication and sessions**
- Hash passwords using a suitable password-hashing library.
- Use secure, HTTP-only cookies and appropriate SameSite settings.
- Enable HTTPS-only cookies in production.
- Protect state-changing requests against CSRF.
- Apply authorization checks to every private resource.
- Prevent insecure direct object references and user-to-user data access.

**Application and API security**
- Validate inputs server-side.
- Use ORM parameterization and avoid unsafe SQL construction.
- Configure security headers and an appropriate Content Security Policy.
- Apply rate limiting to authentication and AI endpoints.
- Limit request sizes and enforce timeouts.
- Avoid leaking stack traces, secrets, prompts, or internal errors.
- Sanitize rendered Markdown and HTML.
- Never execute code received from an AI response.
- Restrict CORS if it is needed; do not enable unrestricted cross-origin access without justification.

**File handling, if enabled**
- Validate file type, size, and content.
- Use safe storage locations and generated filenames.
- Prevent path traversal and malicious file handling.
- Keep uploaded files private by default.
- Do not trust file extensions alone.

No application can honestly be guaranteed impossible to hack. Implement appropriate protections, run available checks, and document any remaining risks.

### Phase 7 — Documentation

Create a root `README.md` and a `docs/` folder containing these six important, readable files:

1. `docs/USER_GUIDE.md`
   - Explain how normal users use Chatora AI.
   - Cover new chats, history, settings, theme switching, and supported features.
   - Use simple language and clear examples.

2. `docs/INSTALLATION.md`
   - Explain prerequisites, virtual environment setup, dependency installation, database initialization, and local startup.
   - Provide commands for Windows PowerShell and Linux/macOS where relevant.

3. `docs/ARCHITECTURE.md`
   - Explain the Flask architecture, project folders, request flow, AI service, database, templates, and static assets.
   - Include a small readable architecture diagram if appropriate.

4. `docs/SECURITY.md`
   - Document authentication, sessions, CSRF, authorization, secrets, rate limits, input validation, data privacy, and known security limitations.
   - Never include actual credentials.

5. `docs/CONFIGURATION.md`
   - List environment variables, their purpose, safe example values, development versus production configuration, and required setup steps.
   - Explain how to configure the Gemini API key without publishing it.

6. `docs/CHANGELOG.md`
   - Record implemented versions, meaningful changes, bug fixes, and known limitations.
   - Do not invent completed work.

Documentation must match the actual implementation. Do not claim features exist merely because they are listed in the PRD.

Keep the documentation concise, well organized, and readable for beginners.

### Phase 8 — Testing and verification

Use pytest and any appropriate lightweight frontend checks.

Verify:
- Application starts correctly.
- Required routes work.
- Database initialization and migrations work.
- Authentication and authorization behave correctly.
- One user cannot access another user's conversations.
- AI provider errors and timeouts are handled safely.
- Input validation and CSRF protections work where applicable.
- Core chat workflows work end to end when credentials are configured.
- Theme switching and persistence work.
- Responsive layouts work.
- Buttons and menus behave as intended.
- Keyboard accessibility and reduced-motion behavior are respected.
- No prohibited colors appear in CSS, gradients, focus states, or component defaults.
- No secrets are exposed in tracked files or browser bundles.

Mock the AI provider in automated tests so tests can run without consuming API credits. Clearly distinguish mocked tests from real provider integration tests.

Run the tests available in the environment. Report actual commands and results. Fix failures before declaring a phase complete.

### Phase 9 — Release preparation

Provide:
- Final project structure.
- Implemented feature list.
- Files created and modified.
- Dependency and database setup instructions.
- Local startup commands.
- Test results and any tests that could not be run.
- Environment variable reference.
- Production deployment instructions.
- Remaining limitations and security considerations.

Do not create a GitHub repository, publish the app, or deploy to production without my approval.

## 6. FINAL API KEY SETUP — LAST STEP

**Handle the Gemini API key only at the final configuration stage, after the application structure, frontend, backend, and tests are prepared.**

Do not ask me to paste a secret key into the chat or place it in source code.

At the end:

1. Explain where to obtain a Gemini API key from the official Google AI Studio interface.
2. Show how to create a local `.env` file from `.env.example`.
3. Show the exact environment-variable name expected by the implemented service.
4. Use a placeholder in all examples, such as `GEMINI_API_KEY=your_key_here`.
5. Ensure `.env` is excluded from version control.
6. Explain how to configure the key securely in the deployment environment later.
7. Run a real AI integration check only when a valid key is available and the user has configured it.

Do not invent a key, claim the integration was verified without credentials, or expose any real secret in logs or screenshots.

## 7. STRICT WORKING RULES

- Implement incrementally and accurately.
- Prefer the simplest maintainable solution that meets the requirements.
- Keep the Python architecture as the priority.
- Do not regenerate unrelated files or discard completed work.
- Do not silently omit requirements.
- Do not introduce unnecessary dependencies.
- Do not use hardcoded mock responses as a substitute for AI integration.
- Do not claim unverified success.
- Do not commit credentials.
- Do not perform destructive actions or public deployment without approval.
- If the environment cannot perform an operation, state the limitation and provide the correct next step.
- Keep progress updates concise and report verified results.

## SUCCESS CRITERIA

Chatora AI v1.0 should be a real, responsive, Python-based AI chatbot with the approved minimalist Bento Grid design, working core functionality, persistent data, secure configuration, readable documentation, tested workflows, and clear setup instructions.

**Start by inspecting all references and confirming the implementation plan. Then implement the project step by step, verifying each phase before continuing.**