# Chatora AI — Final Design Specification (`design-final.md`)

**Version:** 1.0 (final candidate, awaiting approval)
**Date:** 2026-10-27
**Sources:** `Design.md` (visual source of truth), `PRD.md` (product source of truth; the project instructions call it `master-prd.md`, and its own title is "Master Prompt")
**Philosophy:** Minimalism + Bento Grid
**Scope of this document:** design only. No application code, no backend code.
**Status of originals:** `Design.md` and `PRD.md` are unchanged.

---

## 0. How to read this document

- Sections 1–3 are the audit: what the sources say, where they disagree, what I decided, and what I still need from you.
- Sections 4–24 are the final spec. Where a value differs from `Design.md`, it is tagged **[CHANGED]** (and justified in §2) or **[NEW]** (a token or screen the sources did not define).
- §25 is the forbidden-color audit. §26 maps the design to the existing `templates/` + `static/` structure. §27 traces every PRD requirement that has a UI surface to a design element.
- Contrast ratios quoted here were computed (WCAG 2.x relative-luminance formula), not estimated. The script is `scratchpad/contrast.py`; the hue audit is in §25.

---

## 1. Requirements summary

### 1.1 From `PRD.md` (what the UI must expose)

| Area | UI-relevant requirements |
|---|---|
| Layout | Sidebar (logo, New Chat, recent conversations, settings); main workspace with welcoming empty state; top nav with model info + theme controls; sticky composer; collapsible mobile sidebar; loading indicators; subtle animation |
| Core chat (15 items) | Send via button/Enter; Shift+Enter newline; real AI responses; chronological messages; typing indicator; auto-scroll "when appropriate"; block duplicate submits; helpful errors; Stop Generating; Regenerate; Copy message; context preserved; timestamps/metadata without clutter; New Chat; clear/delete with confirmation |
| Conversations | Create, auto-title, rename, delete, search, persist, restore after refresh, ownership |
| Markdown/code | Headings, lists, tables, links; highlighted code; Copy Code; optional math; sanitised; never execute code |
| Attachments | Text + PDF upload; server validation; stored outside static; failures handled; never claim analysis without processing |
| Export/share | TXT/MD export; print view; explicit, revocable, unguessable share links |
| Personalization | Dark/light persistent; "adjustable response preferences where supported"; model settings; clear history; data deletion; keyboard shortcuts; tooltips |
| Accounts | Optional; if present: register, login, logout, per-user history, account deletion |
| Reliability/security | Friendly errors, timeouts, rate limits, limits on length/upload, health check, request IDs, privacy notice, no secrets in frontend |
| Honesty | No fake AI responses; missing key → helpful configuration error; no decorative buttons |

### 1.2 From `Design.md` (what the UI must look like)

Minimalism + Bento; warm forest-green/ivory/charcoal/sage/amber palette; **zero blue/purple/cyan/lavender derivatives anywhere** (including focus rings, links, code highlighting, third-party defaults); Inter; 260/72 px collapsible sidebar; 900 px content max; Bento welcome (1 prominent + 2–3 supporting + prompt suggestions); document-style assistant messages; rounded composer; code blocks with copy; light + dark with persistence and no flash; auth screens only if in scope; upload dialog; breakpoints 1200 / 768; reduced motion; WCAG 2.2 AA; CSS custom properties; no unapproved color literals.

---

## 2. Conflicts, gaps, ambiguities, duplicates — and how each is resolved

### 2.1 Conflicts (resolved)

| # | Conflict | Resolution |
|---|---|---|
| C1 | **File names.** Project instructions say `master-prd.md`; the file present is `PRD.md`. `Design.md` is capitalised. | Treat `PRD.md` as `master-prd.md`. Implementation uses these paths as given; nothing is renamed. |
| C2 | **Typing indicator.** PRD §5.4 says "show a typing indicator". `Design.md` §9 says don't show a fabricated one as evidence the provider is working. | Indicator is bound to the real request lifecycle: it appears only after the request is sent and disappears on the first streamed token or on error. Label is honest: "Waiting for a response…". After 15 s it adds "Taking longer than usual" + a Stop button. Never animated on a timer detached from the request. |
| C3 | **Bubbles vs document layout.** PRD says "message bubbles *or* an unobtrusive layout". Design says assistant = document-like. | Assistant: no bubble, document-like. User: a restrained tinted bubble (right-aligned). Both options in the PRD are honored. |
| C4 | **Bento layout.** The `Design.md` ASCII diagram has 7 cells (welcome card, "Quick Prompt Card", 4 prompts, tip card) while the text says "one prominent card, two or three supporting cards" and "four prompt examples". Your brief asks for "a purposeful Bento Grid rather than excessive cards". | **4 cards total**: 1 prominent (Learn something) + 3 supporting. The heading and sentence sit above the grid as plain text, not a card. The "Quick Prompt" and "Tip" cards are dropped (the tip card required invented content; the PRD defines none). See §12. |
| C5 | **Theme control location.** PRD: theme controls in the *top navigation*. Design: theme toggle in the *sidebar bottom*. | Single toggle, in the **top bar** (PRD is explicit and it stays reachable when the sidebar is collapsed or a drawer). Sidebar footer keeps Settings, which also has the System/Light/Dark selector. No duplicate toggle. |
| C6 | **Composer vs. measure.** Design: composer aligned with content; content max 900 px. 16 px text at 900 px is ~110 characters per line. | Container stays 900 px (composer, code, tables, bento align to it). **Assistant prose is capped at 74ch** inside that container. Tables and code may use the full 900 px. |
| C7 | **Secondary text contrast.** `#77796F` is specified for descriptions/metadata. Computed: 3.99:1 on `#F6F3EB`, 3.80:1 on `#EFEEE6`, 4.42:1 on white. All fail AA (4.5:1) for small text, which this is (12–14 px). | **[CHANGED]** Light `--text-muted` → `#686B61` (4.90 / 4.67 / 5.43). Dark `#B4B8AC` passes unchanged (≥6.97). |
| C8 | **Borders vs. WCAG 1.4.11.** `#DEDCD2` on `#F6F3EB` is 1.24:1; dark `#41483F` on `#191D19` is 1.81:1. Fine for decorative dividers, but the composer, inputs and select boundaries must be ≥3:1 to be perceivable. | **[NEW]** `--border-strong`: light `#858880` (3.25 on bg, 3.60 on white), dark `#7A8477` (4.38 on bg, 3.62 on surface). Used only for inputs, composer, checkboxes. Decorative borders keep the original tokens. |
| C9 | **Amber and sage as text.** Amber on white is 2.22:1, sage on white is 2.12:1. | Amber and sage are **never text on light surfaces**. Amber = non-text accent, syntax keyword on dark code, or a mark paired with text in ink color. In dark theme sage text is fine (6.66+). |
| C10 | **Sidebar "Theme toggle" + "Account" + "Help"** vs. "every visible control must have a purpose". | Footer = Settings, Account (only if auth in scope), Help→Privacy & shortcuts. Theme moved per C5. |

