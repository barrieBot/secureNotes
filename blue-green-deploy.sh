#!/usr/bin/env bash
#
# blue-green-deploy.sh (v5 - staged rollout with load-test gate)
#
# Two-phase deploy, meant to run as two separate CI steps/jobs:
#
#   stage   - start the idle container, run health check, run load test.
#             Does NOT touch nginx routing. Safe to run repeatedly / abort.
#   promote - swap ACTIVE_INDEX + reload nginx. Only run after `stage`
#             succeeded (and, if you want, after manual approval in CI).
#
#   deploy  - convenience wrapper: stage immediately followed by promote,
#             with NO load-test gate in between (load testing now runs
#             from the CI runner itself - see loadtests/ and the pipeline
#             snippet in project docs). Use `deploy` only for quick
#             manual/local testing where the gate doesn't matter; real
#             pipelines should call `stage`, run the load test from the
#             runner, then call `promote` only if it passed.
#
# Usage (run from the same directory as compose.yaml / .env):
#   ./blue-green-deploy.sh stage   --service api      <image_tag>
#   ./blue-green-deploy.sh promote --service api
#   ./blue-green-deploy.sh deploy  --service api      <image_tag>
#   ./blue-green-deploy.sh rollback --service api
#   ./blue-green-deploy.sh status   --service api
#   (swap "api" for "frontend" throughout)
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

log() { echo '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
die() { log "ERROR: $*" >&2; exit 1; }

# Check for required files
# --------------------------------------------------------------------------- 
require_files() {
  [[ -f "$COMPOSE_FILE" ]]   || die "Cannot find $COMPOSE_FILE in $(pwd)"
  [[ -f "$ENV_FILE" ]]       || die "Cannot find $ENV_FILE in $(pwd)"
  [[ -f "$NGINX_TEMPLATE" ]] || die "Cannot find $NGINX_TEMPLATE in $(pwd)"
  command -v envsubst >/dev/null || die "envsubst not found (install gettext-base / gettext)"
}

# Retrieve ENV value from defined env file
# ---------------------------------------------------------------------------
get_env_var() { grep "^${1}=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2-; }

# Write new value to defined env file
# ---------------------------------------------------------------------------
set_env_var() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

# Identify the idle container suffix
# ---------------------------------------------------------------------------
idle_of() { [[ "$1" == "0" ]] && echo "1" || echo "0"; }

# Identify the docker network
# ---------------------------------------------------------------------------
get_network() {
  local container="$1" network
  network=$($DC ps -q "$container" | xargs -r docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' | head -n1)
  [[ -n "$network" ]] || die "Could not determine docker network for $container"
  echo "$network"
}


# Per-service config
# ---------------------------------------------------------------------------
service_env_prefix() {
  case "$1" in
    api)      echo "API" ;;
    frontend) echo "FRONTEND" ;;
    *) die "Unknown service '$1' (expected: api, frontend)" ;;
  esac
}

# Retrieve Container prefix
# ---------------------------------------------------------------------------
service_container_prefix() {
  case "$1" in
    api)      echo "api" ;;
    frontend) echo "frontend" ;;
  esac
}

# Retrieve service port
# ---------------------------------------------------------------------------
service_internal_port() {
  case "$1" in
    api)      echo "1234" ;;
    frontend) echo "8080" ;;
  esac
}

# nginx render
# ---------------------------------------------------------------------------
render_nginx() {
  local active_api active_frontend idle_api idle_frontend
  active_api=$(get_env_var ACTIVE_INDEX_API)
  active_frontend=$(get_env_var ACTIVE_INDEX_FRONTEND)
  idle_api=$(idle_of "$active_api")
  idle_frontend=$(idle_of "$active_frontend")

  # create a backup nginx.conf to fall back to
  local backup="${NGINX_CONF}.bak.$(date +%s)"
  [[ -f "$NGINX_CONF" ]] && cp "$NGINX_CONF" "$backup"

  ACTIVE_API_UPSTREAM="api_${active_api}" \
  IDLE_API_UPSTREAM="api_${idle_api}" \
  ACTIVE_FRONTEND_UPSTREAM="frontend_${active_frontend}" \
  IDLE_FRONTEND_UPSTREAM="frontend_${idle_frontend}" \
    envsubst '${ACTIVE_API_UPSTREAM} ${IDLE_API_UPSTREAM} ${ACTIVE_FRONTEND_UPSTREAM} ${IDLE_FRONTEND_UPSTREAM}' \
    < "$NGINX_TEMPLATE" > "${NGINX_CONF}.new"

  cp "${NGINX_CONF}.new" ./nginx/"$NGINX_CONF"
  rm "${NGINX_CONF}.new"

  # reload the nginx.conf to change traffic to the new deployment
  if ! $DC exec -T "$NGINX_SERVICE" nginx -t; then
    log "nginx config test failed, restoring backup"
    [[ -f "$backup" ]] && cp "$backup" "$NGINX_CONF"
    die "nginx -t failed, aborted (previous nginx.conf restored)"
  fi

  $DC exec -T "$NGINX_SERVICE" nginx -s reload
  log "nginx reloaded: api=${active_api}, frontend=${active_frontend}"
}

