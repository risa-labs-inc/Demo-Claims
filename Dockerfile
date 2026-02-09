# Dockerfile for Claims Dashboard Demo - Next.js on Cloud Run
# Build timestamp: 2026-02-09-v2
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat openssl python3 make g++

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy prisma schema
COPY prisma/schema.prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy all source files
COPY . .

# Run database migrations and seed
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma db push --accept-data-loss
RUN npx prisma db seed || echo "Seed completed or skipped"

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
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
ENV DATABASE_URL="file:./prisma/dev.db"
ENV NEXTAUTH_SECRET="demo-secret-key-for-claims-dashboard-2024"
ENV NEXTAUTH_URL="https://risa-claims-demo.web.app"
ENV NEXTAUTH_TRUST_HOST=true

EXPOSE 8080

CMD ["node", "server.js"]