### 2.2 Missing decisions (resolved with a default)

| # | Gap | Decision |
|---|---|---|
| G1 | Light-theme sidebar surface not defined | `#EFEEE6` (existing Subtle surface) |
| G2 | No focus color | Light `#315C43`, dark `#BAC9B3`. 2 px solid, 2 px offset. No browser default blue. |
| G3 | `on-primary` text color | Light `#FFFFFF` on `#315C43` (7.66:1). Dark `#191D19` on `#A7B7A0` (8.06:1). |
| G4 | User-message surface | **[NEW]** light `#E6ECDF`, dark `#2F3B31` (green-tinted neutrals, hue ≈ 90–130°). |
| G5 | Error surface | **[NEW]** light `#F7E6E4`, dark `#3A2625`. |
| G6 | Code block + syntax palette | §15. Eight syntax tokens, all computed ≥ 5.4:1 on both code backgrounds, none in the blue–violet range. |
| G7 | Link color | Primary green, **always underlined** (color is never the only cue). Visited = same color. |
| G8 | Selection / caret / accent-color / tap highlight / autofill | §24 — each browser default that can render blue is overridden. |
| G9 | Overlay scrim | **[NEW]** `rgba(36, 41, 34, 0.48)` light, `rgba(10, 12, 10, 0.62)` dark (neutral, no hue). |
| G10 | Suggestion click behaviour (populate vs. submit) | **Populate the composer and focus it**, selecting the bracketed placeholder (e.g. `[topic]`) so typing replaces it. Never auto-submits (prevents accidental API spend and lets users edit). |
| G11 | Mono font | System stack only: `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`. No download. |
| G12 | Inter loading | Self-host `Inter` variable (OFL) in `static/fonts/` with `font-display: swap`; system fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Rationale: PRD requires deployability without assumptions; a CDN font adds a third-party request that conflicts with the privacy notice. *Implementation must supply the font file; the preview uses the fallback.* |
| G13 | Icons | Inline SVG, 1.75 px stroke, `currentColor` only, 20 px (16 px in menus). No icon font, no icon library defaults. |
| G14 | Timestamps (PRD §5.13) | Relative time + exact time in `title`/tooltip, in the message action row (revealed on hover/focus-within; always visible on touch). |
| G15 | Shortcuts (PRD F) | `/` focus composer · `Ctrl/Cmd+K` search · `Alt+N` new chat · `Ctrl/Cmd+\` toggle sidebar · `Esc` close dialog / stop generation · `?` show shortcuts. Final keys are verified against browser-reserved combos during QA (I rejected `Ctrl+Shift+O` and `Ctrl+B` because Chrome/Firefox reserve them). |
| G16 | Print view | Own print stylesheet: ink on white, no chrome, code on light grey with border, link URLs appended. |
| G17 | Shared-link screen, share dialog, settings dialog, rename, export menu, error pages (404/500), privacy page, 'scroll to latest' button | Specified in §17–§20. |
| G18 | Model information in top bar | Shows the configured model name. It becomes a dropdown **only** when more than one model is configured server-side; otherwise it's a static label. |
| G19 | Math rendering | Out of v1.0 design (PRD: "if a suitable library is configured"). Token plan reserved: KaTeX inherits `--text`; its error color maps to `--error`. Decision in §3, Q3. |

### 2.3 Ambiguities carried forward (see §3)

Auth in/out, scope of file upload + sharing for v1.0, and what "adjustable response preferences" means.

### 2.4 Duplicate requirements (merged, single owner)

| Requirement | Appears in | Single owner |
|---|---|---|
| No fake AI responses / decorative controls | PRD §2, §5, §12; Design §8, §10, §19 | §16 and §27 |
| Sanitize Markdown/HTML | PRD §6C, §9; Design §11 | §15 |
| Server-side upload validation | PRD §6D; Design §15 | §19 (UI side), backend plan (server side) |
| Secure keys server-side | PRD §2, §6B, §9; Design §19 | Backend plan |
| Both themes, persistence | PRD §4, §6F; Design §13 | §6 |
| Responsive + a11y | PRD §4, §11; Design §16, §18 | §9, §22 |
| Definition of Done (2 lists) | PRD §15; Design §24 | Merged in §27.3 |

---

## 3. Unresolved decisions (need your answer before implementation)

These cannot be resolved from the documents. Each has my recommendation and the strongest argument against it.

**Q1 — Are user accounts in v1.0?**
`PRD.md` calls accounts optional; `Design.md` designs auth screens only "if in scope".
- **Recommendation: Yes, email + password.** An unauthenticated public chat endpoint that spends your provider credits is an abuse and cost risk; per-IP rate limiting alone is weak. Accounts also give you a defensible answer for ownership, revocable share links, "delete my data", and cross-device history.
- **Counter-argument:** accounts add the largest security surface in the project (password storage, reset flow, CSRF, enumeration). A session-cookie "guest" mode is simpler but loses history on cookie clear and makes ownership/sharing weaker.
- If *no*: §18 screens are skipped and the sidebar footer drops "Account".

**Q2 — Which advanced features ship in v1.0?** PRD says "prioritise reliability over a long list".
- **Recommendation — Tier 1 (ship):** chat + streaming, conversations (rename/delete/search), Markdown + code, themes, export TXT/MD, print view, settings, clear history.
- **Tier 2 (ship if Tier 1 passes QA):** file upload (text + PDF), sharing with revocation.
- **Counter-argument:** upload and sharing are the two features with the highest security cost. If you cut them, the composer shows no attachment button and the top bar has no Share action, and nothing is lost visually.

**Q3 — "Adjustable response preferences" and math.**
PRD says "where supported" without defining it. **Recommendation:** a 3-way **Response style** (Concise / Balanced / Detailed) in Settings that adjusts the system prompt; defer KaTeX math to v1.1. If you'd rather have free-text custom instructions, or want math now, say so.

---

## 4. Design principles (final)

1. Minimal: every visible element has a job. Dropped from the sources: tip card, quick-prompt card, voice input, read-aloud.
2. Bento: used on the welcome screen only. The conversation view is a document.
3. Conversation first: after the first send, the bento disappears and the chat owns the space.
4. Warm and quiet: green carries meaning; neutrals carry structure.
5. Honest UI: a control exists only if its backend exists. Loading states reflect real work.
6. Accessible and fast: CSS-only motion, native elements, no UI framework.

**Surface mode (Impeccable):** *Operate* (an app UI, task-first). Ambition is expressed through precision and restraint, not decoration. One signature element: the filled-green primary bento card.

**Out of v1.0 UI** (not in PRD; Design lists them as conditional): microphone/voice input, read-aloud, image attachments, edit-sent-message, message reactions.

---

## 5. Forbidden-color policy

Prohibited: blue, navy, royal blue, purple, violet, indigo, cyan, turquoise, periwinkle, lavender, blue-purple greys, and any tint/shade/gradient/shadow/alpha derived from them.

**Operational definition used for the audit:** any color with HSL hue between **165° and 335°** and saturation above **6%**. Neutrals below 6% saturation are allowed. Approved palette hues: warm neutrals ≈ 40–70°, greens ≈ 90–150°, amber ≈ 40°, error red ≈ 0–5°, clay ≈ 20°.

Enforcement: tokens only (no color literals outside `:root`/`[data-theme]`), the audit script in §25, and manual state sweeps (hover, focus, active, disabled, loading, error, both themes).

> Windows High Contrast / `forced-colors` mode substitutes system colors chosen by the user's OS. That is a user setting, not a product color. The design supports it with borders and `outline` rather than overriding it.

---

## 6. Color tokens (final)

### 6.1 Light theme

| Token | Hex | Notes |
|---|---|---|
| `--bg` | `#F6F3EB` | App background |
| `--sidebar` | `#EFEEE6` | **[NEW]** (= subtle surface) |
| `--surface` | `#FFFFFF` | Cards, composer, dialogs |
| `--surface-subtle` | `#EFEEE6` | Hover/secondary |
| `--text` | `#242922` | 13.38:1 on bg |
| `--text-muted` | `#686B61` | **[CHANGED]** from `#77796F`; 4.90 on bg, 4.67 on subtle, 5.43 on white |
| `--primary` | `#315C43` | 7.66:1 on white |
| `--primary-hover` | `#264A35` | |
| `--on-primary` | `#FFFFFF` | **[NEW]** 7.66:1 on primary |
| `--sage` | `#A7B7A0` | Decorative only on light (2.12:1 on white) |
| `--amber` | `#D7A64A` | Decorative only on light (2.22:1 on white) |
| `--border` | `#DEDCD2` | Dividers |
| `--border-strong` | `#858880` | **[NEW]** inputs/composer; ≥3.09:1 on every light surface |
| `--error` | `#A63D40` | 6.24:1 on white |
| `--error-surface` | `#F7E6E4` | **[NEW]** 5.17:1 for `--error` text on it |
| `--success` | `#315C43` | Always paired with an icon + text |
| `--user-msg` | `#E6ECDF` | **[NEW]** 12.31:1 text |
| `--hero-bg` / `--hero-text` | `#315C43` / `#F6F3EB` | **[NEW]** 6.91:1 |
| `--focus` | `#315C43` | **[NEW]** 6.91:1 on bg |
| `--selection` | `#C9D5C3` / text `#242922` | **[NEW]** 9.74:1 |
| `--scrim` | `rgba(36,41,34,.48)` | **[NEW]** |

