# Gateway — Technical Deep Dive

## Overview

The Gateway is a **pure reverse proxy** built with NestJS. It exposes a single public API surface to the frontend and shields the internal services from direct internet access. All business logic lives in the downstream services.

```
Browser  ──►  Gateway (:3000)  ──►  Resume Service (:3001)
                               └──►  PDF Service    (:3002)
```

---

## Module Architecture

```
src/
├── app.module.ts               # Root module — wires ConfigModule, HttpModule, and feature modules
├── main.ts                     # Bootstrap — Helmet, CORS, global prefix, ValidationPipe
└── modules/
    ├── health.controller.ts    # GET /api/health
    ├── health.module.ts
    ├── resume-proxy.controller.ts   # GET/POST/PUT/DELETE /api/resumes/**
    ├── resume-proxy.service.ts      # HTTP forwarding to resume-service
    ├── resume-proxy.module.ts
    ├── pdf-proxy.controller.ts      # POST /api/pdf/generate, GET /api/pdf/:id/status
    ├── pdf-proxy.service.ts         # HTTP forwarding to pdf-service; pipes binary buffer
    └── pdf-proxy.module.ts
```

---

## Request Lifecycle

Every inbound HTTP request passes through this chain:

```
Inbound Request
    │
    ▼
Helmet middleware          (security headers: XSS, HSTS, etc.)
    │
    ▼
CORS middleware            (validates Origin against ALLOWED_ORIGINS)
    │
    ▼
NestJS Router              (matches /api prefix + controller route)
    │
    ▼
ValidationPipe             (strips unknown fields, validates shape)
    │
    ▼
Controller method
    │
    ▼
Proxy Service              (HttpService.post/get/put/delete → downstream service)
    │
    ▼
Downstream response
    │
    ▼  (for PDF: buffer piped to res.send())
Outbound Response
```

---

## Resume Proxy

The `ResumeProxyService` wraps NestJS `HttpService` (Axios under the hood) and exposes four helper methods:

| Method          | Forwards to                          |
|-----------------|--------------------------------------|
| `forwardGet`    | `GET  {RESUME_SERVICE_URL}{path}`    |
| `forwardPost`   | `POST {RESUME_SERVICE_URL}{path}`    |
| `forwardPut`    | `PUT  {RESUME_SERVICE_URL}{path}`    |
| `forwardDelete` | `DELETE {RESUME_SERVICE_URL}{path}`  |

All methods use `firstValueFrom(observable)` to bridge RxJS Observables (returned by Axios/HttpService) into standard Promises.

The controller directly returns the upstream JSON — NestJS serialises it automatically.

---

## PDF Proxy

The PDF flow is slightly different because the response is a binary file, not JSON.

```
POST /api/pdf/generate  (body: { resume, format })
    │
    ▼
PdfProxyController.generate()
    │
    ▼
PdfProxyService.requestPdf(resume, format)
    │  HTTP POST with responseType: 'arraybuffer'
    ▼
pdf-service /pdf/generate
    │
    ◄── PDF binary buffer
    │
PdfProxyService: Buffer.from(data)
    │
    ▼
Controller: res.set({ Content-Type, Content-Disposition, Content-Length })
            res.send(buffer)
```

Key detail: the controller injects `@Res() res: any` (raw Express response object) to take manual control of the response stream. This bypasses NestJS's automatic JSON serialisation so the raw binary can be sent directly.

---

## Security Configuration

### Helmet
Applied via `app.use(helmet())` at the Express level — adds:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (HSTS)
- Content Security Policy headers

### CORS
```ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:5173'],
  credentials: true,
});
```
The `ALLOWED_ORIGINS` env var accepts a comma-separated list for multi-origin deployments (e.g. staging + production frontend URLs).

### Validation
`ValidationPipe` with `whitelist: true` silently drops any request fields not declared in a DTO. `forbidNonWhitelisted: true` goes further and returns a 400 error if unknown fields are sent. This prevents parameter pollution attacks.

Note: because the gateway forwards requests without inspecting body types deeply (body is typed as `unknown` in the proxy controllers), full DTO validation is delegated to the downstream services.

---

## Error Handling

The gateway propagates HTTP status codes from downstream services transparently. If the resume-service returns a `404`, the gateway returns a `404` to the browser. If a downstream service is unreachable, Axios throws and NestJS converts it to a `500 Internal Server Error`.

Future improvement: add a `HttpExceptionFilter` to map common upstream errors into friendlier messages.

---

## webpack Configuration

The gateway is built with webpack (NestJS webpack mode) to produce a single `dist/main.js` bundle.

```js
// apps/gateway/webpack.config.js
const nodeExternals = require('webpack-node-externals');
module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({ allowlist: [/@resume-platform\/.*/] }),
  ],
});
```

`nodeExternals` marks all `node_modules` as external (not bundled), which keeps the bundle small and avoids duplicating dependencies. The `allowlist` for `@resume-platform/*` forces workspace libraries (`shared-types`, `logger`, etc.) to be **inlined** into the bundle rather than left as bare `require()` calls pointing at raw TypeScript source — which would fail at runtime.

---

## Ports & Network

| Environment | Gateway URL                 |
|-------------|-----------------------------|
| Local dev   | `http://localhost:3000/api` |
| Docker      | `http://resume-gateway:3000/api` (internal), `http://localhost:3000/api` (host) |
