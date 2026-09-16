#!/bin/sh

# Abort on the first failing step. Without this a failed build falls through to
# the pm2 restart, which tears down the running instance and brings it back up
# on a stale (or missing) .output — a broken deploy that reports success.
set -e

# Find current directory & configure paths
SCRIPT_PATH=$(realpath $0)
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$SCRIPT_DIR/../..

TAG=$1

cd $PROJECT_ROOT

if [ -n "$TAG" ]; then
  git fetch --tags
  git checkout "$TAG"
else
  git checkout master
  git pull
fi

APP_ROOT=$PROJECT_ROOT/app
APP_SERVICE=$PROJECT_ROOT/.github/webhooks/ecosystem.config.js

cd $APP_ROOT

### Config
export TZ=UTC

### Install & build (the previous version keeps serving during the build).
### Full install, no --omit=dev: `nuxt build` is a dev-time step and loads every
### module listed in nuxt.config, two of which (@nuxt/eslint, @nuxt/test-utils)
### are devDependencies. Nothing is saved by omitting them either — the runtime
### never touches node_modules, start.sh runs the standalone Nitro bundle in
### .output, which has its dependencies inlined.
npm ci
npm run build

### A failed build must never reach the restart below. `set -e` covers a non-zero
### exit; this also catches a build that dies without one.
[ -f .output/server/index.mjs ] || { echo "[deploy] build produced no .output -- aborting, previous version stays live"; exit 1; }

### Restart the service. stop/delete fail when the app is not registered yet
### (first deploy on a host), which is not an error — only the start has to work.
pm2 stop $APP_SERVICE || true
pm2 delete $APP_SERVICE || true
pm2 start $APP_SERVICE
