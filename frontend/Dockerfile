# syntax=docker/dockerfile:1

# node:22-slim (glibc) rather than alpine: Rollup's native parser overflows musl's small stack.
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- test: `docker build --target test` then run ----
FROM deps AS test
COPY . .
CMD ["npm", "test"]

# ---- build: static bundle (contains no secrets; the browser only calls /api) ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- runtime: nginx serves the SPA and proxies /api to the backend ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
