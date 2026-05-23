# Documentation Index

## Global Architecture

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Full platform overview — service map, data flows, Docker setup, tech stack, monorepo structure, webpack/pnpm bundling strategy |
| [DOCKER.md](./DOCKER.md) | Docker deep dive — what each `docker:up` / `docker:up:all` / `docker:down` / `docker:logs` command does, how profiles work, how containers connect, how images are built, troubleshooting |
| [DOCKER-CONCEPTS.md](./DOCKER-CONCEPTS.md) | Docker from first principles — what Docker is, images, containers, ports, volumes, networks, Compose, profiles, Dockerfiles, and how all of it applies to this project |

---

## Per-App Documentation

### Setup & Services

Covers local setup, environment variables, available API endpoints, and how to run each app.

| App | Document |
|-----|----------|
| Gateway | [apps/gateway.md](./apps/gateway.md) |
| Resume Service | [apps/resume-service.md](./apps/resume-service.md) |
| PDF Service | [apps/pdf-service.md](./apps/pdf-service.md) |
| Web App | [apps/web-app.md](./apps/web-app.md) |

### Technical Deep Dives

Covers internal architecture, request lifecycles, design decisions, and implementation details.

| App | Document |
|-----|----------|
| Gateway | [technical/gateway-technical.md](./technical/gateway-technical.md) |
| Resume Service | [technical/resume-service-technical.md](./technical/resume-service-technical.md) |
| PDF Service | [technical/pdf-service-technical.md](./technical/pdf-service-technical.md) |
| Web App | [technical/web-app-technical.md](./technical/web-app-technical.md) |
