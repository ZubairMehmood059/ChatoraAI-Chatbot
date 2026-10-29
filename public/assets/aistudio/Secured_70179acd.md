# Chatora AI — Production Website, SEO, Privacy & Security Enhancement Sprint

Act as a senior full-stack engineer, application security engineer, SEO specialist, accessibility expert, and QA engineer.

## 1. Primary objective

Upgrade my existing Chatora AI project into a polished, secure, accessible, SEO-ready, production-quality AI chatbot website.

**IMPORTANT: Audit the existing codebase before modifying anything. Do not rebuild the application from scratch.**

The current project includes:
- React 19 + TypeScript + Vite frontend.
- Express + TypeScript backend in `server.ts`.
- Google Gemini API integration with streaming responses.
- Authentication and conversation persistence.
- Typed API client in `src/services/api.ts`.
- Conversation pinning, categorized starter prompts, response-language preferences, and light/dark themes.
- A separate Flask/Jinja/SQLAlchemy backend export. Do not remove it or migrate the application to it in this sprint.

The existing Express backend is currently the active runtime. Keep the current architecture and API contracts unless a demonstrated issue requires a minimal, backward-compatible fix.

## 2. Mandatory workflow

Before coding:

1. Inspect the complete existing project structure, routes, components, API client, authentication, database/persistence, environment variables, and deployment configuration.
2. Identify which requested features already exist and reuse them.
3. Review existing documentation, tests, and recent audit/fix reports.
4. Create a prioritized implementation checklist: existing, missing, partially implemented, and security-sensitive.
5. Identify conflicts or risky changes before modifying related code.
6. Implement in small, testable steps.
7. Do not overwrite working features, duplicate components, remove files unnecessarily, or introduce a second implementation of an existing feature.
8. Never expose API keys, passwords, session tokens, private user data, or server-side configuration.
9. Do not claim a test passed unless it was actually executed and its result inspected.
10. If a third-party service requires credentials, provide clear setup instructions and leave the integration safely disabled until configured.

## 3. Website essentials and SEO

Implement or improve the following:

### A. Custom 404 page
- Create a polished branded 404 page for invalid routes.
- Include a clear message, a home navigation link, and an appropriate recovery action.
- Preserve the existing application design and routing.
- Unknown API routes must return an appropriate JSON 404 response rather than the frontend HTML page.
- Ensure protected routes remain protected and do not expose private content.

### B. Page titles and meta descriptions
- Add appropriate unique titles and meta descriptions to the homepage, FAQ, privacy policy, terms, cookies policy, contact/feedback page, and any other suitable public pages.
- Set a sensible default title and description.
- Use the routing and rendering architecture already present.
- Avoid duplicate, empty, excessively long, or misleading metadata.
- Do not expose private conversation content in page titles, descriptions, or metadata.

