# Storefront deploy image (DevOps infra).
# Stage 1: build the pre-rendered static site with Node (build.js -> dist/).
# Stage 2: serve dist/ with the official Caddy image (caddy binary
# guaranteed present at runtime — avoids the Nixpacks build/runtime
# stage mismatch that left the service unable to bind a port).
FROM node:20-slim AS build
# build.js reads process.env.NB_API_URL to bake the API base into the
# pre-rendered pages. Railway passes the service variable of the same
# name as a build arg when it is declared here; without this the build
# fell back to the hardcoded default and the storefront called the wrong API.
ARG NB_API_URL
ENV NB_API_URL=$NB_API_URL
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