### 6.2 Dark theme

| Token | Hex | Notes |
|---|---|---|
| `--bg` | `#191D19` | |
| `--sidebar` | `#202520` | |
| `--surface` | `#272D27` | |
| `--surface-elevated` | `#303830` | Menus, hover |
| `--text` | `#F3F0E8` | 14.98:1 on bg |
| `--text-muted` | `#B4B8AC` | 8.44 on bg, 6.97 on surface |
| `--primary` | `#A7B7A0` | 8.06:1 on bg |
| `--primary-hover` | `#BAC9B3` | |
| `--on-primary` | `#191D19` | **[NEW]** 8.06:1 on primary |
| `--deep-green` | `#315C43` | Selected/hero surfaces |
| `--amber` | `#D7A64A` | 6.33:1 on surface (usable as text here) |
| `--border` | `#41483F` | |
| `--border-strong` | `#7A8477` | **[NEW]** 4.38 on bg, 3.62 on surface, 3.11 on elevated |
| `--error` | `#E69A96` | 6.32:1 on surface |
| `--error-surface` | `#3A2625` | **[NEW]** 6.35:1 |
| `--user-msg` | `#2F3B31` | **[NEW]** 10.30:1 |
| `--hero-bg` / `--hero-text` | `#315C43` / `#F3F0E8` | 6.72:1 |
| `--focus` | `#BAC9B3` | **[NEW]** 8.11:1 on surface |
| `--selection` | `#3E5A46` / text `#F3F0E8` | **[NEW]** 6.69:1 |
| `--scrim` | `rgba(10,12,10,.62)` | **[NEW]** |

### 6.3 Usage rules (tightened)

- Neutrals do structure. Green = actions and selection. Sage = secondary accent and dark-mode interactivity. Amber ≤ 1 small element per screen (partial-response marker, logo-adjacent accent, syntax keywords).
- Exactly **one** filled card on the welcome screen (the hero). No per-card colors.
- No gradients anywhere. No glows. Shadows are neutral (`rgba(36,41,34,.08)`, never tinted).
- Success, error, selected and disabled are always conveyed by icon, text, weight or shape **in addition to** color.

### 6.4 CSS token block (reference for implementation)

