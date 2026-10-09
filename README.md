# ResultView Client

Student Results Portal — React frontend for viewing University of Ruhuna results, tracking degree progress, and calculating subject-wise GPAs.

This is the front half of a two-repo system. All data comes from [**res_proxy**](https://github.com/IsuruSH/res_proxy), an Express server that scrapes the university's FOSMIS portal and returns JSON. The client talks to nothing else — **it does not work without that backend running.**

```
React SPA (Vercel)  ──►  res_proxy (Render)  ──►  FOSMIS PHP portal
results.isurushanaka.me   res-proxy.onrender.com   paravi.ruh.ac.lk
```

Users sign in with their real FOSMIS credentials. There is no separate account system.

## Routes

| Path | Page | Access |
|------|------|--------|
| `/login` | [Login](src/pages/Login.tsx) | Public |
| `/home` | [Home](src/pages/Home.tsx) | Protected |
| `/results` | [Results](src/pages/Results.tsx) | Protected |
| `/courses` | [CourseRegistration](src/pages/CourseRegistration.tsx) | Protected |
| `/academic-guide` | [AcademicGuide](src/pages/AcademicGuide.tsx) | Protected |
| `/` | → redirects to `/results` | — |

[`ProtectedRoute`](src/components/common/ProtectedRoute.tsx) redirects to `/login` whenever there is no session.

## Project Structure

```
Results-View-with-Subject-Gpas/
├── src/
│   ├── components/
│   │   ├── common/      # ProtectedRoute
│   │   ├── dashboard/   # Results page: header/footer, GPA gauges, charts,
│   │   │                #   calculator, simulators, table, Excel/PDF export
│   │   ├── home/        # Home page: hero, quick actions, academic services,
│   │   │                #   mentor card, GPA summary
│   │   └── guide/       # DegreeProgress — degree requirement evaluation
│   ├── pages/           # One file per route
│   ├── services/
│   │   ├── api.ts       # Backend client (all fetch calls live here)
│   │   └── dataCache.ts # In-memory TTL cache + request deduplication
│   ├── context/
│   │   └── AuthContext.tsx  # Session, username, sign in / sign out
│   ├── constants/grades.ts  # Grade scale, class cutoffs, credit targets
│   ├── data/
│   │   └── courseClassifications.ts  # Core/optional map from the handbook
│   ├── hooks/usePageTitle.ts
│   ├── utils/
│   │   ├── sessionCrypto.ts # AES-GCM encryption for the stored password
│   │   └── fosmisNav.ts     # Deep-link into FOSMIS with auto-login
│   ├── types/index.ts   # Shared interfaces — mirrors the backend responses
│   ├── __tests__/       # setup.ts, api.test.ts, grades.test.ts
│   ├── App.tsx          # Routing
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles + Tailwind
├── .env.example         # Template — copy to .env
├── vitest.config.ts
├── vercel.json
└── package.json
```

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start the backend (res_proxy) on port 4000 — the client needs it

# 4. Start dev server
npm run dev
```

Opens at `http://localhost:5173`.

### Production Build

```bash
npm run build     # Build for production (uses .env.production)
npm run preview   # Preview the production build locally
```

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_SERVER_URL` | `http://localhost:4000` | `https://res-proxy.onrender.com` |

Vite loads `.env` for `vite dev` and `.env.production` for `vite build`. Both are gitignored — on Vercel the production value comes from the project's environment settings rather than a committed file.

## Features

**Home** — profile hero with GPA and credits at a glance, quick actions and academic service links that deep-link into FOSMIS, mentor contact card, and a GPA summary.

**Results** — the main dashboard. Degree-class predictor, per-department GPA gauges, credit progress against the 90/120-credit targets, level-by-level GPA trend, grade distribution, department radar, the full FOSMIS results table, and three planning tools behind tabs: a manual GPA calculator, a what-if simulator, and a target planner that works backwards from a desired GPA. Exports to Excel and PDF.

**Courses** — current-semester and full course registration, grouped by year, with confirmed credits.

**Academic Guide** — reference material on degree structure and regulations, with Sinhala explanatory notes throughout, plus the degree progress tracker.

## Architecture Notes

The parts that aren't obvious from reading a single file.

### Caching and instant navigation

[dataCache.ts](src/services/dataCache.ts) mirrors the backend's 5-minute TTL and adds **request deduplication** — if the same fetch is already in flight, callers share the existing promise instead of firing a second request. Every page seeds its `useState` from the cache in the initializer, so navigating back to a page you've already visited renders immediately with no spinner. All four data endpoints go through it; login, logout, and `calculateGPA` deliberately don't.

The profile image URL is cached separately in `localStorage`, so it survives a full reload.

### Login error messages are the server's, not ours

`login()` in [api.ts](src/services/api.ts) reads the error message out of a failed response body instead of hard-coding one. The backend distinguishes a rejected password (401) from FOSMIS being unreachable (503), and that distinction has to survive to the toast — otherwise a portal outage tells students their password is wrong and they go and reset a working one.

### The login pre-fetch handoff

`POST /init` returns the student's results inline with the `sessionId` (see the backend README). [AuthContext](src/context/AuthContext.tsx) hands those to the Results page exactly once, through a **consume-once ref** — `initialResultsRef`, read-and-cleared by `consumeInitialResults()`.

It's a ref rather than state on purpose: putting it in state would re-render every consumer and retrigger the effects that read it. This is also why [Results.tsx](src/pages/Results.tsx) carries a `prefetchApplied` guard — React StrictMode mounts effects twice in development, and without it the second mount would refetch what login already provided.

### Deep-linking into FOSMIS

Several links send the user to real FOSMIS pages. [fosmisNav.ts](src/utils/fosmisNav.ts) makes that seamless: it opens `about:blank`, writes an auto-submitting login form into it, and polls `w.location.href` until reading it throws — a cross-origin error is the signal that FOSMIS has loaded and the cookie is set. It then redirects that tab to the target page, and marks the browser session authenticated so later links open directly.

This needs the user's password. It is AES-GCM encrypted before going into `sessionStorage`, with a 256-bit non-extractable key held only in a module-level variable ([sessionCrypto.ts](src/utils/sessionCrypto.ts)). A refresh discards the key, making the stored ciphertext permanently unreadable, and the code falls back to opening the plain FOSMIS login page.

To be clear about the trade-off, as the file's own header states: this is **not** a substitute for a server-side token. It removes plaintext credentials from browser storage; it does not defend against an attacker already executing code on the page.

### Course classification data

[courseClassifications.ts](src/data/courseClassifications.ts) maps every course code to `core`/`optional` and `theory`/`practical`/`combined`/`project`. It is **hand-transcribed from the printed Student Handbook** and cannot be derived from FOSMIS, which doesn't expose this. When the syllabus changes it must be re-checked against the handbook by hand.

Lookups normalise codes to lowercase and fold Greek characters to Latin. Entries are registered either globally or per student group (`bcs` / `bsc`), with group entries taking precedence — some courses are core for one program and optional for the other. Group override behaviour is covered by [classification.test.ts](src/data/classification.test.ts).

### Degree progress

[DegreeProgress.tsx](src/components/guide/DegreeProgress.tsx) evaluates six programs (BSc and BCS × general, special-selection, special-completion). Its central design rule: a requirement that **cannot** be computed from available data is rendered as an explicit `unavailable` card explaining why, never estimated or silently omitted. Preserve that when extending it — a plausible-looking wrong answer about degree eligibility is worse than an honest gap.

### Logic mirrored from the backend

The credit map and year-extraction logic exist in three places: [res_proxy/src/constants/index.js](https://github.com/IsuruSH/res_proxy/blob/main/src/constants/index.js), [constants/grades.ts](src/constants/grades.ts), and again inline in [CourseRegistration.tsx](src/pages/CourseRegistration.tsx). **The backend is the source of truth** — GPAs shown to users are always computed server-side; the client copies exist only for display and local estimation. If the credit map changes, all three need updating.

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

Vitest with jsdom. Three test files: [api.test.ts](src/__tests__/api.test.ts) (backend client calls), [grades.test.ts](src/__tests__/grades.test.ts) (grade constants), and [classification.test.ts](src/data/classification.test.ts) (course classification group overrides).

Two things to know: the root-level `test-classification.js` is a leftover scratch file and is **not** picked up by the runner, and the degree-progress requirement logic — the most intricate code in the repo — currently has no tests.

### Known failures

`npm test` currently reports **19 passing, 2 failing**. Both failures are in `api.test.ts`, and both are stale tests that drifted from [api.ts](src/services/api.ts) rather than defects in the code:

- **`login › sends POST to /init with credentials`** asserts the request body is exactly `{ username, password }`. `login()` now also sends `stnum` and `rlevel` so the backend can pre-fetch results in the same round-trip.
- **`fetchResults › sends GET to /results with auth header`** returns a mock response without `ok: true`. `fetchResults()` now checks `response.ok` before parsing.

Two pieces of tooling are also broken independently of the tests:

- **`npm run lint` does not run.** ESLint 9.39 and the installed `@typescript-eslint` plugin disagree about the `no-unused-expressions` rule options, and the plugin crashes on load. It needs a dependency bump, not a code change.
- **`tsc --noEmit` reports 5 errors**, all pre-existing: three unused icon imports (`GpaTargetPlanner`, `WhatIfSimulator`, `AcademicGuide`) and a missing `global` type in `api.test.ts`.

## Deployment

Deployed on **Vercel**. `vercel.json` rewrites all routes to `/` so client-side routing works on deep links and refreshes.

## Tech Stack

- **React 18** + TypeScript
- **Vite** — build tool
- **Tailwind CSS** — styling
- **Framer Motion** — animations
- **React Router** — client-side routing
- **lucide-react** — icons
- **react-hot-toast** — notifications
- **ExcelJS** / **jsPDF** + **html2canvas** — exports
- **Vitest** — testing
