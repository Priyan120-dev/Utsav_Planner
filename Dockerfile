# Multi-Stage Production Dockerfile for Utsav Planner

# Stage 1: Build Shared, Server, and Client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifests and lockfiles
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies across workspaces
RUN npm install

# Copy source code
COPY shared ./shared
COPY server ./server
COPY client ./client

# Build packages in topological order
RUN npm run build --workspace=shared
RUN npm run build --workspace=server
RUN npm run build --workspace=client

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000
ENV GEMINI_MODEL=gemini-3.8-flash

# Copy root and server package files
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install production dependencies only
RUN npm install --omit=dev

# Copy compiled artifacts
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Expose API and web port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
