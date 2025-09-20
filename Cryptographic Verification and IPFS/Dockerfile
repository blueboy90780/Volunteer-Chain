# syntax=docker/dockerfile:1

# Lean Bun image for TypeScript + ESM runtime
FROM oven/bun:1.1.30-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile

# Copy source
COPY src ./src

ENV NODE_ENV=production

# Run the demo script (uses dotenv/env vars at runtime)
CMD ["bun", "run", "src/demo.ts"]
