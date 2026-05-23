# Web App — Technical Deep Dive

## Overview

The web app is a **React + TypeScript** single-page application built with Vite. State management is handled by Zustand with localStorage persistence. The UI is a wizard driven entirely by client-side state — the backend is only contacted when the user downloads a PDF.

---

## Component Architecture

```
src/
├── main.tsx                          # React entry point — mounts <App />
├── App.tsx                           # Root component — renders <ResumeWizard />
├── index.css                         # Tailwind base + custom utility classes
├── lib/
│   └── api.ts                        # Axios API client (resumeApi, pdfApi)
├── store/
│   └── resume.store.ts               # Zustand store with localStorage persist
└── components/
    ├── wizard/
    │   ├── ResumeWizard.tsx          # Wizard shell: progress bar + step routing
    │   ├── StepLayout.tsx            # Shared layout wrapper for steps
    │   └── steps/
    │       ├── TemplateStep.tsx      # Step 1: template selection cards
    │       ├── PersonalInfoStep.tsx  # Step 2: name, email, phone, links
    │       ├── SummaryStep.tsx       # Step 3: textarea for professional summary
    │       ├── ExperienceStep.tsx    # Step 4: work history (add/edit/remove)
    │       ├── EducationStep.tsx     # Step 5: education entries
    │       ├── SkillsStep.tsx        # Step 6: skills with level + category
    │       ├── ProjectsStep.tsx      # Step 7: project entries
    │       ├── CertificationsStep.tsx # Step 8: certifications
    │       └── PreviewStep.tsx       # Step 9: live preview + PDF export
    ├── preview/
    │   └── ResumePreview.tsx         # Selects and renders the correct template component
    └── templates/
        ├── ModernTemplate.tsx        # Modern template (blue header)
        ├── ClassicTemplate.tsx       # Classic template (centred, double border)
        ├── MinimalTemplate.tsx       # Minimal template (monochromatic)
        └── CreativeTemplate.tsx      # Creative template (gradient header)
```

---

## State Management

### Zustand Store (`resume.store.ts`)

The entire application state lives in a single Zustand store:

```
ResumeStore
├── resume: ResumeData            ← the full resume object
├── currentStep: WizardStep       ← which wizard step is active
├── isSaving: boolean
├── isGeneratingPdf: boolean
├── lastSavedAt: string | null
│
├── Navigation
│   ├── setStep(step)             ← jump to any step
│   ├── nextStep()                ← advance to next step in sequence
│   └── prevStep()                ← go back one step
│
├── Resume mutations
│   ├── setTemplate(template)
│   ├── setPersonalInfo(partial)
│   ├── setSummary(text)
│   └── setTitle(text)
│
├── Per-section CRUD
│   ├── addExperience / updateExperience / removeExperience / reorderExperience
│   ├── addEducation  / updateEducation  / removeEducation
│   ├── addSkill      / updateSkill      / removeSkill
│   ├── addProject    / updateProject    / removeProject
│   └── addCertification / updateCertification / removeCertification
│
└── Actions
    ├── resetResume()             ← creates a fresh empty resume + goes to step 1
    ├── loadResume(resume)        ← replaces current resume (Phase 2: load from API)
    └── touch()                   ← bumps updatedAt timestamp
```

### Persistence

The `persist` middleware serialises a subset of state to `localStorage`:

```ts
partialize: (state) => ({ resume: state.resume, currentStep: state.currentStep })
```

Only `resume` and `currentStep` are persisted. UI flags like `isSaving` and `isGeneratingPdf` are excluded (they reset to `false` on page load).

**Storage key:** `resume-builder-store`

### Guest Identity

On first load, `getOrCreateGuestId()` generates a UUID-based guest ID and stores it in `localStorage` under `resume_platform_guest_id`. Every new resume created by this browser session carries this `guestId`. This enables the backend to associate multiple resumes with the same anonymous user without authentication.

---