```css
:root {
  color-scheme: light;
  --bg:#F6F3EB; --sidebar:#EFEEE6; --surface:#FFFFFF; --surface-subtle:#EFEEE6;
  --text:#242922; --text-muted:#686B61;
  --primary:#315C43; --primary-hover:#264A35; --on-primary:#FFFFFF;
  --sage:#A7B7A0; --amber:#D7A64A;
  --border:#DEDCD2; --border-strong:#858880;
  --error:#A63D40; --error-surface:#F7E6E4; --success:#315C43;
  --user-msg:#E6ECDF; --hero-bg:#315C43; --hero-text:#F6F3EB;
  --focus:#315C43; --selection:#C9D5C3; --scrim:rgba(36,41,34,.48);
  --code-bg:#242922; --code-text:#F3F0E8; --code-border:#3A4138; --code-label:#B4B8AC;
  --syn-keyword:#D7A64A; --syn-string:#A7B7A0; --syn-number:#E0976A; --syn-function:#E8D9B0;
  --syn-builtin:#8DB58B; --syn-comment:#9A9F92; --syn-punct:#B4B8AC;
  --on-error:#FFFFFF;
  --shadow:0 1px 2px rgba(36,41,34,.06), 0 6px 20px rgba(36,41,34,.08);
}
[data-theme="dark"] {
  color-scheme: dark;
  --bg:#191D19; --sidebar:#202520; --surface:#272D27; --surface-subtle:#303830;
  --text:#F3F0E8; --text-muted:#B4B8AC;
  --primary:#A7B7A0; --primary-hover:#BAC9B3; --on-primary:#191D19;
  --amber:#D7A64A;
  --border:#41483F; --border-strong:#7A8477;
  --error:#E69A96; --error-surface:#3A2625; --success:#A7B7A0;
  --user-msg:#2F3B31; --hero-bg:#315C43; --hero-text:#F3F0E8;
  --focus:#BAC9B3; --selection:#3E5A46; --scrim:rgba(10,12,10,.62);
  --code-bg:#202520; --code-text:#F3F0E8; --code-border:#41483F;
  --on-error:#191D19;
  --shadow:0 1px 2px rgba(0,0,0,.30), 0 6px 20px rgba(0,0,0,.28);
}
/* Syntax tokens are identical in both themes (code surface is dark in both). */
```

Initial theme: inline `<head>` script reads `localStorage.theme` (`light|dark|system`), falls back to `prefers-color-scheme`, sets `data-theme` before first paint. Wrap storage in try/catch.

---

## 7. Typography

Inter (self-hosted, variable) → `system-ui` fallback. Mono: system stack.

| Role | Desktop | Mobile | Weight | Line height |
|---|---|---|---|---|
| Welcome heading | 44 px (range 40–48) | 32 px (30–36) | 650 | 1.1, tracking −0.02em |
| Section/dialog heading | 22 px | 20 px | 600 | 1.25 |
| Card heading | 17 px | 17 px | 600 | 1.3 |
| Hero card heading | 22 px | 20 px | 600 | 1.25 |
| Message text | 16 px | 16 px | 400 | 1.65 |
| Supporting | 14 px | 14 px | 400 | 1.5 |
| Metadata | 12 px | 12 px | 400 | 1.4 |
| Code | 13.5 px | 13 px | 400 | 1.6 |
| Composer input | 16 px | **16 px minimum** (prevents iOS zoom) | 400 | 1.5 |

Rules: max one heading size jump per view; no all-caps; numerals in tables use `font-variant-numeric: tabular-nums`; assistant prose measure `max-width: 74ch`.

---

## 8. Spacing, radius, elevation, sizing

- Spacing scale (4-pt): 4, 8, 12, 16, 24, 32, 48.
- Radius: card **20 px**, dialog 20 px, composer 22 px, control 12 px, chip/pill 999 px, code block 14 px, user bubble 18 px.
- Elevation: three levels only — flat (borders), raised (card hover: border becomes `--border-strong`, no shadow growth), overlay (dialogs/menus use `--shadow`).
- Hit targets: ≥ 40 px desktop, **≥ 44 px touch** (icon buttons 40×40 visual with 44×44 hit area on `pointer: coarse`).
- Z-index: content 0 · composer 10 · topbar 20 · sidebar (drawer) 40 · scrim 45 · menus 50 · dialog 60 · toast 70.

---

## 9. App shell and responsive behaviour

```
Desktop ≥1200
┌────────────┬───────────────────────────────────────────┐
│ Sidebar    │ Top bar: [☰?] model ▾            ◐  ⋯     │
│ 260 / 72   ├───────────────────────────────────────────┤
│            │          content (max 900, centred)       │
│            │                                           │
│            │          composer (max 900, sticky)       │
└────────────┴───────────────────────────────────────────┘
```

| Breakpoint | Sidebar | Bento | Padding | Composer |
|---|---|---|---|---|
| **≥ 1200** | Expanded 260 (user can collapse to 72 rail; state persisted) | 4-column | 32–48 h, 24–40 v | max 900 |
| **768–1199** | **Collapsed 72 rail by default**; expanding overlays content (does not push) | 2-column | 24 | fluid, max 900 |
| **< 768** | Off-canvas drawer (84 vw, max 320), scrim, focus-trapped, Esc closes | 1-column | 16 | full width, `padding-bottom: env(safe-area-inset-bottom)` |

Mobile specifics: `100dvh` shell; composer is `position: sticky; bottom: 0` and repositions using `visualViewport` so the on-screen keyboard never covers it; no horizontal page scroll at 320 px (tables/code scroll inside their own container); top bar = menu button, logo mark, theme toggle, overflow menu.

---

## 10. Sidebar

**Order, top → bottom**

1. Brand mark + wordmark; collapse button (panel icon). Rail: mark only.
2. **New chat** — filled primary button, full width (rail: icon button with tooltip). `Alt+N`.
3. **Search** field (rail: icon that expands the sidebar and focuses the field). `Ctrl/Cmd+K`.
4. Conversation list grouped **Today / Yesterday / Previous 7 days / Older**, 40 px rows, single-line truncated title.
5. Footer: **Settings**, **Help** (privacy notice + shortcuts), **Account** (only if Q1 = yes).

**Conversation row states**

| State | Treatment |
|---|---|
| Default | transparent, `--text` |
| Hover/focus | `--surface-subtle` bg |
| Selected | `--surface` bg (light) / `--surface-subtle` (dark), 1 px inset `--border` outline, weight 600, `aria-current="true"` (no colored side stripe) |
| Menu button (⋯) | visible on hover/focus-within; always visible on touch; opens Rename · Export (TXT / Markdown) · Share* · Print · Delete |
| Renaming | title becomes an input in place; Enter saves, Esc cancels |
| No results | "No conversations match “…”" + Clear search |
| Empty list | "Your conversations will show up here." (no technical copy, no IDs) |

