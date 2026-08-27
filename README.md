# Campus Circular

**From Ownership to Access**

Campus Circular is a competition-ready campus resource-sharing frontend. Students can discover, borrow, lend, donate, compare, request, collect, return, and settle resources through one complete local-first workflow. The signature AI Finder converts a natural-language need into a practical multi-item campus bundle.

## Highlights

- Natural-language AI Need Assistant with structured Groq output and a deterministic offline fallback
- Smart bundle builder with availability, cost, deposit, and pickup-distance totals
- Explore search, category chips, urgent mode, sorting, filters, recent searches, and empty states
- Deterministic match scores based on availability, distance, condition, rating, trust, and price
- Detailed resource view with owner trust, terms, accessories, safety guidance, and a 7-day calendar
- Favorites and comparison of up to three resources
- Five-step request flow persisted to `localStorage`
- Full exchange lifecycle from request through deposit settlement
- Pickup/return verification tokens and return-condition discrepancy simulation
- Local resource listing and donation mode
- Notifications, Trust Passport, and Circular Impact dashboard
- Responsive layouts and reduced-motion support

## Screenshots

Add final competition screenshots here:

- `docs/home-desktop.png`
- `docs/ai-bundle.png`
- `docs/exchange-lifecycle.png`
- `docs/mobile.png`

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

In the restricted local Codex preview environment, run:

```powershell
$env:CAMPUS_LOCAL_PREVIEW="1"
npm run dev -- --port 3002
```

Then open `http://localhost:3002/`.

## Environment variables

Copy `.env.example` to `.env.local` and optionally add a new Groq key:

```env
GROQ_API_KEY=
```

The key is read only by `app/api/ai/route.ts`; it is never included in the browser bundle. If it is absent, rejected, or returns invalid JSON, the AI Finder automatically uses the deterministic local parser and the full demo remains usable.

## Quality commands

```bash
npm run lint
npm run build
node node_modules/typescript/bin/tsc --noEmit
```

## Architecture

The product is intentionally local-first. `app/page.tsx` owns the cohesive application shell and view state. Focused workflow components live in `app/workflows.tsx`. Typed mock entities are separated from deterministic ranking and fallback logic. A small persistence hook synchronizes user actions to `localStorage`. Only AI interpretation crosses an API boundary, through the server-side Groq proxy.

| Layer | Responsibility |
| --- | --- |
| `app/page.tsx` | Navigation, Home, Explore, resource details, global workflow composition |
| `app/workflows.tsx` | AI Finder, compare, requests, exchanges, profile, impact, notifications, listing |
| `app/data.ts` | Realistic campus users, resources, notifications, and seeded exchanges |
| `app/logic.ts` | Weighted matching, explanations, walking distance, deterministic AI fallback |
| `app/persistence.ts` | Hydration-safe `localStorage` abstraction |
| `app/api/ai/route.ts` | Secret-safe Groq request, validation, and error boundary |
| `app/types.ts` | Shared TypeScript product model |
| `app/globals.css` | Responsive visual system, focus states, and motion preferences |

## Demo flow

1. Open Home and introduce the access-over-ownership idea.
2. Open AI Finder and submit: `I need to make a reel for my club event tomorrow.`
3. Reveal the Camera + Tripod + Wireless Mic + LED bundle.
4. Request the complete bundle and finish the five request steps.
5. Open My Exchanges, simulate approval, schedule pickup, and confirm handoff.
6. Demonstrate the return condition check and deposit settlement.
7. Open Profile to explain the Trust Passport.
8. Finish on Impact to show savings and circularity.

For the exact 4–6 minute script and judge Q&A, see [PROJECT_DEMO.md](./PROJECT_DEMO.md).

## Prototype boundaries

- Identity, payments, escrow, disputes, and QR scanning are simulated frontend experiences.
- Inventory and analytics are realistic mock data; persisted user actions are device-local.
- Campus distance is an approximate mock distance rather than live geolocation.
- Groq improves interpretation when configured, but recommendations remain deterministic and functional offline.

