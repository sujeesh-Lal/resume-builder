# Resume Builder Platform

A full-stack Resume Builder SaaS built as a **pnpm monorepo** with React, NestJS microservices, MongoDB, and event-driven architecture.

---

## Architecture

```
resume-platform/
├── apps/
│   ├── web-app          # React + Vite + Tailwind frontend      → port 5173
│   ├── gateway          # NestJS API gateway                    → port 3000
│   ├── resume-service   # NestJS resume CRUD + MongoDB          → port 3001
│   └── pdf-service      # NestJS PDF generation via Puppeteer   → port 3002
└── libs/
    ├── shared-types     # TypeScript interfaces shared across apps
    ├── events           # Event constants (RESUME_CREATED, PDF_REQUESTED, …)
    ├── logger           # Simple structured logger
    └── common           # ID generation, date utils, validation helpers
```

### Build tooling notes

- Each NestJS service uses **webpack** (via NestJS CLI) to bundle its source. This inlines the workspace libs (`@resume-platform/*`) at build time so there are no runtime path-alias resolution issues.
- `webpack-node-externals` is configured with an `allowlist: [/@resume-platform\/.*/]` so workspace libs are bundled while all real `node_modules` remain external.
- `puppeteer` is explicitly kept external in `pdf-service` because it relies on a native Chromium binary that cannot be inlined.

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 — `npm install -g pnpm`
- **Docker & Docker Compose** — for the infrastructure services (MongoDB, Redis, RabbitMQ)

---

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure only (MongoDB, Redis, RabbitMQ)

```bash
pnpm docker:up
```

> `docker:up` starts **only** the three infrastructure containers.
> The NestJS app services run locally via `pnpm dev` — do **not** run `docker:up:all` at the same time as `pnpm dev` or ports will clash.

### 3. Configure environment variables

Each service has its own `.env` file. Create them from the example, or copy the values below directly:

```bash
# apps/gateway/.env
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
RESUME_SERVICE_URL=http://localhost:3001
PDF_SERVICE_URL=http://localhost:3002

# apps/resume-service/.env
PORT=3001
# Note: Docker MongoDB is mapped to host port 27018 (27017 is reserved for any
# locally-installed MongoDB instance)
MONGODB_URI=mongodb://root:secret@localhost:27018/resume_platform?authSource=admin
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:secret@localhost:5672

# apps/pdf-service/.env
PORT=3002
RESUME_SERVICE_URL=http://localhost:3001
RABBITMQ_URL=amqp://admin:secret@localhost:5672
```

### 4. Start all services

```bash
pnpm dev
```

Or individually:

```bash
pnpm dev:web      # React app   → http://localhost:5173
pnpm dev:gateway  # Gateway     → http://localhost:3000/api
pnpm dev:resume   # Resume svc  → http://localhost:3001
pnpm dev:pdf      # PDF svc     → http://localhost:3002
```

### Restarting after a crash

If a previous `pnpm dev` session wasn't fully killed, the ports may still be in use. Clear them before restarting:

```bash
kill -9 $(lsof -ti:3000) 2>/dev/null
kill -9 $(lsof -ti:3001) 2>/dev/null
kill -9 $(lsof -ti:3002) 2>/dev/null
pnpm dev
```

---

## Infrastructure — Docker port mapping

| Service   | Container port | Host port | Note |
|-----------|---------------|-----------|------|
| MongoDB   | 27017         | **27018** | Avoids clash with any local MongoDB on 27017 |
| Redis     | 6379          | 6379      | |
| RabbitMQ  | 5672          | 5672      | AMQP |
| RabbitMQ  | 15672         | 15672     | Management UI → http://localhost:15672 (admin / secret) |

---

## Production (full Docker deployment)

Builds and starts all services, including the NestJS apps, inside Docker:

```bash
pnpm docker:up:all    # build images and start everything
pnpm docker:logs      # tail logs
pnpm docker:down      # stop everything
```

> `docker:up:all` uses the `apps` Docker Compose profile which is excluded from the default `docker:up` command.

---

## Phase 1 MVP Features

- **No login required** — guest sessions tracked via `localStorage`
- **Resume creation wizard** with 9 steps:
  - Template selection (Modern, Classic, Minimal, Creative)
  - Personal information
  - Professional summary
  - Work experience
  - Education
  - Skills (with levels & categories)
  - Projects
  - Certifications
  - Preview & export
- **Live preview** — all four templates render in real time
- **PDF download** — generated server-side via Puppeteer
- **Local storage persistence** — resume data survives page refreshes

---

## API Reference

All requests are routed through the **Gateway** (`http://localhost:3000/api`):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/resumes` | List resumes (filter by `?guestId=`) |
| `POST` | `/api/resumes` | Create a resume |
| `GET` | `/api/resumes/:id` | Get a resume |
| `PUT` | `/api/resumes/:id` | Update a resume |
| `DELETE` | `/api/resumes/:id` | Delete a resume |
| `POST` | `/api/pdf/generate` | Generate PDF (`{ resumeId, template, format }`) |
| `GET` | `/api/pdf/:resumeId/status` | PDF service status |
| `GET` | `/api/health` | Gateway health check |

---

## Events

| Event | Publisher | Subscriber |
|-------|-----------|------------|
| `resume.created` | resume-service | (analytics — future) |
| `resume.updated` | resume-service | (analytics — future) |
| `pdf.requested` | gateway | pdf-service |
| `pdf.generated` | pdf-service | (user notification — future) |

---

## Roadmap

- **Phase 2** — Authentication (JWT + OAuth)
- **Phase 3** — Payments (Stripe)
- **Phase 4** — Template marketplace, AI content suggestions
