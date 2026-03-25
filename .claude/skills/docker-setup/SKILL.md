---
description: "Manage Docker configuration for local development and production builds. Covers Docker Compose services (PostgreSQL, Redis), Dockerfiles for Node.js backend and React frontend, and common container operations."
triggers:
  - "docker"
  - "docker compose"
  - "set up database"
  - "local dev setup"
  - "add service to docker"
  - "containerize"
---

# Docker Setup Skill — Qwertees WhatsApp Automation

## Project Context

- Monorepo: `server/` (Node.js + Express + TypeScript) and `client/` (React + Vite + TypeScript)
- PostgreSQL is the primary database (Prisma ORM)
- Redis may be added later for BullMQ job queues
- `docker-compose.yml` lives at the project root
- Environment variables come from `.env` at the project root

---

## 1. Docker Compose — Local Development

Place this at the project root as `docker-compose.yml`. Adjust credentials to match the project's `.env` file.

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: qwertees-postgres
    restart: unless-stopped
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-qwertees}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-qwertees_dev}
      POSTGRES_DB: ${POSTGRES_DB:-qwertees_whatsapp}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-qwertees} -d ${POSTGRES_DB:-qwertees_whatsapp}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  pgdata:
    driver: local
```

The corresponding `DATABASE_URL` in `.env` should be:

```
DATABASE_URL=postgresql://qwertees:qwertees_dev@localhost:5432/qwertees_whatsapp
```

---

## 2. Adding New Services

### Redis (for BullMQ)

Append under `services:` in `docker-compose.yml`:

```yaml
  redis:
    image: redis:7-alpine
    container_name: qwertees-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: redis-server --appendonly yes
```

Add `redisdata` to the top-level `volumes:` block:

```yaml
volumes:
  pgdata:
    driver: local
  redisdata:
    driver: local
```

### General Pattern for New Services

1. Add the service block under `services:` with `image`, `container_name`, `ports`, `volumes`, and `healthcheck`.
2. Add a named volume under the top-level `volumes:` key if the service persists data.
3. Use environment variable substitution (`${VAR:-default}`) for ports and credentials.
4. If another service depends on it, add a `depends_on` block with a `condition: service_healthy` entry.

Example dependency declaration:

```yaml
  server:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

---

## 3. Dockerfile — Node.js Backend (Multi-Stage)

Place at `server/Dockerfile`.

```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/

USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

Key points:
- Run `npx prisma generate` in the build stage so the Prisma client is available.
- Copy the generated `.prisma` directory into the production stage.
- Use a non-root user (`appuser`) in the production stage.
- `npm ci --omit=dev` keeps the production image lean.

---

## 4. Dockerfile — React/Vite Frontend (Build + Nginx)

Place at `client/Dockerfile`.

```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve Stage ----
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA fallback: serve index.html for all routes
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Place a minimal `client/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://server:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. Full Compose with App Services (Production-Like)

Extend the base compose file to include the app containers:

```yaml
version: "3.9"

services:
  postgres:
    # ... (same as Section 1)

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: qwertees-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: qwertees-client
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  pgdata:
    driver: local
```

For local development, typically only run `postgres` (and optionally `redis`) via Docker and run `server` and `client` natively with `npm run dev`.

---

## 6. .dockerignore Template

Place a `.dockerignore` in both `server/` and `client/`:

```
node_modules
dist
.env
.env.*
*.log
.git
.gitignore
.vscode
.idea
*.md
Dockerfile
docker-compose*.yml
.dockerignore
coverage
.turbo
```

Key rules:
- Always exclude `node_modules` — the container installs its own.
- Always exclude `.env` files — pass env vars via `env_file` or `environment` in compose.
- Exclude build output (`dist`) — the container builds its own.

---

## 7. Common Commands Reference

```bash
# Start services (detached)
docker compose up -d

# Start only specific services
docker compose up -d postgres redis

# Stop all services (preserves volumes)
docker compose down

# Stop and remove volumes (DESTROYS DATA)
docker compose down -v

# View logs (follow mode)
docker compose logs -f postgres

# View logs for all services
docker compose logs -f

# Open psql shell inside the running PostgreSQL container
docker compose exec postgres psql -U qwertees -d qwertees_whatsapp

# Open a shell inside a container
docker compose exec postgres sh

# Rebuild images after Dockerfile changes
docker compose build --no-cache

# Restart a single service
docker compose restart postgres

# Check service status
docker compose ps

# Prune unused images, containers, networks
docker system prune -f

# Prune unused volumes (careful — removes data)
docker volume prune -f
```

---

## 8. Gotchas and Troubleshooting

### Volume Persistence
- Named volumes (`pgdata`) persist across `docker compose down`. Data is only lost with `docker compose down -v` or `docker volume rm`.
- Never use bind mounts for database data on macOS — performance is poor. Use named volumes.

### Port Conflicts
- If port 5432 is already in use (local PostgreSQL install), change the host port: `"5433:5432"` and update `DATABASE_URL` accordingly.
- Same applies to Redis (6379) and any other service.

### Environment Variables in Containers
- For local dev, use `env_file: .env` in compose to load the project `.env`.
- Inside a container, `localhost` refers to the container itself, not the host machine. Use the service name (`postgres`, `redis`) as the hostname when services communicate within Docker.
- When running the app natively (not in Docker) but the database in Docker, use `localhost` in `DATABASE_URL`.

### Prisma and Docker
- Run `npx prisma migrate deploy` (not `dev`) in production/CI containers.
- Run `npx prisma generate` as part of the Docker build so the client is baked into the image.
- If the schema changes, rebuild the server image: `docker compose build server`.

### macOS-Specific
- Docker Desktop for Mac uses a Linux VM. File system mounts (`volumes` with host paths) are slower than native. Use named volumes for databases.
- Ensure Docker Desktop has enough memory allocated (at least 4 GB) if running multiple services.

### Networking
- All services in the same compose file share a default network. Use service names as hostnames.
- To expose a service only to other containers (not the host), omit the `ports` mapping and use `expose` instead.

### Healthchecks
- Always define healthchecks for database services. Use `depends_on` with `condition: service_healthy` so the app does not start before the database is ready.
- Without healthchecks, `depends_on` only waits for the container to start, not for the service inside to be ready.
