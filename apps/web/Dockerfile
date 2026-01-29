# Build stage
FROM oven/bun:1 as builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lockb ./
COPY turbo.json ./

# Copy all packages and apps (needed for workspace dependencies)
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Build args for environment variables needed at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the packages and web app
RUN bun run build --filter=@open-sunsama/types --filter=@open-sunsama/utils --filter=@open-sunsama/api-client --filter=@open-sunsama/web

# Production stage - serve static files
FROM node:20-slim

WORKDIR /app

# Install serve for static file hosting
RUN npm install -g serve

# Copy built static files from builder
COPY --from=builder /app/apps/web/dist ./dist

# Expose port
ENV PORT=3000
EXPOSE 3000

# Start serve
CMD ["serve", "dist", "-s", "-l", "3000"]
