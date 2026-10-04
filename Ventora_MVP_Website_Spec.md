# VENTORA — MVP Website Specification

**Version:** 1.0 · **Date:** 2026-10-04 · **Status:** Ready for build
**Prepared for:** AI website-building agent + Ventora dev team (Roshan, Yash, Shivam, Yatharth)

---

## 0. How to Use This Document (read first, building agent)

You are building **Ventora**, an innovator–investor connection platform, as a **frontend-only MVP**. This document is the complete, self-contained source of truth. Build **exactly** what is specified — no extra features, no scope creep.

Operating rules:

1. **MVP only.** Anything listed in §2.2 (Non-Goals) must NOT be built. Do not add admin panels, notification centers, email flows, payment logic, or real databases.
2. **No backend, no database.** All persistence runs through a swappable data layer backed by `localStorage` (§3.4). Design every document to be MongoDB-shaped (§6) so a real Express + MongoDB Atlas backend can replace the adapter later without touching UI code.
3. **Deterministic AI score.** The Idea Completeness Score is a pure rule-engine function (§8.1). An optional LLM call only enriches the suggestion text when an API key is present — it never computes the score.
4. **No demo/seed data.** The app ships empty. Every screen must implement the empty states defined per page (§7) using the exact copy provided.
5. **Follow the wireframe layouts.** Screen structure, navigation groupings, field order and micro-copy come from the approved wireframe (§7 mirrors it screen by screen); visual styling comes from the design system (§5).
6. **Every interactive element must work.** No dead buttons. If a button exists in the UI but its feature is Phase 2, the button must not exist.
7. When this document and your assumptions conflict, **this document wins**. If something is genuinely ambiguous, choose the simplest option consistent with the MVP rules and note it in the code as `// SPEC-ASSUMPTION`.

---

## 1. Product Summary

Ventora is a web platform where **innovators** publish startup ideas and **investors** discover them. It deliberately avoids being a public listing site: ideas are shown as limited teasers, investors must pass identity verification (mock KYC in this MVP), and contacting an innovator costs a scarce **token**. An innovator always accepts or rejects each request; only after acceptance can the two parties chat. Financial deals happen offline — Ventora is a connection platform, not a transaction platform.

Three mechanisms differentiate Ventora and must be visible in the product:

| Mechanism | MVP implementation |
|---|---|
| **AI Completeness Score** | Deterministic rule engine scores a submission 0–100 across 9 dimensions, flags weak/missing sections, gates publishing (§8.1) |
| **Controlled Disclosure** | Public feed shows a strict whitelist of teaser fields; everything else renders as locked rows until a request is accepted (§8.3) |
| **Token-Based Outreach** | Investors get 10 tokens on verification; a connection request costs 1 token; declined/withdrawn requests auto-refund (§8.4) |

**One-line positioning (used on landing hero):** *"Where bold ideas meet the right investors."*

---

## 2. MVP Scope

### 2.1 In Scope (build all of it)

- Landing page with dual-role CTAs and how-it-works section
- Sign up with role selection (Innovator / Investor) + login/logout (mock auth, client-side sessions)
- Innovator: dashboard with stats, idea management table, 9-step idea submission form with autosave drafts, AI completeness result screen, publish/unpublish flow
- Innovator: connection-request inbox (accept / decline / ignore) with masked investor identities
- Investor: onboarding wizard (Step 1 mock KYC → Step 2 investment preferences), gated feed access
- Investor: personalized ranked feed (preference filters + match % + AI score), saved ideas, idea preview with locked sections, sent-requests view
- Token wallet page (balance + ledger history) and token spend/refund flows
- Post-acceptance chat (conversation list + thread, link attachments, same-browser live sync)
- Shared profile & settings page (edit name, investor preferences, logout, clear local data)
- Empty states, loading states, error states, toasts, form validation — everywhere

### 2.2 Non-Goals (do NOT build)

| Excluded feature | Why | Future phase note |
|---|---|---|
| Admin dashboard (screen 12 of wireframe) | MVP runs with hardcoded config constants (§8.4) | Phase 3 — token rules & KYC queue become admin-editable |
| Notification center | Sidebar badges are computed counts, not notifications | Phase 3 |
| Report / block users | Omitted; ⋯ menus exist visually only where spec'd | Phase 3 |
| Real / sandbox KYC provider | Mock flow: submit → 3s simulated review → verified | Phase 3 |
| File uploads (pitch decks, chat PDFs) | Attachments are URL links only | Phase 2 — Cloudinary/S3 |
| Cross-device real-time chat (Socket.IO) | Same-browser live sync only (§8.6) | Phase 2 — Socket.IO |
| MongoDB Atlas / Express API | Data layer interface is Mongo-shaped; adapter is localStorage | Phase 2 (§14 swap guide) |
| Email verification, password reset, Google OAuth | No email infra in MVP | Phase 3 |
| Token purchase / payments | Tokens granted once at KYC verification | Phase 3 |
| Investor re-request after decline | One request per investor per idea, final | Revisit in Phase 3 |

---

## 3. Tech Stack & Architecture

### 3.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **React 18** (JavaScript, JSX — no TypeScript) | Team is 1st-year B.Tech; keep the code approachable |
| Build tool | **Vite** | `npm create vite@latest ventora -- --template react` |
| Routing | **react-router-dom v6** | Routes listed in §4 per screen |
| Styling | **Tailwind CSS v3** | Design tokens in `tailwind.config.js` (§5.1) |
| State | React Context (`AuthContext`, `DataContext`) + local component state | No Redux/Zustand |
| Persistence | Swappable data layer → **localStorage adapter** (default) | §3.4 |
| AI score | Pure JS rule engine `src/lib/ai/completenessEngine.js` | §8.1 |
| LLM suggestions (optional) | `fetch` to an OpenAI-compatible chat endpoint when `VITE_LLM_API_KEY` is set | §8.1.6 |
| Icons | **lucide-react** | One consistent icon set |
| Fonts | **Inter** via `@fontsource/inter` (self-hosted, no CDN dependency) | Fallback: system-ui stack |

**Runtime requirements:** Node 18+, one terminal, `npm run dev` — nothing else. The app must work fully offline (no network calls except the optional LLM suggestion request).

### 3.2 Architecture Diagram (logical)

```
┌────────────────────────────── React SPA ──────────────────────────────┐
│                                                                       │
│  Pages (src/pages)          Contexts (src/context)                    │
│  ├─ Landing                 ├─ AuthContext  → session, currentUser    │
│  ├─ Signup / Login          └─ DataContext  → ideas, requests,       │
│  ├─ Innovator: Dashboard                       conversations, tokens  │
│  │   IdeaForm, ScoreResult,                                          │
│  │   RequestsInbox              ┌────────────────────────────────┐   │
│  ├─ Investor: Onboarding        │        src/lib/api.js          │   │
│  │   Feed, IdeaPreview,         │  async functions ONLY.          │   │
│  │   Saved, MyRequests,         │  Pages never touch storage.     │   │
│  │   Tokens                     └───────────┬────────────────────┘   │
│  ├─ Messages (chat)                         │                        │
│  └─ Profile                    ┌────────────▼────────────┐           │
│                                │  src/lib/db/ (adapter)   │           │
│  Components (src/components)   │  localStorageStore.js    │           │
│  ui primitives + layout shells │  (mongoStore.js — later) │           │
│                                └──────────────────────────┘           │
└───────────────────────────────────────────────────────────────────────┘
```

**The one architectural rule that matters:** pages and components never read/write `localStorage` directly and never import the AI engine — they call async functions from `src/lib/api.js` (`api.ideas.create(...)`, `api.requests.accept(...)`). This keeps the future MongoDB/Express swap a one-file change.

### 3.3 Naming & Code Conventions

- Components: `PascalCase.jsx`; hooks/utils: `camelCase.js`; constants: `SCREAMING_SNAKE`.
- One page component per route in `src/pages/<Area>/`; shared UI in `src/components/ui/`.
- All user-facing strings inline in JSX (no i18n layer) — copy must match this spec exactly.
- IDs: `crypto.randomUUID()` (string) — same shape as a MongoDB `ObjectId` string.
- Timestamps: ISO-8601 strings (`new Date().toISOString()`).
- Money: integer lakhs of rupees (`1500000`), displayed via `formatINR()` helper as `₹15L` / `₹15,00,000`.
- ESLint: Vite default. No Prettier config required.

### 3.4 Data Layer Contract

`src/lib/api.js` exposes namespaced async functions (full catalog in §9). The adapter behind it:

```js
// src/lib/db/localStorageStore.js
const PREFIX = "ventora:v1:";               // version key enables future migrations
export function read(collection)   { /* JSON.parse(localStorage[PREFIX+collection]) ?? [] */ }
export function write(collection, docs) { /* … */ }
export function insert(collection, doc) { /* assigns _id, createdAt */ }
export function updateOne(collection, _id, patch) { /* shallow-merge patch */ }
export function find(collection, predicate) { /* returns array */ }
```

Requirements:

1. Every write is synchronous JSON under the `ventora:v1:` prefix; keys = collection names (§6).
2. On app boot, if `ventora:v1:meta.version` is absent, initialize empty collections and set `meta = { version: 1, initializedAt }`.
3. `DataContext` loads all collections once at boot after login (single user browser) and exposes typed updaters; components subscribe via context.
4. **Live sync:** all writes dispatch `window.dispatchEvent(new CustomEvent("ventora:db", { detail: { collection, id } }))`. `DataContext` listens and refreshes. Chat additionally listens to the native `storage` event for cross-tab sync (§8.6).
5. `api.auth.logout()` and a "Clear local data" button in Profile (§7.15) remove every `ventora:v1:*` key.

### 3.5 Environment Variables

```
# .env.example
VITE_LLM_API_KEY=          # optional — enables LLM suggestions (§8.1.6)
VITE_LLM_BASE_URL=https://api.openai.com/v1   # any OpenAI-compatible endpoint
VITE_LLM_MODEL=gpt-4o-mini
```

App must boot and fully function with all of them empty.

---

## 4. Route Map (complete)

