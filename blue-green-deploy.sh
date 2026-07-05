#!/usr/bin/env bash
#
# blue-green-deploy.sh (v3 - independent api / frontend pipelines)
#
# Usage (run from the same directory as compose.yaml / .env):
#   ./blue-green-deploy.sh deploy   --service api      <image_tag>
#   ./blue-green-deploy.sh deploy   --service frontend <image_tag>
#   ./blue-green-deploy.sh rollback --service api
#   ./blue-green-deploy.sh rollback --service frontend
#   ./blue-green-deploy.sh status   --service api
#   ./blue-green-deploy.sh status   --service frontend
#
set -euo pipefail

COMPOSE_FILE="compose.yaml"
ENV_FILE=".env"
NGINX_TEMPLATE="nginx.conf.template"
NGINX_CONF="nginx.conf"
NGINX_SERVICE="nginx"
HEALTH_RETRIES=15
HEALTH_INTERVAL=2
DC="docker compose -f ${COMPOSE_FILE}"

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

require_files() {
  [[ -f "$COMPOSE_FILE" ]]   || die "Cannot find $COMPOSE_FILE in $(pwd)"
  [[ -f "$ENV_FILE" ]]       || die "Cannot find $ENV_FILE in $(pwd)"
  [[ -f "$NGINX_TEMPLATE" ]] || die "Cannot find $NGINX_TEMPLATE in $(pwd)"
  command -v envsubst >/dev/null || die "envsubst not found (install gettext-base / gettext)"
}

get_env_var() { grep "^${1}=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2-; }

set_env_var() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

idle_of() { [[ "$1" == "blue" ]] && echo "green" || echo "blue"; }

# ---------------------------------------------------------------------------
# Per-service config. Add new services here if you ever split out more.
# ---------------------------------------------------------------------------
service_env_prefix() {   # .env key prefix, e.g. API / FRONTEND
  case "$1" in
    api)      echo "API" ;;
    frontend) echo "FRONTEND" ;;
    *) die "Unknown service '$1' (expected: api, frontend)" ;;
  esac
}

service_container_prefix() {  # compose service name prefix, e.g. api_blue
  case "$1" in
    api)      echo "api" ;;
    frontend) echo "frontend" ;;
  esac
}

service_internal_port() {
  case "$1" in
    api)      echo "1234" ;;
    frontend) echo "8080" ;;
  esac
}

# How to verify the new container is actually serving good traffic.
service_health_check() {
  local service="$1" container="$2" network="$3"
  local port; port=$(service_internal_port "$service")

  case "$service" in
    api)
      docker run --rm --network "$network" curlimages/curl:latest \
        -sf -o /dev/null -m 3 "http://${container}:${port}/"
      ;;
    frontend)
      # Requires the build to emit a small version.json - stronger signal
      # than a bare 200, since a broken build can still return 200 on /.
      docker run --rm --network "$network" curlimages/curl:latest \
        -sf -m 3 "http://${container}:${port}/version.json" | grep -q '"version"'
      ;;
  esac
}

