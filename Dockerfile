# Storefront deploy image (DevOps infra).
# Stage 1: build the pre-rendered static site with Node (build.js -> dist/).
# Stage 2: serve dist/ with the official Caddy image (caddy binary
# guaranteed present at runtime — avoids the Nixpacks build/runtime
# stage mismatch that left the service unable to bind a port).
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
