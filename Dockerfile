# Use official Bun image
FROM oven/bun:1

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json bun.lock ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV BUN_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application using Bun
CMD ["bun", "dev"]