# ---------------------------------------------------------------------------
# nginx render - always reflects BOTH active colors, only one changes per call
# ---------------------------------------------------------------------------
render_nginx() {
  local active_api active_frontend idle_api idle_frontend
  active_api=$(get_env_var ACTIVE_COLOR_API)
  active_frontend=$(get_env_var ACTIVE_COLOR_FRONTEND)
  idle_api=$(idle_of "$active_api")
  idle_frontend=$(idle_of "$active_frontend")

  local backup="${NGINX_CONF}.bak.$(date +%s)"
  [[ -f "$NGINX_CONF" ]] && cp "$NGINX_CONF" "$backup"

  ACTIVE_API_UPSTREAM="api_${active_api}" \
  IDLE_API_UPSTREAM="api_${idle_api}" \
  ACTIVE_FRONTEND_UPSTREAM="frontend_${active_frontend}" \
  IDLE_FRONTEND_UPSTREAM="frontend_${idle_frontend}" \
    envsubst '${ACTIVE_API_UPSTREAM} ${IDLE_API_UPSTREAM} ${ACTIVE_FRONTEND_UPSTREAM} ${IDLE_FRONTEND_UPSTREAM}' \
    < "$NGINX_TEMPLATE" > "${NGINX_CONF}.new"

  mv "${NGINX_CONF}.new" "$NGINX_CONF"   # bind-mounted, container sees it immediately

  if ! $DC exec -T "$NGINX_SERVICE" nginx -t; then
    log "nginx config test failed, restoring backup"
    [[ -f "$backup" ]] && cp "$backup" "$NGINX_CONF"
    die "nginx -t failed, aborted (previous nginx.conf restored)"
  fi

  $DC exec -T "$NGINX_SERVICE" nginx -s reload
  log "nginx reloaded: api=${active_api}, frontend=${active_frontend}"
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
cmd_status() {
  local service="$1"
  require_files
  local prefix live idle
  prefix=$(service_env_prefix "$service")
  live=$(get_env_var "ACTIVE_COLOR_${prefix}")
  idle=$(idle_of "$live")
  log "[$service] live color:    $live"
  log "[$service] live version:  $(get_env_var "${prefix}_$(echo "$live" | tr '[:lower:]' '[:upper:]')_VERSION")"
  log "[$service] idle version:  $(get_env_var "${prefix}_$(echo "$idle" | tr '[:lower:]' '[:upper:]')_VERSION")"
  $DC ps "$(service_container_prefix "$service")_blue" "$(service_container_prefix "$service")_green"
}

cmd_deploy() {
  local service="$1" new_version="$2"
  require_files

  local prefix cprefix live idle idle_container idle_version_key network
  prefix=$(service_env_prefix "$service")
  cprefix=$(service_container_prefix "$service")
  live=$(get_env_var "ACTIVE_COLOR_${prefix}")
  idle=$(idle_of "$live")
  idle_container="${cprefix}_${idle}"
  idle_version_key="${prefix}_$(echo "$idle" | tr '[:lower:]' '[:upper:]')_VERSION"

  log "[$service] live=$live, deploying ${new_version} to idle=${idle_container}"

  if [[ "$service" == "api" ]]; then
    log "[$service] running migrations..."
    $DC run --rm migrations
  fi

  set_env_var "$idle_version_key" "$new_version"
  log "[$service] .env updated: ${idle_version_key}=${new_version}"

  $DC pull "$idle_container" 2>/dev/null || log "[$service] pull skipped/failed (local image?), continuing"
  $DC up -d --no-deps "$idle_container"

  network=$($DC ps -q "$idle_container" | xargs -r docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' | head -n1)
  [[ -n "$network" ]] || die "Could not determine docker network for $idle_container"

  log "[$service] health-checking ${idle_container}..."
  local attempt=1
  until service_health_check "$service" "$idle_container" "$network"; do
    if (( attempt >= HEALTH_RETRIES )); then
      die "[$service] health check FAILED for $idle_container - not cutting over (still idle, safe to debug)"
    fi
    log "[$service] attempt $attempt/$HEALTH_RETRIES failed, retrying in ${HEALTH_INTERVAL}s..."
    sleep "$HEALTH_INTERVAL"
    ((attempt++))
  done
  log "[$service] health check passed for $idle_container"

  set_env_var "ACTIVE_COLOR_${prefix}" "$idle"
  render_nginx

  log "[$service] deployment complete. Live color is now: $idle"
  log "[$service] previous live ($live) still running - rollback available."
}

cmd_rollback() {
  local service="$1"
  require_files
  local prefix live previous
  prefix=$(service_env_prefix "$service")
  live=$(get_env_var "ACTIVE_COLOR_${prefix}")
  previous=$(idle_of "$live")

  log "[$service] rolling back: $live -> $previous"
  set_env_var "ACTIVE_COLOR_${prefix}" "$previous"
  render_nginx
  log "[$service] rollback complete. Live color is now: $previous"
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
main() {
  local cmd="${1:-}"; shift || true
  local service="" version=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --service) service="$2"; shift 2 ;;
      *) version="$1"; shift ;;
    esac
  done

  [[ -n "$service" ]] || die "Missing --service (api|frontend)"

  case "$cmd" in
    deploy)
      [[ -n "$version" ]] || die "Usage: $0 deploy --service <api|frontend> <image_tag>"
      cmd_deploy "$service" "$version"
      ;;
    rollback) cmd_rollback "$service" ;;
    status)   cmd_status "$service" ;;
    *)
      cat <<EOF
Usage: $0 <command> --service <api|frontend> [image_tag]

Commands:
  deploy --service <api|frontend> <image_tag>   Deploy new version to idle color, health-check, cut over.
  rollback --service <api|frontend>             Swap live traffic back to previous color.
  status --service <api|frontend>               Show current live/idle color + versions.
EOF
      exit 1
      ;;
  esac
}

main "$@"