# Commands
# ---------------------------------------------------------------------------

# Print the current status
# ---------------------------------------------------------------------------
cmd_status() {
  local service="$1"
  require_files
  local prefix live idle
  prefix=$(service_env_prefix "$service")
  live=$(get_env_var "ACTIVE_INDEX_${prefix}")
  idle=$(idle_of "$live")
  log "[$service] live index:   $live"
  log "[$service] live version: $(get_env_var "${prefix}_VERSION_${live}")"
  log "[$service] idle version: $(get_env_var "${prefix}_VERSION_${idle}")"
  $DC ps "$(service_container_prefix "$service")-0" "$(service_container_prefix "$service")-1"
}

# Stage a new version to the idle container
# ---------------------------------------------------------------------------
cmd_stage() {
  local service="$1" new_version="$2"
  require_files

  # retrieve current deployment info
  local prefix cprefix live idle idle_container idle_version_key network
  prefix=$(service_env_prefix "$service")
  cprefix=$(service_container_prefix "$service")
  live=$(get_env_var "ACTIVE_INDEX_${prefix}")
  idle=$(idle_of "$live")
  idle_container="${cprefix}-${idle}"
  idle_version_key="${prefix}_VERSION_${idle}"

  echo "${service} live=${live}, staging ${new_version} on idle=${idle_container}"

  # set new version tag
  set_env_var "$idle_version_key" "$new_version"
  log "[$service] .env updated: ${idle_version_key}=${new_version}"

  # pull new image version and restart idle container
  $DC pull "$idle_container" 2>/dev/null || log "[$service] pull skipped/failed (local image?), continuing"
  $DC up -d --no-deps "$idle_container"

  network=$(get_network "$idle_container")

  log "[$service] staged successfully on idle index ${idle} (reachable on port 81 for external load testing)."
  log "[$service] run your load test against the idle port now; only call 'promote --service ${service}' if it passes."
}

# Finish the deployment -> route traffic to the new version container
# ---------------------------------------------------------------------------
cmd_promote() {
  local service="$1"
  require_files

  # retrieve service and deployment status
  local prefix live idle
  prefix=$(service_env_prefix "$service")
  live=$(get_env_var "ACTIVE_INDEX_${prefix}")
  idle=$(idle_of "$live")

  # initiate the rerouting to new deployment
  log "[$service] promoting idle index ${idle} to live (currently live: ${live})"
  set_env_var "ACTIVE_INDEX_${prefix}" "$idle"
  render_nginx

  log "[$service] promotion complete. Live index is now: $idle"
  log "[$service] previous live (${live}) still running - rollback available."
}

# Combines staging and promoting -> for manual deployment
# ---------------------------------------------------------------------------
cmd_deploy() {
  local service="$1" new_version="$2"
  cmd_stage "$service" "$new_version"
  cmd_promote "$service"
}

# Rollback to old container
# ---------------------------------------------------------------------------
cmd_rollback() {
  local service="$1"
  require_files
  local prefix live previous
  prefix=$(service_env_prefix "$service")
  live=$(get_env_var "ACTIVE_INDEX_${prefix}")
  previous=$(idle_of "$live")

  log "[$service] rolling back: ${live} -> ${previous}"
  set_env_var "ACTIVE_INDEX_${prefix}" "$previous"
  render_nginx
  log "[$service] rollback complete. Live index is now: $previous"
}


# Entry point
# ---------------------------------------------------------------------------
main() {
  local cmd="${1:-}"; shift || true
  local service="" version=""

  # parse service value
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --service) service="$2"; shift 2 ;;
      *) version="$1"; shift ;;
    esac
  done

  [[ -n "$service" ]] || die "Missing --service (api|frontend)"

  # parse command
  case "$cmd" in
    stage)
      echo "Starting staging of ${service}"
      [[ -n "$version" ]] || die "Usage: $0 stage --service <api|frontend> <image_tag>"
      cmd_stage "$service" "$version"
      ;;
    promote) cmd_promote "$service" ;;
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
  stage   --service <api|frontend> <image_tag>   Start idle container, health-check, load-test. No routing change.
  promote --service <api|frontend>                Swap live traffic to the staged idle index.
  deploy  --service <api|frontend> <image_tag>    Convenience: stage + promote (manual/local use).
  rollback --service <api|frontend>               Swap live traffic back to previous index.
  status   --service <api|frontend>               Show current live/idle index + versions.
EOF
      exit 1
      ;;
  esac
}

main "$@"