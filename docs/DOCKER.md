# Docker Guide

This document explains how the Docker setup works for the Resume Builder platform — what each command does, which services get started, how profiles control what runs, and how containers talk to each other.

---

## The Four Commands

```json
"docker:up":      "docker compose up -d",
"docker:up:all":  "docker compose --profile apps up -d --build",
"docker:down":    "docker compose --profile apps down",
"docker:logs":    "docker compose logs -f"
```

Run any of these from the **repo root** with `pnpm <script>`, e.g. `pnpm docker:up`.

---

### `pnpm docker:up`

```bash
docker compose up -d
```

**Starts: MongoDB, Redis, RabbitMQ only.**

The `-d` flag means *detached* — containers run in the background and your terminal is returned immediately.

This is the command you run before `pnpm dev`. It boots the three infrastructure services that the backend apps depend on, without starting the NestJS apps themselves. That way:

- The NestJS apps run on your machine with hot-reload (`pnpm dev`)
- The infrastructure runs in Docker (no local install needed)
- No port conflicts: the Docker app containers and your local dev servers can't both bind ports 3000/3001/3002 at the same time

**What starts:**

| Container         | Image                        | Host Port | Purpose                    |
|-------------------|------------------------------|-----------|----------------------------|
| `resume-mongodb`  | `mongo:7`                    | 27018     | Primary database           |
| `resume-redis`    | `redis:7-alpine`             | 6379      | Cache / session store      |
| `resume-rabbitmq` | `rabbitmq:3-management-alpine` | 5672, 15672 | Message broker          |

> **Why port 27018 and not 27017?**
> MongoDB's default port is 27017. If you have MongoDB installed locally on your machine, it already occupies 27017. The Docker container is mapped to host port **27018** to avoid that clash. Your `.env` files use `localhost:27018`; inside Docker, services still use `mongodb:27017` (the container's internal port).

---

### `pnpm docker:up:all`

```bash
docker compose --profile apps up -d --build
```

**Starts: everything — infrastructure + all three NestJS app containers.**

Two extra flags here:

- `--profile apps` — unlocks the app containers (gateway, resume-service, pdf-service). Without this flag, Docker Compose ignores any service that has `profiles: [apps]` in `docker-compose.yml`.
- `--build` — rebuilds the Docker images before starting. This is important because the NestJS apps are compiled from your source code. Without `--build`, Docker would use a cached (potentially stale) image.

Use this command when you want to **run the entire platform in Docker** — useful for testing a production-like deployment or when you don't want to run the NestJS apps locally.

**What starts:**

| Container          | Image / Build              | Host Port | Purpose                          |
|--------------------|----------------------------|-----------|----------------------------------|
| `resume-mongodb`   | `mongo:7`                  | 27018     | Database                         |
| `resume-redis`     | `redis:7-alpine`           | 6379      | Cache                            |
| `resume-rabbitmq`  | `rabbitmq:3-management-alpine` | 5672, 15672 | Message broker              |
| `resume-gateway`   | Built from `apps/gateway/Dockerfile`        | 3000 | API gateway |
| `resume-service`   | Built from `apps/resume-service/Dockerfile` | 3001 | Resume CRUD |
| `pdf-service`      | Built from `apps/pdf-service/Dockerfile`    | 3002 | PDF generation |

> **Note:** When using `docker:up:all`, do not also run `pnpm dev`. Both would try to bind the same ports (3000, 3001, 3002) and one of them will fail with `EADDRINUSE`.

---

### `pnpm docker:down`

```bash
docker compose --profile apps down
```

**Stops and removes all containers** (infrastructure + app containers).

The `--profile apps` flag is required here too — without it, Docker Compose would only stop the infrastructure containers and leave the app containers running.

This command stops containers and removes them, but **volumes are preserved**. Your MongoDB data, Redis data, and RabbitMQ data survive a `docker:down`. To also wipe volumes (full reset), run:

```bash
docker compose --profile apps down -v
```

---

### `pnpm docker:logs`

```bash
docker compose logs -f
```

**Streams live logs from all running containers** to your terminal.

The `-f` flag means *follow* — it stays open and prints new log lines as they arrive, just like `tail -f`. Press `Ctrl+C` to stop following (containers keep running).

To see logs from a specific container only:

```bash
docker compose logs -f gateway
docker compose logs -f resume-service
docker compose logs -f pdf-service
docker compose logs -f mongodb
```

---

## How Profiles Work

Docker Compose profiles let you label services so they only start when explicitly requested.

In `docker-compose.yml`, the three NestJS app services are tagged:

```yaml
gateway:
  profiles: [apps]
  ...

resume-service:
  profiles: [apps]
  ...

pdf-service:
  profiles: [apps]
  ...
```

Services **without** a `profiles` key (MongoDB, Redis, RabbitMQ) always start regardless of which profile is active. Services **with** a profile only start when that profile is passed via `--profile apps`.

This is what makes it possible to run:

```
pnpm docker:up   →  starts infra only (no profile flag)
pnpm docker:up:all → starts everything (--profile apps)
```

---

## How Containers Connect to Each Other

All containers are attached to a shared Docker bridge network called `resume-network`:

```yaml
networks:
  resume-network:
    driver: bridge
```

