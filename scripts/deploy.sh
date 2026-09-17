#!/usr/bin/env bash
# Deploy a CI-built n8n image on the production server.
#
# Does NOT build anything — pulls a pre-built image from GHCR (built by the
# "Build and push Docker image" GitHub Actions workflow) and restarts only
# the n8n service. nginx-proxy/acme-companion and all volumes/networks are
# left untouched.
#
# Usage:
#   scripts/deploy.sh <image-ref>
#   scripts/deploy.sh ghcr.io/<owner>/<repo>:<git-sha>
#
# One-time prerequisite (not done by this script): authenticate Docker to
# the private GHCR package once, on this machine:
#   echo "<fine-grained PAT, read:packages only>" | docker login ghcr.io -u <github-username> --password-stdin

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker/docker-compose.yml"
ENV_FILE="$ROOT_DIR/docker/.env"
HEALTH_URL="http://localhost:5678/healthz/readiness"
HEALTH_RETRIES=30
HEALTH_INTERVAL_SECONDS=2

if [[ $# -ne 1 ]]; then
	echo "Usage: $0 <image-ref>" >&2
	echo "Example: $0 ghcr.io/ur-code-buddy/n8n-pro:$(git -C "$ROOT_DIR" rev-parse HEAD 2>/dev/null || echo '<git-sha>')" >&2
	exit 1
fi

IMAGE_REF="$1"

if [[ ! -f "$ENV_FILE" ]]; then
	echo "Error: $ENV_FILE not found." >&2
	echo "This looks like a fresh server. Run scripts/bootstrap-production.sh first (see docker/README.md)." >&2
	echo "Do NOT run 'pnpm docker:up' or 'pnpm build:docker' here — both build the image locally," >&2
	echo "which this server does not have the memory for. Images come from GHCR only." >&2
	exit 1
fi

echo "INFO: Deploying image: $IMAGE_REF"

if grep -q '^N8N_IMAGE=' "$ENV_FILE"; then
	sed -i.bak "s|^N8N_IMAGE=.*|N8N_IMAGE=$IMAGE_REF|" "$ENV_FILE"
	rm -f "$ENV_FILE.bak"
else
	printf '\nN8N_IMAGE=%s\n' "$IMAGE_REF" >>"$ENV_FILE"
fi

echo "INFO: Pulling $IMAGE_REF..."
docker compose -f "$COMPOSE_FILE" pull n8n

echo "INFO: Restarting n8n service only (nginx-proxy/acme-companion untouched)..."
docker compose -f "$COMPOSE_FILE" up -d n8n

echo "INFO: Waiting for n8n to become ready at $HEALTH_URL..."
for ((i = 1; i <= HEALTH_RETRIES; i++)); do
	if curl -fsS -o /dev/null "$HEALTH_URL"; then
		echo "OK: n8n is ready (attempt $i/$HEALTH_RETRIES)."
		exit 0
	fi
	sleep "$HEALTH_INTERVAL_SECONDS"
done

echo "ERROR: n8n did not become ready after $((HEALTH_RETRIES * HEALTH_INTERVAL_SECONDS))s. Check logs:" >&2
echo "  docker compose -f $COMPOSE_FILE logs --tail=100 n8n" >&2
exit 1