| # | Route | Screen | Access | Wireframe |
|---|---|---|---|---|
| 1 | `/` | Landing | public | 01 |
| 2 | `/signup` | Role selection + account form | public-only | 02 |
| 3 | `/login` | Login | public-only | 03 |
| 4 | `/dashboard` | Innovator dashboard | innovator | 04 |
| 5 | `/ideas/new` | Idea form (new draft) | innovator | 05 |
| 6 | `/ideas/:id/edit` | Idea form (edit) | innovator (owner) | 05 |
| 7 | `/ideas/:id/score` | AI completeness result | innovator (owner) | 06 |
| 8 | `/requests` | Innovator request inbox | innovator | 07 |
| 9 | `/onboarding/investor` | KYC + preferences wizard | investor | 08 |
| 10 | `/feed` | Investor feed | investor (KYC verified + prefs saved) | 09 |
| 11 | `/ideas/:id` | Idea preview (limited view) | investor (KYC verified) | 10 |
| 12 | `/saved` | Saved ideas | investor | 09 sidebar |
| 13 | `/my-requests` | Sent requests + statuses | investor | 09 sidebar |
| 14 | `/tokens` | Token wallet + ledger | investor | 09 sidebar |
| 15 | `/messages` | Chat (list + thread) | innovator & investor | 11 |
| 16 | `/profile` | Profile & settings | both roles | — |

Route guards (`src/components/routing/Guards.jsx`):

- `PublicOnly` — if a session exists, redirect by role (innovator → `/dashboard`, investor → `/feed` or `/onboarding/investor` if not onboarded).
- `RequireAuth` — no session → `/login` with `?next=` param preserved.
- `RequireRole("innovator"|"investor")` — wrong role → redirect to that role's home.
- `RequireVerifiedInvestor` — investor without `kyc.status === "verified"` → `/onboarding/investor`; verified but no saved preferences → wizard step 2.
- Investor idea preview `/ideas/:id` returns 404-style "Idea not available" if the idea is not `published` (drafts/paused are invisible to investors, even by direct URL).

**Post-login redirect matrix:** innovator → `/dashboard`; investor with `kyc.status === "verified"` and preferences → `/feed`; investor otherwise → `/onboarding/investor`.

---

## 5. Design System — "Clean SaaS"

The wireframe is a structural blueprint (grayscale boxes). Build its exact layout skeleton with this visual skin. Overall feel: **Linear/Notion** — white surfaces, generous whitespace, one indigo accent, soft shadows, 12px radii.

### 5.1 Design Tokens (`tailwind.config.js` → `theme.extend`)

```js
colors: {
  primary:  { DEFAULT:"#4F46E5", hover:"#4338CA", soft:"#EEF2FF", softHover:"#E0E7FF" },
  ink:      { DEFAULT:"#111827", secondary:"#374151", muted:"#6B7280", faint:"#9CA3AF" },
  surface:  { DEFAULT:"#FFFFFF", subtle:"#F9FAFB", raised:"#FFFFFF" },
  line:     { DEFAULT:"#E5E7EB", strong:"#D1D5DB" },
  success:  { DEFAULT:"#059669", soft:"#ECFDF5" },   // score ≥70, accepted, verified
  warning:  { DEFAULT:"#D97706", soft:"#FFFBEB" },   // score 40–69, pending, weak section
  danger:   { DEFAULT:"#DC2626", soft:"#FEF2F2" },   // errors, missing section, decline
  violet:   { DEFAULT:"#7C3AED" }                    // secondary accent (AI elements)
},
fontFamily: { sans: ["Inter","system-ui","sans-serif"], mono: ["JetBrains Mono","ui-monospace","monospace"] },
borderRadius: { DEFAULT:"0.5rem", lg:"0.75rem", xl:"1rem", full:"9999px" },
boxShadow: { card:"0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)",
             pop:"0 12px 32px rgba(16,24,40,.16)" }
```

### 5.2 Typography Scale

| Style | Classes | Used for |
|---|---|---|
| Display | `text-4xl font-bold tracking-tight` (36px) | Landing hero |
| H1 | `text-2xl font-semibold` | Page titles |
| H2 | `text-lg font-semibold` | Card/section titles |
| H3 | `text-base font-medium` | Sub-blocks, form section titles |
| Body | `text-sm text-ink-secondary leading-relaxed` | Default text |
| Caption | `text-xs text-ink-muted` | Helper text, timestamps, counters |
| Metric | `text-3xl font-bold tabular-nums` | Stat cards, token balance |
| Score | `text-5xl font-bold tabular-nums` | AI score gauge |

### 5.3 Component Inventory (`src/components/ui/`)

Build these once, reuse everywhere. Every component listed here is REQUIRED.

1. **Button** — variants: `primary` (indigo solid), `secondary` (white, 1px `line` border), `ghost` (transparent, hover `surface-subtle`), `danger` (red solid), `link`. Sizes: `sm` (h-8, text-xs), `md` (h-10, text-sm), `lg` (h-12, text-base). States: hover, active (`translate-y-px`), disabled (`opacity-50 cursor-not-allowed`), loading (spinner replaces label, keeps width).
2. **Input / Textarea / Select** — h-10, white bg, `line` border, radius, focus ring `ring-2 ring-primary/30 border-primary`; label above (`text-sm font-medium`), helper below (`text-xs text-ink-muted`), error state (`border-danger` + `text-xs text-danger` message below). Character counter bottom-right for textareas when spec'd.
3. **Field** — label + control + helper/error wrapper used by every form.
4. **Card** — `surface raised`, 1px `line`, `rounded-xl`, `shadow-card`, padding `p-5`. Variant `interactive` adds `hover:shadow-pop hover:-translate-y-0.5 transition`.
5. **Badge** — pill, `text-xs font-medium px-2 py-0.5 rounded-full`. Tones: `primary-soft`, `success-soft`, `warning-soft`, `danger-soft`, `neutral` (surface-subtle + ink-secondary). Used for industry tags, stage, KYC status, request status, "Weak⚠/Missing⚠".
6. **Tag** — as Badge but squarer (`rounded-md`) for industries/stages in feed cards.
7. **ProgressRing** — SVG ring for AI score: radius 56, stroke 8, track `line`, value arc color by band (danger/warning/success), big number centered (§5.2 Score).
8. **ProgressBar** — h-2 rounded track; used for per-section AI breakdown and autosave.
9. **StatCard** — Card with label (`text-xs text-ink-muted uppercase tracking-wide`), Metric number, optional delta/icon.
10. **Table** — simple bordered rows (`divide-y divide-line`), header row `text-xs uppercase text-ink-muted bg-surface-subtle`; rows hover `surface-subtle`.
11. **Modal** — overlay `bg-ink/40 backdrop-blur-sm`, centered panel `rounded-xl shadow-pop max-w-md`, Escape + overlay-click close (unless `persistent`), title + body + footer-right buttons.
12. **Toast** — bottom-right stack, auto-dismiss 4s, tones success/danger/info; `useToast()` hook from `ToastContext`.
13. **EmptyState** — icon in a `primary-soft` circle, title (`font-semibold`), one-line description, optional CTA Button. Copy per screen in §7.
14. **Stepper** — vertical (idea form) and horizontal (onboarding) variants; steps: done (✓, primary), current (filled dot, primary), todo (hollow, `line`).
15. **Tabs** — underline style: active `border-b-2 border-primary text-primary font-medium`; container `border-b border-line`.
16. **Avatar** — initials on deterministic hue (hash of `_id`) from a fixed 8-color pastel palette; sizes sm(8)/md(10)/lg(14); optional `verified` check overlay.
17. **LockedRow** — 🔒 row: dashed `line` border, `surface-subtle`, lock icon, label, `LOCKED` Badge; slight blur on label text (`blur-[1px]`) for flair.
18. **TokenChip** — coin icon (lucide `Coins`) + balance, `warning-soft` pill; used in investor topbar and tokens page.
19. **MatchRing** — small `tabular-nums` "Match: 94%" text-badged chip on feed cards.
20. **Skeleton** — `animate-pulse bg-surface-subtle rounded` block; shapes per page (cards, table rows).
21. **ConfirmDialog** — Modal wrapper with destructive/danger action (decline request, unpublish, delete draft, clear data).
22. **Navbar** (marketing) + **AppShell** (§5.5).
23. **ScoreChip** — small pill "AI score 86" with band color dot; used on feed cards and idea tables.

### 5.4 Iconography & Micro-interactions

- Icons: lucide-react, 16px inline, 20px standalone, `stroke-width 1.75`. Mapping: lightbulb (innovator), briefcase (investor), shield-check (KYC/verified), lock (locked content), coins (tokens), bell (badge counts), send, paperclip, search, heart (save), settings, plus, arrow-right.
- Transitions: `transition` (150ms) on all hovers; modals/toasts: 200ms fade+4px rise; score ring animates stroke-dashoffset 600ms ease-out on mount.
- Focus: visible `ring-2 ring-primary/30` on every interactive element (accessibility).
- No emojis in UI chrome — the wireframe's 🔔/🛡/🔒/♡ become lucide icons (`Bell`, `ShieldCheck`, `Lock`, `Heart`). Emoji allowed only inside message text bodies.

### 5.5 Layout Shells

**Marketing shell** (`Landing`, `Signup`, `Login`): top Navbar — left: logo block (`VENTORA` wordmark: `font-bold tracking-[0.2em]`, border 2px ink, px-3 py-1 — from wireframe), center: nav links (How it works, For Innovators, For Investors, About → anchor scroll on landing only), right: `Log in` ghost + `Get started` primary. Container `max-w-6xl mx-auto px-6`. Footer: `© Ventora — academic project` + disclaimer line (§7.1).

**App shell — Innovator** (`/dashboard`, `/ideas/*`, `/requests`): fixed left sidebar 240px (`bg-ink`, white text — matches wireframe dark sidebar):

```
VENTORA            (logo, white)
Innovator workspace
─ Dashboard
─ My Ideas
─ + Submit New Idea   (primary-soft highlight button)
─ Requests      [badge: pending count]
─ Messages      [badge: unread count]
─ Profile & Settings
(spacer)
[avatar] Name — Sign out icon
```

Topbar (right-aligned on content side): page title left; right: notification Bell with count badge + Avatar.

