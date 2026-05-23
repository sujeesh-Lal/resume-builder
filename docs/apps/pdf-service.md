# PDF Service — Setup & Services

The **PDF Service** generates resume PDFs on demand using Puppeteer (headless Chromium). It runs on port **3002** and accepts the full resume data in the request body. It does not query any database — the frontend sends everything it needs.

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Chromium or Google Chrome must be available for Puppeteer to use

> Puppeteer downloads a compatible Chromium version automatically during `pnpm install`. On Linux CI / Docker, the system `chromium` binary is used instead (set via `PUPPETEER_EXECUTABLE_PATH`).

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create `apps/pdf-service/.env`:

```env
PORT=3002
RESUME_SERVICE_URL=http://localhost:3001
RABBITMQ_URL=amqp://admin:secret@localhost:5672
```

| Variable               | Default                        | Description                                                    |
|------------------------|--------------------------------|----------------------------------------------------------------|
| `PORT`                 | `3002`                         | Port the service listens on                                    |
| `RESUME_SERVICE_URL`   | `http://localhost:3001`        | URL of the resume-service (reserved for Phase 2 use)          |
| `RABBITMQ_URL`         | `amqp://admin:secret@localhost:5672` | RabbitMQ connection (event publishing in future phases)  |

> **Phase 1 note:** The service does not contact `RESUME_SERVICE_URL` at all in Phase 1. The full `ResumeData` object is passed in the HTTP request body. The variable is included for the Phase 2 transition.

### Run

```bash
# Start only the pdf-service in dev/watch mode
pnpm --filter pdf-service dev

# Or start all apps in parallel
pnpm dev
```

The service will be available at: `http://localhost:3002`

---

## Available Endpoints

> These endpoints are not called directly by the frontend. All traffic is routed through the gateway at `/api/pdf/*`.

### PDF Generation

| Method | Path                    | Description                                             |
|--------|-------------------------|---------------------------------------------------------|
| POST   | `/pdf/generate`         | Generate a PDF from the provided resume data            |
| GET    | `/pdf/:resumeId/status` | Check if PDF generation is available (always `ready`)   |

---

### `POST /pdf/generate`

**Request body:**

```json
{
  "resume": {
    "id": "uuid",
    "template": "modern",
    "personalInfo": {
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1 555-0100",
      "location": "San Francisco, CA",
      "linkedin": "linkedin.com/in/janesmith",
      "github": "github.com/janesmith"
    },
    "summary": "Full-stack engineer with 5 years experience...",
    "experience": [...],
    "education": [...],
    "skills": [...],
    "projects": [...],
    "certifications": [...]
  },
  "format": "A4"
}
```

| Field    | Type   | Default | Description                          |
|----------|--------|---------|--------------------------------------|
| `resume` | object | —       | Full `ResumeData` object (required)  |
| `format` | string | `"A4"`  | Page format: `"A4"` or `"Letter"`    |

**Response:** Binary PDF stream

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Jane Smith-resume.pdf"
Content-Length: <bytes>
```

---

### `GET /pdf/:resumeId/status`

**Response:**

```json
{
  "resumeId": "uuid",
  "status": "ready",
  "message": "PDF generation is available"
}
```

---

## Supported Templates

The service renders a full HTML document and prints it to PDF using Puppeteer. Four visual themes are supported:

| Template    | Description                                                             |
|-------------|-------------------------------------------------------------------------|
| `modern`    | Blue header banner (`#1e40af`), coloured section headings, pill skills  |
| `classic`   | Centre-aligned header, double-rule border, uppercase small-caps sections |
| `minimal`   | Light font-weight, generous whitespace, monochromatic                   |
| `creative`  | Purple-to-pink gradient header, vibrant accent colour                   |

PDF settings applied to all templates:
- Margins: 20mm top/bottom, 15mm left/right
- Background printing enabled
- Font: Segoe UI / Arial fallback

---

## Modules

| Module      | Purpose                                              |
|-------------|------------------------------------------------------|
| `PdfModule` | Controller and service for PDF generation            |

---

## Build & Docker

```bash
# Build (webpack bundle; Puppeteer stays as a CommonJS external)
pnpm --filter pdf-service build

# Run everything containerised
pnpm docker:up:all
```

In the Docker image (`node:20-slim`), system Chromium is installed and pointed to via `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`.
