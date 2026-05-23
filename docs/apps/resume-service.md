# Resume Service — Setup & Services

The **Resume Service** handles all resume CRUD operations. It runs on port **3001**, connects to MongoDB for persistence, and is the source of truth for stored resume data. In Phase 1, the frontend primarily uses `localStorage` for state, but the service is fully operational and ready for Phase 2 when user accounts are added.

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB running (via Docker — see below)

### Start Infrastructure

```bash
# From the repo root — starts MongoDB, Redis, RabbitMQ
pnpm docker:up
```

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create `apps/resume-service/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://root:secret@localhost:27018/resume_platform?authSource=admin
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://admin:secret@localhost:5672
```

| Variable        | Default                                                                                | Description                                                   |
|-----------------|----------------------------------------------------------------------------------------|---------------------------------------------------------------|
| `PORT`          | `3001`                                                                                 | Port the service listens on                                   |
| `MONGODB_URI`   | `mongodb://root:secret@localhost:27018/resume_platform?authSource=admin`              | MongoDB connection string. **Use port 27018** — Docker maps container 27017 → host 27018 to avoid conflicts with a locally installed MongoDB |
| `REDIS_URL`     | `redis://localhost:6379`                                                               | Redis connection (available for caching in future phases)     |
| `RABBITMQ_URL`  | `amqp://admin:secret@localhost:5672`                                                   | RabbitMQ connection (event publishing in future phases)       |

> ⚠️ **Important:** If you have MongoDB installed locally, it occupies port 27017. Always use `27018` in your `.env` to connect to the Dockerised instance.

### Run

```bash
# Start only the resume-service in dev/watch mode
pnpm --filter resume-service dev

# Or start all apps in parallel
pnpm dev
```

The service will be available at: `http://localhost:3001`

---

## Available Endpoints

> These endpoints are not called directly by the frontend. All traffic is routed through the gateway at `http://localhost:3000/api`.

### Resumes

| Method | Path            | Description                                            |
|--------|-----------------|--------------------------------------------------------|
| POST   | `/resumes`      | Create a new resume document in MongoDB                |
| GET    | `/resumes`      | List resumes. Accepts optional `?guestId=` query param |
| GET    | `/resumes/:id`  | Fetch a single resume by MongoDB ObjectId              |
| PUT    | `/resumes/:id`  | Update a resume (partial update via `$set`)            |
| DELETE | `/resumes/:id`  | Delete a resume (returns `204 No Content`)             |

**Create / Update request body fields:**

| Field            | Type     | Required | Description                                      |
|------------------|----------|----------|--------------------------------------------------|
| `title`          | string   | Yes      | Human-readable resume title                      |
| `guestId`        | string   | No       | Browser-generated guest identifier               |
| `userId`         | string   | No       | User account ID (Phase 2)                        |
| `template`       | string   | No       | `modern` \| `classic` \| `minimal` \| `creative` |
| `personalInfo`   | object   | No       | Name, email, phone, location, links              |
| `summary`        | string   | No       | Professional summary paragraph                   |
| `experience`     | array    | No       | Work experience entries                          |
| `education`      | array    | No       | Education entries                                |
| `skills`         | array    | No       | Skill entries with optional level/category       |
| `projects`       | array    | No       | Project entries                                  |
| `certifications` | array    | No       | Certification entries                            |
| `customSections` | array    | No       | Freeform custom sections                         |

---

## Data Model

Resumes are stored in MongoDB with the following shape (timestamps added automatically by Mongoose):

```
{
  _id:            ObjectId         (MongoDB auto-generated)
  title:          string
  guestId?:       string
  userId?:        string
  template:       'modern' | 'classic' | 'minimal' | 'creative'
  personalInfo:   object
  summary:        string
  experience:     array of objects
  education:      array of objects
  skills:         array of objects
  projects:       array of objects
  certifications: array of objects
  customSections: array of objects
  createdAt:      Date             (auto-managed)
  updatedAt:      Date             (auto-managed)
}
```

---

## Modules

| Module          | Purpose                                               |
|-----------------|-------------------------------------------------------|
| `ResumeModule`  | Controller, service, and Mongoose schema for resumes  |

---

## Build & Docker

```bash
# Build (webpack bundle)
pnpm --filter resume-service build

# Run everything containerised
pnpm docker:up:all
```

Inside Docker, the service connects to MongoDB at `mongodb:27017` (the internal Docker network hostname — no port remapping needed there).