**App shell — Investor** (`/feed`, `/ideas/:id`, `/saved`, `/my-requests`, `/tokens`): same sidebar structure, items: My Feed, Saved ideas, My requests, Messages, Tokens [TokenChip with balance], Preferences (→ `/onboarding/investor?edit=1`), Profile & Settings. Topbar right shows TokenChip + Bell + Avatar.

**Chat** (`/messages`) uses a 2-pane variant: 320px conversation list + thread pane (§7.14), inside the role's AppShell on desktop; on mobile, list and thread are separate views with back navigation.

**Responsive:** breakpoints `sm 640 / md 768 / lg 1024`. Below `lg`: sidebar collapses to a slide-in drawer with a hamburger in the topbar; stat grids go 4→2→1 columns; feed cards full-width; chat becomes single-pane. The idea form stepper moves above the form as a horizontal scroll chip row on mobile.

---

## 6. Data Model (MongoDB-shaped documents)

Collection names and document shapes below are **exactly** what the future MongoDB Atlas database will use. The MVP stores these same objects in `localStorage` via the adapter (§3.4). All `_id`s are UUID strings; all timestamps ISO-8601 strings.

### 6.1 `users`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string (uuid) | auto | |
| `role` | `"innovator"` \| `"investor"` | ✅ | immutable after signup |
| `name` | string | ✅ | 2–60 chars |
| `email` | string | ✅ | unique key (lowercased, trimmed) |
| `passwordHash` | string | ✅ | SHA-256 hex via WebCrypto — **mock only**; real bcrypt/Argon2 arrives with the backend |
| `code` | string | auto | masked public identity: `I-` + 4 digits (innovator), `A-`/`B-`/`C-` + 4 digits (investor). Generated at signup from a counter in `meta` (`ventora:v1:meta.counters.users`). Displayed instead of name until acceptance (§8.3) |
| `avatarHue` | number | auto | `_id` hash → 0–7 pastel index |
| `investorType` | `"Angel"` \| `"VC"` \| `"Seed fund"` \| `"Corporate"` \| `"Other"` | investors | from onboarding step 1 |
| `kyc` | object | investors | `{ status: "unverified" \| "pending" \| "verified", legalName: string, idDocName: string, submittedAt: iso, verifiedAt: iso }` |
| `preferences` | object | investors | `{ industries: string[], stages: string[], rangeMin: number, rangeMax: number, locations: string[], businessModels: string[], savedAt: iso }` — see §6.8 enums |
| `createdAt` | string (iso) | auto | |

### 6.2 `ideas`

| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | string (uuid) | auto | |
| `innovatorId` | string → users._id | ✅ | owner |
| `basics` | object | ✅ | `{ title, industry, stage, oneLinePitch, location, businessModel }` — enums §6.8. `oneLinePitch` ≤140 chars (public teaser) |
| `sections` | object | ✅ | free-text blocks: `{ problem, solution, targetUsers, market, competitors, businessModel, revenueModel, fundingUse, growth }` — the 9 AI-scored dimensions (§8.1) |
| `funding` | object | ✅ | `{ amount: number (integer ₹, 0 allowed if "not raising yet" checked), currency: "INR" }` |
| `documents` | object | — | `{ pitchDeckUrl: string, notesUrl: string }` — URL strings only in MVP (no uploads) |
| `visibility` | object | auto | per-section disclosure: `{ [sectionKey]: "public" \| "accepted" \| "private" }` — defaults §8.3.2; editable via chips on form sections |
| `status` | `"draft"` \| `"published"` \| `"paused"` | ✅ | default `"draft"`. `paused` = hidden from feed, teaser URL shows "not available" |
| `score` | object | auto | `{ total: number, bands: "weak"|"developing"|"strong", sections: { [key]: { points, weight, status: "missing"|"weak"|"partial"|"strong" } }, engine: "rules", scoredAt: iso }` — computed by §8.1 on every save |
| `viewsCount` | number | auto | incremented when a KYC-verified investor opens `/ideas/:id` |
| `publishedAt` | string (iso) | — | set on first publish; refreshed on republish after pause |
| `createdAt` / `updatedAt` | string (iso) | auto | |

### 6.3 `tokenLedger`

| Field | Type | Notes |
|---|---|---|
| `_id` | string | |
| `investorId` | string → users._id | |
| `type` | `"grant"` \| `"spend"` \| `"refund"` | |
| `amount` | number | always positive; direction implied by `type` |
| `reason` | string | `"Welcome grant (KYC verified)"` / `"Connection request — “{idea title}”"` / `"Refund — request declined by innovator"` / `"Refund — request withdrawn"` |
| `refRequestId` | string | for spend/refund rows |
| `balanceAfter` | number | running balance — the wallet page renders this column |
| `createdAt` | string | |

Balance is **derived** as the sum of ledger rows; `balanceAfter` is denormalized for display and must be recomputed inside the same write operation (§8.4).

### 6.4 `connectionRequests`

| Field | Type | Notes |
|---|---|---|
| `_id` | string | |
| `ideaId` / `investorId` / `innovatorId` | strings | `investorId+ideaId` is a **unique pair** — one request ever per investor per idea in MVP |
| `status` | `"pending"` \| `"accepted"` \| `"declined"` \| `"withdrawn"` | state machine §8.5 |
| `message` | string | optional, ≤500 chars, shown in innovator inbox |
| `tokenTxId` | string → tokenLedger._id | the 1-token spend row |
| `createdAt` / `respondedAt` | string | |

### 6.5 `conversations`

`{ _id, requestId → connectionRequests._id, ideaId, investorId, innovatorId, createdAt, lastMessageAt, lastMessagePreview }` — created ONLY by request acceptance (§8.5). Unique on `requestId`.

### 6.6 `messages`

| Field | Type | Notes |
|---|---|---|
| `_id` | string | |
| `conversationId` | string | |
| `senderId` | string | `"system"` for the connection system message |
| `type` | `"text"` \| `"link"` \| `"system"` | `link` renders as a link card (URL + domain); MVP has no file uploads |
| `body` | string | ≤2000 chars; `link` stores the URL |
| `createdAt` | string | |
| `readBy` | string[] | user ids; unread badge = messages where `!readBy.includes(myId)` |

### 6.7 `savedIdeas`

`{ _id, investorId, ideaId, createdAt }` — unique on `investorId+ideaId`. Heart toggle on feed/preview cards.

### 6.8 Enumerations (single source: `src/lib/constants.js`)

```js
INDUSTRIES   = ["AgriTech","FinTech","HealthTech","EdTech","SaaS","D2C","CleanTech"]
STAGES       = ["Idea","MVP","Early traction","Growth"]
RANGES       = [[500000,2500000],[2500000,5000000],[5000000,10000000],[10000000,50000000]] // ₹5–25L … ₹1–5Cr
BIZ_MODELS   = ["B2B","B2C","Marketplace","Other"]
INVESTOR_TYPES = ["Angel","VC","Seed fund","Corporate","Other"]
// Token rules — future admin-configurable (wireframe screen 12)
TOKENS = { STARTING_GRANT: 10, REQUEST_COST: 1, REFUND_ON_DECLINE: true }
```

Location is free text (`locations: string[]` on preferences; `location: string` on idea basics — e.g. "Delhi NCR", "Remote").

### 6.9 Controlled-Disclosure Whitelist

**Public teaser (visible to any verified investor, no token):** `basics.title`, `basics.oneLinePitch`, `basics.industry`, `basics.stage`, `funding.amount`, `score.total`, `basics.location`, `basics.businessModel`, innovator's masked `code` + member-since + published-idea count.

**Locked until request acceptance:** every `sections.*` block, `documents.*`, and the innovator's real name/contact. Rendered as LockedRows (§5.3 #17). Full rules & visibility chips: §8.3.

### 6.10 Permission Matrix

| Action | Guest | Innovator | Investor (unverified) | Investor (verified) |
|---|---|---|---|---|
| View landing / signup / login | ✅ | ✅ | ✅ | ✅ |
| Create/publish ideas, edit own idea | — | ✅ | — | — |
| See own dashboard, stats, inbox | — | ✅ | — | — |
| Accept/decline requests to own ideas | — | ✅ | — | — |
| Browse feed / open idea previews | — | — | — | ✅ |
| Save ideas | — | — | — | ✅ |
| Send connection request (−1 token) | — | — | — | ✅ |
| Chat on accepted connections | — | ✅ | — | ✅ |
| See investor's real name | — | only after accepting their request | — | — |
| See innovator's real name | — | — | — | only after request accepted |

### 6.11 Session & Mock Auth Mechanics

- `ventora:v1:session` = `{ userId, createdAt }`. `AuthContext` hydrates from it on boot; `api.auth.login` validates email (unique) + SHA-256(password) match, then sets the session.
- Signup validations: name 2–60; email RFC-lite regex + uniqueness (case-insensitive); password ≥8 chars with ≥1 letter + ≥1 digit; confirm matches; terms checkbox required. Password stored as SHA-256 hex — display the wireframe's "bcrypt hashed" helper line as static copy ("Hashed before storage — real bcrypt lands with our backend").
- No email verification, no password reset in MVP: the login page "Forgot?" link shows a toast: *"Password reset isn't part of the MVP — for the demo, create a new account or ask the team."*
- Wrong credentials → inline field error "Incorrect email or password." (never reveal which part failed).
- Sessions never expire in MVP; logout + "Clear local data" (§7.15) are the escape hatches.

---

## 7. Page-by-Page Specifications

Every screen lists: **Layout** → **Behavior** → **States**. Empty-state copy is exact — the app ships with no demo data, so these states are what evaluators see first. All screens must also satisfy the responsive rules (§5.5).

### 7.1 Landing — `/`

