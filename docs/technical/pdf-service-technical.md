# PDF Service — Technical Deep Dive

## Overview

The PDF Service renders resume HTML with template-specific CSS and converts it to a PDF file using **Puppeteer** (headless Chromium). The entire rendering pipeline is self-contained — it receives a `ResumeData` object in the request body, builds an HTML string in-process, and streams the PDF buffer back.

---

## Module Architecture

```
src/
├── app.module.ts              # Root module — ConfigModule, PdfModule
├── main.ts                    # Bootstrap — ValidationPipe, CORS, port binding
└── modules/pdf/
    ├── pdf.controller.ts      # POST /pdf/generate, GET /pdf/:id/status
    ├── pdf.service.ts         # HTML builder + Puppeteer PDF rendering
    └── pdf.module.ts          # Module wiring
```

---

## PDF Generation Pipeline

```
POST /pdf/generate  { resume: ResumeData, format: 'A4' }
    │
    ▼
PdfController.generate()
    │
    ▼
PdfService.generatePdf(resume, format)
    │
    ├─ buildResumeHtml(resume, template)    ← pure string concatenation
    │       │
    │       └─ getTemplateStyles(template)  ← returns CSS string for chosen theme
    │
    ▼
puppeteer.launch({ headless: true, args: ['--no-sandbox', ...] })
    │
    ▼
browser.newPage()
    │
    ▼
page.setContent(html, { waitUntil: 'networkidle0' })   ← waits for all resources
    │
    ▼
page.pdf({ format, printBackground: true, margin: {...} })
    │
    ◄── Uint8Array
    │
Buffer.from(pdfBuffer)
    │
    ▼
browser.close()   ← always closed in finally block
    │
    ▼
Controller: res.set(headers) + res.send(buffer)
```

---

## HTML Template System

The `buildResumeHtml` method constructs a complete HTML document as a template literal. Each resume section is conditionally included — if the array is empty, the section is omitted entirely.

**Sections rendered:**

| Section          | Condition                           |
|------------------|-------------------------------------|
| Header           | Always (name + contact info)        |
| Summary          | Only if `summary` string is present |
| Experience       | Only if `experience.length > 0`     |
| Education        | Only if `education.length > 0`      |
| Skills           | Only if `skills.length > 0`         |
| Projects         | Only if `projects.length > 0`       |
| Certifications   | Only if `certifications.length > 0` |

---

## Template Styles

Each template is a CSS string composed of a `base` block (shared layout rules) plus theme-specific overrides. All styles are inline in the `<head>` — no external stylesheets, no network requests during rendering.

### Base styles (all templates)
- Box-sizing reset
- Font: Segoe UI / Arial, 11pt
- Section headings with bottom border
- Entry layout with flexbox date positioning
- Skill pill grid

### Theme overrides

| Template   | Header colour                          | Accent            | Skill pill style            |
|------------|----------------------------------------|-------------------|-----------------------------|
| `modern`   | `#1e40af` (blue) solid background      | `#1e40af`         | Blue fill (`#dbeafe`)       |
| `classic`  | White background, double-rule border, centred | `#333`      | Light grey fill + border    |
| `minimal`  | White background, no border            | `#000`            | Transparent, thin border    |
| `creative` | Linear gradient `#7c3aed` → `#db2777` | `#7c3aed`         | Purple fill (`#f3e8ff`)     |

---

## Puppeteer Configuration

```ts
puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
```

`--no-sandbox` and `--disable-setuid-sandbox` are required when running Puppeteer inside Docker containers (or any Linux environment without a user namespace). Without these flags, Chromium refuses to launch in an unprivileged container context.

**PDF options:**
```ts
page.pdf({
  format: 'A4',          // or 'Letter'
  printBackground: true, // ensures background colours/gradients print
  margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
})
```

The browser is always closed in a `finally` block to prevent zombie Chromium processes if rendering fails.

---

## webpack & Puppeteer Externalisation

Puppeteer cannot be bundled by webpack because it includes native binaries (the Chromium executable). The webpack config explicitly marks it as a CommonJS external:

```js
// apps/pdf-service/webpack.config.js
const nodeExternals = require('webpack-node-externals');
module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({ allowlist: [/@resume-platform\/.*/] }),
    { puppeteer: 'commonjs puppeteer' },
  ],
});
```

This tells webpack to leave `require('puppeteer')` as-is in the output bundle and resolve it from `node_modules` at runtime.

---

## Docker Considerations

In Docker, the `Dockerfile` uses `node:20-slim` and installs system Chromium dependencies:

```dockerfile
RUN apt-get install -y chromium ...
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

Setting `PUPPETEER_EXECUTABLE_PATH` bypasses Puppeteer's own bundled Chromium download and uses the system binary instead. This keeps the Docker image smaller and ensures compatibility with the container's Linux environment.

---

## Phase 1 vs Phase 2 Architecture

### Phase 1 (current)
The full `ResumeData` object is sent from the browser → Gateway → PDF Service in the HTTP request body. The PDF Service has no dependency on MongoDB or the Resume Service.

```
Browser  ──POST { resume: { ... } }──►  Gateway  ──POST { resume }──►  PDF Service
                                                                            │
                                                                    buildResumeHtml()
                                                                    puppeteer.pdf()
                                                                            │
Browser  ◄── PDF binary ──────────────────────────────────────────────────◄┘
```

### Phase 2 (planned)
When resumes are persisted server-side (with auth), the PDF Service will fetch the resume by ID from the Resume Service:

```
Browser  ──POST { resumeId }──►  Gateway  ──POST { resumeId }──►  PDF Service
                                                                       │
                                                               GET /resumes/{id}
                                                                       ▼
                                                               Resume Service
                                                                       │
                                                              ◄── ResumeData
                                                                       │
                                                              buildResumeHtml()
                                                              puppeteer.pdf()
```

The `RESUME_SERVICE_URL` environment variable is already wired in for this transition.
