# Gateway — Setup & Services

The **Gateway** is the single entry point for all API traffic from the frontend. It runs on port **3000** and proxies requests to the downstream `resume-service` and `pdf-service`. No business logic lives here — it is a thin routing and security layer.

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Infrastructure services running (MongoDB, Redis, RabbitMQ via Docker)

### Start Infrastructure

```bash
pnpm docker:up
```

### Install Dependencies

```bash
# From the repo root
pnpm install
```

### Environment Variables

Create `apps/gateway/.env` (already committed for local dev):

```env
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
RESUME_SERVICE_URL=http://localhost:3001
PDF_SERVICE_URL=http://localhost:3002
```

| Variable              | Default                    | Description                                      |
|-----------------------|----------------------------|--------------------------------------------------|
| `PORT`                | `3000`                     | Port the gateway listens on                      |
| `ALLOWED_ORIGINS`     | `http://localhost:5173`    | Comma-separated list of allowed CORS origins     |
| `RESUME_SERVICE_URL`  | `http://localhost:3001`    | Base URL of the resume-service                   |
| `PDF_SERVICE_URL`     | `http://localhost:3002`    | Base URL of the pdf-service                      |

### Run

```bash
# Start only the gateway in dev mode (webpack watch)
pnpm --filter gateway dev

# Or start all apps in parallel from the root
pnpm dev
```

The gateway will be available at: `http://localhost:3000/api`

---

## Available Endpoints

All routes are prefixed with `/api`.

### Health

| Method | Path           | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/api/health`  | Returns service status and timestamp |

**Response example:**
```json
{ "status": "ok", "service": "gateway", "timestamp": "2025-01-01T00:00:00.000Z" }
```

---

### Resumes — proxied to resume-service

| Method | Path               | Description                                     |
|--------|--------------------|-------------------------------------------------|
| GET    | `/api/resumes`     | List all resumes (optional `?guestId=` filter)  |
| GET    | `/api/resumes/:id` | Fetch a single resume by ID                     |
| POST   | `/api/resumes`     | Create a new resume                             |
| PUT    | `/api/resumes/:id` | Update a resume by ID                           |
| DELETE | `/api/resumes/:id` | Delete a resume by ID                           |

---

### PDF — proxied to pdf-service

| Method | Path                      | Description                                     |
|--------|---------------------------|-------------------------------------------------|
| POST   | `/api/pdf/generate`       | Generate and stream a PDF from resume data      |
| GET    | `/api/pdf/:resumeId/status` | Check PDF generation availability (Phase 1: always returns `ready`) |

**`POST /api/pdf/generate` request body:**
```json
{
  "resume": { /* full ResumeData object */ },
  "format": "A4"
}
```

**Response:** Binary PDF stream (`application/pdf`) with `Content-Disposition: attachment`.

---

## Modules

| Module               | Purpose                                                        |
|----------------------|----------------------------------------------------------------|
| `HealthModule`       | Liveness probe endpoint                                        |
| `ResumeProxyModule`  | Forwards resume CRUD requests to resume-service via HTTP       |
| `PdfProxyModule`     | Forwards PDF generation requests to pdf-service; pipes binary buffer back to client |

---

## Security & Middleware

- **Helmet** — sets security-related HTTP headers on every response
- **CORS** — restricts cross-origin requests to `ALLOWED_ORIGINS`
- **ValidationPipe** — strips unknown fields (`whitelist: true`) and rejects extra properties (`forbidNonWhitelisted: true`)
- **Global prefix** — all routes prefixed with `/api`

---

## Build & Docker

```bash
# Build the gateway (webpack bundle)
pnpm --filter gateway build

# Build and run everything in Docker
pnpm docker:up:all
```

The Dockerfile builds a webpack bundle from `apps/gateway/Dockerfile` using the monorepo root as Docker build context.