Within this network, containers reach each other using their **service name** as the hostname. This is different from how your local machine connects to them.

| From (container) | Connects to            | Using                         |
|------------------|------------------------|-------------------------------|
| gateway          | resume-service         | `http://resume-service:3001`  |
| gateway          | pdf-service            | `http://pdf-service:3002`     |
| resume-service   | MongoDB                | `mongodb://...@mongodb:27017` |
| resume-service   | Redis                  | `redis://redis:6379`          |
| resume-service   | RabbitMQ               | `amqp://...@rabbitmq:5672`    |
| pdf-service      | RabbitMQ               | `amqp://...@rabbitmq:5672`    |

Your **local machine** (browser, `.env` files) connects to containers via the host port mappings:

| Service         | Local `.env` value                                    |
|-----------------|-------------------------------------------------------|
| MongoDB         | `mongodb://root:secret@localhost:27018/resume_platform?authSource=admin` |
| Redis           | `redis://localhost:6379`                              |
| RabbitMQ        | `amqp://admin:secret@localhost:5672`                  |
| Gateway         | `http://localhost:3000`                               |
| Resume Service  | `http://localhost:3001`                               |
| PDF Service     | `http://localhost:3002`                               |

---

## How Each App Container is Built

Each NestJS service has its own `Dockerfile`. They all follow the same pattern:

```
1. Base image: node:20-slim
2. Set working directory: /app
3. Copy from monorepo root:
      pnpm-workspace.yaml
      package.json
      tsconfig.base.json
      pnpm-lock.yaml (if present)
      libs/           ← shared libraries
      apps/<service>/ ← this service's source
4. Run: pnpm install --no-frozen-lockfile
5. Run: pnpm --filter <service> build   ← webpack bundle → dist/main.js
6. CMD: node dist/main.js
```

**Why is the build context the monorepo root?**
The Dockerfiles are built with `context: .` in `docker-compose.yml`. This means Docker sends the entire repo root to the build daemon. Without this, the `COPY libs/` step would fail because the `libs/` folder wouldn't be accessible from inside `apps/gateway/`.

**Why `--no-frozen-lockfile`?**
pnpm's strict lockfile check (`--frozen-lockfile`) is designed for CI and fails if the lockfile is out of sync with `package.json`. During active development when dependencies change frequently, `--no-frozen-lockfile` is more practical. Switch to `--frozen-lockfile` in a production CI pipeline for reproducible builds.

**The PDF service is special** — its Dockerfile also installs system Chromium dependencies and sets:

```dockerfile
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

This tells Puppeteer to use the system Chromium binary rather than its own bundled download, which is incompatible with the slim Linux container environment.

---

## Data Persistence (Volumes)

Docker volumes ensure that your data survives container restarts and `docker:down`:

```yaml
volumes:
  mongo_data:     # MongoDB data directory (/data/db)
  redis_data:     # Redis persistence files
  rabbitmq_data:  # RabbitMQ messages and definitions
```

To **wipe all data** and start fresh:

```bash
docker compose --profile apps down -v
```

---

## Startup Order (`depends_on`)

Docker Compose respects service dependencies. App containers won't start until their dependencies are up:

```
mongodb ──┐
redis   ──┼──► gateway
rabbitmq──┘
          └──► resume-service
          └──► rabbitmq ──► pdf-service ──► resume-service
```

`depends_on` ensures Docker starts containers in the right order, though it only waits for the container to **start** — not for the service inside to be fully ready. If an app tries to connect to MongoDB before it has finished its initialisation, it may fail and need to be restarted. The `restart: unless-stopped` policy handles this automatically.

---

## Recommended Workflows

### Local Development (most common)

```bash
# 1. Start infrastructure
pnpm docker:up

# 2. Start all apps with hot-reload
pnpm dev

# 3. Open the app
open http://localhost:5173
```

### Full Docker Deployment (testing prod-like)

```bash
# Build images and start everything
pnpm docker:up:all

# Open the app (no Vite — connect directly to gateway)
open http://localhost:3000/api/health
```

### Teardown

```bash
# Stop everything (keep data)
pnpm docker:down

# Stop everything AND wipe data
docker compose --profile apps down -v
```

### Checking What's Running

```bash
docker compose ps
```

### Restarting a Single Container

```bash
docker compose restart gateway
docker compose restart resume-service
docker compose restart pdf-service
```

### Rebuilding a Single Service After Code Changes

```bash
docker compose --profile apps up -d --build gateway
```

---

## Troubleshooting

**Port already in use (`EADDRINUSE`)**

You have both `pnpm dev` and `docker:up:all` running at the same time, or a previous container didn't stop cleanly.

```bash
# Find and kill the process on a port (e.g. 3000)
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

Or just stop all containers:

```bash
pnpm docker:down
```

**MongoDB auth failed**

Your `.env` is using port `27017` instead of `27018`. Update it:

```env
MONGODB_URI=mongodb://root:secret@localhost:27018/resume_platform?authSource=admin
```

**Container exits immediately after starting**

Check the logs:

```bash
docker compose logs resume-service
docker compose logs pdf-service
docker compose logs gateway
```

**RabbitMQ admin UI**

Visit `http://localhost:15672` — login with `admin` / `secret`.
