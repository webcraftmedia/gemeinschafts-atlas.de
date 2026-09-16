FROM node:26-alpine AS base

# ENVs (available in production as well, can be overwritten by commandline or env file)
## DOCKER_WORKDIR would be a classical ARG, but that is not multi layer persistent - shame
ENV DOCKER_WORKDIR="/app"
## We cannot do `$(date -u +'%Y-%m-%dT%H:%M:%SZ')` here so we use unix timestamp=0
ENV BUILD_DATE="1970-01-01T00:00:00.00Z"
## We cannot do $(npm run version).${BUILD_NUMBER} here so we default to 0.0.0.0
ENV BUILD_VERSION="0.0.0.0"
## We cannot do `$(git rev-parse --short HEAD)` here so we default to 0000000
ENV BUILD_COMMIT="0000000"
ENV NODE_ENV="production"
## App relevant Envs
ENV PORT="3000"
## Bind on every interface: inside a container "localhost" is reachable by
## nothing but the container itself.
ENV HOST="0.0.0.0"

# Labels
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.name="webcraftmedia:gemeinschafts-atlas"
LABEL org.label-schema.description="Gemeinschafts-Atlas"
LABEL org.label-schema.usage="https://github.com/webcraftmedia/gemeinschafts-atlas.de/blob/master/README.md"
LABEL org.label-schema.url="https://github.com/webcraftmedia/gemeinschafts-atlas.de/"
LABEL org.label-schema.vcs-url="https://github.com/webcraftmedia/gemeinschafts-atlas.de/tree/master/"
LABEL org.label-schema.vcs-ref="${BUILD_COMMIT}"
LABEL org.label-schema.vendor="Webcraft-Media"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.schema-version="1.0"
LABEL maintainer="service@webcraft-media.de"

# Settings
## Expose Container Port
EXPOSE ${PORT}
## Vite's HMR websocket — development only, harmless in the other stages
EXPOSE 24678

## Workdir
RUN mkdir -p ${DOCKER_WORKDIR}
WORKDIR ${DOCKER_WORKDIR}

##################################################################################
# DEVELOPMENT (Connected to the local environment, to reload on demand) ##########
##################################################################################
FROM base AS development

ENV NODE_ENV="development"

# Nothing is copied or built here: the source comes in as a bind mount and would
# be shadowed anyway. node_modules and .nuxt live in their own volumes (see
# docker-compose.override.yml), so `npm install` has to run at start — on a warm
# volume that is a no-op, on a cold one it populates it.
#
# Why those volumes are not optional here: this project installs packages with
# native binaries (esbuild, unrs-resolver). The host is glibc, this image is
# musl — sharing one node_modules between them installs the wrong artifacts for
# one of the two, and the failure is a confusing "cannot find module" rather
# than anything that names the cause.
CMD ["/bin/sh", "-c", "npm install && npm run dev"]

##################################################################################
# BUILD (Does contain all files and is therefore bloated) ########################
##################################################################################
FROM base AS build

# Copy everything (see .dockerignore for what stays out)
COPY . .
# npm ci, not npm install: the lockfile is the input, and a build that quietly
# resolves something else than CI did is not the artifact anyone reviewed.
RUN npm ci --include=dev
RUN npm run build

##################################################################################
# PRODUCTION (Does contain only "binary"- and static-files to reduce image size) #
##################################################################################
FROM base AS production

# Only .output — and deliberately no npm install afterwards. Nitro emits a
# standalone bundle with its dependencies inlined; the runtime never looks at
# node_modules. Installing production deps here would add tens of megabytes
# that nothing loads. (This is the same reason .github/webhooks/deploy.sh does
# not use --omit=dev.)
COPY --from=build ${DOCKER_WORKDIR}/.output ./.output

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", ".output/server/index.mjs"]
