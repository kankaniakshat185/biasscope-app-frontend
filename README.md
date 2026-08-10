# BiasScope Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

The dashboard for [BiasScope](https://biasscope-app.vercel.app/) — a claim-centric news intelligence platform. Search any topic, and instead of a single "bias score," get an interactive breakdown of what publishers across the political spectrum are actually claiming, where they agree, where they contradict each other, and how balanced the resulting coverage set really is.

> **Looking for the API/pipeline itself?**
> [**BiasScope HF Backend**](https://github.com/kankaniakshat185/biasscope-hf-backend) — the FastAPI service this app talks to.

[Live App](https://biasscope-app.vercel.app/) • [Methodology & Trust Report](https://biasscope-app.vercel.app/#methodology)

## Features

- **Search-driven intelligence dashboard** — enter a topic, watch a live multi-stage progress indicator (ingestion → cleaning → analysis → validation → narrative) while the backend pipeline runs, then land on a full results page: bias distribution, sentiment breakdown, entity-sentiment graph, and an AI-generated narrative summary.
- **Claim-level intelligence layer** — a dedicated view over the backend's asynchronous Phase 2 pipeline (`GET /results/:id/intelligence`), polling while extraction/clustering/event-detection complete and rendering the resulting claim clusters and detected events once they're ready, each backed by real evidence rows rather than a black-box score.
- **Contrastive Echo Chamber cards** — side-by-side, LLM-generated summaries of how left-leaning and right-leaning coverage frame the same story, with hover-popup explanations of what clicking each card actually does (filters the article feed below to that lean).
- **In-depth Methodology & Trust Report** — a full, code-grounded write-up of every formula the platform uses (Data Quality Score, Jensen-Shannon Divergence polarization, claim deduplication thresholds, HDBSCAN clustering, NLI contradiction detection, LLM cost-cache economics), built directly onto the landing page below the search bar.
- **Search history & saved results** — every search is tied to your account (or kept anonymous) and revisitable from `/history`, with shareable result links by design — a link to a result is a link to that exact analysis, no re-running required.
- **Weekly topic subscriptions** — subscribe to a topic from `/subscriptions` to get drift-tracking snapshots as coverage evolves over time (powered by the backend's Celery/Redis job).
- **Auth via Better Auth** — email/password (with Resend-sent verification email) or Google OAuth, session-cookie based, no separate token to manage on the client.

## Architecture

The browser never talks to the FastAPI backend directly. Hugging Face Spaces (where the backend is hosted) strips `Access-Control-Allow-Credentials` from cross-origin preflight responses at the platform/proxy level — a documented HF Spaces behavior, not something under this app's control — which silently breaks credentialed (cookie-based) cross-origin requests. Rather than switching to token-based auth to work around a hosting platform's proxy behavior, every API call is routed through a same-origin Next.js Route Handler (`src/app/api/proxy/[...path]/route.ts`) that relays the request server-to-server, where CORS enforcement doesn't apply at all.

```mermaid
graph TD
    User[Browser] -->|1: fetch same-origin, cookie attached| Proxy["/api/proxy/[...path]\nNext.js Route Handler"]
    Proxy -->|2: server-to-server HTTPS, cookie forwarded| Backend["FastAPI backend\n(Hugging Face Spaces)"]
    Backend -->|3: JSON response| Proxy
    Proxy -->|4: relayed response| User

    User -->|auth: sign up / sign in| BetterAuth["/api/auth/[...all]\nBetter Auth handler"]
    BetterAuth --> AuthDB[(Postgres: user / session / account)]
    BetterAuth -.->|OAuth| Google["Google OAuth"]
    BetterAuth -.->|verification email| Resend["Resend"]

    subgraph "App Router pages"
        Landing["/  — search + Methodology & Trust Report"]
        Dashboard["/dashboard/[id]  — results + IntelligenceLayer"]
        History["/history  — past searches"]
        Subscriptions["/subscriptions  — weekly topic tracking"]
    end

    Landing -->|POST /search| Proxy
    Dashboard -->|GET /results/:id\nGET /results/:id/intelligence, polled| Proxy
    History -->|GET /history| Proxy
    Subscriptions -->|GET/POST /subscriptions| Proxy
```

**Stack notes:**
- **Charts:** [Recharts](https://recharts.org/) (`src/components/Charts.tsx`) for bias distribution, sentiment breakdown, and entity-sentiment graphs.
- **UI primitives:** [shadcn/ui](https://ui.shadcn.com/) components (`src/components/ui/`) on top of Radix-derived [Base UI](https://base-ui.com/), styled with Tailwind CSS v4.
- **Fonts:** `Sekuya` (the display/heading face used across headers, hero text, and the tagline footer), `Oswald`, `Geist`, and `Geist Mono` — loaded via `next/font/google` in `src/app/layout.tsx`. Note: the global Tailwind `font-sans` token is remapped to Sekuya (`globals.css`), so any page needing normal body copy explicitly overrides with `font-[family-name:var(--font-geist-sans)]`.
- **State:** no global client store — page-level `useState`/`useEffect` plus the URL (`/dashboard/[id]`) as the source of truth for which result is being viewed.

## Local Setup & Installation

Requires Node.js 20+ and a running instance of the [backend](https://github.com/kankaniakshat185/biasscope-hf-backend) (local or the deployed Space). Auth needs its own Postgres database — this can be the same database the backend uses, or a separate one; Better Auth manages its own tables via Prisma migrations.

### 1. Clone and install
```bash
git clone https://github.com/kankaniakshat185/biasscope-app-frontend.git
cd biasscope-app-frontend
npm install
```

### 2. Configure environment variables
Create `.env.local`:
```env
# Server-only — the proxy relays to this. Never exposed to the browser.
BACKEND_URL="http://127.0.0.1:8000"

# Better Auth
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
BETTER_AUTH_SECRET="a-long-random-string"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (optional — email/password works without it)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Resend — sends the email-verification link on sign-up
RESEND_API_KEY="your_resend_api_key"
```

### 3. Sync the auth schema
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the app
```bash
npm run dev
```
Open `http://localhost:3000`. Make sure the backend is running at the URL you set for `BACKEND_URL`, or every search will fail at the proxy layer.

## Project Structure

```text
biasscope-app-frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page: search + full Methodology & Trust Report
│   │   ├── layout.tsx                  # Root layout, fonts, header/nav, AuthButton
│   │   ├── globals.css                 # Tailwind v4 theme tokens, font-sans override
│   │   ├── login/page.tsx              # Sign in / sign up
│   │   ├── history/page.tsx            # Past searches for the current user
│   │   ├── subscriptions/page.tsx      # Weekly topic-drift subscriptions
│   │   ├── dashboard/[id]/
│   │   │   ├── page.tsx                # Full results view: bias, sentiment, narrative, Echo Chambers
│   │   │   ├── IntelligenceLayer.tsx   # Claim clusters / events, polls Phase 2 status
│   │   │   └── IntelligenceLayer.test.tsx
│   │   └── api/
│   │       ├── proxy/[...path]/route.ts  # Same-origin relay to the FastAPI backend
│   │       └── auth/[...all]/route.ts    # Better Auth's catch-all handler
│   ├── components/
│   │   ├── AuthButton.tsx
│   │   ├── LoginForm.tsx
│   │   ├── Charts.tsx                  # Recharts wrappers
│   │   └── ui/                         # shadcn/ui primitives (button, card, input, select, badge)
│   └── lib/
│       ├── api.ts                      # Typed fetch helpers, API_BASE_URL = "/api/proxy"
│       ├── auth-client.ts              # Better Auth client hooks
│       └── utils.ts                    # cn() (clsx + tailwind-merge)
├── prisma/
│   └── schema.prisma                   # Better Auth's user/session/account/verification tables
├── vitest.config.ts
├── vitest.setup.ts
├── eslint.config.mjs
└── package.json
```

## Testing & Code Quality

```bash
npm run lint          # eslint
npx tsc --noEmit       # type check
npm test               # vitest run — unit/component tests (Vitest + React Testing Library)
npm run test:watch
```

## Privacy & License

See [`PRIVACY.md`](./PRIVACY.md) for what data this app collects and why. Licensed under the [MIT License](./LICENSE).