### C. Social preview image
- Add a branded Open Graph and social-sharing preview image using a suitable project asset.
- Configure `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, and Twitter/X card metadata where appropriate.
- Use the correct canonical public URL from configuration.
- Ensure the preview image is an absolute, publicly accessible HTTPS URL in production.
- Do not reference an image that does not exist.
- If generating a new asset is not supported, create an implementation-ready placeholder asset and document its replacement requirements.

### D. Alt text and accessibility
- Audit images, icons, buttons, forms, menus, dialogs, and interactive components.
- Give meaningful images descriptive alt text.
- Use empty alt text for purely decorative images.
- Add accessible names to icon-only controls.
- Ensure keyboard navigation, visible focus indicators, semantic headings, form labels, sufficient contrast, and screen-reader-friendly error messages.
- Test both light and dark themes.

### E. Internal links
- Add sensible internal navigation between the homepage, FAQ, legal pages, feedback/contact page, and other appropriate public pages.
- Add footer links for Privacy Policy, Terms & Conditions, Cookies Policy, FAQ, and Contact/Feedback where those destinations exist.
- Avoid broken links, duplicate routes, dead-end pages, and unnecessary navigation clutter.
- Do not add links that reveal private user conversations or admin functionality.

### F. Sitemap and robots.txt
- Add or update `sitemap.xml` containing only real, canonical, publicly indexable URLs.
- Add or update `robots.txt` with the correct sitemap URL.
- Exclude private, authenticated, account-specific, and admin pages from the public sitemap.
- Use appropriate noindex directives for sensitive or non-search-oriented pages where supported.
- Remember that robots.txt and noindex are not access-control mechanisms. Protect private data on the server.

### G. Technical SEO
- Verify canonical URLs, semantic HTML, heading hierarchy, descriptive link text, responsive design, image optimization, and page-loading performance.
- Avoid duplicate metadata and invalid canonical URLs.
- Add structured data only when accurate and appropriate. Do not create fake ratings, reviews, organization details, or other fabricated claims.
- Review SPA indexing limitations. If important public pages cannot be reliably indexed by the current rendering approach, document the issue and recommend the smallest suitable solution rather than migrating the whole application unnecessarily.
- Check production build output and generated metadata.
- Do not promise SEO rankings.

## 4. Security and vulnerability audit

Perform a security review before adding new security controls. Fix confirmed issues using minimal, backward-compatible changes.

### A. Authentication and authorization
- Verify registration, login, logout, session expiration, password hashing, and session invalidation.
- Ensure password hashes use a suitable, salted password-hashing algorithm and never store plaintext passwords.
- Review existing PBKDF2-SHA512 implementation before changing it; do not break existing user accounts.
- Ensure every protected endpoint checks authentication on the server.
- Ensure users can access, update, delete, pin, export, and retrieve only their own conversations and files.
- Prevent privilege escalation and unauthorized admin access.
- Do not rely on frontend checks to enforce permissions.
- Never add a public demo endpoint that allows users to promote themselves to admin.

### B. Input validation and injection prevention
- Validate request bodies, query parameters, route parameters, uploaded files, and environment configuration.
- Reuse the existing validation library and API patterns where appropriate.
- Prevent path traversal, unsafe file access, injection, mass assignment, and unsafe dynamic file paths.
- Use safe output rendering and sanitization where untrusted HTML could be rendered.
- Treat user prompts, uploaded documents, model output, and external content as untrusted data.
- Do not execute generated code or treat prompt instructions as privileged application instructions.

### C. Sessions, CSRF, and browser security
- Verify the existing session and CSRF implementation rather than assuming it is correct.
- Use secure production cookie settings, including `HttpOnly`, `Secure` over HTTPS, and an appropriate `SameSite` policy.
- Apply CSRF protection to relevant cookie-authenticated state-changing requests.
- Configure CORS for known trusted origins instead of using a permissive wildcard with credentials.
- Configure appropriate security headers, including a carefully tested Content Security Policy, clickjacking protection, MIME-sniffing protection, and a suitable referrer policy.
- Do not break Google Gemini requests, streaming, Vite development, or existing application functionality when adding headers.

### D. API abuse and spam protection
- Add server-side rate limiting to login, registration, feedback/contact, file upload, and expensive AI generation endpoints.
- Use stricter limits for authentication attempts and expensive model calls.
- Add request size limits, sensible timeouts, and concurrent-request safeguards.
- Return consistent `400`, `401`, `403`, `413`, `429`, and `500` responses where appropriate.
- Do not reveal stack traces, secrets, internal paths, or sensitive account details in production errors.
- Keep limits configurable through environment variables where appropriate.
- Consider user, IP, and endpoint-specific limits without trusting spoofable forwarded headers.

### E. Cloud spam protection
- Inspect the current hosting provider and deployment architecture.
- If suitable, integrate Cloudflare Turnstile or an equivalent CAPTCHA service for registration and public feedback/contact forms.
- Verify CAPTCHA tokens server-side using the provider's official verification endpoint.
- Keep secret keys exclusively in server-side environment variables.
- Make site keys and allowed origins configurable.
- Fail safely when verification is required but unavailable; do not silently bypass the check in production.
- Keep local development usable through an explicit development-only configuration.
- Do not add a CAPTCHA to every chat message unless abuse analysis demonstrates a need.

### F. File upload and storage security
- Review file upload routes and existing storage implementation.
- Allow only explicitly supported file types and enforce file-size limits.
- Validate extensions, MIME types, and file signatures where practical.
- Generate safe server-side filenames and prevent path traversal.
- Prevent uploaded content from being executed or publicly exposed.
- Ensure file ownership checks apply to downloads and deletions.
- Avoid logging document contents, API keys, or sensitive personal data.
- If malware scanning is not available, document the limitation instead of claiming files are scanned.

### G. Gemini API and streaming security
- Keep the Gemini API key on the server and never expose it through frontend bundles or public API responses.
- Verify request validation, timeouts, streaming cancellation, disconnect handling, error handling, and usage limits.
- Inspect the current model fallback configuration and verify supported model IDs through available evidence. Do not invent model availability.
- Ensure normal request completion does not incorrectly cancel a stream.
- Prevent unhandled promise rejections from hiding genuine application failures.
- Do not suppress all browser errors globally.
- Never present mock AI output as a genuine Gemini response.
- Handle upstream `429`, `503`, timeout, and configuration errors gracefully without exposing internal details.

### H. Data privacy and secrets
- Review `.env` handling, `.gitignore`, logs, local JSON persistence, database configuration, and backup exposure.
- Ensure production secrets are not committed or returned to the browser.
- Do not log passwords, authentication tokens, API keys, full prompts, or private uploaded document contents.
- Avoid collecting analytics or personal data unnecessarily.
- Ensure users can delete their own stored conversations and relevant account data according to the application's actual retention design.
- Document the difference between local JSON persistence and production-grade database persistence. Do not claim PostgreSQL is configured unless verified.

### I. Dependency and configuration security
- Inspect dependency versions and known vulnerabilities using available package audit tools.
- Report critical/high findings, affected packages, and recommended fixes.
- Prefer compatible patches and supported releases; avoid blind upgrades that break the build.
- Verify production and development configuration separately.
- Never report a clean security audit if the required tools or network access were unavailable.

## 5. HTTPS and deployment readiness
- Inspect the actual hosting provider and production URL configuration.
- Verify that production traffic uses HTTPS and that HTTP redirects to HTTPS when supported by the host.
- Do not hardcode localhost URLs in production metadata, callbacks, or API requests.
- Configure secure cookies correctly behind a trusted reverse proxy.
- Trust forwarded headers only when the deployment architecture explicitly supports them.
- Verify allowed origins, environment variables, health endpoints, and production error handling.
- Document any DNS, domain, certificate, or hosting-dashboard steps that cannot be completed from the codebase.
- Never claim HTTPS is enforced merely because the application runs locally.

## 6. Privacy Policy, Terms & Conditions, Cookies Policy

Create clear, responsive, accessible legal pages consistent with the existing theme.

### Privacy Policy
Explain the actual data practices after inspecting the implementation:
- Account information and authentication.
- Prompts and conversations.
- Uploaded documents and derived analysis.
- Gemini or other third-party AI processing.
- Analytics, cookies, logs, and service providers.
- Retention, deletion, security, and user rights.
- Contact details and the process for privacy requests.

### Terms & Conditions
Cover appropriate topics such as acceptable use, account responsibility, service availability, AI output limitations, prohibited abuse, intellectual-property considerations, and account suspension.

### Cookies Policy
Explain actual essential cookies, session cookies, preferences, analytics, and any other technologies used.

Rules:
- Do not invent a company name, address, contact email, certifications, guarantees, or legal compliance claims.
- Use clearly marked configuration placeholders where verified business details are missing.
- Do not claim the pages guarantee compliance with every applicable law.
- Treat legal text as a draft requiring review appropriate to the service's target markets.
- Do not promise that analytics or third-party processing is disabled unless verified.

## 7. Cookies consent and Google Analytics
- Inspect whether Google Analytics is already configured before adding another integration.
- If configured by the owner, support GA4 through a configurable measurement ID.
- Do not hardcode private credentials.
- Provide a clear cookie consent interface with Accept, Reject, and Manage Preferences actions where consent is required.
- Respect the selected preferences and provide a way to change them later.
- Prevent non-essential analytics from loading before the user's consent where applicable.
- Do not treat essential authentication cookies as optional analytics cookies.
- Avoid duplicate page-view tracking in SPA navigation.
- Do not invent analytics data or report tracking as operational without verification.
- If no GA4 measurement ID exists, document setup and keep analytics safely disabled.

## 8. Thank-you page and feedback/contact form
- Add a useful feedback/contact form if one does not already exist.
- Include validation, accessible success/error states, spam protection, and rate limiting.
- Create a dedicated thank-you page after a successful submission.
- The thank-you page must only be reached after actual successful submission, not merely after clicking Submit.
- Do not display submitted personal data in the URL or page title.
- Avoid exposing internal error messages or submission details.
- Do not claim a message was emailed or stored unless the corresponding service actually succeeded.
- Do not add fake contact details.

## 9. FAQ section
Create a polished FAQ page or section that answers real Chatora AI user questions, including:
- What Chatora AI does.
- How to use the chatbot and starter prompts.
- How response-language settings work.
- How conversation pinning works.
- How conversation history and account data are stored.
- How AI output can contain mistakes.
- How uploaded files are handled, if uploads are currently supported.
- How to troubleshoot unavailable AI responses.
- How users can delete their conversations or account data, according to actual capabilities.
- Privacy, cookies, and contact/feedback.

Do not claim unsupported capabilities. Use accessible accordions if appropriate and add FAQ structured data only if the content and search-engine rules genuinely support it.

## 10. Smart text highlighting
Improve chat response readability without changing the underlying AI answer.

- Identify existing Markdown rendering before modifying it.
- Highlight headings, important takeaways, warnings, inline code, code blocks, and meaningful key terms.
- Preserve Markdown formatting, lists, links, code syntax, streaming updates, and copy functionality.
- Use a subtle, accessible warm-amber or sage treatment that works in light and dark themes.
- Never use prohibited blue, navy, purple, violet, indigo, cyan, lavender, or similar hues in text, backgrounds, gradients, borders, focus states, or shadows.
- Do not randomly highlight words or alter the meaning of the assistant's response.
- Avoid unsafe HTML injection. Render through the existing safe Markdown pipeline.

## 11. Testimonials
- Add a premium testimonials section only if genuine, authorized testimonials are available.
- If no verified testimonials exist, build a reusable component that stays hidden or displays a clearly labeled invitation for real feedback.
- Never fabricate people, names, photographs, ratings, quotes, companies, or endorsements.
- Do not generate fake reviews to fill empty cards.
- Do not add aggregate ratings or review structured data without legitimate supporting evidence.
- Ensure testimonial content has appropriate consent and accessibility.

## 12. Design system — strict requirements

Preserve the Chatora AI identity:
- Warm ivory: `#F6F3EB`
- White: `#FFFFFF`
- Charcoal: `#242922`
- Forest green: `#315C43`
- Muted sage: `#A7B7A0`
- Warm amber: `#D7A64A`
- Warm grey: `#77796F`
- Light border: `#DEDCD2`

