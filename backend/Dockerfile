# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend + serve frontend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 4000
CMD ["node", "src/index.js"]