# Dockerfile for Claims Dashboard Demo - Next.js on Cloud Run
# Build timestamp: 2026-02-09-v2
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat openssl python3 make g++

# Copy package files and prisma schema (needed for postinstall prisma generate)
COPY package.json package-lock.json* ./
COPY prisma/schema.prisma ./prisma/

# Install dependencies (postinstall runs prisma generate)
RUN npm ci

# Copy all source files
COPY . .

# Build the application (DB migrations run at container startup, not build time)
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder@localhost/placeholder"
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built standalone app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy prisma files and database
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Environment variables
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"
ENV NEXTAUTH_TRUST_HOST=true
# DATABASE_URL, NEXTAUTH_SECRET, and NEXTAUTH_URL must be provided at runtime via environment variables

EXPOSE 8080

CMD ["node", "server.js"]
