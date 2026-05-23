# Platform Architecture

This document describes the complete technical architecture of the Resume Builder platform — how all services fit together, how Docker is used, how data flows from the browser to the database, and the rationale behind key decisions.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Service Map](#3-service-map)
4. [Shared Libraries](#4-shared-libraries)
5. [Data Flow: End-to-End](#5-data-flow-end-to-end)
6. [Docker Setup](#6-docker-setup)
7. [Tech Stack](#7-tech-stack)
8. [webpack & pnpm Workspace Bundling](#8-webpack--pnpm-workspace-bundling)
9. [Phase 1 vs Phase 2 Architecture](#9-phase-1-vs-phase-2-architecture)
10. [Port Reference](#10-port-reference)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│  React SPA · Vite · Zustand · Tailwind                              │
│  http://localhost:5173                                              │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  /api/*  (Vite dev proxy)
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│  Gateway  (NestJS)                                                │
│  Port 3000 — single API entry point                               │
│  • Helmet security headers                                        │
│  • CORS enforcement                                               │
│  • Request proxying only — no business logic                      │
└─────────────────┬──────────────────┬────────────────────────────-─┘
                  │                  │
        /resumes/*│                  │/pdf/*
                  ▼                  ▼
┌────────────────────┐    ┌──────────────────────────┐
│  Resume Service    │    │  PDF Service             │
│  (NestJS)          │    │  (NestJS + Puppeteer)    │
│  Port 3001         │    │  Port 3002               │
│  • CRUD via Mongo  │    │  • HTML template builder │
│  • AppLogger       │    │  • Puppeteer PDF render  │
└────────┬───────────┘    └──────────────────────────┘
         │
         ▼
┌────────────────────┐
│  MongoDB           │
│  Port 27018 (host) │
│  Port 27017 (ctr)  │
└────────────────────┘

Infrastructure (Docker):
  MongoDB   · redis   · RabbitMQ
```

---

## 2. Monorepo Structure

The project uses **pnpm workspaces**. All packages are declared in `pnpm-workspace.yaml`:

```
resume-platform/              ← workspace root
├── pnpm-workspace.yaml       ← declares apps/* and libs/*
├── package.json              ← root scripts, shared devDependencies
├── tsconfig.base.json        ← shared TypeScript compiler options + path aliases
├── docker-compose.yml        ← all infrastructure + app containers
│
├── apps/
│   ├── gateway/              ← NestJS API gateway (port 3000)
│   ├── resume-service/       ← NestJS resume CRUD service (port 3001)
│   ├── pdf-service/          ← NestJS PDF generation service (port 3002)
│   └── web-app/              ← React + Vite frontend (port 5173)
│
└── libs/
    ├── shared-types/         ← @resume-platform/shared-types  (TypeScript interfaces)
    ├── events/               ← @resume-platform/events         (event constants & types)
    ├── logger/               ← @resume-platform/logger         (AppLogger class)
    └── common/               ← @resume-platform/common         (utility functions)
```

Each `apps/*` package has its own `package.json`, `tsconfig.json`, `nest-cli.json` (NestJS apps), and `webpack.config.js`. Each `libs/*` package is consumed by backend services via the `@resume-platform/*` namespace.

---

## 3. Service Map

| Service         | Port  | Framework        | Database   | Role                                 |
|-----------------|-------|------------------|------------|--------------------------------------|
| web-app         | 5173  | React + Vite     | —          | User interface, wizard, state        |
| gateway         | 3000  | NestJS           | —          | Security, routing, proxy             |
| resume-service  | 3001  | NestJS + Mongoose| MongoDB    | Resume CRUD, persistence             |
| pdf-service     | 3002  | NestJS + Puppeteer| —         | PDF generation from ResumeData       |
| mongodb         | 27018 | MongoDB 7        | —          | Primary data store                   |
| redis           | 6379  | Redis 7          | —          | Cache (available for Phase 2)        |
| rabbitmq        | 5672  | RabbitMQ 3       | —          | Message broker (available for Phase 2) |
| rabbitmq-mgmt   | 15672 | RabbitMQ UI      | —          | Admin console                        |

---

## 4. Shared Libraries

All four libs are TypeScript packages consumed by backend services at build time via webpack inlining.

### `@resume-platform/shared-types`
Core domain interfaces used across the entire platform. Both the frontend and all three backend services import from here, guaranteeing that data shapes are identical at every layer.

Key types:
- `ResumeData` — the master resume object
- `PersonalInfo`, `WorkExperience`, `Education`, `Skill`, `Project`, `Certification`, `CustomSection` — section types
- `ResumeTemplate` — `'modern' | 'classic' | 'minimal' | 'creative'`
- `ApiResponse<T>`, `PaginatedResponse<T>` — generic API wrappers

### `@resume-platform/events`
Event constants and TypeScript interfaces for RabbitMQ messages.

Key exports:
- `RESUME_EVENTS.RESUME_CREATED / RESUME_UPDATED / RESUME_DELETED`
- `ResumeCreatedEvent`, `ResumeUpdatedEvent`, `ResumeDeletedEvent`

### `@resume-platform/logger`
Structured console logger used in backend services.

```ts
const logger = new AppLogger('MyService');
logger.info('Resume created', { resumeId: '...' });
// → [2025-01-01T00:00:00.000Z] [INFO] [MyService] Resume created { resumeId: '...' }
```

Supports `debug`, `info`, `warn`, `error` levels. Outputs to `console` (ready to be swapped for a real log aggregator in production).

### `@resume-platform/common`
Utility functions: date formatting, UUID generation, basic validation helpers.

---

## 5. Data Flow: End-to-End

### 5a. Building a Resume (wizard steps 1–8)

All state lives in the browser. No API calls are made.

```
User interacts with wizard step
    │
    ▼
Zustand action (e.g. addExperience, setPersonalInfo)
    │
    ▼
Store updates resume object in memory
    │
    ▼
Zustand persist middleware serialises to localStorage
    │
    ▼
ResumePreview re-renders with new data (live preview)
```

### 5b. Downloading a PDF (step 9)

```
User clicks "Download PDF"
    │
    ▼
pdfApi.generate(resume)              ← Axios POST /api/pdf/generate
    │  { resume: ResumeData, format: 'A4' }
    │
    │ Vite proxy: /api → http://localhost:3000
    ▼
Gateway: POST /api/pdf/generate
    │  Forwards body to pdf-service
    │
    │ http://localhost:3002/pdf/generate
    ▼
PDF Service: generatePdf(resume, format)
    │
    ├─ buildResumeHtml(resume, template)   ← pure HTML string
    ├─ puppeteer.launch()
    ├─ page.setContent(html)
    └─ page.pdf({ format, printBackground })
    │
    ◄── PDF Buffer (Uint8Array)
    │
PDF Service: res.send(buffer)
    │
Gateway: pipes buffer back with Content-Type: application/pdf
    │
Browser: receives Blob
    │
URL.createObjectURL(blob) → <a>.click() → file download
```

### 5c. Resume Persistence (Phase 1 — optional path)

The `resumeApi` client is defined and ready, but the wizard does not call it automatically in Phase 1. Resumes are only in `localStorage`. When Phase 2 adds authentication, the store will call `resumeApi.create()` on first save and `resumeApi.update()` on subsequent changes.

---

## 6. Docker Setup

### Infrastructure vs App Containers

Docker Compose uses **profiles** to separate infrastructure from application containers.

```
docker compose up -d                   # starts MongoDB, Redis, RabbitMQ only
docker compose --profile apps up -d    # starts everything (infra + 3 NestJS apps)
```

Root `package.json` wraps these:

```json
"docker:up":      "docker compose up -d",
"docker:up:all":  "docker compose --profile apps up -d --build",
"docker:down":    "docker compose --profile apps down",
"docker:logs":    "docker compose logs -f"
```

**Recommended local dev workflow:**
1. `pnpm docker:up` — start MongoDB, Redis, RabbitMQ
2. `pnpm dev` — start all 4 apps with hot-reload via webpack watch

This avoids port conflicts: the Docker app containers (gateway:3000, resume-service:3001, pdf-service:3002) and the locally running dev servers cannot both bind the same ports.

### MongoDB Port Remapping

```yaml
mongodb:
  ports:
    - '27018:27017'   # host:container
```

MongoDB inside the container listens on `27017` (its default). On the host machine it is mapped to `27018`. This avoids a clash with any locally installed MongoDB instance that also uses `27017`.

Local `.env` files use `localhost:27018`. Inside Docker, services connect to `mongodb:27017` (via the internal `resume-network`).

### Networks & Volumes

All containers share the `resume-network` bridge network. Services reference each other by container name (e.g. `http://resume-service:3001`).

Persistent volumes:
- `mongo_data` — MongoDB data directory
- `redis_data` — Redis AOF / RDB files
- `rabbitmq_data` — RabbitMQ definitions and messages

### Dockerfile Pattern

Each NestJS service's Dockerfile:
1. Sets `context: .` (monorepo root) so the shared `libs/` and `tsconfig.base.json` are accessible
2. Copies `pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`, and all relevant `apps/` and `libs/` packages
3. Runs `pnpm install --no-frozen-lockfile`
4. Runs `pnpm build` (webpack bundle)
5. Final image: `node:20-slim` + bundled `dist/main.js`

---

## 7. Tech Stack

| Layer              | Technology                          | Reason                                                           |
|--------------------|-------------------------------------|------------------------------------------------------------------|
| Frontend UI        | React 18 + TypeScript               | Component model, ecosystem                                       |
| Frontend state     | Zustand + persist                   | Minimal boilerplate, localStorage persistence out of the box     |
| Frontend build     | Vite                                | Fast HMR, native TypeScript, simple dev proxy                    |
| Frontend styling   | Tailwind CSS                        | Utility-first, no CSS bundle overhead                            |
| Backend framework  | NestJS (Express)                    | Decorator-based, built-in DI, TypeScript-first                   |
| Backend build      | webpack (NestJS webpack mode)       | Single-file bundle; solves pnpm workspace module resolution      |
| Database           | MongoDB 7 + Mongoose                | Document store fits semi-structured resume data                  |
| Cache              | Redis 7                             | Available for session caching / rate limiting (Phase 2)          |
| Message broker     | RabbitMQ 3                          | Available for async event publishing (Phase 2)                   |
| PDF generation     | Puppeteer 22 (headless Chromium)    | High-fidelity CSS rendering, A4 pagination control               |
| Containerisation   | Docker + Docker Compose             | Reproducible dev environment; prod deployment path               |
| Package manager    | pnpm 9 (workspaces)                 | Strict isolation, disk-efficient, workspace protocol             |
| Type sharing       | pnpm workspace libs                 | Single source of truth for domain types across all packages      |
| HTTP client        | Axios / NestJS HttpService          | Observable → Promise bridging via RxJS `firstValueFrom`          |

---

## 8. webpack & pnpm Workspace Bundling

This was the most significant infrastructure challenge in Phase 0.

**The problem:** pnpm uses strict symlink isolation. When NestJS builds with `tsc`, it emits `require('@resume-platform/shared-types')` in the output. At runtime, Node.js resolves that through the symlink in `node_modules/.pnpm/...` and finds raw TypeScript `.ts` files — which Node cannot execute.

**The solution:** webpack with `webpack-node-externals` and an allowlist:

```js
const nodeExternals = require('webpack-node-externals');
module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({ allowlist: [/@resume-platform\/.*/] }),
  ],
});
```

- `nodeExternals()` marks all `node_modules` as external — they stay as `require()` calls and are resolved from disk at runtime. This keeps the bundle small.
- `allowlist: [/@resume-platform\/.*/]` is the key exception: workspace packages matching this pattern are **bundled inline**. webpack processes their TypeScript source through `ts-loader` and bakes the compiled output directly into `dist/main.js`.
- Result: the bundle has zero dependency on `@resume-platform/*` at runtime — those modules are already compiled inside it.

`ts-loader` is installed in the root `devDependencies` so it is available to all three service webpack builds.

For the PDF service, `puppeteer` is also explicitly externalised (as a CommonJS external) because it contains native binaries that cannot be bundled.

For the **web app**, Vite handles module resolution differently — it resolves TypeScript sources directly without needing this webpack trick, so a simple Vite alias is used instead.

---

## 9. Phase 1 vs Phase 2 Architecture

### Phase 1 (current — MVP)

- No user accounts or authentication
- Resume state lives in browser `localStorage` only
- `guestId` (UUID) identifies an anonymous user session
- PDF download sends the full `ResumeData` object in the request body — no DB lookup required
- `resumeApi` client is implemented but not wired to automatic saves

### Phase 2 (planned)

- JWT authentication (email/password) + OAuth (Google, GitHub)
- Resumes persisted to MongoDB and associated with `userId`
- Wizard auto-saves to the API on each step completion
- PDF generation fetches resume by ID from resume-service (not from request body)
- Guest migration: on first login, all `guestId` resumes are claimed by the new `userId`
- Resume list UI: view, load, and manage multiple saved resumes

---

## 10. Port Reference

| Service              | Host Port | Container Port | Notes                                              |
|----------------------|-----------|----------------|----------------------------------------------------|
| web-app (Vite)       | 5173      | —              | Local dev only; proxies /api to Gateway            |
| gateway              | 3000      | 3000           |                                                    |
| resume-service       | 3001      | 3001           |                                                    |
| pdf-service          | 3002      | 3002           |                                                    |
| MongoDB              | **27018** | 27017          | ⚠ Not 27017 — remapped to avoid local Mongo clash  |
| Redis                | 6379      | 6379           |                                                    |
| RabbitMQ (AMQP)      | 5672      | 5672           |                                                    |
| RabbitMQ (Admin UI)  | 15672     | 15672          | Login: admin / secret                              |