**Layout (top→bottom, per wireframe 01):**
1. Marketing Navbar (§5.5).
2. **Hero**: two-column — left: Display headline *"Where bold ideas meet the right investors."*, subcopy: *"Ventora connects startup innovators with verified investors through AI-assisted idea evaluation, personalized feeds, and token-based, spam-free outreach."*; two CTAs: `I have an idea →` (primary, → `/signup?role=innovator`) and `I'm an investor →` (secondary, → `/signup?role=investor`); below CTAs, three trust markers with ShieldCheck/Lock icons: `Verified investors` · `Controlled disclosure` · `AI idea scoring`. Right column: hero illustration — a composed arrangement of UI cards (mini feed card + score ring + token chip built from real components at 0.9 scale) — no external images.
3. **How it works — 4 steps** (`id="how-it-works"`): numbered cards with icons: 1 Submit idea (FilePlus) → 2 AI completeness score (Gauge) → 3 Matched feed (LayoutList) → 4 Connect & chat (MessageCircle). One-line description each.
4. **For innovators** (`id="for-innovators"`): split card — bullets (structured idea presentation, AI score + improve tips, controlled visibility, approve who contacts you) + `Start as innovator` button.
5. **For investors** (`id="for-investors"`): split card — bullets (KYC-verified network badge for you too, personalized ranked feed, spend a token only when interested, chat after acceptance) + `Start as investor` button.
6. **Footer**: `© Ventora — academic project` and the disclaimer: *"Disclaimer: Ventora does not process investments. Deals happen offline."*

**Behavior:** nav anchors smooth-scroll (`scroll-behavior: smooth`); `?role=` preselects the signup role card; CTAs from logged-in users deep-link per redirect matrix (§4).

### 7.2 Sign Up — `/signup`

**Layout (wireframe 02):** centered `max-w-lg` card, title *"Create your account"*, helper *"Step 1 of 2 — choose how you'll use Ventora"*.

1. **Role cards** (2-up grid, radio-group semantics): **I'm an Innovator** (lightbulb icon, blurb *"Present your startup idea, get an AI completeness score, receive investor requests."*, button `Continue as Innovator`) / **I'm an Investor** (briefcase, *"Discover matched startups, verify identity (KYC), connect using tokens."*, `Continue as Investor`). Selected card: `ring-2 ring-primary border-primary`; preselected if `?role=` present.
2. **Account details** (revealed once a role is selected): Full name · Email address · Password (helper: *"min. 8 chars — hashed before storage"*) · Confirm password · checkbox *"I agree to the Terms & Privacy Policy"* (links open a Modal with 2-sentence placeholder text) · `Create account` (primary, full width) · footer link *"Already have an account? Log in"*.

**Behavior:** client validation (§6.11) on blur + on submit; submit button shows loading then creates user via `api.auth.signup({role,…})`, sets session, redirects: innovator → `/dashboard`; investor → `/onboarding/investor`.

**States:** inline field errors (danger text under field); duplicate email → "An account with this email already exists — try logging in."; role unselected on submit → error chip above cards.

### 7.3 Log In — `/login`

**Layout (wireframe 03):** centered card — *"Welcome back"*, Email, Password (with show/hide eye), row: `Forgot?` (link-styled), `Log in` primary full-width, info note: *"Sessions are stored locally in this MVP. JWT + email verification arrive with the backend."*, footer *"No account yet? Sign up"*. Google OAuth button: **do not render** (§2.2).

**Behavior:** on success redirect per matrix (§4). **States:** invalid credentials inline error; `?next=` honored only for same-origin paths.

### 7.4 Innovator Dashboard — `/dashboard`

**Layout (wireframe 04):** App shell (innovator). Content:

1. Greeting row: H1 *"Welcome back, {firstName}"*, sub *"Here's how your ideas are performing."*, right: `+ Submit new idea` (primary).
2. **Stat row** (4 StatCards, click-through where noted): Ideas submitted (→ scroll to table) · Published (→ table filtered) · Investor views (sum of `viewsCount`) · Pending requests (→ `/requests`).
3. **My ideas** Card: Table columns `Idea | AI Score | Status | Visibility | Requests | ""` — AI Score cell: ScoreChip with band color; Status: Badge (draft=warning-soft, published=success-soft, paused=neutral); Visibility: `Limited`/`Hidden` badge + on hover tooltip listing the 3 visibility modes (§8.3.2); Requests: pending count for that idea; row action: `Manage` (→ `/ideas/:id/edit`) — for drafts below publish gate show `Improve` (→ score page) instead, with a warning icon.
4. **Improvement banner** (conditional): if any draft's score < 50 or has `missing` sections — warning-soft banner: *"'{title}' scored {total} — the AI flagged {sections} as weak. Improve it before publishing."* with link `Improve now`.
5. **Latest connection requests** Card: up to 3 pending requests as rows — Avatar, masked investor name (`Investor #A-2417`), `✓ KYC verified` success Badge + investor type tag, line *"Interested in {idea title}"*, actions `Accept` (primary sm) / `Decline` (secondary sm) / `View all →` (link to `/requests`). Accept/Decline here use the same handlers as §7.7 (with ConfirmDialog on decline).
6. **Idea management actions** (in `Manage` dropdown or edit page header): Edit · Publish (if gate passed) / Unpublish (→ paused) / Resume · Delete draft (ConfirmDialog; published ideas can only be paused, not deleted, if they have requests).

**States (all four required):**
- *Empty (zero ideas)*: EmptyState icon Lightbulb — title *"No ideas yet"* — copy *"Your startup journey starts with one idea. Draft it section by section — our AI will score completeness as you go."* — CTA `+ Submit your first idea`.
- *Ideas but zero requests:* requests card shows EmptyState (Inbox icon) *"No requests yet"* / *"Verified investors who match your industry will appear here. A strong AI score helps you get discovered."*
- *Loading:* skeleton table rows + skeleton stat cards.
- *Error:* toast + inline retry block.

### 7.5 Idea Submission Form — `/ideas/new`, `/ideas/:id/edit`

**Layout (wireframe 05):** two-pane. Left: vertical Stepper with 9 steps (sticky). Right: current step's fields + footer buttons `Save draft` (secondary) / `Next: {Step} →` (primary; on step 9 → `Run AI analysis →`). Topbar-right shows autosave status text: *"Draft autosaved 2 min ago"* / *"Saving…"*.

| Step | Fields | Notes |
|---|---|---|
| 1 Basics | Startup/idea title* (≤80) · Industry* (Select) · Startup stage* (Select) · One-line pitch* (≤140, counter, helper: *"shown in the public feed"*) · Location (text, e.g. "Delhi NCR") · Business model (Select: B2B/B2C/Marketplace/Other) | — |
| 2 Problem | `problem` textarea* — helper: *"What problem are you solving, and for whom? (min. 200 characters for a good AI score)"* | IP disclaimer banner under field |
| 3 Solution | `solution` textarea* — *"How does your product solve it? Keep it high-level — no confidential implementation details."* | banner |
| 4 Target users | `targetUsers` textarea* — *"Who exactly is this for? Describe your first 100 users."* | banner |
| 5 Market & competitors | `market` textarea* — *"Market opportunity: size, growth, why now."* · `competitors` textarea* — *"List 2–3 existing alternatives and your differentiator. One per line."* | banner |
| 6 Business model | `businessModel` textarea* — *"How do you make money? Pricing, customers, channels."* · `revenueModel` textarea* — *"Who pays, how much, how often?"* | banner |
| 7 Funding requirement | `funding.amount` (number, ₹, with quick-select chips ₹5L/₹10L/₹15L/₹25L/₹50L) + checkbox *"Not raising yet"* (disables amount, stores 0) · `fundingUse` textarea* — *"What will the money be used for? Rough allocation."* · `growth` textarea — *"Growth potential: expansion, scalability, future lines."* | banner |
| 8 Documents | `documents.pitchDeckUrl` (URL input, optional, validated) · `documents.notesUrl` (URL, optional) · note: *"File uploads arrive in Phase 2 — share links for now. Documents stay private until you approve an investor."* | no banner needed |
| 9 Review & submit | read-only summary: basics, each section with status dot (missing/weak/partial/strong from live scoring), `visibility` chips editor (§8.3.2), button `Run AI analysis →` | — |

**Behavior:**
- **Autosave:** debounce 1.5s after any change → `api.ideas.saveDraft`; on first input a draft `_id` is created and URL replaces to `/ideas/:id/edit` (no history entry). Autosave status text cycles Saving… → "Draft autosaved just now" → relative time.
- **Live section status:** each textarea shows a small status dot + word count vs threshold (missing / weak / partial / strong per §8.1) so innovators see the score coming.
- **IP disclaimer banner** (per wireframe, on every free-text step): `ShieldCheck` icon, soft warning card: *"Do not include confidential IP or trade secrets here. Detailed documents stay private until you approve access."*
- **Per-section visibility chips** (as in wireframe, under each free-text field): segmented control `Public teaser | After request accepted | Private` — maps to `visibility[sectionKey]`; helper tooltip: *"Public teaser = shown in the feed. After request accepted = unlocked for accepted investors. Private = only you."* (default rules §8.3.2; must not exceed public whitelist §8.3.1 — if a chip is set to Public teaser for a non-whitelisted section, the preview shows it blurred with a note "public visibility pending approval" — simplest: chips for non-whitelisted sections offer only the last two options).
- **Draft persistence across sessions** via data layer; leaving with unsaved changes → `beforeunload` guard + Modal on internal nav.
- Validation: required marks enforced on Next; title/industry/stage/pitch required before draft creation.

**States:** *Loading (edit):* skeleton form; *Not found / not owner:* "Idea not available" page with back CTA; *Error:* toast, draft kept in memory.

### 7.6 AI Completeness Result — `/ideas/:id/score`

**Layout (wireframe 06):** centered column `max-w-3xl`.

1. Header: caption *"AI Completeness Analysis"*, H1 idea title, badge `engine: rule-based` + timestamp.
2. **ProgressRing** (§5.3) with `score.total` and label *"Completeness score / 100"*; ring color by band; 600ms animate-in.
3. **Section breakdown** Card: 9 rows — section name, ProgressBar (points/weight), status Badge (Strong=success, Partial/Good=primary-soft, Weak⚠=warning, Missing⚠=danger), points `x/weight`. Weak/missing rows expandable showing the rule-based tip (§8.1.5).
4. **AI Suggestions** Card (violet accent, Sparkles icon): rule-based suggestions list assembled from weak/missing sections; if `VITE_LLM_API_KEY` set → append LLM paragraph (§8.1.6) with a `AI-assisted` badge; else caption *"Tips are rule-based. Connect an AI key for richer suggestions."*
5. **Disclaimer note** (info card, mandatory): *"This score measures how complete your submission is. It is not a prediction of startup success or profitability."*
6. Action row: `← Improve weak sections` (secondary → edit page, deep-link `#step-{n}` to first weak/missing section) · `Save as draft` (ghost, if new) · `Publish to investor feed` (primary, **disabled with tooltip when gate fails**).

