# Fat container: install all dependencies and build in a single stage
# Larger image size for maximum compatibility (includes dev dependencies)

FROM node:20

WORKDIR /app

# Copy manifests and install ALL deps (dev + prod)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy full project
COPY . .

# Build backend and frontend
RUN npm run build:backend && vite build || (echo "Build failed" && exit 1)

ENV NODE_ENV=production

# Install curl for healthcheck (Debian-based image)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "dist/api/app.js"]