Continue working on my existing Chatora AI project. The `motion-dom` build issue has reportedly been fixed.

My next goal is production-ready Login/Register authentication and Netlify deployment.

1. Audit the existing authentication, database/storage, Express backend, API routes, and frontend before changing code.
2. Integrate Supabase Auth for email/password registration, login, email verification, logout, session restoration, and password reset.
3. Verify authentication tokens on protected backend endpoints. Enforce per-user authorization for conversations and private data.
4. Keep the Gemini API key and all privileged secrets on the server. Never expose service-role keys or private API keys in frontend variables.
5. Preserve existing Gemini streaming, conversation history, themes, animations, and UI.
6. Audit whether the current Express backend can run on Netlify Functions without breaking streaming, persistence, or other features. If not, recommend a suitable separate backend host while keeping the frontend on Netlify.
7. Configure production builds, API routing, SPA redirects, environment variables, authentication redirects, and deployment documentation.
8. Test registration, verification, login, logout, password reset, session restoration, unauthorized requests, conversation privacy, and production build.
9. Report exact files changed, required environment variables, deployment steps, and tests actually passed.

Do not rebuild the application from scratch, introduce mock authentication, expose secrets, or claim deployment readiness without verifying the complete production architecture.