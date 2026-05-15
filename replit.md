# SERMACROPS EDI Management System

A full-stack EDI (Electronic Data Interchange) management platform for SERMACROPS Manufacturing. Covers trading partner management, ANSI X12 document translation/validation (850, 855, 856, 810, 204, 990), AS2 communication, notifications, and a progress stepper UI showing EDI transaction flows.

---

## Quick Start (fresh import)

1. Add the required secret listed below in the **Secrets** tab
2. The workflows will start automatically — the app will be live at the preview URL

That's it. The server seeds sample data on first run if the database is empty.

---

## Required Secrets

| Secret | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string — e.g. `mongodb+srv://user:pass@cluster.mongodb.net/sermacrops` (get a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)) |

> **No `MONGODB_URI`?** The server automatically falls back to an in-memory MongoDB instance. Everything works, but data resets on each restart.

---

## Run & Operate

| Command | What it does |
|---|---|
| `pnpm --filter @workspace/api-server run dev` | Start the API server (port 8080) |
| `pnpm --filter @workspace/edi-management run dev` | Start the frontend (port 18242) |
| `pnpm run typecheck` | Full TypeScript check across all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas from OpenAPI spec |

Workflows for both services are pre-configured and start automatically.

---

## Stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **API:** Express 5, port 8080, served at `/api`
- **DB:** MongoDB + Mongoose (`mongodb-memory-server` as dev fallback)
- **Frontend:** React 19 + Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, wouter
- **API contract:** OpenAPI spec → Orval codegen (React Query hooks + Zod schemas)

---

## Where things live

```
artifacts/
  api-server/        — Express API server
    src/
      models/        — Mongoose models (TradingPartner, EdiDocument, etc.)
      routes/        — Route handlers (partners, documents, endpoints, as2, notifications…)
      lib/db.ts      — MongoDB connection (Atlas or in-memory fallback)
      seed.ts        — Idempotent seed (runs once if DB is empty)
  edi-management/    — React + Vite frontend
    src/
      pages/         — One file per page (dashboard, partners, documents, etc.)
      components/    — Layout, StatusBadge, shadcn/ui components
      App.tsx        — Router setup

lib/
  api-spec/          — OpenAPI YAML spec (source of truth for all API contracts)
  api-client-react/  — Generated React Query hooks (run codegen to regenerate)
  api-zod/           — Generated Zod schemas (run codegen to regenerate)
```

---

## Architecture decisions

- **MongoDB over PostgreSQL** — EDI documents have variable parsed content and attachment structures that map naturally to documents rather than relational tables.
- **In-memory MongoDB fallback** — `mongodb-memory-server` lets the API run in dev with zero external dependencies; just add `MONGODB_URI` to switch to persistent storage.
- **Contract-first API** — The OpenAPI spec in `lib/api-spec/openapi.yaml` is the single source of truth; client hooks and Zod validators are generated from it, not hand-written.
- **Idempotent seed** — `seed.ts` checks `TradingPartner.countDocuments()` before inserting, so it is safe to run on every boot without duplicating data.
- **Orval generated hooks** — All API calls in the frontend use generated hooks from `@workspace/api-client-react`. Never call `fetch` directly; add to the OpenAPI spec and re-run codegen.

---

## EDI Transaction Flows

- **Procurement:** 850 Purchase Order → 855 PO Acknowledgment → 856 Ship Notice → 810 Invoice
- **Logistics:** 204 Motor Carrier Load Tender → 990 Response to Load Tender

---

## Receiving endpoint

Trading partners should send inbound EDI documents to:

```
POST /api/documents/receive
```

---

## User preferences

- MongoDB (not PostgreSQL) for all data storage
- Persistent data via Atlas; in-memory fallback for zero-config dev

---

## Gotchas

- Do **not** run `pnpm dev` at the workspace root — there is no root dev script. Use the workflow buttons or the per-package commands above.
- After editing `lib/api-spec/openapi.yaml`, always run codegen before touching frontend code, otherwise the TypeScript types will be stale.
- The seed is skipped automatically if any `TradingPartner` documents exist in the database. To re-seed a fresh Atlas cluster, just point `MONGODB_URI` at an empty database.
- The Mongoose `errors` reserved-key warning on startup is harmless — it comes from a field name in the validation schema and does not affect functionality.