## Wizard Navigation Flow

```
Step 1: Template       → user picks visual style
    ↓  nextStep()
Step 2: Personal Info  → name, email, phone, location, social links
    ↓  nextStep()
Step 3: Summary        → professional paragraph
    ↓  nextStep()
Step 4: Experience     → repeatable work history cards
    ↓  nextStep()
Step 5: Education      → repeatable education cards
    ↓  nextStep()
Step 6: Skills         → skill tags with optional level + category
    ↓  nextStep()
Step 7: Projects       → project cards with tech stack + links
    ↓  nextStep()
Step 8: Certifications → certification entries
    ↓  nextStep()
Step 9: Preview        → full resume rendered + Download PDF / Print
```

Users can also jump to any step by clicking its label in the progress bar. Steps already visited are shown with a checkmark (✓); the current step is highlighted; future steps are dimmed.

**Progress bar** shows `((currentIndex + 1) / 9) * 100%` fill.

---

## ResumePreview Component

`ResumePreview` is a dispatcher — it reads `resume.template` and renders the corresponding template component:

```tsx
const map = {
  modern:   <ModernTemplate resume={resume} />,
  classic:  <ClassicTemplate resume={resume} />,
  minimal:  <MinimalTemplate resume={resume} />,
  creative: <CreativeTemplate resume={resume} />,
};
return map[resume.template] ?? map['modern'];
```

Each template component is a pure presentational component — it takes `resume: ResumeData` as a prop and returns JSX with Tailwind utility classes. The rendered output mirrors (closely) what the PDF service produces via Puppeteer.

---

## PDF Download Flow

```
User clicks "Download PDF"
    │
    ▼
PreviewStep: setIsDownloading(true)
    │
    ▼
pdfApi.generate(resume)
    │  POST /api/pdf/generate  { resume, format: 'A4' }
    │  Vite proxy: /api → http://localhost:3000
    ▼
Gateway  →  PDF Service  →  Puppeteer render
    │
    ◄── Blob (application/pdf)
    │
URL.createObjectURL(blob)
    │
<a href={url} download="Jane Smith-resume.pdf">.click()
    │
URL.revokeObjectURL(url)   ← cleans up memory
    │
setIsDownloading(false)
```

If the backend is unavailable, the catch block sets `downloadError` and shows a yellow warning banner.

---

## API Client (`lib/api.ts`)

Built on Axios with:
- `baseURL: '/api'` — all requests go through the Vite dev proxy
- `timeout: 60000` — 60 seconds, to accommodate Puppeteer's startup time

```ts
const api = axios.create({ baseURL: '/api', timeout: 60000 });
```

`pdfApi.generate(resume)` uses `responseType: 'blob'` so Axios stores the binary response as a `Blob` object rather than trying to parse it as JSON.

---

## Vite Dev Proxy

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```

This means the browser always makes requests to `http://localhost:5173/api/*`. Vite intercepts those and forwards them to `http://localhost:3000/api/*`. The browser never needs to know the backend port, and there are no CORS issues in development.

In production (after `vite build`), a reverse proxy (nginx, etc.) would need to be configured to forward `/api` to the gateway.

---

## Styling

- **Tailwind CSS** utility classes for all layout and typography
- Custom component classes defined in `index.css`:
  - `.btn-primary` — filled primary action button
  - `.btn-secondary` — outlined secondary button
  - `.card` — white card with border and shadow
- Print media queries hide navigation and action buttons when using browser Print

---

## TypeScript & Path Resolution

The web app resolves `@resume-platform/shared-types` directly to the TypeScript source in `libs/`:

```ts
// vite.config.ts
resolve: {
  alias: {
    '@resume-platform/shared-types': path.resolve(__dirname, '../../libs/shared-types/src/index.ts'),
  },
}
```

Vite's dev server can handle TypeScript natively, so no compilation step is needed for the shared library in development. This is simpler than the webpack approach used by the backend services.
