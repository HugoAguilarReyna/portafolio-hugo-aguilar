#!/usr/bin/env bash
set -euo pipefail
raiz=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$raiz"
archivos=(-f portafolio-hugo-aguilar/deploy/docker-compose.yml)
if [[ -f config-local/gaza-memoria.yml ]]; then
  archivos+=(-f config-local/gaza-memoria.yml)
fi
archivos+=(-f portafolio-hugo-aguilar/deploy/docker-compose.m5.yml)
exec docker compose -p portafolio "${archivos[@]}" \
  --env-file portafolio-hugo-aguilar/deploy/.env "$@"