**Behavior:** score computed synchronously by the rule engine on entry (no spinner needed, but show 400ms skeleton for perceived analysis); publish gate = `total ≥ 50` AND no `missing` sections (§8.1.4). Passing gate → publish ConfirmDialog (*"Your idea's public teaser will be visible to verified investors. Sensitive sections stay locked."*) → status `published`, toast, redirect to `/dashboard`.

**States:** *Below gate:* CTA disabled, inline warning strip *"Publish unlocks at 50+ with no missing sections. You're at {total} — fix {n} section(s) above."* · *Error:* engine throws → danger toast *"Scoring failed — check the form and try again."*

### 7.7 Connection Requests (Innovator) — `/requests`

**Layout (wireframe 07):** page title *"Connection requests"*; Tabs: `Pending (n)` · `Accepted` · `Declined`. Request cards:

- Row 1: Avatar (initials only, masked), masked name `Investor #A-2417`, `✓ KYC verified` Badge, investor type Tag (Angel/Seed fund/…).
- Row 2 (meta line): *"Focus: {industries} · Stage: {stages} · Range: {₹min–max} · {n} connections made"* — pulled from investor `preferences` + count of their accepted requests.
- Row 3: `1 token spent` Chip (Coins icon) + their message in quotes (if any).
- Row 4 (pending only): actions right-aligned — `Ignore` (ghost, moves card to a collapsed "Ignored" tray, no response recorded), `Decline` (secondary → ConfirmDialog *"Declining refunds their token and they won't be able to request this idea again."*), `Accept & open chat` (primary).
- Accepted tab: cards show real investor name + `Open chat →`; also list unlocked-at timestamp. Declined tab: read-only history.
- Footer info note (per wireframe): *"Investor names stay masked until you accept. Reporting and blocking arrive in Phase 2."*

**Behavior:** Accept → `api.requests.accept` → conversation created + system message (§8.5) → toast *"Chat unlocked with {investor}”* → navigate `/messages?c={conversationId}`. Decline → status `declined` + refund ledger row (§8.4). Ignore → client-side hidden list stored under `ventora:v1:meta.ignoredRequests` (not a status change; pending stays pending).

**States:** *Empty pending:* EmptyState (Inbox) *"No pending requests"* / *"When a verified investor spends a token on your idea, it lands here for your approval."* · *Empty accepted/declined:* single-line muted text · *Loading:* skeleton cards.

### 7.8 Investor Onboarding — `/onboarding/investor`

Two-step wizard (wireframe 08). Header: *"Investor setup"*, horizontal Stepper (`Step 1 of 2 — Identity verification` / `Step 2 — Investment preferences`).

**Step 1 — Verify your identity (KYC, mock):** info banner (ShieldCheck): *"Ventora only allows verified investors to view ideas and send requests. This prototype uses a mock verification flow — no real government IDs are stored."* Fields: Full legal name* ("as per ID") · Investor type* (Select from `INVESTOR_TYPES`) · ID document (file input styled as dashed dropzone — **accepts the file but MVP stores only the file name** in `kyc.idDocName`; helper: *"Mock upload — nothing leaves your browser"*) · `Submit for verification` (primary).
On submit: `kyc.status = "pending"` → inline status card with animated dots *"Status: Pending review"* → after **3 seconds** simulated review → `verified` + success toast *"You're verified! One last step."* → auto-advance to step 2. The 3s timer is `setTimeout` — document it as `// SPEC: mock KYC review delay`.

**Step 2 — Investment preferences:** chips (multi-select, toggle style, min 1 industry): Preferred industries (`INDUSTRIES`) · Startup stage (`STAGES`, min 1) · Investment range (single Select of the 4 `RANGES` presets, shown as `₹5L — ₹25L`) · Location preference (tag input, e.g. "Delhi NCR, Bengaluru, Remote") · Business model (chips incl. `Any`) · Footer: `Skip for now` (ghost — saves empty prefs, investor can browse but feed shows setup prompt; **feed still requires verified KYC**) · `Save & build my feed →` (primary).
On save: `preferences` stored → toast *"Feed personalized!"* → `/feed`.

**States:** *Editing later* (`?edit=1` or sidebar → Preferences): same wizard, prefilled, button labels become `Save changes`; changing prefs re-ranks feed instantly (no cache). *Refresh during pending:* if `kyc.status === "pending"` on load, resume timer. *Blocked access attempts:* unverified investor hitting `/feed` → redirect to wizard with banner *"Verify your identity to unlock the feed."*

### 7.9 Personalized Investor Feed — `/feed`

**Layout (wireframe 09):** investor App shell. Content:

1. Header row: H1 *"Your matched feed"*, sub *"Ranked by your preferences: {industries} · {stages} · {range}"*, right: `⚙ Edit preferences` (link → wizard).
2. Controls row: sort Tabs — `Best match` · `Newest` · `Highest AI score`; filter Selects — Industry (All + `INDUSTRIES`), Stage (All + `STAGES`), Range (All + presets). Filters override preferences for the current view only.
3. **Idea teaser cards** (Card interactive, per wireframe): row 1 — industry Tag + ScoreChip (`AI score 86`); row 2 — H2 title; row 3 — one-line pitch (clamped 2 lines); row 4 — meta: `Stage: MVP · Seeking: ₹15L · Match: 94%` (MatchRing chip); row 5 — `♡ Save` (Heart toggle, fills primary when saved) + `View idea →` (link). **Cards render ONLY the §6.9 whitelist — no other idea fields exist in this component.**
4. Feed disclaimer strip (ShieldCheck, subtle): *"Cards show only the public teaser (title, pitch, industry, stage, funding need, AI score). Full details unlock after the innovator accepts your request."*
5. Pagination: none — show all matches, ranked; cap at 50 with "Showing top 50".

**Ranking:** `feedScore = 0.8 × match% + 0.2 × aiScore.total` where `match%` per §8.2. `Best match` sorts by feedScore desc; `Newest` by `publishedAt` desc; `Highest AI score` by score desc. Filters apply first (hard filter), then sort.

**States:**
- *No published ideas at all:* EmptyState (Telescope) *"The feed is quiet"* / *"No startups have been published yet. Check back soon — or widen your preferences to catch near-matches."*
- *Ideas exist but none match:* EmptyState (SlidersHorizontal) *"No matches right now"* / *"Nothing matches your current preferences. Widen your industries, stages or range to see near-matches."* + CTA `Adjust preferences` + link `Show near-matches` (toggles §8.2 near-match mode, cards outside prefs get a neutral tag `Outside your range`).
- *Preferences skipped:* banner above list: *"You skipped preferences — showing everything, unranked. Edit preferences to get matched."*
- *Loading:* 3 skeleton cards.

### 7.10 Idea Preview (Limited View) — `/ideas/:id`

**Layout (wireframe 10):** investor sees:

