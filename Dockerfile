# ---------------------------
# Build stage
# ---------------------------
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files
COPY agrisa_insurance_partner/package*.json agrisa_insurance_partner/bun.lock ./

# Install all dependencies (include devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source
COPY agrisa_insurance_partner .

# Build Next.js app
RUN bun run build

# ---------------------------
# Production stage
# ---------------------------
FROM oven/bun:1 AS runner

WORKDIR /app

# Copy only built app + node_modules
COPY --from=base /app ./

# Env vars
ENV BUN_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start"]
