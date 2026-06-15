# Docker quick start (fork)

Run this fork's n8n in Docker with a single command. You only need the **public webhook URL** (where n8n is reachable from the internet, typically via a reverse proxy with TLS).

## Prerequisites

- [Node.js](https://nodejs.org/) 24.x
- [pnpm](https://pnpm.io/) >= 10.22
- [Docker](https://docs.docker.com/get-docker/) (Docker Compose v2)

## One command

From the repository root:

```bash
pnpm docker:up https://n8n.yourdomain.com
```

What this does:

1. Writes `docker/.env` from your webhook URL (protocol, host, editor URL, fork license/owner defaults)
2. Builds `n8nio/n8n:local` **only if the image is missing** (first run can take 20–40+ minutes)
3. Starts n8n **detached** on port `5678` with restart policy `unless-stopped`

Alternative:

```bash
WEBHOOK_URL=https://n8n.yourdomain.com pnpm docker:up
```

Force a rebuild:

```bash
pnpm docker:up https://n8n.yourdomain.com --build
```

## Default login (first boot only)

On the first start with an empty `n8n_data` volume, a default instance owner is created:

| Field    | Value                 |
|----------|-----------------------|
| Email    | `baivab@admin.local`  |
| Password | `admin@ccess4321`     |

Change this password after first login on any internet-facing deployment.

## Useful commands

```bash
pnpm docker:logs    # follow container logs
pnpm docker:down    # stop container (data volume is kept)
pnpm build:docker   # build image only, without starting
```

## Production notes

- Put a reverse proxy (nginx, Caddy, Traefik, etc.) in front of port `5678` and terminate TLS there.
- Set `WEBHOOK_URL` to the **public HTTPS URL** users and integrations will call (e.g. `https://n8n.yourdomain.com`).
- Back up the `n8n_data` Docker volume — it holds workflows, credentials, and the encryption key.
- Enterprise features are enabled via `N8N_LICENSE_UNLOCK_ALL=true` in the generated `docker/.env`.

## Files

| File | Purpose |
|------|---------|
| [`docker-compose.yml`](docker-compose.yml) | Detached service definition |
| [`.env.example`](.env.example) | Documented env vars (generated into `.env` by `docker:up`) |
| [`../scripts/docker-up.mjs`](../scripts/docker-up.mjs) | Build-if-missing + compose orchestrator |