Design goals:
- Premium minimalism with a Bento Grid aesthetic.
- Clean, warm, friendly, modern and spacious.
- Consistent typography, spacing, border radius, shadows, and interaction states.
- Fully responsive desktop, tablet, and mobile layouts.
- Existing light/dark theme toggle must keep working.
- All new pages must look like part of the same product.

**Absolute color restriction:** No blue, navy, purple, violet, indigo, cyan, lavender, periwinkle, or derivatives anywhere, including links, gradients, browser focus rings, loading states, hover effects, analytics UI, CAPTCHA wrappers, errors, and third-party component defaults. Audit all new styles in both themes.

## 13. Testing and acceptance criteria

Run all available checks, including:

1. Production frontend build.
2. TypeScript strict type-check.
3. Existing automated tests.
4. Route and 404 tests.
5. Metadata and sitemap validation.
6. robots.txt and canonical URL verification.
7. Registration, login, logout, and session tests.
8. Unauthorized access and conversation ownership tests.
9. CSRF, CORS, validation, and rate-limit tests.
10. Upload validation and access-control tests.
11. Gemini success, error, timeout, and streaming-disconnect tests where feasible.
12. Privacy consent and analytics behavior tests.
13. Feedback form validation, spam protection, and thank-you flow tests.
14. Light/dark theme, keyboard accessibility, mobile layout, and prohibited-color scan.
15. Dependency vulnerability scan where tools are available.

Do not modify tests merely to make failures disappear. Fix root causes and report any tests that could not be run.

## 14. Final report

At completion, provide:
- Summary of implemented features.
- Files created or modified.
- Security vulnerabilities discovered, their severity, and actual fixes.
- Tests executed and exact results.
- External configuration still required.
- Any known limitations or unresolved findings.
- Deployment checklist.
- Features intentionally deferred and why.

Separate verified results from recommendations and assumptions.

**Final instruction:** First audit, then implement. Prioritize security, correctness, accessibility, and production reliability over decorative features. Preserve working functionality and do not introduce a major backend migration, fake integrations, fabricated testimonials, or unsupported claims.