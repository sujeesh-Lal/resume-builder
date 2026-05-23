# What is Docker? — Concepts Guide

This document explains Docker from first principles — what it is, why it exists, and how the concepts (images, containers, volumes, networks, Compose) apply directly to this project. No prior Docker knowledge assumed.

---

## The Problem Docker Solves

Imagine you want to run MongoDB on your laptop for development. You could install it directly — but then:

- MongoDB runs as a background service on your machine permanently
- It occupies port 27017 forever, even when you're not working on this project
- A colleague on Windows may have a different MongoDB version and hit different bugs
- Uninstalling it cleanly later is painful
- Your CI server needs its own MongoDB installation too

Docker solves all of this. Instead of installing software directly onto your machine, you run it in an **isolated box** called a container. That box:

- Starts in seconds
- Stops cleanly with one command
- Is identical on every machine (your laptop, your colleague's, CI, production)
- Disappears completely when you're done — no residue left on your system

---

## Core Concept 1: Images

An **image** is a read-only template that describes what software to run and how to configure it. Think of it like a recipe or a blueprint.

```
Docker Image = the blueprint
Docker Container = a running instance of that blueprint
```

Images are stored on Docker Hub (Docker's public registry). When you reference `mongo:7` in a docker-compose file, Docker downloads the official MongoDB 7 image from Docker Hub the first time, then uses the cached version on subsequent runs.

```
mongo:7          ← official MongoDB 7 image (downloaded once, cached)
redis:7-alpine   ← official Redis 7 image, alpine = minimal Linux base (smaller)
rabbitmq:3-management-alpine ← RabbitMQ 3 with the web admin UI included
node:20-slim     ← Node.js 20 on a minimal Linux base (used in our Dockerfiles)
```

The tag after the colon (`:7`, `:7-alpine`, `:3-management-alpine`) specifies the version. Without a tag, Docker defaults to `:latest` — which is unpredictable, so always use explicit versions.

---

## Core Concept 2: Containers

A **container** is a running instance of an image. It is an isolated process on your machine — isolated meaning:

- It has its own filesystem (separate from your machine's files)
- It has its own network interface (its own IP address)
- It has its own process space (its processes can't see yours)
- It cannot accidentally affect other containers or your host machine

You can run multiple containers from the same image at the same time — each is independent.

```
mongo:7 image
    │
    ├─ Container A: resume-mongodb   ← running, port 27018
    └─ Container B: another-mongodb  ← could also run, different port
```

In this project, running `pnpm docker:up` starts three containers:

```
resume-mongodb   ← a container running MongoDB 7
resume-redis     ← a container running Redis 7
resume-rabbitmq  ← a container running RabbitMQ 3
```

Each container is named so you can reference it easily (`docker compose logs resume-mongodb`).

---

## Core Concept 3: Ports

Containers are isolated — their services are not automatically accessible from your machine. You have to explicitly **map** a port from inside the container to a port on your host machine.

```
Host machine                Container
    │                           │
    │   27018 ──────────► 27017 │  ← MongoDB listens on 27017 inside
    │                           │     but you connect via localhost:27018
    │   6379  ──────────► 6379  │  ← Redis (same port on both sides)
    │   5672  ──────────► 5672  │  ← RabbitMQ AMQP
    │   15672 ──────────► 15672 │  ← RabbitMQ web admin UI
```

In `docker-compose.yml` this looks like:

```yaml
mongodb:
  ports:
    - '27018:27017'   # format is  HOST_PORT:CONTAINER_PORT
```

**Why does MongoDB use 27018 on the host but 27017 inside?**
MongoDB always listens on port 27017 inside its container (that's just how it's built). On the host machine, port 27017 might already be in use if you have MongoDB installed locally. So the container's 27017 is mapped to host port 27018 — your code connects to `localhost:27018`, Docker transparently forwards that to the container's 27017.

---

## Core Concept 4: Volumes

Containers have their own filesystem — but that filesystem is **temporary**. If you stop and remove a container, all data inside it is lost.

For a database like MongoDB, that would be a disaster. You'd lose all your data every time you restart the container.

**Volumes** solve this. A volume is a persistent storage location that lives outside the container but is mounted into it. The container reads and writes data there — and that data survives even if the container is stopped, removed, or replaced with a new version.

```
Host machine (Docker-managed storage)
    │
    ├── mongo_data   ────► mounted into resume-mongodb at /data/db
    ├── redis_data   ────► mounted into resume-redis at /data
    └── rabbitmq_data───► mounted into resume-rabbitmq at /var/lib/rabbitmq
```

In `docker-compose.yml`:

```yaml
mongodb:
  volumes:
    - mongo_data:/data/db    # volume_name:path_inside_container

volumes:
  mongo_data:    # declares the volume — Docker manages where it lives on disk
```

**`docker compose down` vs `docker compose down -v`**

```
docker compose down       ← stops and removes containers, KEEPS volumes (data safe)
docker compose down -v    ← stops containers AND deletes volumes (full wipe)
```

---

## Core Concept 5: Networks

Multiple containers need to communicate with each other. By default, containers are fully isolated and can't talk to each other. You connect them by placing them on the same **network**.

In this project, all containers share a network called `resume-network`:

```yaml
networks:
  resume-network:
    driver: bridge
```

The `bridge` driver is the standard for single-host Docker setups — it creates a private internal network that all connected containers can use to reach each other.

**The key feature of Docker networks: automatic DNS.**

When containers are on the same network, they can reach each other using the **service name** as a hostname — Docker automatically resolves it to the container's internal IP.

```
Inside the Docker network:

  resume-gateway  →  connects to  →  http://resume-service:3001
  resume-service  →  connects to  →  mongodb://resume-mongodb:27017
  resume-service  →  connects to  →  redis://resume-redis:6379
```

No IP addresses needed. Docker handles the routing. This also means if a container restarts and gets a new IP, the service name still works — the DNS always points to the current container.

**From your local machine**, you don't have access to this internal network. You connect through the port mappings instead:

```
Your machine  →  localhost:27018  →  Docker port mapping  →  resume-mongodb:27017
Your machine  →  localhost:6379   →  Docker port mapping  →  resume-redis:6379
```

---

## Core Concept 6: Environment Variables

Docker containers are configured via **environment variables** — key-value pairs passed to the container at startup. This is how you tell MongoDB what username/password to set, or tell your app where to find the database.

In `docker-compose.yml`:

```yaml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: root
    MONGO_INITDB_ROOT_PASSWORD: secret
    MONGO_INITDB_DATABASE: resume_platform
```

These are read by the MongoDB container on first startup to create the root user and the initial database.

In your NestJS service `.env` files, you pass the connection details back:

```env
MONGODB_URI=mongodb://root:secret@localhost:27018/resume_platform?authSource=admin
```

The username and password must match what you configured in `docker-compose.yml`.

---

## Core Concept 7: Docker Compose

Running individual Docker commands for each container would be tedious:

```bash
docker run -d --name resume-mongodb -p 27018:27017 -e MONGO_INITDB_ROOT_USERNAME=root ... mongo:7
docker run -d --name resume-redis -p 6379:6379 redis:7-alpine
# ... and so on
```

**Docker Compose** lets you describe all your containers in a single `docker-compose.yml` file and manage them with simple commands.

```yaml
# docker-compose.yml
services:
  mongodb:
    image: mongo:7
    ports:
      - '27018:27017'
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
    volumes:
      - mongo_data:/data/db
    networks:
      - resume-network

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    networks:
      - resume-network
```

Then all you need is:

```bash
docker compose up -d    # start all services
docker compose down     # stop all services
docker compose logs -f  # see all logs
```

Compose manages the startup order (via `depends_on`), networking (all services auto-joined to the same default network), and lifecycle of every container as a group.

---

## Core Concept 8: Profiles

Sometimes you want Compose to start only a subset of services. **Profiles** let you label services and only activate them when explicitly requested.

In this project:

```yaml
# No profile = always starts with docker compose up
mongodb:
  image: mongo:7
  ...

redis:
  image: redis:7-alpine
  ...

# profile: [apps] = only starts when --profile apps is passed
gateway:
  profiles: [apps]
  build: ...

resume-service:
  profiles: [apps]
  build: ...
```

```bash
docker compose up -d                    # starts mongodb + redis + rabbitmq ONLY
docker compose --profile apps up -d     # starts EVERYTHING including app containers
```

This separation exists because during development you want:

- Infrastructure (MongoDB, Redis, RabbitMQ) in Docker — stable, no need to rebuild
- Application code (gateway, resume-service, pdf-service) running locally with hot-reload

If you started all six containers at once, your locally running `pnpm dev` servers would collide with the Docker containers on ports 3000, 3001, and 3002.

---

## Core Concept 9: Building Your Own Images (Dockerfile)

For your own application code (not a pre-made image from Docker Hub), you write a `Dockerfile` — a script of instructions for building a custom image.

Here is the pattern used by all three NestJS services in this project:

```dockerfile
# 1. Start from an official Node.js image (slim = smaller footprint)
FROM node:20-slim

# 2. Install pnpm globally
RUN npm install -g pnpm

# 3. Set the working directory inside the container
WORKDIR /app

# 4. Copy the files needed to install dependencies
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY libs/ ./libs/
COPY apps/gateway/ ./apps/gateway/

# 5. Install dependencies
RUN pnpm install --no-frozen-lockfile

# 6. Build the app (webpack compiles TypeScript → dist/main.js)
RUN pnpm --filter gateway build

# 7. The command to run when the container starts
CMD ["node", "apps/gateway/dist/main.js"]
```

**Step by step what happens when you run `pnpm docker:up:all`:**

```
1. Docker reads docker-compose.yml
2. For each service with build: instructions, Docker runs the Dockerfile
3. Dockerfile downloads node:20-slim base image (if not cached)
4. Each instruction (RUN, COPY, etc.) creates a layer
5. Layers are cached — if nothing changed, Docker reuses the cache (fast)
6. Final image is tagged and stored locally
7. Docker starts a container from that image
8. Container runs: node dist/main.js
9. NestJS app starts inside the container
10. Port mappings make it accessible on your host machine
```

---

## How It All Fits Together in This Project

Here is the full picture of what happens when you run `pnpm docker:up`:

```
pnpm docker:up
    │
    ▼
docker compose up -d
    │
    ├─ Pulls mongo:7 from Docker Hub (first time only)
    ├─ Pulls redis:7-alpine from Docker Hub (first time only)
    ├─ Pulls rabbitmq:3-management-alpine from Docker Hub (first time only)
    │
    ├─ Creates resume-network bridge network
    │
    ├─ Creates/mounts volumes:
    │      mongo_data    → container at /data/db
    │      redis_data    → container at /data
    │      rabbitmq_data → container at /var/lib/rabbitmq
    │
    ├─ Starts resume-mongodb container
    │      Image: mongo:7
    │      Port:  localhost:27018 → container:27017
    │      Env:   root/secret credentials
    │      MongoDB initialises, creates resume_platform database
    │
    ├─ Starts resume-redis container
    │      Image: redis:7-alpine
    │      Port:  localhost:6379 → container:6379
    │
    └─ Starts resume-rabbitmq container
           Image: rabbitmq:3-management-alpine
           Ports: localhost:5672 → container:5672  (AMQP)
                  localhost:15672 → container:15672 (Admin UI)
           Env:   admin/secret credentials

All three containers join resume-network
    → they can reach each other by service name
    → you can reach them via localhost on the mapped ports
```

Then you run `pnpm dev` and your NestJS apps start locally, connecting to MongoDB at `localhost:27018`, Redis at `localhost:6379`, and RabbitMQ at `localhost:5672`.

---

## Quick Reference: Key Terms

| Term | What it means |
|------|---------------|
| **Image** | A read-only blueprint for a container (like a class in OOP) |
| **Container** | A running instance of an image (like an object/instance) |
| **Volume** | Persistent storage that outlives containers |
| **Network** | Private channel for containers to talk to each other |
| **Port mapping** | `HOST:CONTAINER` — exposes a container port on your machine |
| **Docker Hub** | Public registry where official images (`mongo:7`, `redis:7`) live |
| **Compose** | Tool to define and run multi-container setups in one YAML file |
| **Profile** | Label on a Compose service; only starts when `--profile` flag is used |
| **Dockerfile** | Script of instructions for building a custom image |
| **Layer** | Each Dockerfile instruction creates a cached layer — unchanged layers are reused |
| `depends_on` | Tells Compose to start service B only after service A is running |
| `restart: unless-stopped` | Auto-restarts a container if it crashes (but not if you manually stop it) |