\*Share only if Tier 2 ships.

Collapsed rail: icons with `aria-label` and tooltip (appear after 400 ms, also on keyboard focus). Conversation list is hidden in the rail; New chat and Search remain.

---

## 11. Top bar

56 px, no bottom border until content scrolls beneath it (then 1 px `--border`).

- Left: (mobile) menu button · (desktop) none.
- Center-left: **model label** `Model name` (static or `▾` dropdown, per G18). Shows a small chip "Not configured" in `--error-surface` when the server reports no provider key, instead of failing silently.
- Right: **theme toggle** (sun/moon icon button, `aria-pressed`, tooltip “Switch to dark/light theme”), conversation actions menu (⋯ → Export, Print, Share*, Delete) when a conversation is open.

---

## 12. Welcome screen and Bento Grid

### 12.1 Content hierarchy

1. Heading: **What would you like to explore?**
2. One sentence: *Ask a question, draft something, learn a topic, or work through a problem.*
3. Bento (4 cards)
4. Composer (docked at the bottom, identical to its conversation position — no layout jump)
5. Privacy line under composer: *Chatora AI sends your messages to {provider} to generate answers. Privacy details* (provider name comes from server config; never hard-coded).

### 12.2 Desktop grid (4 columns, 16 px gap, container 900)

```
┌───────────────────────┬───────────────────────┐
│                       │ Write better          │
│  Learn something      │ Help me draft or      │
│  (primary, filled     │ improve an email.     │
│   forest green,       ├──────────┬────────────┤
│   2 cols × 2 rows)    │ Solve a  │ Explore    │
│                       │ problem  │ ideas      │
└───────────────────────┴──────────┴────────────┘
```

- `grid-template-columns: repeat(4, minmax(0, 1fr))`; hero `grid-column: 1 / 3; grid-row: 1 / 3`; Write `grid-column: 3 / 5`; Solve `3`, Explore `4`.
- `grid-auto-rows: minmax(120px, auto)`. **No fixed heights.** Cards grow with content.
- Hero: `--hero-bg`, `--hero-text`, a small 20 px icon, 22 px title, 15 px description, a text-only "Try this" affordance (arrow) that appears on hover/focus. This is the only filled card.
- Supporting cards: `--surface`, 1 px `--border`, radius 20, padding 20, hover → `--border-strong` + `--surface-subtle` (150 ms). Monochrome 20 px icon in `--primary`.
- Every card is a real `<button>` (not a div with a click handler), fully keyboard operable.

### 12.3 Tablet / Mobile

| Width | Layout |
|---|---|
| 768–1199 | 2 columns: hero spans 2; Write spans 2; Solve and Explore 1 each |
| < 768 | 1 column, order: Learn, Write, Solve, Explore; padding 16; descriptions stay one–two lines; heading 32 px |

### 12.4 Prompt suggestions (final copy; populates composer, placeholder pre-selected)

| Card | Title | Description | Composer text |
|---|---|---|---|
| Hero | Learn something | Explain a difficult topic in simple language. | `Explain [topic] in simple language, with an everyday example.` |
| 2 | Write better | Help draft or improve an email. | `Help me write a clear, friendly email about [subject].` |
| 3 | Solve a problem | Break a complex task into manageable steps. | `Break down [task] into manageable steps I can start on today.` |
| 4 | Explore ideas | Brainstorm ideas for a project. | `Brainstorm ten ideas for [project] and suggest which to try first.` |

Cards never show a fake answer and never send anything.

---

## 13. Conversation view

- Scroll container is the document; the composer is sticky below it. Column max 900, centered; turns separated by 24–32 px.
- **Auto-scroll rule:** follow new content only while the user is within 80 px of the bottom. Otherwise show a **"Jump to latest"** pill (down-arrow icon + text, `--surface`, `--border-strong`) above the composer; it announces nothing to screen readers unless activated.
- **User message:** right-aligned bubble, `--user-msg`, radius 18, max-width 78 %, `white-space: pre-wrap` for multiline, text 16 px.
- **Assistant message:** left-aligned, no bubble, no avatar, prose capped at 74ch. A visually-hidden "Assistant:" / "You:" prefix labels each turn for screen readers.
- **Action row** (below each assistant turn; 36 px; muted icons): Copy · Regenerate (last assistant message only) · relative time. Hover/focus-within reveals on desktop; always visible on touch. Copy gives a 1.6 s check-icon + "Copied" swap in the button and an `aria-live="polite"` announcement.
- **Metadata:** time only (G14). Model name shown in the action row tooltip, not as visible clutter.
- **Failed turn:** see §16.4.

---

## 14. Message composer

- Surface `--surface`, 1 px `--border-strong`, radius 22, padding 12 16, `box-shadow: var(--shadow)`; focus-within → 2 px `--focus` ring (outline, offset 2).
- Auto-growing textarea: 1 row → max 8 rows (then internal scroll). `aria-label="Message Chatora AI"`.
- Controls (left → right): **Attach** (Tier 2 only), textarea, **Send** (40×40 circular, `--primary`, arrow-up). While a response is in flight Send becomes **Stop** (square icon, same size, `aria-label="Stop generating"`), and the textarea stays editable so you can draft the next message but cannot submit.
- Send disabled when input is empty/whitespace, over the length limit, or a request is in flight. Disabled = reduced contrast **and** `aria-disabled` + tooltip reason; not color-only.
- Character counter appears only above 80 % of the PRD-configured limit, in `--text-muted`, turning `--error` with an icon at 100 %.
- Hint line (desktop only): `Enter to send · Shift+Enter for new line`.
- Not rendered in v1.0: microphone button. Attach button not rendered unless uploads are enabled and working.

---

## 15. Markdown and code blocks

| Element | Style |
|---|---|
| h1–h3 | 22 / 19 / 17 px, 600, margin-top 1.6em, margin-bottom .5em |
| Paragraph | 16/1.65, margin-bottom 1em |
| Lists | 1.4em indent, markers `--text-muted`, 4 px item spacing |
| Links | `--primary`, **underline always**, `text-underline-offset: 3px`; external links get `rel="noopener noreferrer"` and open in a new tab |
| Inline code | `--surface-subtle` bg, 1 px `--border`, radius 6, 0.9em |
| Blockquote | `--surface-subtle` panel, radius 12, padding 12 16, `--text-muted` text (no side stripe) |
| Table | wrapper `overflow-x: auto`; header `--surface-subtle`; 1 px `--border` rows; numerals tabular; keyboard-focusable wrapper (`tabindex="0"`, `role="region"`, label) |
| Horizontal rule | 1 px `--border` |
| Math | deferred (Q3) |

