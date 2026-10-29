# CHATORA AI — PREMIUM FEATURE ENHANCEMENT SPRINT

Act as a senior frontend engineer, UX designer, and full-stack developer. Continue working on the EXISTING Chatora AI codebase.

## Objective

Improve Chatora AI into a polished, premium AI assistant while Antigravity is unavailable.

Do not rebuild the project from scratch. Inspect the current implementation before making changes. Preserve existing working features, API contracts, authentication, conversation persistence, and Gemini streaming.

## Mandatory architecture constraints

- Keep the current React + Vite frontend and Express backend operational in Google AI Studio.
- Do not attempt a full Flask migration in this sprint.
- Keep frontend API calls behind a reusable API client/service layer so the backend can be replaced or adapted later.
- Do not introduce a second backend or duplicate authentication/chat logic.
- Avoid unnecessary dependencies and preserve existing package conventions.
- Never use mock data or fake success messages to simulate working backend features.

## Design rules

Follow the existing Chatora AI PRD and approved design specifications.

Use the strict warm-neutral palette:
- Warm ivory: #F6F3EB
- White: #FFFFFF
- Charcoal: #242922
- Forest green: #315C43
- Muted sage: #A7B7A0
- Warm amber: #D7A64A
- Warm grey: #77796F
- Light border: #DEDCD2

Blue, navy, purple, violet, indigo, cyan, lavender, and related shades are strictly prohibited in both themes and all UI states.

Maintain the minimalism + Bento Grid design philosophy, premium typography, responsive layout, accessible controls, subtle animation, and reduced-motion support.

## Implement in priority order

### 1. Conversation management
- New conversation
- Rename conversation
- Delete conversation with confirmation
- Search conversation titles
- Pin or favorite conversations if the existing data model supports it
- Preserve server-side ownership checks and persistence
- Show meaningful empty and error states

Do not implement pinning with fake local state if persistence is expected.

### 2. Welcome screen
- Add a polished welcome heading and short description
- Add clickable suggested prompts grouped into useful categories
- Add compact Bento cards for Study, Coding, Writing, Research, and Productivity
- Ensure clicking a prompt sends it through the real chat API
- Avoid unnecessary clutter and decorative statistics that are not real

### 3. Response quality and chat controls
- Copy response text
- Regenerate a response using the real AI endpoint
- Stop generation reliably
- Retry temporary provider failures
- Display readable loading and error states
- Preserve streaming behavior
- Render Markdown safely, including headings, lists, tables, links, and code blocks
- Add copy-code buttons
- Do not render unsanitized HTML

### 4. Personalization settings
- Concise, Balanced, and Detailed response styles
- Preferred response language, if supported by the current prompt/API design
- Persist light/dark theme preferences
- Provide clear settings controls with accessible labels
- Store user preferences in the appropriate existing persistence layer
- Do not expose internal secrets or allow unsafe arbitrary system instructions to override security rules

### 5. Export and privacy
- Export an individual conversation as a clean Markdown or TXT file
- Confirm before clearing conversation history
- Keep export functionality local to the browser when possible
- Do not claim data is permanently deleted unless server-side deletion is verified
- Ensure user-specific operations enforce authorization

### 6. UI polish
- Refine spacing, typography, responsive breakpoints, sidebar behavior, composer, focus states, and animations
- Ensure long messages, code blocks, and narrow screens render correctly
- Avoid layout shifts during streaming
- Maintain performance and reduced-motion preferences
- Audit light and dark themes for prohibited colors

## Implementation workflow

1. Inspect current components, API contracts, state management, and database/storage model.
2. Create a short implementation checklist and identify dependencies between features.
3. Implement small, compatible changes in priority order.
4. Reuse existing routes and services wherever appropriate.
5. Add or update tests for new functionality and regressions.
6. Run the available build, typecheck, and tests.
7. Fix errors caused by your changes.
8. Update documentation with the implemented features and any limitations.

## Important constraints

- Do not change the authoritative backend architecture during this sprint.
- Do not remove or rewrite the Flask export.
- Do not change Gemini model configuration without verifying API availability.
- Do not suppress unrelated errors.
- Do not hardcode credentials or expose environment variables.
- Do not claim that a feature works unless you have verified it.
- If a feature requires unsupported runtime access, explain the limitation and implement only what can be done safely.

## Final report

Summarize:
- Features actually implemented
- Files modified
- Tests executed and their results
- Any remaining defects
- Features deferred because they require backend migration or additional services

Start by inspecting the existing project, then implement the highest-priority improvements without breaking current functionality.