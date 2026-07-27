FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src
COPY scripts ./scripts
COPY tsconfig.json ./

# SQLite state (tenants, orders, sessions) — mount a volume here.
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/bestb4u.db

# Fleet mode by default (father + flagship + tenants).
# For a single-tenant deployment override the command with: bun run start
CMD ["bun", "run", "src/fleet.ts"]