1. Header: tags row (industry Tag, `MVP stage` Tag, ScoreChip) · H1 title · `♡ Save` toggle.
2. **Public sections** (from whitelist + innovator's `visibility` chips): "The problem" block — the problem textarea IF `visibility.problem === "public"`, else LockedRow; "High-level solution" block — solution IF public, else LockedRow; "Funding requirement" block — always public: `₹15,00,000` formatted + stage context.
3. **Locked sections** list — LockedRow components: `Business model & revenue details`, `Market & competitors`, `Growth plan`, `Pitch deck {name}` (if documents exist) / generic `Founder documents`, `Founder contact & team details` — each with LOCKED Badge. Caption under list: *"Locked sections prove what exists without exposing it — your token unlocks the conversation, the innovator unlocks the content."*
4. **About the innovator** Card: Avatar, masked name `Innovator #I-3108`, *"Member since {year} · {n} published ideas"*.
5. **CTA card** (sticky on desktop): big Button `Use 1 token — send connection request`; under it helper: *"You have {n} tokens. Token is refunded if the innovator declines."* (wireframe's 14-day window is Phase 3 config — omit time clause in MVP); ShieldCheck note: *"Full details unlock only if the innovator accepts your request."*

**Behavior:** view increments `viewsCount` once per investor per idea per session. `Send request` opens Modal: idea title recap, optional message textarea (≤500, placeholder: *"Introduce yourself and why this idea fits your thesis…"*), summary row `Cost: 1 token (balance {n} → {n-1})`, `Send request` primary / `Cancel`. Insufficient tokens (< 1) → CTA disabled, helper becomes danger text: *"You're out of tokens. Declined requests refund automatically — tokens can't be purchased in the MVP."* Already-requested idea → CTA replaced by status Badge (`Request pending` / `Accepted — open chat →` / `Declined — can't re-request in MVP`).

**States:** *Not found / not published:* "Idea not available" page (§4 guard) · *Own idea (innovator clicking a feed URL):* redirect to edit page · *Loading:* skeleton header + locked rows.

### 7.11 Saved Ideas — `/saved`

Simple list of saved teaser cards (same card as feed, minus MatchRing), sorted by save-date desc. Heart toggle unsaves with toast + Undo action (5s window). **Empty:** EmptyState (Heart) *"Nothing saved yet"* / *"Tap the heart on any idea in your feed to shortlist it here."*

### 7.12 My Requests — `/my-requests`

Investor's sent requests, newest first; filter Tabs `Pending / Accepted / Declined / Withdrawn`. Card rows: idea title (→ preview), innovator masked code, sent date, status Badge, your message excerpt, side effects column — accepted: `Chat unlocked →` link; declined: `+1 token refunded` Chip; pending: `Withdraw` (ghost, ConfirmDialog: *"Withdraw now? Your token is refunded immediately."*). **Empty:** EmptyState (Send) *"No requests sent"* / *"Browse your matched feed and spend a token when an idea genuinely fits your thesis."*

### 7.13 Token Wallet — `/tokens`

**Layout:** header — big Metric token balance + caption *"Available tokens"*; explainer Card ("How tokens work"): bullets — *"You received {STARTING_GRANT} tokens when your KYC was verified."* · *"A connection request costs 1 token."* · *"Declined or withdrawn requests refund your token automatically."* · *"Tokens can't be purchased in the MVP — scarcity keeps outreach intentional."*; **Ledger** Table: `Date | Type (grant/spend/refund Badge with +/-) | Reason | Amount | Balance` from `tokenLedger` desc. **Empty ledger (no grant yet):** EmptyState (Coins) *"No tokens yet"* / *"Complete investor verification to receive your starting tokens."* (can only occur pre-KYC — page is still viewable for transparency).

### 7.14 Chat — `/messages`

**Layout (wireframe 11):** two-pane in App shell.

- **Conversation list (left, 320px):** search input (filters by idea title / counterparty code) · conversation rows: Avatar, masked counterparty name (`Investor #A-2417` / `Innovator #I-3108`), context line *"AgriDrone Analytics"*, presence dot (green if that user's session tab is open in this browser — derived from BroadcastChannel heartbeat; else last-active caption), unread Badge (count). Selected row: `bg-primary-soft`.
- **Thread pane (right):** header — counterparty + `✓ KYC` badge (investor side), context *"Re: {idea title} · Connected {relative date}"*, `Shared links (n)` chip (filters messages to `type:"link"`), ⋯ menu (single item: `View idea →`; Report/Block omitted per §2.2). Pinned system message: `— Connection accepted · chat unlocked —`. Messages: bubbles — mine `bg-primary text-white rounded-2xl rounded-br-sm`, theirs `bg-surface-subtle border line`; `link` type renders a link card (domain favicon via letter avatar, URL truncated, `Open ↗`). Day separators (`Today` / date). Composer: `Paperclip` button (opens small popover: *"Paste a link instead — file sharing arrives in Phase 2"* with URL input), textarea (auto-grow to 4 rows, Enter sends / Shift+Enter newline), `Send` primary (disabled when empty).

**Behavior:** send → `api.messages.send` → optimistic append; list refreshes via the `ventora:db` event; **cross-tab live sync** via `storage` event listener (§8.6) — open the app in two tabs (innovator tab + investor tab of the same browser) and messages appear without refresh; unread marks cleared on thread open; empty thread (fresh accept) shows only the system message.

**States:** *No conversations:* full-page EmptyState (MessageCircle) *"No conversations yet"* / innovator: *"Accept a connection request to start chatting with investors."* / investor: *"Chat unlocks when an innovator accepts your request."* · *No thread selected (desktop):* ghost pane with the same guidance · *Loading:* skeleton rows.

### 7.15 Profile & Settings — `/profile`

**Layout:** Cards stack. (1) **Account:** avatar preview, name (editable), email (read-only, muted note *"Email changes arrive with the backend"*), role Badge, member-since. Save → toast. (2) **Password:** current + new + confirm — MVP verifies against stored SHA-256 and re-hashes; helper: *"Real hashed resets arrive with the backend."* (3) **Investor preferences** (investors only): embedded edit form = wizard step 2 fields; save re-ranks feed. (4) **Data & session:** `Sign out` (secondary) · `Clear local data` (danger, ConfirmDialog: *"This deletes every account, idea, request and message stored in this browser. This cannot be undone."*) → wipes `ventora:v1:*`, redirect `/`.

---

## 8. Core Feature Logic

### 8.1 AI Completeness Engine — `src/lib/ai/completenessEngine.js`

A **pure function**: `analyzeIdea(idea) → score` where `score = { total, band, sections, engine: "rules", scoredAt }`. No network, no randomness — the same input always yields the same score (hybrid LLM text is separate, §8.1.6).

#### 8.1.1 The 9 scored dimensions & weights (sum = 100)

| # | Key (maps to form step) | Weight | Section prompt on form |
|---|---|---|---|
| 1 | `problem` (2) | 12 | What problem are you solving, and for whom? |
| 2 | `solution` (3) | 14 | How does your product solve it? |
| 3 | `targetUsers` (4) | 10 | Who exactly is this for? |
| 4 | `market` (5a) | 12 | Market opportunity: size, growth, why now |
| 5 | `competitors` (5b) | 10 | Existing alternatives + differentiator |
| 6 | `businessModel` (6a) | 12 | How do you make money? |
| 7 | `revenueModel` (6b) | 12 | Who pays, how much, how often? |
| 8 | `fundingUse` (7) | 10 | What will the money be used for? |
| 9 | `growth` (7) | 8 | Growth potential & expansion |

#### 8.1.2 Per-section scoring (0–100 each, deterministic)

```
words = body.trim().split(/\s+/).filter(Boolean).length
status rules (in order):
  words === 0                       → missing (0 pts)
  words < MIN_WORDS                 → weak    (30 pts)
  words < GOOD_WORDS                → partial (65 pts)
  else                              → strong  (100 pts)
then apply section-specific CHECKS (subtract penalties, floor at partial):
```

`MIN_WORDS`/`GOOD_WORDS` defaults: `problem 25/60 · solution 25/60 · targetUsers 15/40 · market 20/50 · competitors 15/40 · businessModel 20/50 · revenueModel 15/40 · fundingUse 12/30 · growth 12/30` (constants in `scoringConfig.js`).

**Section-specific checks (deterministic, documented for viva):**

- `market` — must contain at least one numeral (`/\d/`) representing a size/growth figure; if none: −15 pts and flag `"Add a concrete market size or growth figure (a number)."`
- `competitors` — count competitor entries = number of non-empty lines (spec: one per line); `< 2` lines → −20 pts and flag `"Name at least 2 competitors or alternatives."`
- `revenueModel` — must contain a numeral (price/fee/percentage); if none: −15 pts, flag `"Quantify pricing — who pays, how much, how often."`
- `fundingUse` — requires the section AND at least one numeral; if `funding.amount === 0` (not raising) this section scores `strong` if ≥ MIN_WORDS, else `partial` (don't punish self-declared non-raisers twice).
- `businessModel` — must contain at least one of the tokens `B2B` / `B2C` / `marketplace` / `subscription` / `commission` (case-insensitive); if none: −10 pts, flag `"State whether you are B2B, B2C, a marketplace, or another model."`

Section points → `sections[key] = { points, weight, status }`; `status` bands: `missing` / `weak` / `partial` / `strong` (wireframe wording maps: Strong / Good / Weak⚠ / Missing⚠ — display "Partial" as "Good").

#### 8.1.3 Total score & bands

```
total = Σ (sectionPoints / 100) × weight     // 0–100, round to int
band:  total < 40 → "weak" (danger) · 40–69 → "developing" (warning) · ≥ 70 → "strong" (success)
```

#### 8.1.4 Publish gate

`canPublish = total ≥ 50 && no section has status "missing"`. The gate is enforced in `api.ideas.publish` (server-side-in-spirit) **and** mirrored in UI (disabled CTA + reason strip on §7.6). Drafts can always be saved regardless of score.

#### 8.1.5 Rule-based feedback library (`feedbackTips.js`)

Per section, first matching rule wins; rendered as expandable rows + the suggestions card:

| Section | missing | weak |
|---|---|---|
| problem | *"Describe the problem: who feels it, how often, and what it costs them today."* | *"Add specifics — the user, the frequency, and the current workaround's cost."* |
| solution | *"Explain your product's approach in plain words. No confidential implementation details needed."* | *"Clarify the core mechanism — what happens when a user uses your product?"* |
| targetUsers | *"Define your first 100 users: role, context, and where to find them."* | *"Narrow it down: a specific segment beats 'everyone'."* |
| market | *"Estimate market size and growth — even a top-down estimate with sources."* | *(see §8.1.2 numeric flag)* |
| competitors | *"List 2–3 alternatives (including 'doing it manually') and your differentiator."* | *(see §8.1.2 count flag)* |
| businessModel | *"Explain who pays and through which channel."* | *(see §8.1.2 token flag)* |
| revenueModel | *"Quantify revenue: price point, billing frequency, expected margin."* | *(see §8.1.2 numeric flag)* |
| fundingUse | *(skipped when not raising)* / *"Break the raise into rough allocation buckets."* | *"Add numbers — e.g. 40% product, 30% growth, 30% ops."* |
| growth | *"Sketch the expansion path: new segments, geographies, or product lines."* | *"Name one concrete expansion trigger (e.g. 'after 50 paying clinics')." |

**LLM hybrid suggestions card intro (always shown):** first two weak/missing fixes as bullets, e.g. *"Add a revenue model (who pays, how much, how often). Name 2–3 competitors and your differentiator. Each fix re-runs the analysis instantly."*

#### 8.1.6 Optional LLM layer (hybrid mode)

Trigger: only when `VITE_LLM_API_KEY` is set AND `score.total < 90`. After the rule engine returns, fire a background request (never blocks rendering):

```js
// src/lib/ai/llmSuggestions.js
prompt = `Startup idea sections (JSON). For each weak/missing section give ONE
concrete improvement sentence. Do not assess success probability. Max 120 words.
Sections: ${JSON.stringify(pick(idea.sections, weakKeys))}`
POST {VITE_LLM_BASE_URL}/chat/completions  (model: VITE_LLM_MODEL, temperature 0.4, timeout 8s)
```

Render: append paragraph under rule-based bullets with badge `AI-assisted suggestions`. Failure/timeout/absent key → silent fallback (caption: *"Tips are rule-based."*). The **score never comes from the LLM** — display copy on §7.6 stays truthful.

### 8.2 Feed Matching & Ranking — `src/lib/matching.js`

```
match%(idea, prefs):
  industryMatch = prefs.industries.includes(idea.basics.industry) ? 1 : 0
  stageMatch    = prefs.stages.includes(idea.basics.stage) ? 1 : 0
  rangeMatch    = funding.amount===0 ? 1 : clamp01(1 - distance beyond bounds / rangeWidth)
  locationMatch = any pref location is substring of idea.basics.location (either empty → 0.5 neutral)
  modelMatch    = prefs.businessModels includes "Any" or idea.basics.businessModel ? 1 : 0
  match% = round(100 × (0.30·industry + 0.20·stage + 0.25·range + 0.15·location + 0.10·model))
feedScore = 0.8 × match% + 0.2 × idea.score.total
```

- **Hard filter (default):** industry AND stage must match AND (amount within range OR amount = 0). Range presets are non-overlapping, so `rangeMatch` is binary for preset prefs — the formula above future-proofs custom ranges.
- **Near-match mode** (toggle from empty state, §7.9): drops the hard filter; items failing industry/stage/range get the neutral badge `Outside your range` and sort below matches.
- Match % is displayed on cards only when preferences exist; skipped-preferences feeds show unranked (newest first) without Match chips.

### 8.3 Controlled Disclosure Rules

1. **Public teaser whitelist (§6.9) is enforced in code**, not by convention: `src/lib/disclosure.js` exports `publicTeaser(idea)` returning exactly the whitelisted fields. Feed/preview components may only consume that function's output.
2. **Per-section visibility chips** (form step 9, §7.5): each of the 9 sections gets `public | accepted | private`. Defaults: `problem → public`, `solution → public`, all others → `accepted`. Whitelisted teaser fields (title/pitch/industry/stage/funding/location/model/score) are **always public** regardless of chips.
3. Preview page logic per section: `public` → render text · `accepted` → LockedRow until the viewer investor has an `accepted` request for this idea · `private` → LockedRow always, label `Private` (shown only as an existing row, content never rendered).
4. **Identity masking:** counterparties display as `Investor #A-2417` / `Innovator #I-3108` (the `code` field) until an accepted connection exists between the two users; after acceptance, real names render everywhere that pair appears (requests card, chat, thread header).
5. The innovator's own dashboard/edit/preview always shows full content to themselves.

### 8.4 Token Economics

- **Grant:** on `kyc.status → verified`, insert `grant` row `STARTING_GRANT (10)`, reason *"Welcome grant (KYC verified)"*. Once only (guard: no prior grant row for user).
- **Spend:** sending a request inserts a `spend` row of `REQUEST_COST (1)` atomically with the request — if `balance < 1`, `api.requests.send` rejects with `INSUFFICIENT_TOKENS` (UI prevents, but the check is in the API function too).
- **Refund:** on `declined` (by innovator) or `withdrawn` (by investor): insert `refund` row referencing the original `spend.refRequestId`. One refund per request (state machine guarantees terminal states, §8.5).
- **Balance invariant:** `balance = Σ ledger.amount × (type === "spend" ? -1 : +1)`; every write recomputes `balanceAfter` for the new row inside one synchronous operation (no race in single-browser MVP).
- All constants live in `src/lib/constants.js` (`TOKENS`) with a comment pointing at the future admin-configurable screen 12.

### 8.5 Connection Request State Machine

```
            send (−1 token)
   [none] ───────────────▶  pending ──▶ accepted   (chat created + system message)
                              │  │
              withdraw (refund)│  └─────▶ declined (refund)
                              ▼
                          withdrawn
```

- Transitions and side effects are implemented ONLY inside `api.requests.*` functions (§9) — UI just calls them.
- `accepted`: creates the conversation (unique per request) + system message `— Connection accepted · chat unlocked —` + unmasks both identities for that pair (§8.3.4).
- **Uniqueness:** one request per `(investorId, ideaId)` ever — a declined idea cannot be re-requested in MVP (wireframe's "re-request after window" is Phase 3).
- Innovator `Ignore` (§7.7) is a UI-level hide, not a state change; the request stays `pending`.
- Investors see live status on `/my-requests`; no polling needed — the `ventora:db` event refreshes `DataContext`.

### 8.6 Chat & Live Sync (MVP scope)

- **Same-browser live sync:** `DataContext` refreshes on the custom `ventora:db` event (same tab) and on the native `storage` event (other tabs). Demo flow: innovator tab + investor tab side by side → messages appear within ~1s. This is explicitly a UI-complete simulation of the future Socket.IO layer (§2.2, §14).
- **Presence:** each open tab broadcasts `{userId, ts}` on a `BroadcastChannel("ventora:presence")` every 10s; a counterparty is "Online ●" if a heartbeat arrived < 25s ago **in this browser**; otherwise show last-active caption from their last message. Label it honestly: presence is per-browser in MVP.
- **Unread:** badge on sidebar `Messages` + conversation rows = messages where `senderId !== me && !readBy.includes(me)`; opening a thread marks read via `api.messages.markRead`.
- **System messages** are not deletable and always render centered muted.
- No typing indicators, read receipts, deletion, or emoji picker in MVP (plain text only; URLs in text bodies are NOT auto-linked — use the link attachment).

---

## 9. Data-Layer API Catalog — `src/lib/api.js`

All functions are `async`, validate inputs, throw `ApiError { code, message }`, and map 1:1 to future Express routes (right column) so the Phase-2 backend swap is mechanical. UI never bypasses this module.

### 9.1 auth & users

| Function | Returns | Future route |
|---|---|---|
| `api.auth.signup({ role, name, email, password })` | `{ user }` (session set) | `POST /api/auth/signup` |
| `api.auth.login({ email, password })` | `{ user }` | `POST /api/auth/login` |
| `api.auth.logout()` | `void` (clears session) | `POST /api/auth/logout` |
| `api.auth.me()` | `user \| null` | `GET /api/auth/me` |
| `api.users.updateProfile({ name })` | `{ user }` | `PATCH /api/users/me` |
| `api.users.changePassword({ current, next })` | `void` | `POST /api/users/me/password` |
| `api.users.savePreferences(prefs)` | `{ user }` | `PUT /api/users/me/preferences` |

Error codes: `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `VALIDATION` (message lists field errors), `WRONG_PASSWORD`.

### 9.2 kyc

| Function | Returns | Future route |
|---|---|---|
| `api.kyc.submit({ legalName, investorType, idDocName })` | `{ user }` (status→pending) | `POST /api/kyc/submit` |
| `api.kyc.poll()` | `{ status }` — resolves `verified` after the 3s mock delay (single re-check, not an interval) | `GET /api/kyc/status` |

### 9.3 ideas

| Function | Returns | Future route |
|---|---|---|
| `api.ideas.createDraft({ ownerId, basics })` | `{ idea }` | `POST /api/ideas` |
| `api.ideas.saveDraft({ ideaId, patch })` | `{ idea }` — shallow-merge, recomputes `score` via §8.1, `updatedAt` | `PATCH /api/ideas/:id` |
| `api.ideas.get({ ideaId })` | `{ idea }` | `GET /api/ideas/:id` |
| `api.ideas.listMine({ innovatorId })` | `[idea]` (own, all statuses) | `GET /api/ideas/mine` |
| `api.ideas.publish({ ideaId })` | `{ idea }` — enforces gate (§8.1.4), sets `publishedAt` | `POST /api/ideas/:id/publish` |
| `api.ideas.pause({ ideaId })` / `api.ideas.resume({ ideaId })` | `{ idea }` | `POST /api/ideas/:id/pause` `/resume` |
| `api.ideas.deleteDraft({ ideaId })` | `void` — only drafts with zero requests | `DELETE /api/ideas/:id` |
| `api.ideas.publicTeaser({ ideaId, viewerId })` | `{ teaser }` — §6.9 whitelist + `match%` (§8.2) | `GET /api/ideas/:id/teaser` |
| `api.ideas.registerView({ ideaId, viewerId })` | `void` — once per viewer/session | `POST /api/ideas/:id/view` |

Error codes: `NOT_FOUND`, `NOT_OWNER`, `BELOW_PUBLISH_GATE` (message lists missing/weak sections), `HAS_REQUESTS`.

### 9.4 feed

| Function | Returns | Future route |
|---|---|---|
| `api.feed.list({ investorId, sort, filters, nearMatch })` | `[teaser]` — hard-filtered & ranked per §8.2; near-match mode appends `outsidePrefs: true` items sorted after matches | `GET /api/feed` |

### 9.5 tokens

| Function | Returns | Future route |
|---|---|---|
| `api.tokens.balance({ investorId })` | `{ balance }` | `GET /api/tokens/balance` |
| `api.tokens.ledger({ investorId })` | `[entry]` desc | `GET /api/tokens/ledger` |
| `api.tokens.grantWelcome({ investorId })` | `void` — idempotent | `POST /api/tokens/grant` (internal) |

### 9.6 requests

| Function | Returns | Future route |
|---|---|---|
| `api.requests.send({ investorId, ideaId, message })` | `{ request }` — atomic: balance check → spend row → request | `POST /api/requests` |
| `api.requests.listForInnovator({ innovatorId })` | `[request + investor summary]` | `GET /api/requests/incoming` |
| `api.requests.listForInvestor({ investorId })` | `[request + idea summary]` | `GET /api/requests/mine` |
| `api.requests.accept({ requestId })` | `{ request, conversation }` | `POST /api/requests/:id/accept` |
| `api.requests.decline({ requestId })` | `{ request }` + refund row | `POST /api/requests/:id/decline` |
| `api.requests.withdraw({ requestId })` | `{ request }` + refund row | `POST /api/requests/:id/withdraw` |

Error codes: `INSUFFICIENT_TOKENS`, `DUPLICATE_REQUEST`, `ALREADY_RESOLVED`, `NOT_YOUR_REQUEST`.

### 9.7 conversations & messages

| Function | Returns | Future route |
|---|---|---|
| `api.conversations.listMine({ userId })` | `[conversation + counterpart + unread]` | `GET /api/conversations` |
| `api.conversations.get({ conversationId })` | `{ conversation }` — 403 unless participant | `GET /api/conversations/:id` |
| `api.messages.list({ conversationId })` | `[message]` asc | `GET /api/conversations/:id/messages` |
| `api.messages.send({ conversationId, senderId, type, body })` | `{ message }` | `POST /api/conversations/:id/messages` |
| `api.messages.markRead({ conversationId, userId })` | `void` | `POST /api/conversations/:id/read` |

### 9.8 saved

`api.saved.toggle({ investorId, ideaId }) → { saved: boolean }` · `api.saved.list({ investorId }) → [teaser]` — future: `POST/DELETE /api/saved`, `GET /api/saved`.

---

## 10. End-to-End Journeys (acceptance walkthroughs)

**J1 — Innovator publishes an idea:** Landing → `I have an idea` → signup (role preselected) → dashboard shows both empty states (§7.4) → `+ Submit new idea` → steps 1–8 filled (autosave tick visible at least twice) → step 9 review → `Run AI analysis` → score page shows breakdown → gate fails (e.g. 41) → fix flagged sections via `Improve weak sections` deep-link → re-score = 63 → publish dialog → published → dashboard stats update (Published 1).

**J2 — Investor onboards:** signup (investor) → wizard step 1 → submit → pending 3s → verified toast → step 2 prefs → save → feed shows *"The feed is quiet"* empty state (no ideas yet in fresh browser) → token chip shows 10 after visiting `/tokens` with welcome grant row.

**J3 — Discover → token → request → chat (two tabs):** (tab A, investor) feed card → View idea → preview shows public blocks + LockedRows → `Use 1 token` → modal message → send → balance 9, ledger `spend` row → (tab B, innovator) request appears in `/requests` pending tab with masked investor, KYC badge, `1 token spent` → Accept → redirected to chat with system message → (tab A) investor's `/my-requests` flips to Accepted, `/messages` shows conversation; identities unmask on both sides; messages flow live between tabs via storage sync.

**J4 — Decline + refund:** investor sends second request (balance 8) → innovator declines via ConfirmDialog → investor sees status Declined + `+1 token refunded` chip; balance 9; ledger has refund row; re-opening that idea shows `Declined — can't re-request in MVP`.

**J5 — Withdraw:** pending request → investor withdraws from `/my-requests` → status Withdrawn + refund → innovator no longer sees it as actionable.

**J6 — Save + filters:** investor saves 2 ideas → `/saved` lists them → unsave one with Undo toast → change preferences in Profile → feed re-ranks (Match % values change) → sort tabs reorder correctly (verify Best match ≠ Highest AI score ordering on mixed scores).

---

## 11. Validation Rules & Edge Cases

### 11.1 Form validation table (client-side, on blur + submit)

| Field | Rules | Error copy |
|---|---|---|
| Name | 2–60 chars | "Please enter your full name." |
| Email | regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, unique | "Enter a valid email." / "An account with this email already exists." |
| Password | ≥8, ≥1 letter, ≥1 digit | "Use at least 8 characters with a letter and a number." |
| Confirm password | matches | "Passwords don't match." |
| Idea title | 3–80 chars | "Give your idea a title (3–80 characters)." |
| One-line pitch | 1–140 chars (counter) | "Keep the pitch within 140 characters." |
| All 9 textareas | required (except `growth`), word thresholds advisory (§8.1) | "This section is required for scoring." |
| Funding amount | integer ≥ 0; if raising, > 0 | "Enter a funding amount in rupees." |
| URLs (documents) | `https?://` prefix | "Enter a full URL starting with http(s)://" |
| Request message | ≤500 chars | "Keep your message within 500 characters." |
| Chat message | 1–2000 after trim | (send disabled; 2000 truncates with counter) |
| Preferences | ≥1 industry, ≥1 stage | "Pick at least one industry/stage." |

### 11.2 Edge cases (must handle, each is a test scenario)

1. **Double-spend:** `Send request` double-click → button disables on first call; API is idempotent per `(investorId, ideaId)` via `DUPLICATE_REQUEST`.
2. **Self-request:** innovator opening `/ideas/:id` of own idea → redirect to edit (§7.10); API also rejects.
3. **Request on unpublished/paused idea:** preview guard 404s; API rejects `NOT_FOUND`.
4. **Token balance hits 0:** CTA disabled + danger helper (§7.10); wallet explains refunds.
5. **Score drift:** publishing, then editing sections down below gate → idea stays published (edits require re-score; if new score < 50 show banner on edit page: *"This edit drops the score below the publish gate — unpublish or improve."* Idea remains live until innovator pauses — simplest honest rule).
6. **Conversation integrity:** chat route with a non-participant conversation id → "Conversation not found" + redirect to `/messages`.
7. **Session of deleted user (clear data in other tab):** `AuthContext` boot validates `session.userId` exists in `users`; else clears session → `/login`.
8. **localStorage full / disabled:** boot try/catch → full-screen fallback: *"Ventora needs browser storage to run. Please enable site data/cookies."*
9. **Masking leaks:** every component that lists counterparties uses `displayNameFor(user, viewerId, relation)` helper from `src/lib/disclosure.js` — code review checklist item.
10. **Time display:** all timestamps via `timeAgo()` helper ("just now", "2 min ago", "Yesterday", ISO date beyond 7 days) — no raw ISO strings in UI.
11. **Large text:** textareas clamp scoring inputs at 20,000 chars (counter turns danger) to protect localStorage.
12. **Reset between demos:** Profile → Clear local data is the documented demo-reset path.

### 11.3 Global conventions

- **Toasts:** success (green check), error (red), info (indigo). Max 3 stacked. Never use `alert()/confirm()` anywhere.
- **Loading:** skeleton per §5.3 #20 on every list/detail page; buttons show inline spinners.
- **Errors:** thrown `ApiError`s are caught at page level → toast + empty-state retry block; unexpected errors render a simple `ErrorBoundary` page (logo + "Something went wrong" + `Reload` button).
- **Accessibility floor:** semantic landmarks (`nav/main/aside`), labelled form controls, focus-visible rings, color contrast ≥ 4.5:1 for text, keyboard operable modals (focus trap + Escape).

---

## 12. Build Plan (execution order for the agent)

Build in this order; each phase ends with a working, committable state. Run the phase's acceptance checklist before moving on.

**P0 — Scaffold & design system.** Vite + React + Tailwind + router + lucide; tokens (§5.1); all §5.3 primitives with a `/dev` route (hidden, unlinked) rendering every component variant; data-layer adapter + `constants.js`; ErrorBoundary; empty app boots at `/`.
✅ *Accept:* every primitive visible and styled on `/dev`; `ventora:v1:meta` initializes; no console errors.

**P1 — Auth & shells.** Landing, Signup, Login, guards, AuthContext, both App shells + marketing shell, profile page (account/password/clear-data).
✅ *Accept:* signup→redirect matrix works for both roles; refresh keeps session; guards bounce correctly; clear-data wipes everything.

**P2 — Innovator ideas + AI engine.** 9-step form (autosave, chips, banners), `completenessEngine.js` + `feedbackTips.js`, score result page, publish gate, dashboard with stats/table/banner.
✅ *Accept:* score is deterministic across reloads; gate blocks <50 or missing sections; autosave survives refresh; dashboard table reflects real statuses.

**P3 — Investor onboarding & feed.** Wizard (mock KYC 3s + preferences), feed with hard filter + ranking + sorts + filters, teaser whitelist via `disclosure.js`, preview page with LockedRows + view counter, saved ideas.
✅ *Accept:* unverified investors can't reach `/feed`; matching order matches hand-computed §8.2 example; preview shows ONLY whitelist fields; save/unsave persists.

**P4 — Tokens & requests.** Welcome grant, wallet + ledger, request send modal + spend, innovator inbox (accept/decline/ignore), investor `/my-requests` (withdraw), state machine + refunds.
✅ *Accept:* all §8.5 transitions and ledger rows correct; balances never negative; duplicate request blocked; decline/withdraw refund exactly once.

**P5 — Chat.** Conversation list + thread, send/read/unread, link attachments, system message on accept, storage-event sync, presence heartbeat.
✅ *Accept:* J3 works end-to-end in two tabs; unread badges clear on open; non-participants can't open a conversation.

**P6 — Polish & hardening.** All empty/loading/error states vs §7 copy; toasts; responsive pass at 375/768/1280; a11y pass (§11.3); edge cases §11.2; final QA §13.
✅ *Accept:* every §13 scenario passes; no dead buttons; Lighthouse a11y ≥ 90 on landing/dashboard/feed.

**Suggested commit cadence:** one commit per phase, message `P{n}: {summary}` — keeps the viva git history legible.

---

## 13. Final QA Scenarios (definition of done)

1. Fresh browser → all screens show spec'd empty states; no placeholder lorem anywhere.
2. Signup validations fire per §11.1; duplicate email blocked; login wrong-password error is generic.
3. Deterministic score: same idea content → same `total` after reload and re-login.
4. Publish gate: 49 total or 1 missing section → blocked; 50 clean → published.
5. Feed order matches manual §8.2 computation on 3+ ideas; near-match toggle shows outside items last.
6. Preview exposes zero non-whitelist fields (inspect rendered DOM, not just visuals).
7. Token ledger arithmetic: 10 → 9 (spend) → 10 (refund) across decline/withdraw paths, exactly once each.
8. One request per idea per investor forever (MVP); second attempt blocked.
9. Two-tab chat live sync (§8.6) with unread badge flow; non-participant URL rejected.
10. Masking: names stay masked everywhere until that pair's acceptance; unmask after.
11. Session persistence across refresh; guard redirects per §4 matrix; clear-data returns browser to factory state.
12. Optional LLM key: with key → AI-assisted paragraph appears; without key → rule-based caption; score identical in both modes.

**Definition of done:** all 12 pass on a clean browser profile; `npm run build` succeeds with no warnings; README (created by agent) covers setup, the two-tab chat demo trick, and where each §-rule lives in code.

---

## 14. Future-Phase Notes (do not build now — design for them)

1. **Express + MongoDB Atlas swap:** keep every document shape from §6 exactly; replace `localStorageStore.js` with `mongoStore.js` hitting the §9 REST routes; UI/api signatures unchanged. Collections index list for later: `users.email` (unique), `ideas.innovatorId`, `requests.investorId+ideaId` (unique), `messages.conversationId+createdAt`.
2. **Socket.IO:** replace the storage-event sync (§8.6) with rooms per `conversationId`; presence becomes real; message shape unchanged.
3. **File uploads:** Cloudinary/S3 signed uploads; `documents.*` and chat attachments gain `{url, name, size, mime}` objects; per-document permission flags ride on §8.3 visibility.
4. **Admin dashboard (wireframe 12):** KYC queue replaces the 3s mock; token rules (`TOKENS`) become editable documents; reports/moderation endpoints slot into the ⋯ menus stubbed in §7.7/§7.14.
5. **Real KYC, email flows, OAuth, notifications, re-request windows:** as enumerated in §2.2 future notes.

---

*End of specification — Ventora MVP v1.0. Build exactly this.*
