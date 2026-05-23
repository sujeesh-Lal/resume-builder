# Web App — Setup & Features

The **Web App** is the React frontend for the Resume Builder. It runs on port **5173** (Vite dev server) and provides a multi-step wizard for building and exporting resumes. Resume state is persisted to `localStorage` so work is never lost between sessions.

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Gateway running at `http://localhost:3000` (for PDF download)

### Install Dependencies

```bash
pnpm install
```

### Run

```bash
# Start only the web app
pnpm --filter web-app dev

# Or start all apps in parallel
pnpm dev
```

Open `http://localhost:5173` in your browser.

> **Tip:** For PDF download to work, the backend services must also be running. Run `pnpm dev` from the root to start everything, or run `pnpm docker:up && pnpm dev` to start infrastructure first.

---

## Environment & Configuration

The web app has no `.env` file. All configuration is handled in `vite.config.ts`:

```ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

Any request to `/api/*` is transparently forwarded to the Gateway at `http://localhost:3000`. This means the browser never needs to know the backend URL.

---

## Wizard Steps

The resume is built through a 9-step wizard. Users can click any step in the progress bar to jump to it directly.

| # | Step Key          | Label              | What the user fills in                                      |
|---|-------------------|--------------------|-------------------------------------------------------------|
| 1 | `template`        | Template           | Choose a visual style: Modern, Classic, Minimal, Creative   |
| 2 | `personalInfo`    | Personal Info      | Name, email, phone, location, LinkedIn, GitHub, website     |
| 3 | `summary`         | Summary            | Professional summary paragraph                              |
| 4 | `experience`      | Experience         | Work history entries (add/edit/remove/reorder)              |
| 5 | `education`       | Education          | Degree, institution, dates, GPA                             |
| 6 | `skills`          | Skills             | Skills with optional proficiency level and category         |
| 7 | `projects`        | Projects           | Project name, description, tech stack, links                |
| 8 | `certifications`  | Certifications     | Certification name, issuer, date, optional credential ID    |
| 9 | `preview`         | Preview & Export   | Full live preview + Download PDF / Print buttons            |

---

## Resume Templates (Visual Preview)

| Template  | Style                                                                |
|-----------|----------------------------------------------------------------------|
| Modern    | Blue header banner, coloured headings, blue pill-shaped skill tags   |
| Classic   | Centred header, formal double-border rule, uppercase section labels  |
| Minimal   | Monochromatic, light weights, generous whitespace                    |
| Creative  | Purple-to-pink gradient header, vibrant accents                      |

Templates render both in the browser preview (`ResumePreview` component with React) and identically in the PDF (inline CSS rendered by Puppeteer).

---

## State Persistence

Resume data and the current wizard step are automatically saved to `localStorage` under the key `resume-builder-store` (managed by Zustand `persist` middleware). Closing or refreshing the browser tab does not lose data.

A unique `guestId` (format: `guest_<uuid>`) is created on first visit and stored separately under `resume_platform_guest_id`. This ID links all resumes belonging to the same anonymous user.

---

## Exported Actions (Preview Step)

| Action        | Behaviour                                                                      |
|---------------|--------------------------------------------------------------------------------|
| Download PDF  | Sends full resume data to `POST /api/pdf/generate` via the gateway; triggers browser file download |
| Print         | Calls `window.print()` — the page is print-styled to hide navigation          |
| Start Over    | Resets the Zustand store and navigates back to Step 1                          |

---

## API Client (`src/lib/api.ts`)

All API calls use `axios` with a base URL of `/api` and a 60-second timeout (to allow time for Puppeteer PDF generation).

| Client        | Method | Endpoint             | Description                             |
|---------------|--------|----------------------|-----------------------------------------|
| `resumeApi`   | POST   | `/resumes`           | Create a resume in MongoDB              |
| `resumeApi`   | GET    | `/resumes`           | List resumes by guestId                 |
| `resumeApi`   | GET    | `/resumes/:id`       | Get single resume                       |
| `resumeApi`   | PUT    | `/resumes/:id`       | Update resume                           |
| `resumeApi`   | DELETE | `/resumes/:id`       | Delete resume                           |
| `pdfApi`      | POST   | `/pdf/generate`      | Generate PDF from full resume object    |

> **Phase 1:** `resumeApi` endpoints are defined but not actively called by the wizard (state lives in `localStorage`). They will be wired up in Phase 2 when authentication and server-side persistence are added.

---

## Build

```bash
# Production build (outputs to apps/web-app/dist)
pnpm --filter web-app build
```

The `dist/` folder can be served by any static host (Netlify, S3, nginx, etc.).