**Code block**

- Header bar: language label (12 px, `--code-text` at 70 % via color-mix on neutral) · **Copy** button (icon + "Copy", → "Copied" for 1.6 s).
- Body: `--code-bg`, `--code-text`, 1 px `--code-border`, radius 14, padding 16, mono 13.5 px, `overflow-x: auto`, no wrapping, `tabindex="0"`.
- Same dark code surface in both themes (charcoal in light mode keeps code a distinct object, consistent with Design §11).

**Syntax palette** (all computed on `#242922` and `#202520`; every ratio ≥ 5.47)

| Token | Color | Ratio (light code bg / dark code bg) |
|---|---|---|
| Keyword | `#D7A64A` amber | 6.67 / 7.01 |
| String | `#A7B7A0` sage | 7.01 / 7.37 |
| Number / constant | `#E0976A` clay | 6.22 / 6.54 |
| Function / title | `#E8D9B0` sand | 10.59 / 11.12 |
| Built-in / type | `#8DB58B` moss | 6.44 / 6.77 |
| Comment | `#9A9F92` | 5.47 / 5.75 (italic) |
| Punctuation / operator | `#B4B8AC` | 7.34 / 7.72 |
| Variable / attribute | `#F3F0E8` ivory | 13.03 / 13.69 |
| Diff added / removed | `#A7B7A0` / `#E69A96` | with `+` / `−` gutter marks (never color-only) |

Library requirement: a highlighter must be configured **with this theme only**. Its bundled themes are not loaded (they ship blue/purple keywords). Sanitisation: Markdown → HTML → DOMPurify (allowlist, no `style`, no `on*`, no `javascript:` URLs) → inserted; code is never executed.

---

## 16. States

### 16.1 Loading / waiting (real work only)

- Request sent, no token yet: assistant slot shows a neutral 3-dot indicator (`--text-muted`, 1.2 s opacity cycle) + text "Waiting for a response…" (`role="status"`).
- Reduced motion: dots are static, text still shown.
- ≥ 15 s: adds "Taking longer than usual." and keeps Stop visible.
- Hard timeout (server-configured) → error state §16.4.

### 16.2 Streaming

- Text appears progressively; a 2 px `--primary` caret follows the last character (steady in reduced motion).
- Markdown re-render is throttled (≤ 1 per animation frame); layout never reflows earlier content (code blocks open their container at the opening fence).
- `aria-live` is **off** for streamed text (screen readers would read every token). A single `role="status"` announces "Response started" and "Response complete".
- Stop → keeps the partial text, appends an amber marker with text: "Stopped. This response is incomplete." + **Regenerate**.

### 16.3 Empty states

| Context | Content |
|---|---|
| No conversations | Sidebar list text only (§10); main area shows the welcome bento |
| Search no-match | §10 |
| Conversation open but empty (just created) | Welcome bento |
| Attachment list empty | No UI (control not shown) |

### 16.4 Errors (all inline, actionable, no internals)

Presentation: `--error-surface` panel with a 1 px `--error` border (radius 14; no thick side stripe), alert icon, heading in `--error` + one sentence + action(s), and `Reference: {request-id}` in 12 px muted text with a copy button. Role `alert`.

| Failure | Message | Actions |
|---|---|---|
| Network | **Can't reach Chatora.** Check your connection and try again. | Retry |
| Provider key missing/invalid | **Chatora isn't set up to answer yet.** The site owner needs to add an AI provider key. | — (no retry; reference ID shown) |
| Rate limit | **You're sending messages too quickly.** Try again in {n} seconds. | Retry (disabled until countdown ends, text updates every second, not announced each tick) |
| Provider timeout | **The model took too long to respond.** | Retry |
| Provider unavailable / model not found | **The AI service is unavailable right now.** | Retry |
| Message too long | **That message is over the {limit}-character limit.** Shorten it to send. | — (inline under composer) |
| Server error (5xx) | **Something went wrong on our side.** | Retry |
| Interrupted stream | **The connection dropped mid-response.** Partial text is kept. | Retry |

Failed turns keep the user message and any partial assistant text. They are visibly different from completed turns (panel + no action row except Retry).

---

## 17. Dialogs, menus, toasts

- **Dialog:** native `<dialog>` (focus-trap, Esc, inert background), `--surface`, radius 20, 24 padding, max-width 440, `--scrim` backdrop; first focus = least destructive action; returns focus to the invoker.
- **Delete conversation:** *Delete this conversation?* — "This permanently deletes the conversation and its messages. This can't be undone." — **Cancel** (default focus) · **Delete** (`--error` fill, white text 6.24:1).
- **Clear all history** (Settings): same pattern, requires typing nothing; button reads "Delete all conversations".
- **Rename:** inline in sidebar (see §10); on mobile a small dialog with one input.
- **Settings dialog** (two-column ≥ 768, single column below): **Appearance** (System / Light / Dark segmented control), **Model** (select if >1 configured, otherwise read-only), **Response style** (Concise / Balanced / Detailed — pending Q3), **Data** (Delete all conversations; Delete account if Q1 = yes), **Shortcuts** (read-only list), **Privacy** (link).
- **Export menu:** "Download as Text (.txt)" · "Download as Markdown (.md)" · "Print…".
- **Share dialog** (Tier 2): states — *Not shared* → "Create link"; *Shared* → read-only URL field + Copy + "Stop sharing" (revokes immediately; confirmation inline). Copy text: "Anyone with this link can read this conversation. They can't edit it."
- **Menus:** `role="menu"`, arrow-key navigation, typeahead, Esc closes and returns focus.
- **Toast:** bottom-center above the composer, `role="status"`, 4 s, neutral surface with icon; errors never use toasts (they use §16.4).

---

## 18. Authentication screens (conditional on Q1)

Centered single column, 400 px card on `--bg`, brand mark above, **no bento**. Routes: Login, Register, Logout (no screen — returns to Login), Reset password only if the backend implements email delivery (otherwise omitted, not stubbed).

