# Docker quick start (fork)

Run this fork's n8n in Docker with a single command. TLS and reverse-proxying are handled automatically (`nginx-proxy` + `acme-companion`, Let's Encrypt) — you only need the **public webhook URL** (where n8n is reachable from the internet) and a contact email for certificate notices.

## Prerequisites

- [Node.js](https://nodejs.org/) 24.x
- [pnpm](https://pnpm.io/) >= 10.22
- [Docker](https://docs.docker.com/get-docker/) (Docker Compose v2)

## One command

From the repository root:

```bash
pnpm docker:up https://n8n.yourdomain.com --email you@example.com
```

What this does:

1. Writes `.env` (repo root) from your webhook URL (protocol, host, editor URL, fork license/owner defaults)
2. Builds `n8nio/n8n:local` **only if the image is missing** (first run can take 20–40+ minutes)
3. Starts n8n, plus `nginx-proxy` + `acme-companion`, **detached**, with restart policy `unless-stopped`

`nginx-proxy` + `acme-companion` read the domain straight off `N8N_HOST` (derived
from the URL you pass) and automatically request/renew a Let's Encrypt
certificate for it — no nginx config files to hand-edit per domain. This
requires:

- DNS for that domain already pointing at this host's public IP
- Ports `80` and `443` reachable from the internet (used for the ACME
  HTTP-01 challenge and for serving HTTPS)

`--email` sets the contact address Let's Encrypt uses for expiry/security
notices. If omitted, it defaults to `admin@<host>` (a warning is printed).

Alternative:

```bash
WEBHOOK_URL=https://n8n.yourdomain.com LETSENCRYPT_EMAIL=you@example.com pnpm docker:up
```

Force a rebuild:

```bash
pnpm docker:up https://n8n.yourdomain.com --email you@example.com --build
```

**Note:** the build step itself can take 20–40+ minutes on first run and is a
plain foreground process — if you're doing this over SSH, run it inside
`tmux`/`screen`, or with `nohup pnpm docker:up ... > docker-up.log 2>&1 & disown`,
so a dropped connection doesn't kill the build partway through.

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

Once the image is built and `.env` exists at the repo root (both handled by
`docker:up` on first run), you can skip the wrapper entirely and use plain
Compose directly from the repository root:

```bash
docker compose up -d      # start (reads ./.env automatically)
docker compose down       # stop
docker compose logs -f    # follow logs
```

## Production notes

- The reverse proxy (`nginx-proxy` + `acme-companion`) and TLS are already handled — no manual nginx config needed. Just make sure ports `80`/`443` are open and DNS resolves before you run `docker:up`.
- Set `WEBHOOK_URL` to the **public HTTPS URL** users and integrations will call (e.g. `https://n8n.yourdomain.com`).
- Back up the `n8n_data`, `certs`, and `acme` Docker volumes — `n8n_data` holds workflows/credentials/encryption key, `certs`/`acme` hold your issued Let's Encrypt certificate and account state (losing them just means re-issuing on next boot, not data loss).
- Enterprise features are enabled via `N8N_LICENSE_UNLOCK_ALL=true` in the generated `.env` (repo root).
- Let's Encrypt enforces rate limits per domain (a handful of certificate issuances per week) — avoid tearing down and recreating the `acme` volume repeatedly for the same domain.

## Files

| File | Purpose |
|------|---------|
| [`../docker-compose.yml`](../docker-compose.yml) | Detached service definition (repo root, so plain `docker compose` commands work with no `-f` flag) |
| [`../.env.example`](../.env.example) | Documented env vars (generated into repo-root `.env` by `docker:up`) |
| [`../scripts/docker-up.mjs`](../scripts/docker-up.mjs) | Build-if-missing + compose orchestrator |
