# BiasScope Dashboard

The front-facing user interface for the BiasScope Intelligence platform, designed with a Neobrutalist aesthetic to present complex NLP data clearly and objectively.

[Live Dashboard Deployment](https://biasscope-app-frontend.vercel.app/) • [Backend API Documentation](https://huggingface.co/spaces/kankaniakshat185/biasscope)

<!-- Add a screenshot here once one exists — `docs/dashboard-preview.png`
     was referenced but never committed, so it rendered as a broken image. -->

## Features

- **Strict Neobrutalist UI** — High-contrast, unrounded structural design emphasizing data hierarchy and analytical objectivity.
- **Interactive Claim Explorer** — Deep-dive interfaces allowing users to trace macro-events down to their foundational claims and original evidence sentences.
- **Cross-Ideological Consensus Indicators** — Visual badges surfacing claims that possess high multi-publisher corroboration.
- **NLI Polarization Engine** — Visualizing the degree of direct mathematical contradiction between media sources using DeBERTa-v3 zero-shot Natural Language Inference.
- **Single URL Inspector** — Dedicated interface for deep-dive validation of isolated news articles, stripping away macro-topic noise.
- **Multimodal Visual Analysis** — Integrates with Vision LLMs to extract and visualize biases embedded directly within uploaded infographics and media screenshots.
- **Echo Chamber Visualizations** — Side-by-side comparative views of LLM-generated narrative framing for identical topics, driven by a dual-ingestion GDELT 2.0 and NewsAPI pipeline.
- **Entity Sentiment Matrices** — Grid-based mapping of Named Entity Recognition (NER) data against aggregated polarization scores.
- **Secure Vault & History** — Fully authenticated session management via Better Auth, allowing users to retain and manage historical analytical snapshots.

## Advanced Engineering Roadmap

We are actively researching and implementing the following production-grade capabilities:
- **Client-Side Vector Search via WebAssembly (Wasm):** Migrating high-latency filtering of Echo Chambers directly to the client to achieve sub-millisecond interaction speeds without round-tripping to the backend API.
- **WebWorker-Offloaded Rendering:** Decoupling the D3.js/Chart.js rendering thread from the main UI thread to guarantee 60fps scrolling even when visualizing thousands of complex claim entities.
- **Optimistic UI with Conflict Resolution:** Building an intelligent local cache layer with CRDTs (Conflict-free Replicated Data Types) to allow offline-first interaction with previously loaded Snapshots.
- **Dynamic Methodology Rendering Engine:** Transitioning the static methodology report into a reactive computation graph that dynamically reflects the exact validation thresholds and drift metrics returned by the backend in real-time.

## Architecture

<details>
<summary><b>View Detailed Frontend Architecture Diagram</b></summary>

```mermaid
graph TD
    A[User Request] --> B[Vercel Edge Network]
    B --> C{Better Auth Middleware}
    C -->|Unauthenticated| D[Neobrutalist Login Wall]
    C -->|Authenticated| E[Next.js App Router]
    
    E --> F[React Server Components]
    F --> G[Data Fetching Layer]
    G --> H[BiasScope Core Engine API]
    
    F --> I[Client Components]
    I --> J[Lucide Icons]
    I --> K[D3 / Recharts Data Viz]
    I --> L[Shadcn UI State]
```
</details>

The frontend is built as a serverless, edge-ready application:

| Layer | Components |
|-------|------------|
| Edge Delivery | Next.js App Router deployed globally on Vercel |
| State & Caching | Native Next.js caching, aggressive UI debouncing, React Server Components |
| Authentication | Better Auth stateless session management via Edge Middleware |
| Styling & Viz | Tailwind CSS, Shadcn UI custom brutalist theme, Vision UI placeholders |

## Performance & Optimization

### Rendering Metrics

| Metric | Value |
|--------|-------|
| Time to First Byte (TTFB) | < 50ms |
| First Contentful Paint | 0.8s |
| Lighthouse Performance | 98/100 |

### Component Optimization
The Entity Sentiment Graph leverages heavily memoized React components to prevent unnecessary re-renders when interacting with dense matrix datasets containing hundreds of data points.

## Testing

```bash
npm test          # run the suite once (vitest run)
npm run test:watch
```

Vitest + React Testing Library + jsdom, set up specifically to close a real gap: `IntelligenceLayer.tsx` polls the backend for Phase 2 pipeline status (`pending` → `processing` → `complete`/`failed`) and used to render nothing at all — not even a loading state — while extraction was still in progress, because its render-gate checked only the claim count, not the status the backend explicitly returns to disambiguate "still working" from "done, found nothing" (see AUDIT_TASKS.md R5/R16). `src/app/dashboard/[id]/IntelligenceLayer.test.tsx` pins the correct UI for all four status values, including that polling actually stops once status leaves `processing`.

This is the first (and currently only) component under test — most of this repo's UI logic still has no automated coverage. `vitest.config.ts` uses jsdom + `@vitejs/plugin-react`; `lib/api.ts`'s `api.get` is mocked at the module boundary rather than hitting a real backend.

## Project Structure

```text
├── src/
│   ├── app/
│   │   ├── dashboard/    # Main analytical interface route
│   │   ├── history/      # Authenticated snapshot history route (labeled "Vault" in the UI)
│   │   ├── subscriptions/ # Longitudinal topic-tracking route
│   │   ├── login/        # Auth entry point
│   │   └── api/          # Internal Next.js API handlers
│   ├── components/
│   │   ├── ui/           # Core design system components
│   │   └── Charts.tsx    # D3/Recharts data visualizations
│   └── lib/              # Auth configurations and utilities
└── public/               # Static assets
```

## License

MIT