- Fields: visible `<label>`, correct `autocomplete` (`email`, `current-password`, `new-password`), password visibility toggle (button with `aria-pressed`), inline validation text below the field with `aria-describedby`, errors never rely on color alone.
- Submit: full-width primary; shows spinner + "Signing in…" and is disabled while pending.
- Failure copy is generic ("Email or password is incorrect.") to avoid account enumeration.
- Registration states password rules before the user types; no hidden requirements.
- Footer link swaps Login ↔ Register.

---

## 19. File upload UI (Tier 2)

- Attach button opens a small popover/dialog: drop zone (dashed `--border-strong`, text "Drop a file or choose one") + accepted types + max size read from server config (never hard-coded in HTML).
- Selected file → chip above the textarea inside the composer: file icon, name (truncated), size, **Remove** (×). Progress bar (`--primary`) during upload; `role="progressbar"`.
- Failure states with distinct messages: unsupported type, too large, unreadable/corrupt, text could not be extracted. A file is only displayed as "attached" after the server confirms extraction succeeded.
- Chip persists in the sent message ("Attached: name.pdf") so the user can see what was processed.
- Client checks are UX only; the server re-validates (type, size, content).

---

## 20. Other screens

- **Shared conversation (read-only, Tier 2):** no sidebar/composer; slim header with brand + "Shared conversation · read-only"; same message rendering; revoked or unknown id → the 404 page (no hint whether it ever existed).
- **Print view:** `@media print` — hides sidebar, top bar, composer, action rows; ink-on-white; code blocks light grey `#F2F2F2` with 1 px border (no dark fills); link URLs appended in parentheses; page-break avoidance inside code blocks and table rows; header shows title and export date.
- **404 / 500:** centered brand mark, short heading ("Page not found" / "Something went wrong"), one sentence, "Back to Chatora" button. 500 shows the request reference ID, never a stack trace.
- **Privacy page:** simple read layout (680 px prose), content supplied by the backend plan (provider name, what is stored, retention, deletion controls).

---

## 21. Motion

- Durations: 150 ms (hover/focus), 200 ms (menus, dialogs, sidebar width), easing `cubic-bezier(.2,.0,.0,1)`.
- Allowed: opacity/background/border transitions, sidebar width, dialog fade+4 px rise, message fade-in (opacity only), loading-dots opacity, streaming caret.
- Forbidden: parallax, bounce/spring, background animation, scale > 1.01, anything > 250 ms in the interaction path.
- `@media (prefers-reduced-motion: reduce)`: transitions → 0.01 ms, dots/caret static, smooth scrolling off.
- Animate `opacity`, `transform` and `grid-template-columns` / `width` only where measured acceptable; no layout-thrashing properties during streaming.

---

## 22. Accessibility (WCAG 2.2 AA target)

- Landmarks: `<header>`, `<nav aria-label="Conversations">`, `<main>`, composer `<form>`; one `<h1>` per view (welcome heading / conversation title).
- Skip link ("Skip to message box") first in tab order.
- Message list: `role="log"`, `aria-live="off"` with explicit status announcements (§16.2).
- Focus: 2 px `--focus`, offset 2 px, never removed; `:focus-visible` only; ring has ≥3:1 against adjacent colors (6.91 light / 8.11 dark).
- Target size: ≥ 24×24 CSS px minimum (WCAG 2.2 2.5.8), design target 44 px on touch.
- Dragging not required (upload has a button); consistent help location (Settings → Shortcuts); no cognitive-test auth.
- `lang`, `title` per route; zoom to 200 % and 400 % reflow (single column at 320 px) with no horizontal scroll except inside code/table regions.
- Text-spacing override tolerant (no fixed heights on text containers).

---

## 23. Component inventory

| Component | Variants/states | Section |
|---|---|---|
| App shell | expanded · rail · drawer | 9 |
| Brand mark | mark+wordmark · mark only · favicon | 24 |
| Sidebar | expanded · rail · drawer | 10 |
| Conversation row | default · hover · selected · renaming · menu open | 10 |
| Search field | idle · focused · has results · no results | 10 |
| Top bar | with model label · dropdown · "Not configured" | 11 |
| Theme toggle | light · dark | 11 |
| Bento card | hero · supporting | 12 |
| Prompt suggestion | default · hover · focus · pressed | 12 |
| Chat message | user · assistant · failed · stopped | 13, 16 |
| Message actions | default · copied · disabled | 13 |
| Markdown renderer | all elements §15 | 15 |
| Code block | default · copied · overflow | 15 |
| Composer | empty · typing · over limit · in flight · disabled | 14 |
| Upload control + chip | idle · progress · error · done | 19 |
| Loading indicator | waiting · slow | 16.1 |
| Error panel | per §16.4 | 16.4 |
| Jump-to-latest pill | visible · hidden | 13 |
| Dialog | confirm · form · settings · share | 17 |
| Menu | conversation · export · model | 17 |
| Toast | neutral | 17 |
| Auth form | login · register | 18 |
| Segmented control | theme · response style | 17 |
| Empty state | search · list | 16.3 |

Removed vs. Design inventory: Voice control (not in PRD, no backend).

---

## 24. Brand mark and third-party default neutralisation

**Mark:** a rounded speech-bubble with a small four-point spark inside. Bubble `--primary`, spark `--on-primary`. Wordmark: "Chatora AI", Inter 600. No gradients; one color per element. Favicon is an SVG with `prefers-color-scheme` handling (green bubble/ivory spark on light, sage bubble/charcoal spark on dark) plus a 32 px PNG fallback.

**Browser/UA defaults that can render blue — all overridden:**

| Default | Override |
|---|---|
| Focus ring (`-webkit-focus-ring-color`) | `outline: 2px solid var(--focus)` on all focusable elements |
| Link colors (`LinkText`, visited) | `a { color: var(--primary) }`, visited identical |
| Text selection | `::selection { background: var(--selection) }` |
| Form-control accent (checkbox, radio, range, progress) | `accent-color: var(--primary)` |
| Caret | `caret-color: var(--primary)` |
| Autofill background (Chrome pale blue/lavender) | `input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px var(--surface) inset; -webkit-text-fill-color: var(--text) }` |
| Mobile tap highlight | `-webkit-tap-highlight-color: transparent` (focus ring and pressed state replace it) |
| Date/select popups, scrollbars | `color-scheme` set per theme; custom scrollbar `scrollbar-color: var(--border-strong) transparent` |
| `<mark>`, `<progress>`, `<meter>`, `<details>` markers | explicit token colors |
| Highlighter bundled theme | not loaded; custom theme only (§15) |
| Sanitizer/Markdown libs | no inline styles allowed through |
| Spellcheck underline | UA red — acceptable (not in the prohibited range) |

