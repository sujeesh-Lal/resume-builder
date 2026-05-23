# Resume Service — Technical Deep Dive

## Overview

The Resume Service is the **data persistence layer** for the platform. It manages resume documents in MongoDB, exposes a REST API consumed exclusively by the Gateway, and uses `AppLogger` from the shared `@resume-platform/logger` library for structured logging.

---

## Module Architecture

```
src/
├── app.module.ts                         # Root module — ConfigModule, MongooseModule, ResumeModule
├── main.ts                               # Bootstrap — ValidationPipe, CORS, port binding
└── modules/resume/
    ├── resume.controller.ts              # HTTP controller (5 routes)
    ├── resume.service.ts                 # Business logic + Mongoose queries
    ├── resume.module.ts                  # Module wiring
    ├── schemas/
    │   └── resume.schema.ts             # Mongoose schema + Document type
    └── dto/
        ├── create-resume.dto.ts         # Validated shape for POST /resumes
        └── update-resume.dto.ts         # Partial DTO for PUT /resumes/:id
```

---

## Database: MongoDB

Connection is configured asynchronously using `MongooseModule.forRootAsync`, which reads `MONGODB_URI` from `ConfigService`. This pattern ensures the config module has initialised before the connection is attempted.

**Local connection string:**
```
mongodb://root:secret@localhost:27018/resume_platform?authSource=admin
```

**Why port 27018?** The Docker Compose file maps host port `27018` → container port `27017`. This avoids a clash if MongoDB is already installed locally on port 27017.

**Docker internal connection string (used inside containers):**
```
mongodb://root:secret@mongodb:27017/resume_platform?authSource=admin
```

---

## Mongoose Schema

The `Resume` schema mirrors the `ResumeData` interface from `@resume-platform/shared-types`. Mongoose `timestamps: true` automatically manages `createdAt` and `updatedAt`.

```
Field           Mongoose Type       Notes
──────────────────────────────────────────────────────────────
_id             ObjectId            MongoDB auto-generated
title           String              required
guestId         String              optional; used to associate guest sessions
userId          String              optional; populated in Phase 2 (auth)
template        String              default: 'modern'
personalInfo    Object (Mixed)      stored as BSON document
summary         String
experience      [Object] (Mixed[])  array of work entry objects
education       [Object] (Mixed[])
skills          [Object] (Mixed[])
projects        [Object] (Mixed[])
certifications  [Object] (Mixed[])
customSections  [Object] (Mixed[])
createdAt       Date               auto-managed (timestamps: true)
updatedAt       Date               auto-managed (timestamps: true)
```

Nested sections (`experience`, `education`, etc.) are stored as `Mixed` (schemaless BSON objects). This avoids defining deeply nested Mongoose sub-schemas and makes it easy to add new fields without a migration, at the cost of no schema-level validation on nested content.

---

## Service Layer — Key Operations

### `create(dto)`
Instantiates a new `Resume` model, calls `.save()`, and logs the new `resumeId`.

### `findAll(guestId?)`
If `guestId` is provided, filters by that field. Returns results sorted newest-first (`{ createdAt: -1 }`). This enables the frontend to show only the current guest's resumes once the resume list UI is added.

### `findOne(id)`
Uses `findById(id)` — Mongoose automatically casts the string `id` to an `ObjectId`. Throws `NotFoundException` (HTTP 404) if not found.

### `update(id, dto)`
Uses `findByIdAndUpdate` with `{ $set: dto, new: true }`. The `new: true` option returns the updated document rather than the original. Throws `NotFoundException` if the document doesn't exist.

### `remove(id)`
Uses `findByIdAndDelete`. Returns `void`; the controller responds with `204 No Content`.

---

## Request Flow

```
Gateway  POST /resumes  { title, personalInfo, ... }
    │
    ▼
ResumeController.create(@Body() dto: CreateResumeDto)
    │  ValidationPipe validates DTO shape
    ▼
ResumeService.create(dto)
    │  new ResumeModel(dto).save()
    ▼
MongoDB insert
    │
    ◄── Saved document (with _id, createdAt, updatedAt)
    │
    ▼
Response: 201 Created  { ...resumeDocument }
```

---

## Logging

`AppLogger` from `@resume-platform/logger` is used for operational events:

```
[2025-01-01T00:00:00.000Z] [INFO] [ResumeService] Resume created { resumeId: '...' }
[2025-01-01T00:00:00.000Z] [INFO] [ResumeService] Resume updated { resumeId: '...' }
[2025-01-01T00:00:00.000Z] [INFO] [ResumeService] Resume deleted { resumeId: '...' }
```

Errors are surfaced as NestJS `NotFoundException` exceptions and converted to 404 responses by the default exception filter.

---

## Validation

`ValidationPipe` is configured with `whitelist: true` and `transform: true`. The `CreateResumeDto` and `UpdateResumeDto` use `class-validator` decorators (from `@nestjs/mapped-types` for the partial update type). Unknown fields sent to the API are silently stripped.

---

## webpack Configuration

```js
// apps/resume-service/webpack.config.js
const nodeExternals = require('webpack-node-externals');
module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({ allowlist: [/@resume-platform\/.*/] }),
  ],
});
```

Same pattern as the gateway — workspace library packages are inlined into the bundle; all other `node_modules` remain external. This avoids the `SyntaxError: Unexpected token 'export'` runtime crash that occurs when Node.js tries to execute raw TypeScript ESM source.

---

## Phase 2 Notes

- `userId` field on the schema is ready for JWT-based user association.
- `guestId` migration path: on first login, a background job can update all resumes where `guestId === currentGuestId` to set `userId = authenticatedUser.id`.
- RabbitMQ and Redis infrastructure is already available. The service can publish `resume.created` / `resume.updated` events using the constants defined in `@resume-platform/events`.
