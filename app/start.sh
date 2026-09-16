#!/bin/sh
# Production entry point, started by pm2 (see .github/webhooks/ecosystem.config.js).
#
# The Nitro bundle in .output is standalone — it does not read node_modules — so
# all this has to do is put .env into the environment and hand over. `exec` keeps
# the pid, which is what pm2 watches.
set -a
[ -f .env ] && . .env
set +a
exec node .output/server/index.mjs