---

## 25. Forbidden-color audit

### 25.1 Automated (run on every PR and before release)

```bash
python3 tools/audit_colors.py templates static          # hue audit on all color literals
python3 tools/audit_colors.py --rendered http://localhost:5000   # optional: computed styles in both themes
```

Rule: parse every `#hex`, `rgb[a]()`, `hsl[a]()`, `color-mix()` input and named color; convert to HSL; **fail** on hue 165°–335° with saturation > 6%, and on any named color in {blue, navy, indigo, violet, purple, cyan, teal, turquoise, lavender, periwinkle, ...}. Also fail on color literals outside the token blocks.

### 25.2 Manual checklist (both themes)

- [ ] Default, hover, active, focus-visible, disabled, loading, error for: buttons, links, inputs, composer, cards, rows, menus, dialogs, toggles, segmented controls
- [ ] Text selection · caret · autofill · checkbox/radio/progress · scrollbars
- [ ] Code blocks, inline code, diffs, tables, blockquotes
- [ ] Streaming caret, loading dots, toasts, tooltips
- [ ] Logo, favicon, 404/500, auth, shared and print views
- [ ] Browser DevTools "Rendered" → no computed color with hue in 165–335°
- [ ] No gradients, glows or tinted shadows (`rgba` shadows are neutral `36,41,34` / `0,0,0`)
- [ ] Third-party libraries' own CSS inspected (highlighter, sanitiser, any icon/UI lib)
- [ ] `forced-colors` mode tested (system colors only; layout intact)

### 25.3 Result for this document's tokens

See §28 (computed on the spec's token table and the preview file).

---

## 26. Mapping to the existing Python architecture (no code written)

```
templates/
  base.html            shell: head theme script, skip link, sidebar, topbar, main, composer
  index.html           welcome bento + conversation mount
  shared.html          read-only shared view (Tier 2)
  print.html           print-friendly conversation
  privacy.html
  auth/login.html, auth/register.html     (if Q1 = yes)
  errors/404.html, errors/500.html
  partials/            sidebar, topbar, bento_card, message, code_block, dialogs, icons (SVG sprite)
static/
  css/tokens.css       §6.4 only — the only file with color literals
  css/base.css, layout.css, components.css, markdown.css, print.css
  js/theme-init.js     (inlined in head to avoid flash)
  js/chat.js, sidebar.js, markdown.js, dialogs.js, shortcuts.js
  fonts/               Inter variable (self-hosted)
  assets/              logo.svg, favicon.svg, favicon-32.png
```

Preserve existing filenames where they already exist (the inspection happens in the audit phase). Third-party JS (Markdown parser, sanitiser, highlighter) is vendored under `static/vendor/` with licenses, pinned versions, no CDN requirement.

---

## 27. Traceability and Definition of Done

### 27.1 PRD → design

| PRD item | Design element |
|---|---|
| Send via button/Enter, Shift+Enter | §14 |
| Typing indicator | §16.1 (honest variant, C2) |
| Auto-scroll when appropriate | §13 (80 px rule + Jump to latest) |
| Block duplicate submit | §14 (disabled + Stop) |
| Stop / Regenerate / Copy | §13, §14, §16.2 |
| Timestamps/metadata | G14 |
| New chat, delete/clear with confirm | §10, §17 |
| Rename/search/persist/restore | §10 |
| Markdown / code / copy code | §15 |
| Attachments | §19 (Tier 2) |
| Export TXT/MD, print | §17, §20 |
| Share/revoke | §17, §20 (Tier 2) |
| Dark/light + persist | §6.4, §11 |
| Settings, model settings, data deletion, shortcuts, tooltips | §17, G15 |
| Accounts | §18 (Q1) |
| Friendly errors, timeouts, rate limits | §16.4 |
| Model info, health, request IDs | §11, §16.4 |
| Privacy notice | §12.1, §20 |

### 27.2 Visual quality checklist (from Design §22, extended)

- [ ] Minimalism + Bento, 4-card welcome
- [ ] Light and dark palettes match §6, with documented changes only
- [ ] Forbidden-color audit passes (§25)
- [ ] Sidebar/rail/drawer work at 320, 768, 1200, 1440
- [ ] Bento collapses 4 → 2 → 1 with no overflow
- [ ] All states in §16 designed and reachable
- [ ] Keyboard-only walkthrough passes; focus visible everywhere
- [ ] Reduced motion honored
- [ ] No decorative/non-functional control; no placeholder developer text

### 27.3 Merged Definition of Done (design phase)

1. This document approved by you.
2. Open questions Q1–Q3 answered.
3. Preview reviewed in both themes and three viewports.
4. Hue audit result recorded in §28.

---

## 28. Verification record

Run on 2026-10-27 in the authoring sandbox.

| Check | Result |
|---|---|
| Hue audit (`audit_colors.py`) on `chatora-design-preview.html`: 36 distinct colors | **PASS** — highest-hue color is `#315C43` at 145°; nothing in 165°–335° with saturation > 6% |
| Same audit on this document's token tables: 38 distinct colors | **PASS** |
| Named color words (blue, navy, indigo, violet, purple, cyan, teal, …) in preview CSS | **None** |
| Color literals outside the token blocks in the preview | **0** |
| Contrast (computed) for every text/background pair in §6 and §15 | All ≥ 4.5:1 for text; ≥ 3:1 for `--border-strong` and focus ring |
| Impeccable detector hook on the preview file | No findings |

**Not verified (honest limits):**
- No headless browser could be installed in the sandbox, so I did **not** screenshot the preview, check layout at 320/390/900/1280 px, test `pointer: coarse` behaviour, or run a rendered-computed-style color audit. The container-query layout and the interactions were written but not exercised. Please open the preview and check the three viewports and both themes.
- Real Inter was not loaded (system fallback); line breaks will shift slightly with Inter.
- Keyboard walkthrough, screen-reader behaviour and `forced-colors` mode are untested.
- The preview uses container queries to switch viewports in-page; production CSS should use media queries (or the same container query on the shell).

**Preview-only deviations from the product spec** (to keep the preview self-contained): the delete confirmation is an in-frame overlay rather than a native `<dialog>`; the Send button shows a "not connected" toast because the product must never fabricate a reply.

